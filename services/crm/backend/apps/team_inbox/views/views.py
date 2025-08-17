import json
import base64
import requests
import traceback

from django.core.cache import cache

from django.http import JsonResponse
from datetime import datetime as dt_datetime, timezone as dt_timezone

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django_tenants.utils import schema_context

from rest_framework import viewsets, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response


from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


from ..services.gmail_service import GmailService
from ..models import TeamMember, Inbox, ChannelAccount, Tag, Message, Comment, Task, CalendarEvent, Conversation
from ..serializers import (
    TeamMemberSerializer, InboxSerializer, ChannelAccountSerializer,
    TagSerializer, MessageSerializer, CommentSerializer,
    TaskSerializer, CalendarEventSerializer, ConversationSerializer
)

from email.utils import getaddresses


from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import OrderingFilter, SearchFilter


User = get_user_model()

from ...core.models import TenantEmailMapping, Client  # adjust if needed

# ---------------- GMAIL PUSH NOTIFICATION HANDLER ---------------- #


def parse_email_subject_and_snippet(message):
    headers = message.get('payload', {}).get('headers', [])
    subject = next((h['value'] for h in headers if h.get('name', '').lower() == 'subject'), None)
    snippet = message.get('snippet', '')
    return subject, snippet


def parse_email_address(raw):
    name, email = getaddresses([raw])[0] if raw else ("", "")
    return {"name": name, "email": email}


def parse_email_list(raw):
    return [{"name": name, "email": email} for name, email in getaddresses([raw])] if raw else []


@api_view(["POST"])
@permission_classes([AllowAny])

def gmail_notify(request):
    try:
        print("🔔 Incoming Gmail notification webhook")

        envelope = json.loads(request.body)
        message = envelope.get("message", {})
        data = message.get("data")

        if not data:
            return JsonResponse({"error": "No message data"}, status=400)

        payload = json.loads(base64.urlsafe_b64decode(data).decode('utf-8'))
        incoming_history_id = payload.get("historyId")
        email = payload.get("emailAddress")

        print(f"📩 Gmail Notification for {email} with historyId {incoming_history_id}")

        cache_key = f"gmail_webhook_lock:{email}"
        if cache.get(cache_key):
            print("⚠️ Duplicate webhook received too soon. Skipping.")
            return JsonResponse({"status": "duplicate_skipped"})
        cache.set(cache_key, True, timeout=10)

        account = ChannelAccount.objects.get(identifier=email)
        tenant = get_tenant_for_email(email)
        if not tenant:
            return JsonResponse({"error": "Tenant not found for this email"}, status=404)

        with schema_context(tenant.schema_name):
            history_id = incoming_history_id or account.last_history_id
            if not history_id:
                print("⚠️ No valid history ID available. Skipping fetch.")
                return JsonResponse({"error": "Missing historyId"}, status=400)

            gmail = GmailService(account)
            messages, new_history_id = gmail.fetch_new_emails(history_id)
            print(f"📬 {len(messages)} new message(s) fetched")

            for i, msg in enumerate(messages, start=1):
                subject, snippet = parse_email_subject_and_snippet(msg)
                headers = {h['name']: h['value'] for h in msg['payload']['headers']}

                msg_id = headers.get("Message-ID", msg['id'])
                thread_id = msg.get("threadId")
                in_reply_to = headers.get("In-Reply-To")
                references = headers.get("References")

                from_email = parse_email_address(headers.get("From"))
                to = parse_email_list(headers.get("To"))
                cc = parse_email_list(headers.get("Cc"))
                bcc = parse_email_list(headers.get("Bcc"))
                reply_to = parse_email_list(headers.get("Reply-To"))

                received_at = int(msg.get("internalDate", 0)) / 1000.0
                timestamp = dt_datetime.fromtimestamp(received_at, tz=dt_timezone.utc)

                if Message.objects.filter(message_id=msg_id).exists():
                    print(f"⚠️ Message with ID {msg_id} already exists. Skipping.")
                    continue

                conversation, created = Conversation.objects.get_or_create(
                    thread_id=thread_id,
                    defaults={
                        "subject": subject or "(No Subject)",
                        "channel": account.provider,
                        "priority": "normal",
                        "status": "open",
                        "last_activity": timestamp,
                        "shared_inbox_id": account.inbox.id,
                    }
                )

                message = Message.objects.create(
                    conversation=conversation,
                    message_id=msg_id,
                    thread_id=thread_id,
                    in_reply_to=in_reply_to,
                    references=[r.strip() for r in references.split()] if references else None,
                    subject=subject or "(No Subject)",
                    from_email=from_email,
                    to=to,
                    cc=cc or None,
                    bcc=bcc or None,
                    reply_to=reply_to[0] if reply_to else None,
                    content=snippet,
                    html_content=None,
                    timestamp=timestamp,
                    inbox=account.inbox,
                    source='incoming',
                    priority='normal',
                )

                conversation.last_activity = timestamp
                conversation.last_message = message
                conversation.save(update_fields=["last_activity", "last_message"])

                # --- Broadcast ---
                try:
                    channel_layer = get_channel_layer()
                    group_name = f"tenant_{tenant.id}"

                    if created:
                        ws_payload = {
                            'type': 'new_conversation',
                            'message': {
                                'type': 'new_conversation',
                                'message': MessageSerializer(message).data,
                                'conversation': ConversationSerializer(conversation).data
                            }
                        }
                    else:
                        ws_payload = {
                            'type': 'new_message',
                            'message': {
                                'type': 'new_message',
                                'message': MessageSerializer(message).data,
                                'conversation': ConversationSerializer(conversation).data
                            }
                        }

                    print("📤 WebSocket payload:\n", json.dumps(ws_payload, indent=2))
                    async_to_sync(channel_layer.group_send)(group_name, ws_payload)
                    print(f"✅ [{i}] Message saved and broadcasted. {'(new conversation)' if created else '(reply)'}")

                except Exception:
                    print("WARN: broadcast failed")
                    traceback.print_exc()

            if new_history_id:
                account.last_history_id = new_history_id
                account.save(update_fields=["last_history_id"])
                print(f"🧱 Updated last_history_id to {new_history_id}")

        return JsonResponse({"status": "ok"})

    except Exception as e:
        print("❌ Error in gmail_notify:", str(e))
        return JsonResponse({"error": str(e)}, status=500)



def get_tenant_for_email(email: str):
    with schema_context("public"):
        mapping = TenantEmailMapping.objects.filter(email=email).first()
        if mapping and mapping.tenant:
            return mapping.tenant
    return None

def refresh_access_token(channel_account):
    """
    Refresh the Gmail OAuth access token using the refresh token.
    """
    response = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "refresh_token": channel_account.refresh_token,
        "grant_type": "refresh_token",
    })
    token_data = response.json()
    if "access_token" in token_data:
        channel_account.access_token = token_data["access_token"]
        channel_account.expires_in = token_data.get("expires_in", 3600)
        channel_account.token_acquired_at = timezone.now()
        channel_account.save()
    return channel_account.access_token

# ---------------- VIEWSETS ---------------- #

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]


# class InboxViewSet(viewsets.ModelViewSet):
#     queryset = Inbox.objects.all()
#     serializer_class = InboxSerializer
#     permission_classes = [permissions.IsAuthenticated]

class InboxViewSet(viewsets.ModelViewSet):
    queryset = Inbox.objects.all()
    serializer_class = InboxSerializer

    @action(detail=False, methods=['get', 'post'], url_path='sharedinbox')
    def shared_inbox(self, request):
        if request.method == 'GET':
            inboxes = self.get_queryset().prefetch_related("channels")
            serializer = self.get_serializer(inboxes, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)



class ChannelAccountViewSet(viewsets.ModelViewSet):
    queryset = ChannelAccount.objects.all()
    serializer_class = ChannelAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_token_expired():
            refresh_access_token(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]


class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    


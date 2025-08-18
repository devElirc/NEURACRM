import json
import base64
import requests
import traceback

from django.core.cache import cache

from django.http import JsonResponse, HttpResponse

from datetime import datetime as dt_datetime, timezone as dt_timezone

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django.views.decorators.csrf import csrf_exempt

from django_tenants.utils import schema_context

from rest_framework import viewsets, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response


from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync



from ..services.gmail_service import GmailService
from ..services.outlook_service import OutlookService

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


@csrf_exempt
# def outlook_notify(request):
#     """
#     Webhook endpoint for Microsoft Graph notifications (Outlook)
#     """
#     try:
#         # 1️⃣ Webhook validation handshake (Microsoft Graph calls GET with ?validationToken=...)
#         validation_token = request.GET.get("validationToken")
#         if validation_token:
#             print(f"🔑 Validation token received: {validation_token}")
#             # Must return raw token with 200 OK
#             return HttpResponse(validation_token, content_type="text/plain", status=200)

#         # 2️⃣ Handle notifications (Graph will POST JSON when new mail arrives)
#         if request.method == "POST":
#             body = json.loads(request.body.decode("utf-8"))
#             print(f"📩 Incoming Outlook notification: {json.dumps(body, indent=2)}")

#             notifications = body.get("value", [])
#             for notif in notifications:
#                 subscription_id = notif.get("subscriptionId")
#                 resource = notif.get("resource")
#                 message_id = resource.split("/")[-1] if resource else None

#                 # Find channel account
#                 try:
#                     channel = ChannelAccount.objects.get(subscription_id=subscription_id)
#                 except ChannelAccount.DoesNotExist:
#                     print(f"⚠️ No channel found for subscription {subscription_id}")
#                     continue

#                 # Fetch the mail
#                 service = OutlookService(channel)
#                 msg = service.get_message(message_id)

#                 if msg:
#                     sender = msg.get("from", {}).get("emailAddress", {}).get("address")
#                     subject = msg.get("subject")
#                     print(f"✅ New Outlook mail: '{subject}' from {sender}")

#                     # TODO: Save message to DB (Message model)

#             return JsonResponse({"status": "ok"})

#         return JsonResponse({"error": "Method not allowed"}, status=405)

#     except Exception as e:
#         print(f"❌ Error in outlook_notify: {e}")
#         traceback.print_exc()
#         return JsonResponse({"error": "server error"}, status=500)

def outlook_notify(request):
    """
    Webhook endpoint for Microsoft Graph notifications (Outlook)
    Mirrors gmail_notify semantics so serializers receive the same shapes.
    """
    try:
        # 1) Validation handshake (Graph challenge)
        validation_token = request.GET.get("validationToken")
        if validation_token:
            print(f"🔑 Validation token received: {validation_token}")
            return HttpResponse(validation_token, content_type="text/plain", status=200)

        # Must be POST for notifications
        if request.method != "POST":
            return JsonResponse({"error": "Method not allowed"}, status=405)

        body = json.loads(request.body.decode("utf-8"))
        print(f"📩 Incoming Outlook notification: {json.dumps(body, indent=2)}")

        notifications = body.get("value", [])
        for notif in notifications:
            subscription_id = notif.get("subscriptionId")
            resource = notif.get("resource")
            message_id = resource.split("/")[-1] if resource else None

            if not subscription_id or not message_id:
                print("⚠️ Invalid notification payload, skipping.")
                continue

            # 🔒 Deduplication lock
            cache_key = f"outlook_webhook_lock:{subscription_id}:{message_id}"
            if cache.get(cache_key):
                print("⚠️ Duplicate webhook received too soon. Skipping.")
                continue
            cache.set(cache_key, True, timeout=10)

            # Account lookup
            try:
                account = ChannelAccount.objects.get(subscription_id=subscription_id)
            except ChannelAccount.DoesNotExist:
                print(f"⚠️ No channel found for subscription {subscription_id}")
                continue

            tenant = get_tenant_for_email(account.identifier)
            if not tenant:
                print(f"❌ Tenant not found for {account.identifier}")
                continue

            with schema_context(tenant.schema_name):
                service = OutlookService(account)
                msg = service.get_message(message_id)
                if not msg:
                    print(f"⚠️ Could not fetch message {message_id}")
                    continue

                # ---------- Helpers (Gmail-compatible shapes) ----------
                def as_email_obj(email: str | None, name: str | None = None):
                    if not email:
                        return None
                    return {"email": email, "name": name}

                def normalize_recipient_list(recips):
                    """Outlook -> [{'email': str, 'name': str|None}, ...]"""
                    out = []
                    if not recips:
                        return out
                    for r in recips:
                        ea = r.get("emailAddress", {}) or {}
                        email = ea.get("address")
                        name = ea.get("name")
                        if email:
                            out.append({"email": email, "name": name})
                    return out

                def parse_iso(iso_str):
                    if not iso_str:
                        return dt_datetime.now(tz=dt_timezone.utc)
                    # Graph: '2025-08-18T09:30:00Z' or with offset
                    try:
                        return dt_datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
                    except Exception:
                        return dt_datetime.now(tz=dt_timezone.utc)

                # ---------- Extract core fields ----------
                from_ea = (msg.get("from") or {}).get("emailAddress") or {}
                from_email = from_ea.get("address")
                from_name = from_ea.get("name")

                to_list = normalize_recipient_list(msg.get("toRecipients", []))
                cc_list = normalize_recipient_list(msg.get("ccRecipients", []))
                reply_to_list = normalize_recipient_list(msg.get("replyTo", []))

                subject = msg.get("subject") or "(No Subject)"
                timestamp = parse_iso(msg.get("receivedDateTime"))

                # Prefer the globally-unique Internet Message ID
                internet_message_id = msg.get("internetMessageId") or message_id
                thread_id = msg.get("conversationId")

                # Optional: headers for reply threading
                headers = {}
                try:
                    # Only present if your OutlookService(get_message) requests headers
                    # via $select=internetMessageHeaders or $expand
                    for h in msg.get("internetMessageHeaders", []) or []:
                        name = h.get("name")
                        value = h.get("value")
                        if name:
                            headers[name] = value
                except Exception:
                    # Non-fatal if headers absent
                    pass

                in_reply_to = headers.get("In-Reply-To")
                references_raw = headers.get("References")
                references = [r.strip() for r in references_raw.split()] if references_raw else None

                # De-dupe by message_id
                if Message.objects.filter(message_id=internet_message_id).exists():
                    print(f"⚠️ Message with ID {internet_message_id} already exists. Skipping.")
                    continue

                # ---------- Conversation upsert ----------
                conversation, created = Conversation.objects.get_or_create(
                    thread_id=thread_id,
                    defaults={
                        "subject": subject,
                        "channel": account.provider,  # 'outlook'
                        "priority": "normal",
                        "status": "open",
                        "last_activity": timestamp,
                        "shared_inbox_id": account.inbox.id,
                    }
                )

                # ---------- Persist message (shapes aligned to Gmail) ----------
                # NOTE:
                # - to/cc/bcc stored as list of {'email','name'} dicts (Gmail-style)
                # - reply_to stored as a single string email (Gmail code does this)
                # - from_email kept as string (matches many schemas); if your serializer
                #   expects object, swap to as_email_obj(from_email, from_name)
                message = Message.objects.create(
                    conversation=conversation,
                    message_id=internet_message_id,
                    thread_id=thread_id,
                    in_reply_to=in_reply_to,
                    references=references,
                    subject=subject,
                    from_email=from_email,  # change to as_email_obj(from_email, from_name) if needed
                    to=to_list,
                    cc=cc_list or None,
                    bcc=None,  # Graph doesn't expose BCC
                    reply_to=(reply_to_list[0]["email"] if reply_to_list else None),
                    content=msg.get("bodyPreview", "") or "",
                    html_content=((msg.get("body") or {}).get("content")),
                    timestamp=timestamp,
                    inbox=account.inbox,
                    source="incoming",
                    priority="normal",
                )

                # Update conversation rollups
                conversation.last_activity = timestamp
                conversation.last_message = message
                conversation.save(update_fields=["last_activity", "last_message"])

                # ---------- Broadcast over WS ----------
                try:
                    channel_layer = get_channel_layer()
                    group_name = f"tenant_{tenant.id}"

                    if created:
                        ws_payload = {
                            "type": "new_conversation",
                            "message": {
                                "type": "new_conversation",
                                "message": MessageSerializer(message).data,
                                "conversation": ConversationSerializer(conversation).data,
                            },
                        }
                    else:
                        ws_payload = {
                            "type": "new_message",
                            "message": {
                                "type": "new_message",
                                "message": MessageSerializer(message).data,
                                "conversation": ConversationSerializer(conversation).data,
                            },
                        }

                    print("📤 WebSocket payload:\n", json.dumps(ws_payload, indent=2))
                    async_to_sync(channel_layer.group_send)(group_name, ws_payload)
                    print(f"✅ Message saved and broadcasted. {'(new conversation)' if created else '(reply)'}")

                except Exception:
                    print("WARN: broadcast failed")
                    traceback.print_exc()

        return JsonResponse({"status": "ok"})

    except Exception as e:
        print(f"❌ Error in outlook_notify: {e}")
        traceback.print_exc()
        return JsonResponse({"error": "server error"}, status=500)


# ---------------- VIEWSETS ---------------- #

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]


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
    


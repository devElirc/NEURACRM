import json
import base64
import requests
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from datetime import timezone as dt_timezone

from ..services.gmail_service import GmailService
from ..models import TeamMember, Inbox, ChannelAccount, Tag, Message, Comment, Task, CalendarEvent
from ..serializers import (
    TeamMemberSerializer, InboxSerializer, ChannelAccountSerializer,
    TagSerializer, MessageSerializer, CommentSerializer,
    TaskSerializer, CalendarEventSerializer
)



User = get_user_model()

from django_tenants.utils import schema_context
from ...core.models import TenantEmailMapping, Client  # adjust if needed

# ---------------- GMAIL PUSH NOTIFICATION HANDLER ---------------- #

@api_view(["POST"])
@permission_classes([AllowAny])


# def notify_team_members(inbox, subject, snippet):
#     for member in inbox.teammember_set.all():
#         # Replace with real notification logic (email, socket, webhook, etc.)
#         print(f"📨 Notify {member.user.email} -> {subject}: {snippet[:60]}")

def gmail_notify(request):
    try:
        print("🔔 Incoming Gmail notification webhook")
        

        envelope = json.loads(request.body)
        print("📦 Envelope parsed:", envelope)

        message = envelope.get("message", {})
        data = message.get("data")

        if not data:
            print("⚠️ No message data in envelope")
            return JsonResponse({"error": "No message data"}, status=400)

        payload = json.loads(base64.urlsafe_b64decode(data))
        history_id = payload.get("historyId")
        email = payload.get("emailAddress")
        
        

        print(f"📩 Gmail Notification for {email} with historyId {history_id}")
        print("🔍 Switching to tenant schema...")
        
        # with schema_context("public"):
        #     try:
        #         mapping = TenantEmailMapping.objects.get(email=email)
        #         tenant = mapping.tenant
        #         print("🏢 Found tenant:", tenant.schema_name)
        #     except TenantEmailMapping.DoesNotExist:
        #         print("❌ No tenant mapping for this email")
        #         return JsonResponse({"error": "No tenant mapping for this email"}, status=404)


        with schema_context("main"):  # TODO: dynamic schema from email
        # with schema_context(tenant.schema_name):
            account = ChannelAccount.objects.get(email=email)
            print("✅ Found ChannelAccount:", account)

            gmail = GmailService(account)
            messages = gmail.fetch_new_emails(history_id)

            print(f"📬 {len(messages)} new message(s) fetched")

        for i, msg in enumerate(messages, start=1):
            subject, snippet = parse_email_subject_and_snippet(msg)
            headers = {h['name']: h['value'] for h in msg['payload']['headers']}
            sender = headers.get("From", "")
            recipient = headers.get("To", "")
            received_at = int(msg.get("internalDate", 0)) / 1000.0  # Gmail timestamp in ms

            print(f"✉️ [{i}] Subject: {subject}")
            print(f"📝 Snippet: {snippet[:100]}")

            # Check if message already exists
            if not Message.objects.filter(message_id=msg['id']).exists():
                message = Message.objects.create(
                    message_id=msg['id'],
                    subject=subject,
                    sender=sender,
                    recipient=recipient,
                    body=snippet,
                    received_at=timezone.now(),
                    inbox=account.inbox
                )

                # ✅ Broadcast to WebSocket group
                # group_name = f'inbox_{tenant.id}'  # or use tenant.id directly if available
                # print(f"group_name: {group_name}")
                
                group_name = f'inbox_2'  # or use tenant.id directly if available
                print(f"group_name: {group_name}")
                
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'inbox_message',
                        'message': {
                            'id': str(message.id),
                            'subject': message.subject,
                            'sender': message.sender,
                            'body': message.body[:100],
                        }
                    }
                )

                print(f"📢 WebSocket broadcast sent to group {group_name}")

            else:
                print(f"⚠️ Message with ID {msg['id']} already exists. Skipping insert.")



        print("✅ All messages saved successfully")
        return JsonResponse({"status": "ok"})

    except Exception as e:
        print("❌ Error in gmail_notify:", str(e))
        return JsonResponse({"error": str(e)}, status=500)


def parse_email_subject_and_snippet(message):
    """
    Extracts the Subject and snippet from Gmail message.
    """
    headers = message.get('payload', {}).get('headers', [])
    subject = next((h['value'] for h in headers if h.get('name', '').lower() == 'subject'), None)
    snippet = message.get('snippet', '')
    return subject, snippet


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


class InboxViewSet(viewsets.ModelViewSet):
    queryset = Inbox.objects.all()
    serializer_class = InboxSerializer
    permission_classes = [permissions.IsAuthenticated]


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


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.all()

        inbox_id = self.request.query_params.get('inbox')
        if inbox_id:
            qs = qs.filter(inbox_id=inbox_id)

        assigned_to_me = self.request.query_params.get('assigned_to_me')
        if assigned_to_me == 'true':
            qs = qs.filter(assigned_to=user)

        return qs


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
    
    

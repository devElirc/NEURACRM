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
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from .models import TeamMember, Inbox, ChannelAccount, Tag, Message, Comment, Task, CalendarEvent
from .serializers import (
    TeamMemberSerializer, InboxSerializer, ChannelAccountSerializer,
    TagSerializer, MessageSerializer, CommentSerializer,
    TaskSerializer, CalendarEventSerializer
)

User = get_user_model()

from django_tenants.utils import schema_context
# ---------------- GOOGLE OAUTH CALLBACK ---------------- #

@api_view(["POST"])
@permission_classes([AllowAny])
# def google_callback(request):
#     """
#     Google OAuth callback to exchange code for tokens,
#     create Inbox & ChannelAccount, and start Gmail Watch.
#     """
#     try:
#         body = json.loads(request.body)
#         code = body.get("code")
#         inbox_name = body.get("inbox_name")  # e.g. "Support"
#         if not code or not inbox_name:
#             return JsonResponse({"error": "Missing code or inbox_name"}, status=400)

#         # Exchange code for tokens
#         token_response = requests.post("https://oauth2.googleapis.com/token", data={
#             "code": code,
#             "client_id": settings.GOOGLE_CLIENT_ID,
#             "client_secret": settings.GOOGLE_CLIENT_SECRET,
#             "redirect_uri": "http://localhost:3000/google-callback.html",
#             "grant_type": "authorization_code",
#         })
#         token_data = token_response.json()

#         access_token = token_data.get("access_token")
#         refresh_token = token_data.get("refresh_token")
#         expires_in = token_data.get("expires_in")

#         if not access_token or not refresh_token:
#             return JsonResponse({"error": "Token exchange failed", "details": token_data}, status=400)

#         # Fetch user email
#         userinfo_response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
#             "Authorization": f"Bearer {access_token}"
#         })
#         userinfo = userinfo_response.json()
#         email = userinfo.get("email")
#         if not email:
#             return JsonResponse({"error": "Email not found", "userinfo": userinfo}, status=400)

#         # Create or get Inbox
#         inbox, _ = Inbox.objects.get_or_create(
#             email=email,
#             defaults={"name": inbox_name}
#         )

#         # Create or update ChannelAccount linked to inbox
#         channel_account, _ = ChannelAccount.objects.update_or_create(
#             email=email,
#             defaults={
#                 "provider": "gmail",
#                 "access_token": access_token,
#                 "refresh_token": refresh_token,
#                 "expires_in": expires_in,
#                 "token_acquired_at": timezone.now(),
#                 "inbox": inbox
#             }
#         )

#         # Start Gmail Watch to get push notifications
#         watch_response = start_gmail_watch(channel_account)
#         print("Gmail watch response:", watch_response)

#         return JsonResponse({"email": email, "inbox_id": str(inbox.id)})

#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500)

def google_callback(request):
    """
    Google OAuth callback to exchange code for tokens,
    create Inbox & ChannelAccount, and start Gmail Watch.
    All within main's schema.
    """
    try:
        body = json.loads(request.body)
        code = body.get("code")
        inbox_name = body.get("inbox_name")

        if not code or not inbox_name:
            return JsonResponse({"error": "Missing code or inbox_name"}, status=400)

        # Exchange code for tokens
        token_response = requests.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": "http://localhost:3000/google-callback.html",
            "grant_type": "authorization_code",
        })

        token_data = token_response.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in")

        if not access_token or not refresh_token:
            return JsonResponse({"error": "Token exchange failed", "details": token_data}, status=400)

        # Fetch user's email
        userinfo_response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        userinfo = userinfo_response.json()
        email = userinfo.get("email")

        if not email:
            return JsonResponse({"error": "Email not found", "userinfo": userinfo}, status=400)

        with schema_context('main'):
            inbox, _ = Inbox.objects.get_or_create(email=email, defaults={"name": inbox_name})

            channel_account, _ = ChannelAccount.objects.update_or_create(
                email=email,
                defaults={
                    "provider": "gmail",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_in": expires_in,
                    "token_acquired_at": timezone.now(),
                    "inbox": inbox
                }
            )

            # Start watch and save historyId
            watch_response = start_gmail_watch(channel_account)
            print("Gmail watch response:", watch_response)

            history_id = watch_response.get("historyId")
            if history_id:
                channel_account.last_history_id = history_id
                channel_account.save()
            else:
                print("⚠️ No historyId returned by Gmail watch.")

            return JsonResponse({
                "email": email,
                "inbox_id": str(inbox.id),
                "tenant": "main"
            })

    except Exception as e:
        print("❌ Error in google_callback:", str(e))
        return JsonResponse({"error": str(e)}, status=500)



# def start_gmail_watch(channel_account):
#     """
#     Calls Gmail API to start watching inbox for changes.
#     """
#     url = "https://gmail.googleapis.com/gmail/v1/users/me/watch"
#     headers = {
#         "Authorization": f"Bearer {channel_account.access_token}",
#         "Content-Type": "application/json"
#     }
#     data = {
#         "labelIds": ["INBOX"],
#         "topicName": "projects/teaminboxproject/topics/gmail-inbox-events"
#     }

#     print("📡 Sending Gmail watch request...")
#     try:
#         response = requests.post(url, headers=headers, json=data)
#         if response.status_code != 200:
#             print("❌ Error Response Body:", response.text)
#         return response.json()
#     except requests.RequestException as e:
#         print("❌ Network error:", str(e))
#         return {"error": str(e)}

def start_gmail_watch(channel_account):
    """
    Calls Gmail API to start watching inbox for changes.
    """
    url = "https://gmail.googleapis.com/gmail/v1/users/me/watch"
    headers = {
        "Authorization": f"Bearer {channel_account.access_token}",
        "Content-Type": "application/json"
    }
    data = {
        "labelIds": ["INBOX"],
        "topicName": "projects/teaminboxproject/topics/gmail-inbox-events"
    }

    print("📡 Sending Gmail watch request...")
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 200:
            print("❌ Error Response Body:", response.text)
        return response.json()
    except requests.RequestException as e:
        print("❌ Network error:", str(e))
        return {"error": str(e)}


# ---------------- GMAIL PUSH NOTIFICATION HANDLER ---------------- #

@api_view(["POST"])
@permission_classes([AllowAny])
def gmail_notify(request):
    """
    Webhook endpoint for Gmail push notifications via Pub/Sub.
    Parses message, fetches new emails since historyId, and logs them.
    """
    try:
        print("📩 Gmail Pub/Sub Notification Received")

        envelope = json.loads(request.body)
        message = envelope.get("message", {})
        encoded_message = message.get("data")

        if not encoded_message:
            return JsonResponse({"error": "No message data"}, status=400)

        decoded_bytes = base64.urlsafe_b64decode(encoded_message)
        message_data = json.loads(decoded_bytes)

        history_id = message_data.get("historyId")
        email_address = message_data.get("emailAddress")

        print(f"✅ Gmail historyId received: {history_id}")
        print(f"📧 For email address: {email_address}")

        # TODO: Fetch channel account using email address
        channel_account = ChannelAccount.objects.get(email=email_address)

        # TODO: Fetch new emails from Gmail API using historyId
        credentials = Credentials(token=channel_account.access_token, refresh_token=channel_account.refresh_token, client_id=settings.GOOGLE_CLIENT_ID, client_secret=settings.GOOGLE_CLIENT_SECRET, token_uri="https://oauth2.googleapis.com/token")
        emails = fetch_new_emails(history_id, credentials)
        print(f"📧 new email: {emails}")

        return JsonResponse({"status": "ok"})

    except Exception as e:
        print("❌ Exception:", str(e))
        return JsonResponse({"error": str(e)}, status=500)


# def fetch_new_emails(history_id, credentials):
#     """
#     Fetches newly added emails since history_id using Gmail API.
#     """
#     service = build('gmail', 'v1', credentials=credentials)
#     messages = []

#     try:
#         history_response = service.users().history().list(
#             userId='me',
#             startHistoryId=history_id,
#             historyTypes=['messageAdded']
#         ).execute()

#         for record in history_response.get('history', []):
#             for msg in record.get('messages', []):
#                 messages.append(msg['id'])

#         full_messages = []
#         for msg_id in messages:
#             msg = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
#             full_messages.append(msg)

#         return full_messages

#     except Exception as e:
#         print(f"❌ Error fetching history: {e}")
#         return []

def fetch_new_emails(history_id, credentials):
    """
    Fetches newly added emails since history_id using Gmail API.
    """
    print(f"📜 Fetching from history ID: {history_id}")
    service = build('gmail', 'v1', credentials=credentials)
    full_messages = []
    page_token = None

    try:
        while True:
            history_response = service.users().history().list(
                userId='me',
                startHistoryId=history_id,
                historyTypes=['messageAdded'],
                pageToken=page_token
            ).execute()

            print("📖 History response:", json.dumps(history_response, indent=2))

            for record in history_response.get('history', []):
                for msg in record.get('messages', []):
                    msg_data = service.users().messages().get(
                        userId='me',
                        id=msg['id'],
                        format='full'
                    ).execute()
                    full_messages.append(msg_data)

            page_token = history_response.get('nextPageToken')
            if not page_token:
                break

        return full_messages

    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        return []



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

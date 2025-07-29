import requests
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from django_tenants.utils import tenant_context
from django.db import connection
from django.core.files.base import ContentFile
from django.conf import settings

from apps.core.models import Client, User
from apps.team_inbox.models import Message, Tag, Comment, Inbox, Task, CalendarEvent




from .serializers import (
    MessageSerializer,
    TagSerializer,
    CommentSerializer,
    InboxSerializer,
    TaskSerializer,
    CalendarEventSerializer,
)

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import re
import traceback
import base64
import json
import os

# SMTP Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "mail.ralakde.co.uk")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "teams@ralakde.com")
SMTP_PASS = os.getenv("SMTP_PASS", "Ralakde123")

TenantModel = Client
GlobalUser = User


def get_user_role(user, tenant):
    from apps.core.models import UserRole  # Lazy import
    return UserRole.objects.filter(user=user, tenant=tenant).first()


def schema_exists(schema_name):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1 FROM pg_namespace WHERE nspname = %s;", [schema_name])
        return cursor.fetchone() is not None


# ------------------------------
# Gmail OAuth Callback (Refactored)
# ------------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def google_callback(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("<script>window.opener.postMessage('google_failed','*');window.close();</script>")

    # Step 1: Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://127.0.0.1:8000/api/inbox/auth/google/callback",
        "grant_type": "authorization_code",
    }
    token_data = requests.post(token_url, data=data).json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    if not access_token:
        return HttpResponse("<script>window.opener.postMessage('google_failed','*');window.close();</script>")

    # Step 2: Get user email
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()
    email = userinfo.get("email", "")

    # # Step 3: Save email + tokens in DB (example model: ChannelAccount)
    # from inbox.models import ChannelAccount

    # ChannelAccount.objects.update_or_create(
    #     email=email,
    #     defaults={
    #         "provider": "gmail",
    #         "access_token": access_token,
    #         "refresh_token": refresh_token,
    #         "token_expires_in": token_data.get("expires_in"),
    #     }
    # )

    # Step 4: Notify parent window and close
    return HttpResponse(f"""
        <script>
          window.opener.postMessage({{
            status: "google_connected",
            email: "{email}"
          }}, "*");
          window.close();
        </script>
    """)


# ------------------------------
# Message ViewSet (tenant scoped)
# ------------------------------
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        schema_name = self.request.tenant.schema_name
        with tenant_context(schema_name):
            user_role = get_user_role(self.request.user, self.request.tenant)
            qs = Message.objects.all()
            if user_role and user_role.role == "agent":
                qs = qs.filter(assigned_to=self.request.user) | qs.filter(inbox__is_shared=True)
            elif user_role and user_role.role == "collaborator":
                qs = qs.filter(assigned_to=self.request.user, is_read=True)
            return qs

    def send_email(self, from_email, to_email, subject, plain_body, html_body=None, cc=None, bcc=None, attachments=None):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_email} via TeamInbox <{SMTP_USER}>"
        msg["Reply-To"] = from_email
        msg["To"] = ", ".join(to_email)

        if cc:
            msg["Cc"] = ", ".join(cc)

        msg.attach(MIMEText(plain_body or "", "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        if attachments:
            for file in attachments:
                msg.attach(file)

        recipients = to_email + (cc or []) + (bcc or [])

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, recipients, msg.as_string())

    def save_message(self, request, data):
        schema_name = self.request.tenant.schema_name
        with tenant_context(schema_name):
            message = Message.objects.create(
                sender=request.user.email,
                recipient=data.get("to"),
                cc=data.get("cc", []),
                bcc=data.get("bcc", []),
                subject=data.get("subject", ""),
                body=data.get("plain_body", ""),
                html=data.get("html_body", ""),
                direction="outgoing",
                assigned_to=request.user,
                is_read=True,
            )
            for file_data in data.get("attachments", []):
                decoded_file = ContentFile(base64.b64decode(file_data["data"]), name=file_data["name"])
                message.attachments.create(file=decoded_file)
            return message

    @action(detail=False, methods=["post"])
    def send_message(self, request):
        data = request.data
        to = json.loads(data.get("to", "[]")) if isinstance(data.get("to"), str) else data.get("to", [])
        cc = json.loads(data.get("cc", "[]")) if isinstance(data.get("cc"), str) else data.get("cc", [])
        bcc = json.loads(data.get("bcc", "[]")) if isinstance(data.get("bcc"), str) else data.get("bcc", [])

        required = ["subject", "plain_body"]
        if not to or not all(field in data for field in required):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from_email = request.user.email
            self.send_email(
                from_email=from_email,
                to_email=to,
                subject=data["subject"],
                plain_body=data["plain_body"],
                html_body=data.get("html_body"),
                cc=cc,
                bcc=bcc,
                attachments=[],
            )
            return Response({"status": "sent", "message_id": ""}, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        message = self.get_object()
        body = request.data.get("body", "")
        try:
            self.send_email(
                from_email=request.user.email,
                to_email=message.sender,
                subject=f"Re: {message.subject}",
                plain_body=body
            )
            return Response({"status": "replied"}, status=status.HTTP_200_OK)
        except smtplib.SMTPException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["post"])
    def forward(self, request, pk=None):
        message = self.get_object()
        recipient = request.data.get("recipient")
        if not recipient:
            return Response({"error": "Recipient is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            self.send_email(
                from_email=request.user.email,
                to_email=recipient,
                subject=f"Fwd: {message.subject}",
                plain_body=message.body,
                html_body=message.html
            )
            return Response({"status": "forwarded"}, status=status.HTTP_200_OK)
        except smtplib.SMTPException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["post"])
    def mark_unread(self, request, pk=None):
        message = self.get_object()
        message.is_read = False
        message.save()
        return Response({"status": "marked unread"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def snooze(self, request, pk=None):
        message = self.get_object()
        snooze_until = request.data.get("snooze_until")
        if not snooze_until:
            return Response({"error": "snooze_until is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            message.snooze_until = datetime.datetime.fromisoformat(snooze_until)
            message.save()
            return Response({"status": "snoozed"}, status=status.HTTP_200_OK)
        except ValueError:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        message = self.get_object()
        message.is_archived = True
        message.save()
        return Response({"status": "archived"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def delete(self, request, pk=None):
        message = self.get_object()
        message.delete()
        return Response({"status": "deleted"}, status=status.HTTP_200_OK)


# ------------------------------
# Other ViewSets (Tenant Scoped)
# ------------------------------
class TenantModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        schema_name = self.request.tenant.schema_name
        with tenant_context(schema_name):
            return self.queryset.all()


class TagViewSet(TenantModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class CommentViewSet(TenantModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer


class InboxViewSet(TenantModelViewSet):
    queryset = Inbox.objects.all()
    serializer_class = InboxSerializer


class TaskViewSet(TenantModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class CalendarEventViewSet(TenantModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer

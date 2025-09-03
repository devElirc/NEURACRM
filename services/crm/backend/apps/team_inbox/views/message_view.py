import os
import smtplib
import uuid
import traceback
import markdown
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django_tenants.utils import schema_context
from contextlib import nullcontext

from ..models import ChannelAccount, Message, Conversation
from ..serializers import MessageSerializer, ConversationSerializer

User = get_user_model()

# SMTP Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "mail.ralakde.co.uk")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "teams@ralakde.com")
SMTP_PASS = os.getenv("SMTP_PASS", "Ralakde123")


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['is_read', 'priority', 'source', 'inbox']
    ordering_fields = ['timestamp', 'created_at', 'received_at']
    ordering = ['-created_at']
    search_fields = ['subject', 'from_email', 'to', 'content']

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.select_related(
            'inbox', 'assigned_to', 'conversation'
        ).prefetch_related(
            'attachments', 'labels', 'internal_notes'
        )

        inbox_id = self.request.query_params.get('inbox')
        if inbox_id:
            qs = qs.filter(inbox_id=inbox_id)

        if self.request.query_params.get('assigned_to_me') == 'true':
            qs = qs.filter(assigned_to=user)

        return qs

    def send_email_smtp(
        self, from_email, to_email, subject,
        plain_body=None, html_body=None,
        cc=None, bcc=None, attachments=None,
        in_reply_to=None, references=None
    ):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_email} via TeamInbox <{SMTP_USER}>"
        msg["Reply-To"] = from_email
        msg["To"] = ", ".join(to_email) if isinstance(to_email, list) else to_email

        if cc:
            msg["Cc"] = ", ".join(cc)

        message_id = f"<{uuid.uuid4().hex}@{SMTP_USER.split('@')[-1]}>"
        msg["Message-ID"] = message_id

        if in_reply_to:
            msg["In-Reply-To"] = in_reply_to
        if references:
            msg["References"] = " ".join(references) if isinstance(references, list) else references

        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))

        if html_body:
            html_body_clean = markdown.markdown(html_body, extensions=["extra", "nl2br"])
        elif plain_body:
            html_body_clean = markdown.markdown(plain_body, extensions=["extra", "nl2br"])
        else:
            html_body_clean = ""

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; font-size:14px; line-height:1.5; color:#111;">
                {html_body_clean}
            </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        recipients = []
        recipients.extend(to_email if isinstance(to_email, list) else [to_email])
        if cc:
            recipients.extend(cc)
        if bcc:
            recipients.extend(bcc)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, recipients, msg.as_string())

        return message_id

    def create(self, request, *args, **kwargs):
        data = request.data
        subject = data.get("subject") or "(No Subject)"
        from_email = data.get("from_", {}).get("email")
        tenant = getattr(request, "tenant", None)
        tenant_schema = getattr(tenant, "schema_name", None)

        try:
            account = ChannelAccount.objects.get(identifier=from_email)
        except ObjectDoesNotExist:
            return Response({"error": "ChannelAccount not found"}, status=status.HTTP_404_NOT_FOUND)

        to_emails = [t.get("email") for t in data.get("to", []) if "email" in t]
        cc_emails = [t.get("email") for t in data.get("cc", []) if "email" in t]
        bcc_emails = [t.get("email") for t in data.get("bcc", []) if "email" in t]

        plain_body = data.get("content", "")
        html_body = data.get("htmlContent", plain_body)

        in_reply_to = data.get("in_reply_to")
        references = data.get("references", [])
        thread_id = data.get("threadId")

        try:
            new_message_id = self.send_email_smtp(
                from_email=from_email,
                to_email=to_emails,
                subject=subject,
                plain_body=plain_body,
                html_body=html_body,
                cc=cc_emails,
                bcc=bcc_emails,
                attachments=None,
                in_reply_to=in_reply_to,
                references=references,
            )
        except Exception as e:
            traceback.print_exc()
            return Response({"error": f"SMTP send failed: {str(e)}"}, status=500)

        participants = []
        seen = set()
        for p in [data.get("from_")] + data.get("to", []) + data.get("cc", []) + data.get("bcc", []):
            if p and p.get("email") not in seen:
                participants.append(p)
                seen.add(p["email"])

        conversation = None
        if thread_id:
            conversation = Conversation.objects.filter(thread_id=thread_id).first()
        if not conversation and in_reply_to:
            parent_msg = Message.objects.filter(message_id=in_reply_to).first()
            if parent_msg:
                conversation = parent_msg.conversation

        if not conversation:
            conversation = Conversation.objects.create(
                subject=subject,
                thread_id=thread_id or str(uuid.uuid4()),
                shared_inbox_id=account.inbox.id,
                participants=participants,
                last_activity=timezone.now(),
                channel=account.provider,
                priority=data.get("priority", "normal"),
            )

        schema_ctx = schema_context(tenant_schema) if tenant_schema else nullcontext()
        with schema_ctx:
            message = Message.objects.create(
                conversation=conversation,
                inbox=account.inbox,
                subject=subject,
                from_email=from_email,
                to=to_emails,
                cc=cc_emails,
                bcc=bcc_emails,
                content=plain_body,
                html_content=html_body,
                thread_id=thread_id,
                message_id=new_message_id,
                in_reply_to=in_reply_to,
                references=references,
                timestamp=timezone.now(),
                source="outgoing",
                priority=data.get("priority", "normal"),
            )

        conversation.last_message = message
        conversation.last_activity = timezone.now()
        conversation.save(update_fields=["last_message", "last_activity"])

        try:
            channel_layer = get_channel_layer()
            group_name = f"tenant_{tenant.id}"
            ws_payload = {
                "type": "new_conversation" if not thread_id else "new_message",
                "message": {
                    "type": "new_conversation" if not thread_id else "new_message",
                    "message": MessageSerializer(message).data,
                    "conversation": ConversationSerializer(conversation).data,
                },
            }
            async_to_sync(channel_layer.group_send)(group_name, ws_payload)
        except Exception:
            traceback.print_exc()

        return Response(
            {
                "message": MessageSerializer(message).data,
                "conversation": ConversationSerializer(conversation).data,
            },
            status=201,
        )

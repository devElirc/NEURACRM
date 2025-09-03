import json
import base64
import requests
import traceback
import smtplib
import html
import re

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import getaddresses
from bs4 import BeautifulSoup

from django.core.cache import cache
from django.db import transaction
from django.http import JsonResponse, HttpResponse
from django.utils import timezone

from datetime import datetime, timezone as dt_timezone

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django.views.decorators.csrf import csrf_exempt

from django_tenants.utils import schema_context

from rest_framework import viewsets, permissions, status, filters
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

from rest_framework.permissions import IsAuthenticated


User = get_user_model()

from ...core.models import TenantEmailMapping, Client  # adjust if needed



SMTP_SERVER = "mail.ralakde.co.uk"
SMTP_PORT = 587
SMTP_USER = "teams@ralakde.com"
SMTP_PASS = "Ralakde123"

def send_invitation_email(email: str, tenant_id: str, created: bool):
    if created:
        subject = "Welcome! Your account has been created"
        invite_link = "https://NeuraCRM.com/login"
        body = f"""
Hi,

An account has been created for you on NeuraCRM.
You can log in with the email {email} and the temporary password: 123456.

Once logged in, please change your password immediately.

Login here: {invite_link}

Best regards,
NeuraCRM Team
"""
    else:
        subject = "You've been added to a new team"
        invite_link = f"https://NeuraCRM.com/invite/accept?email={email}&tenant_id={tenant_id}"
        body = f"""
Hi,

You've been added to a new team on NeuraCRM.
Click below to accept and access the team:

{invite_link}

Best regards,
NeuraCRM Team
"""
    print(f"📧 Sending invite to {email} (tenant={tenant_id}, created={created})")
    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, email, msg.as_string())


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


def get_tenant_for_email(email: str):
    with schema_context("public"):
        mapping = TenantEmailMapping.objects.filter(email=email).first()
        if mapping and mapping.tenant:
            return mapping.tenant
    return None


def refresh_access_token(channel_account):
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
        channel_account.save(update_fields=["access_token", "expires_in", "token_acquired_at"])
    return channel_account.access_token


def clean_gmail_html(html_body: str) -> str:
    """Clean marketing/newsletter HTML and return compact plain text."""
    soup = BeautifulSoup(html_body, "html.parser")

    # --- Remove junk ---
    for tag in soup(["style", "script", "meta", "title", "head", "noscript"]):
        tag.decompose()

    # Remove tracking pixels / invisible images
    for img in soup.find_all("img", {"height": "1", "width": "1"}):
        img.decompose()

    # --- Replace structural tags with newlines ---
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for block in soup.find_all(["p", "div", "tr", "td", "section"]):
        block.append("\n")

    # --- Extract text ---
    text = soup.get_text(separator=" ", strip=True)

    # --- Normalize spacing ---
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)  # collapse >2 blank lines
    text = re.sub(r"[ \t]+", " ", text)           # collapse spaces
    text = text.strip()

    return text


def html_to_clean_text(html_body: str) -> str:
    """
    Convert cleaned Gmail HTML into plain text
    with controlled newlines (like Gmail does).
    """
    cleaned_html = clean_gmail_html(html_body)
    soup = BeautifulSoup(cleaned_html, "html.parser")

    text = soup.get_text("\n")

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Collapse 3+ newlines into exactly 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Strip trailing/leading newlines
    return text.strip() + "\n"


def preserve_gmail_format(plain_text: str) -> str:
    escaped = html.escape(plain_text)
    lines = escaped.splitlines()
    formatted_lines = []
    for line in lines:
        if line.strip() == "":
            formatted_lines.append("<br>")
        else:
            formatted_lines.append(line)
    return "<br>\n".join(formatted_lines)


# --- NEW helper: safe header extraction from Gmail payload headers list ---
def get_header(headers_list, name: str):
    """
    Given Gmail's headers list (list of {"name": "...", "value": "..."})
    return the value for header 'name' (case-insensitive), or None.
    """
    if not headers_list:
        return None
    for h in headers_list:
        if h is None:
            continue
        if h.get("name", "").lower() == name.lower():
            return h.get("value")
    return None

@api_view(["POST"])
@permission_classes([AllowAny])

def gmail_notify(request):
    try:
        envelope = json.loads(request.body)
        message_data = envelope.get("message", {}).get("data")
        if not message_data:
            return JsonResponse({"error": "No message data"}, status=400)

        payload = json.loads(base64.urlsafe_b64decode(message_data).decode("utf-8"))
        incoming_history_id = payload.get("historyId")
        email = payload.get("emailAddress")

        # Deduplication guard
        cache_key = f"gmail_webhook_lock:{email}"
        if cache.get(cache_key):
            return JsonResponse({"status": "duplicate_skipped"})
        cache.set(cache_key, True, timeout=10)

        # Resolve account + tenant
        account = ChannelAccount.objects.get(identifier=email)
        tenant = get_tenant_for_email(email)
        if not tenant:
            return JsonResponse({"error": "Tenant not found"}, status=404)

        with schema_context(tenant.schema_name):
            history_id = incoming_history_id or account.last_history_id
            if not history_id:
                return JsonResponse({"error": "Missing historyId"}, status=400)

            gmail = GmailService(account)
            messages, new_history_id = gmail.fetch_new_emails(history_id)

            def extract_bodies(payload):
                headers_list = payload.get("headers", []) or []
                subject_for_debug = get_header(headers_list, "Subject")
                from_for_debug = get_header(headers_list, "From")

                html_body = None
                plain_body = None

                def walk(parts):
                    for part in parts:
                        if not isinstance(part, dict):
                            continue
                        mime = part.get("mimeType")
                        body_data = part.get("body", {}).get("data")
                        if part.get("parts"):
                            yield from walk(part.get("parts"))
                        elif body_data:
                            try:
                                decoded = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
                            except Exception:
                                try:
                                    decoded = base64.b64decode(body_data).decode("utf-8", errors="ignore")
                                except Exception:
                                    decoded = ""
                            yield mime, decoded

                parts = payload.get("parts")
                if parts:
                    for mime, decoded in walk(parts):
                        if not mime or not decoded:
                            continue
                        if mime.lower().split(";")[0] == "text/html" and not html_body:
                            html_body = decoded
                        elif mime.lower().split(";")[0] == "text/plain" and not plain_body:
                            plain_body = decoded
                else:
                    body_data = payload.get("body", {}).get("data")
                    if body_data:
                        try:
                            plain_body = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
                        except Exception:
                            plain_body = None

                if html_body:
                    # Clean HTML to preserve blank lines
                    plain_body = html_to_clean_text(html_body)
                elif plain_body:
                    # fallback to text → HTML
                    html_body = preserve_gmail_format(plain_body)

                return html_body, plain_body

            for msg in messages:
                subject, snippet = parse_email_subject_and_snippet(msg)
                headers_list = msg.get("payload", {}).get("headers", []) or []
                headers = {h.get("name", "").lower(): h.get("value") for h in headers_list if isinstance(h, dict)}
                msg_id = headers.get("message-id") or msg.get("id")
                if Message.objects.filter(message_id=msg_id).exists():
                    continue

                thread_id = msg.get("threadId")
                in_reply_to = headers.get("in-reply-to")
                references = headers.get("references")
                from_email = parse_email_address(headers.get("from"))
                to = parse_email_list(headers.get("to"))
                cc = parse_email_list(headers.get("cc"))
                bcc = parse_email_list(headers.get("bcc"))
                reply_to = parse_email_list(headers.get("reply-to"))
                timestamp = datetime.fromtimestamp(int(msg.get("internalDate", 0)) / 1000.0, tz=dt_timezone.utc)

                # Conversation matching
                conversation = None
                if thread_id:
                    conversation = Conversation.objects.filter(thread_id=thread_id).first()
                if not conversation and in_reply_to:
                    conversation = Conversation.objects.filter(messages__message_id=in_reply_to).first()
                if not conversation and references:
                    ref_ids = [r.strip() for r in references.split()] if isinstance(references, str) else None
                    if ref_ids:
                        conversation = Conversation.objects.filter(messages__message_id__in=ref_ids).first()

                created = False
                if not conversation:
                    conversation = Conversation.objects.create(
                        thread_id=thread_id,
                        subject=subject or "(No Subject)",
                        channel=account.provider,
                        priority="normal",
                        status="open",
                        last_activity=timestamp,
                        shared_inbox_id=account.inbox.id,
                    )
                    created = True

                payload_msg = msg.get("payload", {}) or {}
                html_body, plain_body = extract_bodies(payload_msg)

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
                    content=plain_body or snippet or "",
                    html_content=html_body or preserve_gmail_format(plain_body or snippet or ""),
                    timestamp=timestamp,
                    inbox=account.inbox,
                    source="incoming",
                    priority="normal",
                )

                conversation.last_activity = timestamp
                conversation.last_message = message
                conversation.save(update_fields=["last_activity", "last_message"])

                # WebSocket broadcast
                try:
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"tenant_{tenant.id}",
                        {
                            "type": "new_conversation" if created else "new_message",
                            "message": {
                                "type": "new_conversation" if created else "new_message",
                                "message": MessageSerializer(message).data,
                                "conversation": ConversationSerializer(conversation).data,
                            },
                        },
                    )
                except Exception:
                    traceback.print_exc()

            if new_history_id:
                account.last_history_id = new_history_id
                account.save(update_fields=["last_history_id"])

        return JsonResponse({"status": "ok"})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

# ----------------- Outlook Webhook ----------------- #

@csrf_exempt
def outlook_notify(request):
    """
    Outlook webhook handler:
    - Handles validation handshake
    - Processes new message notifications
    - Deduplicates, fetches, normalizes, and stores messages
    - Broadcasts via WebSocket
    """
    try:
        # 1. Validation handshake
        validation_token = request.GET.get("validationToken")
        if validation_token:
            return HttpResponse(validation_token, content_type="text/plain", status=200)

        if request.method != "POST":
            return JsonResponse({"error": "Method not allowed"}, status=405)

        body = json.loads(request.body.decode("utf-8"))
        notifications = body.get("value", [])

        for notif in notifications:
            subscription_id = notif.get("subscriptionId")
            resource = notif.get("resource")
            message_id = resource.split("/")[-1] if resource else None
            if not subscription_id or not message_id:
                continue

            # 2. Deduplication
            cache_key = f"outlook_webhook_lock:{subscription_id}:{message_id}"
            if cache.get(cache_key):
                continue
            cache.set(cache_key, True, timeout=10)

            # 3. Resolve account + tenant
            try:
                account = ChannelAccount.objects.get(subscription_id=subscription_id)
            except ChannelAccount.DoesNotExist:
                continue

            tenant = get_tenant_for_email(account.identifier)
            if not tenant:
                continue

            with schema_context(tenant.schema_name):
                service = OutlookService(account)
                msg = service.get_message(message_id)
                if not msg:
                    continue

                # --- Normalization helpers ---
                def normalize_recipient_list(recips):
                    if not recips:
                        return []
                    return [
                        {"email": r.get("emailAddress", {}).get("address"), "name": r.get("emailAddress", {}).get("name")}
                        for r in recips if r.get("emailAddress", {}).get("address")
                    ]

                def parse_iso(iso_str):
                    try:
                        return dt_datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
                    except Exception:
                        return dt_datetime.now(tz=dt_timezone.utc)

                # --- Extract message fields ---
                from_ea = (msg.get("from") or {}).get("emailAddress") or {}
                from_email = {"email": from_ea.get("address"), "name": from_ea.get("name")}
                to_list = normalize_recipient_list(msg.get("toRecipients"))
                cc_list = normalize_recipient_list(msg.get("ccRecipients"))
                reply_to_list = normalize_recipient_list(msg.get("replyTo"))

                subject = msg.get("subject") or "(No Subject)"
                timestamp = parse_iso(msg.get("receivedDateTime"))
                internet_message_id = msg.get("internetMessageId") or message_id
                thread_id = msg.get("conversationId")

                headers = {h.get("name"): h.get("value") for h in msg.get("internetMessageHeaders") or []}
                in_reply_to = headers.get("In-Reply-To")
                references = [r.strip() for r in headers.get("References", "").split()] if headers.get("References") else None

                # Skip if message already saved
                if Message.objects.filter(message_id=internet_message_id).exists():
                    continue

                # --- Conversation resolution ---
                conversation, created = Conversation.objects.get_or_create(
                    thread_id=thread_id,
                    defaults={
                        "subject": subject,
                        "channel": account.provider,
                        "priority": "normal",
                        "status": "open",
                        "last_activity": timestamp,
                        "shared_inbox_id": account.inbox.id,
                    }
                )

                # --- Save message ---
                message = Message.objects.create(
                    conversation=conversation,
                    message_id=internet_message_id,
                    thread_id=thread_id,
                    in_reply_to=in_reply_to,
                    references=references,
                    subject=subject,
                    from_email=from_email,
                    to=to_list,
                    cc=cc_list or None,
                    bcc=None,
                    reply_to=reply_to_list[0] if reply_to_list else None,
                    content=msg.get("bodyPreview") or "",
                    html_content=(msg.get("body") or {}).get("content"),
                    timestamp=timestamp,
                    inbox=account.inbox,
                    source="incoming",
                    priority="normal",
                )

                # --- Update conversation ---
                conversation.last_activity = timestamp
                conversation.last_message = message
                conversation.save(update_fields=["last_activity", "last_message"])

                # --- WebSocket broadcast ---
                try:
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"tenant_{tenant.id}",
                        {
                            "type": "new_conversation" if created else "new_message",
                            "message": {
                                "type": "new_conversation" if created else "new_message",
                                "message": MessageSerializer(message).data,
                                "conversation": ConversationSerializer(conversation).data,
                            },
                        },
                    )
                except Exception:
                    traceback.print_exc()

        return JsonResponse({"status": "ok"})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": "server error"}, status=500)

# ---------------- VIEWSETS ---------------- #

class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing teammates.
    """
    queryset = TeamMember.objects.select_related("user").prefetch_related("team_inboxes").all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = self.request.query_params.get("tenant_id")
        qs = super().get_queryset()
        if tenant_id:
            qs = qs.filter(user__tenants__id=tenant_id)
        return qs

    


    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        email = data.get("email")
        first_name = data.get("firstName")
        last_name = data.get("lastName")
        role = data.get("role")
        tenant_id = data.get("tenant_id")
        team_inboxes = data.get("teamInboxes", [])
        send_invite = data.get("sendInvite", False)


        if not all([email, first_name, last_name, role, tenant_id]):
            return Response({"detail": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Create or reuse user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "username": email,
            },
        )

        # If user newly created, set password to "1"
        if created:
            user.set_password("123456")
            user.save()

        # Ensure teammate not duplicated in tenant
        if TeamMember.objects.filter(user=user, user__tenants__id=tenant_id).exists():
            return Response({"detail": "User already a teammate in this tenant"}, status=status.HTTP_400_BAD_REQUEST)

        # Create team member
        team_member = TeamMember.objects.create(user=user, role=role, is_active=True)

        # Add user → tenant
        user.tenants.add(tenant_id)
        # Assign inboxes
        if team_inboxes:
            team_member.team_inboxes.set(team_inboxes)

        if send_invite:
            send_invitation_email(user.email, tenant_id, created)

        serializer = self.get_serializer(team_member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # --- UPDATE teammate ---

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        team_member = self.get_object()
        data = request.data


        # --- Update related User ---
        user = team_member.user
        first_name = data.get("firstName")
        last_name = data.get("lastName")
        email = data.get("email")

        if first_name:
            user.first_name = first_name
            
        if last_name:
            user.last_name = last_name

        if email and email != user.email:
            # Prevent duplicate emails
            if User.objects.exclude(id=user.id).filter(email=email).exists():
                return Response({"detail": "Email already in use"}, status=status.HTTP_400_BAD_REQUEST)
            
            user.email = email
            user.username = email  # keep username aligned with email
        user.save()

        # --- Update TeamMember fields ---
        role = data.get("role")
        is_active = data.get("is_active")

        if role:
            team_member.role = role

        if is_active is not None:
            team_member.is_active = is_active

        team_member.save()

        # --- Update inbox assignments ---
        team_inboxes = data.get("teamInboxes")
        if team_inboxes is not None:
            team_member.team_inboxes.set(team_inboxes)


        serializer = self.get_serializer(team_member)
        return Response(serializer.data)

    # --- DELETE teammate ---
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        team_member = self.get_object()


        # Optional tenant removal
        tenant_id = request.query_params.get("tenant_id")
        if tenant_id:
            team_member.user.tenants.remove(int(tenant_id))

        team_member.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


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

    def get_queryset(self):
        """
        Optionally filter comments by message ID:
        /api/comments/?message=<uuid>
        Newest comments first.
        """
        queryset = super().get_queryset().order_by('-created_at')
        message_id = self.request.query_params.get('message')
        if message_id:
            queryset = queryset.filter(message_id=message_id)
        return queryset

    def perform_create(self, serializer):
        """
        Automatically assign the logged-in user to the comment.
        """
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]


class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    


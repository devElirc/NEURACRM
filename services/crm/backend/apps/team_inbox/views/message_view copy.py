from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
import json


from ..models import TeamMember, Inbox, ChannelAccount, Tag, Message, Comment, Task, CalendarEvent, Conversation
from ..serializers import ( MessageSerializer, ConversationSerializer,
    TeamMemberSerializer, InboxSerializer, ChannelAccountSerializer,
    TagSerializer,  CommentSerializer,
    TaskSerializer, CalendarEventSerializer
)


import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..services.gmail_service import GmailService

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django_tenants.utils import  schema_context

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
    ordering_fields = ['timestamp', 'received_at']
    ordering = ['-timestamp']
    search_fields = ['subject', 'from_email', 'to', 'content']

    def get_queryset(self):
        print("DEBUG: get_queryset called")
        user = self.request.user
        print(f"User making request: {user}")

        qs = Message.objects.select_related('inbox', 'assigned_to', 'conversation').prefetch_related(
            'attachments', 'labels', 'internal_notes'
        )
        print(f"Initial queryset count: {qs.count()}")

        inbox_id = self.request.query_params.get('inbox')
        if inbox_id:
            qs = qs.filter(inbox_id=inbox_id)
            print(f"Filtered by inbox_id={inbox_id}, count now: {qs.count()}")

        assigned_to_me = self.request.query_params.get('assigned_to_me')
        if assigned_to_me == 'true':
            qs = qs.filter(assigned_to=user)
            print(f"Filtered by assigned_to_me=True, count now: {qs.count()}")

        print(f"Final queryset count: {qs.count()}")
        return qs


    def send_email_smtp(self, from_email, to_email, subject, plain_body=None, html_body=None, cc=None, bcc=None, attachments=None):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_email}"
        msg["Reply-To"] = from_email
        msg["To"] = ", ".join(to_email) if isinstance(to_email, list) else to_email

        if cc:
            msg["Cc"] = ", ".join(cc)
        if bcc:
            # Note: BCC does not go in headers, recipients list includes BCC though
            pass

        # Attach plain and html parts
        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        # Attach files if any
        if attachments:
            for file in attachments:
                msg.attach(file)

        # Combine all recipients for sending (to + cc + bcc)
        recipients = []
        if isinstance(to_email, list):
            recipients.extend(to_email)
        else:
            recipients.append(to_email)
        if cc:
            recipients.extend(cc)
        if bcc:
            recipients.extend(bcc)

        # Send email via SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, recipients, msg.as_string())


    # Your viewset method:

    def create(self, request, *args, **kwargs):
        data = request.data
        thread_id = data.get('threadId')
        subject = data.get('subject') or '(No Subject)'

        from_email = data.get("from_", {}).get("email")
        tenant = getattr(request, "tenant", None)
        tenant_schema = getattr(tenant, "schema_name", None)
        print("DEBUG: tenant:", tenant, "schema:", tenant_schema)

        # Quick checks
        print("DEBUG: incoming payload keys:", list(data.keys()))
        print("DEBUG: thread_id, subject:", thread_id, subject)
        print("DEBUG: from_email:", from_email)

        try:
            account = ChannelAccount.objects.get(email=from_email)
            print(f"DEBUG: Found ChannelAccount: id={account.id}, inbox={getattr(account, 'inbox', None)}")
            if getattr(account, "inbox", None):
                print("DEBUG: account.inbox.id:", account.inbox.id)
        except ObjectDoesNotExist:
            print(f"ERROR: No ChannelAccount found for email: {from_email}")
            return Response({"error": "ChannelAccount not found for user"}, status=status.HTTP_404_NOT_FOUND)

        # build participants
        participants = []
        seen = set()
        for p in [data.get('from_')] + data.get('to', []) + data.get('cc', []) + data.get('bcc', []):
            if p and p.get('email') not in seen:
                participants.append(p)
                seen.add(p['email'])
        print("DEBUG: participants:", participants)

        # conversation get_or_create
        conversation, created = Conversation.objects.get_or_create(
            thread_id=thread_id,
            shared_inbox_id=account.inbox.id,
            defaults={
                'subject': subject,
                'participants': participants,
                'last_activity': timezone.now(),
                'channel': 'email',
                'priority': data.get('priority', 'normal')
            }
        )
        print(f"DEBUG: conversation id={conversation.id}, created={created}")

        if not created:
            existing_emails = {p['email'] for p in conversation.participants}
            new_participants = [p for p in participants if p['email'] not in existing_emails]
            if new_participants:
                conversation.participants.extend(new_participants)
                conversation.save(update_fields=["participants"])
                print("DEBUG: appended new participants:", new_participants)

        # Serializer prep
        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            print("ERROR: serializer.is_valid failed:", str(e))
            print("DEBUG serializer errors:", serializer.errors)
            return Response({"error": "Invalid payload", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        print("DEBUG: serializer.initial_data keys:", list(serializer.initial_data.keys()))
        print("DEBUG: serializer.validated_data keys:", list(serializer.validated_data.keys()))

        # Try saving inside tenant schema
        try:
            with schema_context(tenant_schema) if tenant_schema else (lambda: (yield))():
                try:
                    print("DEBUG: about to call serializer.save(conversation=..., inbox=...)")
                    message = serializer.save(conversation=conversation, inbox=account.inbox)
                    print("DEBUG: serializer.save succeeded, message id:", getattr(message, "id", None))
                except Exception as e_save:
                    print("ERROR: serializer.save failed:", str(e_save))
                    traceback.print_exc()
                    vd = dict(serializer.validated_data)
                    vd.pop('conversation', None)
                    vd.pop('inbox', None)
                    print("DEBUG: fallback creating TeamInboxMessage directly with vd keys:", list(vd.keys()))
                    try:
                        with transaction.atomic():
                            message = TeamInboxMessage.objects.create(
                                conversation=conversation,
                                inbox=account.inbox,
                                **vd
                            )
                            print("DEBUG: fallback create succeeded, message id:", message.id)
                    except IntegrityError as ie:
                        print("CRITICAL: fallback create IntegrityError:", str(ie))
                        traceback.print_exc()
                        try:
                            print("DEBUG: last SQL queries (tail):", connection.queries[-5:])
                        except Exception:
                            pass
                        return Response({"error": "db_integrity_error", "detail": str(ie)}, status=500)
        except TypeError:
            pass

        # update conversation pointers
        try:
            conversation.last_message = message
            conversation.last_activity = timezone.now()
            conversation.save(update_fields=["last_message", "last_activity"])
        except Exception:
            print("ERROR updating conversation pointers")
            traceback.print_exc()

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
            print(f"✅ Broadcasted to {group_name}")

        except Exception:
            print("WARN: broadcast failed")
            traceback.print_exc()

        # response
        return Response({
            "message": MessageSerializer(message).data,
            "conversation": ConversationSerializer(conversation).data
        }, status=status.HTTP_201_CREATED)

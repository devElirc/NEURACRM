from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model


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
        to_emails = [p.get('email') for p in data.get('to', []) if p.get('email')]
        cc_emails = [p.get('email') for p in data.get('cc', []) if p.get('email')]
        bcc_emails = [p.get('email') for p in data.get('bcc', []) if p.get('email')]

        plain_body = data.get('content')  # assuming plain text here
        html_body = data.get('htmlContent')

        print(f"DEBUG: Sender email from payload: {from_email}")

        try:
            account = ChannelAccount.objects.get(email=from_email)
            print(f"DEBUG: Found ChannelAccount: {account}, inbox id: {account.inbox.id}")
        except ObjectDoesNotExist:
            print(f"ERROR: No ChannelAccount found for email: {from_email}")
            return Response({"error": "ChannelAccount not found for user"}, status=status.HTTP_404_NOT_FOUND)

        # Send email before saving
        try:
            self.send_email_smtp(
                from_email=from_email,
                to_email=to_emails,
                subject=subject,
                plain_body=plain_body,
                html_body=html_body,
                cc=cc_emails,
                bcc=bcc_emails,
                attachments=None  # add attachments handling if needed
            )
            print("DEBUG: Email sent successfully via SMTP")
        except Exception as e:
            print(f"ERROR: Failed to send email: {e}")
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Participants collection
        participants = []
        seen = set()
        for p in [data.get('from_')] + data.get('to', []) + data.get('cc', []) + data.get('bcc', []):
            if p and p.get('email') not in seen:
                participants.append(p)
                seen.add(p['email'])
        print(f"DEBUG: Participants collected: {participants}")

        # Conversation get_or_create
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
        print(f"DEBUG: Conversation {'created' if created else 'retrieved'} with id: {conversation.id}")

        if not created:
            existing_emails = {p['email'] for p in conversation.participants}
            new_participants = [p for p in participants if p['email'] not in existing_emails]
            if new_participants:
                conversation.participants.extend(new_participants)
                print(f"DEBUG: Added new participants to conversation: {new_participants}")

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        message = serializer.save(
            conversation=conversation,
            inbox=account.inbox
        )
        print(f"DEBUG: Message saved with id: {message.id}")

        conversation.last_message = message
        conversation.last_activity = timezone.now()
        conversation.save()

        message_data = MessageSerializer(message).data
        conversation_data = ConversationSerializer(conversation).data

        return Response(
            {
                "message": message_data,
                "conversation": conversation_data
            },
            status=status.HTTP_201_CREATED
        )
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class TeamMember(models.Model):
    """
    Team member linking user to tenant with role
    """
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("agent", "Agent"),
        ("viewer", "Viewer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tenant_memberships",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(null=True, blank=True) 
    team_inboxes = models.ManyToManyField("Inbox", related_name="teammates", blank=True)

    def __str__(self):
        return f"{self.user.full_name} ({self.role})"

class Inbox(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)  # optional field
    
    # removed email, since "channels" will carry identifiers now
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  

    def __str__(self):
        return f"{self.name}"



class ChannelAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    identifier = models.CharField(max_length=255, unique=True, null=True, blank=True)
    provider = models.CharField(max_length=50, default="gmail")  # gmail, outlook, etc.
    
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    expires_in = models.IntegerField(null=True, blank=True)   # seconds until token expires
    token_acquired_at = models.DateTimeField(default=timezone.now)

    inbox = models.ForeignKey(
        "Inbox", 
        on_delete=models.CASCADE, 
        related_name="channels"
    )

    last_history_id = models.CharField(max_length=255, null=True, blank=True)
    subscription_id = models.CharField(max_length=255, null=True, blank=True)  # ← new for Outlook

    def __str__(self):
        return f"{self.identifier} ({self.provider})"

    def is_token_expired(self):
        if not self.expires_in:
            return False
        expiry_time = self.token_acquired_at + timezone.timedelta(seconds=self.expires_in)
        return timezone.now() >= expiry_time


class Tag(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#cccccc")

    def __str__(self):
        return self.name


class Label(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#cccccc")  # Hex color

    def __str__(self):
        return self.name

class Conversation(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('pending', 'Pending'),
        ('spam', 'Spam'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('chat', 'Chat'),
        ('social', 'Social'),
        ('phone', 'Phone'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread_id = models.CharField(max_length=255, db_index=True)
    subject = models.CharField(max_length=255)
    participants = models.JSONField(default=list)  # List of { name, email }
    tags = models.ManyToManyField('Tag', blank=True, related_name='conversations')

    assigned_to = models.CharField(max_length=255, null=True, blank=True)
    assigned_by = models.CharField(max_length=255, null=True, blank=True)
    assigned_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    last_activity = models.DateTimeField()
    last_message = models.ForeignKey(
        'Message',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='conversation_last_used_in'
    )

    snoozed = models.BooleanField(default=False)
    snooze_until = models.DateTimeField(null=True, blank=True)

    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='email')
    contact_id = models.UUIDField(null=True, blank=True)
    company_id = models.UUIDField(null=True, blank=True)
    shared_inbox_id = models.UUIDField(null=True, blank=True)

    is_archived = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subject


class Message(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    SOURCE_CHOICES = [
        ('incoming', 'Incoming'),
        ('outgoing', 'Outgoing'),
        ('internal', 'Internal'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',  # MUST be 'messages' for serializer & queryset
        null=True,
        blank=True,
    )
    thread_id = models.CharField(max_length=255, blank=True, null=True)
    message_id = models.CharField(max_length=255, unique=True)
    in_reply_to = models.CharField(max_length=255, blank=True, null=True)
    references = models.JSONField(blank=True, null=True)  # List of strings

    subject = models.CharField(max_length=255)
    from_email = models.JSONField()  # { name: str, email: str }
    to = models.JSONField()          # List of { name: str, email: str }
    cc = models.JSONField(blank=True, null=True)
    bcc = models.JSONField(blank=True, null=True)
    reply_to = models.JSONField(blank=True, null=True)

    content = models.TextField()
    html_content = models.TextField(blank=True, null=True)

    timestamp = models.DateTimeField()
    is_read = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    is_draft = models.BooleanField(default=False)

    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='incoming')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')

    inbox = models.ForeignKey(
        'Inbox',
        on_delete=models.CASCADE,
        related_name='messages'
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_messages'
    )

    labels = models.ManyToManyField('Label', blank=True, related_name='messages')
    attachments = models.ManyToManyField('Attachment', blank=True, related_name='messages')
    internal_notes = models.ManyToManyField('InternalNote', blank=True, related_name='messages')

    snooze_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subject


class Attachment(models.Model):
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='attachment_set'  
    )
    filename = models.CharField(max_length=255)
    file_url = models.URLField()
    mime_type = models.CharField(max_length=100)
    size = models.IntegerField()  # in bytes

    def __str__(self):
        return self.filename



class InternalNote(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='note_set')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Note by {self.author} on {self.created_at}'


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        "Message",
        on_delete=models.CASCADE,
        related_name="comments"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    content = models.TextField()
    mentions = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="mentioned_in_comments",
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.email} on {self.message.subject}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("comment_mention", "Comment Mention"),
        ("message_assigned", "Message Assigned"),
        ("status_changed", "Status Changed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    object_id = models.UUIDField()  
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} → {self.user.email}"


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    due_date = models.DateTimeField()
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.title


class CalendarEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='calendar_events')
    title = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

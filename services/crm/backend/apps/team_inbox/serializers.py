from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    TeamMember, Inbox, ChannelAccount, Tag, Conversation,
    Message, Attachment, InternalNote, Label, Comment, Task, CalendarEvent
)

User = get_user_model()


class TeamMemberSerializer(serializers.ModelSerializer):
    # Flatten User fields
    firstName = serializers.CharField(source="user.first_name", read_only=True)
    lastName = serializers.CharField(source="user.last_name", read_only=True)
    fullName = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    avatar = serializers.URLField(source="user.avatar", read_only=True)

    # Computed fields
    status = serializers.SerializerMethodField()
    lastSeen = serializers.SerializerMethodField()
    joinedDate = serializers.SerializerMethodField()
    teamInboxes = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = [
            "id",
            "firstName",
            "lastName",
            "fullName",
            "email",
            "role",
            "avatar",
            "status",
            "lastSeen",
            "joinedDate",
            "teamInboxes",
        ]

    # --- Computed field resolvers ---
    def get_fullName(self, obj):
        first = obj.user.first_name or ""
        last = obj.user.last_name or ""
        return f"{first} {last}".strip()

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"

    def get_lastSeen(self, obj):
        return obj.last_seen.isoformat() if obj.last_seen else None

    def get_joinedDate(self, obj):
        if obj.user and getattr(obj.user, "created_at", None):
            return obj.user.created_at.strftime("%Y-%m-%d")
        return None

    def get_teamInboxes(self, obj):
        return list(obj.team_inboxes.values_list("id", flat=True))
    

class ChannelAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelAccount
        fields = [
            "id",
            "identifier",
            "provider",
            "access_token",
            "refresh_token",
            "expires_in",
            "token_acquired_at",
            "last_history_id",
            "subscription_id",
        ]


class InboxSerializer(serializers.ModelSerializer):
    channels = ChannelAccountSerializer(many=True, read_only=True)  # reverse relation
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Inbox
        fields = [
            "id",
            "name",
            "description",
            "channels",
            "createdAt",
            "updatedAt",
        ]

    def create(self, validated_data):
        channels_data = validated_data.pop("channels", [])
        inbox = Inbox.objects.create(**validated_data)
        
        for channel in channels_data:
            # create a ChannelAccount linked to this inbox
            ChannelAccount.objects.create(
                inbox=inbox,
                identifier=channel.get("identifier"),
                provider=channel.get("provider", "email")  # default provider
            )
        return inbox


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    message = serializers.PrimaryKeyRelatedField(queryset=Message.objects.all())

    class Meta:
        model = Comment
        fields = ['id', 'message', 'user', 'content', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    message = serializers.PrimaryKeyRelatedField(queryset=Message.objects.all())
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Task
        fields = ['id', 'message', 'title', 'due_date', 'assigned_to']

class CalendarEventSerializer(serializers.ModelSerializer):
    message = serializers.PrimaryKeyRelatedField(queryset=Message.objects.all())
    created_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = CalendarEvent
        fields = ['id', 'message', 'title', 'start_time', 'end_time', 'created_by']


# class EmailAddressSerializer(serializers.Serializer):
#     name = serializers.CharField(required=False, allow_blank=True)
#     email = serializers.EmailField()

class EmailAddressSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()

    def to_representation(self, instance):
        # If instance is a string, treat it as email
        if isinstance(instance, str):
            return {"email": instance, "name": ""}
        elif isinstance(instance, dict):
            # Ensure 'email' key exists
            return {"email": instance.get("email", ""), "name": instance.get("name", "")}
        return super().to_representation(instance)

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'filename', 'file_url', 'mime_type', 'size']

class InternalNoteSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()

    class Meta:
        model = InternalNote
        fields = ['id', 'author', 'content', 'created_at']

class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'name', 'color']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']


class MessageSerializer(serializers.ModelSerializer):
    from_ = EmailAddressSerializer(source='from_email')
    to = EmailAddressSerializer(many=True)
    cc = EmailAddressSerializer(many=True, required=False, allow_null=True)
    bcc = EmailAddressSerializer(many=True, required=False, allow_null=True)
    replyTo = serializers.SerializerMethodField()
    threadId = serializers.CharField(source='thread_id', allow_null=True)
    messageId = serializers.CharField(source='message_id')
    inReplyTo = serializers.CharField(source='in_reply_to', required=False, allow_null=True)
    references = serializers.ListField(child=serializers.CharField(), allow_null=True)
    htmlContent = serializers.CharField(source='html_content', required=False, allow_null=True)
    isRead = serializers.BooleanField(source='is_read')
    isStarred = serializers.BooleanField(source='is_starred')
    isDraft = serializers.BooleanField(source='is_draft')
    attachments = AttachmentSerializer(many=True, read_only=True)
    internalNotes = InternalNoteSerializer(many=True, source='internal_notes', read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    priority = serializers.ChoiceField(choices=Message.PRIORITY_CHOICES)
    source = serializers.ChoiceField(choices=Message.SOURCE_CHOICES)

    class Meta:
        model = Message
        fields = [
            'id',
            'threadId',
            'from_',
            'to',
            'cc',
            'bcc',
            'replyTo',
            'subject',
            'content',
            'htmlContent',
            'timestamp',
            'isRead',
            'isStarred',
            'isDraft',
            'messageId',
            'inReplyTo',
            'references',
            'attachments',
            'internalNotes',
            'labels',
            'priority',
            'source',
        ]

    def get_replyTo(self, obj):
        reply_to = getattr(obj, "reply_to", None)
        if not reply_to:
            return None
        if isinstance(reply_to, list) and reply_to:
            return reply_to[0]
        if isinstance(reply_to, dict):
            return reply_to
        return None

    def to_representation(self, instance):
        """Ensure API response matches expected field names and structure."""
        data = super().to_representation(instance)

        # Rename "from_" → "from"
        data['from'] = data.pop('from_', None)

        return data

    def create(self, validated_data):
        """
        Create a Message instance.
        Handles nested email address serializers for from/to/cc/bcc.
        """
        from_email = validated_data.pop('from_email', None)
        to_list = validated_data.pop('to', [])
        cc_list = validated_data.pop('cc', [])
        bcc_list = validated_data.pop('bcc', [])

        # Extract emails (and names if stored)
        from_email_value = from_email.get('email') if from_email else None

        to_emails = [addr['email'] for addr in to_list if 'email' in addr]
        cc_emails = [addr['email'] for addr in cc_list if 'email' in addr]
        bcc_emails = [addr['email'] for addr in bcc_list if 'email' in addr]

        # Store lists into JSONField/ArrayField
        message = Message.objects.create(
            from_email=from_email_value,
            to=to_emails,
            cc=cc_emails,
            bcc=bcc_emails,
            **validated_data
        )

        return message


# class MessageSerializer(serializers.ModelSerializer):
#     from_ = EmailAddressSerializer(source='from_email')
#     to = EmailAddressSerializer(many=True)
#     cc = EmailAddressSerializer(many=True, required=False, allow_null=True)
#     bcc = EmailAddressSerializer(many=True, required=False, allow_null=True)
#     replyTo = serializers.SerializerMethodField()
#     threadId = serializers.CharField(source='thread_id', allow_null=True)
#     messageId = serializers.CharField(source='message_id')
#     inReplyTo = serializers.CharField(source='in_reply_to', required=False, allow_null=True)
#     references = serializers.ListField(child=serializers.CharField(), allow_null=True)
#     htmlContent = serializers.CharField(source='html_content', required=False, allow_null=True)
#     isRead = serializers.BooleanField(source='is_read')
#     isStarred = serializers.BooleanField(source='is_starred')
#     isDraft = serializers.BooleanField(source='is_draft')
#     attachments = AttachmentSerializer(many=True, read_only=True)
#     internalNotes = InternalNoteSerializer(many=True, source='internal_notes', read_only=True)
#     labels = LabelSerializer(many=True, read_only=True)
#     priority = serializers.ChoiceField(choices=Message.PRIORITY_CHOICES)
#     source = serializers.ChoiceField(choices=Message.SOURCE_CHOICES)

#     class Meta:
#         model = Message
#         fields = [
#             'id', 'threadId', 'from_', 'to', 'cc', 'bcc', 'replyTo',
#             'subject', 'content', 'htmlContent', 'timestamp', 'isRead',
#             'isStarred', 'isDraft', 'messageId', 'inReplyTo', 'references',
#             'attachments', 'internalNotes', 'labels', 'priority', 'source',
#         ]

#     def get_replyTo(self, obj):
#         reply_to = getattr(obj, "reply_to", None)
#         if not reply_to:
#             return None
#         if isinstance(reply_to, list) and reply_to:
#             return reply_to[0]
#         if isinstance(reply_to, dict):
#             return reply_to
#         return None

#     def to_representation(self, instance):
#         data = super().to_representation(instance)
#         data['from'] = data.pop('from_', None)
#         return data

#     def create(self, validated_data):
#         # from_email can be dict or string
#         from_email = validated_data.pop('from_email', None)
#         if isinstance(from_email, dict):
#             from_email_value = from_email.get('email')
#         elif isinstance(from_email, str):
#             from_email_value = from_email
#         else:
#             raise serializers.ValidationError({"from_": "from_email is required"})

#         if not from_email_value:
#             raise serializers.ValidationError({"from_": "from_email cannot be empty"})

#         def extract_emails(lst):
#             emails = []
#             for addr in lst:
#                 if isinstance(addr, dict):
#                     emails.append(addr.get('email'))
#                 elif isinstance(addr, str):
#                     emails.append(addr)
#             return emails

#         to_list = extract_emails(validated_data.pop('to', []))
#         cc_list = extract_emails(validated_data.pop('cc', []))
#         bcc_list = extract_emails(validated_data.pop('bcc', []))

#         message = Message.objects.create(
#             from_email=from_email_value,
#             to=to_list,
#             cc=cc_list,
#             bcc=bcc_list,
#             **validated_data
#         )
#         return message
    

class ConversationSerializer(serializers.ModelSerializer):
    participants = EmailAddressSerializer(many=True)
    tags = TagSerializer(many=True, read_only=True)
    lastMessage = MessageSerializer(source='last_message', read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    assignedTo = serializers.PrimaryKeyRelatedField(source='assigned_to', read_only=True)
    assignedBy = serializers.PrimaryKeyRelatedField(source='assigned_by', read_only=True)
    assignedAt = serializers.DateTimeField(source='assigned_at', format='%Y-%m-%dT%H:%M:%SZ', allow_null=True)
    threadId = serializers.CharField(source='thread_id')
    lastActivity = serializers.DateTimeField(source='last_activity', format='%Y-%m-%dT%H:%M:%SZ')
    snoozeUntil = serializers.DateTimeField(source='snooze_until', format='%Y-%m-%dT%H:%M:%SZ', allow_null=True)
    contactId = serializers.UUIDField(source='contact_id', allow_null=True)
    companyId = serializers.UUIDField(source='company_id', allow_null=True)
    sharedInboxId = serializers.UUIDField(source='shared_inbox_id', allow_null=True)
    isArchived = serializers.BooleanField(source='is_archived')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%dT%H:%M:%SZ')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%dT%H:%M:%SZ')

    class Meta:
        model = Conversation
        fields = [
            'id',
            'threadId',
            'subject',
            'participants',
            'tags',
            'assignedTo',
            'assignedBy',
            'assignedAt',
            'status',
            'priority',
            'lastActivity',
            'lastMessage',
            'messages',
            'snoozed',
            'snoozeUntil',
            'channel',
            'contactId',
            'companyId',
            'sharedInboxId',
            'isArchived',
            'createdAt',
            'updatedAt',
        ]

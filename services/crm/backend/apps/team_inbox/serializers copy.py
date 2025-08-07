from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    TeamMember, Inbox, ChannelAccount, Tag, Conversation,
    Message, Attachment, InternalNote, Label, Comment, Task, CalendarEvent
)

User = get_user_model()

class TeamMemberSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'role', 'is_active']

class InboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inbox
        fields = ['id', 'name', 'email', 'created_at']

class ChannelAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelAccount
        fields = [
            'id',
            'email',
            'provider',
            'access_token',
            'refresh_token',
            'expires_in',
            'token_acquired_at',
            'inbox',
            'last_history_id',  
        ]
        read_only_fields = ['id', 'token_acquired_at']

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




class EmailAddressSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = [
            'id', 'filename', 'file_url',
            'mime_type', 'size'
        ]


class InternalNoteSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()

    class Meta:
        model = InternalNote
        fields = [
            'id', 'author', 'content', 'created_at'
        ]


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
    replyTo = EmailAddressSerializer(source='reply_to', required=False, allow_null=True)
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['from'] = data.pop('from_')  # Rename 'from_' back to 'from'
        return data


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

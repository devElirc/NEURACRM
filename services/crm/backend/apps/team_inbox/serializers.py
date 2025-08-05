from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    TeamMember, Inbox, ChannelAccount, Tag,
    Message, Comment, Task, CalendarEvent
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
    inbox = serializers.PrimaryKeyRelatedField(queryset=Inbox.objects.all())

    class Meta:
        model = ChannelAccount
        fields = ['id', 'email', 'provider', 'access_token', 'refresh_token', 'expires_in', 'token_acquired_at', 'inbox']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'is_shared']

class MessageSerializer(serializers.ModelSerializer):
    inbox = serializers.PrimaryKeyRelatedField(queryset=Inbox.objects.all())
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'message_id', 'subject', 'sender', 'recipient', 'body',
            'received_at', 'inbox', 'assigned_to', 'is_read', 'tags', 'snooze_until'
        ]

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

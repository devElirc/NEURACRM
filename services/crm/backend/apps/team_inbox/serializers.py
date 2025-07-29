from rest_framework import serializers
from .models import Message, Tag, Comment, Inbox, Task, CalendarEvent

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'is_shared']

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = serializers.StringRelatedField()
    class Meta:
        model = Task
        fields = ['id', 'title', 'due_date', 'assigned_to']

class CalendarEventSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'start_time', 'end_time', 'created_by']

class MessageSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True)
    comments = CommentSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    calendar_events = CalendarEventSerializer(many=True, read_only=True)
    assigned_to = serializers.StringRelatedField()
    class Meta:
        model = Message
        fields = ['id', 'message_id', 'subject', 'sender', 'recipient', 'body', 'received_at', 'inbox', 'assigned_to', 'is_read', 'tags', 'comments', 'tasks', 'calendar_events', 'snooze_until']

class InboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inbox
        fields = ['id', 'name', 'is_shared']
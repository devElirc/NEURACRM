from django.db import models
from django.conf import settings
from uuid import uuid4

class Inbox(models.Model):
    name = models.CharField(max_length=100)
    is_shared = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50)
    is_shared = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Message(models.Model):
    message_id = models.CharField(max_length=255, unique=True, default=uuid4)
    subject = models.CharField(max_length=255)
    sender = models.CharField(max_length=255)
    recipient = models.CharField(max_length=255)
    body = models.TextField()
    received_at = models.DateTimeField()
    inbox = models.ForeignKey(Inbox, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    is_read = models.BooleanField(default=False)
    tags = models.ManyToManyField(Tag, blank=True)
    snooze_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.subject

class Comment(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user} on {self.message}"

class Task(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    due_date = models.DateTimeField()
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.title

class CalendarEvent(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='calendar_events')
    title = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

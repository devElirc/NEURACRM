import json
import base64
import requests
from datetime import timezone as dt_timezone

from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Services
from ..services.gmail_service import GmailService

# Models
from ..models import (
    TeamMember,
    Inbox,
    ChannelAccount,
    Tag,
    Message,
    Comment,
    Task,
    CalendarEvent
)

# Serializers
from ..serializers import (
    TeamMemberSerializer,
    InboxSerializer,
    ChannelAccountSerializer,
    TagSerializer,
    MessageSerializer,
    CommentSerializer,
    TaskSerializer,
    CalendarEventSerializer
)


from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend



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

        qs = Message.objects.select_related('inbox', 'assigned_to').prefetch_related(
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


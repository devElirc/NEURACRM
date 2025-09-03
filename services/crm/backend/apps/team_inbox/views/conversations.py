from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination

from ..models import Conversation
from ..serializers import ConversationSerializer


# -----------------------------
# Pagination
# -----------------------------
class ConversationPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


# -----------------------------
# Conversation ViewSet
# -----------------------------
class ConversationViewSet(viewsets.ModelViewSet):
    """
    A viewset for listing, retrieving, updating, and managing conversations.
    Supports UUID lookup, partial updates, filtering, search, and ordering.
    """
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ConversationPagination
    filter_backends = [OrderingFilter, SearchFilter]
    ordering_fields = ['last_activity', 'created_at']
    ordering = ['-last_activity']
    search_fields = ['subject', 'participants__email']

    lookup_field = 'id'  # UUID primary key

    def get_queryset(self):
        """
        Filter conversations based on query parameters:
        inbox_id, status, is_archived, assigned, snoozed
        """
        user = self.request.user
        params = self.request.query_params

        queryset = (
            Conversation.objects.all()
            .prefetch_related("tags", "messages", "last_message__labels")
        )

        # Filter by inbox
        inbox_id = params.get("inbox_id")
        if inbox_id:
            queryset = queryset.filter(shared_inbox_id=inbox_id)

        # Filter by status
        status_param = params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by archive state
        archived = params.get("is_archived")
        if archived in ["true", "false"]:
            queryset = queryset.filter(is_archived=(archived == "true"))

        # Filter by assignment
        assigned = params.get("assigned")
        if assigned == "me":
            queryset = queryset.filter(assigned_to=str(user))
        elif assigned == "none":
            queryset = queryset.filter(assigned_to__isnull=True)

        # Filter by snoozed
        snoozed = params.get("snoozed")
        if snoozed == "true":
            queryset = queryset.filter(Q(snoozed=True) | Q(snooze_until__isnull=False))

        return queryset

    def update(self, request, *args, **kwargs):
        """
        Full update of conversation.
        Handles: status, assigned_to (string), assigned_by (string), is_archived, snoozed, snooze_until, tags
        """
        conversation = self.get_object()
        data = request.data

        try:
            # Status
            if 'status' in data:
                conversation.status = data['status']

            # Assigned_to and assigned_by as strings
            if 'assigned_to' in data:
                conversation.assigned_to = data['assigned_to'] or None
            if 'assigned_by' in data:
                conversation.assigned_by = data['assigned_by'] or None

            # Archive
            if 'is_archived' in data:
                conversation.is_archived = bool(data['is_archived'])

            # Snooze
            if 'snoozed' in data:
                conversation.snoozed = bool(data['snoozed'])
            if 'snooze_until' in data:
                conversation.snooze_until = data['snooze_until']

            # Tags
            if 'tags' in data:
                conversation.tags.set(data['tags'])

            conversation.save()

            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to update conversation: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def partial_update(self, request, *args, **kwargs):
        """
        Support PATCH for partial updates.
        Simply delegate to `update`.
        """
        return self.update(request, *args, **kwargs)

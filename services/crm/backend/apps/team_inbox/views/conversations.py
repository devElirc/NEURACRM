from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import OrderingFilter, SearchFilter
from django.contrib.auth import get_user_model
from django.db.models import Q

from ..models import Conversation
from ..serializers import ConversationSerializer

User = get_user_model()


# Optional: Customize pagination
class ConversationPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class ConversationListView(ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ConversationPagination
    filter_backends = [OrderingFilter, SearchFilter]
    ordering_fields = ['last_activity', 'created_at']
    ordering = ['-last_activity']
    search_fields = ['subject', 'participants__email']

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params

        queryset = Conversation.objects.all().select_related(
            'assigned_to', 'assigned_by', 'last_message'
        ).prefetch_related(
            'tags',
            'messages',          
            'last_message__labels'
        )

        inbox_id = params.get("inbox_id")
        if inbox_id:
            queryset = queryset.filter(shared_inbox_id=inbox_id)

        status = params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        archived = params.get("is_archived")
        if archived in ['true', 'false']:
            queryset = queryset.filter(is_archived=(archived == 'true'))

        assigned = params.get("assigned")
        if assigned == "me":
            queryset = queryset.filter(assigned_to=user)
        elif assigned == "none":
            queryset = queryset.filter(assigned_to__isnull=True)

        snoozed = params.get("snoozed")
        if snoozed == "true":
            queryset = queryset.filter(Q(snoozed=True) | Q(snooze_until__isnull=False))

        return queryset

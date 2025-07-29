from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Campaign
from .serializers import CampaignSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    """API ViewSet for Campaign model"""
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

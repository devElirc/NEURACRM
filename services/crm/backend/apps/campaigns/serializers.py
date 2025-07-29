from rest_framework import serializers

from .models import Campaign


class CampaignSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date',
            'budget', 'status', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

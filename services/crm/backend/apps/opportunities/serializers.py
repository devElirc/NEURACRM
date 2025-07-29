from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Deal

User = get_user_model()


class DealSerializer(serializers.ModelSerializer):
    """
    Serializer for Deal model with all fields
    """
    # Read-only fields for display
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    account_name_display = serializers.CharField(source='account.account_name', read_only=True)
    primary_contact_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    def get_primary_contact_name(self, obj):
        """Get full name of primary contact"""
        if obj.primary_contact:
            return f"{obj.primary_contact.first_name} {obj.primary_contact.last_name}".strip()
        return None

    class Meta:
        model = Deal
        fields = [
            'deal_id',
            'tenant',
            'tenant_name',
            'deal_name',
            'stage',
            'amount',
            'close_date',
            'account',
            'account_name',
            'account_name_display',
            'owner',
            'owner_name',
            'deal_owner_alias',
            'primary_contact',
            'primary_contact_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'deal_id',
            'tenant',
            'tenant_name',
            'owner_name',
            'account_name_display',
            'primary_contact_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_account(self, value):
        """
        Validate that account belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Account must belong to the same tenant."
                )
        return value

    def validate_owner(self, value):
        """
        Validate that owner belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            # Check if user is assigned to this tenant
            if not value.tenants.filter(id=request_tenant.id).exists():
                raise serializers.ValidationError(
                    "Owner must be a user in the same tenant."
                )
        return value

    def validate_primary_contact(self, value):
        """
        Validate that primary contact belongs to the same tenant and account
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            
            # Check if contact belongs to same tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Primary contact must belong to the same tenant."
                )
            
            # Check if contact belongs to the deal's account (if account is provided)
            account = self.initial_data.get('account') or (self.instance.account if self.instance else None)
            if account and value.account and value.account.pk != account:
                raise serializers.ValidationError(
                    "Primary contact must belong to the deal's account."
                )
        return value


class DealListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for deal list views
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    account_name_display = serializers.CharField(source='account.account_name', read_only=True)
    primary_contact_name = serializers.SerializerMethodField()

    def get_primary_contact_name(self, obj):
        """Get full name of primary contact"""
        if obj.primary_contact:
            return f"{obj.primary_contact.first_name} {obj.primary_contact.last_name}".strip()
        return None

    class Meta:
        model = Deal
        fields = [
            'deal_id',
            'deal_name',
            'tenant_name',
            'stage',
            'amount',
            'close_date',
            'account_name_display',
            'owner_name',
            'deal_owner_alias',
            'primary_contact_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']


class DealCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new deals
    """
    class Meta:
        model = Deal
        fields = [
            'deal_id',
            'deal_name',
            'stage',
            'amount',
            'close_date',
            'account',
            'account_name',
            'owner',
            'deal_owner_alias',
            'primary_contact',
        ]
        read_only_fields = ['deal_id']

    def validate_account(self, value):
        """
        Validate that account belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Account must belong to the same tenant."
                )
        return value

    def validate_owner(self, value):
        """
        Validate that owner belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            # Check if user is assigned to this tenant
            if not value.tenants.filter(id=request_tenant.id).exists():
                raise serializers.ValidationError(
                    "Owner must be a user in the same tenant."
                )
        return value

    def validate_primary_contact(self, value):
        """
        Validate that primary contact belongs to the same tenant and account
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            
            # Check if contact belongs to same tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Primary contact must belong to the same tenant."
                )
            
            # Check if contact belongs to the deal's account (if account is provided)
            account = self.initial_data.get('account')
            if account and value.account and value.account.pk != account:
                raise serializers.ValidationError(
                    "Primary contact must belong to the deal's account."
                )
        return value


class DealSummarySerializer(serializers.Serializer):
    """
    Serializer for deal summary statistics
    """
    total_deals = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_deal_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    deals_by_stage = serializers.DictField()
    deals_closing_this_month = serializers.IntegerField()
    deals_closing_next_month = serializers.IntegerField()

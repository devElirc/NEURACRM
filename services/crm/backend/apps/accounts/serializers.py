from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Account

User = get_user_model()


class AccountSerializer(serializers.ModelSerializer):
    """
    Serializer for Account model with all fields
    """
    # Read-only fields for display
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    parent_account_name = serializers.CharField(source='parent_account.account_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Account
        fields = [
            'account_id',
            'tenant',
            'tenant_name',
            'account_name',
            'account_owner_alias',
            'description',
            'parent_account',
            'parent_account_name',
            'industry',
            'website',
            'phone',
            'number_of_employees',
            'owner',
            'owner_name',
            'billing_country',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_zip_postal_code',
            'shipping_country',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_zip_postal_code',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'account_id',
            'tenant',
            'tenant_name',
            'owner_name',
            'parent_account_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_parent_account(self, value):
        """
        Validate that parent account belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Parent account must belong to the same tenant."
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


class AccountListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for account list views
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    parent_account_name = serializers.CharField(source='parent_account.account_name', read_only=True)

    class Meta:
        model = Account
        fields = [
            'account_id',
            'account_name',
            'tenant_name',
            'industry',
            'website',
            'phone',
            'number_of_employees',
            'owner_name',
            'parent_account_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']


class AccountCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new accounts
    """
    class Meta:
        model = Account
        fields = [
            'account_id',
            'account_name',
            'account_owner_alias',
            'description',
            'parent_account',
            'industry',
            'website',
            'phone',
            'number_of_employees',
            'owner',
            'billing_country',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_zip_postal_code',
            'shipping_country',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_zip_postal_code',
        ]
        read_only_fields = ['account_id']

    def validate_parent_account(self, value):
        """
        Validate that parent account belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Parent account must belong to the same tenant."
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

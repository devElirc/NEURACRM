from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Contact

User = get_user_model()


class ContactSerializer(serializers.ModelSerializer):
    """
    Serializer for Contact model with all fields
    """
    # Read-only fields for display
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    contact_owner_name = serializers.CharField(source='contact_owner.get_full_name', read_only=True)
    reports_to_name = serializers.CharField(source='reports_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Contact
        fields = [
            'contact_id',
            'tenant',
            'tenant_name',
            'account',
            'account_name',
            'first_name',
            'last_name',
            'title',
            'reports_to',
            'reports_to_name',
            'description',
            'email',
            'phone',
            'mailing_street',
            'mailing_city',
            'mailing_state',
            'mailing_country',
            'postal_code',
            'owner',
            'owner_name',
            'contact_owner',
            'contact_owner_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'contact_id',
            'tenant',
            'tenant_name',
            'account_name',
            'owner_name',
            'contact_owner_name',
            'reports_to_name',
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

    def validate_reports_to(self, value):
        """
        Validate that reports_to contact belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Reports to contact must belong to the same tenant."
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

    def validate_contact_owner(self, value):
        """
        Validate that contact_owner belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            # Check if user is assigned to this tenant
            if not value.tenants.filter(id=request_tenant.id).exists():
                raise serializers.ValidationError(
                    "Contact owner must be a user in the same tenant."
                )
        return value


class ContactListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for contact list views
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'contact_id',
            'first_name',
            'last_name',
            'full_name',
            'title',
            'email',
            'phone',
            'account',
            'account_name',
            'tenant_name',
            'owner_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class ContactCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new contacts
    """
    class Meta:
        model = Contact
        fields = [
            'contact_id',
            'account',
            'first_name',
            'last_name',
            'title',
            'reports_to',
            'description',
            'email',
            'phone',
            'mailing_street',
            'mailing_city',
            'mailing_state',
            'mailing_country',
            'postal_code',
            'owner',
            'contact_owner',
        ]
        read_only_fields = ['contact_id']

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

    def validate_reports_to(self, value):
        """
        Validate that reports_to contact belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Reports to contact must belong to the same tenant."
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

    def validate_contact_owner(self, value):
        """
        Validate that contact_owner belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            # Check if user is assigned to this tenant
            if not value.tenants.filter(id=request_tenant.id).exists():
                raise serializers.ValidationError(
                    "Contact owner must be a user in the same tenant."
                )
        return value

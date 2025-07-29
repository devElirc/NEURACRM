from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Lead

User = get_user_model()


class LeadSerializer(serializers.ModelSerializer):
    """
    Serializer for Lead model with all fields
    """
    # Read-only fields for display
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    account_name = serializers.CharField(source='company.account_name', read_only=True)
    lead_owner_name = serializers.CharField(source='lead_owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'lead_id',
            'tenant',
            'tenant_name',
            'company',
            'company_name',
            'account_name',
            'first_name',
            'last_name',
            'title',
            'website',
            'description',
            'lead_status',
            'score',
            'lead_owner',
            'lead_owner_name',
            'email',
            'phone',
            'street',
            'city',
            'state',
            'country',
            'postal_code',
            'number_of_employees',
            'average_revenue',
            'lead_source',
            'industry',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'lead_id',
            'tenant',
            'tenant_name',
            'company_name',
            'lead_owner_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_company(self, value):
        """
        Validate that company belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Company must belong to the same tenant."
                )
        return value

    def validate_lead_owner(self, value):
        """
        Validate that lead_owner belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            # Check if user is assigned to this tenant
            if not value.tenants.filter(id=request_tenant.id).exists():
                raise serializers.ValidationError(
                    "Lead owner must be a user in the same tenant."
                )
        return value


class LeadListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for lead list views
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    company_name = serializers.SerializerMethodField()
    lead_owner_name = serializers.CharField(source='lead_owner.get_full_name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'lead_id',
            'first_name',
            'last_name',
            'full_name',
            'title',
            'email',
            'phone',
            'company_name',
            'lead_status',
            'score',
            'lead_source',
            'industry',
            'tenant_name',
            'lead_owner',
            'lead_owner_name',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'lead_id',
            'first_name',
            'last_name',
            'full_name',
            'title',
            'email',
            'phone',
            'company_name',
            'lead_status',
            'score',
            'lead_source',
            'industry',
            'tenant_name',
            'lead_owner',
            'lead_owner_name',
            'created_by',
            'created_at',
            'updated_at',
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_company_name(self, obj):
        """
        Get company name from either linked account or text field
        """
        # If lead is converted (has company foreign key), use account name
        if obj.company:
            return obj.company.account_name
        # Otherwise use the text field
        return obj.company_name


class LeadCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new leads
    """
    class Meta:
        model = Lead
        fields = [
            'lead_id',
            'company',
            'company_name',
            'first_name',
            'last_name',
            'title',
            'website',
            'description',
            'lead_status',
            'score',
            'lead_owner',
            'email',
            'phone',
            'street',
            'city',
            'state',
            'country',
            'postal_code',
            'number_of_employees',
            'average_revenue',
            'lead_source',
            'industry',
        ]
        read_only_fields = ['lead_id']

    def validate_company(self, value):
        """
        Validate that company belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            if value.tenant != request_tenant:
                raise serializers.ValidationError(
                    "Company must belong to the same tenant."
                )
        return value

    def validate_lead_owner(self, value):
        """
        Validate that lead_owner belongs to the same tenant
        """
        if value and hasattr(self.context['request'], 'tenant'):
            request_tenant = self.context['request'].tenant
            # Check if user is assigned to this tenant
            if not value.tenants.filter(id=request_tenant.id).exists():
                raise serializers.ValidationError(
                    "Lead owner must be a user in the same tenant."
                )
        return value

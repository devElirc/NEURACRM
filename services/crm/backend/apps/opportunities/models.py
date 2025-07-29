from django import forms
from django.conf import settings
from django.db import connection, models


class TenantDealManager(models.Manager):
    """
    Custom manager for Deal that filters deals by current tenant
    """
    def get_queryset(self):
        """Override to filter by current tenant"""
        queryset = super().get_queryset()

        # If we're in public schema, return all deals (for superadmin)
        if connection.schema_name == 'public':
            return queryset

        # Get current tenant from connection
        current_tenant = getattr(connection, 'tenant', None)
        if current_tenant:
            # Convert FakeTenant to actual Client object
            from apps.core.models import Client
            try:
                actual_tenant = Client.objects.get(schema_name=current_tenant.schema_name)
                return queryset.filter(tenant=actual_tenant)
            except Client.DoesNotExist:
                return queryset.none()

        # If no tenant context, return empty queryset for safety
        return queryset.none()

class Deal(models.Model):
    """Django ORM model for the DEAL table with account name and owner alias."""

    deal_id = models.AutoField(primary_key=True)

    tenant = models.ForeignKey(
        'core.Client',  # or 'yourapp.Client' if in another app
        on_delete=models.CASCADE,
        related_name='deals',
        db_column='tenant_id',
    )

    deal_name = models.CharField(max_length=255)
    stage = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    close_date = models.DateField()

    account = models.ForeignKey(
        'accounts.Account',  # or 'yourapp.Account'
        on_delete=models.CASCADE,
        related_name='deals',
        db_column='account_id',
    )
    account_name = models.CharField(max_length=255, blank=True, null=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_deals',
        db_column='owner_id',
    )
    deal_owner_alias = models.CharField(max_length=100, blank=True, null=True)

    primary_contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='primary_deals',
        db_column='primary_contact_id',
        help_text="Primary contact for this deal"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deals_created',
        db_column='created_by',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deals_updated',
        db_column='updated_by',
    )

    # Custom manager for tenant isolation
    objects = TenantDealManager()

    class Meta:
        db_table = 'deal'
        verbose_name = 'Deal'
        verbose_name_plural = 'Deals'
        ordering = ['-close_date']
        indexes = [
            models.Index(fields=['tenant'], name='idx_deal_tenant'),
            models.Index(fields=['account'], name='idx_deal_account'),
            models.Index(fields=['account_name'], name='idx_deal_account_name'),
            models.Index(fields=['owner'], name='idx_deal_owner'),
            models.Index(fields=['deal_owner_alias'], name='idx_deal_owner_alias'),
            models.Index(fields=['stage'], name='idx_deal_stage'),
            models.Index(fields=['tenant', 'created_at'], name='idx_deal_tenant_created'),
            models.Index(fields=['tenant', 'stage'], name='idx_deal_tenant_stage'),
            models.Index(fields=['tenant', 'close_date'], name='idx_deal_tenant_close_date'),
            models.Index(fields=['tenant', 'amount'], name='idx_deal_tenant_amount'),
            models.Index(fields=['tenant', 'account'], name='idx_deal_tenant_account'),
            models.Index(fields=['tenant', 'owner'], name='idx_deal_tenant_owner'),
            models.Index(fields=['primary_contact'], name='idx_deal_primary_contact'),
            models.Index(fields=['tenant', 'primary_contact'], name='idx_deal_tenant_contact'),
        ]

    def __str__(self):
        return f"{self.deal_name} ({self.stage})"


class DealForm(forms.ModelForm):
    """Form for creating and updating Deal instances, including account name and owner alias."""

    close_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'})
    )

    class Meta:
        model = Deal
        fields = [
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
        widgets = {
            'stage': forms.TextInput(),
            'amount': forms.NumberInput(),
            'account_name': forms.TextInput(),
            'deal_owner_alias': forms.TextInput(),
        }

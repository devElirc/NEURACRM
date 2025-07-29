from django.conf import settings
from django.db import connection, models


class TenantAccountManager(models.Manager):
    """
    Custom manager for Account that filters accounts by current tenant
    """
    def get_queryset(self):
        """Override to filter by current tenant"""
        queryset = super().get_queryset()

        # If we're in public schema, return all accounts (for superadmin)
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

class Account(models.Model):
    account_id = models.AutoField(primary_key=True)

    tenant = models.ForeignKey(
    'core.Client',
    on_delete=models.CASCADE,
    related_name='accounts',
    db_column='tenant_id',
    )


    account_name = models.CharField(max_length=255)
    account_owner_alias = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    parent_account = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_accounts',
        db_column='parent_account_id',
    )

    industry = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    number_of_employees = models.PositiveIntegerField(blank=True, null=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_accounts',
        db_column='owner_id',
    )

    # Billing Address
    billing_country = models.CharField(max_length=100, blank=True, null=True)
    billing_street = models.CharField(max_length=255, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state_province = models.CharField(max_length=100, blank=True, null=True)
    billing_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Shipping Address
    shipping_country = models.CharField(max_length=100, blank=True, null=True)
    shipping_street = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_state_province = models.CharField(max_length=100, blank=True, null=True)
    shipping_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accounts_created',
        db_column='created_by',
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accounts_updated',
        db_column='updated_by',
    )

    # Custom manager for tenant isolation
    objects = TenantAccountManager()

    # Meta & dunder methods
    class Meta:
        db_table = 'account'
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'
        ordering = ['account_name']
        indexes = [
            models.Index(fields=['tenant'], name='idx_account_tenant'),
            models.Index(fields=['owner'], name='idx_account_owner'),
            models.Index(fields=['tenant', 'created_at'], name='idx_account_tenant_created'),
            models.Index(fields=['tenant', 'account_name'], name='idx_account_tenant_name'),
            models.Index(fields=['tenant', 'industry'], name='idx_account_tenant_industry'),
            models.Index(fields=['tenant', 'owner'], name='idx_account_tenant_owner'),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.account_name} (#{self.account_id})"

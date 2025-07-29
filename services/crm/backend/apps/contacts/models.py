from django.conf import settings
from django.db import connection, models


class TenantContactManager(models.Manager):
    """
    Custom manager for Contact that filters contacts by current tenant
    """
    def get_queryset(self):
        """Override to filter by current tenant"""
        queryset = super().get_queryset()

        # If we're in public schema, return all contacts (for superadmin)
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

class Contact(models.Model):
    contact_id = models.AutoField(primary_key=True)

    tenant = models.ForeignKey(
        'core.Client',
        on_delete=models.CASCADE,
        related_name='contacts',
        db_column='tenant_id',
    )

    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts',
        db_column='account_id',
    )
    account_name = models.CharField(max_length=255, blank=True, null=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    title = models.CharField(max_length=100, blank=True, null=True)

    reports_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportees',
        db_column='reports_to_id',
    )

    description = models.TextField(blank=True, null=True)

    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)

    mailing_street = models.CharField(max_length=255, blank=True, null=True)
    mailing_city = models.CharField(max_length=100, blank=True, null=True)
    mailing_state = models.CharField(max_length=100, blank=True, null=True)
    mailing_country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_contacts',
        db_column='owner_id',
    )
    contact_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts_contact_owner',
        db_column='contact_owner_id',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts_created',
        db_column='created_by',
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts_updated',
        db_column='updated_by',
    )

    # Custom manager for tenant isolation
    objects = TenantContactManager()

    class Meta:
        db_table = 'contact'
        verbose_name = 'Contact'
        verbose_name_plural = 'Contacts'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['tenant'], name='idx_contact_tenant'),
            models.Index(fields=['account'], name='idx_contact_account'),
            models.Index(fields=['owner'], name='idx_contact_owner'),
            models.Index(fields=['reports_to'], name='idx_contact_reports_to'),
            models.Index(fields=['tenant', 'created_at'], name='idx_contact_tenant_created'),
            models.Index(fields=['tenant', 'last_name'], name='idx_contact_tenant_lastname'),
            models.Index(fields=['tenant', 'email'], name='idx_contact_tenant_email'),
            models.Index(fields=['tenant', 'account'], name='idx_contact_tenant_account'),
            models.Index(fields=['tenant', 'owner'], name='idx_contact_tenant_owner'),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

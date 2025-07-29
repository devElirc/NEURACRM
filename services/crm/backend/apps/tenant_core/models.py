import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.models import UserManager
from django.db import connection, models

User = get_user_model()


class TenantUserManager(UserManager):
    """
    Custom manager for TenantUser that filters users by current tenant
    """
    def get_queryset(self):
        """Override to filter by current tenant schema"""
        queryset = super().get_queryset()

        # If we're in public schema, return all users (for superadmin)
        if connection.schema_name == 'public':
            return queryset

        # Get current tenant from connection
        current_tenant = getattr(connection, 'tenant', None)
        if current_tenant:
            # Filter users who belong to current tenant
            return queryset.filter(tenants__schema_name=current_tenant.schema_name)

        # If no tenant context, return empty queryset for safety
        return queryset.none()

    def all_users(self):
        """Method to get all users regardless of tenant (for superadmin use)"""
        return super().get_queryset()


class TenantUser(User):
    """
    Proxy model for tenant-specific user operations
    Provides tenant-scoped methods and better admin organization
    """
    objects = TenantUserManager()

    class Meta:
        proxy = True
        verbose_name = "Tenant User"
        verbose_name_plural = "Tenant Users"

    def get_tenant_roles(self):
        """Get roles in current tenant context"""
        return self.tenant_user_roles.filter(is_active=True)

    def assign_role(self, role, assigned_by=None):
        """Assign role in current tenant"""
        return UserRole.objects.create(
            user=self, role=role, assigned_by=assigned_by
        )

    def remove_role(self, role):
        """Remove role from user in current tenant"""
        user_role = self.tenant_user_roles.filter(role=role, is_active=True).first()
        if user_role:
            user_role.is_active = False
            user_role.save()
            return True
        return False

    def has_role(self, role_name):
        """Check if user has specific role in current tenant"""
        return self.tenant_user_roles.filter(
            role__name=role_name, is_active=True
        ).exists()

    def has_permission(self, permission):
        """Check if user has specific permission in current tenant"""
        for user_role in self.get_tenant_roles():
            role_permissions = user_role.role.permissions or {}
            if role_permissions.get(permission) is True:
                return True
        return False

    def get_tenant_permissions(self):
        """Get all permissions for user in current tenant"""
        permissions = set()
        for user_role in self.get_tenant_roles():
            role_permissions = user_role.role.permissions or {}
            for perm, value in role_permissions.items():
                if value is True:
                    permissions.add(perm)
        return list(permissions)


class Role(models.Model):
    """
    Custom role model for RBAC - TENANT SPECIFIC
    """
    ROLE_TYPES = [
        ("admin", "Admin"),
        ("manager", "Manager"),
        ("sales", "Sales Representative"),
        ("support", "Support"),
        ("viewer", "Viewer"),
        ("custom", "Custom"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    role_type = models.CharField(max_length=20, choices=ROLE_TYPES)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["name", "role_type"]
        indexes = [
            models.Index(fields=['role_type'], name='idx_role_type'),
            models.Index(fields=['is_active'], name='idx_role_active'),
            models.Index(fields=['created_at'], name='idx_role_created'),
        ]

    def __str__(self):
        return f"{self.name} ({self.role_type})"


class UserRole(models.Model):
    """
    User-Role relationship model - TENANT SPECIFIC
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tenant_user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="tenant_role_users")
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="tenant_assigned_roles"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["user", "role"]
        indexes = [
            models.Index(fields=['user'], name='idx_userrole_user'),
            models.Index(fields=['role'], name='idx_userrole_role'),
            models.Index(fields=['is_active'], name='idx_userrole_active'),
            models.Index(fields=['assigned_at'], name='idx_userrole_assigned'),
            models.Index(fields=['user', 'is_active'], name='idx_userrole_user_active'),
            models.Index(fields=['role', 'is_active'], name='idx_userrole_role_active'),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role.name}"


class AuditLog(models.Model):
    """
    Audit log model for tracking changes - TENANT SPECIFIC
    """
    ACTION_TYPES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("access", "Access"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="tenant_audit_logs")
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=['user'], name='idx_auditlog_user'),
            models.Index(fields=['action'], name='idx_auditlog_action'),
            models.Index(fields=['model_name'], name='idx_auditlog_model'),
            models.Index(fields=['timestamp'], name='idx_auditlog_timestamp'),
            models.Index(fields=['user', 'timestamp'], name='idx_auditlog_user_timestamp'),
            models.Index(fields=['action', 'timestamp'], name='idx_auditlog_action_timestamp'),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} - {self.timestamp}"

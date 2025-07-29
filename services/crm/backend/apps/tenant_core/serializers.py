from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import AuditLog, Role, TenantUser, UserRole

# Define allowed tenant permissions to prevent privilege escalation
ALLOWED_TENANT_PERMISSIONS = {
    'all', 'manage_team', 'manage_opportunities', 'manage_leads', 'manage_contacts',
    'manage_tickets', 'view_customers', 'manage_knowledge_base', 'view_only',
    'manage_accounts', 'manage_campaigns', 'manage_reports', 'manage_settings'
}

# System-level permissions that should never be granted to tenant roles
FORBIDDEN_PERMISSIONS = {
    'manage_system', 'manage_all_tenants', 'superadmin', 'create_tenants',
    'delete_tenants', 'system_admin'
}

def validate_role_permissions(permissions):
    """Validate that role permissions are within allowed scope"""
    if not isinstance(permissions, dict):
        raise serializers.ValidationError("Permissions must be a dictionary")

    for permission_name, permission_value in permissions.items():
        if permission_name in FORBIDDEN_PERMISSIONS:
            raise serializers.ValidationError(
                f"Permission '{permission_name}' is not allowed for tenant roles"
            )
        if permission_name not in ALLOWED_TENANT_PERMISSIONS:
            raise serializers.ValidationError(
                f"Permission '{permission_name}' is not a valid tenant permission"
            )
        if not isinstance(permission_value, bool):
            raise serializers.ValidationError(
                f"Permission '{permission_name}' must be a boolean value"
            )
    return permissions

User = get_user_model()


class TenantUserSerializer(serializers.ModelSerializer):
    """
    Tenant-specific user serializer with additional metadata
    """
    full_name = serializers.CharField(read_only=True)
    roles = serializers.SerializerMethodField()
    role_count = serializers.SerializerMethodField()
    last_login_display = serializers.SerializerMethodField()
    tenant_permissions = serializers.SerializerMethodField()

    class Meta:
        model = TenantUser
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "phone", "is_active", "roles", "role_count", "tenant_permissions",
            "last_login_display", "created_at", "updated_at"
        ]

    def get_roles(self, obj):
        """Get user roles in current tenant"""
        user_roles = obj.get_tenant_roles()
        return [
            {
                "id": ur.role.id,
                "name": ur.role.name,
                "role_type": ur.role.role_type,
                "assigned_at": ur.assigned_at
            }
            for ur in user_roles
        ]

    def get_role_count(self, obj):
        """Get number of roles assigned to user"""
        return obj.get_tenant_roles().count()

    def get_last_login_display(self, obj):
        """Get formatted last login"""
        if obj.last_login:
            return obj.last_login.strftime("%Y-%m-%d %H:%M:%S")
        return "Never"

    def get_tenant_permissions(self, obj):
        """Get all permissions for user in current tenant"""
        return obj.get_tenant_permissions()


class TenantUserCreateSerializer(serializers.ModelSerializer):
    """
    Tenant user creation serializer with password handling
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = TenantUser
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "phone", "is_active", "full_name",
            "password", "confirm_password", "created_at", "updated_at"
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "username": {"required": False},
        }

    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError("Passwords do not match")
        return attrs

    def create(self, validated_data):
        """Create user with password hashing"""
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")

        # Auto-generate username if not provided
        if not validated_data.get('username'):
            email_part = validated_data['email'].split('@')[0]
            # Try to get tenant from request context
            request = self.context.get('request')
            if request:
                current_tenant = getattr(request, 'tenant', None)
                if current_tenant and current_tenant.schema_name != 'public':
                    validated_data['username'] = f"{email_part}_{current_tenant.schema_name}"
                else:
                    validated_data['username'] = email_part
            else:
                validated_data['username'] = email_part

        user = TenantUser.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class TenantUserUpdateSerializer(serializers.ModelSerializer):
    """
    Tenant user update serializer without password requirements
    """
    full_name = serializers.CharField(read_only=True)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = TenantUser
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "phone", "is_active", "roles", "updated_at"
        ]

    def get_roles(self, obj):
        """Get user roles in current tenant"""
        user_roles = obj.get_tenant_roles()
        return [
            {
                "id": ur.role.id,
                "name": ur.role.name,
                "role_type": ur.role.role_type,
                "assigned_at": ur.assigned_at
            }
            for ur in user_roles
        ]


class RoleSerializer(serializers.ModelSerializer):
    """
    Role serializer with tenant isolation
    """
    user_count = serializers.SerializerMethodField()
    permission_list = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id", "name", "role_type", "description", "permissions",
            "permission_list", "is_active", "user_count", "created_at", "updated_at"
        ]

    def get_user_count(self, obj):
        """Get count of users with this role"""
        return obj.tenant_role_users.filter(is_active=True).count()

    def get_permission_list(self, obj):
        """Get list of permissions granted by this role"""
        if obj.permissions:
            # Handle both list and dict formats for backward compatibility
            if isinstance(obj.permissions, list):
                return obj.permissions
            elif isinstance(obj.permissions, dict):
                return [perm for perm, value in obj.permissions.items() if value is True]
        return []

    def validate_permissions(self, value):
        """Validate that role permissions are within allowed scope"""
        return validate_role_permissions(value)


class UserRoleSerializer(serializers.ModelSerializer):
    """
    User role serializer with tenant isolation
    """
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_type = serializers.CharField(source="role.role_type", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.full_name", read_only=True)

    class Meta:
        model = UserRole
        fields = [
            "id", "user", "role", "user_name", "user_email",
            "role_name", "role_type", "assigned_at", "assigned_by",
            "assigned_by_name", "is_active"
        ]

    def validate(self, attrs):
        """Validate user role assignment"""
        user = attrs.get('user')
        role = attrs.get('role')

        # Check if user already has this role
        existing_assignment = UserRole.objects.filter(
            user=user, role=role, is_active=True
        ).first()

        if existing_assignment:
            raise serializers.ValidationError(
                f"User {user.email} already has role {role.name}"
            )

        return attrs


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Audit log serializer with tenant isolation
    """
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id", "user", "user_name", "user_email", "action", "action_display",
            "model_name", "object_id", "changes", "ip_address", "user_agent", "timestamp"
        ]


class TenantUserRoleAssignmentSerializer(serializers.Serializer):
    """
    Serializer for bulk role assignments
    """
    user_id = serializers.UUIDField()
    role_ids = serializers.ListField(child=serializers.UUIDField())

    def validate_user_id(self, value):
        """Validate user exists in current tenant"""
        request = self.context.get('request')
        if request:
            current_tenant = getattr(request, 'tenant', None)
            if current_tenant and current_tenant.schema_name != 'public':
                if not TenantUser.objects.filter(
                    id=value, tenants__schema_name=current_tenant.schema_name
                ).exists():
                    raise serializers.ValidationError("User not found in current tenant")
        return value

    def validate_role_ids(self, value):
        """Validate roles exist"""
        existing_roles = Role.objects.filter(id__in=value, is_active=True)
        if len(existing_roles) != len(value):
            raise serializers.ValidationError("Some roles not found or inactive")
        return value


class TenantUserPermissionSerializer(serializers.Serializer):
    """
    Serializer for checking user permissions
    """
    user_id = serializers.UUIDField()
    permission = serializers.CharField()

    def validate_user_id(self, value):
        """Validate user exists in current tenant"""
        request = self.context.get('request')
        if request:
            current_tenant = getattr(request, 'tenant', None)
            if current_tenant and current_tenant.schema_name != 'public':
                if not TenantUser.objects.filter(
                    id=value, tenants__schema_name=current_tenant.schema_name
                ).exists():
                    raise serializers.ValidationError("User not found in current tenant")
        return value

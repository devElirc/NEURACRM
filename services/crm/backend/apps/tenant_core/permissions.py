from rest_framework import permissions


class IsTenantUser(permissions.BasePermission):
    """
    Permission to check if user belongs to current tenant
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Always allow superadmin
        if request.user.is_superadmin:
            return True

        # Check if user belongs to current tenant
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            return request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists()

        return False


class CanManageUsers(permissions.BasePermission):
    """
    Permission to manage users in current tenant
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Check if user belongs to current tenant (including superadmin)
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists():
                return False

        # Allow superadmin after tenant check
        if request.user.is_superadmin:
            return True

        # Check if user has permission to manage users
        return self._has_tenant_permission(request.user, 'manage_team')

    def _has_tenant_permission(self, user, permission):
        """Check if user has specific permission in current tenant"""
        try:
            user_roles = user.tenant_user_roles.filter(is_active=True)
            for user_role in user_roles:
                role_permissions = user_role.role.permissions or []
                if permission in role_permissions or 'all' in role_permissions:
                    return True
            return False
        except Exception:
            return False


class CanManageRoles(permissions.BasePermission):
    """
    Permission to manage roles in current tenant
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Check if user belongs to current tenant (including superadmin)
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists():
                return False

        # Allow superadmin after tenant check
        if request.user.is_superadmin:
            return True

        # Check if user has admin or management permissions
        return self._has_tenant_permission(request.user, ['all', 'manage_settings'])

    def _has_tenant_permission(self, user, permissions):
        """Check if user has any of the specified permissions in current tenant"""
        try:
            user_roles = user.tenant_user_roles.filter(is_active=True)
            for user_role in user_roles:
                role_permissions = user_role.role.permissions or []
                for permission in permissions:
                    if permission in role_permissions:
                        return True
            return False
        except Exception:
            return False


class CanViewAuditLogs(permissions.BasePermission):
    """
    Permission to view audit logs in current tenant
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Check if user belongs to current tenant (including superadmin)
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists():
                return False

        # Allow superadmin after tenant check
        if request.user.is_superadmin:
            return True

        # Check if user has admin permissions
        return self._has_tenant_permission(request.user, ['all', 'manage_settings'])

    def _has_tenant_permission(self, user, permissions):
        """Check if user has any of the specified permissions in current tenant"""
        try:
            user_roles = user.tenant_user_roles.filter(is_active=True)
            for user_role in user_roles:
                role_permissions = user_role.role.permissions or []
                for permission in permissions:
                    if permission in role_permissions:
                        return True
            return False
        except Exception:
            return False


class TenantAdminRequired(permissions.BasePermission):
    """
    Permission that requires tenant admin role
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Check if user belongs to current tenant (including superadmin)
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists():
                return False

        # Allow superadmin after tenant check
        if request.user.is_superadmin:
            return True

        # Check if user has admin role
        try:
            return request.user.tenant_user_roles.filter(
                role__role_type='admin',
                is_active=True
            ).exists()
        except Exception:
            return False


class TenantManagerRequired(permissions.BasePermission):
    """
    Permission that requires tenant manager role or higher
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Check if user belongs to current tenant (including superadmin)
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists():
                return False

        # Allow superadmin after tenant check
        if request.user.is_superadmin:
            return True

        # Check if user has admin or manager role
        try:
            return request.user.tenant_user_roles.filter(
                role__role_type__in=['admin', 'manager'],
                is_active=True
            ).exists()
        except Exception:
            return False


class HasTenantPermission(permissions.BasePermission):
    """
    Generic permission class that checks for specific tenant permissions
    Usage: permission_classes = [HasTenantPermission]
    Set required_permissions on the view class
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Check if user belongs to current tenant (including superadmin)
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists():
                return False

        # Allow superadmin after tenant check
        if request.user.is_superadmin:
            return True

        # Get required permissions from view
        required_permissions = getattr(view, 'required_permissions', [])
        if not required_permissions:
            return True  # No specific permissions required

        # Check if user has any of the required permissions
        return self._has_any_tenant_permission(request.user, required_permissions)

    def _has_any_tenant_permission(self, user, permissions):
        """Check if user has any of the specified permissions in current tenant"""
        try:
            user_roles = user.tenant_user_roles.filter(is_active=True)

            # If user has no roles but is a valid tenant member, allow basic viewing permissions
            if not user_roles.exists():
                # Allow basic viewing permissions for users without roles
                basic_permissions = ['view_customers', 'view_only']
                for permission in permissions:
                    if permission in basic_permissions:
                        return True

            # Check assigned role permissions
            for user_role in user_roles:
                role_permissions = user_role.role.permissions or []
                for permission in permissions:
                    if permission in role_permissions:
                        return True
            return False
        except Exception:
            return False


class IsOwnerOrTenantAdmin(permissions.BasePermission):
    """
    Permission that allows owners of objects or tenant admins to access
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Check if user belongs to current tenant (including superadmin)
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not request.user.tenants.filter(
                schema_name=current_tenant.schema_name
            ).exists():
                return False

        # Allow superadmin after tenant check
        if request.user.is_superadmin:
            return True

        # Check if user is owner of the object
        if hasattr(obj, 'user') and obj.user == request.user:
            return True

        # Check if user is tenant admin
        try:
            return request.user.tenant_user_roles.filter(
                role__role_type='admin',
                is_active=True
            ).exists()
        except Exception:
            return False

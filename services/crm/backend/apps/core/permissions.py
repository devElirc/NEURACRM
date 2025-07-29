from django.contrib.auth import get_user_model
from rest_framework import permissions

User = get_user_model()


class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow superadmins to access.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.is_superadmin
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        return (
            request.user.is_authenticated and
            (request.user.is_superadmin or self.is_admin(request.user))
        )

    def is_admin(self, user):
        """Check if user has admin role"""
        return user.tenant_user_roles.filter(
            role__role_type="admin",
            is_active=True
        ).exists()


class HasModulePermission(permissions.BasePermission):
    """
    Custom permission to check if user has permission for specific module.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superadmin:
            return True

        # Get module name from view
        module_name = getattr(view, 'module_name', None)
        if not module_name:
            return False

        # Check if user has permission for this module
        return self.has_module_permission(request.user, module_name, request.method)

    def has_module_permission(self, user, module_name, method):
        """Check if user has permission for specific module and action"""
        user_roles = user.tenant_user_roles.filter(is_active=True)

        for user_role in user_roles:
            role_permissions = user_role.role.permissions
            module_permissions = role_permissions.get(module_name, {})

            if method in permissions.SAFE_METHODS:
                if module_permissions.get('read', False):
                    return True
            else:
                if method == 'POST' and module_permissions.get('create', False):
                    return True
                elif method in ['PUT', 'PATCH'] and module_permissions.get('update', False):
                    return True
                elif method == 'DELETE' and module_permissions.get('delete', False):
                    return True

        return False


class CanManageUsers(permissions.BasePermission):
    """
    Custom permission to check if user can manage other users.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superadmin:
            return True

        # Check if user has admin or manager role
        return request.user.tenant_user_roles.filter(
            role__role_type__in=["admin", "manager"],
            is_active=True
        ).exists()


class CanManageRoles(permissions.BasePermission):
    """
    Custom permission to check if user can manage roles.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superadmin:
            return True

        # Only admins can manage roles
        return request.user.tenant_user_roles.filter(
            role__role_type="admin",
            is_active=True
        ).exists()

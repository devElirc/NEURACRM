from django.contrib.auth import get_user_model
from django.db import connection

from .models import AuditLog, Role, TenantUser, UserRole

User = get_user_model()


def create_audit_log(user, action, model_name, object_id, changes=None, request=None):
    """
    Create audit log entry for tenant-specific actions
    """
    try:
        # Skip if we're in public schema
        if connection.schema_name == 'public':
            return None

        # Get IP address and user agent from request
        ip_address = None
        user_agent = ""

        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit length

        # Create audit log entry
        audit_log = AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=object_id,
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return audit_log

    except Exception as e:
        # Log the error but don't fail the main operation
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to create audit log: {e}")
        return None


def get_client_ip(request):
    """
    Get client IP address from request headers
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_tenant_user_roles(user):
    """
    Get all roles for a user in current tenant
    """
    try:
        return user.tenant_user_roles.filter(is_active=True).select_related('role')
    except Exception:
        return []


def get_tenant_user_permissions(user):
    """
    Get all permissions for a user in current tenant
    """
    permissions = set()

    try:
        user_roles = get_tenant_user_roles(user)
        for user_role in user_roles:
            role_permissions = user_role.role.permissions or {}
            for perm, value in role_permissions.items():
                if value is True:
                    permissions.add(perm)
    except Exception:
        pass

    return list(permissions)


def check_tenant_permission(user, permission):
    """
    Check if user has specific permission in current tenant
    """
    try:
        user_roles = get_tenant_user_roles(user)
        for user_role in user_roles:
            role_permissions = user_role.role.permissions or {}
            if role_permissions.get(permission) is True or role_permissions.get('all') is True:
                return True
        return False
    except Exception:
        return False


def assign_user_to_role(user, role, assigned_by=None):
    """
    Assign a user to a role in current tenant
    """
    try:
        # Check if user already has this role
        existing_assignment = UserRole.objects.filter(
            user=user, role=role, is_active=True
        ).first()

        if existing_assignment:
            return existing_assignment, False  # Already assigned

        # Create new assignment
        user_role = UserRole.objects.create(
            user=user,
            role=role,
            assigned_by=assigned_by
        )

        return user_role, True  # Newly assigned

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to assign user to role: {e}")
        return None, False


def remove_user_from_role(user, role):
    """
    Remove a user from a role in current tenant
    """
    try:
        user_role = UserRole.objects.filter(
            user=user, role=role, is_active=True
        ).first()

        if user_role:
            user_role.is_active = False
            user_role.save()
            return True

        return False  # Role not found

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to remove user from role: {e}")
        return False


def get_tenant_users_with_role(role):
    """
    Get all users with a specific role in current tenant
    """
    try:
        user_roles = UserRole.objects.filter(
            role=role, is_active=True
        ).select_related('user')

        return [ur.user for ur in user_roles]

    except Exception:
        return []


def get_tenant_roles_for_user(user):
    """
    Get all roles for a user in current tenant with detailed info
    """
    try:
        user_roles = UserRole.objects.filter(
            user=user, is_active=True
        ).select_related('role', 'assigned_by')

        return [
            {
                'role': ur.role,
                'assigned_at': ur.assigned_at,
                'assigned_by': ur.assigned_by,
                'permissions': ur.role.permissions or {}
            }
            for ur in user_roles
        ]

    except Exception:
        return []


def create_default_tenant_roles():
    """
    Create default roles for a new tenant
    """
    default_roles = [
        {
            'name': 'Admin',
            'role_type': 'admin',
            'description': 'Full access to all features',
            'permissions': {
                'all': True
            }
        },
        {
            'name': 'Manager',
            'role_type': 'manager',
            'description': 'Team and opportunity management',
            'permissions': {
                'manage_team': True,
                'manage_opportunities': True,
                'manage_leads': True,
                'manage_contacts': True,
                'view_customers': True,
                'manage_reports': True
            }
        },
        {
            'name': 'Sales Representative',
            'role_type': 'sales',
            'description': 'Sales operations',
            'permissions': {
                'manage_leads': True,
                'manage_contacts': True,
                'manage_opportunities': True,
                'view_customers': True
            }
        },
        {
            'name': 'Support Agent',
            'role_type': 'support',
            'description': 'Customer support',
            'permissions': {
                'manage_tickets': True,
                'manage_knowledge_base': True,
                'view_customers': True
            }
        },
        {
            'name': 'Viewer',
            'role_type': 'viewer',
            'description': 'Read-only access',
            'permissions': {
                'view_only': True,
                'view_customers': True
            }
        }
    ]

    created_roles = []

    for role_data in default_roles:
        try:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                role_type=role_data['role_type'],
                defaults={
                    'description': role_data['description'],
                    'permissions': role_data['permissions']
                }
            )
            created_roles.append(role)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create role {role_data['name']}: {e}")

    return created_roles


def get_tenant_statistics():
    """
    Get statistics for current tenant
    """
    try:
        # Skip if we're in public schema
        if connection.schema_name == 'public':
            return {}

        current_tenant = getattr(connection, 'tenant', None)
        if not current_tenant:
            return {}

        # Get tenant users
        tenant_users = TenantUser.objects.filter(
            tenants__schema_name=current_tenant.schema_name
        )

        stats = {
            'tenant_name': current_tenant.name,
            'tenant_schema': current_tenant.schema_name,
            'total_users': tenant_users.count(),
            'active_users': tenant_users.filter(is_active=True).count(),
            'total_roles': Role.objects.filter(is_active=True).count(),
            'total_user_roles': UserRole.objects.filter(is_active=True).count(),
            'recent_audit_logs': AuditLog.objects.count()
        }

        return stats

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to get tenant statistics: {e}")
        return {}


def cleanup_inactive_user_roles():
    """
    Clean up inactive user roles (maintenance function)
    """
    try:
        # Find user roles where user is inactive
        inactive_user_roles = UserRole.objects.filter(
            user__is_active=False,
            is_active=True
        )

        count = inactive_user_roles.count()
        inactive_user_roles.update(is_active=False)

        return count

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to cleanup inactive user roles: {e}")
        return 0


def validate_tenant_schema():
    """
    Validate that we're in a proper tenant schema
    """
    if connection.schema_name == 'public':
        raise ValueError("This operation is not allowed in public schema")

    return True


def get_tenant_context():
    """
    Get current tenant context information
    """
    try:
        schema_name = connection.schema_name
        tenant = getattr(connection, 'tenant', None)

        return {
            'schema_name': schema_name,
            'tenant': tenant,
            'is_public': schema_name == 'public',
            'tenant_name': tenant.name if tenant else None
        }

    except Exception:
        return {
            'schema_name': 'unknown',
            'tenant': None,
            'is_public': True,
            'tenant_name': None
        }

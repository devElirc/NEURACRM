# This file contains configuration for the default Django admin site
#
# IMPORTANT: The default admin site should ONLY be accessed via tenant domains like:
# - demo.localhost:8000/admin/
# - yourcompany.localhost:8000/admin/
#
# User management is handled in super_admin_site (/superadmin/)
# Tenant-specific models (Role, UserRole, AuditLog) are in tenant_core/admin.py

from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()

# Unregister the core User model from default admin site to prevent URL conflicts
# The User model should only be accessible via super_admin_site (/superadmin/)
# Tenant users are managed via TenantUser proxy model in tenant_core/admin.py
if admin.site.is_registered(User):
    admin.site.unregister(User)


def dashboard_callback(request, context):
    """
    Dashboard callback for Django Unfold
    """
    # Add custom dashboard data based on request context
    tenant = getattr(request, 'tenant', None)
    tenant_name = tenant.name if tenant else "System"

    context.update({
        "title": f"NeuraCRM Dashboard - {tenant_name}",
        "subtitle": "Multi-tenant CRM Administration",
        "current_tenant": tenant_name,
    })
    return context

from django.urls import path

from . import views

urlpatterns = [
    # Tenant Users Management
    path("users/", views.TenantUserListCreateView.as_view(), name="tenant_user_list"),
    path("users/<uuid:pk>/", views.TenantUserDetailView.as_view(), name="tenant_user_detail"),
    path("users/enhanced/", views.TenantUserEnhancedListView.as_view(), name="tenant_user_enhanced_list"),

    # Roles Management
    path("roles/", views.RoleListCreateView.as_view(), name="tenant_role_list"),
    path("roles/<uuid:pk>/", views.RoleDetailView.as_view(), name="tenant_role_detail"),

    # User Roles Management
    path("user-roles/", views.UserRoleListCreateView.as_view(), name="tenant_user_role_list"),
    path("user-roles/<uuid:pk>/", views.UserRoleDetailView.as_view(), name="tenant_user_role_detail"),

    # Audit Logs
    path("audit/", views.AuditLogListView.as_view(), name="tenant_audit_list"),

    # Dashboard
    path("dashboard/", views.tenant_dashboard_stats, name="tenant_dashboard_stats"),
    path("admin-dashboard/", views.tenant_admin_dashboard, name="tenant_admin_dashboard"),
    path("user-dashboard/", views.user_dashboard, name="user_dashboard"),

    # Lead Owner Selection
    path("eligible-lead-owners/", views.eligible_lead_owners, name="eligible_lead_owners"),
]

from django.urls import path

from . import tenant_views, views

urlpatterns = [
    # Authentication
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("refresh/", views.RefreshTokenView.as_view(), name="refresh"),

    # Profile
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("password/change/", views.PasswordChangeView.as_view(), name="password_change"),

    # Dashboard
    path("dashboard/stats/", views.DashboardStatsView.as_view(), name="dashboard_stats"),

    # Tenant Management (Super Admin Only)
    path("tenants/create/", tenant_views.create_tenant, name="create_tenant"),
    path("tenants/", tenant_views.list_tenants, name="list_tenants"),
]

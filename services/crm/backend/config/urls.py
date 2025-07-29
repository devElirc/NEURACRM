from django.conf import settings
from django.conf.urls.static import static
from django.db import connection
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import include, path

from apps.core.super_admin import super_admin_site
from apps.tenant_core.admin import tenant_admin_site
from apps.core.views import LoginView


def debug_view(request):
    schema = getattr(connection, 'schema_name', 'unknown')
    tenant = getattr(request, 'tenant', None)
    tenant_name = tenant.name if tenant else 'None'
    tenant_schema = tenant.schema_name if tenant else 'None'

    return HttpResponse(f"""
    Host: {request.get_host()}
    Schema: {schema}
    Tenant: {tenant_name}
    Tenant Schema: {tenant_schema}
    HTTP_HOST: {request.META.get('HTTP_HOST', 'None')}
    """)

def root_redirect(request):
    """
    Handle root URL requests based on tenant context
    """
    tenant = getattr(request, 'tenant', None)

    if tenant:
        if tenant.schema_name == 'public':
            # Public schema - redirect to superadmin
            return HttpResponseRedirect('/superadmin/')
        else:
            # Tenant schema - redirect to tenant admin
            return HttpResponseRedirect('/admin/')
    else:
        # No tenant resolved - redirect to debug info
        return HttpResponseRedirect('/debug/')

urlpatterns = [
    path("", root_redirect, name="root"),  # Root URL handler
    path("debug/", debug_view),
    path("admin/", tenant_admin_site.urls),  # Tenant admin with proper tenant isolation
    path("superadmin/", super_admin_site.urls),  # Super admin with Client/Domain access (public schema only)
    path("api/auth/", include("apps.core.urls")),  # Core authentication
    path("api/tenant/", include("apps.tenant_core.urls")),  # Tenant management
    path("api/leads/", include("apps.leads.urls")),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/contacts/", include("apps.contacts.urls")),
    path("api/opportunities/", include("apps.opportunities.urls")),
    path("api/subscriptions/", include("apps.subscriptions.urls")),
    path("api/campaigns/", include("apps.campaigns.urls")),
    path("api/inbox/", include("apps.team_inbox.urls")),
    path("api/token/", LoginView.as_view(), name="token_obtain_pair"),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # JWT token refresh
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns

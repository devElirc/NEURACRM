from django.http import Http404, HttpResponse
from django.template import Context, Template


class SuperAdminAccessMiddleware:
    """
    Middleware to restrict superadmin access to public schema only
    and ensure only superadmins can access it
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if accessing superadmin from tenant schema
        if request.path.startswith('/superadmin/'):
            tenant = getattr(request, 'tenant', None)

            # Block access from tenant schemas (not public)
            if tenant and tenant.schema_name != 'public':
                raise Http404("Superadmin interface not available for tenant schemas")

        # Process the request (this will run remaining middleware including AuthenticationMiddleware)
        response = self.get_response(request)
        return response


class InactiveTenantMiddleware:
    """
    Middleware to block access to inactive tenants
    
    This middleware should be placed after TenantMiddleware in settings.MIDDLEWARE
    to ensure tenant resolution happens first.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if tenant is resolved and inactive
        if hasattr(request, 'tenant'):
            tenant = request.tenant

            # Allow access to public schema (superadmin)
            if tenant.schema_name == 'public':
                return self.get_response(request)

            # Block access to inactive tenants
            if not tenant.is_active:
                return self._render_inactive_page(request, tenant)

        return self.get_response(request)

    def _render_inactive_page(self, request, tenant):
        """Render a user-friendly inactive tenant page"""
        template_content = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Service Temporarily Unavailable</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    background: white;
                    padding: 3rem 2rem;
                    border-radius: 16px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 500px;
                }
                .icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                h1 {
                    color: #1f2937;
                    margin-bottom: 1rem;
                    font-size: 1.875rem;
                    font-weight: 700;
                }
                p {
                    color: #6b7280;
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }
                .tenant-info {
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                }
                .contact-info {
                    font-size: 0.875rem;
                    color: #9ca3af;
                    margin-top: 2rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">🚫</div>
                <h1>Service Temporarily Unavailable</h1>
                <p>This tenant service is currently inactive and cannot be accessed.</p>
                
                <div class="tenant-info">
                    <strong>{{ tenant_name }}</strong><br>
                    <small>Domain: {{ domain }}</small>
                </div>
                
                <p>If you believe this is an error, please contact your system administrator.</p>
                
                <div class="contact-info">
                    Status: Inactive | Error Code: 503
                </div>
            </div>
        </body>
        </html>
        """

        template = Template(template_content)
        context = Context({
            'tenant_name': tenant.name,
            'domain': request.get_host(),
        })

        return HttpResponse(
            template.render(context),
            status=503,
            content_type='text/html'
        )

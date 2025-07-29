import re

from django import forms
from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from unfold.sites import UnfoldAdminSite

from .models import Client, Domain


class ClientAdminForm(forms.ModelForm):
    """Custom form for Client admin with better validation"""

    # Additional fields for admin user creation (only for new clients)
    admin_email = forms.EmailField(
        required=False,
        help_text='Email for the tenant admin user (required only for new clients)'
    )
    admin_password = forms.CharField(
        widget=forms.PasswordInput,
        required=False,
        min_length=8,
        help_text='Password for the tenant admin user (required only for new clients)'
    )
    admin_first_name = forms.CharField(
        max_length=150,
        required=False,
        help_text='First name for the tenant admin user (required only for new clients)'
    )
    admin_last_name = forms.CharField(
        max_length=150,
        required=False,
        help_text='Last name for the tenant admin user (required only for new clients)'
    )
    create_domain = forms.BooleanField(
        required=False,
        initial=True,
        help_text='Automatically create [company].localhost domain (only for new clients)'
    )

    class Meta:
        model = Client
        fields = '__all__'
        help_texts = {
            'name': 'Company name (e.g., "Acme Corporation")',
            'schema_name': 'Database schema name: lowercase, underscores only, no spaces/hyphens (e.g., "acme_corp")',
        }

    def clean_schema_name(self):
        schema_name = self.cleaned_data.get('schema_name', '')

        if not schema_name:
            # Auto-generate from name
            name = self.cleaned_data.get('name', '')
            if name:
                schema_name = self._generate_schema_name(name)
            else:
                raise ValidationError('Schema name is required')

        # Validate schema name format
        if not re.match(r'^[_a-zA-Z][_a-zA-Z0-9]*$', schema_name):
            raise ValidationError(
                'Schema name must start with letter/underscore and contain only letters, numbers, underscores. '
                'No spaces, hyphens, or special characters allowed.'
            )

        if len(schema_name) > 63:
            raise ValidationError('Schema name too long (max 63 characters)')

        return schema_name

    def _generate_schema_name(self, name):
        """Generate valid schema name from company name"""
        schema_name = name.lower()
        # Replace spaces and hyphens with underscores
        schema_name = re.sub(r'[^a-z0-9_]', '_', schema_name)
        # Remove consecutive underscores
        schema_name = re.sub(r'_+', '_', schema_name)
        # Remove leading/trailing underscores
        schema_name = schema_name.strip('_')
        # Ensure it starts with letter
        if schema_name and schema_name[0].isdigit():
            schema_name = 'tenant_' + schema_name
        return schema_name

    def clean(self):
        """Validate admin fields are required only for new clients"""
        cleaned_data = super().clean()

        # If this is a new client (no instance.pk), require admin fields
        if not self.instance or not self.instance.pk:
            required_fields = ['admin_email', 'admin_password', 'admin_first_name', 'admin_last_name']
            for field in required_fields:
                if not cleaned_data.get(field):
                    self.add_error(field, 'This field is required for new clients.')

        return cleaned_data

    def clean_admin_email(self):
        """Validate admin email is unique (only for new clients)"""
        from .models import User
        email = self.cleaned_data.get('admin_email')

        # Only validate if this is a new client and email is provided
        if email and (not self.instance or not self.instance.pk):
            if User.objects.filter(email=email).exists():
                raise ValidationError('A user with this email already exists.')
        return email


class SuperClientAdmin(admin.ModelAdmin):
    """
    Client admin configuration - Only for super admin interface
    """
    form = ClientAdminForm
    list_display = ["name", "schema_name", "is_active", "created_on"]
    list_filter = ["is_active", "created_on"]
    search_fields = ["name", "schema_name"]
    ordering = ["name"]

    def get_fieldsets(self, request, obj=None):
        """Dynamic fieldsets based on whether it's a new or existing client"""
        if obj:  # Editing existing client
            return (
                ('Company Information', {
                    'fields': ('name', 'schema_name', 'description', 'is_active'),
                    'description': 'Edit client information. Admin user creation is only available for new clients.'
                }),
            )
        else:  # Creating new client
            return (
                ('Company Information', {
                    'fields': ('name', 'schema_name', 'description', 'is_active')
                }),
                ('Admin User Creation', {
                    'fields': ('admin_email', 'admin_password', 'admin_first_name', 'admin_last_name'),
                    'description': 'Create an admin user for this tenant (required for new clients)'
                }),
                ('Domain Configuration', {
                    'fields': ('create_domain',),
                    'description': 'Automatically create a localhost domain for this tenant'
                })
            )

    def save_model(self, request, obj, form, change):
        """Custom save method to create admin user and domain"""
        from django.contrib import messages

        # Save the client first
        super().save_model(request, obj, form, change)

        # Only create admin user and domain for new clients
        if not change:
            admin_user = self._create_admin_user(obj, form.cleaned_data)
            domain_name = None
            if form.cleaned_data.get('create_domain'):
                domain_name = self._create_domain(obj)

            # Add success message with instructions
            success_msg = f"""
            ✓ Client '{obj.name}' created successfully!
            
            Admin User Created:
            • Email: {admin_user.email}
            • Password: {form.cleaned_data['admin_password']}
            • Username: {admin_user.username}
            """

            if domain_name:
                success_msg += f"""
            Domain Created: {domain_name}
            
            Next Steps:
            1. Add to /etc/hosts: 127.0.0.1 {domain_name}
            2. Access admin at: http://{domain_name}:8000/admin
            3. Login with: {admin_user.email} / {form.cleaned_data['admin_password']}
            """

            messages.success(request, success_msg)

    def _create_admin_user(self, client, form_data):
        """Create admin user for the new client"""
        from apps.tenant_core.models import Role, UserRole

        from .models import User

        # Generate unique username
        base_username = form_data['admin_email'].split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        # Create the admin user
        admin_user = User.objects.create_user(
            username=username,
            email=form_data['admin_email'],
            password=form_data['admin_password'],
            first_name=form_data['admin_first_name'],
            last_name=form_data['admin_last_name'],
            is_staff=True,
            is_superuser=False,  # Tenant admin should not have global superuser access
            is_active=True
        )

        # Assign user to this tenant
        admin_user.tenants.add(client)

        # Switch to tenant schema to create/assign admin role and permissions
        from django_tenants.utils import schema_context
        with schema_context(client.schema_name):
            # Create admin role if it doesn't exist
            admin_role, created = Role.objects.get_or_create(
                role_type='admin',
                defaults={
                    'name': 'Admin',
                    'description': 'Full administrative access to this tenant',
                    'permissions': {'all': True},
                    'is_active': True
                }
            )

            # Assign admin role to user
            UserRole.objects.create(
                user=admin_user,
                role=admin_role,
                assigned_by=User.objects.filter(is_superadmin=True).first()
            )

            # Grant necessary Django admin permissions to tenant admin
            from django.contrib.auth.models import Permission

            # Get all tenant_core permissions
            tenant_core_perms = Permission.objects.filter(content_type__app_label='tenant_core')
            for perm in tenant_core_perms:
                admin_user.user_permissions.add(perm)

            # Get core User model permissions (for TenantUser proxy model)
            core_user_perms = Permission.objects.filter(
                content_type__app_label='core',
                content_type__model='user'
            )
            for perm in core_user_perms:
                admin_user.user_permissions.add(perm)

        return admin_user

    def _create_domain(self, client):
        """Create localhost domain for the new client"""
        from .models import Domain

        # Generate domain name from schema_name (remove underscores for domain)
        domain_base = client.schema_name.replace('_', '')
        domain_name = f"{domain_base}.localhost"

        # Create domain
        Domain.objects.create(
            domain=domain_name,
            tenant=client,
            is_primary=False  # Keep demo.localhost as primary for demo tenant
        )

        return domain_name

    class Media:
        js = ('admin/js/client_form.js',)  # Optional: Add JS for auto-generation


class SuperDomainAdmin(admin.ModelAdmin):
    """
    Domain admin configuration - Only for super admin interface
    """
    list_display = ["domain", "tenant", "is_primary"]
    list_filter = ["is_primary"]
    search_fields = ["domain", "tenant__name"]
    ordering = ["domain"]


# Create a separate admin site for super admin
class SuperAdminSite(UnfoldAdminSite):
    site_header = "NeuraCRM Super Administration"
    site_title = "NeuraCRM Super Admin"
    index_title = "System Management"

    def has_permission(self, request):
        """
        Check if the user has permission to access the super admin site.
        Only superadmins should have access.
        """
        return (
            hasattr(request, 'user') and
            request.user.is_active and
            request.user.is_authenticated and
            getattr(request.user, 'is_superadmin', False)
        )

    def admin_view(self, view, cacheable=False):
        """
        Override admin_view to add superadmin-specific permission checks
        """
        # Use the parent class's admin_view but with our custom has_permission
        return super().admin_view(view, cacheable)

    def login(self, request, extra_context=None):
        """
        Override the default login to add superadmin validation
        """
        from django.contrib.auth import authenticate
        from django.contrib.auth import login as auth_login
        from django.contrib.auth.forms import AuthenticationForm
        from django.http import HttpResponseRedirect
        from django.urls import reverse

        # If it's a POST request, handle authentication
        if request.method == 'POST':
            form = AuthenticationForm(request, data=request.POST)
            if form.is_valid():
                username = form.cleaned_data.get('username')
                password = form.cleaned_data.get('password')

                # Authenticate user
                user = authenticate(request, username=username, password=password)

                if user is not None:
                    # Check if user is a superadmin
                    if not getattr(user, 'is_superadmin', False):
                        messages.error(
                            request,
                            "Only superadmins are allowed to access this area. "
                            "Please contact your system administrator if you believe this is an error."
                        )
                        # Let the parent handle the login page rendering with error
                        context = {
                            'site_header': self.site_header,
                            'site_title': self.site_title,
                            'title': 'Log in',
                            **(extra_context or {})
                        }
                        return super().login(request, context)
                    else:
                        # User is a superadmin, proceed with login
                        auth_login(request, user)
                        return HttpResponseRedirect(reverse('superadmin:index'))
                else:
                    # Invalid credentials
                    messages.error(request, "Please enter a valid email and password.")
                    # Let the parent handle the login page rendering with error
                    context = {
                        'site_header': self.site_header,
                        'site_title': self.site_title,
                        'title': 'Log in',
                        **(extra_context or {})
                    }
                    return super().login(request, context)

        # For GET requests or when we need to show the form with errors,
        # let the parent class handle the rendering
        context = {
            'site_header': self.site_header,
            'site_title': self.site_title,
            'title': 'Log in',
            **(extra_context or {})
        }
        return super().login(request, context)

    def get_sidebar_list(self, request):
        """Override sidebar generation to fix URL namespace issues"""
        from django.urls import reverse

        # Build sidebar manually with correct namespaces
        sidebar = [
            {
                "title": "Dashboard",
                "separator": True,
                "items": [
                    {
                        "title": "Home",
                        "icon": "home",
                        "link": reverse('superadmin:index'),
                        "has_permission": True,
                        "active": request.path == reverse('superadmin:index'),
                    },
                ],
            },
            {
                "title": "System Management",
                "separator": True,
                "items": [
                    {
                        "title": "Clients (Tenants)",
                        "icon": "business",
                        "link": reverse('superadmin:core_client_changelist'),
                        "has_permission": True,
                        "active": reverse('superadmin:core_client_changelist') in request.path,
                    },
                    {
                        "title": "Domains",
                        "icon": "public",
                        "link": reverse('superadmin:core_domain_changelist'),
                        "has_permission": True,
                        "active": reverse('superadmin:core_domain_changelist') in request.path,
                    },
                    {
                        "title": "System Users",
                        "icon": "person",
                        "link": reverse('superadmin:core_user_changelist'),
                        "has_permission": True,
                        "active": reverse('superadmin:core_user_changelist') in request.path,
                    },
                ],
            },
        ]

        return sidebar

    def each_context(self, request):
        """Override context to provide super admin specific configuration"""
        context = super().each_context(request)

        # Override sidebar with our custom implementation
        context.update({
            "sidebar_navigation": self.get_sidebar_list(request)
        })

        return context

# Create super admin site instance
super_admin_site = SuperAdminSite(name='superadmin')

# Register models only in super admin site
super_admin_site.register(Client, SuperClientAdmin)
super_admin_site.register(Domain, SuperDomainAdmin)

# Register User model for system user management
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


class SuperUserAdmin(BaseUserAdmin):
    """User admin for super admin interface - shows all users across all tenants"""
    list_display = ["email", "first_name", "last_name", "is_active", "is_superadmin", "tenant_count"]
    list_filter = ["is_active", "is_superadmin", "is_staff", "created_at"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["email"]

    def tenant_count(self, obj):
        """Show how many tenants this user belongs to"""
        return obj.tenants.count()
    tenant_count.short_description = "Tenant Count"

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone")}),
        ("System Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "is_superadmin")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        ("Tenant Assignments", {"fields": ("tenants",)}),
    )

    filter_horizontal = ("tenants",)

super_admin_site.register(User, SuperUserAdmin)

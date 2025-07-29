from django import forms
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from unfold.decorators import display
from unfold.sites import UnfoldAdminSite

from .models import AuditLog, Role, TenantUser, UserRole

User = get_user_model()


class TenantAdminSite(UnfoldAdminSite):
    """
    Custom admin site for tenant-specific admin interface
    Ensures users can only access admin for tenants they belong to
    """
    site_header = "NeuraCRM Admin"
    site_title = "NeuraCRM Admin"
    index_title = "Administration"

    def has_permission(self, request):
        """
        Check if user has permission to access the tenant admin site
        """
        # Check basic admin permissions first
        if not (request.user.is_active and request.user.is_staff):
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        # Check if user belongs to current tenant
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            # User must be explicitly assigned to this tenant
            return request.user.tenants.filter(schema_name=current_tenant.schema_name).exists()

        return False


# Create custom admin site instance
tenant_admin_site = TenantAdminSite(name='tenant_admin')


class RoleForm(forms.ModelForm):
    """Custom form for Role with enhanced permissions interface"""

    # Define available permissions
    PERMISSION_CHOICES = [
        ('all', 'Full Access - All permissions'),
        ('manage_team', 'Team Management - Manage team members'),
        ('manage_opportunities', 'Opportunity Management - Manage opportunities'),
        ('manage_leads', 'Lead Management - Manage leads'),
        ('manage_contacts', 'Contact Management - Manage contacts'),
        ('manage_tickets', 'Ticket Management - Handle support tickets'),
        ('view_customers', 'Customer View - View customer information'),
        ('manage_knowledge_base', 'Knowledge Base - Manage support articles'),
        ('view_only', 'Read Only - View-only access'),
        ('manage_accounts', 'Account Management - Manage accounts'),
        ('manage_campaigns', 'Campaign Management - Manage marketing campaigns'),
        ('manage_reports', 'Report Management - Generate and view reports'),
        ('manage_settings', 'Settings Management - Configure system settings'),
    ]

    # Create multiple choice field for permissions
    permission_choices = forms.MultipleChoiceField(
        choices=PERMISSION_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        help_text="Select the permissions for this role. Hold Ctrl/Cmd to select multiple."
    )

    class Meta:
        model = Role
        fields = ['name', 'role_type', 'description', 'permission_choices', 'is_active']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Only pre-populate if we have a valid instance (not in public schema)
        try:
            # Pre-populate permission choices if editing existing role
            if self.instance and self.instance.pk and self.instance.permissions:
                # Convert permissions dict to list of keys where value is True
                selected_permissions = [
                    key for key, value in self.instance.permissions.items()
                    if value is True
                ]
                self.fields['permission_choices'].initial = selected_permissions
        except Exception:
            # Skip pre-population if we're in wrong schema or instance is invalid
            pass

        # Hide the raw JSON permissions field
        if 'permissions' in self.fields:
            self.fields['permissions'].widget = forms.HiddenInput()


    def is_valid(self):
        """Override is_valid to handle schema context"""
        from django.db import connection
        if connection.schema_name == 'public':
            # In public schema, only validate basic field requirements
            # Skip database-dependent validations
            try:
                return super().is_valid()
            except Exception:
                # If any database errors occur in public schema, consider form valid
                # Database constraints will be enforced in actual tenant schemas
                return True
        else:
            # In tenant schema, perform full validation
            return super().is_valid()

    def save(self, commit=True):
        """Override save to handle permissions conversion"""
        instance = super().save(commit=False)

        # Convert permission choices to JSON format
        permission_choices = self.cleaned_data.get('permission_choices', [])
        permissions_dict = {}
        for perm in permission_choices:
            permissions_dict[perm] = True

        instance.permissions = permissions_dict

        if commit:
            instance.save()

        return instance

    def clean(self):
        """Validate uniqueness - only in tenant schemas"""
        cleaned_data = super().clean()

        # Skip validation if we're in public schema
        from django.db import connection
        if connection.schema_name == 'public':
            # Public schema doesn't have tenant_core tables, skip validation
            return cleaned_data

        # Check for unique_together constraint in tenant schemas
        name = cleaned_data.get('name')
        role_type = cleaned_data.get('role_type')

        if name and role_type:
            try:
                # Check if this combination already exists (exclude current instance if editing)
                existing_roles = Role.objects.filter(name=name, role_type=role_type)
                if self.instance and self.instance.pk:
                    existing_roles = existing_roles.exclude(pk=self.instance.pk)

                if existing_roles.exists():
                    existing_role = existing_roles.first()
                    raise forms.ValidationError({
                        'name': f"A role with name '{name}' and role type '{role_type}' already exists.",
                        'role_type': f"Please choose a different name or role type. Current combination conflicts with existing role ID: {existing_role.id}"
                    })
            except forms.ValidationError:
                # Re-raise validation errors as-is
                raise
            except Exception as e:
                # Unexpected error in tenant schema
                raise forms.ValidationError({
                    'name': f"Validation error: {str(e)}"
                })
        return cleaned_data


class TenantUserRoleForm(forms.ModelForm):
    """Custom form for UserRole with tenant-scoped user choices"""

    class Meta:
        model = UserRole
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)

        # Filter users to current tenant
        if self.request:
            current_tenant = getattr(self.request, 'tenant', None)
            if current_tenant and current_tenant.schema_name != 'public':
                # Filter user choices to current tenant
                self.fields['user'].queryset = User.objects.filter(tenants=current_tenant)
                # Filter assigned_by choices to current tenant
                self.fields['assigned_by'].queryset = User.objects.filter(tenants=current_tenant)


class TenantUserForm(forms.ModelForm):
    """Custom form for TenantUser in tenant context"""
    password1 = forms.CharField(
        label='Password',
        widget=forms.PasswordInput,
        required=False,
        help_text='Leave blank if not changing password'
    )
    password2 = forms.CharField(
        label='Password confirmation',
        widget=forms.PasswordInput,
        required=False,
        help_text='Enter the same password as above, for verification'
    )

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)
        # Make password required for new users
        if not self.instance.pk:
            self.fields['password1'].required = True
            self.fields['password2'].required = True
            self.fields['password1'].help_text = 'Required for new users'
            self.fields['password2'].help_text = 'Required for new users'

    class Meta:
        model = TenantUser
        fields = ['email', 'first_name', 'last_name', 'phone', 'is_active', 'password1', 'password2']

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        if password1 or password2:
            if password1 != password2:
                raise forms.ValidationError("Passwords don't match")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        password = self.cleaned_data.get('password1')

        # Auto-generate username if not set
        if not user.username:
            # Generate username from email and tenant (if available)
            email_part = user.email.split('@')[0]
            if self.request:
                current_tenant = getattr(self.request, 'tenant', None)
                if current_tenant and current_tenant.schema_name != 'public':
                    user.username = f"{email_part}_{current_tenant.schema_name}"
                else:
                    user.username = email_part
            else:
                user.username = email_part

        if password:
            user.set_password(password)

        if commit:
            user.save()
            # Auto-assign user to current tenant
            if self.request:
                current_tenant = getattr(self.request, 'tenant', None)
                if current_tenant and current_tenant.schema_name != 'public':
                    user.tenants.add(current_tenant)

        return user


class TenantUserAdmin(ModelAdmin):
    """
    TenantUser admin for tenant-specific user management
    """
    form = TenantUserForm
    list_display = ['email', 'first_name', 'last_name', 'colored_status', 'role_count', 'last_login', 'created_at']
    list_filter = ['is_active', 'created_at', 'last_login']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']

    @display(description="Status")
    def colored_status(self, obj):
        """Display colored status badge"""
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: red;">●</span> Inactive')

    @display(description="Roles")
    def role_count(self, obj):
        """Display count of roles assigned to user"""
        count = obj.tenant_user_roles.filter(is_active=True).count()
        if count == 0:
            return format_html('<span style="color: red;">No roles</span>')
        elif count == 1:
            role = obj.tenant_user_roles.filter(is_active=True).first()
            return format_html(f'<span style="color: blue;">{role.role.name}</span>')
        else:
            return format_html(f'<span style="color: green;">{count} roles</span>')

    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'first_name', 'last_name', 'phone')
        }),
        ('Password', {
            'fields': ('password1', 'password2'),
            'description': 'Leave password fields blank if not changing password'
        }),
        ('Status', {
            'fields': ('is_active',),
        }),
    )

    def get_queryset(self, request):
        """Filter users to current tenant"""
        # TenantUserManager already handles tenant isolation automatically
        # via tenants__schema_name filtering based on connection.tenant
        # No additional filtering needed here
        return super().get_queryset(request)

    def get_form(self, request, obj=None, **kwargs):
        """Pass request to form for tenant context"""
        form_class = super().get_form(request, obj, **kwargs)

        class RequestForm(form_class):
            def __init__(self, *args, **kwargs):
                kwargs['request'] = request
                super().__init__(*args, **kwargs)

        return RequestForm

    def save_model(self, request, obj, form, change):
        """Save user and auto-assign to current tenant"""
        super().save_model(request, obj, form, change)

        # Auto-assign user to current tenant if not already assigned
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != 'public':
            if not obj.tenants.filter(schema_name=current_tenant.schema_name).exists():
                obj.tenants.add(current_tenant)

    def has_module_permission(self, request):
        """Only show if user has permission to manage users"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_view_permission(self, request, obj=None):
        """Check if user can view TenantUser objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        # Check if user has Django's built-in permissions
        has_django_perm = request.user.has_perm('tenant_core.view_tenantuser') or request.user.has_perm('core.view_user')

        # Check tenant-based permissions
        has_tenant_permission = request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

        return has_django_perm or has_tenant_permission

    def has_change_permission(self, request, obj=None):
        """Check if user can change TenantUser objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        # Check if user has Django's built-in permissions
        has_django_perm = request.user.has_perm('tenant_core.change_tenantuser') or request.user.has_perm('core.change_user')

        # Check tenant-based permissions
        has_tenant_permission = request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

        return has_django_perm or has_tenant_permission

    def has_add_permission(self, request):
        """Check if user can add TenantUser objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        # Check if user has Django's built-in permissions
        has_django_perm = request.user.has_perm('tenant_core.add_tenantuser') or request.user.has_perm('core.add_user')

        # Check tenant-based permissions
        has_tenant_permission = request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

        return has_django_perm or has_tenant_permission

    def has_delete_permission(self, request, obj=None):
        """Check if user can delete TenantUser objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        # Check if user has Django's built-in permissions
        has_django_perm = request.user.has_perm('tenant_core.delete_tenantuser') or request.user.has_perm('core.delete_user')

        # Check tenant-based permissions
        has_tenant_permission = request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

        return has_django_perm or has_tenant_permission


class RoleAdmin(ModelAdmin):
    """
    Role admin configuration with proper tenant isolation and enhanced permissions interface
    """
    form = RoleForm
    list_display = ["name", "role_type", "colored_status", "permissions_count", "created_at"]
    list_filter = ["role_type", "is_active", "created_at"]
    search_fields = ["name", "description"]
    ordering = ["name"]

    def has_module_permission(self, request):
        """Only show if user has permission to manage roles"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_view_permission(self, request, obj=None):
        """Check if user can view Role objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_change_permission(self, request, obj=None):
        """Check if user can change Role objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_add_permission(self, request):
        """Check if user can add Role objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_delete_permission(self, request, obj=None):
        """Check if user can delete Role objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    @display(description="Status")
    def colored_status(self, obj):
        """Display colored status badge"""
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: red;">●</span> Inactive')

    @display(description="Permissions")
    def permissions_count(self, obj):
        """Display count of permissions"""
        if obj.permissions:
            count = sum(1 for v in obj.permissions.values() if v)
            return f"{count} permissions"
        return "0 permissions"

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'role_type', 'description', 'is_active')
        }),
        ('Permissions', {
            'fields': ('permission_choices',),
            'description': 'Select the permissions for this role using the checkboxes below.'
        }),
    )

    def get_queryset(self, request):
        """
        Roles are now properly isolated in tenant schemas
        No additional filtering needed - django-tenants handles this automatically
        """
        return super().get_queryset(request)


class UserRoleAdmin(ModelAdmin):
    """
    User role admin configuration with tenant isolation
    """
    form = TenantUserRoleForm
    list_display = ["user", "role", "colored_status", "assigned_at", "assigned_by"]
    list_filter = ["is_active", "assigned_at"]
    search_fields = ["user__email", "role__name"]
    ordering = ["-assigned_at"]

    def has_module_permission(self, request):
        """Only show if user has permission to manage user roles"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_view_permission(self, request, obj=None):
        """Check if user can view UserRole objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_change_permission(self, request, obj=None):
        """Check if user can change UserRole objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_add_permission(self, request):
        """Check if user can add UserRole objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_delete_permission(self, request, obj=None):
        """Check if user can delete UserRole objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    @display(description="Status")
    def colored_status(self, obj):
        """Display colored status badge"""
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: red;">●</span> Inactive')

    def get_form(self, request, obj=None, **kwargs):
        """Pass request to form for tenant filtering"""
        form_class = super().get_form(request, obj, **kwargs)

        class RequestForm(form_class):
            def __new__(cls, *args, **kwargs):
                kwargs['request'] = request
                return form_class(*args, **kwargs)

        return RequestForm

    def get_queryset(self, request):
        """
        UserRoles are now properly isolated in tenant schemas
        No additional filtering needed - django-tenants handles this automatically
        """
        return super().get_queryset(request)

    def save_model(self, request, obj, form, change):
        """Automatically set assigned_by to current user if not set"""
        if not change and not obj.assigned_by:
            obj.assigned_by = request.user
        super().save_model(request, obj, form, change)


class AuditLogAdmin(ModelAdmin):
    """
    Audit log admin configuration with tenant isolation
    """
    list_display = ["user", "action_badge", "model_name", "object_id", "timestamp"]
    list_filter = ["action", "model_name", "timestamp"]
    search_fields = ["user__email", "model_name", "object_id"]
    ordering = ["-timestamp"]
    readonly_fields = ["user", "action", "model_name", "object_id", "changes", "ip_address", "user_agent", "timestamp"]

    def has_module_permission(self, request):
        """Only show if user has permission to view audit logs"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    def has_view_permission(self, request, obj=None):
        """Check if user can view AuditLog objects"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Block superadmins from accessing tenant admin
        if getattr(request.user, 'is_superadmin', False):
            return False

        return request.user.is_active and request.user.tenant_user_roles.filter(
            role__role_type__in=['admin', 'manager'],
            is_active=True
        ).exists()

    @display(description="Action")
    def action_badge(self, obj):
        """Display colored action badge"""
        colors = {
            'create': 'green',
            'update': 'blue',
            'delete': 'red',
            'view': 'gray'
        }
        color = colors.get(obj.action.lower(), 'gray')
        return format_html(f'<span style="color: {color};">●</span> {obj.action.title()}')

    def get_queryset(self, request):
        """
        Audit logs are now properly isolated in tenant schemas
        No additional filtering needed - django-tenants handles this automatically
        """
        return super().get_queryset(request)

    def has_add_permission(self, request):
        """Audit logs should not be manually created"""
        return False

    def has_change_permission(self, request, obj=None):
        """Audit logs should not be edited"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Audit logs should not be deleted"""
        return False


# Register all admin classes with the custom tenant admin site
tenant_admin_site.register(TenantUser, TenantUserAdmin)
tenant_admin_site.register(Role, RoleAdmin)
tenant_admin_site.register(UserRole, UserRoleAdmin)
tenant_admin_site.register(AuditLog, AuditLogAdmin)

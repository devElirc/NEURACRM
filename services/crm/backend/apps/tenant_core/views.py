import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models, transaction
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.core.utils import role_management_rate_limit, user_management_rate_limit

from .models import AuditLog, Role, TenantUser, UserRole
from .permissions import CanManageRoles, CanManageUsers
from .serializers import (
    AuditLogSerializer,
    RoleSerializer,
    TenantUserCreateSerializer,
    TenantUserSerializer,
    UserRoleSerializer,
)
from .utils import create_audit_log

logger = logging.getLogger(__name__)

def handle_safe_error(error_message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=None):
    """Handle errors with sanitized messages for production"""
    if not settings.DEBUG:
        sanitized_messages = {
            400: "Bad request", 401: "Authentication required", 403: "Access denied",
            404: "Resource not found", 429: "Too many requests", 500: "Internal server error"
        }
        response_data = {"error": sanitized_messages.get(status_code, "An error occurred")}
        logger.error(f"Error (sanitized): {error_message}")
        if details:
            logger.error(f"Error details: {details}")
    else:
        response_data = {"error": error_message}
        if details:
            response_data["details"] = details
    return Response(response_data, status=status_code)

# Constants
PUBLIC_SCHEMA_NAME = "public"

User = get_user_model()


class TenantUserListCreateView(generics.ListCreateAPIView):
    """
    Tenant user list and create view - TENANT SCOPED
    """
    serializer_class = TenantUserSerializer
    permission_classes = [CanManageUsers]

    def get_queryset(self):
        """Filter users by current tenant - now uses TenantUserManager filtering"""
        # The TenantUserManager automatically filters by current tenant
        return TenantUser.objects.all()

    def get_serializer_class(self):
        """Use different serializer for create vs list"""
        if self.request.method == 'POST':
            return TenantUserCreateSerializer
        return TenantUserSerializer

    def list(self, request, *args, **kwargs):
        """Override list to ensure consistent response format"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            # Return consistent format even without pagination
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            })

    @user_management_rate_limit
    def perform_create(self, serializer):
        with transaction.atomic():
            user = serializer.save()

            # Auto-assign user to current tenant if not public schema
            current_tenant = getattr(self.request, 'tenant', None)
            if current_tenant and current_tenant.schema_name != PUBLIC_SCHEMA_NAME:
                user.tenants.add(current_tenant)

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="create",
                model_name="TenantUser",
                object_id=str(user.id),
                request=self.request
            )


class TenantUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Tenant user detail view - TENANT SCOPED
    """
    serializer_class = TenantUserSerializer
    permission_classes = [CanManageUsers]

    def get_queryset(self):
        """Filter users by current tenant"""
        current_tenant = getattr(self.request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != PUBLIC_SCHEMA_NAME:
            # Return only users that belong to this tenant
            return TenantUser.objects.filter(tenants__schema_name=current_tenant.schema_name)
        else:
            # For public schema, return all users (superadmin access)
            return TenantUser.objects.all()

    def perform_update(self, serializer):
        with transaction.atomic():
            user = serializer.save()

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="update",
                model_name="TenantUser",
                object_id=str(user.id),
                request=self.request
            )

    def perform_destroy(self, instance):
        with transaction.atomic():
            instance.is_active = False
            instance.save()

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="delete",
                model_name="TenantUser",
                object_id=str(instance.id),
                request=self.request
            )


class TenantUserEnhancedListView(generics.ListAPIView):
    """
    Tenant-specific user list view with enhanced metadata
    """
    serializer_class = TenantUserSerializer
    permission_classes = [CanManageUsers]

    def get_queryset(self):
        """Get users for current tenant with role information - now uses TenantUserManager"""
        # The TenantUserManager automatically filters by current tenant
        return TenantUser.objects.all().prefetch_related('tenant_user_roles__role')

    def list(self, request, *args, **kwargs):
        """Override list to add tenant metadata"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            result = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            result = Response(serializer.data)

        # Add tenant metadata
        current_tenant = getattr(request, 'tenant', None)
        if current_tenant and current_tenant.schema_name != PUBLIC_SCHEMA_NAME:
            tenant_info = {
                'tenant_name': current_tenant.name,
                'tenant_schema': current_tenant.schema_name,
                'user_count': queryset.count(),
                'active_user_count': queryset.filter(is_active=True).count()
            }

            if hasattr(result, 'data'):
                if isinstance(result.data, dict):
                    result.data['tenant_info'] = tenant_info
                else:
                    result.data = {
                        'tenant_info': tenant_info,
                        'users': result.data
                    }

        return result


class RoleListCreateView(generics.ListCreateAPIView):
    """
    Role list and create view - TENANT SCOPED
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [CanManageRoles]

    def list(self, request, *args, **kwargs):
        """Override list to ensure consistent response format"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            })

    @role_management_rate_limit
    def perform_create(self, serializer):
        with transaction.atomic():
            role = serializer.save()

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="create",
                model_name="Role",
                object_id=str(role.id),
                request=self.request
            )


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Role detail view - TENANT SCOPED
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [CanManageRoles]

    def perform_update(self, serializer):
        with transaction.atomic():
            role = serializer.save()

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="update",
                model_name="Role",
                object_id=str(role.id),
                request=self.request
            )

    def perform_destroy(self, instance):
        with transaction.atomic():
            instance.is_active = False
            instance.save()

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="delete",
                model_name="Role",
                object_id=str(instance.id),
                request=self.request
            )


class UserRoleListCreateView(generics.ListCreateAPIView):
    """
    User role assignment view - TENANT SCOPED
    """
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [CanManageUsers]

    def list(self, request, *args, **kwargs):
        """Override list to ensure consistent response format"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            })

    def perform_create(self, serializer):
        with transaction.atomic():
            user_role = serializer.save(assigned_by=self.request.user)

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="create",
                model_name="UserRole",
                object_id=str(user_role.id),
                request=self.request
            )


class UserRoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    User role detail view - TENANT SCOPED
    """
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [CanManageUsers]

    def perform_destroy(self, instance):
        with transaction.atomic():
            instance.is_active = False
            instance.save()

            # Create audit log
            create_audit_log(
                user=self.request.user,
                action="delete",
                model_name="UserRole",
                object_id=str(instance.id),
                request=self.request
            )


class AuditLogListView(generics.ListAPIView):
    """
    Audit log list view - TENANT SCOPED
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [CanManageUsers]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by user if specified
        user_id = self.request.query_params.get("user_id")
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by action if specified
        action = self.request.query_params.get("action")
        if action:
            queryset = queryset.filter(action=action)

        # Filter by model if specified
        model_name = self.request.query_params.get("model_name")
        if model_name:
            queryset = queryset.filter(model_name=model_name)

        return queryset

    def list(self, request, *args, **kwargs):
        """Override list to ensure consistent response format"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tenant_dashboard_stats(request):
    """
    Tenant dashboard statistics view
    """
    current_tenant = getattr(request, 'tenant', None)
    if current_tenant and current_tenant.schema_name != PUBLIC_SCHEMA_NAME:
        # Tenant-specific stats - now uses TenantUserManager filtering
        tenant_users = TenantUser.objects.all()  # Manager filters automatically
        stats = {
            "success": True,
            "data": {
                "tenant_name": current_tenant.name,
                "tenant_schema": current_tenant.schema_name,
                "tenant_users": tenant_users.filter(is_active=True).count(),
                "total_roles": Role.objects.filter(is_active=True).count(),
                "recent_actions": AuditLog.objects.order_by("-timestamp")[:5].count(),
                "user_roles": UserRole.objects.filter(is_active=True).count(),
            }
        }
    else:
        # Public schema stats
        stats = {
            "success": True,
            "data": {
                "profile_complete": bool(
                    request.user.first_name and
                    request.user.last_name and
                    request.user.phone
                ),
                "roles_count": request.user.tenant_user_roles.filter(is_active=True).count(),
            }
        }

    return Response(stats)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tenant_admin_dashboard(request):
    """
    Tenant admin dashboard with user and role management info
    """
    current_tenant = getattr(request, 'tenant', None)
    if not current_tenant or current_tenant.schema_name == PUBLIC_SCHEMA_NAME:
        return handle_safe_error("Tenant required", status.HTTP_400_BAD_REQUEST)

    try:
        # Get basic tenant info
        tenant_users = TenantUser.objects.all()
        active_users = tenant_users.filter(is_active=True)
        roles = Role.objects.filter(is_active=True)
        user_roles = UserRole.objects.filter(is_active=True)
        recent_audit = AuditLog.objects.order_by("-timestamp")[:10]

        # Get recent users (last 5)
        recent_users = []
        for user in active_users.order_by('-date_joined')[:5]:
            user_role_names = [ur.role.name for ur in user.tenant_user_roles.filter(is_active=True)]
            recent_users.append({
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'roles': user_role_names,
                'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                'is_active': user.is_active
            })

        return Response({
            'tenant_name': current_tenant.name,
            'total_users': active_users.count(),
            'total_roles': roles.count(),
            'active_user_roles': user_roles.count(),
            'recent_actions': recent_audit.count(),
            'recent_users': recent_users
        })
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Tenant admin dashboard error: {e}")
        return handle_safe_error("Internal server error", status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard(request):
    """
    User dashboard with real CRM data
    """
    current_tenant = getattr(request, 'tenant', None)
    if not current_tenant or current_tenant.schema_name == PUBLIC_SCHEMA_NAME:
        return handle_safe_error("Tenant required", status.HTTP_400_BAD_REQUEST)

    try:
        # Get user info
        user_roles = request.user.tenant_user_roles.filter(is_active=True)
        user_role_names = [ur.role.name for ur in user_roles]

        # Import CRM models
        from apps.accounts.models import Account
        from apps.contacts.models import Contact
        from apps.leads.models import Lead
        from apps.opportunities.models import Deal

        # Get CRM stats based on user permissions
        user_permissions = []
        for user_role in user_roles:
            if user_role.role.permissions:
                user_permissions.extend(user_role.role.permissions)
        user_permissions = list(set(user_permissions))  # Remove duplicates

        # Check user permissions and get appropriate data
        has_all_access = 'all' in user_permissions
        can_view_all = has_all_access or any(p in user_permissions for p in ['manage_leads', 'view_customers'])

        if can_view_all:
            # User can see all tenant data
            leads_count = Lead.objects.count()
            contacts_count = Contact.objects.count()
            accounts_count = Account.objects.count()
            opportunities_count = Deal.objects.count()

            # Get user's assigned leads for recent activity
            user_leads = Lead.objects.filter(lead_owner=request.user)[:5]
            user_contacts = Contact.objects.filter(owner=request.user)[:5]
        else:
            # User can only see their own data
            user_leads = Lead.objects.filter(
                models.Q(lead_owner=request.user) | models.Q(created_by=request.user)
            )
            user_contacts = Contact.objects.filter(
                models.Q(owner=request.user) | models.Q(created_by=request.user)
            )
            user_accounts = Account.objects.filter(
                models.Q(owner=request.user) | models.Q(created_by=request.user)
            )
            user_deals = Deal.objects.filter(
                models.Q(owner=request.user) | models.Q(created_by=request.user)
            )

            leads_count = user_leads.count()
            contacts_count = user_contacts.count()
            accounts_count = user_accounts.count()
            opportunities_count = user_deals.count()

            user_leads = user_leads[:5]
            user_contacts = user_contacts[:5]

        # Build recent activity
        recent_activity = []

        # Add recent leads
        for lead in user_leads:
            recent_activity.append({
                'type': 'lead',
                'title': f"Lead: {lead.first_name} {lead.last_name}",
                'description': f"Status: {lead.lead_status or 'New'}",
                'date': lead.updated_at.isoformat(),
                'link': f"/leads/{lead.lead_id}"
            })

        # Add recent contacts
        for contact in user_contacts:
            recent_activity.append({
                'type': 'contact',
                'title': f"Contact: {contact.first_name} {contact.last_name}",
                'description': f"Account: {contact.account_name or 'No Account'}",
                'date': contact.updated_at.isoformat(),
                'link': f"/contacts/{contact.contact_id}"
            })

        # Sort by date and limit to 10 most recent
        recent_activity.sort(key=lambda x: x['date'], reverse=True)
        recent_activity = recent_activity[:10]

        return Response({
            'tenant_name': current_tenant.name,
            'user_name': request.user.full_name,
            'user_email': request.user.email,
            'user_roles': user_role_names,
            'user_permissions': user_permissions,
            'crm_stats': {
                'leads': leads_count,
                'contacts': contacts_count,
                'accounts': accounts_count,
                'opportunities': opportunities_count
            },
            'recent_activity': recent_activity,
            'data_scope': 'all' if can_view_all else 'own'
        })
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"User dashboard error: {e}")
        return handle_safe_error("Internal server error", status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def eligible_lead_owners(request):
    """
    Get users who can manage leads (eligible as lead owners)
    Always includes the requesting user
    """
    current_tenant = getattr(request, 'tenant', None)
    if not current_tenant or current_tenant.schema_name == PUBLIC_SCHEMA_NAME:
        return handle_safe_error("Tenant required", status.HTTP_400_BAD_REQUEST)

    try:
        # Get all active tenant users
        tenant_users = TenantUser.objects.filter(is_active=True)
        eligible_users = []
        current_user_included = False

        for user in tenant_users:
            # Get user permissions
            user_permissions = []
            user_roles = user.tenant_user_roles.filter(is_active=True)

            for user_role in user_roles:
                if user_role.role.permissions:
                    role_permissions = user_role.role.permissions
                    # Convert role permissions to list format
                    for perm, value in role_permissions.items():
                        if value is True:
                            user_permissions.append(perm)

            # Check if user can manage leads OR is the current user
            can_manage_leads = (
                'all' in user_permissions or
                'manage_leads' in user_permissions
            )

            is_current_user = user.id == request.user.id

            if can_manage_leads or is_current_user:
                # Get role names for display
                role_names = [ur.role.name for ur in user_roles]

                eligible_users.append({
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'full_name': user.full_name,
                    'email': user.email,
                    'roles': role_names,
                    'is_current_user': is_current_user
                })

                if is_current_user:
                    current_user_included = True

        # Sort to put current user first
        eligible_users.sort(key=lambda x: not x.get('is_current_user', False))

        return Response({
            'success': True,
            'count': len(eligible_users),
            'users': eligible_users,
            'current_user_included': current_user_included
        })

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Eligible lead owners error: {e}")
        return handle_safe_error("Internal server error", status.HTTP_500_INTERNAL_SERVER_ERROR)

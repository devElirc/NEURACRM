import re

from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tenant_core.models import Role, UserRole
from apps.tenant_core.utils import create_default_tenant_roles

from .models import Client, Domain
from .permissions import IsSuperAdmin

User = get_user_model()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def create_tenant(request):
    """
    Create a new tenant (company) with admin user
    Only accessible by super admins
    """
    data = request.data

    # Validate required fields
    required_fields = ['company_name', 'admin_email', 'admin_password', 'admin_first_name', 'admin_last_name']
    for field in required_fields:
        if not data.get(field):
            return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)

    company_name = data['company_name']
    admin_email = data['admin_email']

    # Generate schema name and domain
    schema_name = re.sub(r'[^a-zA-Z0-9]', '', company_name.lower())[:20]
    domain_name = f"{schema_name}.neuracrm.local"

    try:
        # Force public schema for tenant creation
        with schema_context('public'):
            # Check if company already exists
            if Client.objects.filter(name=company_name).exists():
                return Response({'error': 'Company already exists'}, status=status.HTTP_400_BAD_REQUEST)

            # Create tenant
            tenant = Client.objects.create(
                name=company_name,
                schema_name=schema_name,
                description=f"Tenant for {company_name}"
            )

            # Create domain
            Domain.objects.create(
                domain=domain_name,
                tenant=tenant,
                is_primary=True
            )

        # Switch to tenant schema to create admin user and roles
        with schema_context(schema_name):
            # Create default roles for this tenant
            create_default_tenant_roles()

            # Create admin user with unique username
            base_username = admin_email.split('@')[0]
            username = f"{base_username}_{schema_name}"

            admin_user = User.objects.create_user(
                username=username,
                email=admin_email,
                password=data['admin_password'],
                first_name=data['admin_first_name'],
                last_name=data['admin_last_name'],
                is_staff=True,
                is_superuser=True  # Give tenant admin full permissions within their tenant
            )

            # Assign admin role
            admin_role = Role.objects.get(role_type='admin')
            UserRole.objects.create(
                user=admin_user,
                role=admin_role,
                assigned_by=request.user
            )

        # Switch back to public schema to assign user to tenant
        with schema_context('public'):
            admin_user.tenants.add(tenant)

        return Response({
            'message': 'Tenant created successfully',
            'tenant': {
                'name': company_name,
                'schema': schema_name,
                'domain': domain_name,
                'admin_url': f"http://{domain_name}:8000/admin",
                'admin_email': admin_email
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def list_tenants(request):
    """
    List all tenants
    Only accessible by super admins
    """
    try:
        with schema_context('public'):
            tenants = []
            for client in Client.objects.all():
                domains = Domain.objects.filter(tenant=client)
                primary_domain = domains.filter(is_primary=True).first()

                tenant_info = {
                    'id': str(client.id),
                    'name': client.name,
                    'schema': client.schema_name,
                    'created_on': client.created_on,
                    'is_active': client.is_active,
                    'primary_domain': primary_domain.domain if primary_domain else None,
                    'admin_url': f"http://{primary_domain.domain}:8000/admin" if primary_domain else None
                }
                tenants.append(tenant_info)

            return Response({'tenants': tenants}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

"""
Test helper functions and utilities
"""
from typing import Any

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.core.authentication import JWTTokenGenerator
from apps.core.models import Client as TenantClient
from apps.core.models import Domain
from apps.tenant_core.models import Role, UserRole

User = get_user_model()


def create_test_tenant(schema_name: str = 'test_tenant', name: str = 'Test Company') -> TenantClient:
    """Create a test tenant with domain"""
    tenant = TenantClient.objects.create(
        schema_name=schema_name,
        name=name,
        description=f'Test tenant: {name}'
    )

    Domain.objects.create(
        domain=f'{schema_name}.localhost',
        tenant=tenant,
        is_primary=True
    )

    return tenant


def create_test_user(
    email: str = 'test@example.com',
    password: str = 'testpass123',
    first_name: str = 'Test',
    last_name: str = 'User',
    **kwargs
) -> User:
    """Create a test user"""
    username = email.split('@')[0]
    return User.objects.create_user(
        email=email,
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
        **kwargs
    )


def create_superadmin_user(
    email: str = 'superadmin@test.com',
    password: str = 'superpass123'
) -> User:
    """Create a superadmin user"""
    return create_test_user(
        email=email,
        password=password,
        first_name='Super',
        last_name='Admin',
        is_superadmin=True,
        is_staff=True,
        is_superuser=True
    )


def get_jwt_token(user: User, tenant_schema: str = None) -> tuple[str, str]:
    """Get JWT access and refresh tokens for user"""
    tokens = JWTTokenGenerator.generate_tokens(user, tenant_schema)
    return tokens['access_token'], tokens['refresh_token']


def authenticate_api_client(client: APIClient, user: User, tenant_schema: str = None) -> str:
    """Authenticate API client with user and return access token"""
    access_token, _ = get_jwt_token(user, tenant_schema)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    return access_token


def create_role_with_permissions(
    name: str,
    role_type: str,
    permissions: dict[str, bool]
) -> Role:
    """Create a role with specific permissions"""
    return Role.objects.create(
        name=name,
        role_type=role_type,
        permissions=permissions
    )


def assign_role_to_user(user: User, role: Role, assigned_by: User = None) -> UserRole:
    """Assign a role to a user"""
    return UserRole.objects.create(
        user=user,
        role=role,
        assigned_by=assigned_by
    )


def create_admin_role() -> Role:
    """Create admin role with full permissions"""
    return create_role_with_permissions(
        'Admin',
        'admin',
        {
            'all': True,
            'manage_team': True,
            'manage_opportunities': True,
            'manage_leads': True,
            'manage_contacts': True,
            'manage_tickets': True,
            'view_customers': True,
            'manage_knowledge_base': True,
            'manage_accounts': True,
            'manage_campaigns': True,
            'manage_reports': True,
            'manage_settings': True
        }
    )


def create_manager_role() -> Role:
    """Create manager role with team management permissions"""
    return create_role_with_permissions(
        'Manager',
        'manager',
        {
            'manage_team': True,
            'manage_opportunities': True,
            'manage_leads': True,
            'manage_contacts': True,
            'view_customers': True,
            'manage_reports': True
        }
    )


def create_sales_role() -> Role:
    """Create sales role with lead/contact permissions"""
    return create_role_with_permissions(
        'Sales Rep',
        'sales',
        {
            'manage_leads': True,
            'manage_contacts': True,
            'view_customers': True
        }
    )


def create_viewer_role() -> Role:
    """Create viewer role with read-only permissions"""
    return create_role_with_permissions(
        'Viewer',
        'viewer',
        {
            'view_only': True,
            'view_customers': True
        }
    )


def api_post(client: APIClient, url: str, data: dict[str, Any] = None) -> Any:
    """Make authenticated POST request"""
    return client.post(url, data=data, format='json')


def api_get(client: APIClient, url: str, params: dict[str, Any] = None) -> Any:
    """Make authenticated GET request"""
    return client.get(url, data=params, format='json')


def api_put(client: APIClient, url: str, data: dict[str, Any] = None) -> Any:
    """Make authenticated PUT request"""
    return client.put(url, data=data, format='json')


def api_patch(client: APIClient, url: str, data: dict[str, Any] = None) -> Any:
    """Make authenticated PATCH request"""
    return client.patch(url, data=data, format='json')


def api_delete(client: APIClient, url: str) -> Any:
    """Make authenticated DELETE request"""
    return client.delete(url)


def assert_response_status(response, expected_status: int):
    """Assert response has expected status code"""
    assert response.status_code == expected_status, (
        f'Expected status {expected_status}, got {response.status_code}. '
        f'Response: {getattr(response, "data", response.content)}'
    )


def assert_response_contains_fields(response, fields: list[str]):
    """Assert response contains specific fields"""
    for field in fields:
        assert field in response.data, f'Field {field} not found in response'


def assert_paginated_response(response, expected_count: int = None):
    """Assert response has pagination structure"""
    assert 'count' in response.data
    assert 'next' in response.data
    assert 'previous' in response.data
    assert 'results' in response.data

    if expected_count is not None:
        assert response.data['count'] == expected_count


def mock_request_data(
    user: User = None,
    ip_address: str = '127.0.0.1',
    user_agent: str = 'Test Client'
):
    """Create mock request data for testing"""
    class MockRequest:
        def __init__(self):
            self.user = user
            self.META = {
                'REMOTE_ADDR': ip_address,
                'HTTP_USER_AGENT': user_agent
            }

    return MockRequest()


def cleanup_test_data():
    """Cleanup test data after tests"""
    # This would be called in tearDown methods
    UserRole.objects.all().delete()
    Role.objects.all().delete()
    User.objects.filter(email__contains='test').delete()
    TenantClient.objects.filter(schema_name__contains='test').delete()


def compare_dict_subset(subset: dict[str, Any], full_dict: dict[str, Any]) -> bool:
    """Check if subset is contained in full_dict"""
    for key, value in subset.items():
        if key not in full_dict or full_dict[key] != value:
            return False
    return True


def get_nested_field(data: dict[str, Any], field_path: str, default=None):
    """Get nested field from dict using dot notation"""
    keys = field_path.split('.')
    current = data

    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default

    return current


def format_validation_errors(response) -> str:
    """Format DRF validation errors for debugging"""
    if hasattr(response, 'data') and isinstance(response.data, dict):
        errors = []
        for field, messages in response.data.items():
            if isinstance(messages, list):
                errors.append(f'{field}: {", ".join(messages)}')
            else:
                errors.append(f'{field}: {messages}')
        return '; '.join(errors)
    return str(response.data if hasattr(response, 'data') else response.content)

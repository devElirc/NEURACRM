"""
Test mixins for common functionality
"""
from django.contrib.auth import get_user_model
from django_tenants.test.cases import TenantTestCase
from django_tenants.test.client import TenantClient
from rest_framework.test import APIClient, APITestCase

from apps.core.authentication import JWTTokenGenerator
from apps.core.models import Client, Domain
from apps.tenant_core.models import Role, UserRole

# Import factories dynamically to avoid circular imports
# from .factories import (
#     ClientFactory, DomainFactory, UserFactory,
#     AdminRoleFactory, ManagerRoleFactory, SalesRoleFactory, ViewerRoleFactory
# )

User = get_user_model()


class TenantTestMixin:
    """Mixin for tests that need a tenant setup"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant = Client.objects.create(
            schema_name='test_tenant',
            name='Test Company'
        )
        cls.domain = Domain.objects.create(
            domain='test.localhost',
            tenant=cls.tenant,
            is_primary=True
        )

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'tenant'):
            cls.tenant.delete()
        super().tearDownClass()


class RoleTestMixin:
    """Mixin for tests that need role setup"""

    def setUp(self):
        super().setUp()
        self.admin_role = Role.objects.create(
            name='Admin',
            role_type='admin',
            permissions={'all': True}
        )
        self.manager_role = Role.objects.create(
            name='Manager',
            role_type='manager',
            permissions={'manage_team': True}
        )
        self.sales_role = Role.objects.create(
            name='Sales Rep',
            role_type='sales',
            permissions={'manage_leads': True}
        )
        self.viewer_role = Role.objects.create(
            name='Viewer',
            role_type='viewer',
            permissions={'view_only': True}
        )


class UserTestMixin:
    """Mixin for tests that need various user types"""

    def setUp(self):
        super().setUp()
        # Create users
        self.superadmin = User.objects.create_user(
            email='superadmin@test.com',
            username='superadmin',
            password='testpass123',
            is_superadmin=True,
            is_staff=True,
            is_superuser=True
        )

        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123'
        )
        self.manager_user = User.objects.create_user(
            email='manager@test.com',
            username='manager',
            password='testpass123'
        )
        self.sales_user = User.objects.create_user(
            email='sales@test.com',
            username='sales',
            password='testpass123'
        )
        self.viewer_user = User.objects.create_user(
            email='viewer@test.com',
            username='viewer',
            password='testpass123'
        )

        # Add users to tenant if available
        if hasattr(self, 'tenant'):
            for user in [self.admin_user, self.manager_user, self.sales_user, self.viewer_user]:
                user.tenants.add(self.tenant)


class AuthTestMixin:
    """Mixin for API tests with authentication"""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

        # Create default test user if not exists
        if not hasattr(self, 'user'):
            self.user = User.objects.create_user(
                email='test@example.com',
                username='testuser',
                password='testpass123'
            )

    def authenticate_user(self, user=None):
        """Authenticate a user and return access token"""
        if user is None:
            user = self.user

        tokens = JWTTokenGenerator.generate_tokens(user)
        access_token = tokens['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        return access_token

    def unauthenticate(self):
        """Remove authentication"""
        self.client.credentials()


class PermissionTestMixin:
    """Mixin for testing role-based permissions"""

    def setUp(self):
        super().setUp()
        if hasattr(self, 'admin_role') and hasattr(self, 'admin_user'):
            UserRole.objects.create(user=self.admin_user, role=self.admin_role)

        if hasattr(self, 'manager_role') and hasattr(self, 'manager_user'):
            UserRole.objects.create(user=self.manager_user, role=self.manager_role)

        if hasattr(self, 'sales_role') and hasattr(self, 'sales_user'):
            UserRole.objects.create(user=self.sales_user, role=self.sales_role)

        if hasattr(self, 'viewer_role') and hasattr(self, 'viewer_user'):
            UserRole.objects.create(user=self.viewer_user, role=self.viewer_role)

    def assert_user_has_permission(self, user, permission):
        """Assert that user has specific permission"""
        self.assertTrue(
            user.has_permission(permission),
            f'User {user.email} should have {permission} permission'
        )

    def assert_user_lacks_permission(self, user, permission):
        """Assert that user lacks specific permission"""
        self.assertFalse(
            user.has_permission(permission),
            f'User {user.email} should not have {permission} permission'
        )


class APIPaginationTestMixin:
    """Mixin for testing API pagination"""

    def assert_paginated_response(self, response, expected_count=None):
        """Assert response has pagination structure"""
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)

        if expected_count is not None:
            self.assertEqual(response.data['count'], expected_count)


class APIErrorTestMixin:
    """Mixin for testing API error responses"""

    def assert_unauthorized_response(self, response):
        """Assert response indicates unauthorized access"""
        self.assertEqual(response.status_code, 401)

    def assert_forbidden_response(self, response):
        """Assert response indicates forbidden access"""
        self.assertEqual(response.status_code, 403)

    def assert_not_found_response(self, response):
        """Assert response indicates resource not found"""
        self.assertEqual(response.status_code, 404)

    def assert_bad_request_response(self, response):
        """Assert response indicates bad request"""
        self.assertEqual(response.status_code, 400)

    def assert_validation_error(self, response, field=None):
        """Assert response contains validation errors"""
        self.assertEqual(response.status_code, 400)
        if field:
            self.assertIn(field, response.data)


class FullTestMixin(
    TenantTestMixin,
    RoleTestMixin,
    UserTestMixin,
    AuthTestMixin,
    PermissionTestMixin,
    APIPaginationTestMixin,
    APIErrorTestMixin
):
    """Complete mixin with all test utilities"""
    pass


class BaseTenantAPITestCase(FullTestMixin, TenantTestCase):
    """Base test case for tenant API tests"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.c = TenantClient(cls.tenant)

    def setUp(self):
        super().setUp()
        self.client = APIClient()


class BaseAPITestCase(FullTestMixin, APITestCase):
    """Base test case for API tests"""
    pass

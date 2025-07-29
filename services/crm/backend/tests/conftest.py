"""
Pytest configuration and fixtures for NeuraCRM3 tests
"""
import pytest
from django.contrib.auth import get_user_model
from django_tenants.test.cases import TenantTestCase
from django_tenants.test.client import TenantClient
from django_tenants.utils import get_public_schema_name, get_tenant_model
from rest_framework.test import APIClient

from apps.core.authentication import JWTTokenGenerator
from apps.core.models import Client, Domain
from apps.tenant_core.models import Role

User = get_user_model()


@pytest.fixture(scope='session')
def django_db_setup():
    """Setup database for tests"""
    pass


@pytest.fixture
def public_client():
    """Public schema client for system-level tests"""
    return TenantClient(get_tenant_model().objects.get(schema_name=get_public_schema_name()))


@pytest.fixture
def test_tenant():
    """Create a test tenant"""
    tenant = Client.objects.create(
        schema_name='test_tenant',
        name='Test Company',
        description='Test company for testing'
    )

    # Create domain
    Domain.objects.create(
        domain='test.localhost',
        tenant=tenant,
        is_primary=True
    )

    return tenant


@pytest.fixture
def tenant_client(test_tenant):
    """Tenant-specific client"""
    return TenantClient(test_tenant)


@pytest.fixture
def api_client():
    """DRF API client"""
    return APIClient()


@pytest.fixture
def superadmin_user():
    """Create superadmin user"""
    user = User.objects.create_user(
        email='superadmin@test.com',
        username='superadmin',
        password='testpass123',
        first_name='Super',
        last_name='Admin',
        is_superadmin=True,
        is_staff=True,
        is_superuser=True
    )
    return user


@pytest.fixture
def tenant_admin_user(test_tenant):
    """Create tenant admin user"""
    user = User.objects.create_user(
        email='admin@test.com',
        username='admin',
        password='testpass123',
        first_name='Admin',
        last_name='User'
    )
    user.tenants.add(test_tenant)
    return user


@pytest.fixture
def tenant_user(test_tenant):
    """Create regular tenant user"""
    user = User.objects.create_user(
        email='user@test.com',
        username='user',
        password='testpass123',
        first_name='Regular',
        last_name='User'
    )
    user.tenants.add(test_tenant)
    return user


@pytest.fixture
def admin_role():
    """Create admin role"""
    return Role.objects.create(
        name='Admin',
        role_type='admin',
        permissions={
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


@pytest.fixture
def manager_role():
    """Create manager role"""
    return Role.objects.create(
        name='Manager',
        role_type='manager',
        permissions={
            'manage_team': True,
            'manage_opportunities': True,
            'manage_leads': True,
            'manage_contacts': True,
            'view_customers': True,
            'manage_reports': True
        }
    )


@pytest.fixture
def sales_role():
    """Create sales role"""
    return Role.objects.create(
        name='Sales Rep',
        role_type='sales',
        permissions={
            'manage_leads': True,
            'manage_contacts': True,
            'view_customers': True
        }
    )


@pytest.fixture
def viewer_role():
    """Create viewer role"""
    return Role.objects.create(
        name='Viewer',
        role_type='viewer',
        permissions={
            'view_only': True,
            'view_customers': True
        }
    )


@pytest.fixture
def authenticated_client(api_client, tenant_user):
    """API client with authenticated user"""
    tokens = JWTTokenGenerator.generate_tokens(tenant_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access_token"]}')
    return api_client


@pytest.fixture
def admin_authenticated_client(api_client, tenant_admin_user):
    """API client with authenticated admin user"""
    tokens = JWTTokenGenerator.generate_tokens(tenant_admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access_token"]}')
    return api_client


class TenantTestMixin:
    """Mixin for tenant-aware tests"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create test tenant
        cls.tenant = Client.objects.create(
            schema_name='test_tenant',
            name='Test Company'
        )

        # Create domain
        cls.domain = Domain.objects.create(
            domain='test.localhost',
            tenant=cls.tenant,
            is_primary=True
        )

    @classmethod
    def tearDownClass(cls):
        cls.tenant.delete()
        super().tearDownClass()


class APITestMixin:
    """Mixin for API tests with authentication"""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Get JWT token
        tokens = JWTTokenGenerator.generate_tokens(self.user)
        self.access_token = tokens['access_token']

        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def login_user(self, user):
        """Helper to login a specific user"""
        tokens = JWTTokenGenerator.generate_tokens(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access_token"]}')
        return tokens["access_token"]


@pytest.mark.django_db
class BaseTenantTestCase(TenantTestCase):
    """Base test case for tenant-specific tests"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant = get_tenant_model().objects.create(
            schema_name='test_tenant',
            name='Test Company'
        )

        cls.domain = Domain.objects.create(
            domain='test.localhost',
            tenant=cls.tenant,
            is_primary=True
        )

    def setUp(self):
        super().setUp()
        self.client = TenantClient(self.tenant)

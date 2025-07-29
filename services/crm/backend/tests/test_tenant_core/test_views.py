"""
Tests for tenant_core app views
"""
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.tenant_core.models import AuditLog, Role, UserRole
from tests.utils.helpers import (
    assign_role_to_user,
    authenticate_api_client,
    create_admin_role,
    create_manager_role,
    create_test_tenant,
    create_test_user,
)

User = get_user_model()


class TenantUserListCreateViewTest(APITestCase):
    """Test TenantUserListCreateView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/tenant/users/'

        # Create tenant and users
        self.tenant = create_test_tenant()
        self.admin_user = create_test_user(email='admin@test.com')
        self.regular_user = create_test_user(email='user@test.com')

        # Add users to tenant
        self.admin_user.tenants.add(self.tenant)
        self.regular_user.tenants.add(self.tenant)

        # Create admin role and assign to admin user
        self.admin_role = create_admin_role()
        assign_role_to_user(self.admin_user, self.admin_role)

        # Authenticate as admin
        authenticate_api_client(self.client, self.admin_user)

    @patch('apps.tenant_core.views.getattr')
    def test_list_tenant_users(self, mock_getattr):
        """Test listing tenant users"""
        mock_getattr.return_value = self.tenant

        with patch('django.db.connection') as mock_connection:
            mock_connection.schema_name = self.tenant.schema_name
            mock_connection.tenant = self.tenant

            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    @patch('apps.tenant_core.views.getattr')
    def test_create_tenant_user(self, mock_getattr):
        """Test creating a new tenant user"""
        mock_getattr.return_value = self.tenant

        data = {
            'email': 'newuser@test.com',
            'username': 'newuser',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpass123'
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify user was created
        new_user = User.objects.get(email='newuser@test.com')
        self.assertEqual(new_user.first_name, 'New')
        self.assertEqual(new_user.last_name, 'User')

        # Verify user was added to tenant
        self.assertIn(self.tenant, new_user.tenants.all())

    def test_create_user_unauthorized(self):
        """Test creating user without proper permissions"""
        self.client.credentials()  # Remove authentication

        data = {
            'email': 'newuser@test.com',
            'username': 'newuser',
            'password': 'newpass123'
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_user_invalid_data(self):
        """Test creating user with invalid data"""
        data = {
            'email': 'invalid-email',
            'username': 'newuser'
            # Missing required fields
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TenantUserDetailViewTest(APITestCase):
    """Test TenantUserDetailView"""

    def setUp(self):
        self.client = APIClient()

        # Create tenant and users
        self.tenant = create_test_tenant()
        self.admin_user = create_test_user(email='admin@test.com')
        self.target_user = create_test_user(email='target@test.com')

        # Add users to tenant
        self.admin_user.tenants.add(self.tenant)
        self.target_user.tenants.add(self.tenant)

        # Create admin role and assign to admin user
        self.admin_role = create_admin_role()
        assign_role_to_user(self.admin_user, self.admin_role)

        # Authenticate as admin
        authenticate_api_client(self.client, self.admin_user)

        self.url = f'/api/tenant/users/{self.target_user.id}/'

    def test_retrieve_user(self):
        """Test retrieving a user"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'target@test.com')

    def test_update_user(self):
        """Test updating a user"""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }

        response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        self.target_user.refresh_from_db()
        self.assertEqual(self.target_user.first_name, 'Updated')
        self.assertEqual(self.target_user.last_name, 'Name')

    def test_delete_user(self):
        """Test soft deleting a user"""
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify user is deactivated, not deleted
        self.target_user.refresh_from_db()
        self.assertFalse(self.target_user.is_active)

    def test_retrieve_nonexistent_user(self):
        """Test retrieving non-existent user"""
        url = '/api/tenant/users/99999999-9999-9999-9999-999999999999/'

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RoleListCreateViewTest(APITestCase):
    """Test RoleListCreateView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/tenant/roles/'

        # Create tenant and admin user
        self.tenant = create_test_tenant()
        self.admin_user = create_test_user(email='admin@test.com')
        self.admin_user.tenants.add(self.tenant)

        # Create and assign admin role
        self.admin_role = create_admin_role()
        assign_role_to_user(self.admin_user, self.admin_role)

        # Authenticate as admin
        authenticate_api_client(self.client, self.admin_user)

    def test_list_roles(self):
        """Test listing roles"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

        # Should include the admin role created in setUp
        role_names = [role['name'] for role in response.data['results']]
        self.assertIn('Admin', role_names)

    def test_create_role(self):
        """Test creating a new role"""
        data = {
            'name': 'Custom Role',
            'role_type': 'custom',
            'description': 'A custom role',
            'permissions': {
                'manage_leads': True,
                'view_customers': True
            }
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify role was created
        role = Role.objects.get(name='Custom Role')
        self.assertEqual(role.role_type, 'custom')
        self.assertEqual(role.description, 'A custom role')
        self.assertTrue(role.permissions['manage_leads'])

    def test_create_role_unauthorized(self):
        """Test creating role without proper permissions"""
        # Create regular user without admin role
        regular_user = create_test_user(email='user@test.com')
        regular_user.tenants.add(self.tenant)
        authenticate_api_client(self.client, regular_user)

        data = {
            'name': 'Test Role',
            'role_type': 'custom'
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_role_duplicate_name_type(self):
        """Test creating role with duplicate name and type"""
        # Create first role
        Role.objects.create(name='Test Role', role_type='custom')

        data = {
            'name': 'Test Role',
            'role_type': 'custom'
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserRoleListCreateViewTest(APITestCase):
    """Test UserRoleListCreateView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/tenant/user-roles/'

        # Create tenant and users
        self.tenant = create_test_tenant()
        self.admin_user = create_test_user(email='admin@test.com')
        self.target_user = create_test_user(email='target@test.com')

        # Add users to tenant
        self.admin_user.tenants.add(self.tenant)
        self.target_user.tenants.add(self.tenant)

        # Create roles
        self.admin_role = create_admin_role()
        self.manager_role = create_manager_role()

        # Assign admin role to admin user
        assign_role_to_user(self.admin_user, self.admin_role)

        # Authenticate as admin
        authenticate_api_client(self.client, self.admin_user)

    def test_list_user_roles(self):
        """Test listing user roles"""
        # Create a user role assignment
        UserRole.objects.create(
            user=self.target_user,
            role=self.manager_role,
            assigned_by=self.admin_user
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertGreater(response.data['count'], 0)

    def test_create_user_role(self):
        """Test creating a user role assignment"""
        data = {
            'user': str(self.target_user.id),
            'role': str(self.manager_role.id)
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify assignment was created
        user_role = UserRole.objects.get(
            user=self.target_user,
            role=self.manager_role
        )
        self.assertEqual(user_role.assigned_by, self.admin_user)
        self.assertTrue(user_role.is_active)

    def test_create_duplicate_user_role(self):
        """Test creating duplicate user role assignment"""
        # Create first assignment
        UserRole.objects.create(
            user=self.target_user,
            role=self.manager_role
        )

        data = {
            'user': str(self.target_user.id),
            'role': str(self.manager_role.id)
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuditLogListViewTest(APITestCase):
    """Test AuditLogListView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/tenant/audit/'

        # Create tenant and admin user
        self.tenant = create_test_tenant()
        self.admin_user = create_test_user(email='admin@test.com')
        self.admin_user.tenants.add(self.tenant)

        # Create admin role and assign
        self.admin_role = create_admin_role()
        assign_role_to_user(self.admin_user, self.admin_role)

        # Create test audit logs
        self.audit_log1 = AuditLog.objects.create(
            user=self.admin_user,
            action='create',
            model_name='User',
            object_id='123'
        )

        self.audit_log2 = AuditLog.objects.create(
            user=self.admin_user,
            action='update',
            model_name='Role',
            object_id='456'
        )

        # Authenticate as admin
        authenticate_api_client(self.client, self.admin_user)

    def test_list_audit_logs(self):
        """Test listing audit logs"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 2)

    def test_filter_audit_logs_by_user(self):
        """Test filtering audit logs by user"""
        url = f'{self.url}?user_id={self.admin_user.id}'

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_audit_logs_by_action(self):
        """Test filtering audit logs by action"""
        url = f'{self.url}?action=create'

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['action'], 'create')

    def test_filter_audit_logs_by_model(self):
        """Test filtering audit logs by model name"""
        url = f'{self.url}?model_name=User'

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model_name'], 'User')

    def test_audit_logs_unauthorized(self):
        """Test accessing audit logs without proper permissions"""
        # Create regular user without admin permissions
        regular_user = create_test_user(email='user@test.com')
        regular_user.tenants.add(self.tenant)
        authenticate_api_client(self.client, regular_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TenantDashboardStatsViewTest(APITestCase):
    """Test tenant_dashboard_stats view"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/tenant/dashboard/'

        # Create tenant and user
        self.tenant = create_test_tenant()
        self.user = create_test_user(email='user@test.com')
        self.user.tenants.add(self.tenant)

        # Authenticate user
        authenticate_api_client(self.client, self.user)

    @patch('apps.tenant_core.views.getattr')
    def test_tenant_dashboard_stats(self, mock_getattr):
        """Test getting tenant dashboard statistics"""
        mock_getattr.return_value = self.tenant

        # Create some test data
        role = create_admin_role()
        UserRole.objects.create(user=self.user, role=role)

        with patch('django.db.connection') as mock_connection:
            mock_connection.schema_name = self.tenant.schema_name
            mock_connection.tenant = self.tenant

            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        data = response.data['data']
        self.assertEqual(data['tenant_name'], self.tenant.name)
        self.assertEqual(data['tenant_schema'], self.tenant.schema_name)
        self.assertIn('tenant_users', data)
        self.assertIn('total_roles', data)
        self.assertIn('user_roles', data)

    @patch('apps.tenant_core.views.getattr')
    def test_public_schema_dashboard_stats(self, mock_getattr):
        """Test getting dashboard stats in public schema"""
        # Mock public schema
        public_tenant = Mock()
        public_tenant.schema_name = 'public'
        mock_getattr.return_value = public_tenant

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        data = response.data['data']
        self.assertIn('profile_complete', data)
        self.assertIn('roles_count', data)

    def test_dashboard_stats_unauthenticated(self):
        """Test dashboard stats without authentication"""
        self.client.credentials()  # Remove authentication

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

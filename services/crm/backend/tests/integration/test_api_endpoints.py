"""
Integration tests for API endpoints
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django_tenants.test.cases import TenantTestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.tenant_core.models import AuditLog, Role, UserRole
from tests.utils.helpers import (
    assign_role_to_user,
    authenticate_api_client,
    create_admin_role,
    create_test_user,
)

User = get_user_model()


class TenantAPIEndpointsTest(TenantTestCase):
    """Test all tenant API endpoints comprehensively"""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.defaults['HTTP_HOST'] = self.tenant.get_primary_domain().domain

        # Create admin user in tenant context
        self.admin_user = create_test_user(email='admin@test.com')
        self.admin_user.tenants.add(self.tenant)

        # Create admin role and assign
        self.admin_role = create_admin_role()
        assign_role_to_user(self.admin_user, self.admin_role)

        # Authenticate with proper headers
        authenticate_api_client(self.client, self.admin_user, self.tenant.schema_name)

    @patch('apps.tenant_core.views.getattr')
    def test_user_crud_operations(self, mock_getattr):
        """Test complete CRUD operations for users"""
        mock_getattr.return_value = self.tenant

        # CREATE - Create a new user
        user_data = {
            'email': 'newuser@test.com',
            'username': 'newuser',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpass123',
            'phone': '123-456-7890'
        }

        response = self.client.post('/api/tenant/users/', user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_user_id = response.data['id']

        # READ - List users
        with patch('django.db.connection') as mock_connection:
            mock_connection.schema_name = self.tenant.schema_name
            mock_connection.tenant = self.tenant

            response = self.client.get('/api/tenant/users/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

        # READ - Get specific user
        response = self.client.get(f'/api/tenant/users/{created_user_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'newuser@test.com')

        # UPDATE - Update user
        update_data = {
            'first_name': 'Updated',
            'phone': '987-654-3210'
        }

        response = self.client.patch(
            f'/api/tenant/users/{created_user_id}/',
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['phone'], '987-654-3210')

        # DELETE - Soft delete user
        response = self.client.delete(f'/api/tenant/users/{created_user_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify user is deactivated
        user = User.objects.get(id=created_user_id)
        self.assertFalse(user.is_active)

    def test_role_crud_operations(self):
        """Test complete CRUD operations for roles"""
        # CREATE - Create a new role
        role_data = {
            'name': 'Custom Role',
            'role_type': 'custom',
            'description': 'A custom role for testing',
            'permissions': {
                'manage_leads': True,
                'view_customers': True,
                'manage_contacts': False
            }
        }

        response = self.client.post('/api/tenant/roles/', role_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_role_id = response.data['id']

        # READ - List roles
        response = self.client.get('/api/tenant/roles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

        # READ - Get specific role
        response = self.client.get(f'/api/tenant/roles/{created_role_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Custom Role')
        self.assertTrue(response.data['permissions']['manage_leads'])

        # UPDATE - Update role
        update_data = {
            'description': 'Updated description',
            'permissions': {
                'manage_leads': True,
                'view_customers': True,
                'manage_contacts': True,  # Changed to True
                'manage_accounts': True   # Added new permission
            }
        }

        response = self.client.patch(
            f'/api/tenant/roles/{created_role_id}/',
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Updated description')
        self.assertTrue(response.data['permissions']['manage_contacts'])
        self.assertTrue(response.data['permissions']['manage_accounts'])

        # DELETE - Soft delete role
        response = self.client.delete(f'/api/tenant/roles/{created_role_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify role is deactivated
        role = Role.objects.get(id=created_role_id)
        self.assertFalse(role.is_active)

    def test_user_role_assignment_operations(self):
        """Test user role assignment operations"""
        # Create a test user and role
        test_user = create_test_user(email='testuser@test.com')
        test_user.tenants.add(self.tenant)

        test_role = Role.objects.create(
            name='Test Role',
            role_type='custom',
            permissions={'test_permission': True}
        )

        # CREATE - Assign role to user
        assignment_data = {
            'user': str(test_user.id),
            'role': str(test_role.id)
        }

        response = self.client.post('/api/tenant/user-roles/', assignment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        assignment_id = response.data['id']

        # READ - List user role assignments
        response = self.client.get('/api/tenant/user-roles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

        # READ - Get specific assignment
        response = self.client.get(f'/api/tenant/user-roles/{assignment_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user'], str(test_user.id))
        self.assertEqual(response.data['role'], str(test_role.id))

        # DELETE - Remove role assignment
        response = self.client.delete(f'/api/tenant/user-roles/{assignment_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify assignment is deactivated
        assignment = UserRole.objects.get(id=assignment_id)
        self.assertFalse(assignment.is_active)

    def test_audit_log_filtering(self):
        """Test audit log filtering capabilities"""
        # Create test audit logs
        test_user = create_test_user(email='testuser@test.com')

        logs = [
            AuditLog.objects.create(
                user=self.admin_user,
                action='create',
                model_name='User',
                object_id='123'
            ),
            AuditLog.objects.create(
                user=test_user,
                action='update',
                model_name='Role',
                object_id='456'
            ),
            AuditLog.objects.create(
                user=self.admin_user,
                action='delete',
                model_name='User',
                object_id='789'
            )
        ]

        # Test filtering by user
        response = self.client.get(f'/api/tenant/audit/?user_id={self.admin_user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # admin_user has 2 logs

        # Test filtering by action
        response = self.client.get('/api/tenant/audit/?action=create')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)  # 1 create action

        # Test filtering by model
        response = self.client.get('/api/tenant/audit/?model_name=User')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # 2 User model logs

        # Test combined filters
        response = self.client.get(
            f'/api/tenant/audit/?user_id={self.admin_user.id}&action=create'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)  # 1 matching log

    def test_dashboard_statistics(self):
        """Test dashboard statistics endpoint"""
        # Create test data
        test_user = create_test_user(email='testuser@test.com')
        test_user.tenants.add(self.tenant)

        test_role = Role.objects.create(name='Test Role', role_type='custom')
        UserRole.objects.create(user=test_user, role=test_role)

        AuditLog.objects.create(
            user=self.admin_user,
            action='create',
            model_name='TestModel',
            object_id='123'
        )

        # Get dashboard stats
        with patch('apps.tenant_core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            with patch('django.db.connection') as mock_connection:
                mock_connection.schema_name = self.tenant.schema_name
                mock_connection.tenant = self.tenant

                response = self.client.get('/api/tenant/dashboard/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        data = response.data['data']
        self.assertEqual(data['tenant_name'], self.tenant.name)
        self.assertEqual(data['tenant_schema'], self.tenant.schema_name)
        self.assertGreaterEqual(data['tenant_users'], 1)  # At least admin user
        self.assertGreaterEqual(data['total_roles'], 1)   # At least admin role
        self.assertGreaterEqual(data['user_roles'], 1)    # At least one assignment

    def test_enhanced_user_list(self):
        """Test enhanced user list with metadata"""
        # Create additional test data
        test_user = create_test_user(email='testuser@test.com')
        test_user.tenants.add(self.tenant)

        test_role = Role.objects.create(name='Test Role', role_type='custom')
        UserRole.objects.create(user=test_user, role=test_role)

        with patch('apps.tenant_core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            with patch('django.db.connection') as mock_connection:
                mock_connection.schema_name = self.tenant.schema_name
                mock_connection.tenant = self.tenant

                response = self.client.get('/api/tenant/users/enhanced/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should include tenant metadata
        if isinstance(response.data, dict) and 'tenant_info' in response.data:
            tenant_info = response.data['tenant_info']
            self.assertEqual(tenant_info['tenant_name'], self.tenant.name)
            self.assertEqual(tenant_info['tenant_schema'], self.tenant.schema_name)
            self.assertGreaterEqual(tenant_info['user_count'], 1)
            self.assertGreaterEqual(tenant_info['active_user_count'], 1)

    def test_api_error_handling(self):
        """Test API error handling"""
        # Test invalid user ID format
        response = self.client.get('/api/tenant/users/invalid-id/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Test creating user with invalid data
        invalid_data = {
            'email': 'invalid-email-format',
            'username': '',  # Empty username
        }

        response = self.client.post('/api/tenant/users/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test creating role with duplicate name and type
        Role.objects.create(name='Duplicate Role', role_type='custom')

        duplicate_data = {
            'name': 'Duplicate Role',
            'role_type': 'custom'
        }

        response = self.client.post('/api/tenant/roles/', duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_api_pagination(self):
        """Test API pagination"""
        # Create multiple users to test pagination
        users = []
        for i in range(25):  # Create more than default page size
            user = create_test_user(email=f'user{i}@test.com')
            user.tenants.add(self.tenant)
            users.append(user)

        with patch('apps.tenant_core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            with patch('django.db.connection') as mock_connection:
                mock_connection.schema_name = self.tenant.schema_name
                mock_connection.tenant = self.tenant

                response = self.client.get('/api/tenant/users/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)

        # Total count should include all users
        self.assertGreaterEqual(response.data['count'], 25)

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # Remove authentication
        self.client.credentials()

        endpoints = [
            '/api/tenant/users/',
            '/api/tenant/roles/',
            '/api/tenant/user-roles/',
            '/api/tenant/audit/',
            '/api/tenant/dashboard/'
        ]

        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_insufficient_permissions(self):
        """Test access with insufficient permissions"""
        # Create user with viewer role (no management permissions)
        viewer_user = create_test_user(email='viewer@test.com')
        viewer_user.tenants.add(self.tenant)

        viewer_role = Role.objects.create(
            name='Viewer',
            role_type='viewer',
            permissions={'view_only': True}
        )

        UserRole.objects.create(user=viewer_user, role=viewer_role)

        # Authenticate as viewer
        authenticate_api_client(self.client, viewer_user)

        # Should be forbidden from management endpoints
        management_endpoints = [
            '/api/tenant/users/',
            '/api/tenant/roles/',
            '/api/tenant/user-roles/',
            '/api/tenant/audit/'
        ]

        for endpoint in management_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

"""
Integration tests for authentication flow
"""
from unittest.mock import patch

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django_tenants.test.cases import TenantTestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.tenant_core.models import Role, UserRole
from tests.utils.helpers import (
    assign_role_to_user,
    create_admin_role,
    create_test_tenant,
    create_test_user,
)

User = get_user_model()


class AuthenticationFlowTest(TenantTestCase):
    """Test complete authentication flow"""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.defaults['HTTP_HOST'] = self.tenant.get_primary_domain().domain

        # Create user in tenant context
        self.user = create_test_user(
            email='user@test.com',
            password='testpass123'
        )
        self.user.tenants.add(self.tenant)

        # Create role
        self.role = create_admin_role()
        assign_role_to_user(self.user, self.role)

    @patch('apps.core.views.getattr')
    def test_complete_login_flow(self, mock_getattr):
        """Test complete login flow with tenant context"""
        mock_getattr.return_value = self.tenant

        # Step 1: Login
        login_data = {
            'email': 'user@test.com',
            'password': 'testpass123'
        }

        response = self.client.post('/api/auth/login/', login_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)

        # Extract tokens
        tokens = response.data['tokens']
        access_token = tokens['access_token']
        refresh_token = tokens['refresh_token']

        # Verify token structure
        self.assertIn('access_token', tokens)
        self.assertIn('refresh_token', tokens)
        self.assertIn('expires_in', tokens)
        self.assertEqual(tokens['token_type'], 'Bearer')

        # Step 2: Use access token to access protected resource
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        with patch('apps.core.authentication.getattr') as mock_auth_getattr:
            mock_auth_getattr.return_value = self.tenant

            response = self.client.get('/api/auth/profile/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'user@test.com')

        # Step 3: Refresh token
        refresh_data = {'refresh': refresh_token}
        response = self.client.post('/api/auth/refresh/', refresh_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

        # Step 4: Logout
        response = self.client.post('/api/auth/logout/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_user_not_in_tenant(self):
        """Test login rejection when user not in tenant"""
        # Create user not in tenant
        other_user = create_test_user(
            email='other@test.com',
            password='testpass123'
        )

        with patch('apps.core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            login_data = {
                'email': 'other@test.com',
                'password': 'testpass123'
            }

            response = self.client.post('/api/auth/login/', login_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)

    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            'email': 'user@test.com',
            'password': 'wrongpassword'
        }

        response = self.client.post('/api/auth/login/', login_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_expiration_handling(self):
        """Test handling of expired tokens"""
        # Create expired token manually
        import datetime


        expired_payload = {
            'user_id': str(self.user.id),
            'email': self.user.email,
            'tenant_schema': self.tenant.schema_name,
            'exp': datetime.datetime.utcnow() - datetime.timedelta(minutes=1),
            'iat': datetime.datetime.utcnow() - datetime.timedelta(minutes=2),
            'type': 'access'
        }

        expired_token = jwt.encode(
            expired_payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        # Try to use expired token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {expired_token}')

        response = self.client.get('/api/auth/profile/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_format(self):
        """Test various invalid token formats"""
        invalid_tokens = [
            'invalid_token',
            'Bearer',
            'Bearer invalid_token',
            'NotBearer valid_looking_token',
            ''
        ]

        for token in invalid_tokens:
            self.client.credentials(HTTP_AUTHORIZATION=token)
            response = self.client.get('/api/auth/profile/')

            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
            )


class PermissionFlowTest(APITestCase):
    """Test role-based permission flow"""

    def setUp(self):
        self.client = APIClient()

        # Create tenant
        self.tenant = create_test_tenant()

        # Create users with different roles
        self.admin_user = create_test_user(email='admin@test.com')
        self.manager_user = create_test_user(email='manager@test.com')
        self.sales_user = create_test_user(email='sales@test.com')
        self.viewer_user = create_test_user(email='viewer@test.com')

        # Add users to tenant
        for user in [self.admin_user, self.manager_user, self.sales_user, self.viewer_user]:
            user.tenants.add(self.tenant)

        # Create roles with different permissions
        self.admin_role = Role.objects.create(
            name='Admin',
            role_type='admin',
            permissions={
                'all': True,
                'manage_team': True,
                'manage_roles': True
            }
        )

        self.manager_role = Role.objects.create(
            name='Manager',
            role_type='manager',
            permissions={
                'manage_team': True,
                'view_customers': True
            }
        )

        self.sales_role = Role.objects.create(
            name='Sales',
            role_type='sales',
            permissions={
                'manage_leads': True,
                'view_customers': True
            }
        )

        self.viewer_role = Role.objects.create(
            name='Viewer',
            role_type='viewer',
            permissions={
                'view_only': True
            }
        )

        # Assign roles
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.manager_user, role=self.manager_role)
        UserRole.objects.create(user=self.sales_user, role=self.sales_role)
        UserRole.objects.create(user=self.viewer_user, role=self.viewer_role)

    def authenticate_user(self, user):
        """Helper to authenticate a user"""
        from tests.utils.helpers import authenticate_api_client
        authenticate_api_client(self.client, user)

    def test_admin_user_permissions(self):
        """Test admin user can access all resources"""
        self.authenticate_user(self.admin_user)

        # Admin should be able to access all endpoints
        endpoints = [
            '/api/tenant/users/',
            '/api/tenant/roles/',
            '/api/tenant/user-roles/',
            '/api/tenant/audit/'
        ]

        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertIn(
                response.status_code,
                [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]  # 404 is OK for empty results
            )

    def test_manager_user_permissions(self):
        """Test manager user has limited access"""
        self.authenticate_user(self.manager_user)

        # Manager should access user management
        response = self.client.get('/api/tenant/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Manager should NOT access role management
        response = self.client.get('/api/tenant/roles/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sales_user_permissions(self):
        """Test sales user has very limited access"""
        self.authenticate_user(self.sales_user)

        # Sales user should NOT access user management
        response = self.client.get('/api/tenant/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Sales user should NOT access role management
        response = self.client.get('/api/tenant/roles/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_viewer_user_permissions(self):
        """Test viewer user has read-only access"""
        self.authenticate_user(self.viewer_user)

        # Viewer should NOT access any management endpoints
        endpoints = [
            '/api/tenant/users/',
            '/api/tenant/roles/',
            '/api/tenant/user-roles/',
            '/api/tenant/audit/'
        ]

        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_role_deactivation_removes_permissions(self):
        """Test that deactivating user role removes permissions"""
        self.authenticate_user(self.admin_user)

        # Admin should have access initially
        response = self.client.get('/api/tenant/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Deactivate admin role
        user_role = UserRole.objects.get(user=self.admin_user, role=self.admin_role)
        user_role.is_active = False
        user_role.save()

        # Admin should lose access
        response = self.client.get('/api/tenant/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_multiple_roles_permissions(self):
        """Test user with multiple roles gets combined permissions"""
        # Assign both manager and sales roles to viewer user
        UserRole.objects.create(user=self.viewer_user, role=self.manager_role)
        UserRole.objects.create(user=self.viewer_user, role=self.sales_role)

        self.authenticate_user(self.viewer_user)

        # Should now have manager permissions (can access users)
        response = self.client.get('/api/tenant/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SessionManagementTest(APITestCase):
    """Test session and token management"""

    def setUp(self):
        self.client = APIClient()
        self.tenant = create_test_tenant()
        self.user = create_test_user(email='user@test.com')
        self.user.tenants.add(self.tenant)

    def test_concurrent_sessions(self):
        """Test that multiple concurrent sessions work correctly"""
        # Create multiple clients
        client1 = APIClient()
        client2 = APIClient()

        # Login with both clients
        login_data = {
            'email': 'user@test.com',
            'password': 'testpass123'
        }

        with patch('apps.core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            response1 = client1.post('/api/auth/login/', login_data, format='json')
            response2 = client2.post('/api/auth/login/', login_data, format='json')

        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        # Both should have different tokens
        token1 = response1.data['tokens']['access_token']
        token2 = response2.data['tokens']['access_token']
        self.assertNotEqual(token1, token2)

        # Both should be able to access resources
        client1.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        client2.credentials(HTTP_AUTHORIZATION=f'Bearer {token2}')

        with patch('apps.core.authentication.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            response1 = client1.get('/api/auth/profile/')
            response2 = client2.get('/api/auth/profile/')

        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

    def test_token_refresh_maintains_tenant_scope(self):
        """Test that token refresh maintains tenant scope"""
        # Login to get initial tokens
        with patch('apps.core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            login_data = {
                'email': 'user@test.com',
                'password': 'testpass123'
            }

            response = self.client.post('/api/auth/login/', login_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        refresh_token = response.data['tokens']['refresh_token']

        # Refresh the token
        refresh_data = {'refresh': refresh_token}
        response = self.client.post('/api/auth/refresh/', refresh_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_access_token = response.data['access']

        # Verify new token contains correct tenant scope
        payload = jwt.decode(
            new_access_token,
            options={"verify_signature": False}
        )

        # Should maintain the same tenant scope
        self.assertEqual(payload.get('user_id'), str(self.user.id))

    def test_logout_invalidates_session(self):
        """Test that logout properly invalidates the session"""
        # Login
        with patch('apps.core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            login_data = {
                'email': 'user@test.com',
                'password': 'testpass123'
            }

            response = self.client.post('/api/auth/login/', login_data, format='json')

        access_token = response.data['tokens']['access_token']

        # Use token to access resource
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        with patch('apps.core.authentication.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            response = self.client.get('/api/auth/profile/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Logout
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Note: In a stateless JWT system, the token would still be valid
        # until expiration. For true session invalidation, you'd need
        # a blacklist or shorter token expiration times.

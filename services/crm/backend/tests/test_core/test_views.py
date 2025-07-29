"""
Tests for core app views
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from tests.utils.helpers import (
    authenticate_api_client,
    create_test_tenant,
    create_test_user,
    get_jwt_token,
)

User = get_user_model()


class LoginViewTest(APITestCase):
    """Test LoginView"""

    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'

        # Create test tenant
        self.tenant = create_test_tenant('test_tenant', 'Test Company')

        # Create test user
        self.user = create_test_user(
            email='test@example.com',
            password='testpass123'
        )
        self.user.tenants.add(self.tenant)

    def test_valid_login(self):
        """Test successful login with valid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }

        with patch('apps.core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])

    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }

        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user_not_in_tenant(self):
        """Test login when user doesn't belong to current tenant"""
        # Create another user not in the tenant
        other_user = create_test_user(
            email='other@example.com',
            password='testpass123'
        )

        data = {
            'email': 'other@example.com',
            'password': 'testpass123'
        }

        with patch('apps.core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)

    def test_login_missing_fields(self):
        """Test login with missing required fields"""
        data = {'email': 'test@example.com'}

        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_invalid_email_format(self):
        """Test login with invalid email format"""
        data = {
            'email': 'invalid-email',
            'password': 'testpass123'
        }

        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileViewTest(APITestCase):
    """Test ProfileView"""

    def setUp(self):
        self.client = APIClient()
        self.profile_url = '/api/auth/profile/'

        self.user = create_test_user(
            email='test@example.com',
            first_name='Test',
            last_name='User',
            phone='123-456-7890'
        )

        authenticate_api_client(self.client, self.user)

    def test_get_profile(self):
        """Test getting user profile"""
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['first_name'], 'Test')
        self.assertEqual(response.data['last_name'], 'User')
        self.assertEqual(response.data['phone'], '123-456-7890')

    def test_update_profile(self):
        """Test updating user profile"""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone': '987-654-3210'
        }

        response = self.client.put(self.profile_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['last_name'], 'Name')
        self.assertEqual(response.data['phone'], '987-654-3210')

        # Verify in database
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')
        self.assertEqual(self.user.phone, '987-654-3210')

    def test_partial_profile_update(self):
        """Test partial profile update"""
        data = {'first_name': 'PartialUpdate'}

        response = self.client.put(self.profile_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'PartialUpdate')
        # Other fields should remain unchanged
        self.assertEqual(response.data['last_name'], 'User')

    def test_profile_unauthenticated(self):
        """Test accessing profile without authentication"""
        self.client.credentials()  # Remove authentication

        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_invalid_data(self):
        """Test updating profile with invalid data"""
        data = {
            'email': 'invalid-email-format'
        }

        response = self.client.put(self.profile_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PasswordChangeViewTest(APITestCase):
    """Test PasswordChangeView"""

    def setUp(self):
        self.client = APIClient()
        self.password_change_url = '/api/auth/password/change/'

        self.user = create_test_user(
            email='test@example.com',
            password='oldpassword123'
        )

        authenticate_api_client(self.client, self.user)

    def test_successful_password_change(self):
        """Test successful password change"""
        data = {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword123',
            'confirm_password': 'newpassword123'
        }

        response = self.client.post(self.password_change_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))
        self.assertFalse(self.user.check_password('oldpassword123'))

    def test_wrong_old_password(self):
        """Test password change with wrong old password"""
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123',
            'confirm_password': 'newpassword123'
        }

        response = self.client.post(self.password_change_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch(self):
        """Test password change with mismatched passwords"""
        data = {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword123',
            'confirm_password': 'differentpassword123'
        }

        response = self.client.post(self.password_change_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_change_unauthenticated(self):
        """Test password change without authentication"""
        self.client.credentials()  # Remove authentication

        data = {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword123',
            'confirm_password': 'newpassword123'
        }

        response = self.client.post(self.password_change_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_weak_new_password(self):
        """Test password change with weak new password"""
        data = {
            'old_password': 'oldpassword123',
            'new_password': '123',
            'confirm_password': '123'
        }

        response = self.client.post(self.password_change_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutViewTest(APITestCase):
    """Test LogoutView"""

    def setUp(self):
        self.client = APIClient()
        self.logout_url = '/api/auth/logout/'

        self.user = create_test_user(email='test@example.com')
        authenticate_api_client(self.client, self.user)

    def test_successful_logout(self):
        """Test successful logout"""
        response = self.client.post(self.logout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_logout_unauthenticated(self):
        """Test logout without authentication"""
        self.client.credentials()  # Remove authentication

        response = self.client.post(self.logout_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RefreshTokenViewTest(APITestCase):
    """Test RefreshTokenView"""

    def setUp(self):
        self.client = APIClient()
        self.refresh_url = '/api/auth/refresh/'

        self.user = create_test_user(email='test@example.com')
        self.access_token, self.refresh_token = get_jwt_token(self.user)

    def test_successful_token_refresh(self):
        """Test successful token refresh"""
        data = {'refresh': self.refresh_token}

        response = self.client.post(self.refresh_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_invalid_refresh_token(self):
        """Test token refresh with invalid token"""
        data = {'refresh': 'invalid_token'}

        response = self.client.post(self.refresh_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_refresh_token(self):
        """Test token refresh without refresh token"""
        data = {}

        response = self.client.post(self.refresh_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

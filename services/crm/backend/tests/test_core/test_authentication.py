"""
Tests for core authentication functionality
"""
from datetime import datetime, timedelta
from unittest.mock import Mock

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from rest_framework.exceptions import AuthenticationFailed

from apps.core.authentication import JWTAuthentication, JWTTokenGenerator
from tests.utils.helpers import create_test_tenant, create_test_user

User = get_user_model()


class JWTAuthenticationTest(TestCase):
    """Test JWTAuthentication class"""

    def setUp(self):
        self.factory = RequestFactory()
        self.auth = JWTAuthentication()

        # Create test tenant and user
        self.tenant = create_test_tenant()
        self.user = create_test_user()
        self.user.tenants.add(self.tenant)

        # Generate test token
        self.tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )
        self.access_token = self.tokens['access_token']

    def test_successful_authentication(self):
        """Test successful JWT authentication"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.access_token}'
        request.tenant = self.tenant

        result = self.auth.authenticate(request)

        self.assertIsNotNone(result)
        authenticated_user, token = result
        self.assertEqual(authenticated_user.id, self.user.id)
        self.assertEqual(token, self.access_token)

    def test_no_authorization_header(self):
        """Test authentication without authorization header"""
        request = self.factory.get('/')

        result = self.auth.authenticate(request)

        self.assertIsNone(result)

    def test_invalid_authorization_header_format(self):
        """Test authentication with invalid header format"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'InvalidFormat'

        result = self.auth.authenticate(request)

        self.assertIsNone(result)

    def test_malformed_bearer_token(self):
        """Test authentication with malformed bearer token"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer'

        result = self.auth.authenticate(request)

        self.assertIsNone(result)

    def test_invalid_jwt_token(self):
        """Test authentication with invalid JWT token"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer invalid_token'

        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_expired_token(self):
        """Test authentication with expired token"""
        # Create expired token
        expired_payload = {
            'user_id': str(self.user.id),
            'tenant_schema': self.tenant.schema_name,
            'exp': datetime.utcnow() - timedelta(minutes=1),
            'type': 'access'
        }

        expired_token = jwt.encode(
            expired_payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {expired_token}'
        request.tenant = self.tenant

        with self.assertRaises(AuthenticationFailed) as cm:
            self.auth.authenticate(request)

        self.assertIn('expired', str(cm.exception))

    def test_user_not_found(self):
        """Test authentication with non-existent user"""
        # Create token with non-existent user ID
        invalid_payload = {
            'user_id': '99999999-9999-9999-9999-999999999999',
            'tenant_schema': self.tenant.schema_name,
            'exp': datetime.utcnow() + timedelta(minutes=60),
            'type': 'access'
        }

        invalid_token = jwt.encode(
            invalid_payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {invalid_token}'
        request.tenant = self.tenant

        with self.assertRaises(AuthenticationFailed) as cm:
            self.auth.authenticate(request)

        self.assertIn('User not found', str(cm.exception))

    def test_inactive_user(self):
        """Test authentication with inactive user"""
        self.user.is_active = False
        self.user.save()

        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.access_token}'
        request.tenant = self.tenant

        with self.assertRaises(AuthenticationFailed) as cm:
            self.auth.authenticate(request)

        self.assertIn('disabled', str(cm.exception))

    def test_tenant_mismatch(self):
        """Test authentication with wrong tenant"""
        # Create different tenant
        other_tenant = create_test_tenant('other_tenant', 'Other Company')

        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.access_token}'
        request.tenant = other_tenant

        with self.assertRaises(AuthenticationFailed) as cm:
            self.auth.authenticate(request)

        self.assertIn('not valid for this tenant', str(cm.exception))

    def test_user_not_in_tenant(self):
        """Test authentication when user not assigned to tenant"""
        # Remove user from tenant
        self.user.tenants.clear()

        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.access_token}'
        request.tenant = self.tenant

        with self.assertRaises(AuthenticationFailed) as cm:
            self.auth.authenticate(request)

        self.assertIn('not authorized for this tenant', str(cm.exception))

    def test_public_schema_access(self):
        """Test authentication in public schema"""
        # Create public schema mock
        public_tenant = Mock()
        public_tenant.schema_name = 'public'

        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.access_token}'
        request.tenant = public_tenant

        result = self.auth.authenticate(request)

        self.assertIsNotNone(result)
        authenticated_user, _ = result
        self.assertEqual(authenticated_user.id, self.user.id)

    def test_authenticate_header(self):
        """Test authenticate_header method"""
        request = self.factory.get('/')

        header = self.auth.authenticate_header(request)

        self.assertEqual(header, 'Bearer')


class JWTTokenGeneratorTest(TestCase):
    """Test JWTTokenGenerator class"""

    def setUp(self):
        self.user = create_test_user()
        self.tenant = create_test_tenant()
        self.user.tenants.add(self.tenant)

    def test_generate_tokens(self):
        """Test token generation"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        self.assertIn('access_token', tokens)
        self.assertIn('refresh_token', tokens)
        self.assertIn('expires_in', tokens)
        self.assertIn('token_type', tokens)
        self.assertEqual(tokens['token_type'], 'Bearer')

    def test_access_token_payload(self):
        """Test access token contains correct payload"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        payload = jwt.decode(
            tokens['access_token'],
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        self.assertEqual(payload['user_id'], str(self.user.id))
        self.assertEqual(payload['email'], self.user.email)
        self.assertEqual(payload['tenant_schema'], self.tenant.schema_name)
        self.assertEqual(payload['type'], 'access')

    def test_refresh_token_payload(self):
        """Test refresh token contains correct payload"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        payload = jwt.decode(
            tokens['refresh_token'],
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        self.assertEqual(payload['user_id'], str(self.user.id))
        self.assertEqual(payload['tenant_schema'], self.tenant.schema_name)
        self.assertEqual(payload['type'], 'refresh')

    def test_refresh_access_token(self):
        """Test refreshing access token"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        new_tokens = JWTTokenGenerator.refresh_access_token(
            tokens['refresh_token']
        )

        self.assertIn('access_token', new_tokens)
        self.assertIn('expires_in', new_tokens)
        self.assertIn('token_type', new_tokens)

        # Verify new access token is different
        self.assertNotEqual(
            tokens['access_token'],
            new_tokens['access_token']
        )

    def test_refresh_with_invalid_token(self):
        """Test refresh with invalid token"""
        with self.assertRaises(AuthenticationFailed):
            JWTTokenGenerator.refresh_access_token('invalid_token')

    def test_refresh_with_access_token(self):
        """Test refresh using access token instead of refresh token"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        with self.assertRaises(AuthenticationFailed) as cm:
            JWTTokenGenerator.refresh_access_token(tokens['access_token'])

        self.assertIn('Invalid token type', str(cm.exception))

    def test_refresh_with_inactive_user(self):
        """Test refresh with inactive user"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        self.user.is_active = False
        self.user.save()

        with self.assertRaises(AuthenticationFailed) as cm:
            JWTTokenGenerator.refresh_access_token(tokens['refresh_token'])

        self.assertIn('disabled', str(cm.exception))

    def test_verify_token_valid(self):
        """Test token verification with valid token"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        payload = JWTTokenGenerator.verify_token(tokens['access_token'])

        self.assertEqual(payload['user_id'], str(self.user.id))
        self.assertEqual(payload['type'], 'access')

    def test_verify_token_invalid(self):
        """Test token verification with invalid token"""
        with self.assertRaises(AuthenticationFailed):
            JWTTokenGenerator.verify_token('invalid_token')

    def test_verify_refresh_token_as_access(self):
        """Test verifying refresh token as access token"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        with self.assertRaises(AuthenticationFailed) as cm:
            JWTTokenGenerator.verify_token(tokens['refresh_token'])

        self.assertIn('Invalid token type', str(cm.exception))

    def test_token_expiration_times(self):
        """Test token expiration times are set correctly"""
        tokens = JWTTokenGenerator.generate_tokens(
            self.user,
            self.tenant.schema_name
        )

        # Decode tokens to check expiration
        access_payload = jwt.decode(
            tokens['access_token'],
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        refresh_payload = jwt.decode(
            tokens['refresh_token'],
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        # Access token should expire in configured minutes
        access_exp = datetime.utcfromtimestamp(access_payload['exp'])
        access_iat = datetime.utcfromtimestamp(access_payload['iat'])
        access_duration = access_exp - access_iat

        expected_access_duration = timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
        self.assertAlmostEqual(
            access_duration.total_seconds(),
            expected_access_duration.total_seconds(),
            delta=60  # Allow 1 minute difference
        )

        # Refresh token should expire in 7 days
        refresh_exp = datetime.utcfromtimestamp(refresh_payload['exp'])
        refresh_iat = datetime.utcfromtimestamp(refresh_payload['iat'])
        refresh_duration = refresh_exp - refresh_iat

        expected_refresh_duration = timedelta(days=7)
        self.assertAlmostEqual(
            refresh_duration.total_seconds(),
            expected_refresh_duration.total_seconds(),
            delta=60  # Allow 1 minute difference
        )

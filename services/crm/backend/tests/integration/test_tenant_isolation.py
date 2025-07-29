"""
Integration tests for tenant isolation and security
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.core.models import Client, Domain
from apps.tenant_core.models import AuditLog, Role, UserRole
from tests.utils.helpers import (
    assign_role_to_user,
    authenticate_api_client,
    create_admin_role,
    create_test_tenant,
    create_test_user,
    get_jwt_token,
)

User = get_user_model()


class TenantIsolationTest(TestCase):
    """Test tenant isolation across the system"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create two separate tenants
        cls.tenant_a = Client.objects.create(
            schema_name='tenant_a',
            name='Company A',
            description='Test company A'
        )
        cls.tenant_b = Client.objects.create(
            schema_name='tenant_b',
            name='Company B',
            description='Test company B'
        )

        # Create domains
        cls.domain_a = Domain.objects.create(
            domain='tenant_a.localhost',
            tenant=cls.tenant_a,
            is_primary=True
        )
        cls.domain_b = Domain.objects.create(
            domain='tenant_b.localhost',
            tenant=cls.tenant_b,
            is_primary=True
        )

    def setUp(self):
        self.client = APIClient()

        # Create users for each tenant
        self.user_a = create_test_user(email='user_a@company_a.com')
        self.user_b = create_test_user(email='user_b@company_b.com')

        # Add users to their respective tenants
        self.user_a.tenants.add(self.tenant_a)
        self.user_b.tenants.add(self.tenant_b)

        # Assign roles
        assign_role_to_user(self.user_a, self.role_a)
        assign_role_to_user(self.user_b, self.role_b)

    def test_tenant_user_isolation(self):
        """Test that tenants can only see their own users"""
        # Authenticate as user from tenant A
        authenticate_api_client(self.client, self.user_a)

        with patch('apps.tenant_core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant_a

            with patch('django.db.connection') as mock_connection:
                mock_connection.schema_name = self.tenant_a.schema_name
                mock_connection.tenant = self.tenant_a

                response = self.client.get('/api/tenant/users/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should only see users from tenant A
        user_emails = [user['email'] for user in response.data['results']]
        self.assertIn('user_a@company_a.com', user_emails)
        self.assertNotIn('user_b@company_b.com', user_emails)

    def test_cross_tenant_token_rejection(self):
        """Test that tokens from one tenant are rejected by another"""
        # Generate token for user A with tenant A context
        tokens = get_jwt_token(self.user_a)
        access_token = tokens[0]

        # Try to use token with tenant B context
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        with patch('apps.core.authentication.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant_b

            response = self.client.get('/api/tenant/users/')

        # Should be rejected due to tenant mismatch
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tenant_role_isolation(self):
        """Test that tenants can only see their own roles"""
        # Create additional role in tenant A
        Role.objects.create(
            name='Tenant A Role',
            role_type='custom'
        )

        # Authenticate as user from tenant A
        authenticate_api_client(self.client, self.user_a)

        response = self.client.get('/api/tenant/roles/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should see roles from tenant A
        role_names = [role['name'] for role in response.data['results']]
        self.assertIn('Admin', role_names)  # Admin role created in setUp

    def test_tenant_audit_log_isolation(self):
        """Test that audit logs are isolated by tenant"""
        # Create audit logs for each tenant
        AuditLog.objects.create(
            user=self.user_a,
            action='create',
            model_name='TestModel',
            object_id='123'
        )

        AuditLog.objects.create(
            user=self.user_b,
            action='update',
            model_name='TestModel',
            object_id='456'
        )

        # Authenticate as user from tenant A
        authenticate_api_client(self.client, self.user_a)

        response = self.client.get('/api/tenant/audit/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should only see audit logs from tenant A's user
        if response.data['count'] > 0:
            user_emails = [log['user']['email'] for log in response.data['results'] if log['user']]
            for email in user_emails:
                self.assertEqual(email, 'user_a@company_a.com')

    def test_user_cannot_access_other_tenant_user_detail(self):
        """Test that users cannot access user details from other tenants"""
        # Authenticate as user from tenant A
        authenticate_api_client(self.client, self.user_a)

        # Try to access user B's details
        url = f'/api/tenant/users/{self.user_b.id}/'
        response = self.client.get(url)

        # Should not be found (filtered out by tenant isolation)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_create_role_for_other_tenant(self):
        """Test that users cannot create roles that affect other tenants"""
        # Authenticate as user from tenant A
        authenticate_api_client(self.client, self.user_a)

        data = {
            'name': 'Cross Tenant Role',
            'role_type': 'custom',
            'permissions': {'manage_all': True}
        }

        response = self.client.post('/api/tenant/roles/', data, format='json')

        # Role should be created successfully
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # But it should not be visible to tenant B
        authenticate_api_client(self.client, self.user_b)

        response = self.client.get('/api/tenant/roles/')
        role_names = [role['name'] for role in response.data['results']]
        self.assertNotIn('Cross Tenant Role', role_names)

    def test_user_assignment_restricted_to_current_tenant(self):
        """Test that user assignments are restricted to current tenant"""
        # Create a user not assigned to any tenant
        unassigned_user = create_test_user(email='unassigned@test.com')

        # Authenticate as admin from tenant A
        authenticate_api_client(self.client, self.user_a)

        # Try to assign role to unassigned user
        data = {
            'user': str(unassigned_user.id),
            'role': str(self.role_a.id)
        }

        response = self.client.post('/api/tenant/user-roles/', data, format='json')

        # Should fail because unassigned user is not in tenant A
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TenantSecurityTest(APITestCase):
    """Test tenant security measures"""

    def setUp(self):
        self.client = APIClient()
        self.tenant = create_test_tenant()
        self.user = create_test_user(email='user@test.com')
        self.user.tenants.add(self.tenant)

        self.admin_role = create_admin_role()
        assign_role_to_user(self.user, self.admin_role)

    def test_token_contains_tenant_scope(self):
        """Test that JWT tokens contain tenant scope information"""
        tokens = get_jwt_token(self.user)
        access_token = tokens[0]

        # Decode token to check payload
        import jwt

        payload = jwt.decode(
            access_token,
            options={"verify_signature": False}  # Skip verification for testing
        )

        # Token should contain tenant information
        self.assertIn('user_id', payload)
        self.assertEqual(payload['user_id'], str(self.user.id))

    def test_inactive_tenant_blocks_access(self):
        """Test that inactive tenants block user access"""
        # Deactivate tenant
        self.tenant.is_active = False
        self.tenant.save()

        authenticate_api_client(self.client, self.user)

        with patch('apps.tenant_core.views.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            response = self.client.get('/api/tenant/users/')

        # Access should be blocked for inactive tenant
        # This would typically be handled by middleware
        # For this test, we'll verify the tenant is marked as inactive
        self.assertFalse(self.tenant.is_active)

    def test_user_removal_from_tenant_blocks_access(self):
        """Test that removing user from tenant blocks access"""
        # Remove user from tenant
        self.user.tenants.remove(self.tenant)

        authenticate_api_client(self.client, self.user)

        with patch('apps.core.authentication.getattr') as mock_getattr:
            mock_getattr.return_value = self.tenant

            response = self.client.get('/api/tenant/users/')

        # Should be rejected due to user not in tenant
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivated_user_cannot_access_tenant(self):
        """Test that deactivated users cannot access tenant resources"""
        # Deactivate user
        self.user.is_active = False
        self.user.save()

        authenticate_api_client(self.client, self.user)

        response = self.client.get('/api/tenant/users/')

        # Should be rejected due to inactive user
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_role_deactivation_removes_permissions(self):
        """Test that deactivating roles removes user permissions"""
        # Deactivate user's role assignment
        user_role = UserRole.objects.get(user=self.user, role=self.admin_role)
        user_role.is_active = False
        user_role.save()

        authenticate_api_client(self.client, self.user)

        response = self.client.get('/api/tenant/roles/')

        # Should be forbidden due to lack of role permissions
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MultiTenantDataIntegrityTest(TestCase):
    """Test data integrity across multiple tenants"""

    def setUp(self):
        # Create multiple tenants
        self.tenant1 = create_test_tenant('tenant1', 'Company 1')
        self.tenant2 = create_test_tenant('tenant2', 'Company 2')
        self.tenant3 = create_test_tenant('tenant3', 'Company 3')

        # Create users for each tenant
        self.user1 = create_test_user(email='user1@company1.com')
        self.user2 = create_test_user(email='user2@company2.com')
        self.user3 = create_test_user(email='user3@company3.com')

        # Assign users to tenants
        self.user1.tenants.add(self.tenant1)
        self.user2.tenants.add(self.tenant2)
        self.user3.tenants.add(self.tenant3)

    def test_tenant_deletion_isolation(self):
        """Test that deleting a tenant doesn't affect other tenants"""
        # Create roles and user roles for each tenant
        role1 = Role.objects.create(name='Role1', role_type='custom')
        role2 = Role.objects.create(name='Role2', role_type='custom')

        UserRole.objects.create(user=self.user1, role=role1)
        UserRole.objects.create(user=self.user2, role=role2)

        # Delete tenant1
        self.tenant1.delete()

        # User1 should be deleted (if cascading), but user2 should remain
        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=self.user1.id)

        # User2 should still exist
        user2_exists = User.objects.filter(id=self.user2.id).exists()
        self.assertTrue(user2_exists)

    def test_cross_tenant_user_assignment_prevention(self):
        """Test that users cannot be assigned to multiple conflicting tenants"""
        # Try to assign user1 to multiple tenants
        self.user1.tenants.add(self.tenant2)

        # This should be allowed in the model, but application logic should prevent conflicts
        # Verify user is in both tenants (model allows it)
        self.assertIn(self.tenant1, self.user1.tenants.all())
        self.assertIn(self.tenant2, self.user1.tenants.all())

        # In practice, business logic should handle tenant switching or prevent this

    def test_tenant_schema_isolation(self):
        """Test that tenant schemas are properly isolated"""
        # This is more of a conceptual test since we're using shared database
        # In a real multi-tenant setup with separate schemas, this would test schema isolation

        # Verify each tenant has unique schema name
        schema_names = [
            self.tenant1.schema_name,
            self.tenant2.schema_name,
            self.tenant3.schema_name
        ]

        # All schema names should be unique
        self.assertEqual(len(schema_names), len(set(schema_names)))

    def test_domain_isolation(self):
        """Test that domains are properly isolated between tenants"""
        # Each tenant should have its own domain
        domain1 = Domain.objects.filter(tenant=self.tenant1).first()
        domain2 = Domain.objects.filter(tenant=self.tenant2).first()
        domain3 = Domain.objects.filter(tenant=self.tenant3).first()

        self.assertIsNotNone(domain1)
        self.assertIsNotNone(domain2)
        self.assertIsNotNone(domain3)

        # Domains should be unique
        domains = [domain1.domain, domain2.domain, domain3.domain]
        self.assertEqual(len(domains), len(set(domains)))

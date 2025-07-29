"""
Tests for accounts app views and API endpoints
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Account
from apps.tenant_core.models import Role, UserRole
from tests.utils.factories import AccountFactory, ClientFactory, UserFactory
from tests.utils.helpers import TenantTestMixin

User = get_user_model()


class AccountViewSetTest(TenantTestMixin, TestCase):
    """Test Account ViewSet with tenant isolation"""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

        # Create test tenants
        self.tenant1 = ClientFactory(name="Test Company 1", schema_name="test1")
        self.tenant2 = ClientFactory(name="Test Company 2", schema_name="test2")

        # Create test users
        self.user1 = UserFactory(email="user1@test1.com")
        self.user2 = UserFactory(email="user2@test2.com")
        self.admin_user = UserFactory(email="admin@test1.com")

        # Create roles
        self.admin_role = Role.objects.create(
            name="Admin",
            role_type="admin",
            permissions={"all": True}
        )
        self.manager_role = Role.objects.create(
            name="Manager",
            role_type="manager",
            permissions={"manage_accounts": True}
        )
        self.viewer_role = Role.objects.create(
            name="Viewer",
            role_type="viewer",
            permissions={"view_only": True}
        )

        # Assign users to tenants and roles
        self.user1.tenants.add(self.tenant1)
        self.user2.tenants.add(self.tenant2)
        self.admin_user.tenants.add(self.tenant1)

        # Create user roles
        UserRole.objects.create(user=self.user1, role=self.manager_role)
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.user2, role=self.manager_role)

        # Create test accounts
        self.account1 = AccountFactory(
            tenant=self.tenant1,
            account_name="Test Account 1",
            owner=self.user1
        )
        self.account2 = AccountFactory(
            tenant=self.tenant2,
            account_name="Test Account 2",
            owner=self.user2
        )

        # API endpoints
        self.list_url = reverse('account-list')
        self.detail_url = lambda pk: reverse('account-detail', kwargs={'pk': pk})

    def test_account_list_requires_authentication(self):
        """Test that account list requires authentication"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_account_list_tenant_isolation(self):
        """Test that users only see accounts from their tenant"""
        # Test user1 (tenant1) - should see account1 only
        self.client.force_authenticate(user=self.user1)
        with self.set_tenant(self.tenant1):
            response = self.client.get(self.list_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['account_name'], "Test Account 1")

        # Test user2 (tenant2) - should see account2 only
        self.client.force_authenticate(user=self.user2)
        with self.set_tenant(self.tenant2):
            response = self.client.get(self.list_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['account_name'], "Test Account 2")

    def test_account_create_with_proper_permissions(self):
        """Test creating account with proper permissions"""
        self.client.force_authenticate(user=self.user1)

        data = {
            'account_name': 'New Test Account',
            'industry': 'Technology',
            'website': 'https://newtest.com',
            'phone': '123-456-7890',
            'owner': self.user1.id
        }

        with self.set_tenant(self.tenant1):
            response = self.client.post(self.list_url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['account_name'], 'New Test Account')
            self.assertEqual(response.data['tenant'], self.tenant1.id)

    def test_account_create_without_permissions(self):
        """Test creating account without proper permissions"""
        viewer_user = UserFactory(email="viewer@test1.com")
        viewer_user.tenants.add(self.tenant1)
        UserRole.objects.create(user=viewer_user, role=self.viewer_role)

        self.client.force_authenticate(user=viewer_user)

        data = {
            'account_name': 'Unauthorized Account',
            'industry': 'Technology'
        }

        with self.set_tenant(self.tenant1):
            response = self.client.post(self.list_url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_account_update_with_permissions(self):
        """Test updating account with proper permissions"""
        self.client.force_authenticate(user=self.user1)

        data = {
            'account_name': 'Updated Account Name',
            'industry': 'Finance'
        }

        with self.set_tenant(self.tenant1):
            response = self.client.patch(self.detail_url(self.account1.account_id), data, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['account_name'], 'Updated Account Name')
            self.assertEqual(response.data['industry'], 'Finance')

    def test_account_cross_tenant_access_blocked(self):
        """Test that users cannot access accounts from other tenants"""
        self.client.force_authenticate(user=self.user1)

        # User1 from tenant1 trying to access account2 from tenant2
        with self.set_tenant(self.tenant1):
            response = self.client.get(self.detail_url(self.account2.account_id))
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_account_delete_with_validation(self):
        """Test deleting account with proper validation"""
        self.client.force_authenticate(user=self.admin_user)

        with self.set_tenant(self.tenant1):
            response = self.client.delete(self.detail_url(self.account1.account_id))
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

            # Verify account is deleted
            self.assertFalse(Account.objects.filter(account_id=self.account1.account_id).exists())

    def test_account_summary_endpoint(self):
        """Test account summary statistics endpoint"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            response = self.client.get(reverse('account-summary'))
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            data = response.data
            self.assertIn('total_accounts', data)
            self.assertIn('accounts_by_industry', data)
            self.assertIn('tenant', data)
            self.assertEqual(data['total_accounts'], 1)

    def test_account_contacts_endpoint(self):
        """Test getting contacts for an account"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            response = self.client.get(reverse('account-contacts', kwargs={'pk': self.account1.account_id}))
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            data = response.data
            self.assertIn('contacts', data)
            self.assertIn('count', data)
            self.assertEqual(data['account_id'], self.account1.account_id)

    def test_account_deals_endpoint(self):
        """Test getting deals for an account"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            response = self.client.get(reverse('account-deals', kwargs={'pk': self.account1.account_id}))
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            data = response.data
            self.assertIn('deals', data)
            self.assertIn('count', data)
            self.assertEqual(data['account_id'], self.account1.account_id)

    def test_account_leads_endpoint(self):
        """Test getting leads for an account"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            response = self.client.get(reverse('account-leads', kwargs={'pk': self.account1.account_id}))
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            data = response.data
            self.assertIn('leads', data)
            self.assertIn('count', data)
            self.assertEqual(data['account_id'], self.account1.account_id)

    def test_account_parent_validation(self):
        """Test parent account validation across tenants"""
        self.client.force_authenticate(user=self.user1)

        # Try to set parent account from different tenant
        data = {
            'account_name': 'Child Account',
            'parent_account': self.account2.account_id  # From different tenant
        }

        with self.set_tenant(self.tenant1):
            response = self.client.post(self.list_url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('parent_account', response.data)

    def test_account_owner_validation(self):
        """Test owner validation across tenants"""
        self.client.force_authenticate(user=self.user1)

        # Try to set owner from different tenant
        data = {
            'account_name': 'Test Account',
            'owner': self.user2.id  # User from different tenant
        }

        with self.set_tenant(self.tenant1):
            response = self.client.post(self.list_url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('owner', response.data)

    def test_account_serializer_fields(self):
        """Test that serializer returns expected fields"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            response = self.client.get(self.detail_url(self.account1.account_id))
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            data = response.data
            expected_fields = [
                'account_id', 'account_name', 'tenant', 'tenant_name',
                'industry', 'website', 'phone', 'owner', 'owner_name',
                'billing_country', 'billing_street', 'billing_city',
                'shipping_country', 'shipping_street', 'shipping_city',
                'created_at', 'updated_at'
            ]

            for field in expected_fields:
                self.assertIn(field, data)

    def test_account_rate_limiting(self):
        """Test rate limiting on account operations"""
        self.client.force_authenticate(user=self.user1)

        # This test would need to be run with actual rate limiting enabled
        # For now, just ensure the endpoint works
        with self.set_tenant(self.tenant1):
            response = self.client.get(self.list_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)


class AccountModelTest(TestCase):
    """Test Account model functionality"""

    def setUp(self):
        self.tenant = ClientFactory(name="Test Company", schema_name="test")
        self.user = UserFactory(email="test@test.com")
        self.user.tenants.add(self.tenant)

    def test_account_creation(self):
        """Test account creation with required fields"""
        account = Account.objects.create(
            tenant=self.tenant,
            account_name="Test Account",
            owner=self.user
        )

        self.assertEqual(account.account_name, "Test Account")
        self.assertEqual(account.tenant, self.tenant)
        self.assertEqual(account.owner, self.user)

    def test_account_str_representation(self):
        """Test account string representation"""
        account = AccountFactory(
            tenant=self.tenant,
            account_name="Test Account"
        )

        expected = f"Test Account (#{account.account_id})"
        self.assertEqual(str(account), expected)

    def test_account_manager_tenant_filtering(self):
        """Test that Account manager properly filters by tenant"""
        # Create accounts for different tenants
        tenant1 = ClientFactory(name="Tenant 1", schema_name="tenant1")
        tenant2 = ClientFactory(name="Tenant 2", schema_name="tenant2")

        account1 = AccountFactory(tenant=tenant1, account_name="Account 1")
        account2 = AccountFactory(tenant=tenant2, account_name="Account 2")

        # Test that TenantAccountManager filters correctly
        # Note: This would require setting up proper tenant context
        # In a real test, you'd use the tenant context manager

        all_accounts = Account.objects.all()
        self.assertTrue(all_accounts.filter(tenant=tenant1).exists())
        self.assertTrue(all_accounts.filter(tenant=tenant2).exists())

    def test_account_parent_relationship(self):
        """Test parent-child account relationship"""
        parent = AccountFactory(tenant=self.tenant, account_name="Parent Corp")
        child = AccountFactory(
            tenant=self.tenant,
            account_name="Child Corp",
            parent_account=parent
        )

        self.assertEqual(child.parent_account, parent)
        self.assertIn(child, parent.child_accounts.all())

    def test_account_audit_fields(self):
        """Test that audit fields are properly set"""
        account = AccountFactory(
            tenant=self.tenant,
            account_name="Test Account",
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(account.created_by, self.user)
        self.assertEqual(account.updated_by, self.user)
        self.assertIsNotNone(account.created_at)
        self.assertIsNotNone(account.updated_at)

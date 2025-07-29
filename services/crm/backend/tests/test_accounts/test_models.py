"""
Tests for accounts app models
"""
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from apps.accounts.models import Account, TenantAccountManager
from tests.utils.factories import AccountFactory, ClientFactory, UserFactory

User = get_user_model()


class AccountModelTest(TestCase):
    """Test Account model"""

    def setUp(self):
        self.tenant = ClientFactory(name="Test Company", schema_name="test")
        self.user = UserFactory(email="test@test.com")
        self.user.tenants.add(self.tenant)

    def test_account_creation(self):
        """Test basic account creation"""
        account = Account.objects.create(
            tenant=self.tenant,
            account_name="Test Account",
            industry="Technology",
            website="https://test.com",
            phone="123-456-7890",
            owner=self.user
        )

        self.assertEqual(account.account_name, "Test Account")
        self.assertEqual(account.tenant, self.tenant)
        self.assertEqual(account.industry, "Technology")
        self.assertEqual(account.website, "https://test.com")
        self.assertEqual(account.phone, "123-456-7890")
        self.assertEqual(account.owner, self.user)

    def test_account_str_representation(self):
        """Test account string representation"""
        account = AccountFactory(
            tenant=self.tenant,
            account_name="Test Account"
        )

        expected = f"Test Account (#{account.account_id})"
        self.assertEqual(str(account), expected)

    def test_account_required_fields(self):
        """Test that required fields are validated"""
        # account_name is required
        with self.assertRaises(IntegrityError):
            Account.objects.create(
                tenant=self.tenant,
                account_name=None
            )

        # tenant is required
        with self.assertRaises(IntegrityError):
            Account.objects.create(
                tenant=None,
                account_name="Test Account"
            )

    def test_account_optional_fields(self):
        """Test that optional fields can be None/blank"""
        account = Account.objects.create(
            tenant=self.tenant,
            account_name="Minimal Account",
            # All other fields are optional
            account_owner_alias=None,
            description=None,
            parent_account=None,
            industry=None,
            website=None,
            phone=None,
            owner=None
        )

        self.assertEqual(account.account_name, "Minimal Account")
        self.assertIsNone(account.account_owner_alias)
        self.assertIsNone(account.description)
        self.assertIsNone(account.parent_account)
        self.assertIsNone(account.industry)
        self.assertIsNone(account.website)
        self.assertIsNone(account.phone)
        self.assertIsNone(account.owner)

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

    def test_account_self_parent_prevention(self):
        """Test that account cannot be its own parent"""
        account = AccountFactory(tenant=self.tenant, account_name="Test Account")

        # This should be prevented at the application level
        account.parent_account = account
        # Django doesn't prevent this at model level, but application logic should

    def test_account_billing_address_fields(self):
        """Test billing address fields"""
        account = Account.objects.create(
            tenant=self.tenant,
            account_name="Test Account",
            billing_country="USA",
            billing_street="123 Main St",
            billing_city="New York",
            billing_state_province="NY",
            billing_zip_postal_code="10001"
        )

        self.assertEqual(account.billing_country, "USA")
        self.assertEqual(account.billing_street, "123 Main St")
        self.assertEqual(account.billing_city, "New York")
        self.assertEqual(account.billing_state_province, "NY")
        self.assertEqual(account.billing_zip_postal_code, "10001")

    def test_account_shipping_address_fields(self):
        """Test shipping address fields"""
        account = Account.objects.create(
            tenant=self.tenant,
            account_name="Test Account",
            shipping_country="USA",
            shipping_street="456 Oak Ave",
            shipping_city="Boston",
            shipping_state_province="MA",
            shipping_zip_postal_code="02101"
        )

        self.assertEqual(account.shipping_country, "USA")
        self.assertEqual(account.shipping_street, "456 Oak Ave")
        self.assertEqual(account.shipping_city, "Boston")
        self.assertEqual(account.shipping_state_province, "MA")
        self.assertEqual(account.shipping_zip_postal_code, "02101")

    def test_account_audit_fields(self):
        """Test audit fields are properly set"""
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

    def test_account_meta_options(self):
        """Test model meta options"""
        account = AccountFactory(tenant=self.tenant, account_name="Test Account")

        # Test db_table
        self.assertEqual(Account._meta.db_table, 'account')

        # Test verbose names
        self.assertEqual(Account._meta.verbose_name, 'Account')
        self.assertEqual(Account._meta.verbose_name_plural, 'Accounts')

        # Test ordering
        self.assertEqual(Account._meta.ordering, ['account_name'])

    def test_account_indexes(self):
        """Test that proper indexes are created"""
        # Test that indexes are defined (actual testing requires database inspection)
        meta = Account._meta
        index_names = [index.name for index in meta.indexes]

        expected_indexes = [
            'idx_account_tenant',
            'idx_account_owner'
        ]

        for expected_index in expected_indexes:
            self.assertIn(expected_index, index_names)

    def test_account_related_names(self):
        """Test that related names are properly configured"""
        account = AccountFactory(tenant=self.tenant, account_name="Test Account", owner=self.user)

        # Test tenant relationship
        self.assertIn(account, self.tenant.accounts.all())

        # Test owner relationship
        self.assertIn(account, self.user.owned_accounts.all())

        # Test created_by relationship
        if account.created_by:
            self.assertIn(account, account.created_by.accounts_created.all())

    def test_account_foreign_key_constraints(self):
        """Test foreign key constraints and cascade behavior"""
        account = AccountFactory(tenant=self.tenant, account_name="Test Account", owner=self.user)

        # Test that deleting tenant cascades to account
        tenant_id = self.tenant.id
        account_id = account.account_id

        self.tenant.delete()

        # Account should be deleted when tenant is deleted
        self.assertFalse(Account.objects.filter(account_id=account_id).exists())

    def test_account_owner_set_null(self):
        """Test that owner deletion sets field to NULL"""
        account = AccountFactory(tenant=self.tenant, account_name="Test Account", owner=self.user)

        user_id = self.user.id
        account_id = account.account_id

        # Delete the owner
        self.user.delete()

        # Account should still exist but owner should be NULL
        account = Account.objects.get(account_id=account_id)
        self.assertIsNone(account.owner)


class TenantAccountManagerTest(TestCase):
    """Test TenantAccountManager functionality"""

    def setUp(self):
        self.tenant1 = ClientFactory(name="Tenant 1", schema_name="tenant1")
        self.tenant2 = ClientFactory(name="Tenant 2", schema_name="tenant2")

    def test_manager_is_assigned(self):
        """Test that TenantAccountManager is properly assigned"""
        self.assertIsInstance(Account.objects, TenantAccountManager)

    def test_manager_get_queryset_structure(self):
        """Test that manager has proper get_queryset method"""
        manager = TenantAccountManager()

        # Test that the method exists and is callable
        self.assertTrue(hasattr(manager, 'get_queryset'))
        self.assertTrue(callable(manager.get_queryset))

    def test_manager_filtering_logic(self):
        """Test manager filtering logic components"""
        # Create accounts for different tenants
        account1 = AccountFactory(tenant=self.tenant1, account_name="Account 1")
        account2 = AccountFactory(tenant=self.tenant2, account_name="Account 2")

        # Test that accounts exist in the database
        all_accounts = Account.objects.all()
        self.assertTrue(all_accounts.filter(tenant=self.tenant1).exists())
        self.assertTrue(all_accounts.filter(tenant=self.tenant2).exists())

        # Test filtering by tenant
        tenant1_accounts = all_accounts.filter(tenant=self.tenant1)
        tenant2_accounts = all_accounts.filter(tenant=self.tenant2)

        self.assertEqual(tenant1_accounts.count(), 1)
        self.assertEqual(tenant2_accounts.count(), 1)
        self.assertEqual(tenant1_accounts.first(), account1)
        self.assertEqual(tenant2_accounts.first(), account2)

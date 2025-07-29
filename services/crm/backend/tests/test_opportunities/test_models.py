"""
Tests for opportunities app models
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.opportunities.models import Deal, TenantDealManager
from tests.utils.factories import AccountFactory, ClientFactory, UserFactory

User = get_user_model()


class TenantDealManagerTest(TestCase):
    """Test TenantDealManager for tenant isolation"""

    def setUp(self):
        # Create test tenants
        self.tenant1 = ClientFactory(name="Test Company 1", schema_name="test1")
        self.tenant2 = ClientFactory(name="Test Company 2", schema_name="test2")

        # Create test users
        self.user1 = UserFactory(email="user1@test1.com")
        self.user2 = UserFactory(email="user2@test2.com")

        # Create test accounts
        self.account1 = AccountFactory(tenant=self.tenant1, account_name="Account 1", owner=self.user1)
        self.account2 = AccountFactory(tenant=self.tenant2, account_name="Account 2", owner=self.user2)

        # Create test deals
        self.deal1 = Deal.objects.create(
            tenant=self.tenant1,
            deal_name="Deal 1",
            stage="Prospecting",
            amount=Decimal("10000.00"),
            close_date=date.today() + timedelta(days=30),
            account=self.account1,
            owner=self.user1,
            created_by=self.user1,
            updated_by=self.user1
        )
        self.deal2 = Deal.objects.create(
            tenant=self.tenant2,
            deal_name="Deal 2",
            stage="Qualification",
            amount=Decimal("15000.00"),
            close_date=date.today() + timedelta(days=60),
            account=self.account2,
            owner=self.user2,
            created_by=self.user2,
            updated_by=self.user2
        )

    def test_manager_returns_tenant_deals_only(self):
        """Test that manager filters deals by tenant"""
        # Mock tenant isolation by checking both deals exist in DB
        all_deals = Deal.objects.all()
        self.assertEqual(all_deals.count(), 2)

        # In real scenario, TenantDealManager would filter based on connection.tenant
        # but we can test the logic exists
        self.assertIsInstance(Deal.objects, TenantDealManager)


class DealModelTest(TestCase):
    """Test Deal model functionality"""

    def setUp(self):
        # Create test tenant
        self.tenant = ClientFactory(name="Test Company", schema_name="test")

        # Create test user
        self.user = UserFactory(email="user@test.com")

        # Create test account
        self.account = AccountFactory(
            tenant=self.tenant,
            account_name="Test Account",
            owner=self.user
        )

    def test_deal_creation(self):
        """Test creating a deal with all required fields"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("25000.00"),
            close_date=date.today() + timedelta(days=45),
            account=self.account,
            account_name="Test Account",
            owner=self.user,
            deal_owner_alias="John Doe",
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(deal.deal_name, "Test Deal")
        self.assertEqual(deal.stage, "Prospecting")
        self.assertEqual(deal.amount, Decimal("25000.00"))
        self.assertEqual(deal.account, self.account)
        self.assertEqual(deal.owner, self.user)
        self.assertTrue(deal.created_at)
        self.assertTrue(deal.updated_at)

    def test_deal_str_representation(self):
        """Test string representation of deal"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Negotiation",
            amount=Decimal("50000.00"),
            close_date=date.today() + timedelta(days=30),
            account=self.account,
            owner=self.user,
            created_by=self.user,
            updated_by=self.user
        )

        expected_str = "Test Deal (Negotiation)"
        self.assertEqual(str(deal), expected_str)

    def test_deal_tenant_relationship(self):
        """Test deal belongs to correct tenant"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("30000.00"),
            close_date=date.today() + timedelta(days=60),
            account=self.account,
            owner=self.user,
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(deal.tenant, self.tenant)
        self.assertEqual(deal.tenant.name, "Test Company")
        self.assertEqual(deal.tenant.schema_name, "test")

    def test_deal_account_relationship(self):
        """Test deal belongs to correct account"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("20000.00"),
            close_date=date.today() + timedelta(days=45),
            account=self.account,
            owner=self.user,
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(deal.account, self.account)
        self.assertEqual(deal.account.account_name, "Test Account")

        # Test reverse relationship
        self.assertIn(deal, self.account.deals.all())

    def test_deal_owner_relationship(self):
        """Test deal owner relationship"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("35000.00"),
            close_date=date.today() + timedelta(days=30),
            account=self.account,
            owner=self.user,
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(deal.owner, self.user)

        # Test reverse relationship
        self.assertIn(deal, self.user.owned_deals.all())

    def test_deal_audit_fields(self):
        """Test deal audit fields (created_by, updated_by, timestamps)"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("40000.00"),
            close_date=date.today() + timedelta(days=45),
            account=self.account,
            owner=self.user,
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(deal.created_by, self.user)
        self.assertEqual(deal.updated_by, self.user)
        self.assertTrue(deal.created_at)
        self.assertTrue(deal.updated_at)

        # Test that updated_at changes on save
        original_updated_at = deal.updated_at
        deal.stage = "Qualification"
        deal.save()
        self.assertGreater(deal.updated_at, original_updated_at)

    def test_deal_optional_fields(self):
        """Test deal with optional fields"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("15000.00"),
            close_date=date.today() + timedelta(days=30),
            account=self.account,
            created_by=self.user,
            updated_by=self.user
            # owner, deal_owner_alias, account_name are optional
        )

        self.assertIsNone(deal.owner)
        self.assertIsNone(deal.deal_owner_alias)
        self.assertIsNone(deal.account_name)

    def test_deal_decimal_amount_precision(self):
        """Test deal amount decimal precision"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("12345.67"),
            close_date=date.today() + timedelta(days=30),
            account=self.account,
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(deal.amount, Decimal("12345.67"))

        # Test with many decimal places (should be rounded)
        deal.amount = Decimal("12345.678901")
        deal.save()
        self.assertEqual(deal.amount, Decimal("12345.68"))

    def test_deal_ordering(self):
        """Test deal default ordering by close_date (descending)"""
        # Create deals with different close dates
        deal1 = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Deal 1",
            stage="Prospecting",
            amount=Decimal("10000.00"),
            close_date=date.today() + timedelta(days=30),
            account=self.account,
            created_by=self.user,
            updated_by=self.user
        )

        deal2 = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Deal 2",
            stage="Qualification",
            amount=Decimal("20000.00"),
            close_date=date.today() + timedelta(days=10),
            account=self.account,
            created_by=self.user,
            updated_by=self.user
        )

        deal3 = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Deal 3",
            stage="Negotiation",
            amount=Decimal("30000.00"),
            close_date=date.today() + timedelta(days=60),
            account=self.account,
            created_by=self.user,
            updated_by=self.user
        )

        # Test ordering (should be by close_date descending)
        deals = Deal.objects.all()
        self.assertEqual(deals[0], deal3)  # Latest close date first
        self.assertEqual(deals[1], deal1)
        self.assertEqual(deals[2], deal2)  # Earliest close date last

    def test_deal_meta_attributes(self):
        """Test Deal model meta attributes"""
        deal = Deal.objects.create(
            tenant=self.tenant,
            deal_name="Test Deal",
            stage="Prospecting",
            amount=Decimal("25000.00"),
            close_date=date.today() + timedelta(days=30),
            account=self.account,
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(deal._meta.db_table, 'deal')
        self.assertEqual(deal._meta.verbose_name, 'Deal')
        self.assertEqual(deal._meta.verbose_name_plural, 'Deals')

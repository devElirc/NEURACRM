"""
Tests for opportunities app views and API endpoints
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.opportunities.models import Deal
from apps.tenant_core.models import Role, UserRole
from tests.utils.factories import AccountFactory, ClientFactory, UserFactory
from tests.utils.helpers import TenantTestMixin

User = get_user_model()


class DealViewSetTest(TenantTestMixin, TestCase):
    """Test Deal ViewSet with tenant isolation"""

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
            permissions={"manage_opportunities": True}
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

        # Create test deals
        self.deal1 = Deal.objects.create(
            tenant=self.tenant1,
            deal_name="Test Deal 1",
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
            deal_name="Test Deal 2",
            stage="Qualification",
            amount=Decimal("20000.00"),
            close_date=date.today() + timedelta(days=45),
            account=self.account2,
            owner=self.user2,
            created_by=self.user2,
            updated_by=self.user2
        )

        # API endpoints
        self.list_url = reverse('deal-list')
        self.detail_url = lambda pk: reverse('deal-detail', kwargs={'pk': pk})

    def test_deal_list_requires_authentication(self):
        """Test that deal list requires authentication"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deal_list_tenant_isolation(self):
        """Test that users only see deals from their tenant"""
        # Test user1 (tenant1) - should see deal1 only
        self.client.force_authenticate(user=self.user1)
        with self.set_tenant(self.tenant1):
            response = self.client.get(self.list_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['deal_name'], "Test Deal 1")

        # Test user2 (tenant2) - should see deal2 only
        self.client.force_authenticate(user=self.user2)
        with self.set_tenant(self.tenant2):
            response = self.client.get(self.list_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['deal_name'], "Test Deal 2")

    def test_deal_create_with_proper_permissions(self):
        """Test creating a deal with proper permissions"""
        self.client.force_authenticate(user=self.user1)

        deal_data = {
            'deal_name': 'New Deal',
            'stage': 'Prospecting',
            'amount': '15000.00',
            'close_date': (date.today() + timedelta(days=60)).isoformat(),
            'account': self.account1.account_id,
            'account_name': 'Test Account 1',
            'owner': self.user1.id,
            'deal_owner_alias': 'John Doe'
        }

        with self.set_tenant(self.tenant1):
            response = self.client.post(self.list_url, deal_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['deal_name'], 'New Deal')
            self.assertEqual(response.data['stage'], 'Prospecting')
            self.assertEqual(response.data['amount'], '15000.00')

    def test_deal_create_without_permissions(self):
        """Test creating a deal without proper permissions"""
        viewer_user = UserFactory(email="viewer@test1.com")
        viewer_user.tenants.add(self.tenant1)
        UserRole.objects.create(user=viewer_user, role=self.viewer_role)

        self.client.force_authenticate(user=viewer_user)

        deal_data = {
            'deal_name': 'New Deal',
            'stage': 'Prospecting',
            'amount': '15000.00',
            'close_date': (date.today() + timedelta(days=60)).isoformat(),
            'account': self.account1.account_id,
        }

        with self.set_tenant(self.tenant1):
            response = self.client.post(self.list_url, deal_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deal_update_with_proper_permissions(self):
        """Test updating a deal with proper permissions"""
        self.client.force_authenticate(user=self.user1)

        update_data = {
            'deal_name': 'Updated Deal Name',
            'stage': 'Qualification',
            'amount': '12000.00',
            'close_date': (date.today() + timedelta(days=45)).isoformat(),
            'account': self.account1.account_id,
        }

        with self.set_tenant(self.tenant1):
            response = self.client.put(self.detail_url(self.deal1.deal_id), update_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['deal_name'], 'Updated Deal Name')
            self.assertEqual(response.data['stage'], 'Qualification')

    def test_deal_cross_tenant_access_denied(self):
        """Test that users cannot access deals from other tenants"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            # Try to access deal from tenant2
            response = self.client.get(self.detail_url(self.deal2.deal_id))
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deal_summary_endpoint(self):
        """Test deal summary statistics endpoint"""
        self.client.force_authenticate(user=self.user1)

        # Create additional deals for better testing
        Deal.objects.create(
            tenant=self.tenant1,
            deal_name="Deal 2",
            stage="Negotiation",
            amount=Decimal("25000.00"),
            close_date=date.today() + timedelta(days=15),
            account=self.account1,
            owner=self.user1,
            created_by=self.user1,
            updated_by=self.user1
        )

        with self.set_tenant(self.tenant1):
            response = self.client.get(self.list_url + 'summary/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Check summary data structure
            self.assertIn('total_deals', response.data)
            self.assertIn('total_value', response.data)
            self.assertIn('avg_deal_value', response.data)
            self.assertIn('deals_by_stage', response.data)
            self.assertIn('deals_closing_this_month', response.data)
            self.assertIn('deals_closing_next_month', response.data)

            # Check values
            self.assertEqual(response.data['total_deals'], 2)
            self.assertEqual(float(response.data['total_value']), 35000.00)

    def test_deal_by_stage_endpoint(self):
        """Test deals grouped by stage endpoint"""
        self.client.force_authenticate(user=self.user1)

        # Create deals with different stages
        Deal.objects.create(
            tenant=self.tenant1,
            deal_name="Deal 2",
            stage="Prospecting",
            amount=Decimal("15000.00"),
            close_date=date.today() + timedelta(days=30),
            account=self.account1,
            owner=self.user1,
            created_by=self.user1,
            updated_by=self.user1
        )

        Deal.objects.create(
            tenant=self.tenant1,
            deal_name="Deal 3",
            stage="Negotiation",
            amount=Decimal("20000.00"),
            close_date=date.today() + timedelta(days=45),
            account=self.account1,
            owner=self.user1,
            created_by=self.user1,
            updated_by=self.user1
        )

        with self.set_tenant(self.tenant1):
            response = self.client.get(self.list_url + 'by_stage/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Check response structure
            self.assertIn('deals_by_stage', response.data)
            self.assertIn('total_stages', response.data)
            self.assertIn('total_deals', response.data)

            # Check stage grouping
            stages = response.data['deals_by_stage']
            self.assertIn('Prospecting', stages)
            self.assertIn('Negotiation', stages)
            self.assertEqual(len(stages['Prospecting']), 2)  # Two deals in prospecting
            self.assertEqual(len(stages['Negotiation']), 1)  # One deal in negotiation

    def test_deal_by_account_endpoint(self):
        """Test deals filtered by account endpoint"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            response = self.client.get(self.list_url + f'by_account/?account_id={self.account1.account_id}')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Check response structure
            self.assertIn('deals', response.data)
            self.assertIn('count', response.data)
            self.assertIn('account_filter', response.data)

            # Check deals belong to the account
            deals = response.data['deals']
            self.assertEqual(len(deals), 1)
            self.assertEqual(deals[0]['deal_name'], 'Test Deal 1')

    def test_deal_account_info_endpoint(self):
        """Test deal account info endpoint"""
        self.client.force_authenticate(user=self.user1)

        with self.set_tenant(self.tenant1):
            response = self.client.get(self.detail_url(self.deal1.deal_id) + 'account_info/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Check response structure
            self.assertIn('deal_id', response.data)
            self.assertIn('deal_name', response.data)
            self.assertIn('account', response.data)

            # Check account info
            account_info = response.data['account']
            self.assertEqual(account_info['account_name'], 'Test Account 1')
            self.assertEqual(account_info['account_id'], self.account1.account_id)

    def test_deal_closing_soon_endpoint(self):
        """Test deals closing soon endpoint"""
        self.client.force_authenticate(user=self.user1)

        # Create a deal closing soon
        Deal.objects.create(
            tenant=self.tenant1,
            deal_name="Closing Soon",
            stage="Negotiation",
            amount=Decimal("30000.00"),
            close_date=date.today() + timedelta(days=7),
            account=self.account1,
            owner=self.user1,
            created_by=self.user1,
            updated_by=self.user1
        )

        with self.set_tenant(self.tenant1):
            response = self.client.get(self.list_url + 'closing_soon/?days=30')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Check response structure
            self.assertIn('deals', response.data)
            self.assertIn('count', response.data)
            self.assertIn('days_filter', response.data)

            # Check deals are included
            deals = response.data['deals']
            self.assertEqual(len(deals), 2)  # Both deals close within 30 days

    def test_deal_delete_validation(self):
        """Test deal deletion with validation"""
        self.client.force_authenticate(user=self.user1)

        # Test deleting open deal (should work)
        with self.set_tenant(self.tenant1):
            response = self.client.delete(self.detail_url(self.deal1.deal_id))
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Create a closed deal
        closed_deal = Deal.objects.create(
            tenant=self.tenant1,
            deal_name="Closed Deal",
            stage="Closed Won",
            amount=Decimal("50000.00"),
            close_date=date.today() - timedelta(days=5),
            account=self.account1,
            owner=self.user1,
            created_by=self.user1,
            updated_by=self.user1
        )

        # Test deleting closed deal (should fail)
        with self.set_tenant(self.tenant1):
            response = self.client.delete(self.detail_url(closed_deal.deal_id))
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('Cannot delete a closed deal', response.data['error'])

    def test_deal_serializer_validation(self):
        """Test deal serializer validation"""
        self.client.force_authenticate(user=self.user1)

        # Test with invalid account (from different tenant)
        deal_data = {
            'deal_name': 'Invalid Deal',
            'stage': 'Prospecting',
            'amount': '15000.00',
            'close_date': (date.today() + timedelta(days=60)).isoformat(),
            'account': self.account2.account_id,  # Account from different tenant
        }

        with self.set_tenant(self.tenant1):
            response = self.client.post(self.list_url, deal_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deal_rate_limiting(self):
        """Test rate limiting on deal operations"""
        self.client.force_authenticate(user=self.user1)

        deal_data = {
            'deal_name': 'Rate Limited Deal',
            'stage': 'Prospecting',
            'amount': '5000.00',
            'close_date': (date.today() + timedelta(days=30)).isoformat(),
            'account': self.account1.account_id,
        }

        with self.set_tenant(self.tenant1):
            # Make multiple requests rapidly
            for i in range(15):  # Exceed rate limit of 10 requests per minute
                response = self.client.post(self.list_url, deal_data, format='json')
                if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                    break

            # Should eventually hit rate limit
            self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

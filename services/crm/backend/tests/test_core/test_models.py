"""
Tests for core app models
"""
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from apps.core.models import Client, Domain

User = get_user_model()


class ClientModelTest(TestCase):
    """Test Client (Tenant) model"""

    def test_client_creation(self):
        """Test creating a client"""
        client = Client.objects.create(
            schema_name='test_company',
            name='Test Company',
            description='A test company'
        )

        self.assertEqual(client.schema_name, 'test_company')
        self.assertEqual(client.name, 'Test Company')
        self.assertEqual(client.description, 'A test company')
        self.assertTrue(client.is_active)
        self.assertIsNotNone(client.created_on)

    def test_client_str_representation(self):
        """Test string representation of client"""
        client = Client.objects.create(
            schema_name='test_company',
            name='Test Company'
        )
        self.assertEqual(str(client), 'Test Company')

    def test_client_schema_name_uniqueness(self):
        """Test that schema_name must be unique"""
        Client.objects.create(
            schema_name='test_company',
            name='Test Company 1'
        )

        with self.assertRaises(IntegrityError):
            Client.objects.create(
                schema_name='test_company',
                name='Test Company 2'
            )

    def test_client_auto_create_schema(self):
        """Test auto_create_schema property"""
        client = Client.objects.create(
            schema_name='test_company',
            name='Test Company'
        )
        self.assertTrue(client.auto_create_schema)

    def test_client_default_values(self):
        """Test default values for client fields"""
        client = Client.objects.create(
            schema_name='test_company',
            name='Test Company'
        )

        self.assertTrue(client.is_active)
        self.assertEqual(client.description, '')


class DomainModelTest(TestCase):
    """Test Domain model"""

    def test_domain_creation(self):
        """Test creating a domain"""
        client = Client.objects.create(
            schema_name='test_company',
            name='Test Company'
        )

        domain = Domain.objects.create(
            domain='test.localhost',
            tenant=client,
            is_primary=True
        )

        self.assertEqual(domain.domain, 'test.localhost')
        self.assertEqual(domain.tenant, client)
        self.assertTrue(domain.is_primary)

    def test_domain_tenant_relationship(self):
        """Test domain-tenant relationship"""
        client = Client.objects.create(
            schema_name='test_company',
            name='Test Company'
        )

        domain = Domain.objects.create(
            domain='test.localhost',
            tenant=client,
            is_primary=True
        )

        # Test forward relationship
        self.assertEqual(domain.tenant, client)

        # Test reverse relationship
        self.assertIn(domain, client.domains.all())

    def test_multiple_domains_per_tenant(self):
        """Test that a tenant can have multiple domains"""
        client = Client.objects.create(
            schema_name='test_company',
            name='Test Company'
        )

        domain1 = Domain.objects.create(
            domain='test1.localhost',
            tenant=client,
            is_primary=True
        )

        domain2 = Domain.objects.create(
            domain='test2.localhost',
            tenant=client,
            is_primary=False
        )

        self.assertEqual(client.domains.count(), 2)
        self.assertIn(domain1, client.domains.all())
        self.assertIn(domain2, client.domains.all())


class UserModelTest(TestCase):
    """Test custom User model"""

    def test_user_creation(self):
        """Test creating a user"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User',
            phone='123-456-7890'
        )

        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertEqual(user.phone, '123-456-7890')
        self.assertFalse(user.is_superadmin)
        self.assertTrue(user.check_password('testpass123'))

    def test_user_email_uniqueness(self):
        """Test that email must be unique"""
        User.objects.create_user(
            email='test@example.com',
            username='testuser1',
            password='testpass123'
        )

        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='test@example.com',
                username='testuser2',
                password='testpass123'
            )

    def test_user_str_representation(self):
        """Test string representation of user"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        self.assertEqual(str(user), 'Test User (test@example.com)')

    def test_user_full_name_property(self):
        """Test full_name property"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        self.assertEqual(user.full_name, 'Test User')

    def test_user_username_field(self):
        """Test that email is used as username field"""
        self.assertEqual(User.USERNAME_FIELD, 'email')

    def test_user_required_fields(self):
        """Test required fields for user creation"""
        expected_fields = ['username', 'first_name', 'last_name']
        self.assertEqual(User.REQUIRED_FIELDS, expected_fields)

    def test_superadmin_user(self):
        """Test creating superadmin user"""
        user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            is_superadmin=True,
            is_staff=True,
            is_superuser=True
        )

        self.assertTrue(user.is_superadmin)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_user_tenant_relationship(self):
        """Test user-tenant many-to-many relationship"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        tenant1 = Client.objects.create(
            schema_name='tenant1',
            name='Tenant 1'
        )

        tenant2 = Client.objects.create(
            schema_name='tenant2',
            name='Tenant 2'
        )

        # Add user to tenants
        user.tenants.add(tenant1, tenant2)

        # Test forward relationship
        self.assertIn(tenant1, user.tenants.all())
        self.assertIn(tenant2, user.tenants.all())
        self.assertEqual(user.tenants.count(), 2)

        # Test reverse relationship
        self.assertIn(user, tenant1.users.all())
        self.assertIn(user, tenant2.users.all())

    def test_user_default_values(self):
        """Test default values for user fields"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        self.assertFalse(user.is_superadmin)
        self.assertEqual(user.phone, '')
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

    def test_user_uuid_id(self):
        """Test that user ID is UUID"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        self.assertIsNotNone(user.id)
        # UUID should be string representation of UUID
        str(user.id)  # Should not raise exception

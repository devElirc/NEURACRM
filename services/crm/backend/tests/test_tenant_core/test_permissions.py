"""
Tests for tenant_core permissions
"""
from unittest.mock import Mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.tenant_core.models import Role, UserRole
from apps.tenant_core.permissions import CanManageRoles, CanManageUsers
from tests.utils.helpers import create_test_user
from tests.utils.mixins import RoleTestMixin, TenantTestMixin

User = get_user_model()


class CanManageUsersTest(TenantTestMixin, RoleTestMixin, TestCase):
    """Test CanManageUsers permission"""

    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.permission = CanManageUsers()

        # Create users
        self.admin_user = create_test_user(email='admin@test.com')
        self.manager_user = create_test_user(email='manager@test.com')
        self.sales_user = create_test_user(email='sales@test.com')
        self.regular_user = create_test_user(email='user@test.com')
        self.superadmin = create_test_user(
            email='superadmin@test.com',
            is_superadmin=True
        )

        # Add users to tenant
        for user in [self.admin_user, self.manager_user, self.sales_user, self.regular_user]:
            user.tenants.add(self.tenant)

        # Assign roles
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.manager_user, role=self.manager_role)
        UserRole.objects.create(user=self.sales_user, role=self.sales_role)

    def test_admin_can_manage_users(self):
        """Test admin user can manage users"""
        request = self.factory.get('/')
        request.user = self.admin_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_manager_can_manage_users(self):
        """Test manager user can manage users"""
        request = self.factory.get('/')
        request.user = self.manager_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_superadmin_can_manage_users(self):
        """Test superadmin can manage users"""
        request = self.factory.get('/')
        request.user = self.superadmin

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_sales_user_cannot_manage_users(self):
        """Test sales user cannot manage users"""
        request = self.factory.get('/')
        request.user = self.sales_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_regular_user_cannot_manage_users(self):
        """Test regular user cannot manage users"""
        request = self.factory.get('/')
        request.user = self.regular_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_unauthenticated_user_cannot_manage(self):
        """Test unauthenticated user cannot manage users"""
        request = self.factory.get('/')
        request.user = Mock()
        request.user.is_authenticated = False

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_user_with_inactive_role_cannot_manage(self):
        """Test user with inactive role cannot manage users"""
        # Deactivate the admin role assignment
        user_role = UserRole.objects.get(user=self.admin_user, role=self.admin_role)
        user_role.is_active = False
        user_role.save()

        request = self.factory.get('/')
        request.user = self.admin_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_user_with_multiple_roles_can_manage(self):
        """Test user with multiple qualifying roles can manage users"""
        # Assign both admin and manager roles to user
        UserRole.objects.create(user=self.regular_user, role=self.admin_role)
        UserRole.objects.create(user=self.regular_user, role=self.manager_role)

        request = self.factory.get('/')
        request.user = self.regular_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )


class CanManageRolesTest(TenantTestMixin, RoleTestMixin, TestCase):
    """Test CanManageRoles permission"""

    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.permission = CanManageRoles()

        # Create users
        self.admin_user = create_test_user(email='admin@test.com')
        self.manager_user = create_test_user(email='manager@test.com')
        self.sales_user = create_test_user(email='sales@test.com')
        self.regular_user = create_test_user(email='user@test.com')
        self.superadmin = create_test_user(
            email='superadmin@test.com',
            is_superadmin=True
        )

        # Add users to tenant
        for user in [self.admin_user, self.manager_user, self.sales_user, self.regular_user]:
            user.tenants.add(self.tenant)

        # Assign roles
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.manager_user, role=self.manager_role)
        UserRole.objects.create(user=self.sales_user, role=self.sales_role)

    def test_admin_can_manage_roles(self):
        """Test admin user can manage roles"""
        request = self.factory.get('/')
        request.user = self.admin_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_superadmin_can_manage_roles(self):
        """Test superadmin can manage roles"""
        request = self.factory.get('/')
        request.user = self.superadmin

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_manager_cannot_manage_roles(self):
        """Test manager user cannot manage roles"""
        request = self.factory.get('/')
        request.user = self.manager_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_sales_user_cannot_manage_roles(self):
        """Test sales user cannot manage roles"""
        request = self.factory.get('/')
        request.user = self.sales_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_regular_user_cannot_manage_roles(self):
        """Test regular user cannot manage roles"""
        request = self.factory.get('/')
        request.user = self.regular_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_unauthenticated_user_cannot_manage_roles(self):
        """Test unauthenticated user cannot manage roles"""
        request = self.factory.get('/')
        request.user = Mock()
        request.user.is_authenticated = False

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_user_with_inactive_admin_role_cannot_manage(self):
        """Test user with inactive admin role cannot manage roles"""
        # Deactivate the admin role assignment
        user_role = UserRole.objects.get(user=self.admin_user, role=self.admin_role)
        user_role.is_active = False
        user_role.save()

        request = self.factory.get('/')
        request.user = self.admin_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_user_with_admin_and_manager_roles_can_manage(self):
        """Test user with both admin and manager roles can manage roles"""
        # Assign both admin and manager roles to user
        UserRole.objects.create(user=self.regular_user, role=self.admin_role)
        UserRole.objects.create(user=self.regular_user, role=self.manager_role)

        request = self.factory.get('/')
        request.user = self.regular_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_custom_admin_role_can_manage_roles(self):
        """Test user with custom admin role type can manage roles"""
        # Create custom admin role
        custom_admin_role = Role.objects.create(
            name='Custom Admin',
            role_type='admin',
            permissions={'all': True}
        )

        # Assign to user
        UserRole.objects.create(user=self.regular_user, role=custom_admin_role)

        request = self.factory.get('/')
        request.user = self.regular_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

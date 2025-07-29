"""
Tests for core permissions
"""
from unittest.mock import Mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.core.permissions import (
    CanManageRoles,
    CanManageUsers,
    HasModulePermission,
    IsAdminOrReadOnly,
    IsSuperAdmin,
)
from apps.tenant_core.models import Role, UserRole
from tests.utils.helpers import create_test_user
from tests.utils.mixins import RoleTestMixin, TenantTestMixin

User = get_user_model()


class IsSuperAdminTest(TestCase):
    """Test IsSuperAdmin permission"""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsSuperAdmin()

        self.superadmin = create_test_user(
            email='superadmin@test.com',
            is_superadmin=True
        )

        self.regular_user = create_test_user(
            email='user@test.com'
        )

    def test_superadmin_has_permission(self):
        """Test superadmin has permission"""
        request = self.factory.get('/')
        request.user = self.superadmin

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_regular_user_no_permission(self):
        """Test regular user doesn't have permission"""
        request = self.factory.get('/')
        request.user = self.regular_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_unauthenticated_user_no_permission(self):
        """Test unauthenticated user doesn't have permission"""
        request = self.factory.get('/')
        request.user = Mock()
        request.user.is_authenticated = False

        self.assertFalse(
            self.permission.has_permission(request, None)
        )


class IsAdminOrReadOnlyTest(TenantTestMixin, RoleTestMixin, TestCase):
    """Test IsAdminOrReadOnly permission"""

    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.permission = IsAdminOrReadOnly()

        # Create users
        self.admin_user = create_test_user(email='admin@test.com')
        self.regular_user = create_test_user(email='user@test.com')
        self.superadmin = create_test_user(
            email='superadmin@test.com',
            is_superadmin=True
        )

        # Assign admin role to admin user
        UserRole.objects.create(
            user=self.admin_user,
            role=self.admin_role
        )

    def test_authenticated_user_read_permission(self):
        """Test authenticated user has read permission"""
        request = self.factory.get('/')
        request.user = self.regular_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_admin_user_write_permission(self):
        """Test admin user has write permission"""
        request = self.factory.post('/')
        request.user = self.admin_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_superadmin_write_permission(self):
        """Test superadmin has write permission"""
        request = self.factory.post('/')
        request.user = self.superadmin

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_regular_user_no_write_permission(self):
        """Test regular user doesn't have write permission"""
        request = self.factory.post('/')
        request.user = self.regular_user

        self.assertFalse(
            self.permission.has_permission(request, None)
        )

    def test_unauthenticated_user_no_permission(self):
        """Test unauthenticated user has no permission"""
        request = self.factory.get('/')
        request.user = Mock()
        request.user.is_authenticated = False

        self.assertFalse(
            self.permission.has_permission(request, None)
        )


class HasModulePermissionTest(TenantTestMixin, RoleTestMixin, TestCase):
    """Test HasModulePermission permission"""

    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.permission = HasModulePermission()

        # Create user
        self.user = create_test_user(email='user@test.com')
        self.superadmin = create_test_user(
            email='superadmin@test.com',
            is_superadmin=True
        )

        # Create role with specific permissions
        self.custom_role = Role.objects.create(
            name='Custom Role',
            role_type='custom',
            permissions={
                'leads': {
                    'read': True,
                    'create': True,
                    'update': False,
                    'delete': False
                },
                'contacts': {
                    'read': True,
                    'create': False,
                    'update': False,
                    'delete': False
                }
            }
        )

        # Assign role to user
        UserRole.objects.create(
            user=self.user,
            role=self.custom_role
        )

    def test_superadmin_has_all_permissions(self):
        """Test superadmin has all module permissions"""
        request = self.factory.get('/')
        request.user = self.superadmin

        view = Mock()
        view.module_name = 'leads'

        self.assertTrue(
            self.permission.has_permission(request, view)
        )

    def test_user_has_read_permission(self):
        """Test user has read permission for allowed module"""
        request = self.factory.get('/')
        request.user = self.user

        view = Mock()
        view.module_name = 'leads'

        self.assertTrue(
            self.permission.has_permission(request, view)
        )

    def test_user_has_create_permission(self):
        """Test user has create permission for allowed module"""
        request = self.factory.post('/')
        request.user = self.user

        view = Mock()
        view.module_name = 'leads'

        self.assertTrue(
            self.permission.has_permission(request, view)
        )

    def test_user_no_update_permission(self):
        """Test user doesn't have update permission"""
        request = self.factory.put('/')
        request.user = self.user

        view = Mock()
        view.module_name = 'leads'

        self.assertFalse(
            self.permission.has_permission(request, view)
        )

    def test_user_no_delete_permission(self):
        """Test user doesn't have delete permission"""
        request = self.factory.delete('/')
        request.user = self.user

        view = Mock()
        view.module_name = 'leads'

        self.assertFalse(
            self.permission.has_permission(request, view)
        )

    def test_user_no_create_permission_contacts(self):
        """Test user doesn't have create permission for contacts"""
        request = self.factory.post('/')
        request.user = self.user

        view = Mock()
        view.module_name = 'contacts'

        self.assertFalse(
            self.permission.has_permission(request, view)
        )

    def test_view_without_module_name(self):
        """Test view without module_name"""
        request = self.factory.get('/')
        request.user = self.user

        view = Mock()
        # No module_name attribute

        self.assertFalse(
            self.permission.has_permission(request, view)
        )

    def test_unauthenticated_user(self):
        """Test unauthenticated user has no permission"""
        request = self.factory.get('/')
        request.user = Mock()
        request.user.is_authenticated = False

        view = Mock()
        view.module_name = 'leads'

        self.assertFalse(
            self.permission.has_permission(request, view)
        )


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
        self.superadmin = create_test_user(
            email='superadmin@test.com',
            is_superadmin=True
        )

        # Assign roles
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.manager_user, role=self.manager_role)
        UserRole.objects.create(user=self.sales_user, role=self.sales_role)

    def test_admin_can_manage_users(self):
        """Test admin can manage users"""
        request = self.factory.get('/')
        request.user = self.admin_user

        self.assertTrue(
            self.permission.has_permission(request, None)
        )

    def test_manager_can_manage_users(self):
        """Test manager can manage users"""
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

    def test_unauthenticated_user_cannot_manage(self):
        """Test unauthenticated user cannot manage users"""
        request = self.factory.get('/')
        request.user = Mock()
        request.user.is_authenticated = False

        self.assertFalse(
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
        self.superadmin = create_test_user(
            email='superadmin@test.com',
            is_superadmin=True
        )

        # Assign roles
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.manager_user, role=self.manager_role)

    def test_admin_can_manage_roles(self):
        """Test admin can manage roles"""
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
        """Test manager cannot manage roles"""
        request = self.factory.get('/')
        request.user = self.manager_user

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

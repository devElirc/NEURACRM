"""
Tests for tenant_core app models
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TransactionTestCase

from apps.tenant_core.models import AuditLog, Role, TenantUser, UserRole
from tests.utils.helpers import create_test_user
from tests.utils.mixins import TenantTestMixin

User = get_user_model()


class TenantUserTest(TenantTestMixin, TransactionTestCase):
    """Test TenantUser proxy model"""

    def setUp(self):
        super().setUp()

        # Create users
        self.user1 = create_test_user(email='user1@test.com')
        self.user2 = create_test_user(email='user2@test.com')
        self.user3 = create_test_user(email='user3@test.com')

        # Add users to tenant
        self.user1.tenants.add(self.tenant)
        self.user2.tenants.add(self.tenant)
        # user3 not added to tenant

    def test_tenant_user_manager_filters_by_tenant(self):
        """Test that TenantUser manager filters users by current tenant"""
        with patch('django.db.connection') as mock_connection:
            mock_connection.schema_name = self.tenant.schema_name
            mock_connection.tenant = self.tenant

            tenant_users = TenantUser.objects.all()

            # Should only return users in current tenant
            user_emails = [user.email for user in tenant_users]
            self.assertIn('user1@test.com', user_emails)
            self.assertIn('user2@test.com', user_emails)
            self.assertNotIn('user3@test.com', user_emails)

    def test_tenant_user_manager_public_schema(self):
        """Test that TenantUser manager returns all users in public schema"""
        with patch('django.db.connection') as mock_connection:
            mock_connection.schema_name = 'public'

            tenant_users = TenantUser.objects.all()

            # Should return all users in public schema
            user_emails = [user.email for user in tenant_users]
            self.assertIn('user1@test.com', user_emails)
            self.assertIn('user2@test.com', user_emails)
            self.assertIn('user3@test.com', user_emails)

    def test_tenant_user_manager_no_tenant(self):
        """Test that TenantUser manager returns empty queryset when no tenant"""
        with patch('django.db.connection') as mock_connection:
            mock_connection.schema_name = 'test_schema'
            mock_connection.tenant = None

            tenant_users = TenantUser.objects.all()

            # Should return empty queryset for safety
            self.assertEqual(tenant_users.count(), 0)

    def test_all_users_method(self):
        """Test all_users method returns all users regardless of tenant"""
        all_users = TenantUser.objects.all_users()

        user_emails = [user.email for user in all_users]
        self.assertIn('user1@test.com', user_emails)
        self.assertIn('user2@test.com', user_emails)
        self.assertIn('user3@test.com', user_emails)

    def test_get_tenant_roles(self):
        """Test getting user roles in tenant context"""
        # Create role and assign to user
        role = Role.objects.create(
            name='Test Role',
            role_type='custom'
        )

        user_role = UserRole.objects.create(
            user=self.user1,
            role=role
        )

        tenant_user = TenantUser.objects.get(id=self.user1.id)
        roles = tenant_user.get_tenant_roles()

        self.assertEqual(roles.count(), 1)
        self.assertEqual(roles.first(), user_role)

    def test_assign_role(self):
        """Test assigning role to user"""
        role = Role.objects.create(
            name='Test Role',
            role_type='custom'
        )

        tenant_user = TenantUser.objects.get(id=self.user1.id)
        user_role = tenant_user.assign_role(role, assigned_by=self.user2)

        self.assertEqual(user_role.user, self.user1)
        self.assertEqual(user_role.role, role)
        self.assertEqual(user_role.assigned_by, self.user2)
        self.assertTrue(user_role.is_active)

    def test_remove_role(self):
        """Test removing role from user"""
        role = Role.objects.create(
            name='Test Role',
            role_type='custom'
        )

        user_role = UserRole.objects.create(
            user=self.user1,
            role=role
        )

        tenant_user = TenantUser.objects.get(id=self.user1.id)
        result = tenant_user.remove_role(role)

        self.assertTrue(result)

        # Verify role is deactivated
        user_role.refresh_from_db()
        self.assertFalse(user_role.is_active)

    def test_remove_nonexistent_role(self):
        """Test removing role that user doesn't have"""
        role = Role.objects.create(
            name='Test Role',
            role_type='custom'
        )

        tenant_user = TenantUser.objects.get(id=self.user1.id)
        result = tenant_user.remove_role(role)

        self.assertFalse(result)

    def test_has_role(self):
        """Test checking if user has specific role"""
        role = Role.objects.create(
            name='Test Role',
            role_type='custom'
        )

        UserRole.objects.create(
            user=self.user1,
            role=role
        )

        tenant_user = TenantUser.objects.get(id=self.user1.id)

        self.assertTrue(tenant_user.has_role('Test Role'))
        self.assertFalse(tenant_user.has_role('Nonexistent Role'))

    def test_has_permission(self):
        """Test checking if user has specific permission"""
        role = Role.objects.create(
            name='Test Role',
            role_type='custom',
            permissions={
                'manage_leads': True,
                'manage_contacts': False
            }
        )

        UserRole.objects.create(
            user=self.user1,
            role=role
        )

        tenant_user = TenantUser.objects.get(id=self.user1.id)

        self.assertTrue(tenant_user.has_permission('manage_leads'))
        self.assertFalse(tenant_user.has_permission('manage_contacts'))
        self.assertFalse(tenant_user.has_permission('nonexistent_permission'))

    def test_get_tenant_permissions(self):
        """Test getting all permissions for user"""
        role1 = Role.objects.create(
            name='Role 1',
            role_type='custom',
            permissions={
                'manage_leads': True,
                'view_customers': True
            }
        )

        role2 = Role.objects.create(
            name='Role 2',
            role_type='custom',
            permissions={
                'manage_contacts': True,
                'view_customers': True  # Duplicate should only appear once
            }
        )

        UserRole.objects.create(user=self.user1, role=role1)
        UserRole.objects.create(user=self.user1, role=role2)

        tenant_user = TenantUser.objects.get(id=self.user1.id)
        permissions = tenant_user.get_tenant_permissions()

        expected_permissions = ['manage_leads', 'view_customers', 'manage_contacts']
        self.assertEqual(len(permissions), 3)
        for perm in expected_permissions:
            self.assertIn(perm, permissions)


class RoleTest(TransactionTestCase):
    """Test Role model"""

    def test_role_creation(self):
        """Test creating a role"""
        role = Role.objects.create(
            name='Test Role',
            role_type='custom',
            description='A test role',
            permissions={
                'manage_leads': True,
                'view_customers': True
            }
        )

        self.assertEqual(role.name, 'Test Role')
        self.assertEqual(role.role_type, 'custom')
        self.assertEqual(role.description, 'A test role')
        self.assertTrue(role.is_active)
        self.assertEqual(role.permissions['manage_leads'], True)
        self.assertEqual(role.permissions['view_customers'], True)

    def test_role_str_representation(self):
        """Test string representation of role"""
        role = Role.objects.create(
            name='Test Role',
            role_type='admin'
        )

        self.assertEqual(str(role), 'Test Role (admin)')

    def test_role_unique_together(self):
        """Test unique constraint on name and role_type"""
        Role.objects.create(
            name='Test Role',
            role_type='admin'
        )

        with self.assertRaises(IntegrityError):
            Role.objects.create(
                name='Test Role',
                role_type='admin'  # Same name and type
            )

    def test_role_same_name_different_type(self):
        """Test creating roles with same name but different type"""
        Role.objects.create(
            name='Test Role',
            role_type='admin'
        )

        # Should be allowed with different type
        role2 = Role.objects.create(
            name='Test Role',
            role_type='manager'
        )

        self.assertEqual(role2.name, 'Test Role')
        self.assertEqual(role2.role_type, 'manager')

    def test_role_default_values(self):
        """Test default values for role fields"""
        role = Role.objects.create(
            name='Test Role',
            role_type='custom'
        )

        self.assertTrue(role.is_active)
        self.assertEqual(role.description, '')
        self.assertEqual(role.permissions, {})

    def test_role_type_choices(self):
        """Test role type choices"""
        valid_types = ['admin', 'manager', 'sales', 'support', 'viewer', 'custom']

        for role_type in valid_types:
            role = Role.objects.create(
                name=f'Test {role_type}',
                role_type=role_type
            )
            self.assertEqual(role.role_type, role_type)


class UserRoleTest(TenantTestMixin, TransactionTestCase):
    """Test UserRole model"""

    def setUp(self):
        super().setUp()

        self.user = create_test_user(email='user@test.com')
        self.admin_user = create_test_user(email='admin@test.com')

        self.role = Role.objects.create(
            name='Test Role',
            role_type='custom'
        )

    def test_user_role_creation(self):
        """Test creating a user role assignment"""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role,
            assigned_by=self.admin_user
        )

        self.assertEqual(user_role.user, self.user)
        self.assertEqual(user_role.role, self.role)
        self.assertEqual(user_role.assigned_by, self.admin_user)
        self.assertTrue(user_role.is_active)
        self.assertIsNotNone(user_role.assigned_at)

    def test_user_role_str_representation(self):
        """Test string representation of user role"""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role
        )

        expected_str = f'{self.user.email} - {self.role.name}'
        self.assertEqual(str(user_role), expected_str)

    def test_user_role_unique_together(self):
        """Test unique constraint on user and role"""
        UserRole.objects.create(
            user=self.user,
            role=self.role
        )

        with self.assertRaises(IntegrityError):
            UserRole.objects.create(
                user=self.user,
                role=self.role  # Same user and role
            )

    def test_user_role_default_values(self):
        """Test default values for user role fields"""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role
        )

        self.assertTrue(user_role.is_active)
        self.assertIsNone(user_role.assigned_by)

    def test_user_role_cascade_delete_user(self):
        """Test cascade delete when user is deleted"""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role
        )

        user_role_id = user_role.id
        self.user.delete()

        # UserRole should be deleted
        with self.assertRaises(UserRole.DoesNotExist):
            UserRole.objects.get(id=user_role_id)

    def test_user_role_cascade_delete_role(self):
        """Test cascade delete when role is deleted"""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role
        )

        user_role_id = user_role.id
        self.role.delete()

        # UserRole should be deleted
        with self.assertRaises(UserRole.DoesNotExist):
            UserRole.objects.get(id=user_role_id)

    def test_user_role_set_null_assigned_by(self):
        """Test SET_NULL when assigned_by user is deleted"""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role,
            assigned_by=self.admin_user
        )

        self.admin_user.delete()

        user_role.refresh_from_db()
        self.assertIsNone(user_role.assigned_by)


class AuditLogTest(TenantTestMixin, TransactionTestCase):
    """Test AuditLog model"""

    def setUp(self):
        super().setUp()
        self.user = create_test_user(email='user@test.com')

    def test_audit_log_creation(self):
        """Test creating an audit log entry"""
        audit_log = AuditLog.objects.create(
            user=self.user,
            action='create',
            model_name='User',
            object_id=str(self.user.id),
            changes={'email': 'user@test.com'},
            ip_address='127.0.0.1',
            user_agent='Test Browser'
        )

        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.action, 'create')
        self.assertEqual(audit_log.model_name, 'User')
        self.assertEqual(audit_log.object_id, str(self.user.id))
        self.assertEqual(audit_log.changes['email'], 'user@test.com')
        self.assertEqual(audit_log.ip_address, '127.0.0.1')
        self.assertEqual(audit_log.user_agent, 'Test Browser')
        self.assertIsNotNone(audit_log.timestamp)

    def test_audit_log_str_representation(self):
        """Test string representation of audit log"""
        audit_log = AuditLog.objects.create(
            user=self.user,
            action='update',
            model_name='Profile',
            object_id='123'
        )

        expected_str = f'{self.user} - update - Profile - {audit_log.timestamp}'
        self.assertEqual(str(audit_log), expected_str)

    def test_audit_log_action_choices(self):
        """Test audit log action choices"""
        valid_actions = ['create', 'update', 'delete', 'login', 'logout', 'access']

        for action in valid_actions:
            audit_log = AuditLog.objects.create(
                user=self.user,
                action=action,
                model_name='TestModel',
                object_id='123'
            )
            self.assertEqual(audit_log.action, action)

    def test_audit_log_default_values(self):
        """Test default values for audit log fields"""
        audit_log = AuditLog.objects.create(
            user=self.user,
            action='create',
            model_name='TestModel',
            object_id='123'
        )

        self.assertEqual(audit_log.changes, {})
        self.assertEqual(audit_log.user_agent, '')
        self.assertIsNone(audit_log.ip_address)

    def test_audit_log_ordering(self):
        """Test audit log ordering by timestamp desc"""
        # Create multiple audit logs
        log1 = AuditLog.objects.create(
            user=self.user,
            action='create',
            model_name='Model1',
            object_id='1'
        )

        log2 = AuditLog.objects.create(
            user=self.user,
            action='update',
            model_name='Model2',
            object_id='2'
        )

        logs = AuditLog.objects.all()

        # Should be ordered by timestamp descending (newest first)
        self.assertEqual(logs[0], log2)
        self.assertEqual(logs[1], log1)

    def test_audit_log_set_null_user(self):
        """Test SET_NULL when user is deleted"""
        audit_log = AuditLog.objects.create(
            user=self.user,
            action='create',
            model_name='TestModel',
            object_id='123'
        )

        self.user.delete()

        audit_log.refresh_from_db()
        self.assertIsNone(audit_log.user)

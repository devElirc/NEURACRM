"""
Factory classes for creating test data
"""
import factory
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory

from apps.accounts.models import Account
from apps.contacts.models import Contact
from apps.core.models import Client, Domain
from apps.leads.models import Lead
from apps.tenant_core.models import Role, UserRole

User = get_user_model()


class ClientFactory(DjangoModelFactory):
    """Factory for Client model"""

    class Meta:
        model = Client
        django_get_or_create = ('schema_name',)

    schema_name = factory.Sequence(lambda n: f'tenant_{n}')
    name = factory.Faker('company')
    description = factory.Faker('text', max_nb_chars=200)
    is_active = True


class DomainFactory(DjangoModelFactory):
    """Factory for Domain model"""

    class Meta:
        model = Domain

    domain = factory.LazyAttribute(lambda obj: f'{obj.tenant.schema_name}.localhost')
    tenant = factory.SubFactory(ClientFactory)
    is_primary = True


class UserFactory(DjangoModelFactory):
    """Factory for User model"""

    class Meta:
        model = User
        django_get_or_create = ('email',)

    email = factory.Faker('email')
    username = factory.LazyAttribute(lambda obj: obj.email.split('@')[0])
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    phone = factory.Faker('phone_number')
    password = factory.PostGenerationMethodCall('set_password', 'defaultpass123')
    is_active = True
    is_superadmin = False

    @factory.post_generation
    def tenants(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for tenant in extracted:
                self.tenants.add(tenant)


class SuperAdminUserFactory(UserFactory):
    """Factory for superadmin users"""

    email = 'superadmin@test.com'
    username = 'superadmin'
    first_name = 'Super'
    last_name = 'Admin'
    is_superadmin = True
    is_staff = True
    is_superuser = True


class TenantAdminUserFactory(UserFactory):
    """Factory for tenant admin users"""

    email = 'admin@test.com'
    username = 'admin'
    first_name = 'Admin'
    last_name = 'User'


class RoleFactory(DjangoModelFactory):
    """Factory for Role model"""

    class Meta:
        model = Role
        django_get_or_create = ('name', 'role_type')

    name = factory.Faker('job')
    role_type = 'custom'
    description = factory.Faker('text', max_nb_chars=100)
    permissions = factory.LazyFunction(dict)
    is_active = True


class AdminRoleFactory(RoleFactory):
    """Factory for admin role"""

    name = 'Admin'
    role_type = 'admin'
    permissions = {
        'all': True,
        'manage_team': True,
        'manage_opportunities': True,
        'manage_leads': True,
        'manage_contacts': True,
        'manage_tickets': True,
        'view_customers': True,
        'manage_knowledge_base': True,
        'manage_accounts': True,
        'manage_campaigns': True,
        'manage_reports': True,
        'manage_settings': True
    }


class ManagerRoleFactory(RoleFactory):
    """Factory for manager role"""

    name = 'Manager'
    role_type = 'manager'
    permissions = {
        'manage_team': True,
        'manage_opportunities': True,
        'manage_leads': True,
        'manage_contacts': True,
        'view_customers': True,
        'manage_reports': True
    }


class SalesRoleFactory(RoleFactory):
    """Factory for sales role"""

    name = 'Sales Rep'
    role_type = 'sales'
    permissions = {
        'manage_leads': True,
        'manage_contacts': True,
        'view_customers': True
    }


class ViewerRoleFactory(RoleFactory):
    """Factory for viewer role"""

    name = 'Viewer'
    role_type = 'viewer'
    permissions = {
        'view_only': True,
        'view_customers': True
    }


class UserRoleFactory(DjangoModelFactory):
    """Factory for UserRole model"""

    class Meta:
        model = UserRole
        django_get_or_create = ('user', 'role')

    user = factory.SubFactory(UserFactory)
    role = factory.SubFactory(RoleFactory)
    assigned_by = factory.SubFactory(UserFactory)
    is_active = True


class AccountFactory(DjangoModelFactory):
    """Factory for Account model"""

    class Meta:
        model = Account

    tenant = factory.SubFactory(ClientFactory)
    account_name = factory.Faker('company')
    account_owner_alias = factory.Faker('name')
    description = factory.Faker('text', max_nb_chars=200)
    industry = factory.Faker('word')
    website = factory.Faker('url')
    phone = factory.Faker('phone_number')
    owner = factory.SubFactory(UserFactory)

    # Billing address
    billing_country = factory.Faker('country')
    billing_street = factory.Faker('street_address')
    billing_city = factory.Faker('city')
    billing_state_province = factory.Faker('state')
    billing_zip_postal_code = factory.Faker('postcode')

    # Shipping address
    shipping_country = factory.Faker('country')
    shipping_street = factory.Faker('street_address')
    shipping_city = factory.Faker('city')
    shipping_state_province = factory.Faker('state')
    shipping_zip_postal_code = factory.Faker('postcode')

    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.SubFactory(UserFactory)


class LeadFactory(DjangoModelFactory):
    """Factory for Lead model"""

    class Meta:
        model = Lead

    tenant = factory.SubFactory(ClientFactory)
    company = factory.SubFactory(AccountFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    title = factory.Faker('job')
    website = factory.Faker('url')
    description = factory.Faker('text', max_nb_chars=200)

    lead_status = factory.Faker('random_element', elements=['New', 'Contacted', 'Qualified', 'Proposal', 'Closed'])
    score = factory.Faker('random_int', min=0, max=100)
    lead_owner = factory.SubFactory(UserFactory)

    # Contact info
    email = factory.Faker('email')
    phone = factory.Faker('phone_number')

    # Address fields
    street = factory.Faker('street_address')
    city = factory.Faker('city')
    state = factory.Faker('state')
    country = factory.Faker('country')
    postal_code = factory.Faker('postcode')

    # Business info
    number_of_employees = factory.Faker('random_int', min=1, max=10000)
    average_revenue = factory.Faker('pydecimal', left_digits=8, right_digits=2, positive=True)
    lead_source = factory.Faker('random_element', elements=['Website', 'Phone', 'Email', 'Referral', 'Social Media'])
    industry = factory.Faker('word')

    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.SubFactory(UserFactory)


class ContactFactory(DjangoModelFactory):
    """Factory for Contact model"""

    class Meta:
        model = Contact

    tenant = factory.SubFactory(ClientFactory)
    account = factory.SubFactory(AccountFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    title = factory.Faker('job')
    description = factory.Faker('text', max_nb_chars=200)
    email = factory.Faker('email')
    phone = factory.Faker('phone_number')

    # Mailing address
    mailing_street = factory.Faker('street_address')
    mailing_city = factory.Faker('city')
    mailing_state = factory.Faker('state')
    mailing_country = factory.Faker('country')
    postal_code = factory.Faker('postcode')

    # Owners
    owner = factory.SubFactory(UserFactory)
    contact_owner = factory.SubFactory(UserFactory)

    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.SubFactory(UserFactory)


class LeadFactory(DjangoModelFactory):
    """Factory for Lead model"""

    class Meta:
        model = Lead

    tenant = factory.SubFactory(ClientFactory)
    company = factory.SubFactory(AccountFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    title = factory.Faker('job')
    website = factory.Faker('url')
    description = factory.Faker('text', max_nb_chars=200)

    lead_status = factory.Faker('random_element', elements=['New', 'Contacted', 'Qualified', 'Proposal', 'Closed'])
    score = factory.Faker('random_int', min=0, max=100)
    lead_owner = factory.SubFactory(UserFactory)

    # Contact info
    email = factory.Faker('email')
    phone = factory.Faker('phone_number')

    # Address fields
    street = factory.Faker('street_address')
    city = factory.Faker('city')
    state = factory.Faker('state')
    country = factory.Faker('country')
    postal_code = factory.Faker('postcode')

    # Business info
    number_of_employees = factory.Faker('random_int', min=1, max=10000)
    average_revenue = factory.Faker('pydecimal', left_digits=8, right_digits=2, positive=True)
    lead_source = factory.Faker('random_element', elements=['Website', 'Phone', 'Email', 'Referral', 'Social Media'])
    industry = factory.Faker('word')

    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.SubFactory(UserFactory)

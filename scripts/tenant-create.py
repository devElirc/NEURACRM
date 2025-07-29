#!/usr/bin/env python
"""
Script to create a new tenant
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Add the project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'crm', 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.core.models import Client, Domain


def create_tenant(name, domain_name, description=""):
    """Create a new tenant with domain"""
    try:
        # Create tenant
        tenant = Client.objects.create(
            name=name,
            schema_name=name.lower().replace(' ', '_'),
            description=description
        )
        
        # Create domain
        domain = Domain.objects.create(
            domain=domain_name,
            tenant=tenant,
            is_primary=True
        )
        
        print(f"✓ Tenant '{name}' created successfully!")
        print(f"  Schema: {tenant.schema_name}")
        print(f"  Domain: {domain.domain}")
        print(f"  ID: {tenant.id}")
        
        return tenant, domain
        
    except Exception as e:
        print(f"✗ Error creating tenant: {e}")
        return None, None


def main():
    if len(sys.argv) < 3:
        print("Usage: python tenant-create.py <tenant_name> <domain_name> [description]")
        print("Example: python tenant-create.py 'Acme Corp' 'acme.localhost' 'Acme Corporation tenant'")
        sys.exit(1)
    
    tenant_name = sys.argv[1]
    domain_name = sys.argv[2]
    description = sys.argv[3] if len(sys.argv) > 3 else ""
    
    print(f"Creating tenant: {tenant_name}")
    print(f"Domain: {domain_name}")
    
    tenant, domain = create_tenant(tenant_name, domain_name, description)
    
    if tenant:
        print("\nNext steps:")
        print("1. Add the domain to your hosts file:")
        print(f"   127.0.0.1 {domain_name}")
        print("2. Run migrations for the new tenant:")
        print(f"   python manage.py migrate_schemas --tenant={tenant.schema_name}")


if __name__ == "__main__":
    main()
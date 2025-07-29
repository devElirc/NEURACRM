import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django_tenants.models import DomainMixin, TenantMixin


class Client(TenantMixin):
    """
    Tenant model for multi-tenancy support
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    # Default schema_name will be set by django-tenants
    auto_create_schema = True

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """
    Domain model for tenant domains
    """
    pass


class User(AbstractUser):
    """
    Custom user model with additional fields
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    is_superadmin = models.BooleanField(default=False)
    tenants = models.ManyToManyField(Client, related_name='users', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"



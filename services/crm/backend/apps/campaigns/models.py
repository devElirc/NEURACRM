from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Campaign(models.Model):
    """Campaign model for marketing campaigns"""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('active', 'Active'),
            ('paused', 'Paused'),
            ('completed', 'Completed'),
        ],
        default='draft'
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaigns')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

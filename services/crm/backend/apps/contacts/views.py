from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils import rate_limit

# Removed cache_page import - caching disabled for immediate data updates
from apps.tenant_core.permissions import HasTenantPermission, IsTenantUser

from .models import Contact
from .serializers import (
    ContactCreateSerializer,
    ContactListSerializer,
    ContactSerializer,
)


class ContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contacts with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_contacts']

    def get_queryset(self):
        """
        Return contacts filtered by current tenant
        The TenantContactManager automatically handles tenant isolation
        """
        return Contact.objects.all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return ContactListSerializer
        elif self.action == 'create':
            return ContactCreateSerializer
        return ContactSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create contact with tenant and audit info
        """
        serializer.save(
            tenant=self.request.tenant,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update contact with audit info
        """
        serializer.save(updated_by=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        List contacts without caching for immediate data updates
        """
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get contact summary statistics
        """
        contacts = self.get_queryset()

        # Calculate statistics
        total_contacts = contacts.count()
        contacts_with_accounts = contacts.filter(account__isnull=False).count()
        contacts_with_phone = contacts.exclude(phone__isnull=True).exclude(phone__exact='').count()
        contacts_by_title = {}

        for contact in contacts:
            title = contact.title or 'Unknown'
            contacts_by_title[title] = contacts_by_title.get(title, 0) + 1

        return Response({
            'total_contacts': total_contacts,
            'contacts_with_accounts': contacts_with_accounts,
            'contacts_with_phone': contacts_with_phone,
            'contacts_by_title': contacts_by_title,
            'tenant': request.tenant.name if request.tenant else None,
        })

    @action(detail=True, methods=['get'])
    def account_info(self, request, pk=None):
        """
        Get account information for a specific contact
        """
        contact = self.get_object()

        if not contact.account:
            return Response({
                'contact_id': contact.contact_id,
                'contact_name': f"{contact.first_name} {contact.last_name}",
                'account': None,
                'message': 'Contact is not associated with any account'
            })

        account = contact.account
        return Response({
            'contact_id': contact.contact_id,
            'contact_name': f"{contact.first_name} {contact.last_name}",
            'account': {
                'account_id': account.account_id,
                'account_name': account.account_name,
                'industry': account.industry,
                'website': account.website,
                'phone': account.phone,
            }
        })

    @action(detail=True, methods=['get'])
    def reportees(self, request, pk=None):
        """
        Get all contacts who report to this contact
        """
        contact = self.get_object()
        reportees = contact.reportees.all()

        # Simple serialization for reportees
        reportees_data = []
        for reportee in reportees:
            reportees_data.append({
                'contact_id': reportee.contact_id,
                'first_name': reportee.first_name,
                'last_name': reportee.last_name,
                'email': reportee.email,
                'phone': reportee.phone,
                'title': reportee.title,
            })

        return Response({
            'contact_id': contact.contact_id,
            'contact_name': f"{contact.first_name} {contact.last_name}",
            'reportees': reportees_data,
            'count': len(reportees_data)
        })

    @action(detail=True, methods=['get'])
    def deals(self, request, pk=None):
        """
        Get all deals where this contact is the primary contact
        """
        contact = self.get_object()
        
        # Get deals where this contact is the primary contact
        # This ensures each contact only sees deals they are directly associated with
        # Use select_related to optimize database queries
        deals = contact.primary_deals.select_related('account', 'owner').all()
        
        deals_data = []
        for deal in deals:
            deals_data.append({
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name,
                'stage': deal.stage,
                'amount': str(deal.amount),
                'close_date': deal.close_date,
                'owner': deal.owner.get_full_name() if deal.owner else None,
                'account_id': deal.account.account_id if deal.account else None,
                'account_name': deal.account.account_name if deal.account else None,
            })
        
        return Response({
            'contact_id': contact.contact_id,
            'contact_name': f"{contact.first_name} {contact.last_name}",
            'deals': deals_data,
            'count': len(deals_data)
        })

    @action(detail=False, methods=['get'])
    def by_account(self, request):
        """
        Get contacts grouped by account
        """
        account_id = request.query_params.get('account_id')
        if not account_id:
            return Response({
                'error': 'account_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        contacts = self.get_queryset().filter(account_id=account_id)

        contacts_data = []
        for contact in contacts:
            contacts_data.append({
                'contact_id': contact.contact_id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'email': contact.email,
                'phone': contact.phone,
                'title': contact.title,
                'owner': contact.owner.get_full_name() if contact.owner else None,
            })

        return Response({
            'account_id': account_id,
            'contacts': contacts_data,
            'count': len(contacts_data)
        })

    def destroy(self, request, *args, **kwargs):
        """
        Delete contact with additional validation
        """
        contact = self.get_object()

        # Check if contact has reportees
        reportees_count = contact.reportees.count()
        if reportees_count > 0:
            return Response({
                'error': f'Cannot delete contact with {reportees_count} reportees. Please reassign reportees first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        return super().destroy(request, *args, **kwargs)

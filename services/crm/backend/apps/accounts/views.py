from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils import rate_limit

# Removed cache_page import - caching disabled for immediate data updates
from apps.tenant_core.permissions import HasTenantPermission, IsTenantUser

from .models import Account
from .serializers import (
    AccountCreateSerializer,
    AccountListSerializer,
    AccountSerializer,
)


class AccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing accounts with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_accounts']

    def get_queryset(self):
        """
        Return accounts filtered by current tenant
        The TenantAccountManager automatically handles tenant isolation
        """
        return Account.objects.all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return AccountListSerializer
        elif self.action == 'create':
            return AccountCreateSerializer
        return AccountSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create account with tenant and audit info
        """
        serializer.save(
            tenant=self.request.tenant,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update account with audit info
        """
        serializer.save(updated_by=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        List accounts without caching for immediate data updates
        """
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def contacts(self, request, pk=None):
        """
        Get all contacts for a specific account
        """
        account = self.get_object()
        contacts = account.contacts.all()

        # Simple serialization for related contacts
        contacts_data = []
        for contact in contacts:
            contacts_data.append({
                'contact_id': contact.contact_id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'email': contact.email,
                'phone': contact.phone,
                'title': contact.title,
            })

        return Response({
            'account_id': account.account_id,
            'account_name': account.account_name,
            'contacts': contacts_data,
            'count': len(contacts_data)
        })

    @action(detail=True, methods=['get'])
    def deals(self, request, pk=None):
        """
        Get all deals for a specific account
        """
        account = self.get_object()
        deals = account.deals.all()

        # Simple serialization for related deals
        deals_data = []
        for deal in deals:
            deals_data.append({
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name,
                'stage': deal.stage,
                'amount': str(deal.amount),
                'close_date': deal.close_date,
                'owner': deal.owner.get_full_name() if deal.owner else None,
            })

        return Response({
            'account_id': account.account_id,
            'account_name': account.account_name,
            'deals': deals_data,
            'count': len(deals_data)
        })

    @action(detail=True, methods=['get'])
    def leads(self, request, pk=None):
        """
        Get all leads for a specific account
        """
        account = self.get_object()
        leads = account.leads.all()

        # Simple serialization for related leads
        leads_data = []
        for lead in leads:
            leads_data.append({
                'lead_id': lead.lead_id,
                'first_name': lead.first_name,
                'last_name': lead.last_name,
                'email': lead.email,
                'phone': lead.phone,
                'lead_status': lead.lead_status,
                'score': lead.score,
                'owner': lead.lead_owner.get_full_name() if lead.lead_owner else None,
            })

        return Response({
            'account_id': account.account_id,
            'account_name': account.account_name,
            'leads': leads_data,
            'count': len(leads_data)
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get account summary statistics
        """
        accounts = self.get_queryset()

        # Calculate statistics
        total_accounts = accounts.count()
        accounts_with_contacts = accounts.filter(contacts__isnull=False).distinct().count()
        accounts_with_deals = accounts.filter(deals__isnull=False).distinct().count()
        accounts_by_industry = {}

        for account in accounts:
            industry = account.industry or 'Unknown'
            accounts_by_industry[industry] = accounts_by_industry.get(industry, 0) + 1

        return Response({
            'total_accounts': total_accounts,
            'accounts_with_contacts': accounts_with_contacts,
            'accounts_with_deals': accounts_with_deals,
            'accounts_by_industry': accounts_by_industry,
            'tenant': request.tenant.name if request.tenant else None,
        })

    def destroy(self, request, *args, **kwargs):
        """
        Delete account with additional validation
        """
        account = self.get_object()

        # Check if account has active deals
        active_deals = account.deals.exclude(stage__in=['Closed Won', 'Closed Lost']).count()
        if active_deals > 0:
            return Response({
                'error': f'Cannot delete account with {active_deals} active deals. Please close or reassign deals first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        return super().destroy(request, *args, **kwargs)

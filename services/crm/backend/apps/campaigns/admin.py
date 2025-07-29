from unfold.admin import ModelAdmin

from apps.tenant_core.admin import tenant_admin_site

from .models import Campaign


class CampaignAdmin(ModelAdmin):
    list_display = ('name', 'status', 'start_date', 'end_date', 'budget', 'created_by', 'created_at')
    list_filter = ('status', 'start_date', 'end_date', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'


# Register with tenant admin site
tenant_admin_site.register(Campaign, CampaignAdmin)

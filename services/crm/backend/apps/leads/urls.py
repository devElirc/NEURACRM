
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LeadViewSet

# Create router and register viewset
router = DefaultRouter()
router.register(r'', LeadViewSet, basename='lead')

urlpatterns = [
    path('', include(router.urls)),
]

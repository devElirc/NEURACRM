from django.urls import path, include
from rest_framework import routers
from .views import (
    MessageViewSet,
    TagViewSet,
    CommentViewSet,
    InboxViewSet,
    TaskViewSet,
    CalendarEventViewSet,
    google_callback,  # <-- import the callback
)

router = routers.DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'tags', TagViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'inboxes', InboxViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'calendar_events', CalendarEventViewSet)

urlpatterns = [
    path('', include(router.urls)),

    #  Add Google OAuth callback path
    path('auth/google/callback', google_callback, name='google_callback'),
]

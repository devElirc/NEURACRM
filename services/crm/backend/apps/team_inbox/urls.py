from django.urls import path, include
from rest_framework import routers
from .views.views import  gmail_notify, outlook_notify, TeamMemberViewSet, InboxViewSet, ChannelAccountViewSet, TagViewSet, CommentViewSet, TaskViewSet, CalendarEventViewSet
from .views.message_view import  MessageViewSet
from .views.conversations import  ConversationListView
from .views.ai_views import  AIReplyView
from .views.google_integration import google_callback
from .views.outlook_integration import outlook_callback


router = routers.DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'tags', TagViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'inboxes', InboxViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'calendar_events', CalendarEventViewSet)
router.register(r'channel-account', ChannelAccountViewSet)
router.register(r'teammates', TeamMemberViewSet, basename='teammate')

urlpatterns = [
    path('', include(router.urls)),

    #  Add Google OAuth callback path
    path('auth/google/callback', google_callback, name='google_callback'),    
    
    #  Add Google OAuth callback path
    path('auth/outlook/callback', outlook_callback, name='outlook_callback'),

    # Gmail Pub/Sub push notification webhook
    path('gmail/push/', gmail_notify, name='gmail_notify'),
    
    path('outlook/notify/', outlook_notify, name='outlook_notify'),

    path("conversations/", ConversationListView.as_view(), name="conversation-list"),

    path("ai-reply/", AIReplyView.as_view(), name="ai-reply"),


]

import json
import base64
import requests
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from ..services.gmail_service import GmailService
from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from ..models import TeamMember, Inbox, ChannelAccount, Tag, Message, Comment, Task, CalendarEvent
from ..serializers import (
    TeamMemberSerializer, InboxSerializer, ChannelAccountSerializer,
    TagSerializer, MessageSerializer, CommentSerializer,
    TaskSerializer, CalendarEventSerializer
)

from ...core.models import TenantEmailMapping, Client
from django_tenants.utils import  schema_context



@api_view(["POST"])
@permission_classes([AllowAny])
def google_callback(request):
    try:
        data = json.loads(request.body)
        code, inbox_name = data.get("code"), data.get("inbox_name")
        if not code or not inbox_name:
            return JsonResponse({"error": "Missing code or inbox_name"}, status=400)

        # Exchange code for tokens
        token_data = exchange_code_for_token(code)
        access_token = token_data["access_token"]
        refresh_token = token_data["refresh_token"]

        # Get user email from Google
        email = get_google_user_email(access_token)
        print("✅ Found Google email:", email)

        # Get current tenant from request (based on subdomain)
        tenant = request.tenant
        tenant_schema = tenant.schema_name
        print("✅ Detected tenant:", tenant_schema)

        with schema_context(tenant_schema):
            # Ensure email mapping is created in the public schema
            with schema_context("public"):
                TenantEmailMapping.objects.update_or_create(
                    email=email, defaults={"tenant": tenant}
                )
                print("✅ Email mapping created in public schema")

            # Now do tenant-specific operations
            inbox, _ = Inbox.objects.get_or_create(email=email, defaults={"name": inbox_name})
            channel_account, _ = ChannelAccount.objects.update_or_create(
                email=email,
                defaults=dict(
                    provider="gmail",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_in=token_data["expires_in"],
                    token_acquired_at=timezone.now(),
                    inbox=inbox,
                ),
            )

            gmail = GmailService(channel_account)
            watch_response = gmail.start_watch()
            if "historyId" in watch_response:
                channel_account.last_history_id = watch_response["historyId"]
                channel_account.save()

            return JsonResponse({"email": email, "inbox_id": str(inbox.id)})

    except Exception as e:
        print("❌ Error in google_callback:", e)
        return JsonResponse({"error": str(e)}, status=500)

def exchange_code_for_token(code):
    response = requests.post("https://oauth2.googleapis.com/token", data={
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://localhost:3000/google-callback.html",
        "grant_type": "authorization_code",
    })
    response.raise_for_status()
    return response.json()


def get_google_user_email(access_token):
    response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
        "Authorization": f"Bearer {access_token}"
    })
    response.raise_for_status()
    return response.json().get("email")


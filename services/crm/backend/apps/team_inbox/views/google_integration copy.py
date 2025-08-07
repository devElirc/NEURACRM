import json
import base64
import requests
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from ..services.gmail_service import GmailService
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes

from ..models import TeamMember, Inbox, ChannelAccount, Tag, Message, Comment, Task, CalendarEvent
from ..serializers import (
    TeamMemberSerializer, InboxSerializer, ChannelAccountSerializer,
    TagSerializer, MessageSerializer, CommentSerializer,
    TaskSerializer, CalendarEventSerializer
)

from ...core.models import TenantEmailMapping, Client
from django_tenants.utils import  schema_context


import requests
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.conf import settings

from ..services.gmail_service import GmailService
from ...core.models import TenantEmailMapping
from django_tenants.utils import schema_context


@api_view(["POST"])
@permission_classes([AllowAny])
def google_callback(request):
    try:
        print("📥 Google callback triggered")

        # Extract the original Django HttpRequest from DRF Request
        django_request = getattr(request, '_request', request)  # fallback to request itself

        data = json.loads(django_request.body)
        code = data.get("code")
        inbox_name = data.get("inbox_name")

        if not code or not inbox_name:
            return JsonResponse({"error": "Missing code or inbox_name"}, status=400)

        # Step 1: Exchange code for token
        print("🔁 Exchanging code for tokens...")
        token_data = exchange_code_for_token(code)
        print("✅ Token exchange success.")

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")

        if not access_token or not refresh_token:
            return JsonResponse({"error": "Missing token data from Google"}, status=500)

        # Step 2: Fetch user email from Google
        print("📧 Fetching Google user email...")
        email = get_google_user_email(access_token)
        if not email:
            return JsonResponse({"error": "Unable to fetch email from Google"}, status=500)

        # Step 3: Resolve tenant from django_request (not DRF request)
        tenant = getattr(django_request, 'tenant', None)
        if not tenant:
            return JsonResponse({"error": "Tenant not found in request"}, status=400)

        tenant_schema = tenant.schema_name
        print("🏢 Tenant schema:", tenant_schema)

        # Step 4: Map email to tenant in public schema
        with schema_context("public"):
            mapping, created = TenantEmailMapping.objects.update_or_create(
                email=email,
                defaults={"tenant": tenant}
            )
            print(f"🔗 Email mapping {'created' if created else 'updated'} in public schema.")

        # Step 5: Create or update inbox and channel account in tenant schema
        with schema_context(tenant_schema):
            inbox, _ = Inbox.objects.get_or_create(email=email, defaults={"name": inbox_name})

            channel_account, _ = ChannelAccount.objects.update_or_create(
                email=email,
                defaults={
                    "provider": "gmail",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_in": token_data.get("expires_in", 3600),
                    "token_acquired_at": timezone.now(),
                    "inbox": inbox,
                }
            )
            print("✅ Channel account saved.")

            # Step 6: Start Gmail watch
            print("👀 Starting Gmail watch...")
            gmail = GmailService(channel_account)
            watch_response = gmail.start_watch()
            print("📡 Gmail watch response:", watch_response)

            if "historyId" in watch_response:
                channel_account.last_history_id = watch_response["historyId"]
                channel_account.save(update_fields=["last_history_id"])
                print("✅ Updated historyId:", watch_response["historyId"])
            else:
                print("⚠️ Watch response did not contain historyId")

        return JsonResponse({
            "email": email,
            "inbox_id": str(inbox.id),
            "tenant": tenant_schema
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("❌ Error in google_callback:", str(e))
        return JsonResponse({"error": str(e)}, status=500)

def exchange_code_for_token(code):
    response = requests.post("https://oauth2.googleapis.com/token", data={
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://localhost:3000/google-callback.html",  # must match exactly!
        "grant_type": "authorization_code",
    })

    if response.status_code != 200:
        print("❌ Google token exchange failed")
        print("Status code:", response.status_code)
        print("Response:", response.text)  # Log the actual error
        response.raise_for_status()

    return response.json()

def get_google_user_email(access_token):
    response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
        "Authorization": f"Bearer {access_token}"
    })
    response.raise_for_status()
    return response.json().get("email")

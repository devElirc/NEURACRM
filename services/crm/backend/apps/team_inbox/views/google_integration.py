import json
import requests
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django_tenants.utils import schema_context

from ..services.gmail_service import GmailService
from ..models import Inbox, ChannelAccount
from ...core.models import TenantEmailMapping


def exchange_code_for_token(code: str) -> dict:
    """Exchange authorization code for access + refresh tokens."""
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": "http://localhost:3000/google-callback.html",
            "grant_type": "authorization_code",
        },
    )
    response.raise_for_status()
    return response.json()


def get_google_user_email(access_token: str) -> str:
    """Fetch Google account email using access token."""
    response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    response.raise_for_status()
    return response.json().get("email")


@api_view(["POST"])
@permission_classes([AllowAny])
def google_callback(request):
    """
    OAuth2 callback for Google authentication.
    - Exchanges code for tokens
    - Retrieves Google email
    - Creates tenant email mapping
    - Creates/updates Inbox and ChannelAccount
    - Starts Gmail watch
    """
    try:
        data = json.loads(request.body)
        code = data.get("code")
        inbox_name = data.get("inboxName")

        if not code or not inbox_name:
            return JsonResponse({"error": "Missing code or inboxName"}, status=400)

        # Exchange code for tokens
        token_data = exchange_code_for_token(code)
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")

        # Fetch Google email
        identifier = get_google_user_email(access_token)

        tenant = request.tenant
        tenant_schema = tenant.schema_name

        with schema_context(tenant_schema):
            # Ensure mapping exists in public schema
            with schema_context("public"):
                TenantEmailMapping.objects.update_or_create(
                    email=identifier, defaults={"tenant": tenant}
                )

            # Ensure inbox exists
            inbox, _ = Inbox.objects.get_or_create(name=inbox_name)

            # Create or update channel account
            channel_account, _ = ChannelAccount.objects.update_or_create(
                identifier=identifier,
                defaults=dict(
                    provider="gmail",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_in=token_data["expires_in"],
                    token_acquired_at=timezone.now(),
                    inbox=inbox,
                ),
            )

            # Start Gmail push notifications
            gmail = GmailService(channel_account)
            try:
                watch_response = gmail.start_watch()
                if "historyId" in watch_response:
                    channel_account.last_history_id = watch_response["historyId"]
                    channel_account.save(update_fields=["last_history_id"])
            except Exception:
                # Silent fail: watch can be retried later
                pass

            return JsonResponse({"email": identifier, "inbox_id": str(inbox.id)})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

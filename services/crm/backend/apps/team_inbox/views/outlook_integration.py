import json, traceback, requests
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django_tenants.utils import schema_context
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from ..models import Inbox, ChannelAccount
from ...core.models import TenantEmailMapping
from ..services.outlook_service import OutlookService

@api_view(["POST"])
@permission_classes([AllowAny])
def outlook_callback(request):
    """
    Handles Outlook OAuth callback:
    - Exchanges code for tokens
    - Fetches user identifier (email)
    - Creates/updates ChannelAccount and Inbox
    - Starts Outlook subscription and saves subscription_id
    """
    try:
        data = json.loads(request.body)
        code = data.get("code")
        inbox_name = data.get("inboxName")

        if not code or not inbox_name:
            return JsonResponse({"error": "Missing code or inboxName"}, status=400)

        # 1️⃣ Exchange code for tokens
        token_data = exchange_code_for_outlook_token(code)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in")

        if not access_token:
            return JsonResponse({"error": "No access_token returned"}, status=500)

        # 2️⃣ Fetch user identifier
        identifier = get_outlook_user_email(access_token)
        if not identifier:
            return JsonResponse({"error": "Could not fetch Outlook identifier"}, status=500)

        # 3️⃣ Resolve tenant
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return JsonResponse({"error": "Tenant not found"}, status=400)

        with schema_context(tenant.schema_name):
            # Save tenant-email mapping in public schema
            with schema_context("public"):
                TenantEmailMapping.objects.update_or_create(
                    email=identifier,
                    defaults={"tenant": tenant}
                )

            # Create Inbox
            inbox, created_inbox = Inbox.objects.get_or_create(name=inbox_name)

            # Create/Update ChannelAccount
            channel_account, created_account = ChannelAccount.objects.update_or_create(
                identifier=identifier,
                defaults={
                    "provider": "outlook",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_in": expires_in,
                    "token_acquired_at": timezone.now(),
                    "inbox": inbox,
                },
            )

        # 4️⃣ Start subscription
        service = OutlookService(channel_account)
        subscription = service.start_subscription(settings.OUTLOOK_WEBHOOK_URL)

        subscription_id = subscription.get("id")
        if subscription_id:
            channel_account.subscription_id = subscription_id
            channel_account.save(update_fields=["subscription_id"])

        return JsonResponse({
            "email": identifier,
            "inbox_id": str(inbox.id),
            "new_inbox": created_inbox,
            "new_channel_account": created_account,
            "subscription_id": subscription_id,
        })

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def exchange_code_for_outlook_token(code):
    print("   🔄 Requesting Outlook token from Microsoft...")
    response = requests.post("https://login.microsoftonline.com/common/oauth2/v2.0/token", data={
        "code": code,
        "client_id": settings.OUTLOOK_CLIENT_ID,
        "client_secret": settings.OUTLOOK_CLIENT_SECRET,
        "redirect_uri": settings.OUTLOOK_REDIRECT_URI,
        "grant_type": "authorization_code",
    })
    print("   🌐 Token request status:", response.status_code)
    response.raise_for_status()
    return response.json()


def get_outlook_user_email(access_token):
    print("   📡 Fetching user profile from Microsoft Graph...")
    response = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    print("   🌐 Profile request status:", response.status_code)
    response.raise_for_status()
    profile = response.json()
    print("   📄 Profile data:", profile)
    return profile.get("mail") or profile.get("userPrincipalName")

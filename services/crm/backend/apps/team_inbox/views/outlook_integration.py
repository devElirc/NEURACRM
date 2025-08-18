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
    Exchange code for tokens, create/update ChannelAccount, create Inbox,
    start Outlook subscription, and save subscription_id.
    """
    try:
        print("📩 [Outlook Callback] Incoming request")
        data = json.loads(request.body)
        print("   🔹 Request Data:", data)

        code = data.get("code")
        inbox_name = data.get("inboxName")

        if not code or not inbox_name:
            print("❌ Missing code or inboxName")
            return JsonResponse({"error": "Missing code or inboxName"}, status=400)

        # 1️⃣ Exchange code for tokens
        print("🔑 Exchanging code for Outlook tokens...")
        token_data = exchange_code_for_outlook_token(code)
        print("   ✅ Token response:", token_data)

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in")

        if not access_token:
            print("❌ No access_token returned")
            return JsonResponse({"error": "No access_token returned"}, status=500)

        # 2️⃣ Get user email / identifier
        print("📧 Fetching Outlook user profile...")
        identifier = get_outlook_user_email(access_token)
        print("   ✅ Outlook Identifier:", identifier)

        if not identifier:
            print("❌ Could not fetch identifier")
            return JsonResponse({"error": "Could not fetch identifier"}, status=500)

        # 3️⃣ Resolve tenant
        tenant = getattr(request, "tenant", None)
        if not tenant:
            print("❌ Tenant not found")
            return JsonResponse({"error": "Tenant not found"}, status=400)

        print(f"🏢 Using tenant: {tenant.schema_name}")

        with schema_context(tenant.schema_name):
            # Save mapping in public schema
            with schema_context("public"):
                TenantEmailMapping.objects.update_or_create(
                    email=identifier,
                    defaults={"tenant": tenant}
                )
                print("   ✅ TenantEmailMapping updated")

            # Create inbox
            inbox, created_inbox = Inbox.objects.get_or_create(name=inbox_name)
            print(f"   📥 Inbox: {inbox_name} (created={created_inbox})")

            # Create / update channel account
            channel_account, created_account = ChannelAccount.objects.update_or_create(
                identifier=identifier,
                defaults=dict(
                    provider="outlook",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_in=expires_in,
                    token_acquired_at=timezone.now(),
                    inbox=inbox,
                ),
            )
            print(f"   👤 ChannelAccount: {identifier} (created={created_account})")

        # 4️⃣ Start subscription and save subscription_id
        print("🔔 Starting Outlook subscription...")
        service = OutlookService(channel_account)
        webhook_url = settings.OUTLOOK_WEBHOOK_URL
        print("   🌐 Webhook URL:", webhook_url)

        subscription = service.start_subscription(webhook_url)
        print("   ✅ Subscription response:", subscription)

        subscription_id = subscription.get("id")
        if subscription_id:
            channel_account.subscription_id = subscription_id
            channel_account.save(update_fields=["subscription_id"])
            print("   ✅ Subscription ID saved:", subscription_id)
        else:
            print("⚠️ Subscription created but no subscription_id returned")

        return JsonResponse({
            "email": identifier,
            "inbox_id": str(inbox.id),
            "new_inbox": created_inbox,
            "new_channel_account": created_account,
            "subscription_id": subscription_id
        })

    except Exception as e:
        print("❌ Exception in outlook_callback:", str(e))
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

import json
import requests
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django_tenants.utils import schema_context
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ..models import Inbox, ChannelAccount
from ...core.models import TenantEmailMapping


@api_view(["POST"])
@permission_classes([AllowAny])
# def outlook_callback(request):
#     try:
#         print("🔔 Received Outlook callback request")

#         data = json.loads(request.body)
#         print("📩 Request body:", data)

#         code, inboxName = data.get("code"), data.get("inboxName")
#         if not code or not inboxName:
#             print("⚠️ Missing code or inboxName")
#             return JsonResponse({"error": "Missing code or inboxName"}, status=400)

#         # Step 1: Exchange code for tokens
#         print("🔑 Exchanging code for Outlook token...")
#         token_data = exchange_code_for_outlook_token(code)
#         print("✅ Token response:", token_data)

#         access_token = token_data.get("access_token")
#         refresh_token = token_data.get("refresh_token")

#         if not access_token:
#             print("❌ No access_token returned from Microsoft")
#             return JsonResponse({"error": "No access_token returned"}, status=500)

#         # Step 2: Get user email from Microsoft Graph
#         print("📡 Fetching Outlook user email...")
#         email = get_outlook_user_email(access_token)
#         print("✅ Outlook email resolved:", email)

#         if not email:
#             print("❌ Failed to resolve Outlook email from Graph API")
#             return JsonResponse({"error": "Could not fetch email"}, status=500)

#         # Step 3: Resolve tenant schema
#         tenant = request.tenant
#         tenant_schema = tenant.schema_name
#         print("🏢 Current tenant schema:", tenant_schema)

#         with schema_context(tenant_schema):
#             # Ensure mapping in public schema
#             print("🌍 Creating/Updating TenantEmailMapping in public schema...")
#             with schema_context("public"):
#                 TenantEmailMapping.objects.update_or_create(
#                     email=email, defaults={"tenant": tenant}
#                 )
#                 print("✅ Email mapping saved in public schema")

#             # Create/update inbox
#             inbox, created_inbox = Inbox.objects.get_or_create(
#                 email=email,
#                 defaults={"name": inboxName}
#             )
#             print("📥 Inbox:", inbox, "created:", created_inbox)

#             # Create/update channel account
#             channel_account, created_account = ChannelAccount.objects.update_or_create(
#                 email=email,
#                 defaults=dict(
#                     provider="outlook",
#                     access_token=access_token,
#                     refresh_token=refresh_token,
#                     expires_in=token_data.get("expires_in"),
#                     token_acquired_at=timezone.now(),
#                     inbox=inbox,
#                 ),
#             )
#             print("🔗 ChannelAccount:", channel_account, "created:", created_account)

#             return JsonResponse({
#                 "email": email,
#                 "inbox_id": str(inbox.id),
#                 "new_inbox": created_inbox,
#                 "new_channel_account": created_account
#             })

#     except Exception as e:
#         print("❌ Exception in outlook_callback:", str(e))
#         return JsonResponse({"error": str(e)}, status=500)

def outlook_callback(request):
    try:
        print("🔔 Received Outlook callback request")

        data = json.loads(request.body)
        print("📩 Request body:", data)

        code, inboxName = data.get("code"), data.get("inboxName")
        if not code or not inboxName:
            print("⚠️ Missing code or inboxName")
            return JsonResponse({"error": "Missing code or inboxName"}, status=400)

        # Step 1: Exchange code for tokens
        print("🔑 Exchanging code for Outlook token...")
        token_data = exchange_code_for_outlook_token(code)
        print("✅ Token response:", token_data)

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in")

        if not access_token:
            print("❌ No access_token returned from Microsoft")
            return JsonResponse({"error": "No access_token returned"}, status=500)

        # Step 2: Get user identifier (email or other ID)
        print("📡 Fetching Outlook user identifier...")
        identifier = get_outlook_user_email(access_token)  # could be email or unique ID
        print("✅ Outlook identifier resolved:", identifier)

        if not identifier:
            print("❌ Failed to resolve Outlook identifier")
            return JsonResponse({"error": "Could not fetch identifier"}, status=500)

        # Step 3: Resolve tenant schema
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return JsonResponse({"error": "Tenant not found"}, status=400)
        tenant_schema = tenant.schema_name
        print("🏢 Current tenant schema:", tenant_schema)

        with schema_context(tenant_schema):
            # Ensure mapping in public schema
            print("🌍 Creating/Updating TenantEmailMapping in public schema...")
            with schema_context("public"):
                TenantEmailMapping.objects.update_or_create(
                    email=identifier, defaults={"tenant": tenant}
                )
                print("✅ Mapping saved in public schema")

            # Create/update inbox
            inbox, created_inbox = Inbox.objects.get_or_create(
                name=inboxName
            )
            print("📥 Inbox:", inbox, "created:", created_inbox)

            # Create/update channel account
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
            print("🔗 ChannelAccount:", channel_account, "created:", created_account)

            return JsonResponse({
                "email": identifier,
                "inbox_id": str(inbox.id),
                "new_inbox": created_inbox,
                "new_channel_account": created_account
            })

    except Exception as e:
        print("❌ Exception in outlook_callback:", str(e))
        return JsonResponse({"error": str(e)}, status=500)

def exchange_code_for_outlook_token(code):
    print("➡️ Sending request to Microsoft for token exchange...")
    response = requests.post("https://login.microsoftonline.com/common/oauth2/v2.0/token", data={
        "code": code,
        "client_id": settings.OUTLOOK_CLIENT_ID,
        "client_secret": settings.OUTLOOK_CLIENT_SECRET,
        "redirect_uri": settings.OUTLOOK_REDIRECT_URI,
        "grant_type": "authorization_code",
    })
    print("⬅️ Response status:", response.status_code)
    print("⬅️ Response body:", response.text)
    response.raise_for_status()
    return response.json()


def get_outlook_user_email(access_token):
    print("➡️ Calling Microsoft Graph API /me endpoint...")
    response = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    print("⬅️ Graph API status:", response.status_code)
    print("⬅️ Graph API body:", response.text)
    response.raise_for_status()
    profile = response.json()
    return profile.get("mail") or profile.get("userPrincipalName")

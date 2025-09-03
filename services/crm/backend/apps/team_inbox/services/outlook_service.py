from datetime import datetime, timedelta
import requests
from django.conf import settings


class OutlookService:
    """Service wrapper around Microsoft Graph API for subscriptions and messages."""

    def __init__(self, channel_account):
        self.channel_account = channel_account
        self.token = channel_account.access_token
        self.base_url = "https://graph.microsoft.com/v1.0"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def start_subscription(self, webhook_url):
        """
        Create a Microsoft Graph subscription for new messages in the Inbox.
        Saves subscriptionId in ChannelAccount.
        """
        url = f"{self.base_url}/subscriptions"
        expiration = (
            datetime.utcnow() + timedelta(hours=1)
        ).replace(microsecond=0).isoformat() + "Z"

        data = {
            "changeType": "created",
            "notificationUrl": webhook_url,  # must be publicly accessible
            "resource": "/me/mailFolders('inbox')/messages",
            "expirationDateTime": expiration,
            "clientState": "secretRandomString"
        }

        response = requests.post(url, headers=self._headers(), json=data)
        response.raise_for_status()
        sub = response.json()

        # Save subscriptionId to channel account
        self.channel_account.subscription_id = sub.get("id")
        self.channel_account.save(update_fields=["subscription_id"])

        return sub

    def get_message(self, message_id):
        """
        Fetch a full Outlook message by its ID.
        """
        url = f"{self.base_url}/me/messages/{message_id}"
        try:
            response = requests.get(url, headers=self._headers())
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

    def fetch_recent_messages(self, max_results=10):
        """
        Fetch recent messages from Inbox (fallback if webhook/history fails).
        """
        url = (
            f"{self.base_url}/me/mailFolders/inbox/messages"
            f"?$top={max_results}&$orderby=receivedDateTime DESC"
        )
        try:
            response = requests.get(url, headers=self._headers())
            response.raise_for_status()
            return response.json().get("value", [])
        except Exception:
            return []

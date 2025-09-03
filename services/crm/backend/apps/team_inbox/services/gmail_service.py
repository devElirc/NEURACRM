import requests
from django.conf import settings
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


class GmailService:
    """Service wrapper around Gmail API for watch and message fetching."""

    def __init__(self, channel_account):
        self.channel_account = channel_account
        self.credentials = Credentials(
            token=channel_account.access_token,
            refresh_token=channel_account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )

        # Refresh token if expired
        if not self.credentials.valid and self.credentials.refresh_token:
            self.credentials.refresh(requests.Request())
            #  update channel_account with new access_token if you store tokens in DB
            channel_account.access_token = self.credentials.token
            channel_account.save(update_fields=["access_token"])

        self.service = build("gmail", "v1", credentials=self.credentials)

    def start_watch(self):
        """Start Gmail push notifications (Pub/Sub watch)."""
        url = "https://gmail.googleapis.com/gmail/v1/users/me/watch"
        headers = {
            "Authorization": f"Bearer {self.credentials.token}",
            "Content-Type": "application/json",
        }
        payload = {
            "labelIds": ["INBOX"],
            "topicName": "projects/team-inbox-project/topics/inbox-notify",
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    def fetch_new_emails(self, history_id):
        """Fetch new emails using Gmail history API.  
        Falls back to recent unread messages if history is expired/missing.
        """
        full_messages = []
        page_token = None

        try:
            while True:
                history = (
                    self.service.users()
                    .history()
                    .list(
                        userId="me",
                        startHistoryId=history_id,
                        historyTypes=["messageAdded"],
                        pageToken=page_token,
                    )
                    .execute()
                )

                if not history.get("history"):
                    return self.fetch_recent_messages(), None

                for record in history.get("history", []):
                    for msg in record.get("messages", []):
                        msg_id = msg.get("id")
                        if msg_id:
                            msg_data = self._safe_fetch_message(msg_id)
                            if msg_data:
                                full_messages.append(msg_data)

                page_token = history.get("nextPageToken")
                if not page_token:
                    break

            return full_messages, history.get("historyId")

        except Exception:
            return self.fetch_recent_messages(), None

    def fetch_recent_messages(self, max_results=10):
        """Fetch recent unread messages from the INBOX."""
        full_messages = []
        try:
            response = (
                self.service.users()
                .messages()
                .list(userId="me", maxResults=max_results, labelIds=["INBOX"], q="is:unread")
                .execute()
            )

            for msg in response.get("messages", []):
                msg_id = msg.get("id")
                if msg_id:
                    msg_data = self._safe_fetch_message(msg_id)
                    if msg_data:
                        full_messages.append(msg_data)

            return full_messages

        except Exception:
            return []

    def _safe_fetch_message(self, msg_id):
        """Safely fetch a single Gmail message."""
        try:
            return (
                self.service.users()
                .messages()
                .get(userId="me", id=msg_id, format="full")
                .execute()
            )
        except Exception:
            return None

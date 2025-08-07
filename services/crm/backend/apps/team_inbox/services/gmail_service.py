# services/gmail_service.py
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import requests
import json
from django.conf import settings
from django.utils import timezone
from datetime import datetime

class GmailService:
    def __init__(self, channel_account):
        self.channel_account = channel_account
        self.credentials = Credentials(
            token=channel_account.access_token,
            refresh_token=channel_account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET
        )
        self.service = build('gmail', 'v1', credentials=self.credentials)

    def start_watch(self):
        url = "https://gmail.googleapis.com/gmail/v1/users/me/watch"
        headers = {
            "Authorization": f"Bearer {self.channel_account.access_token}",
            "Content-Type": "application/json"
        }
        data = {
            "labelIds": ["INBOX"],
            "topicName": "projects/teaminboxproject/topics/gmail-inbox-events"
        }

        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()

    # def fetch_new_emails(self, history_id):
    #     full_messages = []
    #     page_token = None

    #     try:
    #         while True:
    #             history = self.service.users().history().list(
    #                 userId='me',
    #                 startHistoryId=history_id,
    #                 historyTypes=['messageAdded'],
    #                 pageToken=page_token
    #             ).execute()

    #             print("🔁 Raw Gmail history result:", json.dumps(history, indent=2))

    #             # If no history found, fallback to fetching recent messages
    #             if not history.get('history'):
    #                 print("⚠️ No history found, falling back to recent inbox fetch.")
    #                 return self.fetch_recent_messages()

    #             for record in history.get('history', []):
    #                 for msg in record.get('messages', []):
    #                     msg_data = self.service.users().messages().get(
    #                         userId='me',
    #                         id=msg['id'],
    #                         format='full'
    #                     ).execute()
    #                     full_messages.append(msg_data)

    #             page_token = history.get('nextPageToken')
    #             if not page_token:
    #                 break

    #         return full_messages
    #     except Exception as e:
    #         print(f"❌ Error fetching history: {e}")
    #         # Fallback to recent messages on error
    #         return self.fetch_recent_messages()

    # def fetch_recent_messages(self, max_results=10):
    #     """Fetch recent messages in inbox as a fallback."""
    #     print("📥 Fetching recent inbox messages as fallback.")
    #     full_messages = []
    #     try:
    #         messages_resp = self.service.users().messages().list(
    #             userId='me',
    #             labelIds=['INBOX'],
    #             maxResults=max_results
    #         ).execute()

    #         messages = messages_resp.get('messages', [])
    #         for msg in messages:
    #             msg_data = self.service.users().messages().get(
    #                 userId='me',
    #                 id=msg['id'],
    #                 format='full'
    #             ).execute()
    #             full_messages.append(msg_data)

    #         print(f"📬 Fetched {len(full_messages)} recent messages.")
    #         return full_messages
    #     except Exception as e:
    #         print(f"❌ Error fetching recent messages: {e}")
    #         return []

    def fetch_new_emails(self, history_id):
        full_messages = []
        page_token = None

        try:
            while True:
                history = self.service.users().history().list(
                    userId='me',
                    startHistoryId=history_id,
                    historyTypes=['messageAdded'],
                    pageToken=page_token
                ).execute()

                print(f"[{datetime.now()}] 🔁 Gmail history result:", json.dumps(history, indent=2))

                # If history is missing or expired, fallback only once
                if not history.get('history'):
                    print(f"[{datetime.now()}] ⚠️ No history found or historyId expired. Fetching recent inbox messages instead.")
                    recent_messages = self.fetch_recent_messages()
                    return recent_messages, None  # ✅ FIXED: now returns tuple

                for record in history.get('history', []):
                    for msg in record.get('messages', []):
                        msg_id = msg.get('id')
                        if msg_id:
                            msg_data = self.service.users().messages().get(
                                userId='me',
                                id=msg_id,
                                format='full'
                            ).execute()
                            full_messages.append(msg_data)

                page_token = history.get('nextPageToken')
                if not page_token:
                    break

            print(f"[{datetime.now()}] ✅ Fetched {len(full_messages)} new messages from history.")
            return full_messages, history.get('historyId')  # ✅ FIXED: returns tuple

        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error fetching history: {e}")
            recent_messages = self.fetch_recent_messages()
            return recent_messages, None  # ✅ FIXED: returns tuple

    def fetch_recent_messages(self, max_results=10):
        # Implement your method to fetch latest messages from inbox
        response = self.service.users().messages().list(
            userId='me',
            maxResults=max_results,
            labelIds=['INBOX'],
            q="is:unread"
        ).execute()

        messages = response.get('messages', [])
        full_messages = []

        for msg in messages:
            msg_id = msg.get('id')
            if msg_id:
                msg_data = self.service.users().messages().get(
                    userId='me',
                    id=msg_id,
                    format='full'
                ).execute()
                full_messages.append(msg_data)

        print(f"[{datetime.now()}] ✅ Fetched {len(full_messages)} recent inbox messages.")
        return full_messages


    
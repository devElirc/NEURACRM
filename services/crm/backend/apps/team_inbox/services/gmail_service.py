from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import requests
import json
from django.conf import settings
from django.utils import timezone
from datetime import datetime
import traceback


import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

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


    def fetch_new_emails(self, history_id):
        full_messages = []
        page_token = None

        print(f"\n[{datetime.now()}] 🚀 Starting fetch_new_emails with history_id={history_id}")

        try:
            while True:
                print(f"[{datetime.now()}] 🔍 Requesting Gmail history (page_token={page_token})...")
                history = self.service.users().history().list(
                    userId='me',
                    startHistoryId=history_id,
                    # historyTypes=['messageAdded'],
                    pageToken=page_token
                ).execute()

                print(f"[{datetime.now()}] 📦 Raw Gmail history response:")
                print(json.dumps(history, indent=2))

                # If history is missing or expired, fallback only once
                if not history.get('history'):
                    print(f"[{datetime.now()}] ⚠️ No history found or historyId expired. Fetching recent inbox messages instead.")
                    recent_messages = self.fetch_recent_messages()
                    return recent_messages, None

                for record in history.get('history', []):
                    print(f"[{datetime.now()}] 📝 Processing history record with keys: {list(record.keys())}")
                    for msg in record.get('messages', []):
                        msg_id = msg.get('id')
                        print(f"[{datetime.now()}] 📩 Found new message ID: {msg_id}")
                        if msg_id:
                            try:
                                msg_data = self.service.users().messages().get(
                                    userId='me',
                                    id=msg_id,
                                    format='full'
                                ).execute()
                                print(f"[{datetime.now()}] ✅ Successfully fetched message {msg_id}")
                                full_messages.append(msg_data)
                            except Exception as e:
                                print(f"[{datetime.now()}] ❌ Failed to fetch message {msg_id}: {e}")
                                traceback.print_exc()

                page_token = history.get('nextPageToken')
                if not page_token:
                    print(f"[{datetime.now()}] 📭 No more pages in Gmail history.")
                    break

            print(f"[{datetime.now()}] 🎯 Total new messages fetched: {len(full_messages)}")
            return full_messages, history.get('historyId')

        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error fetching history: {e}")
            traceback.print_exc()
            recent_messages = self.fetch_recent_messages()
            return recent_messages, None


    def fetch_recent_messages(self, max_results=10):
        print(f"\n[{datetime.now()}] 📥 Fetching recent messages from INBOX (max={max_results})...")
        try:
            response = self.service.users().messages().list(
                userId='me',
                maxResults=max_results,
                labelIds=['INBOX'],
                q="is:unread"
            ).execute()

            print(f"[{datetime.now()}] 📦 Raw Gmail list response:")
            print(json.dumps(response, indent=2))

            messages = response.get('messages', [])
            full_messages = []

            for msg in messages:
                msg_id = msg.get('id')
                print(f"[{datetime.now()}] 📩 Fetching details for recent message ID: {msg_id}")
                if msg_id:
                    try:
                        msg_data = self.service.users().messages().get(
                            userId='me',
                            id=msg_id,
                            format='full'
                        ).execute()
                        print(f"[{datetime.now()}] ✅ Successfully fetched recent message {msg_id}")
                        full_messages.append(msg_data)
                    except Exception as e:
                        print(f"[{datetime.now()}] ❌ Failed to fetch recent message {msg_id}: {e}")
                        traceback.print_exc()

            print(f"[{datetime.now()}] 🎯 Total recent messages fetched: {len(full_messages)}")
            return full_messages

        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error fetching recent messages: {e}")
            traceback.print_exc()
            return []

    
# from datetime import datetime, timedelta
# import json, requests, traceback

# class OutlookService:
#     def __init__(self, channel_account):
#         self.channel_account = channel_account
#         self.token = channel_account.access_token
#         self.base_url = "https://graph.microsoft.com/v1.0"

#     def _headers(self):
#         return {
#             "Authorization": f"Bearer {self.token}",
#             "Content-Type": "application/json"
#         }


#     # def start_subscription(self, webhook_url):
#     #     """
#     #     Create a Microsoft Graph subscription for new messages.
#     #     Save subscriptionId in ChannelAccount.
#     #     """
#     #     url = f"{self.base_url}/subscriptions"
#     #     expiration = (datetime.utcnow() + timedelta(hours=1)).replace(microsecond=0).isoformat() + "Z"

#     #     data = {
#     #         "changeType": "created",
#     #         "notificationUrl": webhook_url,
#     #         "resource": "me/messages",
#     #         "expirationDateTime": expiration,
#     #         "clientState": "secretRandomString"
#     #     }

#     #     try:
#     #         print(f"📡 Creating subscription with payload:\n{json.dumps(data, indent=2)}")
#     #         response = requests.post(url, headers=self._headers(), json=data)
#     #         print(f"🌐 Subscription request status: {response.status_code}")
#     #         print(f"📄 Response text: {response.text}")

#     #         response.raise_for_status()
#     #         sub = response.json()
#     #         print(f"[{datetime.now()}] ✅ Outlook subscription created:", json.dumps(sub, indent=2))

#     #         # Save subscriptionId
#     #         self.channel_account.subscription_id = sub.get("id")
#     #         self.channel_account.save(update_fields=["subscription_id"])
#     #         print(f"🔖 Saved subscriptionId {sub.get('id')} for channel {self.channel_account.identifier}")

#     #         return sub
#     #     except Exception as e:
#     #         print(f"[{datetime.now()}] ❌ Failed to create subscription: {e}")
#     #         traceback.print_exc()
#     #         raise

#     def start_subscription(self, webhook_url):
#         """
#         Create Microsoft Graph subscription for new messages.
#         Save subscriptionId in ChannelAccount.
#         """
#         url = f"{self.base_url}/subscriptions"
#         expiration = (datetime.utcnow() + timedelta(hours=1)).replace(microsecond=0).isoformat() + "Z"

#         data = {
#             "changeType": "created",
#             "notificationUrl": webhook_url,  # Must be public and reachable
#             "resource": "/me/mailFolders('inbox')/messages",
#             "expirationDateTime": expiration,
#             "clientState": "secretRandomString"
#         }

#         try:
#             print(f"📡 Creating subscription with payload:\n{json.dumps(data, indent=2)}")
#             response = requests.post(url, headers=self._headers(), json=data)

#             print(f"🌐 Subscription request status: {response.status_code}")
#             print(f"📄 Response text: {response.text}")

#             response.raise_for_status()
#             sub = response.json()

#             # Save subscriptionId
#             self.channel_account.subscription_id = sub.get("id")
#             self.channel_account.save(update_fields=["subscription_id"])
#             print(f"✅ Subscription created and saved: {sub.get('id')}")

#             return sub

#         except Exception as e:
#             print(f"❌ Failed to create subscription: {e}")
#             traceback.print_exc()
#             raise

#     def get_message(self, message_id):
#         """
#         Fetch full Outlook message by ID.
#         """
#         url = f"{self.base_url}/me/messages/{message_id}"
#         try:
#             response = requests.get(url, headers=self._headers())
#             response.raise_for_status()
#             msg = response.json()
#             return msg
#         except Exception as e:
#             print(f"[{datetime.now()}] ❌ Error fetching Outlook message {message_id}: {e}")
#             traceback.print_exc()
#             return None

#     def fetch_recent_messages(self, max_results=10):
#         """
#         Fallback to fetch recent messages.
#         """
#         url = f"{self.base_url}/me/mailFolders/inbox/messages?$top={max_results}&$orderby=receivedDateTime DESC"
#         try:
#             response = requests.get(url, headers=self._headers())
#             response.raise_for_status()
#             data = response.json()
#             return data.get("value", [])
#         except Exception as e:
#             print(f"[{datetime.now()}] ❌ Error fetching recent messages: {e}")
#             traceback.print_exc()
#             return []



from datetime import datetime, timedelta
import json, requests, traceback

class OutlookService:
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
        Create Microsoft Graph subscription for new messages.
        Save subscriptionId in ChannelAccount.
        """
        url = f"{self.base_url}/subscriptions"
        expiration = (datetime.utcnow() + timedelta(hours=1)).replace(microsecond=0).isoformat() + "Z"

        data = {
            "changeType": "created",
            "notificationUrl": webhook_url,  # must be public
            "resource": "/me/mailFolders('inbox')/messages",
            "expirationDateTime": expiration,
            "clientState": "secretRandomString"
        }

        try:
            print(f"📡 Creating subscription with payload:\n{json.dumps(data, indent=2)}")
            response = requests.post(url, headers=self._headers(), json=data)
            print(f"🌐 Subscription request status: {response.status_code}")
            print(f"📄 Response text: {response.text}")

            response.raise_for_status()
            sub = response.json()

            # Save subscriptionId to channel
            self.channel_account.subscription_id = sub.get("id")
            self.channel_account.save(update_fields=["subscription_id"])
            print(f"✅ Subscription created and saved: {sub.get('id')}")

            return sub

        except Exception as e:
            print(f"[{datetime.now()}] ❌ Failed to create subscription: {e}")
            traceback.print_exc()
            raise

    def get_message(self, message_id):
        """
        Fetch full Outlook message by ID.
        """
        url = f"{self.base_url}/me/messages/{message_id}"
        try:
            response = requests.get(url, headers=self._headers())
            response.raise_for_status()
            msg = response.json()
            print(f"📬 Fetched message {message_id}: {msg.get('subject')}")
            return msg
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error fetching Outlook message {message_id}: {e}")
            traceback.print_exc()
            return None

    def fetch_recent_messages(self, max_results=10):
        """
        Fallback: fetch recent messages from Inbox.
        """
        url = f"{self.base_url}/me/mailFolders/inbox/messages?$top={max_results}&$orderby=receivedDateTime DESC"
        try:
            response = requests.get(url, headers=self._headers())
            response.raise_for_status()
            data = response.json()
            messages = data.get("value", [])
            print(f"📥 Fetched {len(messages)} recent messages")
            return messages
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error fetching recent messages: {e}")
            traceback.print_exc()
            return []

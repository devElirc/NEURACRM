import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs


class InboxConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Extract tenant ID and optional user_id from query string
            query_string = self.scope.get("query_string", b"").decode()
            query_params = parse_qs(query_string)
            tenant_id = query_params.get("tenant", [None])[0]
            user_id = query_params.get("user_id", [None])[0]

            # Tenant group
            self.group_name = f"tenant_{tenant_id}" if tenant_id else "tenant_default"
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            # Optional per-user group
            self.user_group_name = None
            if user_id:
                self.user_group_name = f"user_{user_id}"
                await self.channel_layer.group_add(self.user_group_name, self.channel_name)

            await self.accept()

            # Send system acknowledgment
            await self.send(text_data=json.dumps({
                "type": "system",
                "message": f"Connected to tenant group: {self.group_name}, user_group: {self.user_group_name}"
            }))
        except Exception as e:
            await self.close()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            if self.user_group_name:
                await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        except Exception:
            pass

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
            message = data.get("message", "")
            # Broadcast to tenant group
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat_message",
                    "message": f"Echo: {message}"
                }
            )
        except Exception:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid message format"
            }))

    # Generic chat message handler
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))

    # Inbox events
    async def inbox_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "inbox_message",
            "message": event["message"]
        }))

    async def new_conversation(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_conversation",
            "message": {
                "conversation": event["message"]["conversation"]
            }
        }))

    async def new_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_message",
            "message": event["message"]
        }))

    # Notification handler for per-user or broadcast notifications
    async def notification_message(self, event):

        await self.send(text_data=json.dumps({
            "type": "notification",
            "data": event["data"]
        }))

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs

class InboxConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            print("🔌 WebSocket connect called")

            # Extract tenant ID from query string
            query_string = self.scope.get("query_string", b"").decode()
            query_params = parse_qs(query_string)
            tenant_id = query_params.get("tenant", [None])[0]

            print(f"🔌 WebSocket connect called — Tenant ID: {tenant_id}")

            if tenant_id:
                self.group_name = f"tenant_{tenant_id}"
            else:
                self.group_name = "tenant_default"

            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

            print(f"✅ WebSocket connected. Joined group: {self.group_name}")
            await self.send(text_data=json.dumps({
                "type": "system",
                "message": f"🔔 Connected to tenant WebSocket group: {self.group_name}"
            }))
        except Exception as e:
            print(f"❌ Error in connect(): {e}")
            await self.close()

    async def disconnect(self, close_code):
        print(f"🔌 WebSocket disconnected with code: {close_code}")
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception as e:
            print(f"❌ Error in disconnect(): {e}")

    async def receive(self, text_data=None, bytes_data=None):
        print(f"📥 WebSocket received: {text_data}")
        try:
            data = json.loads(text_data)
            message = data.get("message", "")
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat_message",
                    "message": f"Echo: {message}"
                }
            )
        except Exception as e:
            print(f"❌ Error in receive(): {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid message format"
            }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))

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

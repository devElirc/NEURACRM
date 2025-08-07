# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from django_tenants.utils import tenant_context
# from apps.team_inbox.models import Message  # absolute import

# class InboxConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.tenant = self.scope.get('tenant')

#         if not self.tenant:
#             await self.close(code=4001)
#             return

#         self.group_name = f"inbox_{self.tenant.id}"
#         await self.channel_layer.group_add(self.group_name, self.channel_name)
#         await self.accept()
#         print(f"✅ WebSocket connected to group: {self.group_name}")



#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#             message_id = data.get("message_id")

#             if not message_id:
#                 await self.send(json.dumps({"error": "message_id required"}))
#                 return

#             with tenant_context(self.tenant):
#                 message = Message.objects.get(id=message_id)

#             await self.channel_layer.group_send(
#                 self.group_name,
#                 {
#                     "type": "inbox_message",
#                     "message": {
#                         "id": message.id,
#                         "subject": message.subject,
#                         "sender": message.sender,
#                         "body": message.body[:100]  # Preview body
#                     }
#                 }
#             )
#         except Message.DoesNotExist:
#             await self.send(json.dumps({"error": "Message not found"}))
#         except Exception as e:
#             await self.send(json.dumps({"error": str(e)}))

#     async def inbox_message(self, event):
#         print(f"❌ WebSocket disconnected from group: ")
#         print(f"❌ WebSocket disconnected from group: {self.group_name}")
        
#         await self.send(text_data=json.dumps(event["message"]))



# team_inbox/consumers.py
# import json
# from channels.generic.websocket import AsyncWebsocketConsumer

# class InboxConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         print("WebSocket connect called")
#         try:
#             await self.accept()
#             print("WebSocket accepted")
#         except Exception as e:
#             print(f"Exception in connect: {e}")

#     async def disconnect(self, close_code):
#         print(f"WebSocket disconnected with code {close_code}")

#     async def receive(self, text_data=None, bytes_data=None):
#         print(f"Received data: {text_data}")
#         try:
#             # Your processing here
#             pass
#         except Exception as e:
#             print(f"Exception in receive: {e}")


# import json
# from channels.generic.websocket import AsyncWebsocketConsumer

# class InboxConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         print("WebSocket connect called")

#         # Create a group for broadcasting
#         self.group_name = "inbox_2"

#         # Add the client to the group
#         await self.channel_layer.group_add(self.group_name, self.channel_name)
#         await self.accept()
#         print("WebSocket accepted")

#         # Send a test message immediately after connecting
#         await self.send(text_data=json.dumps({
#             "message": "🔔 Connected to WebSocket backend!"
#         }))

#     async def disconnect(self, close_code):
#         print(f"WebSocket disconnected with code {close_code}")
#         # Remove the client from the group
#         await self.channel_layer.group_discard(self.group_name, self.channel_name)

#     async def receive(self, text_data=None, bytes_data=None):
#         print(f"Received data: {text_data}")

#         try:
#             data = json.loads(text_data)
#             message = data.get("message", "")

#             # Echo the message back to all connected clients
#             await self.channel_layer.group_send(
#                 self.group_name,
#                 {
#                     "type": "chat_message",
#                     "message": f"Echo: {message}"
#                 }
#             )
#         except Exception as e:
#             print(f"Exception in receive: {e}")

#     async def chat_message(self, event):
#         """Send the message to the client"""
#         await self.send(text_data=json.dumps({
#             "message": event["message"]
#         }))

#     async def inbox_message(self, event):
#         print(f"❌ WebSocket disconnected from group: ")
#         print(f"❌ WebSocket disconnected from group: {self.group_name}")
        
#         await self.send(text_data=json.dumps(event["message"]))

import json
from channels.generic.websocket import AsyncWebsocketConsumer

# class InboxConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         print("WebSocket connect called")

#         # Get tenant info (customize to your auth/tenant setup)
#         tenant = self.scope.get('tenant')
#         if tenant:
#             self.group_name = f"inbox_{tenant.id}"
#         else:
#             # fallback to some default or reject connection
#             self.group_name = "inbox_default"

#         # Add the client to the group
#         await self.channel_layer.group_add(self.group_name, self.channel_name)
#         await self.accept()
#         print(f"WebSocket accepted and joined group {self.group_name}")

#         await self.send(text_data=json.dumps({
#             "message": f"🔔 Connected to WebSocket backend in group {self.group_name}!"
#         }))

#     async def disconnect(self, close_code):
#         print(f"WebSocket disconnected with code {close_code}")
#         await self.channel_layer.group_discard(self.group_name, self.channel_name)

#     async def receive(self, text_data=None, bytes_data=None):
#         print(f"Received data: {text_data}")

#         try:
#             data = json.loads(text_data)
#             message = data.get("message", "")

#             await self.channel_layer.group_send(
#                 self.group_name,
#                 {
#                     "type": "chat_message",
#                     "message": f"Echo: {message}"
#                 }
#             )
#         except Exception as e:
#             print(f"Exception in receive: {e}")

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "message": event["message"]
#         }))


class InboxConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("🔌 WebSocket connect called")

        # Get tenant info (customize if needed)
        tenant = self.scope.get("tenant")
        inbox_id = self.scope["url_route"]["kwargs"].get("inbox_id") if "url_route" in self.scope else None

        if tenant and inbox_id:
            self.group_name = f"inbox_{inbox_id}"
        elif tenant:
            self.group_name = f"inbox_{tenant.id}"
        else:
            self.group_name = "inbox_default"

        # Join group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        print(f"✅ WebSocket connected. Joined group: {self.group_name}")

        await self.send(text_data=json.dumps({
            "message": f"🔔 Connected to inbox WebSocket group: {self.group_name}"
        }))

    async def disconnect(self, close_code):
        print(f"🔌 WebSocket disconnected: {close_code}")
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        print(f"📥 WebSocket received: {text_data}")

        try:
            data = json.loads(text_data)
            message = data.get("message", "")

            # Echo message to the group (can be removed in production)
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
                "error": "Invalid message format"
            }))

    async def chat_message(self, event):
        """Handles generic chat-style messages from the backend."""
        await self.send(text_data=json.dumps({
            "message": event["message"]
        }))

    # async def new_conversation(self, event):
    #     await self.send(text_data=json.dumps({
    #         'type': 'new_conversation',
    #         'conversation': event['message']['conversation']
    #     }))

    # async def new_message(self, event):
    #     await self.send(text_data=json.dumps({
    #         'type': 'new_message',
    #         'message': event['message']
    #     }))
    async def new_conversation(self, event):
        print("🔔 new_conversation called with event:", event)
        await self.send(text_data=json.dumps({
            'type': 'new_conversation',
            'conversation': event['message']['conversation']
        }))
        print("✅ new_conversation message sent")

    async def new_message(self, event):
        print("🔔 new_message called with event:", event)
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
        print("✅ new_message message sent")
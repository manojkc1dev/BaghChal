import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        # Join room group in Redis channel layer
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial connected event to client
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to room: {self.room_name}',
            'room': self.room_name,
        }))

    async def disconnect(self, close_code):
        # Leave room group in Redis channel layer
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket client
    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data) if text_data else {}
            message_type = data.get('action', 'message')

            # Broadcast message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_message',
                    'action': message_type,
                    'payload': data,
                    'sender_channel': self.channel_name,
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    # Receive message from room group and broadcast to WebSocket client
    async def game_message(self, event):
        action = event.get('action')
        payload = event.get('payload')
        sender_channel = event.get('sender_channel')

        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'action': action,
            'payload': payload,
            'is_self': sender_channel == self.channel_name,
        }))

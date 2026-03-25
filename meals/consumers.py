import json
from channels.generic.websocket import AsyncWebsocketConsumer

ORDERS_GROUP = 'orders_room'


class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(ORDERS_GROUP, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(ORDERS_GROUP, self.channel_name)

    # Receive a group message sent by the signal and forward it to the WebSocket client
    async def new_order(self, event):
        await self.send(text_data=json.dumps({
            'type':  'new_order',
            'order': event['order'],
        }))

    # Receive a group message when an order status changes
    async def order_updated(self, event):
        await self.send(text_data=json.dumps({
            'type':  'order_updated',
            'order': event['order'],
        }))

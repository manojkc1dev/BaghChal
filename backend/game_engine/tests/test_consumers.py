from django.test import TestCase
from channels.testing import WebsocketCommunicator
from game_engine.consumers import GameConsumer

class GameConsumerTest(TestCase):
    async def test_connect_and_init_state(self):
        communicator = WebsocketCommunicator(GameConsumer.as_asgi(), "ws/game/test_room/")
        communicator.scope['url_route'] = {'kwargs': {'room_name': 'test_room'}}
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # First message should be INIT_STATE
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'INIT_STATE')
        self.assertIn('state', response)
        self.assertEqual(response['state']['game_phase'], 'PLACEMENT')
        self.assertEqual(response['state']['current_turn'], 'SHEEP')

        await communicator.disconnect()

    async def test_make_move_action(self):
        communicator = WebsocketCommunicator(GameConsumer.as_asgi(), "ws/game/test_room_2/")
        communicator.scope['url_route'] = {'kwargs': {'room_name': 'test_room_2'}}
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from() # Consume INIT_STATE

        # Send MAKE_MOVE action (place sheep at node 12)
        await communicator.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {'type': 'PLACE', 'from': None, 'to': 12}
        })

        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'STATE_UPDATE')
        self.assertEqual(response['event_type'], 'MOVE_EXECUTED')
        self.assertEqual(response['state']['board'][12], 'SHEEP')
        self.assertEqual(response['state']['current_turn'], 'LION')

        await communicator.disconnect()

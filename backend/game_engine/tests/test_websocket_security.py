import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from core.asgi import application
from game_engine.models import Game
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class WebSocketSecurityTest(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='sheep_player', password='Password123!')
        self.user_b = User.objects.create_user(username='lion_player', password='Password123!')
        
        token_a = RefreshToken.for_user(self.user_a).access_token
        token_b = RefreshToken.for_user(self.user_b).access_token
        
        self.token_a_str = str(token_a)
        self.token_b_str = str(token_b)

    async def test_websocket_connect_and_db_init(self):
        communicator = WebsocketCommunicator(application, "ws/game/test_room_1/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'INIT_STATE')
        self.assertEqual(response['state']['room_name'], 'test_room_1')
        self.assertEqual(response['state']['game_status'], 'IN_PROGRESS')

        await communicator.disconnect()

        # Check DB object was persisted
        game_exists = await Game.objects.filter(room_name='test_room_1').aexists()
        self.assertTrue(game_exists)

    async def test_jwt_authenticated_websocket_connection(self):
        url = f"ws/game/sec_room_1/?token={self.token_a_str}"
        communicator = WebsocketCommunicator(application, url)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'INIT_STATE')

        await communicator.disconnect()

    async def test_role_enforcement_in_online_pvp(self):
        """In Online PVP mode, Lion player cannot move when it is Sheep turn."""
        # Create game in PVP mode
        url_a = f"ws/game/pvp_sec_room/?token={self.token_a_str}"
        comm_a = WebsocketCommunicator(application, url_a)
        await comm_a.connect()
        await comm_a.receive_json_from()

        url_b = f"ws/game/pvp_sec_room/?token={self.token_b_str}"
        comm_b = WebsocketCommunicator(application, url_b)
        await comm_b.connect()
        await comm_b.receive_json_from()

        # Current turn is SHEEP. User B (Lion player) tries to place a sheep or make a move
        await comm_b.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {'type': 'PLACE', 'from': None, 'to': 12}
        })

        err_resp = await comm_b.receive_json_from()
        self.assertEqual(err_resp['type'], 'ERROR')
        self.assertIn('Not your turn', err_resp['message'])

        await comm_a.disconnect()
        await comm_b.disconnect()

    async def test_malicious_payload_rejection(self):
        """Client cannot spoof captured count or force game status."""
        comm = WebsocketCommunicator(application, "ws/game/malicious_room/")
        await comm.connect()
        await comm.receive_json_from()

        # Send malicious move with injected 'captured_sheep': 5 and 'winner': 'LION'
        await comm.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {
                'type': 'PLACE',
                'from': None,
                'to': 12,
                'captured_sheep': 5,
                'game_status': 'LIONS_WON',
                'captured_node': 0
            }
        })

        resp = await comm.receive_json_from()
        self.assertEqual(resp['type'], 'STATE_UPDATE')
        # Check server state did NOT accept spoofed captured count or status
        state = resp['state']
        self.assertEqual(state['captured_sheep'], 0)
        self.assertEqual(state['game_status'], 'IN_PROGRESS')
        self.assertEqual(state['move_number'], 1)

        await comm.disconnect()

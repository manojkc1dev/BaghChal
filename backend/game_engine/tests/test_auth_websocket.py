"""
Tests for authenticated WebSocket connections, player role assignment,
and game mode isolation (LOCAL/PVAI/PVP).
"""
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from core.asgi import application
from game_engine.models import Game
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def get_token(user):
    """Return a valid JWT access token string for the given user."""
    return str(RefreshToken.for_user(user).access_token)


class AuthenticatedWebSocketTest(TestCase):
    """Tests for JWT-authenticated WebSocket connections."""

    def setUp(self):
        self.user_a = User.objects.create_user(username='player_one', password='StrongPass123!')
        self.user_b = User.objects.create_user(username='player_two', password='StrongPass123!')
        self.token_a = get_token(self.user_a)
        self.token_b = get_token(self.user_b)

    async def test_authenticated_user_can_connect(self):
        """Valid JWT token allows WebSocket connection."""
        url = f'ws/game/auth_test_room/?token={self.token_a}'
        comm = WebsocketCommunicator(application, url)
        connected, _ = await comm.connect()
        self.assertTrue(connected)

        msg = await comm.receive_json_from()
        self.assertEqual(msg['type'], 'INIT_STATE')
        self.assertIn('my_role', msg)
        self.assertIn('username', msg)
        self.assertEqual(msg['username'], 'player_one')
        await comm.disconnect()

    async def test_anonymous_user_in_local_mode_allowed(self):
        """Anonymous WebSocket connections are allowed for LOCAL/PVAI rooms (no token required)."""
        # First create a room in LOCAL mode
        game = await Game.objects.acreate(
            room_name='local_anon_room',
            mode='LOCAL',
        )
        comm = WebsocketCommunicator(application, 'ws/game/local_anon_room/')
        connected, _ = await comm.connect()
        self.assertTrue(connected)
        msg = await comm.receive_json_from()
        self.assertEqual(msg['type'], 'INIT_STATE')
        await comm.disconnect()

    async def test_anonymous_user_in_pvp_room_rejected(self):
        """Anonymous connections to PVP rooms are rejected with AUTH_REQUIRED."""
        # Pre-create a PVP room
        await Game.objects.acreate(
            room_name='pvp_anon_reject_room',
            mode='PVP',
        )
        # Connect without token
        comm = WebsocketCommunicator(application, 'ws/game/pvp_anon_reject_room/')
        connected, _ = await comm.connect()
        self.assertTrue(connected)  # TCP connect succeeds

        msg = await comm.receive_json_from()
        self.assertEqual(msg['type'], 'AUTH_REQUIRED')
        self.assertIn('log in', msg['message'].lower())
        await comm.disconnect()

    async def test_invalid_token_treated_as_anonymous(self):
        """An invalid JWT results in AnonymousUser (middleware catches exception)."""
        url = 'ws/game/invalid_token_room/?token=this.is.not.a.valid.jwt'
        comm = WebsocketCommunicator(application, url)
        connected, _ = await comm.connect()
        self.assertTrue(connected)
        # Room will be created as PVP by default — should get AUTH_REQUIRED
        msg = await comm.receive_json_from()
        # Either AUTH_REQUIRED (PVP room) or INIT_STATE (LOCAL room) — no crash either way
        self.assertIn(msg['type'], ['INIT_STATE', 'AUTH_REQUIRED'])
        await comm.disconnect()

    async def test_init_state_contains_my_role(self):
        """INIT_STATE message includes my_role field for the connecting player."""
        url = f'ws/game/role_check_room/?token={self.token_a}'
        comm = WebsocketCommunicator(application, url)
        connected, _ = await comm.connect()
        self.assertTrue(connected)

        msg = await comm.receive_json_from()
        self.assertEqual(msg['type'], 'INIT_STATE')
        # First player gets SHEEP role (game default)
        self.assertIn(msg['my_role'], ['SHEEP', 'LION', None])
        await comm.disconnect()


class PlayerRoleAssignmentTest(TestCase):
    """Tests for correct player role assignment in PVP mode."""

    def setUp(self):
        self.user_a = User.objects.create_user(username='sheep_assign', password='Pass123!')
        self.user_b = User.objects.create_user(username='lion_assign', password='Pass123!')
        self.token_a = get_token(self.user_a)
        self.token_b = get_token(self.user_b)

    async def test_first_player_gets_sheep_role(self):
        """First player to join a new PVP room is assigned SHEEP."""
        url = f'ws/game/role_room_1/?token={self.token_a}'
        comm = WebsocketCommunicator(application, url)
        await comm.connect()

        msg = await comm.receive_json_from()
        self.assertEqual(msg['state']['player_sheep'], 'sheep_assign')
        self.assertIsNone(msg['state']['player_lion'])
        self.assertEqual(msg['my_role'], 'SHEEP')

        await comm.disconnect()

    async def test_second_player_gets_lion_role(self):
        """Second player to join gets the opposite (LION) role."""
        url_a = f'ws/game/role_room_2/?token={self.token_a}'
        comm_a = WebsocketCommunicator(application, url_a)
        await comm_a.connect()
        await comm_a.receive_json_from()

        url_b = f'ws/game/role_room_2/?token={self.token_b}'
        comm_b = WebsocketCommunicator(application, url_b)
        await comm_b.connect()

        msg_b = await comm_b.receive_json_from()
        self.assertEqual(msg_b['state']['player_lion'], 'lion_assign')
        self.assertEqual(msg_b['my_role'], 'LION')

        await comm_a.disconnect()
        await comm_b.disconnect()

    async def test_third_player_gets_no_role(self):
        """Third player joining a full PVP room gets no assigned role."""
        user_c = await User.objects.acreate_user(username='spectator', password='Pass123!')
        token_c = get_token(user_c)

        url_a = f'ws/game/role_room_3/?token={self.token_a}'
        url_b = f'ws/game/role_room_3/?token={self.token_b}'
        url_c = f'ws/game/role_room_3/?token={token_c}'

        comm_a = WebsocketCommunicator(application, url_a)
        await comm_a.connect()
        await comm_a.receive_json_from()

        comm_b = WebsocketCommunicator(application, url_b)
        await comm_b.connect()
        await comm_b.receive_json_from()

        comm_c = WebsocketCommunicator(application, url_c)
        await comm_c.connect()
        msg_c = await comm_c.receive_json_from()

        # Third player: both slots taken, my_role is None (spectator)
        self.assertIsNone(msg_c['my_role'])

        await comm_a.disconnect()
        await comm_b.disconnect()
        await comm_c.disconnect()

    async def test_same_user_cannot_claim_both_roles(self):
        """Same user connecting twice cannot occupy both SHEEP and LION slots."""
        url = f'ws/game/same_user_room/?token={self.token_a}'

        comm1 = WebsocketCommunicator(application, url)
        await comm1.connect()
        msg1 = await comm1.receive_json_from()

        comm2 = WebsocketCommunicator(application, url)
        await comm2.connect()
        msg2 = await comm2.receive_json_from()

        # Both connections by same user — second connection should not claim LION
        state2 = msg2['state']
        # LION slot must NOT be assigned to the same user
        self.assertNotEqual(state2.get('player_lion'), 'sheep_assign')

        await comm1.disconnect()
        await comm2.disconnect()


class TurnEnforcementTest(TestCase):
    """Tests that wrong-player moves are rejected server-side."""

    def setUp(self):
        self.user_a = User.objects.create_user(username='turn_sheep', password='Pass123!')
        self.user_b = User.objects.create_user(username='turn_lion', password='Pass123!')
        self.token_a = get_token(self.user_a)
        self.token_b = get_token(self.user_b)

    async def test_sheep_player_cannot_move_on_lion_turn(self):
        """After SHEEP moves, it is LION's turn — SHEEP player move rejected."""
        url_a = f'ws/game/turn_room_1/?token={self.token_a}'
        url_b = f'ws/game/turn_room_1/?token={self.token_b}'

        comm_a = WebsocketCommunicator(application, url_a)
        await comm_a.connect()
        await comm_a.receive_json_from()

        comm_b = WebsocketCommunicator(application, url_b)
        await comm_b.connect()
        init_b = await comm_b.receive_json_from()

        # Place a sheep (valid, SHEEP turn, user_a is sheep player)
        await comm_a.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {'type': 'PLACE', 'from': None, 'to': 12}
        })
        move_resp = await comm_a.receive_json_from()
        self.assertEqual(move_resp['type'], 'STATE_UPDATE')
        # After sheep places, it is LION's turn
        self.assertEqual(move_resp['state']['current_turn'], 'LION')

        # Now user_a (sheep player) tries to move again — should get error
        await comm_a.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {'type': 'PLACE', 'from': None, 'to': 11}
        })
        err_resp = await comm_a.receive_json_from()
        self.assertEqual(err_resp['type'], 'ERROR')
        self.assertIn('Not your turn', err_resp['message'])

        await comm_a.disconnect()
        await comm_b.disconnect()

    async def test_lion_player_cannot_move_on_sheep_turn(self):
        """LION player cannot make a move when it is SHEEP's turn."""
        url_a = f'ws/game/turn_room_2/?token={self.token_a}'
        url_b = f'ws/game/turn_room_2/?token={self.token_b}'

        comm_a = WebsocketCommunicator(application, url_a)
        await comm_a.connect()
        await comm_a.receive_json_from()

        comm_b = WebsocketCommunicator(application, url_b)
        await comm_b.connect()
        await comm_b.receive_json_from()

        # user_b is LION player — tries to move on SHEEP's first turn
        await comm_b.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {'type': 'PLACE', 'from': None, 'to': 12}
        })

        err_resp = await comm_b.receive_json_from()
        self.assertEqual(err_resp['type'], 'ERROR')
        self.assertIn('Not your turn', err_resp['message'])

        await comm_a.disconnect()
        await comm_b.disconnect()


class GameModeIsolationTest(TestCase):
    """Tests for correct mode isolation — LOCAL/PVAI/PVP don't interfere."""

    def setUp(self):
        self.user = User.objects.create_user(username='mode_user', password='Pass123!')
        self.token = get_token(self.user)

    async def test_pvai_mode_triggers_ai_not_pvp(self):
        """In PVAI mode, AI handles the opponent — no PVP role assignment expected."""
        url = f'ws/game/pvai_room/?token={self.token}'
        comm = WebsocketCommunicator(application, url)
        await comm.connect()
        await comm.receive_json_from()

        # Switch to PVAI
        await comm.send_json_to({
            'action': 'SELECT_MODE',
            'mode': 'PVAI',
            'ai_role': 'LION',
            'ai_difficulty': 'EASY',
        })
        resp = await comm.receive_json_from()
        self.assertEqual(resp['type'], 'STATE_UPDATE')
        self.assertEqual(resp['state']['mode'], 'PVAI')
        self.assertEqual(resp['state']['ai_role'], 'LION')

        # Place sheep — AI should respond
        await comm.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {'type': 'PLACE', 'from': None, 'to': 12}
        })
        move_resp = await comm.receive_json_from()
        self.assertEqual(move_resp['type'], 'STATE_UPDATE')

        await comm.disconnect()

    async def test_mode_reset_clears_game_state(self):
        """Sending RESET_GAME returns board to initial state."""
        url = f'ws/game/reset_room/?token={self.token}'
        comm = WebsocketCommunicator(application, url)
        await comm.connect()
        await comm.receive_json_from()

        # Make a move
        await comm.send_json_to({
            'action': 'MAKE_MOVE',
            'move': {'type': 'PLACE', 'from': None, 'to': 12}
        })
        await comm.receive_json_from()

        # Reset
        await comm.send_json_to({'action': 'RESET_GAME'})
        reset_resp = await comm.receive_json_from()
        self.assertEqual(reset_resp['type'], 'STATE_UPDATE')
        self.assertEqual(reset_resp['state']['current_turn'], 'SHEEP')
        self.assertEqual(reset_resp['state']['move_number'], 0)
        self.assertIsNone(reset_resp['state']['board'][12])

        await comm.disconnect()

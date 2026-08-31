import json
import asyncio
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from .logic import (
    create_initial_board,
    apply_move,
    get_all_valid_moves,
    TOTAL_SHEEP_RESERVE,
    validate_game_invariants,
)
from .ai import BheedChaalBot
from .models import Game

logger = logging.getLogger('game_engine')

ROOM_LOCKS = {}


def get_room_lock(room_name):
    if room_name not in ROOM_LOCKS:
        ROOM_LOCKS[room_name] = asyncio.Lock()
    return ROOM_LOCKS[room_name]


@database_sync_to_async
def get_or_create_game_db(room_name, user):
    game, created = Game.objects.get_or_create(
        room_name=room_name,
        defaults={
            'board': create_initial_board(),
            'game_phase': 'PLACEMENT',
            'current_turn': 'SHEEP',
            'unplaced_sheep': TOTAL_SHEEP_RESERVE,
            'captured_sheep': 0,
            'game_status': 'IN_PROGRESS',
            'mode': 'PVP',
            'ai_role': 'LION',
            'ai_difficulty': 'MEDIUM',
            'move_number': 0,
            'state_version': 1,
            'move_history': [],
        }
    )

    # Assign players if in PVP and unassigned
    if game.mode == 'PVP' and user and user.is_authenticated:
        if game.player_sheep is None and game.player_lion != user:
            game.player_sheep = user
            game.save()
        elif game.player_lion is None and game.player_sheep != user:
            game.player_lion = user
            game.save()

    return serialize_game(game)


@database_sync_to_async
def set_game_mode_db(room_name, mode, ai_role, ai_difficulty):
    try:
        game = Game.objects.get(room_name=room_name)
        game.mode = mode
        if ai_role:
            game.ai_role = ai_role
        if ai_difficulty:
            game.ai_difficulty = ai_difficulty
        game.state_version += 1
        game.save()
        return serialize_game(game)
    except Game.DoesNotExist:
        return None


@database_sync_to_async
def reset_game_db(room_name):
    try:
        game = Game.objects.get(room_name=room_name)
        game.board = create_initial_board()
        game.game_phase = 'PLACEMENT'
        game.current_turn = 'SHEEP'
        game.unplaced_sheep = TOTAL_SHEEP_RESERVE
        game.captured_sheep = 0
        game.game_status = 'IN_PROGRESS'
        game.move_number = 0
        game.state_version += 1
        game.move_history = []
        game.save()
        return serialize_game(game)
    except Game.DoesNotExist:
        return None


@database_sync_to_async
def apply_move_db(room_name, move_data, user):
    with transaction.atomic():
        try:
            game = Game.objects.select_for_update().get(room_name=room_name)
        except Game.DoesNotExist:
            return None, 'Game not found'

        if game.game_status != 'IN_PROGRESS':
            return None, 'Game is already over'

        # Check turn authorization in Online PVP mode
        if game.mode == 'PVP' and user and user.is_authenticated:
            if game.current_turn == 'SHEEP' and game.player_sheep and game.player_sheep != user:
                return None, 'Not your turn (You are not Sheep player)'
            if game.current_turn == 'LION' and game.player_lion and game.player_lion != user:
                return None, 'Not your turn (You are not Lion player)'

        # Get server-authoritative valid moves
        valid_moves = get_all_valid_moves(
            game.board,
            game.game_phase,
            game.current_turn,
            game.unplaced_sheep
        )

        matched_move = None
        for m in valid_moves:
            if (
                m.get('type') == move_data.get('type') and
                m.get('from') == move_data.get('from') and
                m.get('to') == move_data.get('to')
            ):
                matched_move = m
                break

        if not matched_move:
            return None, 'Illegal move'

        # Apply move authoritatively
        nb, np, nt, nu, nc, nstat = apply_move(
            game.board,
            game.game_phase,
            game.current_turn,
            game.unplaced_sheep,
            game.captured_sheep,
            matched_move
        )

        game.board = nb
        game.game_phase = np
        game.current_turn = nt
        game.unplaced_sheep = nu
        game.captured_sheep = nc
        game.game_status = nstat
        game.move_number += 1
        game.state_version += 1

        history_item = dict(matched_move)
        history_item['move_number'] = game.move_number
        game.move_history.append(history_item)

        # Update stats on game completion
        if nstat != 'IN_PROGRESS':
            if nstat == 'LIONS_WON':
                if game.player_lion:
                    game.player_lion.wins += 1
                    game.player_lion.save()
                if game.player_sheep:
                    game.player_sheep.losses += 1
                    game.player_sheep.save()
            elif nstat == 'SHEEP_WON':
                if game.player_sheep:
                    game.player_sheep.wins += 1
                    game.player_sheep.save()
                if game.player_lion:
                    game.player_lion.losses += 1
                    game.player_lion.save()

        game.save()
        return serialize_game(game), None


@database_sync_to_async
def get_ai_move_db(room_name):
    try:
        game = Game.objects.get(room_name=room_name)
        if game.game_status != 'IN_PROGRESS' or game.mode != 'PVAI':
            return None, None
        if game.current_turn != game.ai_role:
            return None, None

        bot = BheedChaalBot(difficulty=game.ai_difficulty)
        ai_move = bot.get_best_move(
            board=game.board,
            game_phase=game.game_phase,
            current_turn=game.current_turn,
            unplaced_sheep=game.unplaced_sheep,
            captured_sheep=game.captured_sheep,
            difficulty=game.ai_difficulty
        )
        return game, ai_move
    except Game.DoesNotExist:
        return None, None


def serialize_game(game):
    return {
        'room_name': game.room_name,
        'mode': game.mode,
        'ai_role': game.ai_role,
        'ai_difficulty': game.ai_difficulty,
        'board': game.board,
        'game_phase': game.game_phase,
        'current_turn': game.current_turn,
        'unplaced_sheep': game.unplaced_sheep,
        'captured_sheep': game.captured_sheep,
        'game_status': game.game_status,
        'move_number': game.move_number,
        'state_version': game.state_version,
        'move_history': game.move_history,
        'player_sheep': game.player_sheep.username if game.player_sheep else None,
        'player_lion': game.player_lion.username if game.player_lion else None,
    }


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'
        self.user = self.scope.get('user', None)

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        lock = get_room_lock(self.room_name)
        async with lock:
            state = await get_or_create_game_db(self.room_name, self.user)

        # Enforce: PVP mode requires authenticated user
        if state['mode'] == 'PVP' and (
            self.user is None or
            isinstance(self.user, AnonymousUser) or
            not self.user.is_authenticated
        ):
            await self.send(text_data=json.dumps({
                'type': 'AUTH_REQUIRED',
                'message': 'Online PVP requires authentication. Please log in to join this game.',
            }))
            await self.close(code=4001)
            return

        # Determine this connection's assigned role in PVP
        my_role = None
        if state['mode'] == 'PVP' and self.user and self.user.is_authenticated:
            username = self.user.username
            if state['player_sheep'] == username:
                my_role = 'SHEEP'
            elif state['player_lion'] == username:
                my_role = 'LION'

        await self.send(text_data=json.dumps({
            'type': 'INIT_STATE',
            'state': state,
            'room': self.room_name,
            'my_role': my_role,
            'username': self.user.username if (self.user and self.user.is_authenticated) else None,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
            action = data.get('action')
            lock = get_room_lock(self.room_name)

            async with lock:
                if action == 'SELECT_MODE':
                    mode = data.get('mode', 'PVP')
                    ai_role = data.get('ai_role', 'LION')
                    ai_difficulty = data.get('ai_difficulty', 'MEDIUM')
                    state = await set_game_mode_db(self.room_name, mode, ai_role, ai_difficulty)
                    if state:
                        await self.broadcast_state('MODE_CHANGED', state)

                elif action == 'RESET_GAME':
                    state = await reset_game_db(self.room_name)
                    if state:
                        await self.broadcast_state('GAME_RESET', state)

                elif action == 'MAKE_MOVE':
                    move_data = data.get('move')
                    if not move_data:
                        await self.send_error('Missing move payload')
                        return

                    state, err = await apply_move_db(self.room_name, move_data, self.user)
                    if err:
                        await self.send_error(err)
                        return

                    await self.broadcast_state('MOVE_EXECUTED', state)

                    # Trigger AI move if in PVAI mode and it's AI's turn
                    if (
                        state['mode'] == 'PVAI' and
                        state['game_status'] == 'IN_PROGRESS' and
                        state['current_turn'] == state['ai_role']
                    ):
                        asyncio.create_task(self.handle_ai_turn())

        except json.JSONDecodeError:
            await self.send_error('Invalid JSON format')

    async def handle_ai_turn(self):
        lock = get_room_lock(self.room_name)
        await asyncio.sleep(0.3)

        async with lock:
            game_obj, ai_move = await get_ai_move_db(self.room_name)
            if not game_obj or not ai_move:
                return

            state, err = await apply_move_db(self.room_name, ai_move, None)
            if state and not err:
                await self.broadcast_state('AI_MOVE_EXECUTED', state)

    async def broadcast_state(self, event_type, state):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state_update',
                'event_type': event_type,
                'state': state,
            }
        )

    async def game_state_update(self, event):
        # Determine this connection's role for the broadcast too
        state = event.get('state', {})
        my_role = None
        if self.user and self.user.is_authenticated:
            username = self.user.username
            if state.get('player_sheep') == username:
                my_role = 'SHEEP'
            elif state.get('player_lion') == username:
                my_role = 'LION'

        await self.send(text_data=json.dumps({
            'type': 'STATE_UPDATE',
            'event_type': event.get('event_type'),
            'state': state,
            'my_role': my_role,
        }))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'ERROR',
            'message': message,
        }))

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .logic import (
    create_initial_board,
    apply_move,
    get_all_valid_moves,
    TOTAL_SHEEP_RESERVE,
)
from .ai import BheedChaalBot

# In-memory match room storage (can be backed by Redis cache)
ROOM_STATES = {}

class GameConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.bot = BheedChaalBot(depth=3)

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Initialize room state if not existing
        if self.room_name not in ROOM_STATES:
            ROOM_STATES[self.room_name] = {
                'board': create_initial_board(),
                'game_phase': 'PLACEMENT',
                'current_turn': 'SHEEP',
                'unplaced_sheep': TOTAL_SHEEP_RESERVE,
                'captured_sheep': 0,
                'game_status': 'IN_PROGRESS',
                'mode': 'PVP', # Default mode
                'ai_role': 'LION', # AI plays as Lion in PVAI by default
                'move_history': [],
            }

        # Send current game state upon connection
        await self.send(text_data=json.dumps({
            'type': 'INIT_STATE',
            'state': ROOM_STATES[self.room_name],
            'room': self.room_name,
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

            state = ROOM_STATES.get(self.room_name)
            if not state:
                return

            if action == 'SELECT_MODE':
                state['mode'] = data.get('mode', 'PVP')
                state['ai_role'] = data.get('ai_role', 'LION')
                await self.broadcast_state('MODE_CHANGED')

            elif action == 'RESET_GAME':
                ROOM_STATES[self.room_name] = {
                    'board': create_initial_board(),
                    'game_phase': 'PLACEMENT',
                    'current_turn': 'SHEEP',
                    'unplaced_sheep': TOTAL_SHEEP_RESERVE,
                    'captured_sheep': 0,
                    'game_status': 'IN_PROGRESS',
                    'mode': state.get('mode', 'PVP'),
                    'ai_role': state.get('ai_role', 'LION'),
                    'move_history': [],
                }
                await self.broadcast_state('GAME_RESET')

            elif action == 'MAKE_MOVE':
                if state['game_status'] != 'IN_PROGRESS':
                    return

                move = data.get('move')
                if not move:
                    return

                # Validate move against server-authoritative rules
                valid_moves = get_all_valid_moves(
                    state['board'],
                    state['game_phase'],
                    state['current_turn'],
                    state['unplaced_sheep']
                )

                # Check if requested move is in valid moves list
                is_valid = any(
                    m.get('type') == move.get('type') and
                    m.get('from') == move.get('from') and
                    m.get('to') == move.get('to')
                    for m in valid_moves
                )

                if is_valid:
                    nb, np, nt, nu, nc, nstat = apply_move(
                        state['board'],
                        state['game_phase'],
                        state['current_turn'],
                        state['unplaced_sheep'],
                        state['captured_sheep'],
                        move
                    )

                    state['board'] = nb
                    state['game_phase'] = np
                    state['current_turn'] = nt
                    state['unplaced_sheep'] = nu
                    state['captured_sheep'] = nc
                    state['game_status'] = nstat
                    state['move_history'].append(move)

                    await self.broadcast_state('MOVE_EXECUTED')

                    # Trigger AI counter-move asynchronously if in PVAI mode
                    if (
                        state['mode'] == 'PVAI' and
                        state['game_status'] == 'IN_PROGRESS' and
                        state['current_turn'] == state['ai_role']
                    ):
                        asyncio.create_task(self.handle_ai_turn())

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'ERROR',
                'message': 'Invalid JSON format'
            }))

    async def handle_ai_turn(self):
        state = ROOM_STATES.get(self.room_name)
        if not state or state['game_status'] != 'IN_PROGRESS':
            return

        # Slight natural pause before AI move
        await asyncio.sleep(0.4)

        # Run Minimax search non-blockingly using asyncio.to_thread
        ai_move = await asyncio.to_thread(
            self.bot.get_best_move,
            board=state['board'],
            game_phase=state['game_phase'],
            current_turn=state['current_turn'],
            unplaced_sheep=state['unplaced_sheep'],
            captured_sheep=state['captured_sheep']
        )

        if ai_move:
            nb, np, nt, nu, nc, nstat = apply_move(
                state['board'],
                state['game_phase'],
                state['current_turn'],
                state['unplaced_sheep'],
                state['captured_sheep'],
                ai_move
            )

            state['board'] = nb
            state['game_phase'] = np
            state['current_turn'] = nt
            state['unplaced_sheep'] = nu
            state['captured_sheep'] = nc
            state['game_status'] = nstat
            state['move_history'].append(ai_move)

            await self.broadcast_state('AI_MOVE_EXECUTED')

    async def broadcast_state(self, event_type):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state_update',
                'event_type': event_type,
                'state': ROOM_STATES.get(self.room_name),
            }
        )

    async def game_state_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'STATE_UPDATE',
            'event_type': event.get('event_type'),
            'state': event.get('state'),
        }))

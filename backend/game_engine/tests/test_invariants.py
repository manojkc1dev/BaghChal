from django.test import TestCase
from game_engine.logic import (
    create_initial_board,
    apply_move,
    validate_game_invariants,
    TOTAL_SHEEP_RESERVE,
)

class GameStateInvariantsTest(TestCase):
    def test_initial_board_invariants(self):
        board = create_initial_board()
        self.assertTrue(validate_game_invariants(board, 'PLACEMENT', 'SHEEP', TOTAL_SHEEP_RESERVE, 0, 'IN_PROGRESS'))

    def test_lion_count_invariant_violation(self):
        board = create_initial_board()
        board[0] = None # Remove one lion -> only 3 lions
        with self.assertRaises(ValueError):
            validate_game_invariants(board, 'PLACEMENT', 'SHEEP', TOTAL_SHEEP_RESERVE, 0, 'IN_PROGRESS')

    def test_sheep_count_total_invariant_violation(self):
        board = create_initial_board()
        board[12] = 'SHEEP' # 1 sheep on board
        # board(1) + unplaced(20) + captured(0) = 21 != 20
        with self.assertRaises(ValueError):
            validate_game_invariants(board, 'PLACEMENT', 'LION', TOTAL_SHEEP_RESERVE, 0, 'IN_PROGRESS')

    def test_invalid_phase_invariant_violation(self):
        board = create_initial_board()
        with self.assertRaises(ValueError):
            validate_game_invariants(board, 'INVALID_PHASE', 'SHEEP', TOTAL_SHEEP_RESERVE, 0, 'IN_PROGRESS')

    def test_invalid_turn_invariant_violation(self):
        board = create_initial_board()
        with self.assertRaises(ValueError):
            validate_game_invariants(board, 'PLACEMENT', 'GOAT', TOTAL_SHEEP_RESERVE, 0, 'IN_PROGRESS')

    def test_invariants_hold_after_move_sequence(self):
        """Simulate a valid move sequence and verify invariants after every single step."""
        board = create_initial_board()
        phase = 'PLACEMENT'
        turn = 'SHEEP'
        unplaced = TOTAL_SHEEP_RESERVE
        captured = 0
        status = 'IN_PROGRESS'

        # Place 4 sheep
        for target_node in [12, 13, 14, 11]:
            # Sheep turn
            move = {'type': 'PLACE', 'from': None, 'to': target_node}
            board, phase, turn, unplaced, captured, status = apply_move(board, phase, turn, unplaced, captured, move)
            self.assertTrue(validate_game_invariants(board, phase, turn, unplaced, captured, status))

            # Lion step move
            lion_from = 0 if target_node == 12 else (4 if target_node == 13 else (20 if target_node == 14 else 24))
            lion_to = 1 if lion_from == 0 else (3 if lion_from == 4 else (15 if lion_from == 20 else 23))
            if board[lion_from] == 'LION' and board[lion_to] is None:
                lion_move = {'type': 'MOVE', 'from': lion_from, 'to': lion_to}
                board, phase, turn, unplaced, captured, status = apply_move(board, phase, turn, unplaced, captured, lion_move)
                self.assertTrue(validate_game_invariants(board, phase, turn, unplaced, captured, status))

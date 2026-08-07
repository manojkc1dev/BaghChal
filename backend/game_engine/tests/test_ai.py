from django.test import TestCase
from game_engine.logic import create_initial_board
from game_engine.ai import BheedChaalBot

class AIBotTest(TestCase):
    def setUp(self):
        self.bot = BheedChaalBot(depth=2)

    def test_evaluate_board_initial_state(self):
        board = create_initial_board()
        score = self.bot.evaluate_board(board, 'PLACEMENT', unplaced_sheep=20, captured_sheep=0)
        self.assertIsInstance(score, float)

    def test_get_best_move_lion_turn(self):
        board = create_initial_board()
        move = self.bot.get_best_move(
            board=board,
            game_phase='PLACEMENT',
            current_turn='LION',
            unplaced_sheep=20,
            captured_sheep=0
        )
        self.assertIsNotNone(move)
        self.assertIn(move['type'], ['MOVE', 'CAPTURE'])
        self.assertIn(move['from'], [0, 4, 20, 24])

    def test_get_best_move_sheep_turn(self):
        board = create_initial_board()
        move = self.bot.get_best_move(
            board=board,
            game_phase='PLACEMENT',
            current_turn='SHEEP',
            unplaced_sheep=20,
            captured_sheep=0
        )
        self.assertIsNotNone(move)
        self.assertEqual(move['type'], 'PLACE')
        self.assertIsNone(move['from'])
        self.assertIsNotNone(move['to'])

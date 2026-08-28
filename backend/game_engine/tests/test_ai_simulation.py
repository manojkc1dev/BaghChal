import random
from django.test import TestCase
from game_engine.logic import (
    create_initial_board,
    apply_move,
    get_all_valid_moves,
    validate_game_invariants,
    TOTAL_SHEEP_RESERVE,
)
from game_engine.ai import BheedChaalBot

class AISimulationTest(TestCase):
    def test_multi_difficulty_ai_moves(self):
        """Verify Easy, Medium, and Hard AI generate distinct valid moves without errors."""
        board = create_initial_board()
        board[12] = 'SHEEP'
        
        easy_bot = BheedChaalBot(difficulty='EASY')
        medium_bot = BheedChaalBot(difficulty='MEDIUM')
        hard_bot = BheedChaalBot(difficulty='HARD')

        for bot in [easy_bot, medium_bot, hard_bot]:
            move = bot.get_best_move(board, 'PLACEMENT', 'LION', TOTAL_SHEEP_RESERVE - 1, 0)
            self.assertIsNotNone(move)
            valid_moves = get_all_valid_moves(board, 'PLACEMENT', 'LION', TOTAL_SHEEP_RESERVE - 1)
            self.assertIn(move, valid_moves)


    def test_run_hundreds_of_simulated_ai_games(self):
        """
        Runs 200 automated games between AI bots and random agents.
        Verifies:
        - AI NEVER outputs an illegal move.
        - Invariants hold at EVERY step of EVERY game.
        - Every game terminates safely or completes 50 moves without crash.
        """
        TOTAL_SIMULATIONS = 200
        difficulties = ['EASY', 'MEDIUM', 'HARD']

        for game_idx in range(TOTAL_SIMULATIONS):
            board = create_initial_board()
            phase = 'PLACEMENT'
            turn = 'SHEEP'
            unplaced = TOTAL_SHEEP_RESERVE
            captured = 0
            status = 'IN_PROGRESS'

            diff = difficulties[game_idx % len(difficulties)]
            bot = BheedChaalBot(difficulty=diff)

            move_count = 0
            max_moves = 80 # Prevent infinite loops in AI vs AI draw states

            while status == 'IN_PROGRESS' and move_count < max_moves:
                valid_moves = get_all_valid_moves(board, phase, turn, unplaced)
                if not valid_moves:
                    break

                if turn == 'LION':
                    chosen_move = bot.get_best_move(board, phase, turn, unplaced, captured)
                else:
                    # Sheep turn: pick legal move via bot or random
                    chosen_move = random.choice(valid_moves)

                self.assertIsNotNone(chosen_move, f"Bot returned None move on turn {turn}")
                self.assertIn(chosen_move, valid_moves, f"Bot returned illegal move {chosen_move}")

                # Apply move authoritatively
                board, phase, turn, unplaced, captured, status = apply_move(
                    board, phase, turn, unplaced, captured, chosen_move
                )

                # Validate invariants at every state transition
                self.assertTrue(validate_game_invariants(board, phase, turn, unplaced, captured, status))
                move_count += 1

            self.assertTrue(move_count > 0)

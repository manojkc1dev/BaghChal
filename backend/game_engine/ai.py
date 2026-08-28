"""
BheedChaal (Bagh-Chal) Minimax AI Engine with Alpha-Beta Pruning
"""

import math
import random
from .logic import (
    get_all_valid_moves,
    apply_move,
    evaluate_game_status,
    TOTAL_NODES,
    WINNING_CAPTURES,
)

class BheedChaalBot:
    def __init__(self, difficulty='MEDIUM', depth=None):
        self.difficulty = difficulty.upper() if isinstance(difficulty, str) else 'MEDIUM'
        self.override_depth = depth

    def _get_depth(self, diff=None):
        if self.override_depth is not None:
            return self.override_depth
        d = (diff or self.difficulty).upper()
        if d == 'EASY':
            return 1
        elif d == 'HARD':
            return 4
        return 2  # MEDIUM default


    def evaluate_board(self, board, game_phase, unplaced_sheep, captured_sheep):
        """
        Evaluates the board from the perspective of LION (Positive score = LION advantage, Negative = SHEEP advantage).
        """
        status = evaluate_game_status(board, unplaced_sheep, captured_sheep)
        if status == 'LIONS_WON':
            return 10000.0
        if status == 'SHEEP_WON':
            return -10000.0

        score = 0.0

        # 1. Lion Captures (Huge incentive)
        score += captured_sheep * 300.0

        # 2. Lion Mobility & Trapped Count
        lion_total_moves = 0
        trapped_lions = 0
        for node_id in range(TOTAL_NODES):
            if board[node_id] == 'LION':
                moves = get_all_valid_moves(board, game_phase, 'LION', unplaced_sheep)
                lion_node_moves = [m for m in moves if m.get('from') == node_id]
                lion_total_moves += len(lion_node_moves)
                if len(lion_node_moves) == 0:
                    trapped_lions += 1

        score += lion_total_moves * 12.0
        score -= trapped_lions * 350.0

        # 3. Sheep Count & Board Control
        sheep_count = sum(1 for p in board if p == 'SHEEP')
        score -= sheep_count * 15.0

        return score

    def minimax(self, board, game_phase, current_turn, unplaced_sheep, captured_sheep, depth, alpha, beta):
        status = evaluate_game_status(board, unplaced_sheep, captured_sheep)
        if depth == 0 or status != 'IN_PROGRESS':
            return self.evaluate_board(board, game_phase, unplaced_sheep, captured_sheep), None

        valid_moves = get_all_valid_moves(board, game_phase, current_turn, unplaced_sheep)
        if not valid_moves:
            return self.evaluate_board(board, game_phase, unplaced_sheep, captured_sheep), None

        # Move ordering heuristic: Prioritize CAPTURE moves for faster Alpha-Beta pruning cutoff
        valid_moves.sort(key=lambda m: 0 if m.get('type') == 'CAPTURE' else 1)

        best_move = random.choice(valid_moves)

        if current_turn == 'LION':
            max_eval = -math.inf
            for move in valid_moves:
                nb, np, nt, nu, nc, nstat = apply_move(board, game_phase, current_turn, unplaced_sheep, captured_sheep, move)
                eval_score, _ = self.minimax(nb, np, nt, nu, nc, depth - 1, alpha, beta)
                if eval_score > max_eval:
                    max_eval = eval_score
                    best_move = move
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break # Alpha-Beta Cutoff
            return max_eval, best_move

        else: # SHEEP turn
            min_eval = math.inf
            for move in valid_moves:
                nb, np, nt, nu, nc, nstat = apply_move(board, game_phase, current_turn, unplaced_sheep, captured_sheep, move)
                eval_score, _ = self.minimax(nb, np, nt, nu, nc, depth - 1, alpha, beta)
                if eval_score < min_eval:
                    min_eval = eval_score
                    best_move = move
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break # Alpha-Beta Cutoff
            return min_eval, best_move

    def get_best_move(self, board, game_phase, current_turn, unplaced_sheep, captured_sheep, difficulty=None):
        diff = (difficulty or self.difficulty).upper()
        valid_moves = get_all_valid_moves(board, game_phase, current_turn, unplaced_sheep)

        if not valid_moves:
            return None

        # Easy Mode: 40% chance of casual random move, otherwise depth 1
        if diff == 'EASY' and random.random() < 0.40:
            return random.choice(valid_moves)

        depth = 1 if diff == 'EASY' else (4 if diff == 'HARD' else 2)

        _, best_move = self.minimax(
            board=board,
            game_phase=game_phase,
            current_turn=current_turn,
            unplaced_sheep=unplaced_sheep,
            captured_sheep=captured_sheep,
            depth=depth,
            alpha=-math.inf,
            beta=math.inf,
        )
        return best_move or random.choice(valid_moves)


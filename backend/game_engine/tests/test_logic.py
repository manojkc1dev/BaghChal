from django.test import TestCase
from game_engine.logic import (
    TOTAL_NODES,
    TOTAL_SHEEP_RESERVE,
    WINNING_CAPTURES,
    INITIAL_LION_POSITIONS,
    node_to_coord,
    coord_to_node,
    is_diagonal_node,
    build_adjacency_list,
    create_initial_board,
    get_valid_moves_for_node,
    get_all_valid_moves,
    are_lions_trapped,
    evaluate_game_status,
    apply_move,
)

class GraphLogicTest(TestCase):
    def test_coordinate_conversion(self):
        self.assertEqual(node_to_coord(0), (0, 0))
        self.assertEqual(node_to_coord(12), (2, 2))
        self.assertEqual(node_to_coord(24), (4, 4))
        self.assertEqual(coord_to_node(2, 2), 12)
        self.assertIsNone(coord_to_node(-1, 0))
        self.assertIsNone(coord_to_node(5, 5))

    def test_diagonal_property(self):
        # Node 0 (0,0) sum=0 -> True
        self.assertTrue(is_diagonal_node(0))
        # Node 1 (0,1) sum=1 -> False
        self.assertFalse(is_diagonal_node(1))
        # Node 12 (2,2) sum=4 -> True
        self.assertTrue(is_diagonal_node(12))

    def test_adjacency_list(self):
        adj = build_adjacency_list()
        self.assertEqual(len(adj), TOTAL_NODES)
        # Center node 12 should have 8 neighbors (4 orthogonal + 4 diagonal)
        self.assertEqual(len(adj[12]), 8)
        # Node 1 (0,1) should have 3 orthogonal neighbors (0, 2, 6)
        self.assertEqual(len(adj[1]), 3)

    def test_initial_board(self):
        board = create_initial_board()
        self.assertEqual(len(board), TOTAL_NODES)
        for pos in INITIAL_LION_POSITIONS:
            self.assertEqual(board[pos], 'LION')
        self.assertEqual(board.count('LION'), 4)
        self.assertEqual(board.count('SHEEP'), 0)
        self.assertEqual(board.count(None), 21)

    def test_sheep_placement_valid_moves(self):
        board = create_initial_board()
        moves = get_all_valid_moves(board, 'PLACEMENT', 'SHEEP', unplaced_sheep=20)
        # 21 empty nodes, so 21 placement moves available
        self.assertEqual(len(moves), 21)
        self.assertTrue(all(m['type'] == 'PLACE' for m in moves))

    def test_lion_movement_and_capture(self):
        board = create_initial_board()
        # Place a sheep at node 1 (adjacent to corner lion at 0)
        board[1] = 'SHEEP'
        # Node 2 is empty
        moves = get_valid_moves_for_node(board, 0, 'PLACEMENT', 'LION')
        capture_moves = [m for m in moves if m['type'] == 'CAPTURE']
        self.assertEqual(len(capture_moves), 1)
        self.assertEqual(capture_moves[0]['to'], 2)
        self.assertEqual(capture_moves[0]['captured_node'], 1)

    def test_apply_move(self):
        board = create_initial_board()
        move = {'type': 'PLACE', 'from': None, 'to': 12}
        nb, np, nt, nu, nc, nstat = apply_move(board, 'PLACEMENT', 'SHEEP', 20, 0, move)
        self.assertEqual(nb[12], 'SHEEP')
        self.assertEqual(nu, 19)
        self.assertEqual(np, 'PLACEMENT')
        self.assertEqual(nt, 'LION')
        self.assertEqual(nstat, 'IN_PROGRESS')

    def test_win_conditions(self):
        board = create_initial_board()
        self.assertEqual(evaluate_game_status(board, 0, 5), 'LIONS_WON')
        self.assertEqual(evaluate_game_status(board, 0, 4), 'IN_PROGRESS')

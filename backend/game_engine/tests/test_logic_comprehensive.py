from django.test import TestCase
from game_engine.logic import (
    create_initial_board,
    get_valid_moves_for_node,
    get_all_valid_moves,
    apply_move,
    evaluate_game_status,
    are_lions_trapped,
    node_to_coord,
    coord_to_node,
    is_diagonal_node,
    ADJACENCY_LIST,
    TOTAL_NODES,
    TOTAL_SHEEP_RESERVE,
    WINNING_CAPTURES,
)

class ComprehensiveGameEngineTest(TestCase):
    def setUp(self):
        self.initial_board = create_initial_board()

    def test_all_25_nodes_geometry(self):
        """Verify all 25 nodes map bijectively to coordinates (0..4, 0..4)."""
        for node in range(TOTAL_NODES):
            row, col = node_to_coord(node)
            self.assertTrue(0 <= row < 5)
            self.assertTrue(0 <= col < 5)
            self.assertEqual(coord_to_node(row, col), node)

    def test_diagonal_node_property(self):
        """Even (row + col) must be diagonal nodes, odd must not be."""
        for node in range(TOTAL_NODES):
            row, col = node_to_coord(node)
            if (row + col) % 2 == 0:
                self.assertTrue(is_diagonal_node(node))
            else:
                self.assertFalse(is_diagonal_node(node))

    def test_adjacency_list_edges(self):
        """Verify graph symmetry and legal degree bounds (3..8)."""
        for node, neighbors in ADJACENCY_LIST.items():
            self.assertTrue(3 <= len(neighbors) <= 8)
            for nb in neighbors:
                self.assertIn(node, ADJACENCY_LIST[nb])

    def test_invalid_diagonal_movement(self):
        """Odd nodes (e.g. node 1) cannot have diagonal neighbors."""
        row, col = node_to_coord(1)
        self.assertEqual((row + col) % 2, 1)
        neighbors = ADJACENCY_LIST[1]
        # Diagonal adjacent nodes would be (1,1)->6 or (1,-1)->N/A. Node 1 is (0,1).
        # (0,1) orthogonal neighbors: (0,0)->0, (0,2)->2, (1,1)->6
        self.assertNotIn(7, neighbors) # (1,2)->7 is diagonal from (0,1), must NOT be neighbor
        self.assertNotIn(5, neighbors) # (1,0)->5 is diagonal from (0,1), must NOT be neighbor

    def test_invalid_long_distance_move(self):
        """Pieces cannot move 2 nodes without a valid jump capture."""
        board = create_initial_board() # Lions at 0, 4, 20, 24
        # Lion at 0 tries to move to 2 (long distance orthogonal step)
        moves = get_valid_moves_for_node(board, 0, 'PLACEMENT', 'LION')
        to_nodes = [m['to'] for m in moves]
        self.assertNotIn(2, to_nodes)
        self.assertNotIn(10, to_nodes)

    def test_occupied_destination_rejection(self):
        """Cannot move to a node already occupied by any piece."""
        board = create_initial_board()
        board[1] = 'SHEEP'
        # Lion at 0 tries to step to 1 (occupied by sheep without jump space behind)
        # Node 1 is adjacent to 0, but occupied, so step MOVE to 1 should be invalid.
        moves = get_valid_moves_for_node(board, 0, 'MOVEMENT', 'LION')
        step_moves_to_1 = [m for m in moves if m['type'] == 'MOVE' and m['to'] == 1]
        self.assertEqual(len(step_moves_to_1), 0)

    def test_jump_over_empty_node_rejection(self):
        """Lions cannot jump over empty nodes."""
        board = create_initial_board() # 0 is LION, 1 is empty, 2 is empty
        moves = get_valid_moves_for_node(board, 0, 'PLACEMENT', 'LION')
        captures_to_2 = [m for m in moves if m['type'] == 'CAPTURE' and m['to'] == 2]
        self.assertEqual(len(captures_to_2), 0)

    def test_jump_over_lion_rejection(self):
        """Lions cannot jump over another lion."""
        board = create_initial_board()
        board[1] = 'LION' # Lion at 1
        moves = get_valid_moves_for_node(board, 0, 'PLACEMENT', 'LION')
        captures_to_2 = [m for m in moves if m['type'] == 'CAPTURE' and m['to'] == 2]
        self.assertEqual(len(captures_to_2), 0)

    def test_jump_over_multiple_pieces_rejection(self):
        """Lions cannot jump over 2 sheep in a row."""
        board = create_initial_board()
        board[1] = 'SHEEP'
        board[2] = 'SHEEP'
        moves = get_valid_moves_for_node(board, 0, 'PLACEMENT', 'LION')
        captures_to_3 = [m for m in moves if m['type'] == 'CAPTURE' and m['to'] == 3]
        self.assertEqual(len(captures_to_3), 0)

    def test_valid_capture_from_all_corner_positions(self):
        """Test valid jump captures from each of the 4 corner lion positions."""
        corners = [0, 4, 20, 24]
        jump_configs = [
            (0, 1, 2),   # Lion at 0 jumps Sheep at 1 landing on 2
            (4, 3, 2),   # Lion at 4 jumps Sheep at 3 landing on 2
            (20, 15, 10),# Lion at 20 jumps Sheep at 15 landing on 10
            (24, 23, 22),# Lion at 24 jumps Sheep at 23 landing on 22
        ]
        for lion_pos, sheep_pos, land_pos in jump_configs:
            board = [None] * 25
            board[lion_pos] = 'LION'
            board[sheep_pos] = 'SHEEP'
            moves = get_valid_moves_for_node(board, lion_pos, 'MOVEMENT', 'LION')
            captures = [m for m in moves if m['type'] == 'CAPTURE' and m['to'] == land_pos]
            self.assertEqual(len(captures), 1, f"Failed capture test from {lion_pos} over {sheep_pos} to {land_pos}")

    def test_placement_exhaustion_transition(self):
        """Placing 20th sheep must transition game_phase from PLACEMENT to MOVEMENT."""
        board = create_initial_board() # Lions at 0, 4, 20, 24
        # Populate 19 sheep on non-lion nodes 1..19 except 4
        placed_count = 0
        for n in range(25):
            if board[n] is None and placed_count < 19:
                board[n] = 'SHEEP'
                placed_count += 1
        
        unplaced = 1
        captured = 0
        target_node = [n for n in range(25) if board[n] is None][0]
        move = {'type': 'PLACE', 'from': None, 'to': target_node}
        nb, np, nt, nu, nc, nstat = apply_move(board, 'PLACEMENT', 'SHEEP', unplaced, captured, move)
        self.assertEqual(np, 'MOVEMENT')
        self.assertEqual(nu, 0)
        self.assertEqual(nb[target_node], 'SHEEP')


    def test_sheep_cannot_move_in_placement_phase(self):
        """Sheep cannot move on board during PLACEMENT phase."""
        board = create_initial_board()
        board[12] = 'SHEEP'
        moves = get_valid_moves_for_node(board, 12, 'PLACEMENT', 'SHEEP')
        self.assertEqual(len(moves), 0)

    def test_trapped_lions_victory(self):
        """Surrounding all lions completely triggers SHEEP_WON status."""
        board = [None] * 25
        # Place 4 lions at corners 0, 4, 20, 24
        for p in [0, 4, 20, 24]:
            board[p] = 'LION'
        # Populate sheep on all surrounding adjacent and jump-landing nodes
        sheep_nodes = [1, 2, 3, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 19, 21, 22, 23]
        for n in sheep_nodes:
            board[n] = 'SHEEP'

        self.assertTrue(are_lions_trapped(board))
        status = evaluate_game_status(board, 3, 0)
        self.assertEqual(status, 'SHEEP_WON')



    def test_lion_winning_captures(self):
        """5 captures triggers LIONS_WON status."""
        board = create_initial_board()
        status = evaluate_game_status(board, 0, 5)
        self.assertEqual(status, 'LIONS_WON')

"""
BheedChaal (Bagh-Chal) Server-Authoritative Logic Engine
"""

BOARD_SIZE = 5
TOTAL_NODES = 25
TOTAL_SHEEP_RESERVE = 20
WINNING_CAPTURES = 5

INITIAL_LION_POSITIONS = [0, 4, 20, 24]

def node_to_coord(node_id):
    return node_id // BOARD_SIZE, node_id % BOARD_SIZE

def coord_to_node(row, col):
    if 0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE:
        return row * BOARD_SIZE + col
    return None

def is_diagonal_node(node_id):
    row, col = node_to_coord(node_id)
    return (row + col) % 2 == 0

def build_adjacency_list():
    adj = {}
    for node_id in range(TOTAL_NODES):
        row, col = node_to_coord(node_id)
        neighbors = []
        
        # Orthogonal
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nb = coord_to_node(row + dr, col + dc)
            if nb is not None:
                neighbors.append(nb)

        # Diagonals for even (row + col)
        if is_diagonal_node(node_id):
            for dr, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                nb = coord_to_node(row + dr, col + dc)
                if nb is not None:
                    neighbors.append(nb)

        adj[node_id] = neighbors
    return adj

ADJACENCY_LIST = build_adjacency_list()

def create_initial_board():
    board = [None] * TOTAL_NODES
    for pos in INITIAL_LION_POSITIONS:
        board[pos] = 'LION'
    return board

def get_valid_moves_for_node(board, from_node, game_phase, current_turn):
    if from_node is None or from_node < 0 or from_node >= TOTAL_NODES:
        return []
    
    piece = board[from_node]
    if not piece or piece != current_turn:
        return []

    if piece == 'SHEEP' and game_phase == 'PLACEMENT':
        return []

    valid_moves = []
    neighbors = ADJACENCY_LIST.get(from_node, [])
    r1, c1 = node_to_coord(from_node)

    for neighbor_id in neighbors:
        target_piece = board[neighbor_id]

        # 1. Step move
        if target_piece is None:
            valid_moves.append({
                'type': 'MOVE',
                'from': from_node,
                'to': neighbor_id,
            })

        # 2. Lion Jump Capture
        if piece == 'LION' and target_piece == 'SHEEP':
            r2, c2 = node_to_coord(neighbor_id)
            dr, dc = r2 - r1, c2 - c1

            landing_r, landing_c = r2 + dr, c2 + dc
            landing_node = coord_to_node(landing_r, landing_c)

            if landing_node is not None:
                jumped_neighbors = ADJACENCY_LIST.get(neighbor_id, [])
                if landing_node in jumped_neighbors and board[landing_node] is None:
                    valid_moves.append({
                        'type': 'CAPTURE',
                        'from': from_node,
                        'to': landing_node,
                        'captured_node': neighbor_id,
                    })

    return valid_moves

def get_all_valid_moves(board, game_phase, current_turn, unplaced_sheep):
    moves = []

    # Placement Phase for Sheep
    if current_turn == 'SHEEP' and game_phase == 'PLACEMENT':
        if unplaced_sheep > 0:
            for node_id in range(TOTAL_NODES):
                if board[node_id] is None:
                    moves.append({
                        'type': 'PLACE',
                        'from': None,
                        'to': node_id,
                    })
        return moves

    # Movement phase for Sheep or any phase for Lions
    for node_id in range(TOTAL_NODES):
        if board[node_id] == current_turn:
            node_moves = get_valid_moves_for_node(board, node_id, game_phase, current_turn)
            moves.extend(node_moves)

    return moves

def are_lions_trapped(board):
    for node_id in range(TOTAL_NODES):
        if board[node_id] == 'LION':
            moves = get_valid_moves_for_node(board, node_id, 'MOVEMENT', 'LION')
            if len(moves) > 0:
                return False
    return True

def evaluate_game_status(board, unplaced_sheep, captured_sheep):
    if captured_sheep >= WINNING_CAPTURES:
        return 'LIONS_WON'
    
    if are_lions_trapped(board):
        return 'SHEEP_WON'

    return 'IN_PROGRESS'

def apply_move(board, game_phase, current_turn, unplaced_sheep, captured_sheep, move):
    new_board = list(board)
    new_unplaced = unplaced_sheep
    new_captured = captured_sheep
    next_phase = game_phase

    move_type = move.get('type')

    if move_type == 'PLACE':
        to_node = move.get('to')
        new_board[to_node] = 'SHEEP'
        new_unplaced -= 1
        if new_unplaced == 0:
            next_phase = 'MOVEMENT'
    
    elif move_type in ['MOVE', 'CAPTURE']:
        from_node = move.get('from')
        to_node = move.get('to')
        moving_piece = new_board[from_node]
        new_board[from_node] = None
        new_board[to_node] = moving_piece

        if move_type == 'CAPTURE':
            captured_node = move.get('captured_node')
            if captured_node is not None:
                new_board[captured_node] = None
                new_captured += 1

    next_turn = 'LION' if current_turn == 'SHEEP' else 'SHEEP'
    next_status = evaluate_game_status(new_board, new_unplaced, new_captured)

    return new_board, next_phase, next_turn, new_unplaced, new_captured, next_status

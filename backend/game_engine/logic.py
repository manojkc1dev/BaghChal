"""
BheedChaal (Bagh-Chal) Pure Python Board & Rules Logic
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

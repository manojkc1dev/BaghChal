/**
 * BheedChaal (Bagh-Chal variant) Core Math & Game Engine Logic
 * 
 * Graph Structure:
 * 25 Nodes on a 5x5 grid (0 to 24).
 * Node (r, c) => id = r * 5 + c
 * r = Math.floor(id / 5), c = id % 5
 * 
 * Edge Connections:
 * - Orthogonal: All adjacent horizontal and vertical nodes.
 * - Diagonal: ONLY nodes where (r + c) is EVEN (Alquerque / Bagh-Chal board property).
 */

export const BOARD_SIZE = 5;
export const TOTAL_NODES = 25;
export const TOTAL_SHEEP_RESERVE = 20;
export const WINNING_CAPTURES = 5;

export const INITIAL_LION_POSITIONS = [0, 4, 20, 24]; // 4 outer corners

// Helper to convert Node ID to (row, col)
export function nodeToCoord(id) {
  return {
    row: Math.floor(id / BOARD_SIZE),
    col: id % BOARD_SIZE,
  };
}

// Helper to convert (row, col) to Node ID
export function coordToNode(row, col) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
  return row * BOARD_SIZE + col;
}

// Math check if node supports diagonal connections
export function isDiagonalNode(id) {
  const { row, col } = nodeToCoord(id);
  return (row + col) % 2 === 0;
}

/**
 * Generate Undirected Graph Adjacency List for 5x5 Bagh-Chal board
 */
export function buildAdjacencyList() {
  const adj = {};

  for (let id = 0; id < TOTAL_NODES; id++) {
    const { row, col } = nodeToCoord(id);
    const neighbors = [];

    // Orthogonal offsets
    const orthogonalDirs = [
      [-1, 0], // Up
      [1, 0],  // Down
      [0, -1], // Left
      [0, 1],  // Right
    ];

    for (const [dr, dc] of orthogonalDirs) {
      const neighbor = coordToNode(row + dr, col + dc);
      if (neighbor !== null) {
        neighbors.push(neighbor);
      }
    }

    // Diagonal offsets (Only for even (row + col) nodes)
    if (isDiagonalNode(id)) {
      const diagonalDirs = [
        [-1, -1], // Top-Left
        [-1, 1],  // Top-Right
        [1, -1],  // Bottom-Left
        [1, 1],   // Bottom-Right
      ];

      for (const [dr, dc] of diagonalDirs) {
        const neighbor = coordToNode(row + dr, col + dc);
        if (neighbor !== null) {
          neighbors.push(neighbor);
        }
      }
    }

    adj[id] = neighbors;
  }

  return adj;
}

export const ADJACENCY_LIST = buildAdjacencyList();

/**
 * Creates initial 25-node board array
 */
export function createInitialBoard() {
  const board = Array(TOTAL_NODES).fill(null);
  INITIAL_LION_POSITIONS.forEach((pos) => {
    board[pos] = 'LION';
  });
  return board;
}

/**
 * Calculate valid moves and jumps for a piece at `fromNode`
 */
export function getValidMovesForNode(board, fromNode, gamePhase, currentTurn) {
  if (fromNode === null || fromNode < 0 || fromNode >= TOTAL_NODES) return [];
  const piece = board[fromNode];

  if (!piece || piece !== currentTurn) return [];

  // Sheep move restriction: cannot move on board until placement phase is complete
  if (piece === 'SHEEP' && gamePhase === 'PLACEMENT') {
    return [];
  }

  const validMoves = [];
  const neighbors = ADJACENCY_LIST[fromNode] || [];

  const { row: r1, col: c1 } = nodeToCoord(fromNode);

  neighbors.forEach((neighborId) => {
    const targetPiece = board[neighborId];

    // 1. Simple step move to an empty adjacent node
    if (targetPiece === null) {
      validMoves.push({
        type: 'MOVE',
        from: fromNode,
        to: neighborId,
      });
    }

    // 2. Lion Jump Capture Mechanics
    if (piece === 'LION' && targetPiece === 'SHEEP') {
      const { row: r2, col: c2 } = nodeToCoord(neighborId);
      const dr = r2 - r1;
      const dc = c2 - c1;

      // Candidate landing node in straight line
      const landingRow = r2 + dr;
      const landingCol = c2 + dc;
      const landingNode = coordToNode(landingRow, landingCol);

      if (landingNode !== null) {
        // Must check that connection from jumped sheep to landing node exists in graph!
        const jumpedNeighbors = ADJACENCY_LIST[neighborId] || [];
        if (jumpedNeighbors.includes(landingNode) && board[landingNode] === null) {
          validMoves.push({
            type: 'CAPTURE',
            from: fromNode,
            to: landingNode,
            capturedNode: neighborId,
          });
        }
      }
    }
  });

  return validMoves;
}

/**
 * Check if all Lions on the board have 0 available moves or captures
 */
export function areLionsTrapped(board) {
  for (let id = 0; id < TOTAL_NODES; id++) {
    if (board[id] === 'LION') {
      const moves = getValidMovesForNode(board, id, 'MOVEMENT', 'LION');
      if (moves.length > 0) {
        return false; // At least one lion can move or capture
      }
    }
  }
  return true; // All lions trapped
}

/**
 * Checks victory status: 'IN_PROGRESS' | 'LIONS_WON' | 'SHEEP_WON'
 */
export function evaluateGameStatus(board, unplacedSheep, capturedSheep) {
  // Lions win if 5 or more sheep are captured
  if (capturedSheep >= WINNING_CAPTURES) {
    return 'LIONS_WON';
  }

  // Sheep win if all Lions are trapped with no valid moves/jumps
  if (areLionsTrapped(board)) {
    return 'SHEEP_WON';
  }

  return 'IN_PROGRESS';
}

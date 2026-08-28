import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  getValidMovesForNode,
  areLionsTrapped,
  evaluateGameStatus,
  TOTAL_NODES,
  TOTAL_SHEEP_RESERVE,
  WINNING_CAPTURES,
  isDiagonalNode,
  ADJACENCY_LIST,
} from './gameLogic';

describe('Bagh-Chal Game Logic Tests (Frontend)', () => {
  it('initializes board with 4 lions in outer corners', () => {
    const board = createInitialBoard();
    expect(board.length).toBe(TOTAL_NODES);
    expect(board[0]).toBe('LION');
    expect(board[4]).toBe('LION');
    expect(board[20]).toBe('LION');
    expect(board[24]).toBe('LION');
    const lionCount = board.filter((p) => p === 'LION').length;
    expect(lionCount).toBe(4);
    const nullCount = board.filter((p) => p === null).length;
    expect(nullCount).toBe(21);
  });

  it('correctly identifies diagonal nodes where (r+c) % 2 === 0', () => {
    expect(isDiagonalNode(0)).toBe(true);  // (0,0)
    expect(isDiagonalNode(1)).toBe(false); // (0,1)
    expect(isDiagonalNode(12)).toBe(true); // (2,2) center
    expect(isDiagonalNode(24)).toBe(true); // (4,4)
  });

  it('verifies adjacency graph structure', () => {
    // Node 0 (corner): orthogonal to 1, 5; diagonal to 6
    expect(ADJACENCY_LIST[0]).toContain(1);
    expect(ADJACENCY_LIST[0]).toContain(5);
    expect(ADJACENCY_LIST[0]).toContain(6);
    expect(ADJACENCY_LIST[0].length).toBe(3);

    // Node 1 (non-diagonal edge): orthogonal to 0, 2, 6; no diagonals
    expect(ADJACENCY_LIST[1]).toContain(0);
    expect(ADJACENCY_LIST[1]).toContain(2);
    expect(ADJACENCY_LIST[1]).toContain(6);
    expect(ADJACENCY_LIST[1].length).toBe(3);
  });

  it('prevents sheep movement during PLACEMENT phase', () => {
    const board = createInitialBoard();
    board[6] = 'SHEEP';
    const moves = getValidMovesForNode(board, 6, 'PLACEMENT', 'SHEEP');
    expect(moves.length).toBe(0);
  });

  it('allows lion step moves and jump captures', () => {
    const board = Array(25).fill(null);
    board[0] = 'LION';
    board[1] = 'SHEEP'; // adjacent sheep
    // Node 2 is empty

    const moves = getValidMovesForNode(board, 0, 'PLACEMENT', 'LION');
    // Step move to 5 (down), step move to 6 (diag down-right), capture to 2 over 1
    const captureMove = moves.find((m) => m.type === 'CAPTURE');
    expect(captureMove).toBeDefined();
    expect(captureMove.from).toBe(0);
    expect(captureMove.to).toBe(2);
    expect(captureMove.capturedNode).toBe(1);
  });

  it('detects game over when lions reach WINNING_CAPTURES', () => {
    const board = createInitialBoard();
    expect(evaluateGameStatus(board, 10, 4)).toBe('IN_PROGRESS');
    expect(evaluateGameStatus(board, 10, WINNING_CAPTURES)).toBe('LIONS_WON');
  });

  it('detects game over when all lions are trapped', () => {
    const board = Array(25).fill(null);
    // Surround corner lion at node 0
    board[0] = 'LION';
    board[1] = 'SHEEP';
    board[5] = 'SHEEP';
    board[6] = 'SHEEP';
    // Block jump landing spots (2, 10, 12)
    board[2] = 'SHEEP';
    board[10] = 'SHEEP';
    board[12] = 'SHEEP';

    // Surround other corner lions similarly or clear them
    // areLionsTrapped returns true if all lions on board have no legal moves
    expect(areLionsTrapped(board)).toBe(true);
    expect(evaluateGameStatus(board, 0, 0)).toBe('SHEEP_WON');
  });
});

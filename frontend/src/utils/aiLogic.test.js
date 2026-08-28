import { describe, it, expect } from 'vitest';
import { getBestAiMove, getAllValidMoves, evaluateBoard } from './aiLogic';
import { createInitialBoard, TOTAL_SHEEP_RESERVE } from './gameLogic';

describe('Bagh-Chal AI Bot Logic (Frontend)', () => {
  it('generates valid placement moves for Sheep', () => {
    const board = createInitialBoard();
    const moves = getAllValidMoves(board, 'PLACEMENT', 'SHEEP', TOTAL_SHEEP_RESERVE);
    expect(moves.length).toBe(21); // 25 total - 4 lions
    expect(moves[0].type).toBe('PLACE');
  });

  it('selects valid AI move for Lion', () => {
    const board = createInitialBoard();
    const aiMove = getBestAiMove(board, 'PLACEMENT', 'LION', TOTAL_SHEEP_RESERVE, 0, 'MEDIUM');
    expect(aiMove).toBeDefined();
    expect(aiMove.from).not.toBeNull();
    expect(['MOVE', 'CAPTURE']).toContain(aiMove.type);
  });

  it('prioritizes capture when available in HARD difficulty', () => {
    const board = Array(25).fill(null);
    board[0] = 'LION';
    board[1] = 'SHEEP'; // adjacent sheep
    // Node 2 is empty

    const aiMove = getBestAiMove(board, 'MOVEMENT', 'LION', 0, 0, 'HARD');
    expect(aiMove).toBeDefined();
    expect(aiMove.type).toBe('CAPTURE');
    expect(aiMove.from).toBe(0);
    expect(aiMove.to).toBe(2);
    expect(aiMove.capturedNode).toBe(1);
  });

  it('evaluates board advantage accurately', () => {
    const board = createInitialBoard();
    const initialScore = evaluateBoard(board, 'PLACEMENT', TOTAL_SHEEP_RESERVE, 0);
    const wonScore = evaluateBoard(board, 'PLACEMENT', TOTAL_SHEEP_RESERVE, 5);
    expect(wonScore).toBeGreaterThan(initialScore);
    expect(wonScore).toBe(10000);
  });
});

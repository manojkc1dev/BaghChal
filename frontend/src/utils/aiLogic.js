import {
  getValidMovesForNode,
  evaluateGameStatus,
  TOTAL_NODES,
} from './gameLogic';

/**
 * Frontend JavaScript Minimax AI Engine for Bagh-Chal
 * Supports EASY, MEDIUM, HARD difficulty levels
 */

export function getAllValidMoves(board, gamePhase, currentTurn, unplacedSheep) {
  const moves = [];

  if (currentTurn === 'SHEEP' && gamePhase === 'PLACEMENT') {
    if (unplacedSheep > 0) {
      for (let node = 0; node < TOTAL_NODES; node++) {
        if (board[node] === null) {
          moves.push({ type: 'PLACE', from: null, to: node });
        }
      }
    }
    return moves;
  }

  for (let node = 0; node < TOTAL_NODES; node++) {
    if (board[node] === currentTurn) {
      const nodeMoves = getValidMovesForNode(board, node, gamePhase, currentTurn);
      moves.push(...nodeMoves);
    }
  }

  return moves;
}

export function evaluateBoard(board, gamePhase, unplacedSheep, capturedSheep) {
  const status = evaluateGameStatus(board, unplacedSheep, capturedSheep);
  if (status === 'LIONS_WON') return 10000;
  if (status === 'SHEEP_WON') return -10000;

  let score = 0;

  // 1. Captured sheep score
  score += capturedSheep * 300;

  // 2. Lion mobility & trap penalty
  let lionMoves = 0;
  let trappedLions = 0;
  for (let id = 0; id < TOTAL_NODES; id++) {
    if (board[id] === 'LION') {
      const moves = getValidMovesForNode(board, id, 'MOVEMENT', 'LION');
      lionMoves += moves.length;
      if (moves.length === 0) trappedLions++;
    }
  }

  score += lionMoves * 12;
  score -= trappedLions * 350;

  // 3. Sheep count on board
  const sheepCount = board.filter((p) => p === 'SHEEP').length;
  score -= sheepCount * 15;

  return score;
}

function applyMoveSimulated(board, gamePhase, currentTurn, unplacedSheep, capturedSheep, move) {
  const newBoard = [...board];
  let newUnplaced = unplacedSheep;
  let newCaptured = capturedSheep;
  let nextPhase = gamePhase;

  if (move.type === 'PLACE') {
    newBoard[move.to] = 'SHEEP';
    newUnplaced -= 1;
    if (newUnplaced === 0) nextPhase = 'MOVEMENT';
  } else if (move.type === 'MOVE' || move.type === 'CAPTURE') {
    const piece = newBoard[move.from];
    newBoard[move.from] = null;
    newBoard[move.to] = piece;

    if (move.type === 'CAPTURE' && move.capturedNode !== undefined) {
      newBoard[move.capturedNode] = null;
      newCaptured += 1;
    }
  }

  const nextTurn = currentTurn === 'SHEEP' ? 'LION' : 'SHEEP';
  const nextStatus = evaluateGameStatus(newBoard, newUnplaced, newCaptured);

  return {
    board: newBoard,
    gamePhase: nextPhase,
    currentTurn: nextTurn,
    unplacedSheep: newUnplaced,
    capturedSheep: newCaptured,
    gameStatus: nextStatus,
  };
}

function minimax(board, gamePhase, currentTurn, unplacedSheep, capturedSheep, depth, alpha, beta) {
  const status = evaluateGameStatus(board, unplacedSheep, capturedSheep);
  if (depth === 0 || status !== 'IN_PROGRESS') {
    return { score: evaluateBoard(board, gamePhase, unplacedSheep, capturedSheep), move: null };
  }

  const validMoves = getAllValidMoves(board, gamePhase, currentTurn, unplacedSheep);
  if (validMoves.length === 0) {
    return { score: evaluateBoard(board, gamePhase, unplacedSheep, capturedSheep), move: null };
  }

  // Prioritize CAPTURE moves for faster Alpha-Beta pruning cutoff
  validMoves.sort((a) => (a.type === 'CAPTURE' ? -1 : 1));

  let bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];

  if (currentTurn === 'LION') {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      const sim = applyMoveSimulated(board, gamePhase, currentTurn, unplacedSheep, capturedSheep, move);
      const res = minimax(sim.board, sim.gamePhase, sim.currentTurn, sim.unplacedSheep, sim.capturedSheep, depth - 1, alpha, beta);
      if (res.score > maxEval) {
        maxEval = res.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, res.score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      const sim = applyMoveSimulated(board, gamePhase, currentTurn, unplacedSheep, capturedSheep, move);
      const res = minimax(sim.board, sim.gamePhase, sim.currentTurn, sim.unplacedSheep, sim.capturedSheep, depth - 1, alpha, beta);
      if (res.score < minEval) {
        minEval = res.score;
        bestMove = move;
      }
      beta = Math.min(beta, res.score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

export function getBestAiMove(board, gamePhase, currentTurn, unplacedSheep, capturedSheep, difficulty = 'MEDIUM') {
  const diffUpper = (difficulty || 'MEDIUM').toUpperCase();
  const depth = diffUpper === 'EASY' ? 1 : diffUpper === 'HARD' ? 3 : 2;

  const validMoves = getAllValidMoves(board, gamePhase, currentTurn, unplacedSheep);
  if (validMoves.length === 0) return null;

  if (diffUpper === 'EASY') {
    // Easy: Pick random legal move, with 50% preference for capture if available
    const captures = validMoves.filter((m) => m.type === 'CAPTURE');
    if (captures.length > 0 && Math.random() < 0.5) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  const { move } = minimax(board, gamePhase, currentTurn, unplacedSheep, capturedSheep, depth, -Infinity, Infinity);
  return move || validMoves[0];
}

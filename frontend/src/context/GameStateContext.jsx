import React, { createContext, useContext, useReducer } from 'react';
import {
  createInitialBoard,
  getValidMovesForNode,
  evaluateGameStatus,
  TOTAL_SHEEP_RESERVE,
} from '../utils/gameLogic';

const GameStateContext = createContext(null);

const initialState = {
  board: createInitialBoard(),
  currentTurn: 'SHEEP', // Sheep places/moves first
  gamePhase: 'PLACEMENT', // 'PLACEMENT' | 'MOVEMENT'
  unplacedSheep: TOTAL_SHEEP_RESERVE, // 20
  capturedSheep: 0,
  selectedNode: null,
  validMoves: [], // Array of { type: 'MOVE'|'CAPTURE', to: number, capturedNode?: number }
  gameStatus: 'IN_PROGRESS', // 'IN_PROGRESS' | 'LIONS_WON' | 'SHEEP_WON'
  moveHistory: [],
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_NODE': {
      const { nodeId } = action.payload;

      // Ignore selection if game is over
      if (state.gameStatus !== 'IN_PROGRESS') return state;

      const piece = state.board[nodeId];

      // Clicking an empty node during PLACEMENT when Sheep turn => Place Sheep!
      if (
        state.gamePhase === 'PLACEMENT' &&
        state.currentTurn === 'SHEEP' &&
        piece === null
      ) {
        const newBoard = [...state.board];
        newBoard[nodeId] = 'SHEEP';

        const remainingReserve = state.unplacedSheep - 1;
        const nextPhase = remainingReserve === 0 ? 'MOVEMENT' : 'PLACEMENT';
        const nextTurn = 'LION';

        const nextStatus = evaluateGameStatus(newBoard, remainingReserve, state.capturedSheep);

        return {
          ...state,
          board: newBoard,
          unplacedSheep: remainingReserve,
          gamePhase: nextPhase,
          currentTurn: nextTurn,
          selectedNode: null,
          validMoves: [],
          gameStatus: nextStatus,
          moveHistory: [
            ...state.moveHistory,
            { type: 'PLACE', piece: 'SHEEP', to: nodeId, turn: 'SHEEP' },
          ],
        };
      }

      // If clicking current player's piece, toggle selection and compute valid moves
      if (piece === state.currentTurn) {
        // Toggle off if already selected
        if (state.selectedNode === nodeId) {
          return { ...state, selectedNode: null, validMoves: [] };
        }

        const validMoves = getValidMovesForNode(
          state.board,
          nodeId,
          state.gamePhase,
          state.currentTurn
        );

        return {
          ...state,
          selectedNode: nodeId,
          validMoves,
        };
      }

      // If clicking a valid target node while a piece is selected => Execute Move
      if (state.selectedNode !== null) {
        const targetMove = state.validMoves.find((m) => m.to === nodeId);
        if (targetMove) {
          return executeMoveHelper(state, state.selectedNode, targetMove);
        }
      }

      // Default deselect
      return { ...state, selectedNode: null, validMoves: [] };
    }

    case 'EXECUTE_MOVE': {
      const { from, targetMove } = action.payload;
      return executeMoveHelper(state, from, targetMove);
    }

    case 'DESELECT': {
      return { ...state, selectedNode: null, validMoves: [] };
    }

    case 'RESET_GAME': {
      return {
        ...initialState,
        board: createInitialBoard(),
      };
    }

    default:
      return state;
  }
}

// Helper to update board state after a move or capture
function executeMoveHelper(state, from, targetMove) {
  const newBoard = [...state.board];
  const movingPiece = newBoard[from];

  newBoard[from] = null;
  newBoard[targetMove.to] = movingPiece;

  let newCapturedCount = state.capturedSheep;
  if (targetMove.type === 'CAPTURE' && targetMove.capturedNode !== undefined) {
    newBoard[targetMove.capturedNode] = null; // Remove captured sheep
    newCapturedCount += 1;
  }

  const nextTurn = state.currentTurn === 'SHEEP' ? 'LION' : 'SHEEP';
  const nextStatus = evaluateGameStatus(newBoard, state.unplacedSheep, newCapturedCount);

  return {
    ...state,
    board: newBoard,
    capturedSheep: newCapturedCount,
    currentTurn: nextTurn,
    selectedNode: null,
    validMoves: [],
    gameStatus: nextStatus,
    moveHistory: [
      ...state.moveHistory,
      {
        type: targetMove.type,
        piece: movingPiece,
        from,
        to: targetMove.to,
        capturedNode: targetMove.capturedNode,
        turn: state.currentTurn,
      },
    ],
  };
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  createInitialBoard,
  getValidMovesForNode,
  evaluateGameStatus,
  TOTAL_SHEEP_RESERVE,
} from '../utils/gameLogic';
import { useWebSocket } from '../hooks/useWebSocket';

const GameStateContext = createContext(null);

const initialState = {
  mode: 'LOCAL', // 'LOCAL' | 'PVAI' | 'PVP'
  aiRole: 'LION', // 'LION' | 'SHEEP' (AI plays as Lion by default in PVAI)
  roomName: 'room-1',
  board: createInitialBoard(),
  currentTurn: 'SHEEP',
  gamePhase: 'PLACEMENT',
  unplacedSheep: TOTAL_SHEEP_RESERVE,
  capturedSheep: 0,
  selectedNode: null,
  validMoves: [],
  gameStatus: 'IN_PROGRESS',
  moveHistory: [],
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE': {
      return {
        ...state,
        mode: action.payload.mode,
        aiRole: action.payload.aiRole || state.aiRole,
        selectedNode: null,
        validMoves: [],
      };
    }

    case 'SET_ROOM': {
      return {
        ...state,
        roomName: action.payload.roomName,
        selectedNode: null,
        validMoves: [],
      };
    }

    case 'SYNC_SERVER_STATE': {
      const serverState = action.payload;
      if (!serverState) return state;

      let validMoves = state.validMoves;
      if (state.selectedNode !== null) {
        validMoves = getValidMovesForNode(
          serverState.board,
          state.selectedNode,
          serverState.game_phase,
          serverState.current_turn
        );
      }

      return {
        ...state,
        board: serverState.board,
        gamePhase: serverState.game_phase,
        currentTurn: serverState.current_turn,
        unplacedSheep: serverState.unplaced_sheep,
        capturedSheep: serverState.captured_sheep,
        gameStatus: serverState.game_status,
        moveHistory: serverState.move_history || [],
        validMoves,
      };
    }

    case 'SELECT_NODE': {
      const { nodeId } = action.payload;
      if (state.gameStatus !== 'IN_PROGRESS') return state;

      const piece = state.board[nodeId];

      // Local Placement Phase
      if (
        state.gamePhase === 'PLACEMENT' &&
        state.currentTurn === 'SHEEP' &&
        piece === null
      ) {
        const moveObj = { type: 'PLACE', from: null, to: nodeId };
        return applyLocalMove(state, moveObj);
      }

      // Select piece
      if (piece === state.currentTurn) {
        if (state.selectedNode === nodeId) {
          return { ...state, selectedNode: null, validMoves: [] };
        }
        const validMoves = getValidMovesForNode(
          state.board,
          nodeId,
          state.gamePhase,
          state.currentTurn
        );
        return { ...state, selectedNode: nodeId, validMoves };
      }

      // Move execution
      if (state.selectedNode !== null) {
        const targetMove = state.validMoves.find((m) => m.to === nodeId);
        if (targetMove) {
          return applyLocalMove(state, targetMove);
        }
      }

      return { ...state, selectedNode: null, validMoves: [] };
    }

    case 'RESET_GAME': {
      return {
        ...state,
        board: createInitialBoard(),
        currentTurn: 'SHEEP',
        gamePhase: 'PLACEMENT',
        unplacedSheep: TOTAL_SHEEP_RESERVE,
        capturedSheep: 0,
        selectedNode: null,
        validMoves: [],
        gameStatus: 'IN_PROGRESS',
        moveHistory: [],
      };
    }

    default:
      return state;
  }
}

function applyLocalMove(state, targetMove) {
  const newBoard = [...state.board];
  let newUnplaced = state.unplacedSheep;
  let newCaptured = state.capturedSheep;
  let nextPhase = state.gamePhase;

  if (targetMove.type === 'PLACE') {
    newBoard[targetMove.to] = 'SHEEP';
    newUnplaced -= 1;
    if (newUnplaced === 0) nextPhase = 'MOVEMENT';
  } else if (targetMove.type === 'MOVE' || targetMove.type === 'CAPTURE') {
    const movingPiece = newBoard[targetMove.from];
    newBoard[targetMove.from] = null;
    newBoard[targetMove.to] = movingPiece;

    if (targetMove.type === 'CAPTURE' && targetMove.capturedNode !== undefined) {
      newBoard[targetMove.capturedNode] = null;
      newCaptured += 1;
    }
  }

  const nextTurn = state.currentTurn === 'SHEEP' ? 'LION' : 'SHEEP';
  const nextStatus = evaluateGameStatus(newBoard, newUnplaced, newCaptured);

  return {
    ...state,
    board: newBoard,
    gamePhase: nextPhase,
    currentTurn: nextTurn,
    unplacedSheep: newUnplaced,
    capturedSheep: newCaptured,
    gameStatus: nextStatus,
    selectedNode: null,
    validMoves: [],
    moveHistory: [
      ...state.moveHistory,
      { ...targetMove, piece: state.currentTurn },
    ],
  };
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { isConnected, serverState, sendAction } = useWebSocket(state.roomName);

  // Sync server state when connected in PVP or PVAI mode
  useEffect(() => {
    if ((state.mode === 'PVP' || state.mode === 'PVAI') && serverState) {
      dispatch({ type: 'SYNC_SERVER_STATE', payload: serverState });
    }
  }, [serverState, state.mode]);

  // Dispatch helper wrapping local reducer or server WebSocket calls
  const enhancedDispatch = (action) => {
    if ((state.mode === 'PVP' || state.mode === 'PVAI') && isConnected) {
      if (action.type === 'SELECT_NODE') {
        const { nodeId } = action.payload;
        // Compute valid move or execute
        if (state.selectedNode !== null) {
          const targetMove = state.validMoves.find((m) => m.to === nodeId);
          if (targetMove) {
            sendAction('MAKE_MOVE', { move: targetMove });
            dispatch({ type: 'SELECT_NODE', payload: action.payload });
            return;
          }
        }
        if (state.gamePhase === 'PLACEMENT' && state.currentTurn === 'SHEEP' && state.board[nodeId] === null) {
          sendAction('MAKE_MOVE', { move: { type: 'PLACE', from: null, to: nodeId } });
          return;
        }
      } else if (action.type === 'SET_MODE') {
        sendAction('SELECT_MODE', { mode: action.payload.mode, ai_role: action.payload.aiRole || 'LION' });
      } else if (action.type === 'RESET_GAME') {
        sendAction('RESET_GAME');
      }
    }
    dispatch(action);
  };

  return (
    <GameStateContext.Provider
      value={{
        state,
        dispatch: enhancedDispatch,
        isConnected,
        serverState,
      }}
    >
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

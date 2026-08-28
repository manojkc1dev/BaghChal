import React, { createContext, useReducer, useEffect } from 'react';
import {
  createInitialBoard,
  getValidMovesForNode,
  evaluateGameStatus,
  TOTAL_SHEEP_RESERVE,
} from '../utils/gameLogic';
import { useWebSocket } from '../hooks/useWebSocket';
import { playMoveSound, playCaptureSound, playVictorySound } from '../utils/sound';

const GameStateContext = createContext(null);

const initialState = {
  mode: 'LOCAL', // 'LOCAL' | 'PVAI' | 'PVP'
  aiRole: 'LION', // 'LION' | 'SHEEP' (AI plays as Lion by default in PVAI)
  aiDifficulty: 'MEDIUM', // 'EASY' | 'MEDIUM' | 'HARD'
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
        aiDifficulty: action.payload.aiDifficulty || state.aiDifficulty,
        selectedNode: null,
        validMoves: [],
      };
    }

    case 'SET_DIFFICULTY': {
      return {
        ...state,
        aiDifficulty: action.payload.aiDifficulty,
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

      // Play sound on server update if move count changed
      if (serverState.move_history && serverState.move_history.length > state.moveHistory.length) {
        const lastMove = serverState.move_history[serverState.move_history.length - 1];
        if (lastMove && lastMove.type === 'CAPTURE') {
          playCaptureSound();
        } else {
          playMoveSound();
        }
      }

      if (serverState.game_status !== 'IN_PROGRESS' && state.gameStatus === 'IN_PROGRESS') {
        playVictorySound();
      }

      return {
        ...state,
        board: serverState.board,
        gamePhase: serverState.game_phase,
        currentTurn: serverState.current_turn,
        unplacedSheep: serverState.unplaced_sheep,
        capturedSheep: serverState.captured_sheep,
        gameStatus: serverState.game_status,
        aiDifficulty: serverState.ai_difficulty || state.aiDifficulty,
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
    playMoveSound();
  } else if (targetMove.type === 'MOVE' || targetMove.type === 'CAPTURE') {
    const movingPiece = newBoard[targetMove.from];
    newBoard[targetMove.from] = null;
    newBoard[targetMove.to] = movingPiece;

    if (targetMove.type === 'CAPTURE' && targetMove.capturedNode !== undefined) {
      newBoard[targetMove.capturedNode] = null;
      newCaptured += 1;
      playCaptureSound();
    } else {
      playMoveSound();
    }
  }

  const nextTurn = state.currentTurn === 'SHEEP' ? 'LION' : 'SHEEP';
  const nextStatus = evaluateGameStatus(newBoard, newUnplaced, newCaptured);

  if (nextStatus !== 'IN_PROGRESS') {
    playVictorySound();
  }

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
        // If a move is already selected and this is a valid target, send to server
        if (state.selectedNode !== null) {
          const targetMove = state.validMoves.find((m) => m.to === nodeId);
          if (targetMove) {
            sendAction('MAKE_MOVE', { move: targetMove });
            dispatch({ type: 'SELECT_NODE', payload: action.payload });
            return;
          }
        }
        // Placement phase: send to server and update local state optimistically
        if (state.gamePhase === 'PLACEMENT' && state.currentTurn === 'SHEEP' && state.board[nodeId] === null) {
          sendAction('MAKE_MOVE', { move: { type: 'PLACE', from: null, to: nodeId } });
          dispatch({ type: 'SELECT_NODE', payload: action.payload }); // update local state too
          return;
        }
        // Otherwise (selecting a piece), just update local selection
        dispatch(action);
        return;
      } else if (action.type === 'SET_MODE') {
        sendAction('SELECT_MODE', {
          mode: action.payload.mode,
          ai_role: action.payload.aiRole || 'LION',
          ai_difficulty: action.payload.aiDifficulty || state.aiDifficulty,
        });
      } else if (action.type === 'SET_DIFFICULTY') {
        sendAction('SELECT_MODE', {
          mode: state.mode,
          ai_role: state.aiRole,
          ai_difficulty: action.payload.aiDifficulty,
        });
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

export { GameStateContext };



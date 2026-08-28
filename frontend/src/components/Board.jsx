import React from 'react';
import Node from './Node';
import { useGameState } from '../hooks/useGameState';
import { nodeToCoord, TOTAL_NODES } from '../utils/gameLogic';

/**
 * Math & Layout Breakdown:
 * Board ViewBox size = 400 x 400 pixels
 * Outer Margin = 30px
 * Step distance = 85px
 * Node (r, c) => X = 30 + c * 85, Y = 30 + r * 85
 * Range: (30, 30) for node 0 up to (370, 370) for node 24.
 */

const MARGIN = 30;
const STEP = 85;
const VIEWBOX_SIZE = 400;

function getCoordPx(r, c) {
  return {
    x: MARGIN + c * STEP,
    y: MARGIN + r * STEP,
  };
}

export default function Board() {
  const { state, dispatch } = useGameState();
  const { board, selectedNode, validMoves, gamePhase, currentTurn, mode, aiRole, gameStatus } = state;

  const isHumanTurn =
    gameStatus === 'IN_PROGRESS' &&
    (mode === 'LOCAL' || (mode === 'PVAI' && currentTurn !== aiRole) || mode === 'PVP');

  const displayValidMoves = (selectedNode !== null && isHumanTurn) ? validMoves : [];

  const handleNodeClick = (nodeId) => {
    if (!isHumanTurn) return;
    dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
  };

  // Pre-generate grid coordinates for nodes
  const nodePositions = [];
  for (let id = 0; id < TOTAL_NODES; id++) {
    const { row, col } = nodeToCoord(id);
    nodePositions.push({ id, row, col, ...getCoordPx(row, col) });
  }

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto p-4 sm:p-6 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl flex items-center justify-center select-none">
      
      {/* Decorative Outer Border Glow */}
      <div className="absolute inset-2 sm:inset-3 rounded-2xl border border-amber-500/20 pointer-events-none shadow-[inset_0_0_30px_rgba(245,158,11,0.05)]" />

      {/* SVG Board Graphic Lines */}
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="w-full h-full absolute inset-0 p-4 sm:p-6 stroke-slate-600/70"
        strokeWidth="3.5"
        strokeLinecap="round"
      >
        {/* 1. Horizontal Grid Lines (5 lines) */}
        {[0, 1, 2, 3, 4].map((r) => {
          const p1 = getCoordPx(r, 0);
          const p2 = getCoordPx(r, 4);
          return (
            <line
              key={`h-${r}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
            />
          );
        })}

        {/* 2. Vertical Grid Lines (5 lines) */}
        {[0, 1, 2, 3, 4].map((c) => {
          const p1 = getCoordPx(0, c);
          const p2 = getCoordPx(4, c);
          return (
            <line
              key={`v-${c}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
            />
          );
        })}

        {/* 3. Main Diagonal Lines (Big X across whole board) */}
        {/* Top-Left (0,0) to Bottom-Right (4,4) */}
        <line
          x1={getCoordPx(0, 0).x}
          y1={getCoordPx(0, 0).y}
          x2={getCoordPx(4, 4).x}
          y2={getCoordPx(4, 4).y}
          className="stroke-amber-500/30"
          strokeWidth="3"
        />
        {/* Top-Right (0,4) to Bottom-Left (4,0) */}
        <line
          x1={getCoordPx(0, 4).x}
          y1={getCoordPx(0, 4).y}
          x2={getCoordPx(4, 0).x}
          y2={getCoordPx(4, 0).y}
          className="stroke-amber-500/30"
          strokeWidth="3"
        />

        {/* 4. Alquerque Inner Diamond Lines */}
        {/* Top-Center (0,2) to Middle-Left (2,0) */}
        <line
          x1={getCoordPx(0, 2).x}
          y1={getCoordPx(0, 2).y}
          x2={getCoordPx(2, 0).x}
          y2={getCoordPx(2, 0).y}
          className="stroke-amber-500/30"
          strokeWidth="3"
        />
        {/* Top-Center (0,2) to Middle-Right (2,4) */}
        <line
          x1={getCoordPx(0, 2).x}
          y1={getCoordPx(0, 2).y}
          x2={getCoordPx(2, 4).x}
          y2={getCoordPx(2, 4).y}
          className="stroke-amber-500/30"
          strokeWidth="3"
        />
        {/* Middle-Left (2,0) to Bottom-Center (4,2) */}
        <line
          x1={getCoordPx(2, 0).x}
          y1={getCoordPx(2, 0).y}
          x2={getCoordPx(4, 2).x}
          y2={getCoordPx(4, 2).y}
          className="stroke-amber-500/30"
          strokeWidth="3"
        />
        {/* Middle-Right (2,4) to Bottom-Center (4,2) */}
        <line
          x1={getCoordPx(2, 4).x}
          y1={getCoordPx(2, 4).y}
          x2={getCoordPx(4, 2).x}
          y2={getCoordPx(4, 2).y}
          className="stroke-amber-500/30"
          strokeWidth="3"
        />
      </svg>

      {/* HTML Absolute Overlay for Interactive 25 Nodes */}
      <div className="absolute inset-0 p-4 sm:p-6 pointer-events-none">
        <div className="relative w-full h-full">
          {nodePositions.map((pos) => {
            const piece = board[pos.id];
            const isSelected = selectedNode === pos.id;
            const targetMove = displayValidMoves.find((m) => m.to === pos.id);
            const isValidTarget = Boolean(targetMove);

            // Convert SVG viewBox % coordinates to CSS percentages
            const leftPercent = (pos.x / VIEWBOX_SIZE) * 100;
            const topPercent = (pos.y / VIEWBOX_SIZE) * 100;

            return (
              <div
                key={pos.id}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              >
                <Node
                  nodeId={pos.id}
                  piece={piece}
                  isSelected={isSelected}
                  isValidTarget={isValidTarget}
                  targetMoveType={targetMove ? targetMove.type : null}
                  onClick={() => handleNodeClick(pos.id)}
                  gamePhase={gamePhase}
                  currentTurn={currentTurn}
                  isHumanTurn={isHumanTurn}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

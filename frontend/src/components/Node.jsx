import React from 'react';
import Piece from './Piece';

export default function Node({
  nodeId,
  piece,
  isSelected,
  isValidTarget,
  targetMoveType, // 'MOVE' | 'CAPTURE' | null
  onClick,
  gamePhase,
  currentTurn,
}) {
  const isPlacementTarget =
    gamePhase === 'PLACEMENT' && currentTurn === 'SHEEP' && piece === null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Node ${nodeId} ${piece ? `occupied by ${piece}` : 'empty'}`}
      className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full focus:outline-none transition-transform duration-200 cursor-pointer group ${
        isSelected ? 'z-20' : 'z-10'
      }`}
    >
      {/* Target Marker for valid destination */}
      {isValidTarget && targetMoveType === 'MOVE' && (
        <div className="absolute inset-1 sm:inset-2 rounded-full border-2 border-emerald-400 bg-emerald-500/20 animate-pulse flex items-center justify-center z-10">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/80" />
        </div>
      )}

      {isValidTarget && targetMoveType === 'CAPTURE' && (
        <div className="absolute -inset-1 rounded-full border-2 border-amber-400 bg-red-600/30 animate-bounce flex items-center justify-center z-10">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-400 border border-red-600 shadow-lg shadow-red-500/90 animate-pulse" />
        </div>
      )}

      {/* Placement Phase hover highlight for Sheep */}
      {isPlacementTarget && !isValidTarget && (
        <div className="absolute inset-2 rounded-full border border-sky-400/40 bg-sky-400/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400/60" />
        </div>
      )}

      {/* Intersection Node Point (Base visual) */}
      {!piece && !isValidTarget && (
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-700/80 border border-slate-500/50 shadow-inner group-hover:bg-slate-400 group-hover:border-slate-300 transition-colors" />
      )}

      {/* Piece Component */}
      {piece && (
        <Piece type={piece} isSelected={isSelected} />
      )}
    </button>
  );
}

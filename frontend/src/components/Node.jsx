import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  isHumanTurn = true,
}) {
  const isPlacementTarget =
    isHumanTurn && gamePhase === 'PLACEMENT' && currentTurn === 'SHEEP' && piece === null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Node ${nodeId} ${piece ? `occupied by ${piece}` : 'empty'}`}
      className={`relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full focus:outline-none cursor-pointer group ${
        isSelected ? 'z-30' : 'z-10'
      }`}
    >
      <AnimatePresence mode="wait">
        {/* Subtle Destination Indicator for valid MOVE (ONLY shown for selected piece) */}
        {isHumanTurn && isValidTarget && targetMoveType === 'MOVE' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.9, 1.1, 0.9], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute z-10 pointer-events-none flex items-center justify-center"
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </motion.div>
        )}

        {/* Subtle Target Marker for valid LION JUMP CAPTURE (ONLY shown for selected piece) */}
        {isHumanTurn && isValidTarget && targetMoveType === 'CAPTURE' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.9, 1.15, 0.9], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute z-10 pointer-events-none flex items-center justify-center"
          >
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 border-2 border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle hover dot during Placement Phase (only on mouse hover, zero persistent rings) */}
      {isPlacementTarget && !isValidTarget && (
        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-sky-400/80 shadow-[0_0_4px_rgba(56,189,248,0.8)]" />
        </div>
      )}

      {/* Standard Intersection Node Point (Graph Base) */}
      {!piece && !isValidTarget && (
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-700/80 border border-slate-500/50 shadow-inner group-hover:bg-slate-400 group-hover:border-slate-300 transition-colors" />
      )}

      {/* Piece Component */}
      {piece && (
        <Piece type={piece} isSelected={isSelected} />
      )}
    </button>
  );
}

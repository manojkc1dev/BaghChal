import React from 'react';
import { useGameState } from '../context/GameStateContext';
import { WINNING_CAPTURES, TOTAL_SHEEP_RESERVE } from '../utils/gameLogic';

export default function Scoreboard() {
  const { state, dispatch } = useGameState();
  const {
    currentTurn,
    gamePhase,
    unplacedSheep,
    capturedSheep,
    gameStatus,
  } = state;

  const placedSheep = TOTAL_SHEEP_RESERVE - unplacedSheep;

  return (
    <div className="w-full max-w-[500px] mx-auto space-y-4">
      {/* Active Status Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4">
        
        {/* Top Row: Turn Banner & Phase Badge */}
        <div className="flex items-center justify-between">
          
          {/* Turn Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                currentTurn === 'SHEEP'
                  ? 'bg-sky-400 shadow-lg shadow-sky-400/80'
                  : 'bg-red-500 shadow-lg shadow-red-500/80'
              }`}
            />
            <span className="text-sm sm:text-base font-semibold tracking-wide text-slate-200">
              Current Turn:
              <span
                className={`ml-2 font-bold uppercase tracking-wider ${
                  currentTurn === 'SHEEP' ? 'text-sky-300' : 'text-red-400'
                }`}
              >
                {currentTurn}
              </span>
            </span>
          </div>

          {/* Phase Badge */}
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 tracking-wider uppercase">
            {gamePhase} Phase
          </div>
        </div>

        {/* Stats Row: Sheep Reserve & Captured Sheep */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          
          {/* Sheep Placement Stats */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
              Sheep in Reserve
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-sky-400">
                {unplacedSheep}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ 20</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-300"
                style={{ width: `${(placedSheep / TOTAL_SHEEP_RESERVE) * 100}%` }}
              />
            </div>
          </div>

          {/* Lion Capture Stats */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
              Captured Sheep
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-red-500">
                {capturedSheep}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / {WINNING_CAPTURES}
              </span>
            </div>
            {/* Capture indicators */}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: WINNING_CAPTURES }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-1.5 rounded-full transition-all ${
                    i < capturedSheep
                      ? 'bg-red-500 shadow-sm shadow-red-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Game Over Victory Overlay Modal */}
      {gameStatus !== 'IN_PROGRESS' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-slate-800 border border-slate-700">
              {gameStatus === 'SHEEP_WON' ? (
                <span className="text-3xl">🐑</span>
              ) : (
                <span className="text-3xl">🦁</span>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                {gameStatus === 'SHEEP_WON'
                  ? 'Sheep Victory!'
                  : 'Lions Victory!'}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {gameStatus === 'SHEEP_WON'
                  ? 'All Lions have been completely trapped and surrounded!'
                  : 'Lions have successfully captured 5 sheep!'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET_GAME' })}
              className="w-full py-3 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

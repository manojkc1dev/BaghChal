import React from 'react';
import { useGameState } from '../context/GameStateContext';
import { WINNING_CAPTURES, TOTAL_SHEEP_RESERVE } from '../utils/gameLogic';
import { Cpu, Users, Monitor, Wifi, WifiOff } from 'lucide-react';

export default function Scoreboard() {
  const { state, dispatch, isConnected } = useGameState();
  const {
    mode,
    currentTurn,
    gamePhase,
    unplacedSheep,
    capturedSheep,
    gameStatus,
    roomName,
  } = state;

  const placedSheep = TOTAL_SHEEP_RESERVE - unplacedSheep;

  const handleModeSelect = (newMode) => {
    dispatch({ type: 'SET_MODE', payload: { mode: newMode } });
  };

  return (
    <div className="w-full max-w-[500px] mx-auto space-y-4">
      
      {/* Mode Selection Tabs & Connection Badge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:p-3 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        
        {/* Mode Buttons */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleModeSelect('LOCAL')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'LOCAL'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Local</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSelect('PVAI')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'PVAI'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Vs AI Bot</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSelect('PVP')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'PVP'
                ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Online PVP</span>
          </button>
        </div>

        {/* Connection Status Badge */}
        <div className="flex items-center gap-2 text-xs">
          {mode !== 'LOCAL' ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
              <span className="font-mono">{isConnected ? 'WS Connected' : 'Offline'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400">
              <span className="font-mono">Offline Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Status Dashboard */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4">
        
        {/* Turn Banner & Phase Badge */}
        <div className="flex items-center justify-between">
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

          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 tracking-wider uppercase">
            {gamePhase} Phase
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
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
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-300"
                style={{ width: `${(placedSheep / TOTAL_SHEEP_RESERVE) * 100}%` }}
              />
            </div>
          </div>

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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
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

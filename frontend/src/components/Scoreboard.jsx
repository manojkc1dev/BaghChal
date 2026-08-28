import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { WINNING_CAPTURES, TOTAL_SHEEP_RESERVE } from '../utils/gameLogic';
import { Cpu, Users, Monitor, Wifi, WifiOff, Trophy, Crown, Swords, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toggleSound, isSoundEnabled } from '../utils/sound';

export default function Scoreboard() {
  const { state, dispatch, isConnected } = useGameState();
  const {
    mode,
    currentTurn,
    gamePhase,
    unplacedSheep,
    capturedSheep,
    gameStatus,
  } = state;

  const confettiFiredRef = useRef(false);
  const placedSheep = TOTAL_SHEEP_RESERVE - unplacedSheep;

  // Fire confetti when game is won
  useEffect(() => {
    if (gameStatus !== 'IN_PROGRESS' && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      
      if (gameStatus === 'LIONS_WON') {
        // Red/amber confetti for lion victory
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#ef4444', '#f59e0b', '#dc2626', '#fbbf24', '#991b1b'],
          gravity: 0.9,
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#ef4444', '#f59e0b', '#fbbf24'],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#ef4444', '#f59e0b', '#fbbf24'],
          });
        }, 300);
      } else if (gameStatus === 'SHEEP_WON') {
        // Sky/emerald confetti for sheep victory
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#38bdf8', '#34d399', '#0ea5e9', '#6ee7b7', '#a5f3fc'],
          gravity: 0.9,
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#38bdf8', '#34d399', '#a5f3fc'],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#38bdf8', '#34d399', '#a5f3fc'],
          });
        }, 300);
      }
    }

    // Reset confetti flag when game resets
    if (gameStatus === 'IN_PROGRESS') {
      confettiFiredRef.current = false;
    }
  }, [gameStatus]);

  const handleModeSelect = (newMode) => {
    dispatch({ type: 'SET_MODE', payload: { mode: newMode } });
  };

  const isLionsWon = gameStatus === 'LIONS_WON';
  const isSheepWon = gameStatus === 'SHEEP_WON';
  const isGameOver = isLionsWon || isSheepWon;

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

        {/* AI Difficulty Selector (Visible when mode === 'PVAI') */}
        {mode === 'PVAI' && (
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-purple-500/30 text-xs font-semibold">
            {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => dispatch({ type: 'SET_DIFFICULTY', payload: { aiDifficulty: diff } })}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  state.aiDifficulty === diff
                    ? 'bg-purple-500/30 border border-purple-400 text-purple-200 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        )}

        {/* Connection & Audio Control Badges */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              toggleSound();
              // force re-render
              dispatch({ type: 'FORCE_UPDATE' });
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Toggle Sound"
          >
            {isSoundEnabled() ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
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
              <span className={`text-2xl font-extrabold transition-all ${capturedSheep >= WINNING_CAPTURES ? 'text-amber-400' : 'text-red-500'}`}>
                {capturedSheep}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / {WINNING_CAPTURES}
              </span>
            </div>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: WINNING_CAPTURES }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    backgroundColor: i < capturedSheep ? '#ef4444' : '#1e293b',
                    boxShadow: i < capturedSheep ? '0 0 6px rgba(239,68,68,0.7)' : 'none',
                    scale: i === capturedSheep - 1 ? [1, 1.3, 1] : 1,
                  }}
                  transition={{ duration: 0.4, type: 'spring' }}
                  className="w-3.5 h-1.5 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Game status inline hint & AI thinking banner */}
        {!isGameOver && (
          <div className={`rounded-xl px-3 py-2 text-xs font-medium text-center border transition-all ${
            mode === 'PVAI' && currentTurn === state.aiRole
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-200 animate-pulse'
              : currentTurn === 'SHEEP'
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {mode === 'PVAI' && currentTurn === state.aiRole
              ? `🤖 AI Bot is thinking... (${state.aiDifficulty} difficulty)`
              : gamePhase === 'PLACEMENT' && currentTurn === 'SHEEP'
              ? '🐑 Click any empty node to place a sheep'
              : currentTurn === 'SHEEP'
              ? '🐑 Click a sheep to select, then click a highlighted node to move'
              : '🦁 Click a lion to select — it can move or jump-capture sheep'}
          </div>
        )}
      </div>

      {/* ===================== Game Over Victory Overlay Modal ===================== */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            key="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.1 }}
              className={`relative bg-slate-900 rounded-3xl p-7 sm:p-10 max-w-sm w-full text-center space-y-6 shadow-2xl overflow-hidden border ${
                isLionsWon
                  ? 'border-amber-500/50 shadow-amber-500/20'
                  : 'border-sky-500/50 shadow-sky-500/20'
              }`}
            >
              {/* Background gradient glow */}
              <div
                className={`absolute inset-0 opacity-10 pointer-events-none ${
                  isLionsWon
                    ? 'bg-gradient-to-br from-red-600 via-amber-500 to-transparent'
                    : 'bg-gradient-to-br from-sky-500 via-emerald-400 to-transparent'
                }`}
              />

              {/* Winner Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.25 }}
                className={`relative w-20 h-20 rounded-full mx-auto flex items-center justify-center border-2 ${
                  isLionsWon
                    ? 'bg-gradient-to-br from-red-900 to-amber-900 border-amber-500/60 shadow-lg shadow-amber-500/30'
                    : 'bg-gradient-to-br from-slate-800 to-sky-900 border-sky-400/60 shadow-lg shadow-sky-400/30'
                }`}
              >
                <span className="text-4xl select-none">{isLionsWon ? '🦁' : '🐑'}</span>
                {/* Crown badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md"
                >
                  <Crown className="w-3.5 h-3.5 text-slate-900" />
                </motion.div>
              </motion.div>

              {/* Victory Text */}
              <div className="relative space-y-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 ${
                    isLionsWon
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
                  }`}>
                    <Trophy className="w-3 h-3" />
                    {isLionsWon ? 'Lions Win!' : 'Sheep Win!'}
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`text-3xl font-black tracking-tight ${
                    isLionsWon
                      ? 'bg-gradient-to-r from-amber-300 via-red-300 to-amber-400 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-sky-300 via-emerald-300 to-sky-400 bg-clip-text text-transparent'
                  }`}
                >
                  {isLionsWon ? 'Pride Victorious!' : 'Flock Triumphant!'}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto"
                >
                  {isLionsWon
                    ? `The lions captured ${WINNING_CAPTURES} sheep and dominated the board!`
                    : 'All lions have been completely surrounded and trapped!'}
                </motion.p>
              </div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Captured</div>
                  <div className="text-xl font-extrabold text-red-400">{capturedSheep} <span className="text-xs text-slate-500">sheep</span></div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Remaining</div>
                  <div className="text-xl font-extrabold text-sky-400">
                    {state.board.filter(p => p === 'SHEEP').length} <span className="text-xs text-slate-500">sheep</span>
                  </div>
                </div>
              </motion.div>

              {/* Play Again Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => dispatch({ type: 'RESET_GAME' })}
                className={`relative w-full py-3.5 px-6 rounded-xl font-bold text-base transition-all shadow-lg cursor-pointer overflow-hidden ${
                  isLionsWon
                    ? 'bg-gradient-to-r from-amber-400 to-red-500 hover:from-amber-300 hover:to-red-400 text-slate-900 shadow-amber-500/30'
                    : 'bg-gradient-to-r from-sky-400 to-emerald-400 hover:from-sky-300 hover:to-emerald-300 text-slate-900 shadow-sky-500/30'
                }`}
              >
                <Swords className="inline-block w-4 h-4 mr-2 mb-0.5" />
                Play Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

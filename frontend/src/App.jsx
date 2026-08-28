import { GameProvider } from './context/GameStateContext';
import { useGameState } from './hooks/useGameState';
import Board from './components/Board';
import Scoreboard from './components/Scoreboard';
import Controls from './components/Controls';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

function GameContent() {
  const { state } = useGameState();
  const { moveHistory } = state;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 flex flex-col justify-between max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <header className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bagh-Chal • Nepal&apos;s Traditional Strategy Game</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-red-400 bg-clip-text text-transparent"
        >
          BHEEDCHAAL
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto"
        >
          🦁 Lions hunt sheep. 🐑 Sheep trap lions. Who shall prevail?
        </motion.p>
      </header>

      {/* Main Game Interface */}
      <main className="space-y-6">
        <Scoreboard />
        <Board />
        <Controls />
      </main>

      {/* Footer & Recent Move Log */}
      <footer className="w-full max-w-[500px] mx-auto pt-4 border-t border-slate-800/80 text-center space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> Recent Move History
          </span>
          <span>{moveHistory.length} moves played</span>
        </div>

        {moveHistory.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            {moveHistory.slice(-6).reverse().map((move, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap flex items-center gap-1.5"
              >
                <span className="font-mono text-amber-400">#{moveHistory.length - idx}:</span>{' '}
                {move.type === 'PLACE' && (
                  <span>🐑 Placed @ <span className="text-sky-300 font-mono">#{move.to}</span></span>
                )}
                {move.type === 'MOVE' && (
                  <span>{move.piece === 'LION' ? '🦁' : '🐑'} {move.from} → {move.to}</span>
                )}
                {move.type === 'CAPTURE' && (
                  <span className="text-red-300">🦁 ⚡ {move.from}→{move.to} <span className="text-slate-500">(⛔{move.capturedNode})</span></span>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No moves recorded yet. Select or place a piece to begin.</p>
        )}

        <p className="text-xs text-slate-600 mt-2">
          BheedChaal v1.0 • 🦁 Lions win by capturing {5} sheep • 🐑 Sheep win by trapping all lions
        </p>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

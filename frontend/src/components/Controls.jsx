import React, { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { RotateCcw, HelpCircle, X, ShieldAlert } from 'lucide-react';
import { WINNING_CAPTURES } from '../utils/gameLogic';

export default function Controls() {
  const { dispatch } = useGameState();
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="w-full max-w-[500px] mx-auto flex items-center justify-between gap-3 pt-2">
      {/* Reset Game Button */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'RESET_GAME' })}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all text-sm font-medium cursor-pointer shadow-md"
      >
        <RotateCcw className="w-4 h-4 text-amber-400" />
        <span>Reset Game</span>
      </button>

      {/* Rules Modal Toggle Button */}
      <button
        type="button"
        onClick={() => setShowRules(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all text-sm font-medium cursor-pointer shadow-md"
      >
        <HelpCircle className="w-4 h-4 text-sky-400" />
        <span>Rules & Guide</span>
      </button>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-left">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                BheedChaal (Bagh-Chal) Rules
              </h3>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong className="text-amber-300">Board Graph:</strong> 25 nodes (5x5 grid). Diagonal lines connect only nodes where (row + col) is EVEN.
              </p>
              
              <div>
                <strong className="text-sky-300">1. Placement Phase:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                  <li>4 Lions start on the 4 outer corner nodes.</li>
                  <li>Sheep places 1 sheep per turn from reserve (20 total).</li>
                  <li>Lions can move 1 step OR jump-capture sheep during placement!</li>
                  <li>Sheep cannot move on board until all 20 sheep are placed.</li>
                </ul>
              </div>

              <div>
                <strong className="text-sky-300">2. Movement Phase:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                  <li>After placing 20 sheep, Sheep can move 1 step along connected lines to adjacent empty nodes.</li>
                  <li>Lions continue moving 1 step or jumping to capture.</li>
                </ul>
              </div>

              <div>
                <strong className="text-red-400">3. Captures:</strong>
                <p className="text-slate-400 mt-1">
                  A Lion captures a Sheep by jumping over an adjacent Sheep along a connected graph line to an empty node immediately behind it.
                </p>
              </div>

              <div>
                <strong className="text-amber-400">4. Winning Conditions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">Lions Win:</strong> Capture {WINNING_CAPTURES} sheep.</li>
                  <li><strong className="text-slate-200">Sheep Win:</strong> Surround all 4 Lions so they have 0 valid moves or jumps.</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

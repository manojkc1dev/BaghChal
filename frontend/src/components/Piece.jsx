import React from 'react';
import { motion } from 'framer-motion';

export default function Piece({ type, isSelected }) {
  if (type === 'LION') {
    return (
      <motion.div
        layout
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: isSelected ? 1.1 : 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        whileHover={{ scale: isSelected ? 1.15 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative flex items-center justify-center ${isSelected ? 'z-30' : 'z-20'}`}
      >
        {/* Subtle Selection Ring */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.06, 1], opacity: 1 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-1 rounded-full border-2 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.5)] pointer-events-none"
          />
        )}

        {/* Piece Body */}
        <div
          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-950 via-red-900 to-amber-950 border-2 ${
            isSelected
              ? 'border-amber-400 shadow-lg shadow-red-900/80 ring-2 ring-amber-400/60'
              : 'border-red-500/60 shadow-md shadow-slate-950/80'
          } flex items-center justify-center text-amber-300 select-none`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-amber-400 drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.19 5.42 3.1 7.24.46.43 1.17.38 1.54-.11.38-.5.26-1.21-.24-1.57C4.85 16.14 4 14.17 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 2.17-.85 4.14-2.4 5.56-.5.36-.62 1.07-.24 1.57.37.49 1.08.54 1.54.11C20.81 17.42 22 14.85 22 12c0-5.52-4.48-10-10-10z"
              opacity="0.4"
            />
            <path d="M12 4c-3.87 0-7 3.13-7 7 0 2.38 1.19 4.47 3 5.74V18c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-1.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2 9c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z" />
          </svg>
        </div>
      </motion.div>
    );
  }

  if (type === 'SHEEP') {
    return (
      <motion.div
        layout
        initial={{ scale: 0 }}
        animate={{ scale: isSelected ? 1.1 : 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        whileHover={{ scale: isSelected ? 1.15 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative flex items-center justify-center ${isSelected ? 'z-30' : 'z-20'}`}
      >
        {/* Subtle Selection Ring */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.06, 1], opacity: 1 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-1 rounded-full border-2 border-sky-300/80 shadow-[0_0_10px_rgba(56,189,248,0.5)] pointer-events-none"
          />
        )}

        {/* Piece Body */}
        <div
          className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 border-2 ${
            isSelected
              ? 'border-sky-300 shadow-lg shadow-sky-900/80 ring-2 ring-sky-300/60'
              : 'border-sky-400/60 shadow-md shadow-slate-950/80'
          } flex items-center justify-center text-sky-200 select-none`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-sky-200 drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 10c0-1.3-.8-2.4-2-2.8C16.7 5.9 14.5 5 12 5s-4.7.9-5 2.2C5.8 7.6 5 8.7 5 10c0 1.1.6 2 1.5 2.5C6.2 13.1 6 13.8 6 14.5 6 16.4 8.7 18 12 18s6-1.6 6-3.5c0-.7-.2-1.4-.5-2 1-.5 1.5-1.4 1.5-2.5zM10 11.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          </svg>
        </div>
      </motion.div>
    );
  }

  return null;
}

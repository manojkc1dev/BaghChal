import React from 'react';

export default function Piece({ type, isSelected }) {
  if (type === 'LION') {
    return (
      <div className={`relative flex items-center justify-center transition-all duration-300 transform ${isSelected ? 'scale-115 z-30' : 'hover:scale-105'}`}>
        {/* Glow backdrop */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-red-600 to-amber-600 opacity-60 blur-md ${isSelected ? 'animate-lion-glow opacity-90' : ''}`} />
        
        {/* Piece Body */}
        <div className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-red-950 via-red-900 to-amber-950 border-2 ${isSelected ? 'border-amber-400 shadow-lg shadow-red-500/50' : 'border-red-500/60'} flex items-center justify-center text-amber-300 drop-shadow-md`}>
          <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-amber-400 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
            {/* Lion Head Icon SVG */}
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.19 5.42 3.1 7.24.46.43 1.17.38 1.54-.11.38-.5.26-1.21-.24-1.57C4.85 16.14 4 14.17 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 2.17-.85 4.14-2.4 5.56-.5.36-.62 1.07-.24 1.57.37.49 1.08.54 1.54.11C20.81 17.42 22 14.85 22 12c0-5.52-4.48-10-10-10z" opacity="0.4" />
            <path d="M12 4c-3.87 0-7 3.13-7 7 0 2.38 1.19 4.47 3 5.74V18c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-1.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2 9c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z" />
          </svg>
        </div>
      </div>
    );
  }

  if (type === 'SHEEP') {
    return (
      <div className={`relative flex items-center justify-center transition-all duration-300 transform ${isSelected ? 'scale-115 z-30' : 'hover:scale-105'}`}>
        {/* Glow backdrop */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 opacity-50 blur-md ${isSelected ? 'animate-sheep-glow opacity-90' : ''}`} />
        
        {/* Piece Body */}
        <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 border-2 ${isSelected ? 'border-sky-300 shadow-lg shadow-sky-500/50' : 'border-sky-400/60'} flex items-center justify-center text-sky-200 drop-shadow-md`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-sky-200 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
            {/* Woolly Sheep Icon SVG */}
            <path d="M19 10c0-1.3-.8-2.4-2-2.8C16.7 5.9 14.5 5 12 5s-4.7.9-5 2.2C5.8 7.6 5 8.7 5 10c0 1.1.6 2 1.5 2.5C6.2 13.1 6 13.8 6 14.5 6 16.4 8.7 18 12 18s6-1.6 6-3.5c0-.7-.2-1.4-.5-2 1-.5 1.5-1.4 1.5-2.5zM10 11.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          </svg>
        </div>
      </div>
    );
  }

  return null;
}

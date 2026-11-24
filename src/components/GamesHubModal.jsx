import React from 'react';
import { X, Trophy, Gamepad2, Sparkles, Swords, Dice5 } from 'lucide-react';

export default function GamesHubModal({
  isOpen,
  onClose,
  onOpenLudo,
  onOpenTicTacToe,
  onOpenSnakes,
  role,
  activeDoraName
}) {
  if (!isOpen) return null;

  const isCurrentAdmin = (role === 'parent' || role === 'admin');
  const myName = isCurrentAdmin ? 'Darsh' : activeDoraName;
  const oppName = isCurrentAdmin ? activeDoraName : 'Darsh';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#141414] border-2 border-indigo-500/60 rounded-3xl max-w-md w-full p-5 sm:p-6 text-center shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-lg">
              🎮
            </div>
            <div className="text-left">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Couple Mini-Games Hub</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded font-mono font-bold">2-PLAYER</span>
              </h3>
              <p className="text-xs text-gray-400">Play live with {oppName} with real Love Points!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl cursor-pointer hover:bg-[#222]"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2 GAME CARDS */}
        <div className="space-y-3 text-left">
          
          {/* GAME 1: LUDO ROYALE */}
          <div 
            onClick={() => {
              onClose();
              onOpenLudo();
            }}
            className="bg-gradient-to-br from-[#1c1c1c] via-[#222] to-[#1a1a1a] border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex items-center justify-between group active:scale-95"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-600 to-emerald-600 flex items-center justify-center text-2xl shadow-md group-hover:rotate-12 transition-transform">
                🎲
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                    Ludo Royale (2P Mobile)
                  </h4>
                  <span className="text-[9px] font-mono bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold">
                    15x15
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-tight">
                  Authentic mobile board: 3D dice, safe stars, captures & home run.
                </p>
                <div className="text-[10px] text-amber-400/90 font-mono font-semibold pt-0.5">
                  Darsh (Red) vs Dora (Green)
                </div>
              </div>
            </div>

            <div className="text-amber-400 font-black text-sm group-hover:translate-x-1 transition-transform">
              ➔
            </div>
          </div>

          {/* GAME 2: SNAKES AND LADDERS */}
          <div 
            onClick={() => {
              onClose();
              if (onOpenSnakes) onOpenSnakes();
            }}
            className="bg-gradient-to-br from-[#1c1c1c] via-[#222] to-[#1a1a1a] border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex items-center justify-between group active:scale-95"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 flex items-center justify-center text-2xl shadow-md group-hover:rotate-12 transition-transform">
                🐍
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                    Snakes & Ladders (100 Tiles)
                  </h4>
                  <span className="text-[9px] font-mono bg-emerald-500 text-black px-1.5 py-0.2 rounded font-bold">
                    NEW
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-tight">
                  Colorful 10x10 board, 3D dice, audio sounds, ladder climbs & snakes!
                </p>
                <div className="text-[10px] text-emerald-400/90 font-mono font-semibold pt-0.5">
                  Darsh (Red) vs Dora (Blue) • Vs Bot / 2P
                </div>
              </div>
            </div>

            <div className="text-emerald-400 font-black text-sm group-hover:translate-x-1 transition-transform">
              ➔
            </div>
          </div>

          {/* GAME 2: COUPLE TIC-TAC-TOE */}
          <div 
            onClick={() => {
              onClose();
              onOpenTicTacToe();
            }}
            className="bg-gradient-to-br from-[#1c1c1c] via-[#222] to-[#1a1a1a] border-2 border-purple-500/50 hover:border-purple-400 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex items-center justify-between group active:scale-95"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-2xl shadow-md group-hover:rotate-12 transition-transform">
                ⚔️
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                    Couple Tic-Tac-Toe
                  </h4>
                  <span className="text-[9px] font-mono bg-purple-500/30 text-purple-300 border border-purple-500/50 px-1.5 py-0.2 rounded font-bold">
                    ₹2-₹5 BET
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-tight">
                  Fast-paced 3x3 duel. Winner automatically claims the match pot!
                </p>
                <div className="text-[10px] text-purple-400/90 font-mono font-semibold pt-0.5">
                  Real-time turn synchronization
                </div>
              </div>
            </div>

            <div className="text-purple-400 font-black text-sm group-hover:translate-x-1 transition-transform">
              ➔
            </div>
          </div>

        </div>

        {/* FOOTER TIP */}
        <div className="pt-1 text-[11px] text-gray-500 font-mono flex items-center justify-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" />
          <span>Both players can invite or join anytime with 1 tap</span>
        </div>

      </div>
    </div>
  );
}

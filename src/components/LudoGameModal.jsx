import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, RotateCcw, Share2, Sparkles, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- AUTHENTIC 15x15 LUDO BOARD COORDINATES ---
// Common track: 52 tiles (0 to 51)
export const COMMON_TRACK = [
  { r: 6, c: 1 },  // 0: Red Start (Safe Star)
  { r: 6, c: 2 },  // 1
  { r: 6, c: 3 },  // 2
  { r: 6, c: 4 },  // 3
  { r: 6, c: 5 },  // 4
  { r: 5, c: 6 },  // 5
  { r: 4, c: 6 },  // 6
  { r: 3, c: 6 },  // 7
  { r: 2, c: 6 },  // 8
  { r: 1, c: 6 },  // 9: Safe Star
  { r: 0, c: 6 },  // 10
  { r: 0, c: 7 },  // 11
  { r: 0, c: 8 },  // 12
  { r: 1, c: 8 },  // 13: Green Start (Safe Star)
  { r: 2, c: 8 },  // 14
  { r: 3, c: 8 },  // 15
  { r: 4, c: 8 },  // 16
  { r: 5, c: 8 },  // 17
  { r: 6, c: 9 },  // 18
  { r: 6, c: 10 }, // 19
  { r: 6, c: 11 }, // 20
  { r: 6, c: 12 }, // 21
  { r: 6, c: 13 }, // 22: Safe Star
  { r: 6, c: 14 }, // 23
  { r: 7, c: 14 }, // 24
  { r: 8, c: 14 }, // 25
  { r: 8, c: 13 }, // 26: Yellow Start (Safe Star)
  { r: 8, c: 12 }, // 27
  { r: 8, c: 11 }, // 28
  { r: 8, c: 10 }, // 29
  { r: 8, c: 9 },  // 30
  { r: 9, c: 8 },  // 31
  { r: 10, c: 8 }, // 32
  { r: 11, c: 8 }, // 33
  { r: 12, c: 8 }, // 34
  { r: 13, c: 8 }, // 35: Safe Star
  { r: 14, c: 8 }, // 36
  { r: 14, c: 7 }, // 37
  { r: 14, c: 6 }, // 38
  { r: 13, c: 6 }, // 39: Blue Start (Safe Star)
  { r: 12, c: 6 }, // 40
  { r: 11, c: 6 }, // 41
  { r: 10, c: 6 }, // 42
  { r: 9, c: 6 },  // 43
  { r: 8, c: 5 },  // 44
  { r: 8, c: 4 },  // 45
  { r: 8, c: 3 },  // 46
  { r: 8, c: 2 },  // 47
  { r: 8, c: 1 },  // 48: Safe Star
  { r: 8, c: 0 },  // 49
  { r: 7, c: 0 },  // 50
  { r: 6, c: 0 }   // 51
];

// 8 Standard Star Safe Cells on 15x15 board
export const SAFE_COORDS = [
  { r: 6, c: 1 },  // Red Start
  { r: 1, c: 6 },
  { r: 1, c: 8 },  // Green Start
  { r: 6, c: 13 },
  { r: 8, c: 13 }, // Yellow Start
  { r: 13, c: 8 },
  { r: 13, c: 6 }, // Blue Start
  { r: 8, c: 1 }
];

export const isCellSafe = (r, c) => {
  return SAFE_COORDS.some(coord => coord.r === r && coord.c === c);
};

// Full 57-step paths for Red (Darsh) and Green (Dora)
export const RED_PATH = [
  ...COMMON_TRACK.slice(0, 51), // 0 to 50
  { r: 7, c: 1 }, // 51: Red Home 1
  { r: 7, c: 2 }, // 52: Red Home 2
  { r: 7, c: 3 }, // 53: Red Home 3
  { r: 7, c: 4 }, // 54: Red Home 4
  { r: 7, c: 5 }, // 55: Red Home 5
  { r: 7, c: 6 }  // 56: Red HOME Center 👑
];

export const GREEN_PATH = [
  ...Array.from({ length: 51 }, (_, i) => COMMON_TRACK[(13 + i) % 52]),
  { r: 1, c: 7 }, // 51: Green Home 1
  { r: 2, c: 7 }, // 52: Green Home 2
  { r: 3, c: 7 }, // 53: Green Home 3
  { r: 4, c: 7 }, // 54: Green Home 4
  { r: 5, c: 7 }, // 55: Green Home 5
  { r: 6, c: 7 }  // 56: Green HOME Center 👑
];

// Base Yard Pocket Coordinates (r, c) for 4 tokens
export const YARD_POCKETS = {
  H: [
    { r: 2, c: 2 },
    { r: 2, c: 3 },
    { r: 3, c: 2 },
    { r: 3, c: 3 }
  ],
  A: [
    { r: 2, c: 11 },
    { r: 2, c: 12 },
    { r: 3, c: 11 },
    { r: 3, c: 12 }
  ]
};

// Sound synthesizer using Web Audio API (cross-platform, zero asset errors)
const playAudioEffect = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'roll') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'capture') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + (idx + 1) * 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + (idx + 1) * 0.18);
      });
    }
  } catch (e) {
    // Audio context silently blocked by browser policy
  }
};

export default function LudoGameModal({
  isOpen,
  onClose,
  socketRef,
  role,
  activeDoraName,
  onSendChatInvite
}) {
  const [tokens, setTokens] = useState({
    H: [-1, -1, -1, -1],
    A: [-1, -1, -1, -1]
  });
  const [turn, setTurn] = useState('H'); // 'H' (Darsh - Red) | 'A' (Dora - Green)
  const [diceVal, setDiceVal] = useState(6);
  const [isRolling, setIsRolling] = useState(false);
  const [movableTokens, setMovableTokens] = useState([]);
  const [statusMsg, setStatusMsg] = useState('Game started! Darsh rolls first.');
  const [winner, setWinner] = useState(null); // 'H' | 'A' | null
  const [scores, setScores] = useState({ H: 0, A: 0 });
  const [betAmount, setBetAmount] = useState(2.0); // ₹0, ₹2, ₹5
  const [tokensToWin, setTokensToWin] = useState(2); // 2 tokens for quick mobile match, 4 for full

  const isCurrentAdmin = (role === 'parent' || role === 'admin');
  const myPlayerKey = isCurrentAdmin ? 'H' : 'A';
  const myName = isCurrentAdmin ? 'Darsh' : activeDoraName;
  const oppName = isCurrentAdmin ? activeDoraName : 'Darsh';
  const isMyTurn = (turn === myPlayerKey);

  // Sync state over sockets
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleArcadeBroadcast = (data) => {
      if (!data || data.gameId !== 'ludo') return;
      if (data.tokens) setTokens(data.tokens);
      if (data.turn) setTurn(data.turn);
      if (data.dice) setDiceVal(data.dice);
      if (data.statusMsg) setStatusMsg(data.statusMsg);
      if (data.scores) setScores(data.scores);
      if (data.betAmount !== undefined) setBetAmount(data.betAmount);
      if (data.winner) {
        setWinner(data.winner);
        playAudioEffect('win');
        try { confetti({ particleCount: 120, spread: 100 }); } catch (e) {}
      }
    };

    socket.on('arcade_game_action_broadcast', handleArcadeBroadcast);
    return () => {
      socket.off('arcade_game_action_broadcast', handleArcadeBroadcast);
    };
  }, [socketRef]);

  // Check which tokens are eligible to move given a dice roll
  const getMovable = (player, roll, currentTokens) => {
    const list = [];
    const playerTokens = currentTokens[player] || [-1, -1, -1, -1];
    playerTokens.forEach((pos, idx) => {
      if (pos === -1) {
        if (roll === 6) list.push(idx); // Can deploy from yard on 6
      } else if (pos >= 0 && pos < 56) {
        if (pos + roll <= 56) list.push(idx); // Can advance if not overshooting Home (56)
      }
    });
    return list;
  };

  // Roll the dice
  const handleRollDice = () => {
    if (!isMyTurn || isRolling || winner) return;

    setIsRolling(true);
    playAudioEffect('roll');

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceVal(roll);
      setIsRolling(false);

      const eligible = getMovable(turn, roll, tokens);
      const activePlayerName = turn === 'H' ? 'Darsh' : activeDoraName;

      if (eligible.length === 0) {
        // No moves possible -> pass turn
        const nextTurn = turn === 'H' ? 'A' : 'H';
        const msg = `🎲 ${activePlayerName} rolled a ${roll} — No valid moves! Next turn.`;
        setStatusMsg(msg);
        setMovableTokens([]);

        setTimeout(() => {
          setTurn(nextTurn);
          emitGameAction({
            tokens,
            turn: nextTurn,
            dice: roll,
            statusMsg: msg
          });
        }, 1200);
      } else if (eligible.length === 1) {
        // Exactly one move possible -> advance automatically with slight delay for readability
        setMovableTokens([]);
        setTimeout(() => {
          executeMove(turn, eligible[0], roll);
        }, 400);
      } else {
        // Multiple choices -> prompt player to tap desired pawn
        setMovableTokens(eligible);
        setStatusMsg(`🎲 ${activePlayerName} rolled a ${roll}! Tap a highlighted token to move.`);
      }
    }, 450);
  };

  // Execute token move
  const executeMove = (player, tokenIdx, roll) => {
    const newTokens = {
      H: [...tokens.H],
      A: [...tokens.A]
    };
    const currentPos = newTokens[player][tokenIdx];
    let newPos = currentPos;
    let isCapture = false;
    let actionText = '';
    const playerName = player === 'H' ? 'Darsh' : activeDoraName;

    if (currentPos === -1) {
      newPos = 0; // Deployed to starting cell
      actionText = `🚀 ${playerName} deployed Token #${tokenIdx + 1} to track!`;
      playAudioEffect('move');
    } else {
      newPos = Math.min(56, currentPos + roll);
      actionText = `➡️ ${playerName} moved Token #${tokenIdx + 1} forward +${roll} steps.`;
      playAudioEffect('move');
    }

    newTokens[player][tokenIdx] = newPos;

    // Check Capture on common track (0 <= pos <= 50)
    if (newPos >= 0 && newPos <= 50) {
      const myCoord = player === 'H' ? RED_PATH[newPos] : GREEN_PATH[newPos];
      if (myCoord && !isCellSafe(myCoord.r, myCoord.c)) {
        const opponent = player === 'H' ? 'A' : 'H';
        newTokens[opponent] = newTokens[opponent].map((oppPos) => {
          if (oppPos >= 0 && oppPos <= 50) {
            const oppCoord = opponent === 'H' ? RED_PATH[oppPos] : GREEN_PATH[oppPos];
            if (oppCoord && oppCoord.r === myCoord.r && oppCoord.c === myCoord.c) {
              isCapture = true;
              return -1; // Reset to yard!
            }
          }
          return oppPos;
        });

        if (isCapture) {
          playAudioEffect('capture');
          try { confetti({ particleCount: 75, spread: 80 }); } catch (e) {}
          actionText = `⚔️ ${playerName} CAPTURED opponent's token! Sent back to base! Bonus roll granted!`;
        }
      }
    }

    // Check Win Condition
    const homeCount = newTokens[player].filter(p => p === 56).length;
    let winDeclared = null;
    let newScores = { ...scores };

    if (homeCount >= tokensToWin) {
      winDeclared = player;
      newScores[player] += 1;
      setScores(newScores);
      setWinner(player);
      playAudioEffect('win');
      try { confetti({ particleCount: 150, spread: 130 }); } catch (e) {}
      actionText = `🏆 ${playerName} WON LUDO ROYALE! 🎉`;

      // Trigger automatic pot reward via couple_game_action
      if (socketRef?.current && betAmount > 0) {
        socketRef.current.emit('couple_game_action', {
          type: 'MATCH_FINISH',
          gameId: 'ludo',
          betAmount,
          winner: player
        });
      }
    }

    // Next turn calculation (Bonus roll on 6 or capture)
    let nextTurn = player;
    if (!winDeclared) {
      if (roll === 6 || isCapture) {
        nextTurn = player;
        actionText += ' (Bonus Roll!)';
      } else {
        nextTurn = player === 'H' ? 'A' : 'H';
      }
    }

    setTokens(newTokens);
    setTurn(nextTurn);
    setStatusMsg(actionText);
    setMovableTokens([]);

    emitGameAction({
      tokens: newTokens,
      turn: nextTurn,
      dice: roll,
      statusMsg: actionText,
      scores: newScores,
      winner: winDeclared,
      betAmount
    });
  };

  const emitGameAction = (payload) => {
    if (socketRef?.current) {
      socketRef.current.emit('arcade_game_action', {
        gameId: 'ludo',
        ...payload
      });
    }
  };

  const handleResetGame = () => {
    const initTokens = { H: [-1, -1, -1, -1], A: [-1, -1, -1, -1] };
    setTokens(initTokens);
    setTurn('H');
    setDiceVal(6);
    setWinner(null);
    setMovableTokens([]);
    const resetText = 'Match reset! Darsh rolls first.';
    setStatusMsg(resetText);

    emitGameAction({
      tokens: initTokens,
      turn: 'H',
      dice: 6,
      statusMsg: resetText,
      winner: null,
      betAmount
    });
  };

  const handleSendInviteToChat = () => {
    if (onSendChatInvite) {
      onSendChatInvite('ludo', betAmount);
    }
    if (socketRef?.current) {
      socketRef.current.emit('couple_game_invite', {
        game: 'ludo',
        challenger: myName,
        challengerRole: role,
        betAmount
      });
    }
    alert(`💌 Ludo Challenge sent to ${oppName}!\n\nA live invite banner and chat link have been dispatched.`);
  };

  if (!isOpen) return null;

  // Render 3D Dice Face with authentic dots
  const renderDice = (val, isRollingNow, activeGlow) => {
    const dotsMap = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right']
    };
    const activeDots = dotsMap[val] || ['center'];

    return (
      <div 
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-300 border-2 border-slate-300 shadow-2xl p-2 relative select-none flex items-center justify-center transition-all ${
          isRollingNow ? 'animate-spin scale-105' : ''
        } ${activeGlow ? 'ring-4 ring-amber-400 shadow-[0_0_20px_#f59e0b] scale-105' : 'opacity-85'}`}
      >
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-1 place-items-center">
          {['top-left', 'top-mid', 'top-right', 'mid-left', 'center', 'mid-right', 'bottom-left', 'bottom-mid', 'bottom-right'].map((pos) => {
            const hasDot = activeDots.includes(pos);
            return (
              <div key={pos} className="w-full h-full flex items-center justify-center">
                {hasDot && (
                  <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${
                    turn === 'H' ? 'bg-red-600' : 'bg-emerald-600'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Find all tokens currently occupying cell (r, c)
  const getTokensAtCell = (r, c) => {
    const res = [];
    tokens.H.forEach((pos, idx) => {
      if (pos >= 0 && pos <= 56) {
        const coord = RED_PATH[pos];
        if (coord && coord.r === r && coord.c === c) {
          res.push({ player: 'H', idx, pos, isHome: pos === 56 });
        }
      }
    });
    tokens.A.forEach((pos, idx) => {
      if (pos >= 0 && pos <= 56) {
        const coord = GREEN_PATH[pos];
        if (coord && coord.r === r && coord.c === c) {
          res.push({ player: 'A', idx, pos, isHome: pos === 56 });
        }
      }
    });
    return res;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-1 sm:p-3 overflow-y-auto font-sans">
      <div className="w-full max-w-[460px] bg-[#121212] border-2 border-amber-500/50 rounded-3xl p-3 sm:p-5 shadow-2xl relative space-y-3 sm:space-y-4 my-auto">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🎲</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white">Ludo Royale 2P</h3>
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black px-2 py-0.2 rounded-full">
                  MOBILE LIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Darsh (Red) vs Dora (Green)</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSendInviteToChat}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl cursor-pointer shadow flex items-center gap-1 active:scale-95 transition-all"
              title="Send Game Invite to Dora in Chat"
            >
              <Share2 size={12} />
              <span className="hidden sm:inline">Invite</span>
            </button>
            <button
              type="button"
              onClick={handleResetGame}
              className="bg-[#222] hover:bg-[#333] text-amber-400 p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border border-[#333]"
              title="Reset Match"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white p-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* BET & SETTINGS ROW */}
        <div className="flex items-center justify-between bg-[#181818] border border-[#2b2b2b] px-3 py-1.5 rounded-2xl text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px]">Match Stakes:</span>
            {[0, 2, 5].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBetAmount(amt)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  betAmount === amt 
                    ? 'bg-amber-500 text-black shadow' 
                    : 'bg-[#242424] text-gray-400 hover:text-white'
                }`}
              >
                {amt === 0 ? 'Friendly' : `₹${amt}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-300">
            <span>Win:</span>
            <button
              type="button"
              onClick={() => setTokensToWin(tokensToWin === 2 ? 4 : 2)}
              className="bg-[#242424] hover:bg-[#303030] text-amber-400 font-bold px-2 py-0.5 rounded-lg cursor-pointer"
            >
              {tokensToWin} Tokens
            </button>
          </div>
        </div>

        {/* WINNER BANNER */}
        {winner && (
          <div className="bg-gradient-to-r from-amber-500/30 via-emerald-500/30 to-amber-500/30 border-2 border-amber-400 text-amber-200 py-3 px-4 rounded-2xl text-xs font-black animate-bounce shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-400 animate-spin" />
              <span>{winner === 'H' ? 'Darsh (Red)' : `${activeDoraName} (Green)`} Won the Match!</span>
            </div>
            <button
              type="button"
              onClick={handleResetGame}
              className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer shadow"
            >
              Play Again
            </button>
          </div>
        )}

        {/* STATUS BAR */}
        <div className="bg-gradient-to-r from-[#181818] via-[#202020] to-[#181818] border border-[#2b2b2b] p-2 rounded-xl text-xs font-medium text-amber-300 text-center truncate">
          {statusMsg}
        </div>

        {/* --- AUTHENTIC 15x15 LUDO BOARD GRID --- */}
        <div className="w-full aspect-square bg-[#f8fafc] border-4 border-amber-500/90 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.9)] relative select-none overflow-hidden p-1">
          <div 
            className="w-full h-full grid"
            style={{
              gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(15, minmax(0, 1fr))'
            }}
          >
            {/* 1. TOP-LEFT 6x6: RED YARD (DARSH) */}
            <div 
              className={`col-span-6 row-span-6 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-2xl p-2 border-2 border-red-800 shadow-md flex flex-col justify-between ${
                turn === 'H' ? 'ring-2 ring-red-400 shadow-red-900/50' : ''
              }`}
            >
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black text-white px-1">
                <span>RED YARD</span>
                <span>👑 Darsh</span>
              </div>
              <div className="bg-white/95 rounded-xl p-1.5 sm:p-2 h-[75%] grid grid-cols-2 gap-1.5 sm:gap-2 place-items-center shadow-inner">
                {[0, 1, 2, 3].map((tIdx) => {
                  const inYard = tokens.H[tIdx] === -1;
                  const isMovable = movableTokens.includes(tIdx) && turn === 'H';
                  return (
                    <div
                      key={tIdx}
                      onClick={() => {
                        if (isMovable && isMyTurn) executeMove('H', tIdx, diceVal);
                      }}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-red-300 flex items-center justify-center transition-all ${
                        inYard ? 'bg-red-100' : 'bg-gray-100 opacity-30'
                      } ${isMovable ? 'cursor-pointer scale-110 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                    >
                      {inYard && (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white">
                          H{tIdx + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. TOP ARM (ROWS 0..5, COLS 6..8) */}
            {Array.from({ length: 6 }).map((_, r) => (
              <React.Fragment key={`top_arm_${r}`}>
                {[6, 7, 8].map((c) => {
                  const isGreenStart = (r === 1 && c === 8);
                  const isGreenHomeCol = (c === 7 && r >= 1 && r <= 5);
                  const isStarSafe = isCellSafe(r, c);
                  const cellTokens = getTokensAtCell(r, c);

                  return (
                    <div
                      key={`cell_${r}_${c}`}
                      className={`border-[0.5px] border-slate-300 relative flex items-center justify-center ${
                        isGreenHomeCol 
                          ? 'bg-emerald-500 text-white font-bold' 
                          : (isGreenStart ? 'bg-emerald-200' : 'bg-white')
                      }`}
                    >
                      {isStarSafe && !cellTokens.length && (
                        <span className="text-[11px] font-black text-amber-500">★</span>
                      )}
                      {isGreenStart && !cellTokens.length && (
                        <span className="text-[9px] font-black text-emerald-800">⬇</span>
                      )}
                      {cellTokens.map((tok) => {
                        const isMovable = movableTokens.includes(tok.idx) && turn === tok.player;
                        return (
                          <div
                            key={`${tok.player}_${tok.idx}`}
                            onClick={() => {
                              if (isMovable && isMyTurn) executeMove(tok.player, tok.idx, diceVal);
                            }}
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white transition-all ${
                              tok.player === 'H' 
                                ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' 
                                : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                            } ${isMovable ? 'cursor-pointer scale-125 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                          >
                            {tok.player === 'H' ? 'H' : 'A'}{tok.idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* 3. TOP-RIGHT 6x6: GREEN YARD (DORA) */}
            <div 
              className={`col-span-6 row-span-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-2 border-2 border-emerald-800 shadow-md flex flex-col justify-between ${
                turn === 'A' ? 'ring-2 ring-emerald-400 shadow-emerald-900/50' : ''
              }`}
            >
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black text-white px-1">
                <span>GREEN YARD</span>
                <span>💕 {activeDoraName}</span>
              </div>
              <div className="bg-white/95 rounded-xl p-1.5 sm:p-2 h-[75%] grid grid-cols-2 gap-1.5 sm:gap-2 place-items-center shadow-inner">
                {[0, 1, 2, 3].map((tIdx) => {
                  const inYard = tokens.A[tIdx] === -1;
                  const isMovable = movableTokens.includes(tIdx) && turn === 'A';
                  return (
                    <div
                      key={tIdx}
                      onClick={() => {
                        if (isMovable && isMyTurn) executeMove('A', tIdx, diceVal);
                      }}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center transition-all ${
                        inYard ? 'bg-emerald-100' : 'bg-gray-100 opacity-30'
                      } ${isMovable ? 'cursor-pointer scale-110 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                    >
                      {inYard && (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white">
                          A{tIdx + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. LEFT ARM (ROWS 6..8, COLS 0..5) */}
            {Array.from({ length: 3 }).map((_, rIdx) => {
              const r = 6 + rIdx;
              return Array.from({ length: 6 }).map((_, c) => {
                const isRedStart = (r === 6 && c === 1);
                const isRedHomeCol = (r === 7 && c >= 1 && c <= 5);
                const isStarSafe = isCellSafe(r, c);
                const cellTokens = getTokensAtCell(r, c);

                return (
                  <div
                    key={`cell_${r}_${c}`}
                    className={`border-[0.5px] border-slate-300 relative flex items-center justify-center ${
                      isRedHomeCol 
                        ? 'bg-red-500 text-white font-bold' 
                        : (isRedStart ? 'bg-red-200' : 'bg-white')
                    }`}
                  >
                    {isStarSafe && !cellTokens.length && (
                      <span className="text-[11px] font-black text-amber-500">★</span>
                    )}
                    {isRedStart && !cellTokens.length && (
                      <span className="text-[9px] font-black text-red-800">➔</span>
                    )}
                    {cellTokens.map((tok) => {
                      const isMovable = movableTokens.includes(tok.idx) && turn === tok.player;
                      return (
                        <div
                          key={`${tok.player}_${tok.idx}`}
                          onClick={() => {
                            if (isMovable && isMyTurn) executeMove(tok.player, tok.idx, diceVal);
                          }}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white transition-all ${
                            tok.player === 'H' 
                              ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' 
                              : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                          } ${isMovable ? 'cursor-pointer scale-125 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                        >
                          {tok.player === 'H' ? 'H' : 'A'}{tok.idx + 1}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })}

            {/* 5. CENTER 3x3: HOME TRIANGLES & CROWN (ROWS 6..8, COLS 6..8) */}
            <div className="col-span-3 row-span-3 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-xl border-2 border-amber-600 shadow-inner relative flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl animate-bounce">👑</span>
              </div>
              <div className="absolute bottom-1 text-[8px] font-black text-amber-950 uppercase tracking-tight">
                HOME
              </div>
            </div>

            {/* 6. RIGHT ARM (ROWS 6..8, COLS 9..14) */}
            {Array.from({ length: 3 }).map((_, rIdx) => {
              const r = 6 + rIdx;
              return Array.from({ length: 6 }).map((_, cIdx) => {
                const c = 9 + cIdx;
                const isStarSafe = isCellSafe(r, c);
                const cellTokens = getTokensAtCell(r, c);

                return (
                  <div
                    key={`cell_${r}_${c}`}
                    className="border-[0.5px] border-slate-300 relative flex items-center justify-center bg-white"
                  >
                    {isStarSafe && !cellTokens.length && (
                      <span className="text-[11px] font-black text-amber-500">★</span>
                    )}
                    {cellTokens.map((tok) => {
                      const isMovable = movableTokens.includes(tok.idx) && turn === tok.player;
                      return (
                        <div
                          key={`${tok.player}_${tok.idx}`}
                          onClick={() => {
                            if (isMovable && isMyTurn) executeMove(tok.player, tok.idx, diceVal);
                          }}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white transition-all ${
                            tok.player === 'H' 
                              ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' 
                              : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                          } ${isMovable ? 'cursor-pointer scale-125 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                        >
                          {tok.player === 'H' ? 'H' : 'A'}{tok.idx + 1}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })}

            {/* 7. BOTTOM-LEFT 6x6: BLUE BASE (CLASSIC) */}
            <div className="col-span-6 row-span-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-2 border-2 border-blue-800 shadow-md flex flex-col justify-between opacity-80">
              <span className="text-[10px] font-black text-white px-1">BLUE YARD</span>
              <div className="bg-white/95 rounded-xl p-2 h-[75%] grid grid-cols-2 gap-2 place-items-center">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-blue-300 bg-blue-50" />
                ))}
              </div>
            </div>

            {/* 8. BOTTOM ARM (ROWS 9..14, COLS 6..8) */}
            {Array.from({ length: 6 }).map((_, rIdx) => {
              const r = 9 + rIdx;
              return [6, 7, 8].map((c) => {
                const isStarSafe = isCellSafe(r, c);
                const cellTokens = getTokensAtCell(r, c);

                return (
                  <div
                    key={`cell_${r}_${c}`}
                    className="border-[0.5px] border-slate-300 relative flex items-center justify-center bg-white"
                  >
                    {isStarSafe && !cellTokens.length && (
                      <span className="text-[11px] font-black text-amber-500">★</span>
                    )}
                    {cellTokens.map((tok) => {
                      const isMovable = movableTokens.includes(tok.idx) && turn === tok.player;
                      return (
                        <div
                          key={`${tok.player}_${tok.idx}`}
                          onClick={() => {
                            if (isMovable && isMyTurn) executeMove(tok.player, tok.idx, diceVal);
                          }}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white transition-all ${
                            tok.player === 'H' 
                              ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' 
                              : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                          } ${isMovable ? 'cursor-pointer scale-125 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                        >
                          {tok.player === 'H' ? 'H' : 'A'}{tok.idx + 1}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })}

            {/* 9. BOTTOM-RIGHT 6x6: YELLOW BASE (CLASSIC) */}
            <div className="col-span-6 row-span-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-2 border-2 border-amber-800 shadow-md flex flex-col justify-between opacity-80">
              <span className="text-[10px] font-black text-amber-950 px-1">YELLOW YARD</span>
              <div className="bg-white/95 rounded-xl p-2 h-[75%] grid grid-cols-2 gap-2 place-items-center">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-amber-300 bg-amber-50" />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* CONTROLS & DICE DECK FOR BOTH PLAYERS */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* DARSH (RED) DECK */}
          <div 
            onClick={() => {
              if (turn === 'H' && isCurrentAdmin) handleRollDice();
            }}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
              turn === 'H'
                ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/50 shadow-lg shadow-red-900/40' 
                : 'bg-[#181818] border-[#2b2b2b] opacity-75'
            }`}
          >
            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-red-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <span>Darsh (Red)</span>
              </div>
              <div className="text-[10px] text-gray-400">
                Home: {tokens.H.filter(p => p === 56).length}/{tokensToWin}
              </div>
              {turn === 'H' && isCurrentAdmin && (
                <span className="inline-block text-[9px] font-bold bg-amber-500 text-black px-1.5 py-0.2 rounded font-mono animate-pulse">
                  TAP TO ROLL
                </span>
              )}
            </div>

            <div>
              {renderDice(diceVal, isRolling && turn === 'H', turn === 'H' && isCurrentAdmin)}
            </div>
          </div>

          {/* DORA (GREEN) DECK */}
          <div 
            onClick={() => {
              if (turn === 'A' && !isCurrentAdmin) handleRollDice();
            }}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
              turn === 'A'
                ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-900/40' 
                : 'bg-[#181818] border-[#2b2b2b] opacity-75'
            }`}
          >
            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span>{activeDoraName} (Green)</span>
              </div>
              <div className="text-[10px] text-gray-400">
                Home: {tokens.A.filter(p => p === 56).length}/{tokensToWin}
              </div>
              {turn === 'A' && !isCurrentAdmin && (
                <span className="inline-block text-[9px] font-bold bg-amber-500 text-black px-1.5 py-0.2 rounded font-mono animate-pulse">
                  TAP TO ROLL
                </span>
              )}
            </div>

            <div>
              {renderDice(diceVal, isRolling && turn === 'A', turn === 'A' && !isCurrentAdmin)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

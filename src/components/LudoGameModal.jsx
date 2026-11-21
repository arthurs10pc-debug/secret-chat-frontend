import React, { useState, useEffect } from 'react';
import { X, Trophy, RotateCcw, Share2, Sparkles, ShieldCheck } from 'lucide-react';
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

// Home Runways (5 tiles each)
export const RED_RUNWAY = [
  { r: 7, c: 1 },
  { r: 7, c: 2 },
  { r: 7, c: 3 },
  { r: 7, c: 4 },
  { r: 7, c: 5 }
];

export const GREEN_RUNWAY = [
  { r: 1, c: 7 },
  { r: 2, c: 7 },
  { r: 3, c: 7 },
  { r: 4, c: 7 },
  { r: 5, c: 7 }
];

export const YELLOW_RUNWAY = [
  { r: 7, c: 13 },
  { r: 7, c: 12 },
  { r: 7, c: 11 },
  { r: 7, c: 10 },
  { r: 7, c: 9 }
];

export const BLUE_RUNWAY = [
  { r: 13, c: 7 },
  { r: 12, c: 7 },
  { r: 11, c: 7 },
  { r: 10, c: 7 },
  { r: 9, c: 7 }
];

// Sound synthesizer using Web Audio API
const playAudioEffect = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'roll') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
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
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.35);
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
  } catch (e) {}
};

export default function LudoGameModal({
  isOpen,
  onClose,
  socketRef,
  role,
  activeDoraName,
  onSendChatInvite,
  gameState,
  onAction
}) {
  const [tokens, setTokens] = useState(gameState?.tokens || {
    H: [-1, -1, -1, -1],
    A: [-1, -1, -1, -1]
  });
  const [turn, setTurn] = useState(gameState?.turn || 'H'); // 'H' (Darsh) | 'A' (Dora)
  const [diceVal, setDiceVal] = useState(gameState?.dice ?? 6);
  const [isRolling, setIsRolling] = useState(false);
  const [movableTokens, setMovableTokens] = useState([]);
  const [statusMsg, setStatusMsg] = useState(gameState?.statusMsg || 'Match ready! Darsh rolls first.');
  const [winner, setWinner] = useState(gameState?.winner || null);
  const [scores, setScores] = useState(gameState?.scores || { H: 0, A: 0 });
  const [betAmount, setBetAmount] = useState(gameState?.betAmount ?? 2.0);
  const [tokensToWin, setTokensToWin] = useState(2); // 2 tokens for quick mobile match

  const isCurrentAdmin = (role === 'parent' || role === 'admin');
  const myPlayerKey = isCurrentAdmin ? 'H' : 'A';
  const myName = isCurrentAdmin ? 'Darsh' : activeDoraName;
  const oppName = isCurrentAdmin ? activeDoraName : 'Darsh';
  const isMyTurn = (turn === myPlayerKey);

  // Sync state from root App.js gameState prop instantly
  useEffect(() => {
    if (gameState) {
      if (gameState.tokens) setTokens({ H: [...gameState.tokens.H], A: [...gameState.tokens.A] });
      if (gameState.turn) setTurn(gameState.turn);
      if (gameState.dice !== undefined) setDiceVal(gameState.dice);
      if (gameState.statusMsg) setStatusMsg(gameState.statusMsg);
      if (gameState.scores) setScores(gameState.scores);
      if (gameState.betAmount !== undefined) setBetAmount(gameState.betAmount);
      if (gameState.winner) setWinner(gameState.winner);
    }
  }, [gameState]);

  // Authoritative server state synchronization
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !isOpen) return;

    socket.emit('couple_game_get_state', { gameId: 'ludo' });

    const handleStateSync = ({ gameId, state }) => {
      if (gameId !== 'ludo' || !state) return;
      if (state.tokens) setTokens({ H: [...state.tokens.H], A: [...state.tokens.A] });
      if (state.turn) setTurn(state.turn);
      if (state.dice !== undefined) setDiceVal(state.dice);
      if (state.statusMsg) setStatusMsg(state.statusMsg);
      if (state.scores) setScores(state.scores);
      if (state.betAmount !== undefined) setBetAmount(state.betAmount);
      if (state.winner) setWinner(state.winner);
    };

    const handleBroadcast = (data) => {
      if (!data) return;
      const targetGame = data.gameId || (data.tokens ? 'ludo' : 'tictactoe');
      if (targetGame !== 'ludo') return;
      const state = data.state || data;
      if (state.tokens) setTokens({ H: [...state.tokens.H], A: [...state.tokens.A] });
      if (state.turn) setTurn(state.turn);
      if (state.dice !== undefined) setDiceVal(state.dice);
      if (state.statusMsg) setStatusMsg(state.statusMsg);
      if (state.scores) setScores(state.scores);
      if (state.betAmount !== undefined) setBetAmount(state.betAmount);
      if (state.winner) {
        setWinner(state.winner);
        playAudioEffect('win');
        try { confetti({ particleCount: 120, spread: 100 }); } catch (e) {}
      } else if (data.type === 'RESET') {
        setWinner(null);
        setMovableTokens([]);
      }
    };

    socket.on('couple_game_state_sync', handleStateSync);
    socket.on('couple_game_broadcast', handleBroadcast);
    socket.on('arcade_game_action_broadcast', handleBroadcast);

    return () => {
      socket.off('couple_game_state_sync', handleStateSync);
      socket.off('couple_game_broadcast', handleBroadcast);
      socket.off('arcade_game_action_broadcast', handleBroadcast);
    };
  }, [socketRef, isOpen]);

  // Compute movable tokens for current roll
  const getMovable = (player, roll, currentTokens) => {
    const list = [];
    const playerTokens = currentTokens[player] || [-1, -1, -1, -1];
    playerTokens.forEach((pos, idx) => {
      if (pos === -1) {
        if (roll === 6) list.push(idx); // Can deploy from yard on 6
      } else if (pos >= 0 && pos < 56) {
        if (pos + roll <= 56) list.push(idx); // Can move forward if not exceeding Home (56)
      }
    });
    return list;
  };

  // Helper to emit action to backend and parent
  const emitGameAction = (actionPayload) => {
    if (onAction) onAction(actionPayload);
    if (socketRef?.current) {
      socketRef.current.emit('couple_game_action', actionPayload);
      socketRef.current.emit('arcade_game_action', actionPayload);
    }
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
        const nextTurn = turn === 'H' ? 'A' : 'H';
        const msg = `🎲 ${activePlayerName} rolled a ${roll} — No valid moves! Next turn.`;
        setStatusMsg(msg);
        setMovableTokens([]);

        setTimeout(() => {
          setTurn(nextTurn);
          emitGameAction({
            type: 'ROLL_NO_MOVE',
            gameId: 'ludo',
            tokens,
            turn: nextTurn,
            dice: roll,
            statusMsg: msg
          });
        }, 1100);
      } else if (eligible.length === 1) {
        setMovableTokens([]);
        setTimeout(() => {
          executeMove(turn, eligible[0], roll);
        }, 350);
      } else {
        setMovableTokens(eligible);
        setStatusMsg(`🎲 ${activePlayerName} rolled a ${roll}! Tap a highlighted token to advance.`);
      }
    }, 400);
  };

  // Execute a token move
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
      newPos = 0; // Deployed to starting tile
      actionText = `🚀 ${playerName} deployed Token #${tokenIdx + 1} to track!`;
      playAudioEffect('move');
    } else {
      newPos = Math.min(56, currentPos + roll);
      actionText = `➡️ ${playerName} moved Token #${tokenIdx + 1} +${roll} steps.`;
      playAudioEffect('move');
    }

    newTokens[player][tokenIdx] = newPos;

    // Check Capture on common track (0 <= pos <= 50)
    if (newPos >= 0 && newPos <= 50) {
      const globalTile = player === 'H' ? newPos : (13 + newPos) % 52;
      const isSafe = SAFE_COORDS.some(coord => {
        const trackCoord = COMMON_TRACK[globalTile];
        return trackCoord && coord.r === trackCoord.r && coord.c === trackCoord.c;
      });

      if (!isSafe) {
        const opponent = player === 'H' ? 'A' : 'H';
        newTokens[opponent] = newTokens[opponent].map((oppPos) => {
          if (oppPos >= 0 && oppPos <= 50) {
            const oppGlobal = opponent === 'H' ? oppPos : (13 + oppPos) % 52;
            if (oppGlobal === globalTile) {
              isCapture = true;
              return -1; // Reset opponent token to yard!
            }
          }
          return oppPos;
        });

        if (isCapture) {
          playAudioEffect('capture');
          try { confetti({ particleCount: 75, spread: 80 }); } catch (e) {}
          actionText = `⚔️ ${playerName} CAPTURED opponent's token! Bonus roll granted!`;
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
      type: winDeclared ? 'MATCH_FINISH' : 'MOVE',
      gameId: 'ludo',
      tokens: newTokens,
      turn: nextTurn,
      dice: roll,
      statusMsg: actionText,
      winner: winDeclared,
      scores: newScores,
      betAmount
    });
  };

  // Reset match
  const handleResetGame = () => {
    const freshTokens = { H: [-1, -1, -1, -1], A: [-1, -1, -1, -1] };
    setTokens(freshTokens);
    setTurn('H');
    setDiceVal(6);
    setWinner(null);
    setMovableTokens([]);
    const resetMsg = 'Match reset! Darsh rolls first.';
    setStatusMsg(resetMsg);

    emitGameAction({
      type: 'RESET',
      gameId: 'ludo',
      tokens: freshTokens,
      turn: 'H',
      dice: 6,
      statusMsg: resetMsg,
      winner: null,
      scores
    });
  };

  const handleSelectBet = (amt) => {
    if (winner || tokens.H.some(p => p !== -1) || tokens.A.some(p => p !== -1)) return;
    setBetAmount(amt);
    emitGameAction({
      type: 'BET_CHANGE',
      gameId: 'ludo',
      betAmount: amt
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

  // Render 3D Dice Face
  const renderDice = (val, isRollingNow, activeGlow, isRed) => {
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
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-slate-300 shadow-xl p-2 relative select-none flex items-center justify-center transition-all ${
          isRollingNow ? 'animate-spin scale-110' : ''
        } ${activeGlow ? 'ring-4 ring-amber-400 shadow-[0_0_20px_#f59e0b] scale-105' : 'opacity-80'}`}
      >
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 place-items-center">
          {['top-left', 'top-mid', 'top-right', 'mid-left', 'center', 'mid-right', 'bottom-left', 'bottom-mid', 'bottom-right'].map((pos) => {
            const hasDot = activeDots.includes(pos);
            return (
              <div key={pos} className="w-full h-full flex items-center justify-center">
                {hasDot && (
                  <div className={`w-2 h-2 rounded-full shadow-inner ${
                    isRed ? 'bg-red-600' : 'bg-emerald-600'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Find all tokens present at cell coordinate (r, c)
  const getTokensAtCell = (r, c) => {
    const found = [];
    tokens.H.forEach((pos, idx) => {
      if (pos >= 0 && pos <= 50) {
        const coord = COMMON_TRACK[pos];
        if (coord && coord.r === r && coord.c === c) {
          found.push({ player: 'H', idx });
        }
      } else if (pos >= 51 && pos <= 55) {
        const coord = RED_RUNWAY[pos - 51];
        if (coord && coord.r === r && coord.c === c) {
          found.push({ player: 'H', idx });
        }
      }
    });

    tokens.A.forEach((pos, idx) => {
      if (pos >= 0 && pos <= 50) {
        const coord = COMMON_TRACK[(13 + pos) % 52];
        if (coord && coord.r === r && coord.c === c) {
          found.push({ player: 'A', idx });
        }
      } else if (pos >= 51 && pos <= 55) {
        const coord = GREEN_RUNWAY[pos - 51];
        if (coord && coord.r === r && coord.c === c) {
          found.push({ player: 'A', idx });
        }
      }
    });

    return found;
  };

  // Build the list of track/runway cells (excluding the 4 yards and center home)
  // Yards: (0..5, 0..5), (0..5, 9..14), (9..14, 0..5), (9..14, 9..14)
  // Home: (6..8, 6..8)
  const isYardOrHome = (r, c) => {
    if (r < 6 && c < 6) return true; // Red Yard
    if (r < 6 && c > 8) return true; // Green Yard
    if (r > 8 && c < 6) return true; // Blue Yard
    if (r > 8 && c > 8) return true; // Yellow Yard
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return true; // Center Home
    return false;
  };

  const trackCells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (!isYardOrHome(r, c)) {
        trackCells.push({ r, c });
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-3 overflow-y-auto font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-[#121212] border-2 border-amber-500/50 rounded-3xl p-3 sm:p-4 shadow-2xl relative space-y-2.5 my-auto">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-bounce">🎲</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white">Ludo Royale 2P</h3>
                <span className="text-[9px] bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black px-1.5 py-0.2 rounded-full">
                  MOBILE LIVE
                </span>
              </div>
              <p className="text-[10px] text-gray-400">Darsh (Red) vs {activeDoraName} (Green)</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSendInviteToChat}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2 py-1 rounded-xl cursor-pointer shadow flex items-center gap-1 active:scale-95 transition-all"
              title={`Send Ludo Invite to ${oppName} in Chat`}
            >
              <Share2 size={12} />
              <span>Invite</span>
            </button>
            <button
              type="button"
              onClick={handleResetGame}
              className="bg-[#222] hover:bg-[#333] text-amber-400 p-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border border-[#333]"
              title="Reset Board"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white p-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* BET AMOUNT SELECTOR & WIN RULE */}
        <div className="flex items-center justify-between bg-[#181818] border border-[#2b2b2b] px-3 py-1.5 rounded-2xl text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px]">Stakes:</span>
            {[0, 2, 5].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectBet(amt)}
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

          <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
            <span className="text-gray-400">Target:</span>
            <button
              type="button"
              onClick={() => setTokensToWin(tokensToWin === 2 ? 4 : 2)}
              className="bg-[#242424] hover:bg-[#303030] text-amber-400 font-bold px-2.5 py-0.5 rounded-lg cursor-pointer border border-[#383838] transition-all"
              title={tokensToWin === 2 ? "Quick Match: First player to get 2 tokens home wins! Tap for Classic (4 tokens)" : "Classic Match: All 4 tokens home to win. Tap for Quick (2 tokens)"}
            >
              {tokensToWin === 2 ? '⚡ Quick (2 Tokens)' : '🏆 Classic (4 Tokens)'}
            </button>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className="bg-[#181818] border border-[#2b2b2b] py-1.5 px-3 rounded-xl text-xs font-semibold text-amber-300 text-center truncate shadow-inner">
          {statusMsg}
        </div>

        {/* WINNER BANNER */}
        {winner && (
          <div className="bg-gradient-to-r from-amber-500/30 via-emerald-500/30 to-amber-500/30 border-2 border-amber-400 text-amber-200 py-2.5 px-3 rounded-2xl text-xs font-black animate-bounce shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400 animate-spin" />
              <span>{winner === 'H' ? 'Darsh (Red)' : `${activeDoraName} (Green)`} Won the Match!</span>
            </div>
            <button
              type="button"
              onClick={handleResetGame}
              className="bg-amber-500 hover:bg-amber-400 text-black px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer shadow"
            >
              Play Again
            </button>
          </div>
        )}

        {/* --- AUTHENTIC 15x15 LUDO BOARD (INLINE CSS GRID - 100% BULLETPROOF) --- */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
            width: '100%',
            aspectRatio: '1 / 1'
          }}
          className="bg-[#0b0f19] border-4 border-amber-500/90 rounded-3xl p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.9)] select-none relative overflow-hidden gap-[1px]"
        >
          {/* 1. TOP-LEFT 6x6: RED YARD (DARSH) */}
          <div 
            style={{ gridColumn: '1 / span 6', gridRow: '1 / span 6' }}
            className={`w-full h-full bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-2xl p-1.5 border-2 border-red-800 shadow-md flex flex-col justify-between ${
              turn === 'H' ? 'ring-2 ring-red-400 shadow-red-900/50' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-black text-white px-1">
              <span>RED YARD</span>
              <span>👑 Darsh</span>
            </div>
            <div className="bg-white/95 rounded-xl p-1 h-[78%] grid grid-cols-2 gap-1 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((tIdx) => {
                const inYard = tokens.H[tIdx] === -1;
                const isMovable = movableTokens.includes(tIdx) && turn === 'H';
                return (
                  <div
                    key={`H_yard_${tIdx}`}
                    onClick={() => {
                      if (isMovable && isMyTurn) executeMove('H', tIdx, diceVal);
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-red-300 flex items-center justify-center transition-all ${
                      inYard ? 'bg-red-50' : 'bg-gray-100 opacity-25'
                    } ${isMovable ? 'cursor-pointer scale-115 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                  >
                    {inYard && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white text-[9px] font-black flex items-center justify-center shadow-md border-2 border-white">
                        H{tIdx + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. TOP-RIGHT 6x6: GREEN YARD (DORA) */}
          <div 
            style={{ gridColumn: '10 / span 6', gridRow: '1 / span 6' }}
            className={`w-full h-full bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-1.5 border-2 border-emerald-800 shadow-md flex flex-col justify-between ${
              turn === 'A' ? 'ring-2 ring-emerald-400 shadow-emerald-900/50' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-black text-white px-1">
              <span>GREEN YARD</span>
              <span>💕 {activeDoraName}</span>
            </div>
            <div className="bg-white/95 rounded-xl p-1 h-[78%] grid grid-cols-2 gap-1 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((tIdx) => {
                const inYard = tokens.A[tIdx] === -1;
                const isMovable = movableTokens.includes(tIdx) && turn === 'A';
                return (
                  <div
                    key={`A_yard_${tIdx}`}
                    onClick={() => {
                      if (isMovable && isMyTurn) executeMove('A', tIdx, diceVal);
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center transition-all ${
                      inYard ? 'bg-emerald-50' : 'bg-gray-100 opacity-25'
                    } ${isMovable ? 'cursor-pointer scale-115 ring-4 ring-amber-400 animate-bounce z-20' : ''}`}
                  >
                    {inYard && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[9px] font-black flex items-center justify-center shadow-md border-2 border-white">
                        A{tIdx + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. BOTTOM-LEFT 6x6: BLUE YARD */}
          <div 
            style={{ gridColumn: '1 / span 6', gridRow: '10 / span 6' }}
            className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-1.5 border-2 border-blue-800 shadow-md flex flex-col justify-between opacity-80"
          >
            <div className="text-[10px] font-black text-white px-1">BLUE YARD</div>
            <div className="bg-white/95 rounded-xl p-1 h-[78%] grid grid-cols-2 gap-1 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-blue-300 bg-blue-50" />
              ))}
            </div>
          </div>

          {/* 4. BOTTOM-RIGHT 6x6: YELLOW YARD */}
          <div 
            style={{ gridColumn: '10 / span 6', gridRow: '10 / span 6' }}
            className="w-full h-full bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-2xl p-1.5 border-2 border-amber-800 shadow-md flex flex-col justify-between opacity-80"
          >
            <div className="text-[10px] font-black text-amber-950 px-1">YELLOW YARD</div>
            <div className="bg-white/95 rounded-xl p-1 h-[78%] grid grid-cols-2 gap-1 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-amber-300 bg-amber-50" />
              ))}
            </div>
          </div>

          {/* 5. CENTER 3x3: HOME TRIANGLE */}
          <div 
            style={{ gridColumn: '7 / span 3', gridRow: '7 / span 3' }}
            className="w-full h-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-xl border-2 border-amber-600 shadow-inner flex flex-col items-center justify-center relative overflow-hidden"
          >
            <span className="text-xl sm:text-2xl animate-bounce">👑</span>
            <span className="text-[7px] font-black text-amber-950 uppercase tracking-tight">HOME</span>
            
            {/* Tokens in Home */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-wrap gap-0.5 justify-center max-w-[90%]">
                {tokens.H.filter(p => p === 56).map((_, i) => (
                  <span key={`h_home_${i}`} className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white text-[7px] text-white font-bold flex items-center justify-center">
                    H
                  </span>
                ))}
                {tokens.A.filter(p => p === 56).map((_, i) => (
                  <span key={`a_home_${i}`} className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white text-[7px] text-white font-bold flex items-center justify-center">
                    A
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 6. ALL 72 TRACK & RUNWAY CELLS (AT EXACT 15x15 COORDINATES) */}
          {trackCells.map(({ r, c }) => {
            const isSafe = isCellSafe(r, c);
            const isRedStart = (r === 6 && c === 1);
            const isGreenStart = (r === 1 && c === 8);
            const isBlueStart = (r === 13 && c === 6);
            const isYellowStart = (r === 8 && c === 13);
            
            const isRedRunway = (r === 7 && c >= 1 && c <= 5);
            const isGreenRunway = (c === 7 && r >= 1 && r <= 5);
            const isBlueRunway = (c === 7 && r >= 9 && r <= 13);
            const isYellowRunway = (r === 7 && c >= 9 && c <= 13);

            let bgClass = 'bg-white';
            if (isRedStart || isRedRunway) bgClass = 'bg-red-500';
            else if (isGreenStart || isGreenRunway) bgClass = 'bg-emerald-500';
            else if (isBlueStart || isBlueRunway) bgClass = 'bg-blue-500';
            else if (isYellowStart || isYellowRunway) bgClass = 'bg-amber-400';

            const cellTokens = getTokensAtCell(r, c);

            return (
              <div
                key={`cell_${r}_${c}`}
                style={{
                  gridColumn: `${c + 1} / span 1`,
                  gridRow: `${r + 1} / span 1`
                }}
                className={`border-[0.5px] border-slate-300 relative flex items-center justify-center w-full h-full ${bgClass}`}
              >
                {/* Safe Star Icon */}
                {isSafe && !cellTokens.length && (
                  <span className={`text-[8px] sm:text-[10px] font-black select-none ${
                    isRedStart || isGreenStart || isBlueStart || isYellowStart ? 'text-white' : 'text-amber-500'
                  }`}>★</span>
                )}

                {/* Runway Arrows */}
                {isRedRunway && !cellTokens.length && (
                  <span className="text-[7px] font-bold text-white select-none">➔</span>
                )}
                {isGreenRunway && !cellTokens.length && (
                  <span className="text-[7px] font-bold text-white select-none">⬇</span>
                )}
                {isBlueRunway && !cellTokens.length && (
                  <span className="text-[7px] font-bold text-white select-none">⬆</span>
                )}
                {isYellowRunway && !cellTokens.length && (
                  <span className="text-[7px] font-bold text-white select-none">⬅</span>
                )}

                {/* Render Pawns */}
                {cellTokens.map((tok) => {
                  const isMovable = movableTokens.includes(tok.idx) && turn === tok.player;
                  return (
                    <div
                      key={`${tok.player}_${tok.idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMovable && isMyTurn) executeMove(tok.player, tok.idx, diceVal);
                      }}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-black shadow-md border-2 border-white transition-all z-20 ${
                        tok.player === 'H' 
                          ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' 
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                      } ${isMovable ? 'cursor-pointer scale-125 ring-4 ring-amber-400 animate-bounce' : ''}`}
                    >
                      {tok.player === 'H' ? 'H' : 'A'}{tok.idx + 1}
                    </div>
                  );
                })}
              </div>
            );
          })}
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
              {renderDice(diceVal, isRolling && turn === 'H', turn === 'H' && isCurrentAdmin, true)}
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
              {renderDice(diceVal, isRolling && turn === 'A', turn === 'A' && !isCurrentAdmin, false)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Trophy, RotateCcw, Share2, Sparkles, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

// 8 Standard Star Safe Tile Indices on 52-tile common circuit
export const SAFE_TILE_INDICES = [0, 9, 13, 22, 26, 35, 39, 48];

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
  onSendChatInvite
}) {
  const [tokens, setTokens] = useState({
    H: [-1, -1, -1, -1],
    A: [-1, -1, -1, -1]
  });
  const [turn, setTurn] = useState('H'); // 'H' (Darsh) | 'A' (Dora)
  const [diceVal, setDiceVal] = useState(6);
  const [isRolling, setIsRolling] = useState(false);
  const [movableTokens, setMovableTokens] = useState([]);
  const [statusMsg, setStatusMsg] = useState('Match ready! Darsh rolls first.');
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ H: 0, A: 0 });
  const [betAmount, setBetAmount] = useState(2.0);
  const [tokensToWin, setTokensToWin] = useState(2); // 2 tokens for quick mobile match

  const isCurrentAdmin = (role === 'parent' || role === 'admin');
  const myPlayerKey = isCurrentAdmin ? 'H' : 'A';
  const myName = isCurrentAdmin ? 'Darsh' : activeDoraName;
  const oppName = isCurrentAdmin ? activeDoraName : 'Darsh';
  const isMyTurn = (turn === myPlayerKey);

  // Authoritative server state synchronization
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !isOpen) return;

    // 1. Immediately request live state from server
    socket.emit('couple_game_get_state', { gameId: 'ludo' });

    const handleStateSync = ({ gameId, state }) => {
      if (gameId !== 'ludo' || !state) return;
      if (state.tokens) setTokens(state.tokens);
      if (state.turn) setTurn(state.turn);
      if (state.dice !== undefined) setDiceVal(state.dice);
      if (state.statusMsg) setStatusMsg(state.statusMsg);
      if (state.scores) setScores(state.scores);
      if (state.betAmount !== undefined) setBetAmount(state.betAmount);
      if (state.winner) setWinner(state.winner);
    };

    const handleBroadcast = (data) => {
      if (!data || data.gameId !== 'ludo') return;
      const state = data.state || data;
      if (state.tokens) setTokens(state.tokens);
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

    return () => {
      socket.off('couple_game_state_sync', handleStateSync);
      socket.off('couple_game_broadcast', handleBroadcast);
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
      const isSafe = SAFE_TILE_INDICES.includes(globalTile);

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
      scores: newScores,
      winner: winDeclared,
      betAmount
    });
  };

  const emitGameAction = (payload) => {
    if (socketRef?.current) {
      socketRef.current.emit('couple_game_action', payload);
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
      type: 'RESET',
      gameId: 'ludo',
      tokens: initTokens,
      turn: 'H',
      dice: 6,
      statusMsg: resetText,
      winner: null,
      betAmount
    });
  };

  const handleSelectBet = (amt) => {
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
        className={`w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-slate-300 shadow-xl p-2 relative select-none flex items-center justify-center transition-all ${
          isRollingNow ? 'animate-spin scale-110' : ''
        } ${activeGlow ? 'ring-4 ring-amber-400 shadow-[0_0_20px_#f59e0b] scale-105' : 'opacity-80'}`}
      >
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 place-items-center">
          {['top-left', 'top-mid', 'top-right', 'mid-left', 'center', 'mid-right', 'bottom-left', 'bottom-mid', 'bottom-right'].map((pos) => {
            const hasDot = activeDots.includes(pos);
            return (
              <div key={pos} className="w-full h-full flex items-center justify-center">
                {hasDot && (
                  <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${
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

  // Find tokens on a common track tile (0..51)
  const getTokensOnCommonTile = (globalTile) => {
    const res = [];
    tokens.H.forEach((pos, idx) => {
      if (pos >= 0 && pos <= 50 && pos === globalTile) {
        res.push({ player: 'H', idx });
      }
    });
    tokens.A.forEach((pos, idx) => {
      if (pos >= 0 && pos <= 50 && ((13 + pos) % 52) === globalTile) {
        res.push({ player: 'A', idx });
      }
    });
    return res;
  };

  // Find tokens on Home Runway (1..5)
  const getTokensOnRunway = (player, runwayStep) => {
    const res = [];
    tokens[player].forEach((pos, idx) => {
      if (pos === 50 + runwayStep) {
        res.push({ player, idx });
      }
    });
    return res;
  };

  // Helper to render track tile
  const renderTile = (globalIndex, label = '', isSafe = false, bgClass = 'bg-white', customContent = null) => {
    const isStar = isSafe || SAFE_TILE_INDICES.includes(globalIndex);
    const cellTokens = (globalIndex !== null && globalIndex !== undefined) ? getTokensOnCommonTile(globalIndex) : [];

    return (
      <div 
        key={`tile_${globalIndex}_${label}`}
        className={`border-[0.5px] border-slate-300 relative flex items-center justify-center w-full h-full ${bgClass}`}
      >
        {isStar && !cellTokens.length && !customContent && (
          <span className="text-[10px] sm:text-xs font-black text-amber-500 select-none">★</span>
        )}
        {customContent}
        {cellTokens.map((tok) => {
          const isMovable = movableTokens.includes(tok.idx) && turn === tok.player;
          return (
            <div
              key={`${tok.player}_${tok.idx}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isMovable && isMyTurn) executeMove(tok.player, tok.idx, diceVal);
              }}
              className={`w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-black shadow-md border-2 border-white transition-all z-20 ${
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
  };

  // Helper to render runway tile
  const renderRunwayTile = (player, stepNum, bgClass) => {
    const cellTokens = getTokensOnRunway(player, stepNum);
    return (
      <div 
        key={`runway_${player}_${stepNum}`}
        className={`border-[0.5px] border-slate-300 relative flex items-center justify-center w-full h-full ${bgClass}`}
      >
        {!cellTokens.length && (
          <span className="text-[8px] font-bold text-white/80 select-none">{player === 'H' ? '➔' : '⬇'}</span>
        )}
        {cellTokens.map((tok) => {
          const isMovable = movableTokens.includes(tok.idx) && turn === tok.player;
          return (
            <div
              key={`${tok.player}_${tok.idx}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isMovable && isMyTurn) executeMove(tok.player, tok.idx, diceVal);
              }}
              className={`w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-black shadow-md border-2 border-white transition-all z-20 ${
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
  };

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

        {/* --- AUTHENTIC 3-BAND STANDARD LUDO BOARD (BULLETPROOF GEOMETRY) --- */}
        <div className="w-full aspect-square bg-[#0b0f19] border-4 border-amber-500/90 rounded-3xl p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex flex-col justify-between select-none relative overflow-hidden">
          
          {/* BAND 1: TOP BAND (HEIGHT 40%) -> RED YARD (40%) | TOP ARM (20%) | GREEN YARD (40%) */}
          <div className="h-[40%] flex justify-between gap-1 w-full">
            
            {/* 1A. RED YARD (DARSH) */}
            <div className={`w-[40%] h-full bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-2xl p-1.5 border-2 border-red-800 shadow-md flex flex-col justify-between ${
              turn === 'H' ? 'ring-2 ring-red-400 shadow-red-900/50' : ''
            }`}>
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

            {/* 1B. TOP ARM (3 COLS x 6 ROWS) */}
            <div className="w-[20%] h-full bg-slate-100 rounded-xl border border-slate-300 p-0.5 grid grid-cols-3 grid-rows-6">
              {/* Row 0 */}
              {renderTile(10, '10')}
              {renderTile(11, '11')}
              {renderTile(12, '12')}
              {/* Row 1 */}
              {renderTile(9, '9', true)}
              {renderRunwayTile('A', 1, 'bg-emerald-500')}
              {renderTile(13, '13', true, 'bg-emerald-200', <span className="text-[8px] font-black text-emerald-800">⬇</span>)}
              {/* Row 2 */}
              {renderTile(8, '8')}
              {renderRunwayTile('A', 2, 'bg-emerald-500')}
              {renderTile(14, '14')}
              {/* Row 3 */}
              {renderTile(7, '7')}
              {renderRunwayTile('A', 3, 'bg-emerald-500')}
              {renderTile(15, '15')}
              {/* Row 4 */}
              {renderTile(6, '6')}
              {renderRunwayTile('A', 4, 'bg-emerald-500')}
              {renderTile(16, '16')}
              {/* Row 5 */}
              {renderTile(5, '5')}
              {renderRunwayTile('A', 5, 'bg-emerald-500')}
              {renderTile(17, '17')}
            </div>

            {/* 1C. GREEN YARD (DORA) */}
            <div className={`w-[40%] h-full bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-1.5 border-2 border-emerald-800 shadow-md flex flex-col justify-between ${
              turn === 'A' ? 'ring-2 ring-emerald-400 shadow-emerald-900/50' : ''
            }`}>
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

          </div>

          {/* BAND 2: MIDDLE BAND (HEIGHT 20%) -> LEFT ARM (40%) | CENTER HOME (20%) | RIGHT ARM (40%) */}
          <div className="h-[20%] flex justify-between gap-1 w-full my-0.5">
            
            {/* 2A. LEFT ARM (6 COLS x 3 ROWS) */}
            <div className="w-[40%] h-full bg-slate-100 rounded-xl border border-slate-300 p-0.5 grid grid-cols-6 grid-rows-3">
              {/* Row 0 */}
              {renderTile(51, '51')}
              {renderTile(0, '0', true, 'bg-red-200', <span className="text-[8px] font-black text-red-800">➔</span>)}
              {renderTile(1, '1')}
              {renderTile(2, '2')}
              {renderTile(3, '3')}
              {renderTile(4, '4')}
              {/* Row 1 */}
              {renderTile(50, '50')}
              {renderRunwayTile('H', 1, 'bg-red-500')}
              {renderRunwayTile('H', 2, 'bg-red-500')}
              {renderRunwayTile('H', 3, 'bg-red-500')}
              {renderRunwayTile('H', 4, 'bg-red-500')}
              {renderRunwayTile('H', 5, 'bg-red-500')}
              {/* Row 2 */}
              {renderTile(49, '49')}
              {renderTile(48, '48', true)}
              {renderTile(47, '47')}
              {renderTile(46, '46')}
              {renderTile(45, '45')}
              {renderTile(44, '44')}
            </div>

            {/* 2B. CENTER HOME (3x3 EQUIVALENT) */}
            <div className="w-[20%] h-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-xl border-2 border-amber-600 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-xl sm:text-2xl animate-bounce">👑</span>
              <span className="text-[7px] font-black text-amber-950 uppercase tracking-tight">HOME</span>
              
              {/* Render Home Pawns */}
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

            {/* 2C. RIGHT ARM (6 COLS x 3 ROWS) */}
            <div className="w-[40%] h-full bg-slate-100 rounded-xl border border-slate-300 p-0.5 grid grid-cols-6 grid-rows-3">
              {/* Row 0 */}
              {renderTile(18, '18')}
              {renderTile(19, '19')}
              {renderTile(20, '20')}
              {renderTile(21, '21')}
              {renderTile(22, '22', true)}
              {renderTile(23, '23')}
              {/* Row 1 */}
              <div className="border-[0.5px] border-slate-300 bg-amber-400 flex items-center justify-center text-[7px] text-white font-bold">⬅</div>
              <div className="border-[0.5px] border-slate-300 bg-amber-400 flex items-center justify-center text-[7px] text-white font-bold">⬅</div>
              <div className="border-[0.5px] border-slate-300 bg-amber-400 flex items-center justify-center text-[7px] text-white font-bold">⬅</div>
              <div className="border-[0.5px] border-slate-300 bg-amber-400 flex items-center justify-center text-[7px] text-white font-bold">⬅</div>
              <div className="border-[0.5px] border-slate-300 bg-amber-400 flex items-center justify-center text-[7px] text-white font-bold">⬅</div>
              {renderTile(24, '24')}
              {/* Row 2 */}
              {renderTile(30, '30')}
              {renderTile(29, '29')}
              {renderTile(28, '28')}
              {renderTile(27, '27')}
              {renderTile(26, '26', true, 'bg-amber-100', <span className="text-[8px] font-black text-amber-800">⬅</span>)}
              {renderTile(25, '25')}
            </div>

          </div>

          {/* BAND 3: BOTTOM BAND (HEIGHT 40%) -> BLUE YARD (40%) | BOTTOM ARM (20%) | YELLOW YARD (40%) */}
          <div className="h-[40%] flex justify-between gap-1 w-full">
            
            {/* 3A. BLUE YARD (CLASSIC DECORATIVE) */}
            <div className="w-[40%] h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-1.5 border-2 border-blue-800 shadow-md flex flex-col justify-between opacity-85">
              <span className="text-[10px] font-black text-white px-1">BLUE YARD</span>
              <div className="bg-white/95 rounded-xl p-1 h-[78%] grid grid-cols-2 gap-1 place-items-center">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-blue-300 bg-blue-50" />
                ))}
              </div>
            </div>

            {/* 3B. BOTTOM ARM (3 COLS x 6 ROWS) */}
            <div className="w-[20%] h-full bg-slate-100 rounded-xl border border-slate-300 p-0.5 grid grid-cols-3 grid-rows-6">
              {/* Row 0 */}
              {renderTile(43, '43')}
              <div className="border-[0.5px] border-slate-300 bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">⬆</div>
              {renderTile(31, '31')}
              {/* Row 1 */}
              {renderTile(42, '42')}
              <div className="border-[0.5px] border-slate-300 bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">⬆</div>
              {renderTile(32, '32')}
              {/* Row 2 */}
              {renderTile(41, '41')}
              <div className="border-[0.5px] border-slate-300 bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">⬆</div>
              {renderTile(33, '33')}
              {/* Row 3 */}
              {renderTile(40, '40')}
              <div className="border-[0.5px] border-slate-300 bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">⬆</div>
              {renderTile(34, '34')}
              {/* Row 4 */}
              {renderTile(39, '39', true, 'bg-blue-100', <span className="text-[8px] font-black text-blue-800">⬆</span>)}
              <div className="border-[0.5px] border-slate-300 bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">⬆</div>
              {renderTile(35, '35', true)}
              {/* Row 5 */}
              {renderTile(38, '38')}
              {renderTile(37, '37')}
              {renderTile(36, '36')}
            </div>

            {/* 3C. YELLOW YARD (CLASSIC DECORATIVE) */}
            <div className="w-[40%] h-full bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-1.5 border-2 border-amber-800 shadow-md flex flex-col justify-between opacity-85">
              <span className="text-[10px] font-black text-amber-950 px-1">YELLOW YARD</span>
              <div className="bg-white/95 rounded-xl p-1 h-[78%] grid grid-cols-2 gap-1 place-items-center">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-amber-300 bg-amber-50" />
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* CONTROLS & DICE DECKS FOR DARSH & DORA */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* DARSH (RED) DECK */}
          <div 
            onClick={() => {
              if (turn === 'H' && isCurrentAdmin) handleRollDice();
            }}
            className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
              turn === 'H'
                ? 'bg-red-950/70 border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-900/40' 
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
                <span className="inline-block text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.2 rounded font-mono animate-pulse">
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
            className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
              turn === 'A'
                ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-900/40' 
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
                <span className="inline-block text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.2 rounded font-mono animate-pulse">
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

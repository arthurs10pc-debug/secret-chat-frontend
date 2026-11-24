import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, RotateCcw, Share2, Sparkles, Volume2, VolumeX, Bot, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- SNAKES & LADDERS BOARD CONFIGURATION (Matches authentic 10x10 board.png) ---
export const SNAKES = {
  25: 4,
  42: 1,
  56: 48,
  61: 43,
  92: 73,
  94: 12,
  98: 79
};

export const LADDERS = {
  7: 29,
  16: 34,
  20: 39,
  36: 77,
  50: 69,
  63: 81,
  71: 90,
  86: 97
};

// Calculate percentage coordinates (x, y) on 10x10 board for tile (1 to 100)
export function getTileCoordinates(tileNumber) {
  if (tileNumber <= 0) return { x: 5, y: 95 }; // Starting zone (outside Tile 1)
  const clamped = Math.min(100, Math.max(1, tileNumber));
  const rowFromBottom = Math.floor((clamped - 1) / 10); // 0 to 9
  const remainder = (clamped - 1) % 10; // 0 to 9

  // Even row (0, 2, 4, 6, 8): left to right (col 0 to 9)
  // Odd row (1, 3, 5, 7, 9): right to left (col 9 to 0)
  const col = (rowFromBottom % 2 === 0) ? remainder : (9 - remainder);

  // Tile center percentage
  const x = (col + 0.5) * 10;
  const y = (9 - rowFromBottom + 0.5) * 10;

  return { x, y };
}

// Synthesized Web Audio Effects for 100% reliability on all mobile browsers
export const playSnakesSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'dice') {
      // Shaking dice rattle
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300 + Math.random() * 250, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.06);
          } catch (e) {}
        }, i * 60);
      }
    } else if (type === 'step') {
      // Pawn hop tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'ladder') {
      // Cheerful ascending chime
      [392.00, 523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.18);
          } catch (e) {}
        }, idx * 70);
      });
    } else if (type === 'snake') {
      // Slide down pitch drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } else if (type === 'win') {
      // Grand victory fanfare
      [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.28);
          } catch (e) {}
        }, idx * 110);
      });
    }
  } catch (e) {}
};

export default function SnakesLaddersModal({
  isOpen,
  onClose,
  socketRef,
  role,
  activeDoraName,
  onSendChatInvite,
  gameState
}) {
  const isCurrentAdmin = (role === 'parent' || role === 'admin');
  const myPlayerKey = isCurrentAdmin ? 'H' : 'A';
  const myName = isCurrentAdmin ? 'Darsh' : activeDoraName;
  const oppName = isCurrentAdmin ? activeDoraName : 'Darsh';

  // Game Mode: 'online' (multiplayer with partner) | 'bot' (play with bot) | 'pass' (pass & play on same screen)
  const [gameMode, setGameMode] = useState('online');

  // Player positions: 0 means starting dock outside the board; 1 to 100
  const [players, setPlayers] = useState({
    H: { position: gameState?.players?.H?.position ?? 0, name: 'Darsh', color: 'red' },
    A: { position: gameState?.players?.A?.position ?? 0, name: activeDoraName || 'Dora', color: 'blue' }
  });

  const [turn, setTurn] = useState(gameState?.turn || 'H');
  const [diceVal, setDiceVal] = useState(gameState?.dice ?? 1);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [specialActionText, setSpecialActionText] = useState('');
  const [statusMsg, setStatusMsg] = useState(gameState?.statusMsg || 'Game ready! Roll dice to begin.');
  const [winner, setWinner] = useState(gameState?.winner || null);
  const [scores, setScores] = useState(gameState?.scores || { H: 0, A: 0 });
  const [betAmount, setBetAmount] = useState(gameState?.betAmount ?? 2.0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const rollAudioRef = useRef(null);

  // Sync state from server authoritative broadcast
  useEffect(() => {
    if (gameMode !== 'online' || !gameState) return;
    if (gameState.players) {
      setPlayers(prev => ({
        H: { ...prev.H, position: gameState.players.H?.position ?? prev.H.position },
        A: { ...prev.A, position: gameState.players.A?.position ?? prev.A.position }
      }));
    }
    if (gameState.turn) setTurn(gameState.turn);
    if (gameState.dice !== undefined) setDiceVal(gameState.dice);
    if (gameState.statusMsg) setStatusMsg(gameState.statusMsg);
    if (gameState.winner !== undefined) setWinner(gameState.winner);
    if (gameState.scores) setScores(gameState.scores);
    if (gameState.betAmount !== undefined) setBetAmount(gameState.betAmount);
  }, [gameState, gameMode]);

  // Play audio file or fallback
  const playSoundEffect = (type) => {
    if (!soundEnabled) return;
    if (type === 'dice') {
      try {
        if (!rollAudioRef.current) {
          rollAudioRef.current = new Audio('/snakes/roll.mp3');
        }
        rollAudioRef.current.currentTime = 0;
        rollAudioRef.current.play().catch(() => playSnakesSound('dice'));
      } catch (e) {
        playSnakesSound('dice');
      }
    } else {
      playSnakesSound(type);
    }
  };

  // Check if current user is allowed to roll
  const isMyTurn = (gameMode === 'pass') || (gameMode === 'bot' && turn === myPlayerKey) || (gameMode === 'online' && turn === myPlayerKey);

  // Bot auto-play turn with human delay
  useEffect(() => {
    if (gameMode !== 'bot' || winner || isMoving || isRolling) return;
    const botKey = myPlayerKey === 'H' ? 'A' : 'H';
    if (turn === botKey) {
      const timer = setTimeout(() => {
        executeDiceRoll(botKey);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, winner, isMoving, isRolling, myPlayerKey]);

  // Main Dice Roll Logic
  const executeDiceRoll = (playerKey) => {
    if (isRolling || isMoving || winner) return;

    setIsRolling(true);
    playSoundEffect('dice');
    setSpecialActionText('');

    const targetPlayerName = playerKey === 'H' ? 'Darsh' : (gameMode === 'bot' ? 'Bot' : activeDoraName);
    setStatusMsg(`${targetPlayerName} is rolling... 🎲`);

    // Dice rolling animation face cycling
    let cycleCount = 0;
    const cycleInterval = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      cycleCount++;
      if (cycleCount > 7) {
        clearInterval(cycleInterval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceVal(finalRoll);
        setIsRolling(false);
        handlePawnMove(playerKey, finalRoll);
      }
    }, 60);
  };

  // Step-by-step Pawn Moving with Ladder & Snake Detection
  const handlePawnMove = async (playerKey, roll) => {
    setIsMoving(true);
    const startPos = players[playerKey]?.position || 0;
    const targetPlayerName = playerKey === 'H' ? 'Darsh' : (gameMode === 'bot' ? 'Bot' : activeDoraName);

    // Can only move if total <= 100
    if (startPos + roll > 100) {
      setStatusMsg(`${targetPlayerName} rolled ${roll}, but needs exact ${100 - startPos} to win!`);
      setIsMoving(false);
      // Switch turn unless rolled 6
      const nextTurn = roll === 6 ? playerKey : (playerKey === 'H' ? 'A' : 'H');
      setTurn(nextTurn);
      broadcastState({ turn: nextTurn, dice: roll, statusMsg: `${targetPlayerName} needs exact count to reach 100.` });
      return;
    }

    // Step 1: Animate pawn moving 1 square at a time
    let currentPos = startPos;
    for (let step = 1; step <= roll; step++) {
      await new Promise(r => setTimeout(r, 180));
      currentPos += 1;
      playSoundEffect('step');
      setPlayers(prev => ({
        ...prev,
        [playerKey]: { ...prev[playerKey], position: currentPos }
      }));
    }

    // Check WIN condition (Reached 100)
    if (currentPos === 100) {
      playSoundEffect('win');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      setWinner(playerKey);
      setStatusMsg(`🏆 ${targetPlayerName} WON THE MATCH! Congratulations!`);
      const updatedScores = {
        ...scores,
        [playerKey]: (scores[playerKey] || 0) + 1
      };
      setScores(updatedScores);

      broadcastState({
        type: 'MATCH_FINISH',
        winner: playerKey,
        scores: updatedScores,
        betAmount,
        players: {
          ...players,
          [playerKey]: { ...players[playerKey], position: 100 }
        },
        statusMsg: `🏆 ${targetPlayerName} reached 100 and WON!`
      });
      setIsMoving(false);
      return;
    }

    // Check LADDER or SNAKE
    let finalPos = currentPos;
    let actionBanner = '';

    if (LADDERS[currentPos]) {
      finalPos = LADDERS[currentPos];
      actionBanner = `🪜 LADDER! Climbed from ${currentPos} to ${finalPos}!`;
      setSpecialActionText(actionBanner);
      setStatusMsg(`${targetPlayerName} hit a LADDER! 🪜 Climbing to ${finalPos}!`);
      await new Promise(r => setTimeout(r, 450));
      playSoundEffect('ladder');
      setPlayers(prev => ({
        ...prev,
        [playerKey]: { ...prev[playerKey], position: finalPos }
      }));
      await new Promise(r => setTimeout(r, 500));
    } else if (SNAKES[currentPos]) {
      finalPos = SNAKES[currentPos];
      actionBanner = `🐍 OUCH! Snake bite! Slithered from ${currentPos} to ${finalPos}!`;
      setSpecialActionText(actionBanner);
      setStatusMsg(`🐍 Snake bite! ${targetPlayerName} fell back to ${finalPos}!`);
      await new Promise(r => setTimeout(r, 450));
      playSoundEffect('snake');
      setPlayers(prev => ({
        ...prev,
        [playerKey]: { ...prev[playerKey], position: finalPos }
      }));
      await new Promise(r => setTimeout(r, 500));
    }

    // Bonus roll if rolled a 6
    let nextTurn = playerKey;
    if (roll === 6) {
      setStatusMsg(`🎲 Rolled a 6! ${targetPlayerName} gets a BONUS TURN!`);
      setSpecialActionText('⚡ ROLLED A 6! EXTRA TURN!');
    } else {
      nextTurn = playerKey === 'H' ? 'A' : 'H';
      const nextPlayerName = nextTurn === 'H' ? 'Darsh' : (gameMode === 'bot' ? 'Bot' : activeDoraName);
      setStatusMsg(`${nextPlayerName}'s turn to roll!`);
    }

    const updatedPlayers = {
      ...players,
      [playerKey]: { ...players[playerKey], position: finalPos }
    };

    setTurn(nextTurn);
    setIsMoving(false);

    broadcastState({
      players: updatedPlayers,
      turn: nextTurn,
      dice: roll,
      statusMsg: `${targetPlayerName} is now on square ${finalPos}.`
    });
  };

  // Broadcast to other client via Socket.io
  const broadcastState = (extraData = {}) => {
    if (gameMode !== 'online' || !socketRef?.current) return;
    const payload = {
      gameId: 'snakes',
      game: 'snakes',
      betAmount,
      ...extraData
    };
    socketRef.current.emit('couple_game_action', payload);
    socketRef.current.emit('arcade_game_action', payload);
  };

  // Reset Match
  const handleResetGame = () => {
    const initPlayers = {
      H: { position: 0, name: 'Darsh', color: 'red' },
      A: { position: 0, name: gameMode === 'bot' ? 'Bot' : (activeDoraName || 'Dora'), color: 'blue' }
    };
    setPlayers(initPlayers);
    setTurn('H');
    setDiceVal(1);
    setWinner(null);
    setSpecialActionText('');
    setStatusMsg('Game reset! Darsh rolls first.');

    if (gameMode === 'online' && socketRef?.current) {
      socketRef.current.emit('couple_game_action', {
        gameId: 'snakes',
        game: 'snakes',
        type: 'RESET',
        betAmount
      });
    }
  };

  // Challenge in Chat
  const handleSendInvite = () => {
    if (onSendChatInvite) {
      onSendChatInvite('snakes', betAmount);
    }
  };

  if (!isOpen) return null;

  // Pawn coordinate offsets if both players are on the same square
  const hPos = getTileCoordinates(players.H?.position || 0);
  const aPos = getTileCoordinates(players.A?.position || 0);
  const isSameTile = (players.H?.position === players.A?.position && players.H?.position > 0);

  const hOffsetX = isSameTile ? -1.8 : 0;
  const hOffsetY = isSameTile ? -1.8 : 0;
  const aOffsetX = isSameTile ? 1.8 : 0;
  const aOffsetY = isSameTile ? 1.8 : 0;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#121214] border-2 border-amber-500/60 rounded-3xl max-w-xl w-full p-3 sm:p-5 text-center shadow-2xl relative flex flex-col max-h-[96vh] overflow-y-auto scrollbar-none animate-in zoom-in-95 duration-200">

        {/* HEADER BAR */}
        <div className="flex items-center justify-between border-b border-[#282828] pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-amber-500 to-rose-500 flex items-center justify-center text-lg shadow-md">
              🐍
            </div>
            <div className="text-left">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>Snakes & Ladders</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">100 TILES</span>
              </h3>
              <p className="text-[11px] text-gray-400">
                {gameMode === 'bot' ? 'Playing vs Smart Bot' : `Playing with ${oppName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2e2e2e] cursor-pointer"
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button
              type="button"
              onClick={handleResetGame}
              className="p-1.5 rounded-xl bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2e2e2e] cursor-pointer"
              title="Reset Game Board"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2e2e2e] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MODE SELECTOR & SCORE BAR */}
        <div className="flex items-center justify-between gap-2 py-2 shrink-0">
          <div className="flex items-center gap-1 bg-[#18181a] p-1 rounded-xl border border-[#292929] text-xs">
            <button
              type="button"
              onClick={() => { setGameMode('online'); handleResetGame(); }}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                gameMode === 'online' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={12} />
              <span>Online 2P</span>
            </button>
            <button
              type="button"
              onClick={() => { setGameMode('bot'); handleResetGame(); }}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                gameMode === 'bot' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bot size={12} />
              <span>Vs Bot</span>
            </button>
            <button
              type="button"
              onClick={() => { setGameMode('pass'); handleResetGame(); }}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                gameMode === 'pass' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Pass & Play</span>
            </button>
          </div>

          {/* BET AMOUNT / POT */}
          <div className="flex items-center gap-1 bg-[#1a1712] border border-amber-500/40 px-2.5 py-1 rounded-xl text-xs font-mono">
            <span className="text-amber-400 font-bold">Pot:</span>
            <span className="text-white font-bold">₹{betAmount > 0 ? (betAmount * 2).toFixed(2) : 'Free'}</span>
          </div>
        </div>

        {/* PLAYER HUD CARDS */}
        <div className="grid grid-cols-2 gap-2 pb-2 shrink-0">
          {/* PLAYER 1: DARSH (RED PAWN) */}
          <div className={`rounded-2xl p-2 sm:p-2.5 border transition-all text-left flex items-center justify-between ${
            turn === 'H' ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/50' : 'bg-[#181818] border-[#292929]'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center relative shadow">
                <img src="/snakes/red.png" alt="Red Pawn" className="w-5 h-7 object-contain drop-shadow" />
                {turn === 'H' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />}
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Darsh</span>
                  <span className="text-[10px] text-rose-400 font-mono">(Red)</span>
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  Tile: <strong className="text-rose-400">{players.H?.position || 'Start'}</strong>
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-amber-400 font-bold">{scores.H || 0} Wins</span>
            </div>
          </div>

          {/* PLAYER 2: DORA / BOT (BLUE PAWN) */}
          <div className={`rounded-2xl p-2 sm:p-2.5 border transition-all text-left flex items-center justify-between ${
            turn === 'A' ? 'bg-blue-950/40 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50' : 'bg-[#181818] border-[#292929]'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center relative shadow">
                <img src="/snakes/blue.png" alt="Blue Pawn" className="w-5 h-7 object-contain drop-shadow" />
                {turn === 'A' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />}
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{gameMode === 'bot' ? 'Bot' : (activeDoraName || 'Dora')}</span>
                  <span className="text-[10px] text-blue-400 font-mono">(Blue)</span>
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  Tile: <strong className="text-blue-400">{players.A?.position || 'Start'}</strong>
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-amber-400 font-bold">{scores.A || 0} Wins</span>
            </div>
          </div>
        </div>

        {/* SPECIAL ACTION BANNER (LADDER / SNAKE ALERT) */}
        {specialActionText && (
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-500/50 text-amber-300 py-1.5 px-3 rounded-xl text-xs font-bold animate-bounce mb-2">
            {specialActionText}
          </div>
        )}

        {/* THE 10x10 BOARD WRAPPER */}
        <div className="relative w-full max-w-[480px] aspect-square mx-auto rounded-2xl overflow-hidden border-2 border-[#333] shadow-[0_12px_36px_rgba(0,0,0,0.8)] select-none">
          {/* Authentic High-Resolution Board Graphic */}
          <img
            src="/snakes/board.png"
            alt="Snakes and Ladders Board"
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* START DOCK / OFF-BOARD ZONE (Bottom-Left) */}
          {players.H?.position === 0 && (
            <div className="absolute left-1 bottom-1 bg-black/60 border border-rose-500/60 rounded-lg p-0.5 z-10 animate-pulse">
              <span className="text-[8px] font-mono font-bold text-rose-300 block">START</span>
            </div>
          )}

          {/* PLAYER 1 PAWN: DARSH (RED) */}
          <div
            className="absolute transition-all duration-300 ease-out z-20 pointer-events-none flex flex-col items-center"
            style={{
              left: `${hPos.x + hOffsetX}%`,
              top: `${hPos.y + hOffsetY}%`,
              transform: 'translate(-50%, -75%)',
            }}
          >
            <div className="relative">
              <img
                src="/snakes/red.png"
                alt="Darsh Pawn"
                className="w-6 sm:w-8 h-8 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-transform hover:scale-110"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-rose-600 border border-white text-white rounded-full flex items-center justify-center text-[7px] font-bold font-mono">
                👑
              </span>
            </div>
          </div>

          {/* PLAYER 2 PAWN: DORA / BOT (BLUE) */}
          <div
            className="absolute transition-all duration-300 ease-out z-20 pointer-events-none flex flex-col items-center"
            style={{
              left: `${aPos.x + aOffsetX}%`,
              top: `${aPos.y + aOffsetY}%`,
              transform: 'translate(-50%, -75%)',
            }}
          >
            <div className="relative">
              <img
                src="/snakes/blue.png"
                alt="Dora Pawn"
                className="w-6 sm:w-8 h-8 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-transform hover:scale-110"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border border-white text-white rounded-full flex items-center justify-center text-[7px] font-bold font-mono">
                ❤️
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLS & DICE SECTION */}
        <div className="mt-3 p-3 bg-[#161618] border border-[#2b2b2e] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Status Message */}
          <div className="text-left min-w-0 flex-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono font-bold block">
              Match Status
            </span>
            <p className="text-xs sm:text-sm font-bold text-white truncate">
              {statusMsg}
            </p>
          </div>

          {/* Interactive 3D Dice Display & Roll Button */}
          <div className="flex items-center gap-3">
            {/* Authentic 3D Dice Face */}
            <div className={`relative w-12 h-12 rounded-xl bg-white p-1 shadow-lg border-2 border-amber-400 flex items-center justify-center transition-transform ${
              isRolling ? 'animate-spin scale-110' : 'hover:scale-105'
            }`}>
              <img
                src={`/snakes/${diceVal}.png`}
                alt={`Dice ${diceVal}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Roll Button */}
            <button
              type="button"
              onClick={() => executeDiceRoll(turn)}
              disabled={!isMyTurn || isRolling || isMoving || Boolean(winner)}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95 ${
                !isMyTurn || isRolling || isMoving || Boolean(winner)
                  ? 'bg-[#252528] text-gray-500 cursor-not-allowed opacity-60'
                  : turn === 'H'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-950/60 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-950/60 animate-pulse'
              }`}
            >
              <span className="text-base">🎲</span>
              <span>
                {isRolling ? 'Rolling...' : isMoving ? 'Moving...' : isMyTurn ? `Roll Dice (${turn === 'H' ? 'Darsh' : 'Dora'})` : `Waiting for ${turn === 'H' ? 'Darsh' : 'Dora'}...`}
              </span>
            </button>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (Challenge in Chat & Reset) */}
        <div className="flex items-center justify-between gap-2 pt-2.5 shrink-0 text-xs text-gray-400">
          <button
            type="button"
            onClick={handleSendInvite}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Share2 size={13} />
            <span>Send Game Invite in Chat</span>
          </button>

          <span className="text-[11px] font-mono text-gray-500">
            🎯 Reach Square 100 to Win!
          </span>
        </div>

      </div>
    </div>
  );
}

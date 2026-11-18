import React, { useState, useEffect } from 'react';
import { X, Trophy, RotateCcw, Coins, Sparkles, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function CoupleMiniGameModal({
  isOpen,
  onClose,
  socketRef,
  role,
  activeDoraName,
  onSendChatInvite,
  gameState,
  onAction
}) {
  const [board, setBoard] = useState(gameState?.board || Array(9).fill(null));
  const [turn, setTurn] = useState(gameState?.turn || 'H'); // 'H' (Darsh) or 'A' (Dora)
  const [betAmount, setBetAmount] = useState(gameState?.betAmount ?? 2.0); // ₹2.00 or ₹5.00
  const [gameStatus, setGameStatus] = useState(gameState?.gameStatus || 'PLAYING'); // 'PLAYING' | 'WON' | 'DRAW'
  const [winner, setWinner] = useState(gameState?.winner || null); // 'H' | 'A' | null
  const [scores, setScores] = useState(gameState?.scores || { H: 0, A: 0 });

  const isCurrentAdmin = (role === 'parent' || role === 'admin');
  const mySymbol = isCurrentAdmin ? 'H' : 'A';
  const myLabel = isCurrentAdmin ? 'Darsh' : activeDoraName;
  const oppLabel = isCurrentAdmin ? activeDoraName : 'Darsh';

  // Sync state from root App.js gameState prop instantly
  useEffect(() => {
    if (gameState) {
      if (gameState.board) setBoard([...gameState.board]);
      if (gameState.turn) setTurn(gameState.turn);
      if (gameState.betAmount !== undefined) setBetAmount(gameState.betAmount);
      if (gameState.scores) setScores(gameState.scores);
      if (gameState.winner) {
        setWinner(gameState.winner);
        setGameStatus('WON');
      } else if (gameState.isDraw) {
        setWinner(null);
        setGameStatus('DRAW');
      } else {
        setWinner(null);
        setGameStatus('PLAYING');
      }
    }
  }, [gameState]);

  const checkWinner = (squares) => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every(s => s !== null)) {
      return 'DRAW';
    }
    return null;
  };

  // Request live server state whenever modal opens or socket reconnects
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !isOpen) return;

    socket.emit('couple_game_get_state', { gameId: 'tictactoe' });

    const handleStateSync = ({ gameId, state }) => {
      if (gameId !== 'tictactoe' || !state) return;
      if (state.board) setBoard(state.board);
      if (state.turn) setTurn(state.turn);
      if (state.betAmount !== undefined) setBetAmount(state.betAmount);
      if (state.scores) setScores(state.scores);
      if (state.winner) {
        setWinner(state.winner);
        setGameStatus('WON');
      } else if (state.isDraw) {
        setGameStatus('DRAW');
      } else {
        setWinner(null);
        setGameStatus('PLAYING');
      }
    };

    const handleGameBroadcast = (data) => {
      if (!data) return;
      const targetGame = data.gameId || (data.board ? 'tictactoe' : 'ludo');
      if (targetGame !== 'tictactoe') return;
      const state = data.state || data;
      if (state.board) setBoard(state.board);
      if (state.turn) setTurn(state.turn);
      if (state.betAmount !== undefined) setBetAmount(state.betAmount);
      if (state.scores) setScores(state.scores);

      if (state.winner) {
        setWinner(state.winner);
        setGameStatus('WON');
        if (state.winner === mySymbol) {
          try { confetti({ particleCount: 80, spread: 70 }); } catch (e) {}
        }
      } else if (state.isDraw) {
        setWinner(null);
        setGameStatus('DRAW');
      } else if (data.type === 'RESET') {
        setBoard(Array(9).fill(null));
        setTurn('H');
        setWinner(null);
        setGameStatus('PLAYING');
      } else {
        setWinner(null);
        setGameStatus('PLAYING');
      }
    };

    socket.on('couple_game_state_sync', handleStateSync);
    socket.on('couple_game_broadcast', handleGameBroadcast);
    socket.on('arcade_game_action_broadcast', handleGameBroadcast);

    return () => {
      socket.off('couple_game_state_sync', handleStateSync);
      socket.off('couple_game_broadcast', handleGameBroadcast);
      socket.off('arcade_game_action_broadcast', handleGameBroadcast);
    };
  }, [socketRef, isOpen, mySymbol]);

  const handleSquareClick = (index) => {
    if (board[index] || gameStatus !== 'PLAYING') return;
    if (turn !== mySymbol) return; // Only allow clicking when it's your turn

    const newBoard = [...board];
    newBoard[index] = mySymbol;
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    const nextTurn = turn === 'H' ? 'A' : 'H';

    let actionPayload;
    if (winResult && winResult !== 'DRAW') {
      setWinner(winResult);
      setGameStatus('WON');
      setScores(prev => ({ ...prev, [winResult]: prev[winResult] + 1 }));
      try { confetti({ particleCount: 90, spread: 80 }); } catch (e) {}

      actionPayload = {
        type: 'MATCH_FINISH',
        gameId: 'tictactoe',
        betAmount,
        board: newBoard,
        turn: nextTurn,
        winner: winResult,
        isDraw: false
      };
    } else if (winResult === 'DRAW') {
      setGameStatus('DRAW');
      actionPayload = {
        type: 'MATCH_FINISH',
        gameId: 'tictactoe',
        betAmount,
        board: newBoard,
        turn: nextTurn,
        winner: null,
        isDraw: true
      };
    } else {
      setTurn(nextTurn);
      actionPayload = {
        type: 'MOVE',
        gameId: 'tictactoe',
        betAmount,
        board: newBoard,
        turn: nextTurn
      };
    }

    if (onAction) {
      onAction(actionPayload);
    }
    if (socketRef?.current) {
      socketRef.current.emit('couple_game_action', actionPayload);
      socketRef.current.emit('arcade_game_action', actionPayload);
    }
  };

  const handleSelectBet = (amt) => {
    if (gameStatus !== 'PLAYING' || board.some(s => s !== null)) return;
    setBetAmount(amt);
    const payload = {
      type: 'BET_CHANGE',
      gameId: 'tictactoe',
      betAmount: amt
    };
    if (onAction) {
      onAction(payload);
    }
    if (socketRef?.current) {
      socketRef.current.emit('couple_game_action', payload);
      socketRef.current.emit('arcade_game_action', payload);
    }
  };

  const handleResetGame = () => {
    const freshBoard = Array(9).fill(null);
    setBoard(freshBoard);
    setWinner(null);
    setGameStatus('PLAYING');
    setTurn('H');

    const payload = {
      type: 'RESET',
      gameId: 'tictactoe',
      betAmount,
      board: freshBoard,
      turn: 'H'
    };
    if (onAction) {
      onAction(payload);
    }
    if (socketRef?.current) {
      socketRef.current.emit('couple_game_action', payload);
      socketRef.current.emit('arcade_game_action', payload);
    }
  };

  const handleSendInviteToChat = () => {
    if (onSendChatInvite) {
      onSendChatInvite('tictactoe', betAmount);
    }
    if (socketRef?.current) {
      socketRef.current.emit('couple_game_invite', {
        game: 'tictactoe',
        challenger: myLabel,
        challengerRole: role,
        betAmount
      });
    }
    alert(`💌 Tic-Tac-Toe Challenge sent to ${oppLabel}!\n\nA live invite banner and clickable link have been sent.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#141414] border-2 border-purple-500/70 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <div className="text-left">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Couple Tic-Tac-Toe</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono">LIVE BETTING</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">Win opponent's bet into Love Balance!</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSendInviteToChat}
              className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-2 py-1 rounded-xl cursor-pointer shadow flex items-center gap-1 active:scale-95 transition-all"
              title={`Send Tic-Tac-Toe Invite to ${oppLabel}`}
            >
              <Share2 size={12} />
              <span>Invite</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-xl cursor-pointer hover:bg-[#222]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* BET AMOUNT SELECTOR & SCOREBOARD */}
        <div className="flex items-center justify-between bg-[#1b1b1b] p-2.5 rounded-2xl border border-[#2d2d2d] text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <Coins size={14} className="text-amber-400" />
            <span className="text-gray-300">Bet:</span>
            <button
              type="button"
              disabled={gameStatus !== 'PLAYING' || board.some(s => s !== null)}
              onClick={() => handleSelectBet(2.0)}
              className={`px-2 py-0.5 rounded-lg border font-mono transition-all ${
                betAmount === 2.0
                  ? 'bg-amber-500 text-black border-amber-400 font-black shadow'
                  : 'bg-[#121212] text-gray-400 border-[#333]'
              }`}
            >
              ₹2
            </button>
            <button
              type="button"
              disabled={gameStatus !== 'PLAYING' || board.some(s => s !== null)}
              onClick={() => handleSelectBet(5.0)}
              className={`px-2 py-0.5 rounded-lg border font-mono transition-all ${
                betAmount === 5.0
                  ? 'bg-amber-500 text-black border-amber-400 font-black shadow'
                  : 'bg-[#121212] text-gray-400 border-[#333]'
              }`}
            >
              ₹5
            </button>
          </div>

          {/* SCORES */}
          <div className="flex items-center gap-2 font-mono font-bold text-xs">
            <span className="text-blue-400">Darsh: {scores.H}</span>
            <span className="text-gray-500">|</span>
            <span className="text-pink-400">{activeDoraName}: {scores.A}</span>
          </div>
        </div>

        {/* TURN INDICATOR BANNER */}
        <div className={`p-2 rounded-xl text-xs font-bold transition-all ${
          gameStatus === 'WON'
            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 animate-bounce'
            : (gameStatus === 'DRAW'
                ? 'bg-zinc-800 text-gray-300 border border-zinc-700'
                : (turn === mySymbol 
                    ? 'bg-purple-950/70 text-purple-200 border border-purple-500/50 animate-pulse'
                    : 'bg-[#1c1c1c] text-gray-400 border border-[#2c2c2c]'))
        }`}>
          {gameStatus === 'WON' 
            ? `🏆 ${winner === mySymbol ? 'You Won!' : `${oppLabel} Won!`} (+₹${betAmount.toFixed(2)} Pot Awarded)`
            : (gameStatus === 'DRAW'
                ? '🤝 Match Tied! Bets Refunded.'
                : (turn === mySymbol ? '✨ Your Turn! Tap an empty tile.' : `⏳ Waiting for ${oppLabel}'s move...`))}
        </div>

        {/* 3x3 TIC-TAC-TOE BOARD */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#0e0e0e] p-3 rounded-2xl border border-[#2a2a2a] shadow-inner">
          {board.map((cell, idx) => {
            const isClickable = !cell && gameStatus === 'PLAYING' && turn === mySymbol;
            return (
              <button
                key={idx}
                type="button"
                disabled={!isClickable}
                onClick={() => handleSquareClick(idx)}
                className={`h-20 rounded-xl flex items-center justify-center text-3xl font-black transition-all shadow select-none ${
                  cell === 'H'
                    ? 'bg-blue-950/80 text-blue-400 border-2 border-blue-500/80'
                    : (cell === 'A'
                        ? 'bg-pink-950/80 text-pink-400 border-2 border-pink-500/80'
                        : (isClickable
                            ? 'bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] hover:border-purple-400 cursor-pointer active:scale-95'
                            : 'bg-[#141414] border border-[#222] cursor-not-allowed opacity-50'))
                }`}
              >
                {cell === 'H' ? '✕' : (cell === 'A' ? '◯' : '')}
              </button>
            );
          })}
        </div>

        {/* CONTROLS */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleResetGame}
            className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>Rematch / New Game</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#222] hover:bg-[#2c2c2c] text-gray-300 font-bold px-4 py-2.5 rounded-xl cursor-pointer border border-[#333] text-xs transition-all active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

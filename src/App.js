import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import { 
  SquarePen, Image as ImageIcon, BookOpen, Clock, ToyBrick, FolderGit2, MoreHorizontal,
  Search, PanelLeft, ArrowUp, Plus, RefreshCw, Sparkles, Share,
  Bot, X, Download, AlertCircle, ShieldCheck, Smile,
  Copy, ThumbsUp, ThumbsDown, RotateCw, Check, Edit3, Maximize2, Mic, AudioLines, ChevronDown,
  Code, Play, Pause, Eye, EyeOff, FileDown, Radio, Link2, Unlink, Music, Volume2, Loader2, VolumeX,
  Film, Tv, Video, TerminalSquare, AlertTriangle, HardDrive, Globe, ExternalLink, Gamepad2, Trophy, RotateCcw, Dice5, Timer
} from 'lucide-react';

const SOCKET_URL = "https://secret-chat-backend-07d0.onrender.com";
const SECRET_KEY = "StealthMasterKey99";
const GLOBAL_ROOM = "stealth_master_room";

const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-8vMeAtA5cHmDkJ0d8Q9cW4vG0mJ5M3Q5lK0P8vWq6X5LwG0J7j6W0Yg';

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🙏", "👌", "💯", "🤫", "✨"];
const HOVER_REACTIONS = ["👍", "❤️", "🥰", "😆", "😮", "😢", "😡"];

const ARCADE_GAMES = [
  { id: 'tictactoe', name: 'Tic Tac Toe (Ultimate Edition)', desc: 'Classic 3x3 grid tactical challenge' },
  { id: 'pong', name: 'Pong (Retro Arcade)', desc: 'Retro paddle and ball rally duel' },
  { id: 'airhockey', name: 'Air Hockey (Mini)', desc: 'Fast reflex puck-sliding showdown' },
  { id: 'drawguess', name: 'Draw & Guess Mini', desc: 'Quick sketch and prompt guessing' },
  { id: 'battleship', name: 'Battleship (Mini Grid)', desc: 'Target and sink enemy fleet' },
  { id: 'ludo', name: 'Ludo (Quick Sprint)', desc: 'Fast token race to home plate' },
  { id: 'pool', name: 'Pool / 8-Ball (Mini Cue)', desc: 'Pocket cue shots precision duel' },
  { id: 'snakeladder', name: 'Snake & Ladder (Speed Sprint)', desc: 'Dice roll race to the top' }
];

const DEFAULT_RECENT_CHATS = [
  "GMB Review Reply", "Prashant chotalia", "Shiva Pradakshina Meaning", "Generate random code",
  "Free Movie Watch Together", "Clinic Content Writing", "Write Kidney Article", "KidneyCure TOPIC",
  "Pest Control in Ahmedabad", "Blog Topics ( Pest Control )", "MTech Semester Dates", "Free Couple Watch Apps",
  "Tablet as Second Screen", "Bike Comparison Suggestion", "Punjabi Thali Search"
];

const cleanOriginalText = (raw) => {
  if (!raw) return "";
  let cleaned = raw;
  while (cleaned.includes('[⤴') || cleaned.startsWith('⤴')) {
    cleaned = cleaned.replace(/^\[⤴\s*[AH]:\s*"[^"]*"\s*\]\s*/g, '');
    cleaned = cleaned.replace(/^⤴\s*[AH]:\s*"[^"]*"\s*/g, '');
  }
  return cleaned.trim();
};

const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=[&?]?|v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getEmbedUrl = (server, imdbId) => {
  const cleanId = imdbId.trim();
  switch (server) {
    case 'vidlink': return `https://vidlink.pro/movie/${cleanId}`;
    case 'autoembed': return `https://player.autoembed.cc/embed/movie/${cleanId}`;
    case 'vidsrc_xyz': return `https://vidsrc.xyz/embed/movie/${cleanId}`;
    case 'smashy': return `https://embed.smashystream.com/playere.php?imdb=${cleanId}`;
    default: return `https://vidlink.pro/movie/${cleanId}`;
  }
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('stealth_role') || 'user');
  const [currentRoom, setCurrentRoom] = useState("GMB Review Reply");
  const [roomList, setRoomList] = useState(() => {
    const saved = localStorage.getItem('stealth_rooms');
    if (!saved) return DEFAULT_RECENT_CHATS;
    try { return JSON.parse(saved); } catch { return DEFAULT_RECENT_CHATS; }
  });

  const [viewMode, setViewMode] = useState('real_gpt');
  const [showArcadePlugins, setShowArcadePlugins] = useState(false);
  const [incomingGameRequest, setIncomingGameRequest] = useState(false);
  const [activeGame, setActiveGame] = useState(null);

  const [scores, setScores] = useState({ H: 0, A: 0 });
  const [winnerMessage, setWinnerMessage] = useState('');
  const [tictactoeBoard, setTictactoeBoard] = useState(Array(9).fill(null));
  const [isHNext, setIsHNext] = useState(true);
  const [ludoPos, setLudoPos] = useState({ H: 0, A: 0 });
  const [ludoTurn, setLudoTurn] = useState('H');
  const [diceVal, setDiceVal] = useState(1);

  const [pongScore] = useState({ H: 0, A: 0 });
  const [hockeyScore] = useState({ H: 0, A: 0 });
  const [battleshipGrid, setBattleshipGrid] = useState(Array(9).fill('empty'));
  const [battleshipHits, setBattleshipHits] = useState({ H: 0, A: 0 });
  const [poolBalls] = useState({ H: 0, A: 0 });
  const [snakePos, setSnakePos] = useState({ H: 1, A: 1 });
  const [drawGuessWord] = useState('Golden Crown');

  const [countdownStr, setCountdownStr] = useState("00:00:00");
  const autoDownloadedRef = useRef(false);

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('stealth_conversations');
    if (saved) return JSON.parse(saved);
    return [
      { id: "init_1", role: "user", text: "Smile Architect Orthodontic Centre & Dental Clinic", time: "5:27 PM" },
      { id: "init_2", role: "assistant", text: "Invisalign aligners treatment overview.", time: "5:27 PM" }
    ];
  });

  const [stealthMessages, setStealthMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const typingTimerRef = useRef(null);

  const [syncStatus, setSyncStatus] = useState('idle');
  const [incomingInviteRole, setIncomingInviteRole] = useState('');
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [activeTrackTitle, setActiveTrackTitle] = useState('');
  const [activeVideoId, setActiveVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [ytSuggestions, setYtSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(100);

  const [codexEngine, setCodexEngine] = useState('gofile');
  const [movieInputUrl, setMovieInputUrl] = useState('');
  const [activeMovieSrc, setActiveMovieSrc] = useState('');
  const [activeMovieYTId, setActiveMovieYTId] = useState('');
  const [embedServer, setEmbedServer] = useState('vidlink');
  const [currentImdbId, setCurrentImdbId] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState('');
  
  const [localVideoSrc, setLocalVideoSrc] = useState('');
  const [localFileName, setLocalFileName] = useState('');
  const [movieError, setMovieError] = useState('');
  
  const html5VideoRef = useRef(null);
  const localVideoInputRef = useRef(null);
  const isMovieRemoteTriggerRef = useRef(false);

  const playerRef = useRef(null);
  const isRemoteTriggerRef = useRef(false);
  const suggestDebounceRef = useRef(null);
  const lastSyncActionTimeRef = useRef(0);
  const pendingRestoreRef = useRef(null);

  const [isBotOpen, setIsBotOpen] = useState(false);
  const [botTab, setBotTab] = useState('instant');
  const [customMsg, setCustomMsg] = useState('');
  const [schedMsg, setSchedMsg] = useState('');
  const [schedTime1, setSchedTime1] = useState('');
  const [schedTime2, setSchedTime2] = useState('');
  const [incomingAlert, setIncomingAlert] = useState(null);

  const [activeViewImage, setActiveViewImage] = useState(null);
  const [archivedImages, setArchivedImages] = useState(() => {
    const saved = localStorage.getItem('stealth_image_vault');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [isConnected, setIsConnected] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showMiniEmojiBar, setShowMiniEmojiBar] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const socketRef = useRef(null);
  const stealthMessagesRef = useRef([]);
  const messageEndRef = useRef(null);
  const streamContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const swRegistrationRef = useRef(null);

  const viewModeRef = useRef(viewMode);
  const roleRef = useRef(role);
  const isCurrentAdmin = role === 'parent';

  // ALL REQUIRED HANDLERS & FUNCTIONS DEFINED
  const encryptText = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  const decryptText = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8) || cipher;
    } catch { return cipher; }
  };

  const playSentSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }, []);

  const playReceiveSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }, []);

  const fetchLiveAIResponse = async (userPrompt) => {
    setIsThinking(true);
    const userMsg = { id: 'usr_' + Date.now(), role: 'user', text: userPrompt, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updated = [...conversations, userMsg];
    setConversations(updated);

    if (currentRoom === "New chat" || currentRoom.startsWith("New chat")) {
      const generatedTitle = userPrompt.length > 24 ? userPrompt.substring(0, 22) + '...' : userPrompt;
      setRoomList(roomList.map(r => r === currentRoom ? generatedTitle : r));
      setCurrentRoom(generatedTitle);
    }

    let reply = "Network timeout.";
    try {
      const res = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: userPrompt }], model: "openai" })
      });
      if (res.ok) { const text = await res.text(); if (text) reply = text.trim(); }
    } catch (e) {}

    setConversations([...updated, { id: 'ai_' + Date.now(), role: 'assistant', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setIsThinking(false);
  };

  const downloadFullChatPDF = () => {
    if (role !== 'parent') return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
      doc.text("WhatsApp / Chat Transcript - Bubble Export", 14, 12);
      let y = 32;
      stealthMessages.forEach((m) => {
        const isUser = m.senderRole === 'user';
        const senderLabel = isUser ? 'A (User)' : 'H (Admin)';
        const time = m.timeFormatted || new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const content = m.isMedia ? "[Encrypted Secret Photo Asset]" : cleanOriginalText(m.text || "");
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const splitLines = doc.splitTextToSize(content || "(empty)", 90);
        const bubbleHeight = (splitLines.length * 4.5) + 10;
        if (y + bubbleHeight > 282) { doc.addPage(); y = 20; }
        const xPos = isUser ? 14 : (210 - 14 - 90);
        doc.setFillColor(isUser ? 241 : 220, isUser ? 245 : 252, isUser ? 249 : 231);
        doc.roundedRect(xPos, y, 90, bubbleHeight, 3, 3, 'FD');
        doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
        doc.text(senderLabel, xPos + 4, y + 5);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text(splitLines, xPos + 4, y + 10);
        doc.setFontSize(7); doc.setTextColor(100, 116, 139);
        doc.text(time, xPos + 90 - 16, y + bubbleHeight - 3);
        y += bubbleHeight + 4;
      });
      doc.save(`WhatsApp_Chat_Bubble_Transcript_${Date.now()}.pdf`);
    } catch (err) {}
  };

  const handleAdminSendRequest = () => { if (socketRef.current) socketRef.current.emit('admin_send_arcade_request'); alert("Arcade game request dispatched!"); };
  const handleAdminDisconnectArcade = () => { setShowArcadePlugins(false); setActiveGame(null); setIncomingGameRequest(false); if (socketRef.current) socketRef.current.emit('admin_toggle_arcade', false); };
  const handleUserAcceptRequest = () => { setIncomingGameRequest(false); setShowArcadePlugins(true); if (socketRef.current) socketRef.current.emit('user_accept_arcade_request'); };
  const handleLaunchGame = (game) => { setActiveGame(game); setWinnerMessage(''); if (socketRef.current) socketRef.current.emit('launch_multiplayer_game', game); };
  
  const handleTicTacToeClick = (idx) => {
    const myTurn = (isCurrentAdmin && isHNext) || (!isCurrentAdmin && !isHNext);
    if (!myTurn || tictactoeBoard[idx] || winnerMessage || activeGame?.id !== 'tictactoe') return;
    const newBoard = [...tictactoeBoard]; newBoard[idx] = isHNext ? 'H' : 'A';
    const nextState = !isHNext;
    const lines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    let win = null;
    for (let l of lines) { if (newBoard[l[0]] && newBoard[l[0]] === newBoard[l[1]] && newBoard[l[0]] === newBoard[l[2]]) win = newBoard[l[0]]; }
    if (!win && newBoard.every(c => c !== null)) win = 'Draw';
    let newScores = { ...scores }; let winText = '';
    if (win === 'H') { winText = 'Player H Wins!'; newScores.H += 1; }
    else if (win === 'A') { winText = 'Player A Wins!'; newScores.A += 1; }
    else if (win === 'Draw') { winText = "Draw!"; }
    setTictactoeBoard(newBoard); setIsHNext(nextState); setWinnerMessage(winText); setScores(newScores);
    if (socketRef.current) socketRef.current.emit('arcade_game_action', { gameId: 'tictactoe', board: newBoard, isHNext: nextState, winner: winText, scores: newScores });
  };

  const handleLudoRoll = () => {
    const myTurn = (isCurrentAdmin && ludoTurn === 'H') || (!isCurrentAdmin && ludoTurn === 'A');
    if (!myTurn || winnerMessage) return;
    const roll = Math.floor(Math.random() * 6) + 1; setDiceVal(roll);
    const newPos = { ...ludoPos }; let winText = ''; let newScores = { ...scores };
    if (ludoTurn === 'H') {
      newPos.H = Math.min(30, newPos.H + roll);
      if (newPos.H >= 30) { winText = 'Player H Won Ludo!'; newScores.H += 1; }
    } else {
      newPos.A = Math.min(30, newPos.A + roll);
      if (newPos.A >= 30) { winText = 'Player A Won Ludo!'; newScores.A += 1; }
    }
    const nextTurn = ludoTurn === 'H' ? 'A' : 'H';
    setLudoPos(newPos); setLudoTurn(nextTurn);
    if (winText) { setWinnerMessage(winText); setScores(newScores); }
    if (socketRef.current) socketRef.current.emit('arcade_game_action', { gameId: 'ludo', pos: newPos, turn: nextTurn, dice: roll, winner: winText, scores: newScores });
  };

  const handleGenericGameScore = (gameKey) => {
    if (winnerMessage) return;
    const scorer = isCurrentAdmin ? 'H' : 'A';
    const winText = `Player ${scorer} Scored!`;
    const newScores = { ...scores, [scorer]: scores[scorer] + 1 };
    setScores(newScores); setWinnerMessage(winText);
    if (socketRef.current) socketRef.current.emit('arcade_game_action', { gameId: gameKey, winner: winText, scores: newScores, score: newScores });
  };

  const handleBubbleDismiss = () => { setIncomingAlert(null); };
  const handleInputChange = (e) => { setInput(e.target.value); };
  const handleCloseViewOnce = () => { setActiveViewImage(null); };
  const handleHtml5Play = () => { if (html5VideoRef.current && socketRef.current) socketRef.current.emit('codex_movie_sync', { room: GLOBAL_ROOM, state: 'PLAY', currentTime: html5VideoRef.current.currentTime, timestamp: Date.now() }); };
  const handleHtml5Pause = () => { if (html5VideoRef.current && socketRef.current) socketRef.current.emit('codex_movie_sync', { room: GLOBAL_ROOM, state: 'PAUSE', currentTime: html5VideoRef.current.currentTime, timestamp: Date.now() }); };
  const handleHtml5Seeked = () => { if (html5VideoRef.current && socketRef.current) socketRef.current.emit('codex_movie_sync', { room: GLOBAL_ROOM, state: html5VideoRef.current.paused ? 'PAUSE' : 'PLAY', currentTime: html5VideoRef.current.currentTime, timestamp: Date.now() }); };
  
  const processAndSendImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const encrypted = encryptText(event.target.result);
      if (socketRef.current && viewMode === 'stealth') {
        socketRef.current.emit('send_stealth_msg', { room: GLOBAL_ROOM, role, encryptedText: encrypted, isMedia: true });
        playSentSound();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectLocalFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLocalVideoSrc(URL.createObjectURL(file));
    setLocalFileName(file.name);
  };

  const downloadPendingPDF = (e) => { e.stopPropagation(); };
  const handleManualUnmuteClick = () => { if (playerRef.current) { playerRef.current.unMute(); playerRef.current.setVolume(100); playerRef.current.playVideo(); setAutoplayBlocked(false); } };
  const handleTogglePlayPause = () => {
    if (!playerRef.current) return;
    const nextState = !isPlaying; setIsPlaying(nextState);
    if (nextState) { playerRef.current.unMute(); playerRef.current.playVideo(); } else { playerRef.current.pauseVideo(); }
    if (socketRef.current) socketRef.current.emit('sync_playback_state', { room: GLOBAL_ROOM, state: nextState ? 'PLAY' : 'PAUSE', currentTime: playerRef.current.getCurrentTime(), timestamp: Date.now() });
  };
  const handleDisconnectSync = () => {
    if (socketRef.current) {
      socketRef.current.emit('sync_disconnect_invite', { room: GLOBAL_ROOM });
      setSyncStatus('idle'); setIsPlaying(false); setActiveTrackTitle(''); setActiveVideoId('');
    }
  };
  const handleScrollToMessage = (targetMsgId) => {
    const el = document.getElementById(`stealth-msg-${targetMsgId}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightedMsgId(targetMsgId); setTimeout(() => setHighlightedMsgId(null), 1800); }
  };
  const handleOpenViewOnce = (msg) => {
    if (socketRef.current) socketRef.current.emit('mark_media_opened', { room: GLOBAL_ROOM, messageId: msg._id });
    setStealthMessages(prev => prev.map(m => m._id === msg._id ? { ...m, mediaOpened: true } : m));
    setActiveViewImage({ id: msg._id, data: msg.text, sender: msg.senderRole === 'user' ? 'A' : 'H', time: msg.timeFormatted });
  };
  const handleStartReply = (msg) => {
    setReplyTarget({ id: msg._id, text: msg.isMedia ? "[Photo]" : cleanOriginalText(msg.text), senderRole: msg.senderRole === 'user' ? 'A' : 'H' });
    if (inputRef.current) inputRef.current.focus();
  };
  const handleSelectReaction = (messageId, emoji) => {
    setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, reaction: emoji } : m));
    setActiveReactionMsgId(null);
    if (socketRef.current) socketRef.current.emit('add_reaction', { room: GLOBAL_ROOM, messageId, reaction: emoji });
  };
  const togglePendingFlag = (e, msg) => {
    e.stopPropagation(); if (role !== 'parent') return;
    const newStatus = !msg.flaggedPending;
    setStealthMessages(prev => prev.map(m => m._id === msg._id ? { ...m, flaggedPending: newStatus } : m));
    if (socketRef.current) socketRef.current.emit('toggle_pending', { messageId: msg._id, status: newStatus, room: GLOBAL_ROOM });
  };
  const handleSendSyncInvite = () => { if (socketRef.current) { socketRef.current.emit('sync_send_invite', { room: GLOBAL_ROOM, role }); setSyncStatus('requested'); } };
  const handleAcceptSyncInvite = () => { if (socketRef.current) { socketRef.current.emit('sync_confirm_invite', { room: GLOBAL_ROOM }); setSyncStatus('connected'); } };
  const handleTriggerSong = async (rawInput, displayTitle = '') => {
    if (!rawInput || !rawInput.trim()) return;
    setIsLoadingTrack(true);
    let vid = extractYouTubeId(rawInput.trim());
    let finalTitle = displayTitle || rawInput.trim();
    if (!vid) {
      try {
        const res = await fetch(`${SOCKET_URL}/api/yt-search?q=${encodeURIComponent(rawInput.trim())}`);
        if (res.ok) { const data = await res.json(); if (data && data.videoId) { vid = data.videoId; finalTitle = data.title || finalTitle; } }
      } catch (err) {}
    }
    setIsLoadingTrack(false);
    if (vid && socketRef.current) socketRef.current.emit('sync_track_change', { room: GLOBAL_ROOM, videoId: vid, title: finalTitle });
  };
  const handleQueryChange = (val) => {
    setYoutubeUrlInput(val);
    if (!val.trim() || val.includes('youtu')) { setYtSuggestions([]); setShowSuggestions(false); return; }
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/api/yt-suggest?q=${encodeURIComponent(val)}`);
        if (res.ok) { const data = await res.json(); setYtSuggestions(Array.isArray(data) ? data : []); setShowSuggestions(true); }
      } catch (e) { setYtSuggestions([]); }
    }, 280);
  };
  const handleSeekSlider = (e) => {
    const val = parseFloat(e.target.value);
    setTrackProgress(val);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(val, true);
      if (socketRef.current) socketRef.current.emit('sync_playback_state', { room: GLOBAL_ROOM, state: isPlaying ? 'PLAY' : 'PAUSE', currentTime: val, timestamp: Date.now() });
    }
  };
  const handleSelectSuggestion = (sugg) => { setYoutubeUrlInput(sugg); setShowSuggestions(false); handleTriggerSong(sugg, sugg); };
  const handleLoadMovie = (e) => {
    e.preventDefault(); setMovieError('');
    if (codexEngine === 'youtube') {
      const vid = extractYouTubeId(movieInputUrl.trim());
      if (!vid) return;
      setActiveMovieYTId(vid); setActiveMovieSrc(''); setActiveEmbedUrl('');
      if (socketRef.current) socketRef.current.emit('codex_movie_load', { room: GLOBAL_ROOM, engine: 'youtube', ytId: vid, senderRole: role });
    } else if (codexEngine === 'embed') {
      const input = movieInputUrl.trim(); let imdbId = input; let finalEmbed = input;
      const match = input.match(/tt\d{6,9}/);
      if (match) { imdbId = match[0]; finalEmbed = getEmbedUrl(embedServer, imdbId); }
      setCurrentImdbId(imdbId); setActiveEmbedUrl(finalEmbed);
      if (socketRef.current) socketRef.current.emit('codex_movie_load', { room: GLOBAL_ROOM, engine: 'embed', embedUrl: finalEmbed, imdbId, senderRole: role });
    } else {
      setActiveMovieSrc(movieInputUrl.trim());
      if (socketRef.current) socketRef.current.emit('codex_movie_load', { room: GLOBAL_ROOM, engine: 'gofile', url: movieInputUrl.trim(), senderRole: role });
    }
    setMovieInputUrl('');
  };
  const handleSwitchEmbedServer = (newServer) => {
    setEmbedServer(newServer);
    if (!currentImdbId) return;
    const newUrl = getEmbedUrl(newServer, currentImdbId);
    setActiveEmbedUrl(newUrl);
    if (socketRef.current) socketRef.current.emit('codex_movie_load', { room: GLOBAL_ROOM, engine: 'embed', embedUrl: newUrl, imdbId: currentImdbId, senderRole: role });
  };
  const handleScheduleAlertSubmit = (e) => { e.preventDefault(); setIsBotOpen(false); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socketRef.current) socketRef.current.emit('typing_stop', { room: GLOBAL_ROOM, role });
    setShowMiniEmojiBar(false);
    const cleanCmd = val.toLowerCase();

    if (cleanCmd === '/shadow') {
      setRole('parent'); localStorage.setItem('stealth_role', 'parent'); setViewMode('stealth');
      if (socketRef.current) { socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'parent' }); socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: 'parent' }); }
      setInput(''); setReplyTarget(null); return;
    }
    if (cleanCmd === '/dora') {
      setRole('user'); localStorage.setItem('stealth_role', 'user'); setViewMode('stealth');
      if (socketRef.current) { socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'user' }); socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: 'user' }); }
      setInput(''); setReplyTarget(null); return;
    }
    if (cleanCmd === '/gpt' || cleanCmd === '/normal') { setViewMode('real_gpt'); setInput(''); setReplyTarget(null); return; }

    if (viewMode === 'stealth') {
      let finalMessageText = val; let replyRefId = null;
      if (replyTarget) {
        const cleanSnippet = cleanOriginalText(replyTarget.text);
        const shortReply = cleanSnippet.length > 25 ? cleanSnippet.substring(0, 22) + '...' : cleanSnippet;
        finalMessageText = `[⤴ ${replyTarget.senderRole}: "${shortReply}"] ${val}`;
        replyRefId = replyTarget.id;
      }
      const encrypted = encryptText(finalMessageText);
      if (socketRef.current) {
        socketRef.current.emit('send_stealth_msg', { room: GLOBAL_ROOM, role, encryptedText: encrypted, isMedia: false, replyRefId });
        playSentSound();
      }
      setInput(''); setReplyTarget(null); return;
    }

    playSentSound();
    fetchLiveAIResponse(val);
    setInput(''); setReplyTarget(null);
  };

  // 7 PM Timer & Auto-Download Effect
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(19, 0, 0, 0);

      let diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        target.setDate(target.getDate() + 1);
        diff = target.getTime() - now.getTime();
        autoDownloadedRef.current = false;
      }

      if (Math.abs(diff) < 1500 && !autoDownloadedRef.current && role === 'parent') {
        autoDownloadedRef.current = true;
        downloadFullChatPDF();
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownStr(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [role, stealthMessages]);

  useEffect(() => {
    viewModeRef.current = viewMode;
    if (viewMode === 'codex' && playerRef.current && isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, [viewMode, isPlaying]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && isPlaying) {
        const current = playerRef.current.getCurrentTime() || 0;
        const duration = playerRef.current.getDuration() || 100;
        setTrackProgress(current);
        setTrackDuration(duration);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const displayedStealthMessages = role === 'user' ? stealthMessages.slice(-60) : stealthMessages;
  const pendingMessages = stealthMessages.filter(m => m.flaggedPending);
  const hasUnreadSecret = stealthMessages.some(m => m.senderRole !== role && !m.isSeen);

  const alertText = incomingAlert?.text || '';
  const textLength = alertText.length;

  let bubbleDimensions = 'w-24 h-24';
  let bubbleFontSize = 'text-xs';

  if (textLength > 90) {
    bubbleDimensions = 'w-44 h-44';
    bubbleFontSize = 'text-[9px] leading-[13px]';
  } else if (textLength > 50) {
    bubbleDimensions = 'w-36 h-36';
    bubbleFontSize = 'text-[10px] leading-[14px]';
  } else if (textLength > 25) {
    bubbleDimensions = 'w-32 h-32';
    bubbleFontSize = 'text-[11px] leading-[15px]';
  }

  return (
    <div 
      className="flex h-[100dvh] w-screen overflow-hidden bg-[#000000] text-[#ececf1] font-sans antialiased select-none relative"
      onClick={() => setActiveReactionMsgId(null)}
    >
      <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { if (e.target.files && e.target.files[0]) { processAndSendImage(e.target.files[0]); e.target.value = ''; } }} className="hidden" />
      <input type="file" accept="video/*" ref={localVideoInputRef} onChange={handleSelectLocalFile} className="hidden" />

      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '320px', height: '240px', pointerEvents: 'none', zIndex: -9999 }}>
        <div id="persistent-sync-iframe"></div>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-30 transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 max-w-[85vw] transition-transform md:transition-[width] duration-250 ease-in-out bg-[#000000] flex flex-col border-r border-[#171717] overflow-hidden select-none shrink-0 ${sidebarOpen ? 'translate-x-0 md:w-64' : '-translate-x-full md:translate-x-0 md:w-0'}`}>
        <div className="h-14 md:h-13 flex items-center justify-between px-4 md:px-3.5 pt-2 shrink-0">
          <span className="font-semibold text-lg md:text-base tracking-tight text-white flex items-center gap-1.5">ChatGPT</span>
          <div className="flex items-center gap-3 text-[#9b9b9b]">
            <Search size={18} className="cursor-pointer hover:text-white" />
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-[#1a1a1a] text-[#9b9b9b] hover:text-white cursor-pointer"><PanelLeft size={18} /></button>
          </div>
        </div>

        <div className="px-3 md:px-2.5 py-2 md:py-1.5 space-y-1 md:space-y-0.5 shrink-0 text-sm md:text-[13px]">
          <div onClick={() => { setViewMode('images_archive'); closeSidebarOnMobile(); }} className={`flex items-center justify-between py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors ${viewMode === 'images_archive' ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}>
            <span className="flex items-center gap-3 md:gap-2.5"><ImageIcon size={17} className={viewMode === 'images_archive' ? 'text-blue-400' : 'text-[#9b9b9b]'} /> Images</span>
            <span className="text-xs text-gray-500 font-mono">{archivedImages.length}</span>
          </div>

          <div className="flex items-center gap-3 md:gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors">
            <BookOpen size={17} className="text-[#9b9b9b]" /> Library
          </div>

          <div onClick={() => { setViewMode('scheduled'); closeSidebarOnMobile(); }} className={`flex items-center justify-between py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors ${viewMode === 'scheduled' ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}>
            <span className="flex items-center gap-3 md:gap-2.5"><Clock size={17} className={viewMode === 'scheduled' ? 'text-amber-400' : 'text-[#9b9b9b]'} /> Scheduled</span>
            {syncStatus === 'connected' ? <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> : syncStatus === 'incoming_request' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />}
          </div>

          <div onClick={() => { if (role === 'parent' || showArcadePlugins) setShowArcadePlugins(!showArcadePlugins); }} className={`flex items-center justify-between py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors ${incomingGameRequest ? 'bg-amber-500/20 border border-amber-500/50 animate-pulse' : (showArcadePlugins ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]')}`}>
            <span className="flex items-center gap-3 md:gap-2.5"><ToyBrick size={17} className={incomingGameRequest ? 'text-amber-400 animate-spin' : (showArcadePlugins ? 'text-emerald-400' : 'text-[#9b9b9b]')} /> <span>Plugins</span></span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${incomingGameRequest ? 'bg-amber-500 text-black animate-bounce' : showArcadePlugins ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>{incomingGameRequest ? 'NEW REQ' : showArcadePlugins ? 'ACTIVE' : 'LOCKED'}</span>
          </div>

          {showArcadePlugins && role === 'parent' && (
            <div className="pl-3 pr-2 py-2 space-y-2 bg-[#0c0c0c] rounded-xl border border-[#222] my-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400"><span className="flex items-center gap-1"><Gamepad2 size={13} /> Arcade Master (H)</span></div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={handleAdminSendRequest} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 rounded-lg cursor-pointer transition-all shadow">Send Request</button>
                <button onClick={handleAdminDisconnectArcade} className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold py-1.5 rounded-lg cursor-pointer transition-all">Disconnect</button>
              </div>
            </div>
          )}

          {incomingGameRequest && role !== 'parent' && (
            <div className="bg-amber-950/60 border border-amber-500/50 p-3 rounded-xl my-1 space-y-2 text-left animate-in fade-in duration-200">
              <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5"><Radio size={14} className="animate-pulse" /> Admin (H) sent arcade games request!</p>
              <button onClick={handleUserAcceptRequest} className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"><Check size={14} /> Accept & Unlock 8 Games</button>
            </div>
          )}

          {showArcadePlugins && (role === 'parent' || !incomingGameRequest) && (
            <div className="pl-2 pr-1 py-1.5 space-y-1 bg-[#0c0c0c] rounded-xl border border-emerald-500/30 my-1">
              <div className="text-[10px] font-bold text-emerald-400 px-2 py-0.5">ARCADE GAMES (8 ACTIVE)</div>
              <div className="max-h-52 overflow-y-auto space-y-1 scrollbar-none pr-1">
                {ARCADE_GAMES.map((game) => (
                  <button key={game.id} onClick={() => handleLaunchGame(game)} className="w-full text-left bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] p-2 rounded-lg transition-all cursor-pointer flex items-center justify-between group">
                    <span className="text-[11px] font-bold text-gray-200 group-hover:text-white truncate">{game.name}</span>
                    <Play size={10} className="text-gray-400 group-hover:text-emerald-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 md:gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors"><FolderGit2 size={17} className="text-[#9b9b9b]" /> Projects</div>
          <div onClick={() => { setViewMode('codex'); closeSidebarOnMobile(); }} className={`flex items-center gap-3 md:gap-2.5 py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors ${viewMode === 'codex' ? 'bg-[#212121] text-white font-medium' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}><TerminalSquare size={17} className={viewMode === 'codex' ? 'text-emerald-400' : 'text-[#9b9b9b]'} /> <span>Codex</span></div>
          <div className="flex items-center gap-3 md:gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors"><MoreHorizontal size={17} className="text-[#9b9b9b]" /> More</div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 border-t border-[#1a1a1a] mt-1 scrollbar-none text-sm md:text-[13px]">
          <div className="text-xs md:text-[11px] text-[#737373] px-3 md:px-2.5 py-1.5 font-semibold">Recents</div>
          {roomList.map((roomName, idx) => (
            <div key={idx} onClick={() => { setCurrentRoom(roomName); setViewMode('real_gpt'); setReplyTarget(null); closeSidebarOnMobile(); }} className={`flex items-center justify-between py-2 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors group ${currentRoom === roomName && viewMode === 'real_gpt' ? 'bg-[#212121] text-white font-medium' : 'text-[#b4b4b4] hover:bg-[#171717] hover:text-white'}`}>
              <span className="truncate max-w-[200px]">{roomName}</span>
            </div>
          ))}
        </div>

        {role === 'parent' && (
          <div className="p-2 border-t border-[#1e1e1e] flex items-center gap-1.5 shrink-0 bg-[#0a0a0a]">
            <button onClick={() => { setShowPendingModal(true); closeSidebarOnMobile(); }} className="flex-1 flex items-center justify-between text-xs text-amber-400 hover:bg-[#1a1a1a] p-2 rounded-lg cursor-pointer transition-all active:scale-95">
              <span className="flex items-center gap-2 font-medium"><AlertCircle size={15} /> Answer Pending</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${pendingMessages.length > 0 ? 'bg-amber-500 text-black animate-pulse' : 'bg-amber-500/20 text-amber-300'}`}>{pendingMessages.length}</span>
            </button>
            <button onClick={downloadPendingPDF} title="Download Answer Pending Report" className="p-2 text-gray-400 hover:text-amber-400 hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer shrink-0"><Download size={15} /></button>
          </div>
        )}

        <div className="p-3 md:p-2.5 border-t border-[#171717] flex items-center justify-between text-xs bg-[#000000]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 md:w-7 md:h-7 rounded-full bg-[#1e293b] border border-[#333] flex items-center justify-center text-white text-xs font-bold shrink-0">{role === 'parent' ? 'H' : 'A'}</div>
            <div className="truncate"><p className="text-white text-xs font-medium truncate">{role === 'parent' ? 'Admin (H)' : 'User (A)'}</p><p className="text-[10px] text-gray-400">Free</p></div>
          </div>
          <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] text-white text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0">Upgrade</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#000000] overflow-hidden min-w-0">
        <header className="h-14 md:h-12 flex items-center justify-between px-3 md:px-4 shrink-0 z-10 border-b border-[#141414]">
          <div className="flex items-center gap-2 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className="text-[#9b9b9b] hover:text-white p-1.5 rounded-lg active:bg-[#1f1f1f] cursor-pointer shrink-0" title="Open Sidebar"><PanelLeft size={20} /></button>
            <span className="text-sm md:text-xs font-semibold text-gray-200 truncate max-w-[140px] sm:max-w-[240px]">{viewMode === 'codex' ? 'Codex' : currentRoom}</span>

            {role === 'parent' && (
              <button onClick={downloadFullChatPDF} title="Export Chat PDF manually (Auto-downloads at 7:00 PM)" className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ml-2 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)] active:scale-95 shrink-0">
                <Timer size={14} className="text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>7 PM: {countdownStr}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#9b9b9b] shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${!isConnected ? 'bg-zinc-600' : hasUnreadSecret ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_6px_#10b981]'}`} />
            {role === 'parent' && <span className="text-[9px] sm:text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">ADMIN (H)</span>}
            <button className="hidden sm:flex items-center gap-1.5 text-white hover:text-gray-200 cursor-pointer text-xs font-medium"><Sparkles size={14} className="text-blue-400" /><span>Upgrade</span></button>
            <button className="p-1 text-white hover:text-gray-200 cursor-pointer text-xs"><Share size={15} /></button>
            <button className="p-1 text-white hover:text-gray-200 cursor-pointer text-xs" onClick={() => window.location.reload()}><RefreshCw size={15} /></button>
          </div>
        </header>

        {autoplayBlocked && (
          <div onClick={handleManualUnmuteClick} className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-3 py-2 text-xs flex items-center justify-between cursor-pointer animate-pulse z-30">
            <div className="flex items-center gap-2 truncate"><VolumeX size={16} className="shrink-0" /><span className="truncate">Tap here to unmute synchronized playback</span></div>
            <span className="bg-amber-500 text-black font-bold px-2 py-0.5 rounded text-[10px] shrink-0 ml-2">Unmute</span>
          </div>
        )}

        {syncStatus === 'connected' && activeVideoId && viewMode !== 'scheduled' && viewMode !== 'codex' && (
          <div className="bg-[#141414]/95 border-b border-[#2a2a2a] px-3 sm:px-4 py-2 flex items-center justify-between z-20 text-xs backdrop-blur-md shadow-lg shrink-0">
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><Music size={13} className={isPlaying ? 'animate-bounce' : ''} /></div>
              <span className="text-gray-300 truncate font-mono text-[11px]">🎵 <strong className="text-white">Live:</strong> {activeTrackTitle || "Synced Track"}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={handleTogglePlayPause} className="bg-[#222] hover:bg-[#333] text-white p-1.5 px-2 rounded-lg flex items-center gap-1 cursor-pointer text-[11px] font-semibold border border-[#333]">{isPlaying ? <Pause size={12} /> : <Play size={12} />}<span>{isPlaying ? 'Pause' : 'Play'}</span></button>
              <button onClick={() => setViewMode('scheduled')} className="text-amber-400 text-[11px] font-semibold px-1.5 py-1 cursor-pointer underline decoration-dotted">Lounge</button>
              <button onClick={handleDisconnectSync} className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 p-1.5 rounded-lg cursor-pointer" title="Disconnect Audio"><Unlink size={12} /></button>
            </div>
          </div>
        )}

        {activeGame ? (
          <section className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4 scrollbar-none font-sans flex flex-col items-center justify-center">
            <div className="w-full bg-[#121212] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative space-y-5 text-center">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center gap-2"><Gamepad2 size={22} className="text-emerald-400 animate-bounce" /><h2 className="text-lg font-black text-white">{activeGame.name}</h2></div>
                <button onClick={() => setActiveGame(null)} className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all">Close Game</button>
              </div>

              <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#222] px-4 py-2.5 rounded-2xl text-xs font-mono">
                <span className="text-blue-400 font-bold">Admin (H): {scores.H}</span>
                <span className="text-emerald-400 animate-pulse font-bold">LIVE SCOREBOARD</span>
                <span className="text-rose-400 font-bold">User (A): {scores.A}</span>
              </div>

              {winnerMessage && <div className="bg-amber-500/20 border border-amber-500 text-amber-300 py-2.5 px-4 rounded-xl text-xs font-bold animate-bounce">{winnerMessage}</div>}

              {activeGame.id === 'tictactoe' && (
                <div className="space-y-4 bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl max-w-sm mx-auto shadow-inner">
                  <div className="text-xs font-bold text-gray-200">Turn: <span className={`px-2.5 py-1 rounded-lg text-white font-mono ${isHNext ? 'bg-blue-600' : 'bg-rose-600'}`}>{isHNext ? 'Player H (Admin)' : 'Player A (User)'}</span></div>
                  <div className="grid grid-cols-3 gap-3">
                    {tictactoeBoard.map((val, idx) => (
                      <button key={idx} onClick={() => handleTicTacToeClick(idx)} className={`h-24 rounded-2xl text-3xl font-black flex items-center justify-center transition-all cursor-pointer shadow-xl transform active:scale-95 ${val === 'H' ? 'bg-blue-600 text-white' : val === 'A' ? 'bg-rose-600 text-white' : 'bg-[#1a1a1a] text-gray-600 border border-[#333]'}`}>{val}</button>
                    ))}
                  </div>
                  <button onClick={() => { setTictactoeBoard(Array(9).fill(null)); setIsHNext(true); setWinnerMessage(''); }} className="text-xs text-amber-400 hover:underline flex items-center gap-1 mx-auto pt-2 cursor-pointer"><RotateCcw size={13} /> Reset Board</button>
                </div>
              )}

              {activeGame.id === 'ludo' && (
                <div className="space-y-5 bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 ${ludoTurn === 'H' ? 'bg-blue-600/30 border-blue-500 text-white animate-pulse' : 'bg-[#1a1a1a] border-[#333] text-gray-400'}`}><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /><span className="text-xs font-bold">Player H</span><span className="text-xs font-mono font-black text-amber-300">Pos: {ludoPos.H}/30</span></div>
                    <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 ${ludoTurn === 'A' ? 'bg-rose-600/30 border-rose-500 text-white animate-pulse' : 'bg-[#1a1a1a] border-[#333] text-gray-400'}`}><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /><span className="text-xs font-bold">Player A</span><span className="text-xs font-mono font-black text-amber-300">Pos: {ludoPos.A}/30</span></div>
                  </div>
                  <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl flex items-center justify-between shadow-inner">
                    <div className="text-sm font-extrabold text-amber-400 flex items-center gap-3"><Dice5 size={24} className="text-amber-500 animate-spin" /><span className="w-12 h-12 rounded-2xl bg-amber-500 text-black font-black text-2xl flex items-center justify-center shadow-lg">{diceVal}</span></div>
                    <button onClick={handleLudoRoll} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg cursor-pointer active:scale-95 transition-all">Roll Dice</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {viewMode === 'real_gpt' && (
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-4xl w-full mx-auto space-y-4 sm:space-y-6 scrollbar-none">
                {conversations.map((msg) => (
                  <div key={msg.id} className="w-full">
                    {msg.role === 'user' ? (
                      <div className="flex justify-end my-2 sm:my-3">
                        <div className="bg-[#1c3a6b] text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl max-w-[88%] sm:max-w-[80%] text-sm sm:text-[13.5px] leading-relaxed shadow-lg whitespace-pre-wrap break-words select-text">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="w-full my-3 sm:my-4">
                        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-4 sm:p-6 shadow-2xl relative space-y-3 font-sans select-text">
                          <div className="flex items-center justify-between border-b border-[#282828] pb-2.5 text-[#a3a3a3]">
                            <button className="flex items-center gap-1.5 bg-[#2a2a2a] text-gray-300 text-xs px-2.5 py-1 rounded-md cursor-pointer"><Edit3 size={13} /><span>Edit</span></button>
                            <div className="flex items-center gap-3"><button className="hover:text-white cursor-pointer"><Copy size={15} /></button><button className="hover:text-white cursor-pointer"><Download size={15} /></button><button className="hover:text-white cursor-pointer"><Maximize2 size={15} /></button></div>
                          </div>
                          <div className="text-[#ececf1] text-sm leading-[1.7] whitespace-pre-wrap break-words">{msg.text}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isThinking && <div className="flex items-center gap-2 text-xs text-gray-400 italic px-2"><div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /><span>ChatGPT is writing detailed response...</span></div>}
                <div ref={messageEndRef} />
              </section>
            )}

            {viewMode === 'stealth' && (
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 max-w-4xl w-full mx-auto flex flex-col justify-center my-auto scrollbar-none">
                <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl font-mono text-xs md:text-[12.5px]">
                  <div className="bg-[#212121] px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between border-b border-[#2e2e2e] text-[#b4b4b4]">
                    <div className="flex items-center gap-2"><Code size={15} className="text-[#888]" /><span className="text-xs md:text-[13px] font-medium text-[#dedede]">JSON Schema</span></div>
                  </div>
                  <div className="p-4 sm:p-6 text-[#d4d4d4] space-y-2 overflow-x-hidden leading-relaxed text-xs">
                    <div className="border-y border-[#2a2a2a] py-2.5 my-2 bg-[#121212]/80 rounded-xl px-2.5">
                      <div className="text-[#6a9955] mb-1.5 flex items-center justify-between flex-wrap gap-2">
                        <span>{`# Active Schema Stream (Identity: ${role === 'user' ? 'A' : 'H'})`}</span>
                      </div>
                      <div ref={streamContainerRef} className="space-y-1 max-h-60 sm:max-h-64 overflow-y-auto pr-1 scrollbar-none flex flex-col">
                        {displayedStealthMessages.map((m, idx) => (
                          <div key={idx} id={`stealth-msg-${m._id}`} className={`group relative flex items-start justify-between px-2 py-1 rounded-lg gap-2 ${highlightedMsgId === m._id ? 'bg-emerald-950/70' : 'hover:bg-[#202020]'}`}>
                            <div className="flex-1 break-words text-left flex flex-wrap items-center text-xs">
                              <span className="text-[#9cdcfe] shrink-0 font-bold">{m.senderRole === 'user' ? 'A' : 'H'}</span>
                              <span className="mx-1 text-[#d4d4d4]">=</span>
                              {m.isMedia ? (
                                <button type="button" onClick={() => handleOpenViewOnce(m)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer border bg-[#252525] text-amber-300">
                                  {m.mediaOpened ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} className="text-amber-400 animate-pulse" />}
                                  <span>{m.mediaOpened ? '[Opened]' : '[View Once]'}</span>
                                </button>
                              ) : (
                                <span className="text-[#ce9178] break-all">"{cleanOriginalText(m.text)}"</span>
                              )}
                              <button type="button" onClick={() => handleStartReply(m)} className="text-gray-400 hover:text-emerald-400 px-1 ml-1 cursor-pointer font-bold text-xs">⤴</button>
                              <span className="text-[#6a9955] text-[10px] ml-1">[{m.timeFormatted}]</span>
                            </div>
                            {role === 'parent' && <button type="button" onClick={(e) => togglePendingFlag(e, m)} className={`px-2 py-0.5 text-xs font-bold rounded ${m.flaggedPending ? 'bg-amber-500 text-black' : 'bg-[#2a2a2a] text-gray-400'}`}>!</button>}
                          </div>
                        ))}
                        <div ref={messageEndRef} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {viewMode === 'images_archive' && (
              <section className="flex-1 overflow-y-auto px-3 py-3 max-w-4xl w-full mx-auto space-y-3 scrollbar-none font-sans">
                <div className="flex items-center justify-between border-b border-[#222] pb-2.5"><div className="flex items-center gap-2"><ImageIcon className="text-blue-400" size={18} /><h2 className="text-sm font-semibold text-white">Archived Media Vault</h2></div><span className="text-[11px] text-gray-400 font-mono">{archivedImages.length} items</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {archivedImages.map((item, idx) => (
                    <div key={idx} className="bg-[#171717] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-lg">
                      <img src={item.data} alt="Archived" className="w-full h-32 object-cover cursor-pointer" onClick={() => window.open(item.data, '_blank')} />
                      <div className="p-2 bg-[#121212] flex items-center justify-between text-[10px] text-gray-400 font-mono"><span className="text-blue-400 font-bold">{item.sender}</span><span>{item.time}</span></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {viewMode === 'scheduled' && (
              <section className="flex-1 overflow-y-auto px-3 py-3 max-w-4xl w-full mx-auto space-y-4 scrollbar-none font-sans">
                <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
                  <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400"><Music size={18} /></div><div><h2 className="text-sm font-bold text-white">Synced Music Lounge</h2></div></div>
                  {syncStatus === 'connected' && <button onClick={handleDisconnectSync} className="flex items-center gap-1 bg-rose-950 text-rose-300 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"><Unlink size={12} /> Disconnect</button>}
                </div>
                {syncStatus !== 'connected' ? (
                  <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center space-y-4 shadow-xl">
                    <Radio size={26} className={`mx-auto ${syncStatus === 'requested' ? 'animate-pulse text-blue-400' : 'text-amber-400'}`} />
                    <h3 className="text-base font-bold text-white">Two-Way Handshake</h3>
                    {syncStatus === 'idle' && <button onClick={handleSendSyncInvite} className="bg-[#1c3a6b] text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer"><Link2 size={15} /> Send Request</button>}
                    {syncStatus === 'requested' && <p className="text-xs text-amber-300">Waiting for counterpart...</p>}
                    {syncStatus === 'incoming_request' && <button onClick={handleAcceptSyncInvite} className="bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl text-xs">Accept & Join</button>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleTriggerSong(youtubeUrlInput); }} className="flex gap-2">
                      <input type="text" value={youtubeUrlInput} onChange={(e) => handleQueryChange(e.target.value)} placeholder="Type song name or YouTube link..." className="flex-1 bg-[#171717] border border-[#2c2c2c] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none" />
                      <button type="submit" disabled={isLoadingTrack} className="bg-[#1c3a6b] text-white px-5 py-2.5 rounded-xl text-xs font-bold">{isLoadingTrack ? <Loader2 size={14} className="animate-spin" /> : 'Play'}</button>
                    </form>
                    <div className="bg-[#121212] border border-[#242424] rounded-2xl p-6 text-center space-y-2.5">
                      <Volume2 size={24} className={`mx-auto text-emerald-400 ${isPlaying ? 'animate-bounce' : ''}`} />
                      <h3 className="text-sm font-bold text-white">{activeTrackTitle || "No track playing"}</h3>
                    </div>
                  </div>
                )}
              </section>
            )}

            {viewMode === 'codex' && (
              <section className="flex-1 overflow-y-auto px-3 py-3 max-w-5xl w-full mx-auto space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
                  <div className="flex items-center gap-2.5"><TerminalSquare size={18} className="text-emerald-400" /><h2 className="text-sm font-bold text-white">Codex</h2></div>
                  {role === 'parent' && (
                    <div className="flex bg-[#181818] p-1 rounded-xl border border-[#2c2c2c] gap-1 text-xs">
                      <button type="button" onClick={() => { setCodexEngine('gofile'); setMovieError(''); }} className={`px-3 py-1.5 rounded-lg ${codexEngine === 'gofile' ? 'bg-[#252525] text-emerald-400' : 'text-gray-400'}`}>Stream</button>
                      <button type="button" onClick={() => { setCodexEngine('youtube'); setMovieError(''); }} className={`px-3 py-1.5 rounded-lg ${codexEngine === 'youtube' ? 'bg-[#252525] text-blue-400' : 'text-gray-400'}`}>YouTube</button>
                    </div>
                  )}
                </div>
                {role === 'parent' && (
                  <form onSubmit={handleLoadMovie} className="flex gap-2">
                    <input type="text" value={movieInputUrl} onChange={(e) => setMovieInputUrl(e.target.value)} placeholder="Direct MP4 link or YouTube watch link..." className="flex-1 bg-[#171717] border border-[#2c2c2c] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none" />
                    <button type="submit" className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer">Broadcast</button>
                  </form>
                )}
                <div className="w-full bg-[#0a0a0a] border border-[#242424] rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center min-h-[300px]">
                  {codexEngine === 'gofile' ? (
                    activeMovieSrc ? <video ref={html5VideoRef} src={activeMovieSrc} controls playsInline onPlay={handleHtml5Play} onPause={handleHtml5Pause} onSeeked={handleHtml5Seeked} className="w-full max-h-[65vh] object-contain rounded-2xl bg-black" /> : <p className="text-xs text-gray-500">Waiting for Admin stream...</p>
                  ) : (
                    activeMovieYTId ? <iframe src={`https://www.youtube.com/embed/${activeMovieYTId}?autoplay=1&controls=1`} title="YouTube" allowFullScreen className="w-full h-[60vh] rounded-2xl border-none" /> : <p className="text-xs text-gray-500">Waiting for YouTube link...</p>
                  )}
                </div>
              </section>
            )}

            <div className="px-3 pb-3 pt-1 max-w-4xl w-full mx-auto shrink-0 relative" onMouseLeave={() => setShowMiniEmojiBar(false)}>
              {replyTarget && (
                <div className="mb-2 bg-[#1a1a1a] border border-[#333] px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="text-emerald-400 font-bold">⤴ {replyTarget.senderRole}:</span><span className="text-gray-300 italic">"{replyTarget.text}"</span></div>
                  <button type="button" onClick={() => setReplyTarget(null)} className="text-gray-400 hover:text-white cursor-pointer"><X size={15} /></button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="w-full relative">
                <div className="w-full bg-[#212121] rounded-full border border-[#2e2e2e] px-3 py-2 flex items-center gap-2 shadow-2xl min-h-[48px]">
                  <button type="button" onClick={() => { if (viewMode === 'stealth' && fileInputRef.current) fileInputRef.current.click(); }} className="text-[#9b9b9b] hover:text-white p-1 rounded-full cursor-pointer"><Plus size={20} /></button>
                  <input ref={inputRef} type="text" value={input} onChange={handleInputChange} placeholder={viewMode === 'stealth' ? (replyTarget ? `Reply to ${replyTarget.senderRole}...` : "Schema entry...") : "Ask anything"} className="flex-1 bg-transparent text-sm text-white placeholder-[#8e8e8e] outline-none min-w-0" />
                  <button type="button" onClick={() => setShowMiniEmojiBar(!showMiniEmojiBar)} className="p-1.5 rounded-full text-[#8e8e8e] hover:text-white cursor-pointer"><Smile size={19} /></button>
                  <button type="submit" className="bg-[#1c3a6b] hover:bg-[#254d8f] text-white w-8 h-8 rounded-full cursor-pointer flex items-center justify-center shadow shrink-0"><ArrowUp size={16} /></button>
                </div>
              </form>
            </div>
          </>
        )}

        {activeViewImage && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl max-w-xl w-full p-4 flex flex-col items-center space-y-4 shadow-2xl">
              <div className="w-full flex items-center justify-between text-xs text-gray-400 border-b border-[#222] pb-2 font-mono"><span className="text-emerald-400 font-bold"><Eye size={13} /> View Once Photo</span><span>{activeViewImage.time}</span></div>
              <div className="max-h-[65vh] overflow-hidden rounded-xl"><img src={activeViewImage.data} alt="Secret View Once" className="max-h-[60vh] object-contain rounded-lg" /></div>
              <button type="button" onClick={handleCloseViewOnce} className="w-full bg-[#1c3a6b] text-white text-xs py-3 rounded-xl font-medium cursor-pointer">Done</button>
            </div>
          </div>
        )}

        {showPendingModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#171717] border border-[#2e2e2e] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3"><div className="flex items-center gap-2 text-amber-400 font-semibold text-sm"><AlertCircle size={18} /><span>Answer Pending ({pendingMessages.length})</span></div><button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-white cursor-pointer"><X size={18} /></button></div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {pendingMessages.length === 0 ? <div className="text-center text-xs text-gray-500 py-8">No pending questions.</div> : pendingMessages.map((m, idx) => (
                  <div key={idx} className="bg-[#212121] border border-[#2d2d2d] p-3 rounded-xl flex items-start justify-between gap-3">
                    <div className="space-y-1 text-xs"><div className="text-[11px] text-gray-400 font-mono"><span>{m.senderRole}</span> • <span>{m.timeFormatted}</span></div><p className="text-gray-200 font-mono line-clamp-3">{cleanOriginalText(m.text)}</p></div>
                    <button onClick={(e) => togglePendingFlag(e, m)} className="bg-emerald-950 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg font-bold">Done</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
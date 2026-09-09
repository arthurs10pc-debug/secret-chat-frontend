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
  Film, Tv, Video, TerminalSquare, AlertTriangle, HardDrive, Globe, ExternalLink
} from 'lucide-react';

const SOCKET_URL = "https://secret-chat-backend-07d0.onrender.com";
const SECRET_KEY = "StealthMasterKey99";
const GLOBAL_ROOM = "stealth_master_room";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🙏", "👌", "💯", "🤫", "✨"];
const HOVER_REACTIONS = ["👍", "❤️", "🥰", "😆", "😮", "😢", "😡"];

const DEFAULT_RECENT_CHATS = [
  "GMB Review Reply",
  "Prashant chotalia",
  "Shiva Pradakshina Meaning",
  "Generate random code",
  "Free Movie Watch Together",
  "Clinic Content Writing",
  "Write Kidney Article",
  "KidneyCure TOPIC",
  "Pest Control in Ahmedabad",
  "Blog Topics ( Pest Control )",
  "MTech Semester Dates",
  "Free Couple Watch Apps",
  "Tablet as Second Screen",
  "Bike Comparison Suggestion",
  "Punjabi Thali Search"
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
    case 'vidlink':
      return `https://vidlink.pro/movie/${cleanId}`;
    case 'autoembed':
      return `https://player.autoembed.cc/embed/movie/${cleanId}`;
    case 'vidsrc_xyz':
      return `https://vidsrc.xyz/embed/movie/${cleanId}`;
    case 'smashy':
      return `https://embed.smashystream.com/playere.php?imdb=${cleanId}`;
    default:
      return `https://vidlink.pro/movie/${cleanId}`;
  }
};

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('stealth_role') || 'user');
  const [currentRoom, setCurrentRoom] = useState("GMB Review Reply");
  const [roomList, setRoomList] = useState(() => {
    const saved = localStorage.getItem('stealth_rooms');
    if (!saved) return DEFAULT_RECENT_CHATS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.map(r => (r === "Iron man1" || r === "GMB new ( R )") ? "GMB Review Reply" : r);
    } catch {
      return DEFAULT_RECENT_CHATS;
    }
  });

  const [viewMode, setViewMode] = useState('real_gpt');

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('stealth_conversations');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "init_1",
        role: "user",
        text: "Smile Architect Orthodontic Centre & Dental Clinic\n\nPatil Colony, Nashik\n\nInvisalign Aligners Treatment",
        time: "5:27 PM"
      },
      {
        id: "init_2",
        role: "assistant",
        text: "Invisalign aligners treatment is a modern orthodontic approach designed to gradually straighten teeth and improve dental alignment using a series of clear, removable aligners.",
        time: "5:27 PM"
      }
    ];
  });

  const [stealthMessages, setStealthMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const typingTimerRef = useRef(null);

  // Synced Lounge States
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

  // CODEX 4-ENGINE THEATER STATES
  const [codexEngine, setCodexEngine] = useState('gofile');
  const [movieInputUrl, setMovieInputUrl] = useState('');
  const [activeMovieSrc, setActiveMovieSrc] = useState('');
  const [activeMovieYTId, setActiveMovieYTId] = useState('');
  
  // Embed API States
  const [embedServer, setEmbedServer] = useState('vidlink');
  const [currentImdbId, setCurrentImdbId] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState('');
  
  // Local File States
  const [localVideoSrc, setLocalVideoSrc] = useState('');
  const [localFileName, setLocalFileName] = useState('');
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);
  const [movieError, setMovieError] = useState('');
  
  const html5VideoRef = useRef(null);
  const localVideoInputRef = useRef(null);
  const isMovieRemoteTriggerRef = useRef(false);

  const playerRef = useRef(null);
  const isRemoteTriggerRef = useRef(false);
  const suggestDebounceRef = useRef(null);
  const lastSyncActionTimeRef = useRef(0);
  const pendingRestoreRef = useRef(null);

  // Bot Scheduled Message States
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [botTab, setBotTab] = useState('instant');
  const [customMsg, setCustomMsg] = useState('');
  const [schedMsg, setSchedMsg] = useState('');
  const [schedTime1, setSchedTime1] = useState('');
  const [schedTime2, setSchedTime2] = useState('');
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [incomingAlert, setIncomingAlert] = useState(null);

  const [activeViewImage, setActiveViewImage] = useState(null);
  const [archivedImages, setArchivedImages] = useState(() => {
    const saved = localStorage.getItem('stealth_image_vault');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      const currentRole = localStorage.getItem('stealth_role') || 'user';
      if (currentRole === 'user') {
        const now = Date.now();
        return parsed.filter(img => now - img.archivedAt < 24 * 60 * 60 * 1000);
      }
      return parsed;
    } catch {
      return [];
    }
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
  const escPressCount = useRef(0);
  const escTimer = useRef(null);
  const swRegistrationRef = useRef(null);

  const viewModeRef = useRef(viewMode);
  const roleRef = useRef(role);

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

  const initGlobalPlayer = useCallback((initialVideoId = '') => {
    if (window.YT && window.YT.Player && !playerRef.current) {
      try {
        playerRef.current = new window.YT.Player('persistent-sync-iframe', {
          height: '100%',
          width: '100%',
          videoId: initialVideoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              if (pendingRestoreRef.current) {
                const p = pendingRestoreRef.current;
                pendingRestoreRef.current = null;
                isRemoteTriggerRef.current = true;
                playerRef.current.loadVideoById({
                  videoId: p.videoId,
                  startSeconds: p.currentTime || 0
                });
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
                if (p.state === 'PLAY' && viewModeRef.current !== 'codex') {
                  const playPromise = playerRef.current.playVideo();
                  if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => setAutoplayBlocked(true));
                  }
                } else {
                  playerRef.current.pauseVideo();
                }
                setTimeout(() => { isRemoteTriggerRef.current = false; }, 2000);
              }
            },
            onStateChange: (event) => {
              if (isRemoteTriggerRef.current) return;
              if (Date.now() - lastSyncActionTimeRef.current < 2500) return;

              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setAutoplayBlocked(false);
                if (socketRef.current) {
                  socketRef.current.emit('sync_playback_state', {
                    room: GLOBAL_ROOM,
                    state: 'PLAY',
                    currentTime: playerRef.current.getCurrentTime(),
                    timestamp: Date.now()
                  });
                }
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                if (socketRef.current) {
                  socketRef.current.emit('sync_playback_state', {
                    room: GLOBAL_ROOM,
                    state: 'PAUSE',
                    currentTime: playerRef.current.getCurrentTime(),
                    timestamp: Date.now()
                  });
                }
              }
            }
          }
        });
      } catch (e) {
        console.error("Player initialization skipped", e);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        initGlobalPlayer();
        clearInterval(timer);
      }
    }, 400);
    return () => clearInterval(timer);
  }, [initGlobalPlayer]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        swRegistrationRef.current = reg;
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (role === 'parent' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [role]);

  const triggerParentMobileNotification = useCallback((incomingText) => {
    const isParent = (roleRef.current || localStorage.getItem('stealth_role')) === 'parent';
    if (!isParent || !('Notification' in window) || Notification.permission !== 'granted') return;

    const userMsgs = stealthMessagesRef.current
      .filter(m => m.senderRole === 'user')
      .map(m => m.isMedia ? "[Photo Asset]" : m.text);

    if (incomingText) {
      userMsgs.push(incomingText);
    }

    const last3 = userMsgs.slice(-3);
    const bodyFormatted = last3.length > 0 
      ? last3.map(t => `• ${t.length > 40 ? t.substring(0, 37) + '...' : t}`).join('\n')
      : "• New incoming message";

    const title = `ChatGPT • (A)`;
    const options = {
      body: bodyFormatted,
      icon: 'https://chat.openai.com/favicon.ico',
      badge: 'https://chat.openai.com/favicon.ico',
      tag: 'stealth_parent_stream',
      renotify: true,
      vibrate: [200, 100, 200]
    };

    if (swRegistrationRef.current && 'showNotification' in swRegistrationRef.current) {
      swRegistrationRef.current.showNotification(title, options);
    } else {
      try {
        new Notification(title, options);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    stealthMessagesRef.current = stealthMessages;
    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [stealthMessages.length, isPeerTyping]);

  useEffect(() => {
    localStorage.setItem('stealth_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('stealth_rooms', JSON.stringify(roomList));
  }, [roomList]);

  useEffect(() => {
    localStorage.setItem('stealth_image_vault', JSON.stringify(archivedImages));
  }, [archivedImages]);

  const playSentSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }, []);

  const playReceiveSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.08);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.28);
    } catch (e) {}
  }, []);

  const playBubblePopSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, []);

  const encryptText = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  const decryptText = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || cipher;
    } catch {
      return cipher;
    }
  };

  const markMessagesAsSeen = useCallback(() => {
    const isCurrentlyStealth = viewModeRef.current === 'stealth';
    const isTabActive = document.visibilityState === 'visible' && document.hasFocus();

    if (isCurrentlyStealth && isTabActive && socketRef.current) {
      const currentRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: currentRole });
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'stealth') {
      markMessagesAsSeen();
      const currentRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      setStealthMessages(prev => prev.map(m => m.senderRole !== currentRole ? { ...m, isSeen: true } : m));
    }
  }, [viewMode, markMessagesAsSeen]);

  // Main Socket Connection & Listeners
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      const currentRole = localStorage.getItem('stealth_role') || 'user';
      socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: currentRole });
      markMessagesAsSeen();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      setIsPeerTyping(false);
    });

    socketRef.current.on('load_history', (history) => {
      const parsed = (history || []).map(m => ({
        ...m,
        text: decryptText(m.encryptedText),
        timeFormatted: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSeen: m.isSeen || false,
        isMedia: m.isMedia || false,
        mediaOpened: m.mediaOpened || false,
        reaction: m.reaction || null
      }));
      setStealthMessages(parsed);
      markMessagesAsSeen();
    });

    socketRef.current.on('peer_typing_status', (data) => {
      if (typeof data === 'object' && data !== null) {
        const myRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
        if (data.senderRole && data.senderRole === myRole) return;
        setIsPeerTyping(Boolean(data.isTyping));
      } else {
        setIsPeerTyping(Boolean(data));
      }
    });

    socketRef.current.on('sync_restore_state', (data) => {
      if (!data || !data.connected) return;
      setSyncStatus('connected');

      if (data.videoId) {
        setActiveVideoId(data.videoId);
        setActiveTrackTitle(data.title || "YouTube Track");
        setIsPlaying(data.state === 'PLAY');

        if (playerRef.current && playerRef.current.loadVideoById) {
          isRemoteTriggerRef.current = true;
          playerRef.current.loadVideoById({
            videoId: data.videoId,
            startSeconds: data.currentTime || 0
          });
          playerRef.current.unMute();
          playerRef.current.setVolume(100);
          if (data.state === 'PLAY' && viewModeRef.current !== 'codex') {
            const p = playerRef.current.playVideo();
            if (p && typeof p.catch === 'function') {
              p.catch(() => setAutoplayBlocked(true));
            }
          } else {
            playerRef.current.pauseVideo();
          }
          setTimeout(() => { isRemoteTriggerRef.current = false; }, 2000);
        } else {
          pendingRestoreRef.current = data;
        }
      }
    });

    socketRef.current.on('sync_receive_invite', ({ fromRole }) => {
      setSyncStatus('incoming_request');
      setIncomingInviteRole(fromRole);
      playReceiveSound();
    });

    socketRef.current.on('sync_connected_event', () => {
      setSyncStatus('connected');
      playReceiveSound();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    });

    socketRef.current.on('sync_disconnected_event', () => {
      setSyncStatus('idle');
      setIsPlaying(false);
      setActiveTrackTitle('');
      setActiveVideoId('');
      setYoutubeUrlInput('');
      if (playerRef.current && playerRef.current.stopVideo) {
        playerRef.current.stopVideo();
      }
    });

    socketRef.current.on('sync_track_update', ({ videoId, title }) => {
      setActiveTrackTitle(title || "YouTube Track");
      setActiveVideoId(videoId);
      setIsPlaying(true);
      lastSyncActionTimeRef.current = Date.now();

      if (playerRef.current && playerRef.current.loadVideoById) {
        isRemoteTriggerRef.current = true;
        try {
          playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
          playerRef.current.unMute();
          playerRef.current.setVolume(100);
          const playPromise = playerRef.current.playVideo();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => setAutoplayBlocked(true));
          }
        } catch (e) {
          setAutoplayBlocked(true);
        }
        setTimeout(() => { isRemoteTriggerRef.current = false; }, 2000);
      }
    });

    socketRef.current.on('sync_playback_update', ({ state, currentTime, timestamp }) => {
      if (!playerRef.current) return;
      isRemoteTriggerRef.current = true;
      lastSyncActionTimeRef.current = Date.now();

      const latency = Math.max(0, (Date.now() - timestamp) / 1000);
      const targetTime = currentTime + (state === 'PLAY' ? latency : 0);

      try {
        if (Math.abs(playerRef.current.getCurrentTime() - targetTime) > 0.4) {
          playerRef.current.seekTo(targetTime, true);
        }

        if (state === 'PLAY') {
          playerRef.current.unMute();
          playerRef.current.playVideo();
          setIsPlaying(true);
          setAutoplayBlocked(false);
        } else {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        }
      } catch (e) {
        setAutoplayBlocked(true);
      }

      setTimeout(() => {
        isRemoteTriggerRef.current = false;
      }, 1000);
    });

    // CODEX CINEMA RESTORE & SYNC LISTENERS
    socketRef.current.on('codex_restore_state', (data) => {
      if (!data) return;
      setCodexEngine(data.engine || 'gofile');
      setMovieError('');
      if (data.engine === 'youtube') {
        setActiveMovieYTId(data.ytId || '');
        setActiveMovieSrc('');
        setActiveEmbedUrl('');
      } else if (data.engine === 'embed') {
        setActiveEmbedUrl(data.embedUrl || '');
        setCurrentImdbId(data.imdbId || '');
        setActiveMovieSrc('');
        setActiveMovieYTId('');
      } else {
        setActiveMovieSrc(data.url || '');
        setActiveMovieYTId('');
        setActiveEmbedUrl('');
      }
    });

    socketRef.current.on('codex_movie_load_broadcast', ({ engine, url, ytId, embedUrl, imdbId, senderRole }) => {
      const myRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      if (senderRole === myRole) return;

      setCodexEngine(engine);
      setMovieError('');
      if (engine === 'gofile') {
        setActiveMovieSrc(url);
        setActiveMovieYTId('');
        setActiveEmbedUrl('');
        setIsMoviePlaying(false);
      } else if (engine === 'youtube') {
        setActiveMovieYTId(ytId);
        setActiveMovieSrc('');
        setActiveEmbedUrl('');
        setIsMoviePlaying(true);
      } else if (engine === 'embed') {
        setActiveEmbedUrl(embedUrl);
        setCurrentImdbId(imdbId || '');
        setActiveMovieSrc('');
        setActiveMovieYTId('');
      } else if (engine === 'local') {
        setActiveMovieSrc('');
        setActiveMovieYTId('');
        setActiveEmbedUrl('');
      }
      playReceiveSound();
    });

    socketRef.current.on('codex_movie_sync_broadcast', ({ state, currentTime, timestamp }) => {
      if ((codexEngine === 'gofile' || codexEngine === 'local') && html5VideoRef.current) {
        isMovieRemoteTriggerRef.current = true;
        const latency = Math.max(0, (Date.now() - timestamp) / 1000);
        const target = currentTime + (state === 'PLAY' ? latency : 0);

        if (Math.abs(html5VideoRef.current.currentTime - target) > 0.4) {
          html5VideoRef.current.currentTime = target;
        }

        if (state === 'PLAY') {
          html5VideoRef.current.play().catch(() => {});
          setIsMoviePlaying(true);
        } else {
          html5VideoRef.current.pause();
          setIsMoviePlaying(false);
        }

        setTimeout(() => { isMovieRemoteTriggerRef.current = false; }, 600);
      }
    });

    socketRef.current.on('scheduled_jobs_update', (jobs) => {
      setScheduledJobs(jobs || []);
    });

    socketRef.current.on('receive_assistant_alert', (data) => {
      setIncomingAlert(data);
      playReceiveSound();
    });

    socketRef.current.on('parent_bubble_pop_notify', () => {
      if (localStorage.getItem('stealth_role') === 'parent') {
        playBubblePopSound();
      }
    });

    socketRef.current.on('receive_stealth_msg', (data) => {
      setIsPeerTyping(false);
      const text = decryptText(data.encryptedText);
      const myCurrentRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      const isCurrentlyStealth = viewModeRef.current === 'stealth';
      const isTabActive = document.visibilityState === 'visible' && document.hasFocus();
      const shouldAutoSeen = isCurrentlyStealth && isTabActive && data.senderRole !== myCurrentRole;

      const formatted = {
        ...data,
        text,
        timeFormatted: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSeen: shouldAutoSeen,
        isMedia: data.isMedia || false,
        mediaOpened: false,
        reaction: null
      };

      setStealthMessages(prev => {
        if (prev.some(m => m._id === formatted._id)) return prev;
        return [...prev, formatted];
      });

      if (data.senderRole !== myCurrentRole) {
        playReceiveSound();
        if (shouldAutoSeen && socketRef.current) {
          socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: myCurrentRole });
        }

        if (data.senderRole === 'user') {
          triggerParentMobileNotification(formatted.isMedia ? "[Photo Asset]" : text);
        }
      }
    });

    socketRef.current.on('messages_marked_seen', ({ viewerRole }) => {
      setStealthMessages(prev => prev.map(m => {
        if (m.senderRole !== viewerRole) {
          return { ...m, isSeen: true };
        }
        return m;
      }));
    });

    socketRef.current.on('media_marked_opened', ({ messageId }) => {
      setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, mediaOpened: true } : m));
    });

    socketRef.current.on('message_destroyed_on_view', ({ messageId }) => {
      setStealthMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socketRef.current.on('update_message_reaction', ({ messageId, reaction }) => {
      setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, reaction } : m));
    });

    socketRef.current.on('update_msg_status', ({ messageId, flaggedPending }) => {
      setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, flaggedPending } : m));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [playReceiveSound, playBubblePopSound, markMessagesAsSeen, triggerParentMobileNotification, codexEngine]);

  // CODEX VIDEO CONTROLS
  const handleLoadMovie = (e) => {
    e.preventDefault();
    setMovieError('');

    if (codexEngine === 'youtube') {
      const vid = extractYouTubeId(movieInputUrl.trim());
      if (!vid) {
        alert("Please paste a valid YouTube watch link.");
        return;
      }
      setActiveMovieYTId(vid);
      setActiveMovieSrc('');
      setActiveEmbedUrl('');
      setIsMoviePlaying(true);
      if (socketRef.current) {
        socketRef.current.emit('codex_movie_load', {
          room: GLOBAL_ROOM,
          engine: 'youtube',
          ytId: vid,
          senderRole: role
        });
      }
    } else if (codexEngine === 'embed') {
      const input = movieInputUrl.trim();
      let imdbId = input;
      let finalEmbed = input;

      const match = input.match(/tt\d{6,9}/);
      if (match) {
        imdbId = match[0];
        finalEmbed = getEmbedUrl(embedServer, imdbId);
      } else if (!input.startsWith('http')) {
        finalEmbed = getEmbedUrl(embedServer, input);
      }

      setCurrentImdbId(imdbId);
      setActiveEmbedUrl(finalEmbed);
      setActiveMovieSrc('');
      setActiveMovieYTId('');

      if (socketRef.current) {
        socketRef.current.emit('codex_movie_load', {
          room: GLOBAL_ROOM,
          engine: 'embed',
          embedUrl: finalEmbed,
          imdbId,
          senderRole: role
        });
      }
    } else if (codexEngine === 'local') {
      if (socketRef.current) {
        socketRef.current.emit('codex_movie_load', {
          room: GLOBAL_ROOM,
          engine: 'local',
          senderRole: role
        });
      }
    } else {
      const trimmed = movieInputUrl.trim();
      if (trimmed.toLowerCase().includes('.mkv')) {
        setMovieError("Note: .MKV container is not supported by web browsers. Video may lack audio. Please use .MP4 format!");
      }
      setActiveMovieSrc(trimmed);
      setActiveMovieYTId('');
      setActiveEmbedUrl('');
      setIsMoviePlaying(false);
      if (socketRef.current) {
        socketRef.current.emit('codex_movie_load', {
          room: GLOBAL_ROOM,
          engine: 'gofile',
          url: trimmed,
          senderRole: role
        });
      }
    }
    setMovieInputUrl('');
  };

  const handleSwitchEmbedServer = (newServer) => {
    setEmbedServer(newServer);
    if (!currentImdbId) return;

    const newUrl = getEmbedUrl(newServer, currentImdbId);
    setActiveEmbedUrl(newUrl);

    if (socketRef.current) {
      socketRef.current.emit('codex_movie_load', {
        room: GLOBAL_ROOM,
        engine: 'embed',
        embedUrl: newUrl,
        imdbId: currentImdbId,
        senderRole: role
      });
    }
  };

  const handleSelectLocalFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setMovieError('');

    if (file.name.toLowerCase().endsWith('.mkv')) {
      setMovieError("Warning: .MKV file selected. Native web players cannot decode AC3/MKV audio. If no sound plays, use an .MP4 file.");
    }

    const objUrl = URL.createObjectURL(file);
    setLocalVideoSrc(objUrl);
    setLocalFileName(file.name);
    setIsMoviePlaying(false);
  };

  const handleHtml5Play = () => {
    if (isMovieRemoteTriggerRef.current || !html5VideoRef.current) return;
    setIsMoviePlaying(true);
    if (socketRef.current) {
      socketRef.current.emit('codex_movie_sync', {
        room: GLOBAL_ROOM,
        state: 'PLAY',
        currentTime: html5VideoRef.current.currentTime,
        timestamp: Date.now()
      });
    }
  };

  const handleHtml5Pause = () => {
    if (isMovieRemoteTriggerRef.current || !html5VideoRef.current) return;
    setIsMoviePlaying(false);
    if (socketRef.current) {
      socketRef.current.emit('codex_movie_sync', {
        room: GLOBAL_ROOM,
        state: 'PAUSE',
        currentTime: html5VideoRef.current.currentTime,
        timestamp: Date.now()
      });
    }
  };

  const handleHtml5Seeked = () => {
    if (isMovieRemoteTriggerRef.current || !html5VideoRef.current) return;
    if (socketRef.current) {
      socketRef.current.emit('codex_movie_sync', {
        room: GLOBAL_ROOM,
        state: html5VideoRef.current.paused ? 'PAUSE' : 'PLAY',
        currentTime: html5VideoRef.current.currentTime,
        timestamp: Date.now()
      });
    }
  };

  const handleQueryChange = (val) => {
    setYoutubeUrlInput(val);
    if (!val.trim() || val.includes('youtu')) {
      setYtSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/api/yt-suggest?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setYtSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
        }
      } catch (e) {
        setYtSuggestions([]);
      }
    }, 280);
  };

  const handleSelectSuggestion = (suggestion) => {
    setYoutubeUrlInput(suggestion);
    setShowSuggestions(false);
    handleTriggerSong(suggestion, suggestion);
  };

  const handleTriggerSong = async (rawInput, displayTitle = '') => {
    if (!rawInput || !rawInput.trim()) return;
    setIsLoadingTrack(true);

    let vid = extractYouTubeId(rawInput.trim());
    let finalTitle = displayTitle || rawInput.trim();

    if (!vid) {
      try {
        const res = await fetch(`${SOCKET_URL}/api/yt-search?q=${encodeURIComponent(rawInput.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.videoId) {
            vid = data.videoId;
            finalTitle = data.title || finalTitle;
          }
        }
      } catch (err) {
        console.error("Search resolver error:", err);
      }
    }

    setIsLoadingTrack(false);

    if (!vid) {
      alert("Could not load track. Try pasting a direct YouTube watch link.");
      return;
    }

    if (playerRef.current && playerRef.current.unMute) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
      } catch (e) {}
    }

    if (socketRef.current) {
      socketRef.current.emit('sync_track_change', {
        room: GLOBAL_ROOM,
        videoId: vid,
        title: finalTitle
      });
    }
  };

  const handleSendSyncInvite = () => {
    if (socketRef.current) {
      socketRef.current.emit('sync_send_invite', { room: GLOBAL_ROOM, role });
      setSyncStatus('requested');
      playSentSound();
    }
  };

  const handleAcceptSyncInvite = () => {
    if (playerRef.current && playerRef.current.unMute) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
      } catch (e) {}
    }

    if (socketRef.current) {
      socketRef.current.emit('sync_confirm_invite', { room: GLOBAL_ROOM });
      setSyncStatus('connected');
    }
  };

  const handleManualUnmuteClick = () => {
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        playerRef.current.playVideo();
        setAutoplayBlocked(false);
      } catch (e) {}
    }
  };

  const handleDisconnectSync = () => {
    if (socketRef.current) {
      socketRef.current.emit('sync_disconnect_invite', { room: GLOBAL_ROOM });
      setSyncStatus('idle');
      setIsPlaying(false);
      setActiveTrackTitle('');
      setActiveVideoId('');
      setYoutubeUrlInput('');
      if (playerRef.current && playerRef.current.stopVideo) {
        playerRef.current.stopVideo();
      }
    }
  };

  const handleTogglePlayPause = () => {
    if (!playerRef.current) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    lastSyncActionTimeRef.current = Date.now();

    if (nextState) {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }

    if (socketRef.current) {
      socketRef.current.emit('sync_playback_state', {
        room: GLOBAL_ROOM,
        state: nextState ? 'PLAY' : 'PAUSE',
        currentTime: playerRef.current.getCurrentTime(),
        timestamp: Date.now()
      });
    }
  };

  const handleScheduleAlertSubmit = (e) => {
    e.preventDefault();
    if (!schedMsg.trim() || (!schedTime1 && !schedTime2)) {
      alert("Please enter message and at least 1 schedule time.");
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('schedule_bubble_alert', {
        room: GLOBAL_ROOM,
        text: schedMsg.trim(),
        time1: schedTime1,
        time2: schedTime2
      });
      alert("Bubble Alert scheduled successfully!");
      setSchedMsg('');
      setSchedTime1('');
      setSchedTime2('');
      setIsBotOpen(false);
    }
  };

  const handleCancelScheduledJob = (jobId) => {
    if (socketRef.current) {
      socketRef.current.emit('cancel_scheduled_job', { room: GLOBAL_ROOM, jobId });
    }
  };

  const handleSelectReaction = (messageId, emoji) => {
    setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, reaction: emoji } : m));
    setActiveReactionMsgId(null);

    if (socketRef.current) {
      socketRef.current.emit('add_reaction', {
        room: GLOBAL_ROOM,
        messageId,
        reaction: emoji
      });
    }
  };

  const processAndSendImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const encrypted = encryptText(base64Data);

      if (socketRef.current && viewMode === 'stealth') {
        socketRef.current.emit('send_stealth_msg', {
          room: GLOBAL_ROOM,
          role,
          encryptedText: encrypted,
          isMedia: true
        });
        playSentSound();
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (viewMode !== 'stealth') return;
      const items = (e.clipboardData || window.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          processAndSendImage(file);
          e.preventDefault();
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [viewMode, role]);

  const handleOpenViewOnce = (msg) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_media_opened', { room: GLOBAL_ROOM, messageId: msg._id });
    }

    setStealthMessages(prev => prev.map(m => m._id === msg._id ? { ...m, mediaOpened: true } : m));

    setActiveViewImage({
      id: msg._id,
      data: msg.text,
      sender: msg.senderRole === 'user' ? 'A' : 'H',
      time: msg.timeFormatted
    });
  };

  const handleCloseViewOnce = () => {
    if (!activeViewImage) return;

    const archiveItem = {
      id: activeViewImage.id,
      data: activeViewImage.data,
      sender: activeViewImage.sender,
      time: activeViewImage.time,
      archivedAt: Date.now()
    };
    setArchivedImages(prev => [archiveItem, ...prev]);
    setStealthMessages(prev => prev.filter(m => m._id !== activeViewImage.id));

    if (socketRef.current) {
      socketRef.current.emit('destroy_view_once', {
        room: GLOBAL_ROOM,
        messageId: activeViewImage.id
      });
    }

    setActiveViewImage(null);
  };

  const handleScrollToMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const el = document.getElementById(`stealth-msg-${targetMsgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => setHighlightedMsgId(null), 1800);
    }
  };

  const downloadFullChatPDF = () => {
    if (role !== 'parent') return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("GMB Review Session - Secret Chat Transcript", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Messages: ${stealthMessages.length}`, 14, 20);

      let y = 36;
      const pageHeight = 297;
      const margin = 14;
      const contentWidth = 182;

      if (stealthMessages.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(11);
        doc.text("No messages recorded in this chat stream.", margin, y);
      } else {
        stealthMessages.forEach((m, idx) => {
          const senderLabel = m.senderRole === 'user' ? 'A (User)' : 'H (Admin)';
          const time = m.timeFormatted || new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isUser = m.senderRole === 'user';

          if (y > pageHeight - 30) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          if (isUser) {
            doc.setTextColor(2, 132, 199);
          } else {
            doc.setTextColor(16, 185, 129);
          }
          doc.text(`[#${idx + 1}] ${senderLabel}  •  ${time}`, margin, y);
          y += 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(30, 41, 59);

          const content = m.isMedia ? "[Encrypted Secret Photo Asset]" : cleanOriginalText(m.text || "");
          const splitLines = doc.splitTextToSize(content || "(empty)", contentWidth);

          const blockHeight = splitLines.length * 4.6;
          if (y + blockHeight > pageHeight - 16) {
            doc.addPage();
            y = 20;
          }

          doc.text(splitLines, margin + 2, y);
          y += blockHeight + 4;

          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(margin, y - 1, 210 - margin, y - 1);
          y += 4;
        });
      }

      doc.save(`GMB_Chat_Transcript_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        escPressCount.current += 1;
        if (escPressCount.current === 1) {
          escTimer.current = setTimeout(() => { escPressCount.current = 0; }, 400);
        } else if (escPressCount.current === 2) {
          clearTimeout(escTimer.current);
          escPressCount.current = 0;
          setViewMode('real_gpt');
          setShowPendingModal(false);
          setShowMiniEmojiBar(false);
          setIncomingAlert(null);
          setIsBotOpen(false);
          setActiveViewImage(null);
          setActiveReactionMsgId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEmojiClick = (emoji) => {
    setInput(prev => prev + emoji);
    setShowMiniEmojiBar(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleStartReply = (msg) => {
    const pureText = msg.isMedia ? "[Photo]" : cleanOriginalText(msg.text);
    setReplyTarget({
      id: msg._id,
      text: pureText,
      senderRole: msg.senderRole === 'user' ? 'A' : 'H'
    });
    if (inputRef.current) inputRef.current.focus();
  };

  const fetchLiveAIResponse = async (userPrompt) => {
    setIsThinking(true);
    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: userPrompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updated = [...conversations, userMsg];
    setConversations(updated);

    if (currentRoom === "New chat" || currentRoom.startsWith("New chat")) {
      const generatedTitle = userPrompt.length > 24 ? userPrompt.substring(0, 22) + '...' : userPrompt;
      const updatedList = roomList.map(r => r === currentRoom ? generatedTitle : r);
      setRoomList(updatedList);
      setCurrentRoom(generatedTitle);
    }

    let reply = "";

    try {
      const payload = {
        messages: [
          { role: "system", content: "You are ChatGPT, an AI assistant created by OpenAI. Provide authentic, highly intelligent, detailed, and directly useful answers with clean markdown formatting, proper paragraphs, and bullet points." },
          { role: "user", content: userPrompt }
        ],
        model: "openai",
        seed: Math.floor(Math.random() * 99999)
      };

      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 15 && !text.includes("402 Payment Required")) {
          reply = text.trim();
        }
      }
    } catch (e) {}

    if (!reply) {
      reply = `Network connection timed out while reaching the inference cluster. Please send your query again.`;
    }

    const aiMsg = {
      id: 'ai_' + Date.now(),
      role: 'assistant',
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversations([...updated, aiMsg]);
    setIsThinking(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (socketRef.current && viewMode === 'stealth') {
      const activeRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      if (val.trim().length > 0) {
        socketRef.current.emit('typing_start', { room: GLOBAL_ROOM, role: activeRole });

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.emit('typing_stop', { room: GLOBAL_ROOM, role: activeRole });
          }
        }, 1800);
      } else {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        socketRef.current.emit('typing_stop', { room: GLOBAL_ROOM, role: activeRole });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { room: GLOBAL_ROOM, role });
    }

    setShowMiniEmojiBar(false);
    const cleanCmd = val.toLowerCase();

    if (cleanCmd === '/shadow') {
      setRole('parent');
      localStorage.setItem('stealth_role', 'parent');
      setViewMode('stealth');
      if (socketRef.current) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'parent' });
        socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: 'parent' });
      }
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setInput('');
      setReplyTarget(null);
      return;
    }

    if (cleanCmd === '/dora') {
      setRole('user');
      localStorage.setItem('stealth_role', 'user');
      setViewMode('stealth');
      if (socketRef.current) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'user' });
        socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: 'user' });
      }
      setInput('');
      setReplyTarget(null);
      return;
    }

    if (cleanCmd === '/gpt' || cleanCmd === '/normal') {
      setViewMode('real_gpt');
      setInput('');
      setReplyTarget(null);
      return;
    }

    if (viewMode === 'stealth') {
      let finalMessageText = val;
      let replyRefId = null;

      if (replyTarget) {
        const cleanSnippet = cleanOriginalText(replyTarget.text);
        const shortReply = cleanSnippet.length > 25 ? cleanSnippet.substring(0, 22) + '...' : cleanSnippet;
        finalMessageText = `[⤴ ${replyTarget.senderRole}: "${shortReply}"] ${val}`;
        replyRefId = replyTarget.id;
      }

      const encrypted = encryptText(finalMessageText);
      if (socketRef.current) {
        socketRef.current.emit('send_stealth_msg', {
          room: GLOBAL_ROOM,
          role,
          encryptedText: encrypted,
          isMedia: false,
          replyRefId
        });
        playSentSound();
      }
      setInput('');
      setReplyTarget(null);
      return;
    }

    playSentSound();
    fetchLiveAIResponse(val);
    setInput('');
    setReplyTarget(null);
  };

  const handleNewChat = () => {
    setConversations([]);
    setCurrentRoom("New chat");
    setViewMode('real_gpt');
    setReplyTarget(null);
    closeSidebarOnMobile();
  };

  const downloadPendingPDF = (e) => {
    e.stopPropagation();
    const doc = new jsPDF();
    const pendingList = stealthMessagesRef.current.filter(m => m.flaggedPending);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Answer Pending Questions Export`, 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Export Timestamp: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Pending Items: ${pendingList.length}`, 14, 34);
    doc.line(14, 38, 196, 38);

    let y = 46;
    if (pendingList.length === 0) {
      doc.text("No pending questions flagged in the system.", 14, y);
    } else {
      pendingList.forEach((m, idx) => {
        const senderLabel = m.senderRole === 'user' ? 'A' : 'H';
        doc.setFont("helvetica", "bold");
        doc.text(`[Pending #${idx + 1}] [${m.timeFormatted}] ${senderLabel}:`, 14, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(m.isMedia ? "[Encrypted Image Asset]" : cleanOriginalText(m.text || ""), 175);
        doc.text(splitText, 18, y);
        y += (splitText.length * 5) + 4;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    doc.save(`pending_answers_${Date.now()}.pdf`);
  };

  const handleBubbleDismiss = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 45,
      spread: 70,
      startVelocity: 25,
      origin: { x, y },
      colors: ['#ffffff', '#e0f2fe', '#93c5fd', '#bfdbfe']
    });

    if (socketRef.current) {
      socketRef.current.emit('bubble_popped', { room: GLOBAL_ROOM });
    }

    setIncomingAlert(null);
  };

  const togglePendingFlag = (e, msg) => {
    e.stopPropagation();
    if (role !== 'parent') return;

    const newStatus = !msg.flaggedPending;
    setStealthMessages(prev => prev.map(m => m._id === msg._id ? { ...m, flaggedPending: newStatus } : m));

    if (socketRef.current) {
      socketRef.current.emit('toggle_pending', { 
        messageId: msg._id, 
        status: newStatus, 
        room: GLOBAL_ROOM 
      });
    }
  };

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
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processAndSendImage(e.target.files[0]);
            e.target.value = '';
          }
        }} 
        className="hidden" 
      />

      {/* LOCAL VIDEO PICKER */}
      <input 
        type="file" 
        accept="video/*" 
        ref={localVideoInputRef} 
        onChange={handleSelectLocalFile}
        className="hidden" 
      />

      {/* PERSISTENT AUDIO PLAYER */}
      <div 
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '320px',
          height: '240px',
          pointerEvents: 'none',
          zIndex: -9999
        }}
      >
        <div id="persistent-sync-iframe"></div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-72 md:w-64 max-w-[85vw]
          transition-transform md:transition-[width] duration-250 ease-in-out
          bg-[#000000] flex flex-col border-r border-[#171717] overflow-hidden select-none shrink-0
          ${sidebarOpen ? 'translate-x-0 md:w-64' : '-translate-x-full md:translate-x-0 md:w-0'}
        `}
      >
        <div className="h-14 md:h-13 flex items-center justify-between px-4 md:px-3.5 pt-2 shrink-0">
          <span className="font-semibold text-lg md:text-base tracking-tight text-white flex items-center gap-1.5">
            ChatGPT
          </span>
          <div className="flex items-center gap-3 text-[#9b9b9b]">
            <Search size={18} className="cursor-pointer hover:text-white" />
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-1 rounded-lg hover:bg-[#1a1a1a] text-[#9b9b9b] hover:text-white cursor-pointer"
            >
              <PanelLeft size={18} />
            </button>
          </div>
        </div>

        <div className="px-3 md:px-2.5 py-2 md:py-1.5 space-y-1 md:space-y-0.5 shrink-0 text-sm md:text-[13px]">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-between text-white hover:bg-[#1f1f1f] active:bg-[#252525] py-2.5 md:py-2 px-3 md:px-2.5 rounded-xl md:rounded-lg transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-3 md:gap-2.5 font-medium">
              <SquarePen size={17} /> New chat
            </span>
            {role === 'parent' && <ShieldCheck size={15} className="text-emerald-400" />}
          </button>

          <div 
            onClick={() => { setViewMode('images_archive'); closeSidebarOnMobile(); }}
            className={`flex items-center justify-between py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors ${viewMode === 'images_archive' ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}
          >
            <span className="flex items-center gap-3 md:gap-2.5">
              <ImageIcon size={17} className={viewMode === 'images_archive' ? 'text-blue-400' : 'text-[#9b9b9b]'} /> Images
            </span>
            <span className="text-xs text-gray-500 font-mono">{archivedImages.length}</span>
          </div>

          <div className="flex items-center gap-3 md:gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors">
            <BookOpen size={17} className="text-[#9b9b9b]" /> Library
          </div>

          <div 
            onClick={() => { setViewMode('scheduled'); closeSidebarOnMobile(); }}
            className={`flex items-center justify-between py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors ${viewMode === 'scheduled' ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}
          >
            <span className="flex items-center gap-3 md:gap-2.5">
              <Clock size={17} className={viewMode === 'scheduled' ? 'text-amber-400' : 'text-[#9b9b9b]'} /> Scheduled
            </span>
            {syncStatus === 'connected' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Joint Synced" />
            ) : (
              syncStatus === 'incoming_request' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors">
            <ToyBrick size={17} className="text-[#9b9b9b]" /> Plugins
          </div>
          <div className="flex items-center gap-3 md:gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors">
            <FolderGit2 size={17} className="text-[#9b9b9b]" /> Projects
          </div>

          {/* CODEX TAB */}
          <div 
            onClick={() => { setViewMode('codex'); closeSidebarOnMobile(); }}
            className={`flex items-center gap-3 md:gap-2.5 py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors ${viewMode === 'codex' ? 'bg-[#212121] text-white font-medium' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}
          >
            <TerminalSquare size={17} className={viewMode === 'codex' ? 'text-emerald-400' : 'text-[#9b9b9b]'} />
            <span>Codex</span>
          </div>

          <div className="flex items-center gap-3 md:gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors">
            <MoreHorizontal size={17} className="text-[#9b9b9b]" /> More
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 border-t border-[#1a1a1a] mt-1 scrollbar-none text-sm md:text-[13px]">
          <div className="text-xs md:text-[11px] text-[#737373] px-3 md:px-2.5 py-1.5 font-semibold">Recents</div>
          {roomList.map((roomName, idx) => (
            <div 
              key={idx}
              onClick={() => {
                setCurrentRoom(roomName);
                setViewMode('real_gpt');
                setReplyTarget(null);
                closeSidebarOnMobile();
              }}
              className={`flex items-center justify-between py-2 md:py-1.5 px-3 md:px-2.5 rounded-xl md:rounded-lg cursor-pointer transition-colors group ${currentRoom === roomName && viewMode === 'real_gpt' ? 'bg-[#212121] text-white font-medium' : 'text-[#b4b4b4] hover:bg-[#171717] hover:text-white'}`}
            >
              <span className="truncate max-w-[200px]">{roomName}</span>
            </div>
          ))}
        </div>

        {role === 'parent' && (
          <div className="p-2 border-t border-[#1e1e1e] flex items-center gap-1.5 shrink-0 bg-[#0a0a0a]">
            <button 
              onClick={() => { setShowPendingModal(true); closeSidebarOnMobile(); }}
              className="flex-1 flex items-center justify-between text-xs text-amber-400 hover:bg-[#1a1a1a] p-2 rounded-lg cursor-pointer transition-all active:scale-95"
            >
              <span className="flex items-center gap-2 font-medium"><AlertCircle size={15} /> Answer Pending</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${pendingMessages.length > 0 ? 'bg-amber-500 text-black animate-pulse' : 'bg-amber-500/20 text-amber-300'}`}>
                {pendingMessages.length}
              </span>
            </button>
            <button 
              onClick={downloadPendingPDF}
              title="Download Answer Pending Report"
              className="p-2 text-gray-400 hover:text-amber-400 hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Download size={15} />
            </button>
          </div>
        )}

        <div className="p-3 md:p-2.5 border-t border-[#171717] flex items-center justify-between text-xs bg-[#000000]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 md:w-7 md:h-7 rounded-full bg-[#1e293b] border border-[#333] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {role === 'parent' ? 'HS' : 'U'}
            </div>
            <div className="truncate">
              <p className="text-white text-xs font-medium truncate">
                {role === 'parent' ? 'hetkumar satap...' : 'User'}
              </p>
              <p className="text-[10px] text-gray-400">Free</p>
            </div>
          </div>
          <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] text-white text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0">
            Upgrade
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative bg-[#000000] overflow-hidden min-w-0">
        <header className="h-14 md:h-12 flex items-center justify-between px-3 md:px-4 shrink-0 z-10 border-b border-[#141414]">
          <div className="flex items-center gap-2 overflow-hidden">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="text-[#9b9b9b] hover:text-white p-1.5 rounded-lg active:bg-[#1f1f1f] cursor-pointer shrink-0"
              title="Open Sidebar"
            >
              <PanelLeft size={20} />
            </button>

            <span className="text-sm md:text-xs font-semibold text-gray-200 truncate max-w-[140px] sm:max-w-[240px]">
              {viewMode === 'codex' ? 'Codex' : currentRoom}
            </span>

            {role === 'parent' && (
              <button
                onClick={downloadFullChatPDF}
                title="Download Full Chat Transcript (PDF)"
                className="hidden sm:flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#282828] border border-[#333] text-gray-300 hover:text-white px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ml-1 cursor-pointer font-sans shadow-sm active:scale-95 shrink-0"
              >
                <FileDown size={13} className="text-emerald-400" />
                <span>Export PDF</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#9b9b9b] shrink-0">
            <span 
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                !isConnected 
                  ? 'bg-zinc-600' 
                  : (hasUnreadSecret ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_6px_#10b981]')
              }`} 
              title={
                !isConnected 
                  ? 'Connecting...' 
                  : (hasUnreadSecret ? 'Unread Secret Message Pending!' : 'Server Connected')
              } 
            />
            {role === 'parent' && <span className="text-[9px] sm:text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">ADMIN</span>}
            
            <button className="hidden sm:flex items-center gap-1.5 text-white hover:text-gray-200 cursor-pointer text-xs font-medium">
              <Sparkles size={14} className="text-blue-400" />
              <span>Upgrade</span>
            </button>
            
            <button className="p-1 text-white hover:text-gray-200 cursor-pointer text-xs">
              <Share size={15} />
            </button>
            <button className="p-1 text-white hover:text-gray-200 cursor-pointer text-xs" onClick={() => window.location.reload()}>
              <RefreshCw size={15} />
            </button>
          </div>
        </header>

        {autoplayBlocked && (
          <div 
            onClick={handleManualUnmuteClick}
            className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-3 py-2 text-xs flex items-center justify-between cursor-pointer animate-pulse z-30"
          >
            <div className="flex items-center gap-2 truncate">
              <VolumeX size={16} className="shrink-0" />
              <span className="truncate">Tap here to unmute synchronized playback</span>
            </div>
            <span className="bg-amber-500 text-black font-bold px-2 py-0.5 rounded text-[10px] shrink-0 ml-2">Unmute</span>
          </div>
        )}

        {/* PERSISTENT FLOATING AUDIO BAR IN CHAT */}
        {syncStatus === 'connected' && activeVideoId && viewMode !== 'scheduled' && viewMode !== 'codex' && (
          <div className="bg-[#141414]/95 border-b border-[#2a2a2a] px-3 sm:px-4 py-2 flex items-center justify-between z-20 text-xs backdrop-blur-md shadow-lg shrink-0">
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Music size={13} className={isPlaying ? 'animate-bounce' : ''} />
              </div>
              <span className="text-gray-300 truncate font-mono text-[11px]">
                🎵 <strong className="text-white">Live:</strong> {activeTrackTitle || "Synced Track"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleTogglePlayPause}
                className="bg-[#222] hover:bg-[#333] text-white p-1.5 px-2 rounded-lg flex items-center gap-1 cursor-pointer text-[11px] font-semibold border border-[#333]"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => setViewMode('scheduled')}
                className="text-amber-400 text-[11px] font-semibold px-1.5 py-1 cursor-pointer underline decoration-dotted"
              >
                Lounge
              </button>
              <button
                onClick={handleDisconnectSync}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 p-1.5 rounded-lg cursor-pointer"
                title="Disconnect Audio completely"
              >
                <Unlink size={12} />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: NORMAL CHATGPT STREAM */}
        {viewMode === 'real_gpt' && (
          <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-4xl w-full mx-auto space-y-4 sm:space-y-6 scrollbar-none">
            {conversations.map((msg) => (
              <div key={msg.id} className="w-full">
                {msg.role === 'user' ? (
                  <div className="flex justify-end my-2 sm:my-3">
                    <div className="bg-[#1c3a6b] text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl max-w-[88%] sm:max-w-[80%] text-sm sm:text-[13.5px] leading-relaxed shadow-lg whitespace-pre-wrap break-words select-text">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="w-full my-3 sm:my-4">
                    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-4 sm:p-6 shadow-2xl relative space-y-3 sm:space-y-4 font-sans select-text">
                      <div className="flex items-center justify-between border-b border-[#282828] pb-2.5 text-[#a3a3a3]">
                        <button className="flex items-center gap-1.5 bg-[#2a2a2a] text-gray-300 text-xs px-2.5 py-1 rounded-md cursor-pointer">
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <button className="hover:text-white cursor-pointer" title="Copy"><Copy size={15} /></button>
                          <button className="hover:text-white cursor-pointer" title="Download"><Download size={15} /></button>
                          <button className="hover:text-white cursor-pointer" title="Full Screen"><Maximize2 size={15} /></button>
                        </div>
                      </div>

                      <div className="text-[#ececf1] text-sm sm:text-[13.5px] leading-[1.7] font-normal tracking-wide whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 text-[#737373] px-2 pt-2 text-xs">
                      <button className="hover:text-white cursor-pointer"><Copy size={15} /></button>
                      <button className="hover:text-white cursor-pointer"><ThumbsUp size={15} /></button>
                      <button className="hover:text-white cursor-pointer"><ThumbsDown size={15} /></button>
                      <button className="hover:text-white cursor-pointer"><Share size={15} /></button>
                      <button className="hover:text-white cursor-pointer"><RotateCw size={15} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic px-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>ChatGPT is writing detailed response...</span>
              </div>
            )}

            <div className="flex justify-center items-center gap-1.5 text-xs text-[#737373] pt-3 pb-2">
              <span>Today 5:27 PM</span>
              <div className="w-5 h-5 rounded-full bg-[#1e1e1e] flex items-center justify-center">
                <ChevronDown size={12} />
              </div>
            </div>

            <div ref={messageEndRef} />
          </section>
        )}

        {/* VIEW 2: STEALTH JSON SCHEMA VIEW (ENLARGED BROAD DESKTOP VIEW) */}
        {viewMode === 'stealth' && (
          <section className="flex-1 overflow-y-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6 max-w-5xl lg:max-w-6xl xl:max-w-7xl w-full mx-auto flex flex-col justify-center my-auto scrollbar-none">
            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl font-mono">
              <div className="bg-[#212121] px-3.5 md:px-6 py-2.5 md:py-3 flex items-center justify-between border-b border-[#2e2e2e] text-[#b4b4b4]">
                <div className="flex items-center gap-2.5">
                  <Code size={16} className="text-[#888]" />
                  <span className="text-xs md:text-sm font-medium text-[#dedede]">JSON Schema</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="hover:text-white cursor-pointer p-1">
                    <Copy size={15} />
                  </button>
                  <button className="flex items-center gap-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-white px-3 py-1.5 rounded-md cursor-pointer text-xs md:text-sm font-medium">
                    <Play size={12} fill="currentColor" />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 sm:p-6 md:p-8 text-[#d4d4d4] space-y-2 md:space-y-2.5 overflow-x-hidden leading-relaxed text-xs sm:text-[13px] md:text-[13.5px]">
                <div><span className="text-[#c586c0]">import</span> <span className="text-[#9cdcfe]">random</span></div>
                <br />
                <div>
                  <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">generate_random_data</span>(<span className="text-[#9cdcfe]">size</span>=<span className="text-[#b5cea8]">10</span>):
                </div>
                <div className="pl-3 sm:pl-4 md:pl-6"><span className="text-[#9cdcfe]">data</span> = []</div>
                <div className="pl-3 sm:pl-4 md:pl-6">
                  <span className="text-[#c586c0]">for</span> <span className="text-[#9cdcfe]">_</span> <span className="text-[#c586c0]">in</span> <span className="text-[#dcdcaa]">range</span>(<span className="text-[#9cdcfe]">size</span>):
                </div>
                <div className="pl-6 sm:pl-8 md:pl-10">
                  <span className="text-[#9cdcfe]">number</span> = <span className="text-[#9cdcfe]">random</span>.<span className="text-[#dcdcaa]">randint</span>(<span className="text-[#b5cea8]">1</span>, <span className="text-[#b5cea8]">100</span>)
                </div>
                <div className="pl-6 sm:pl-8 md:pl-10">
                  <span className="text-[#9cdcfe]">data</span>.<span className="text-[#dcdcaa]">append</span>(<span className="text-[#9cdcfe]">number</span>)
                </div>
                <div className="pl-3 sm:pl-4 md:pl-6">
                  <span className="text-[#c586c0]">return</span> <span className="text-[#9cdcfe]">data</span>
                </div>
                <br />

                {/* EXPANDED DESKTOP STREAM BOX */}
                <div className="border-y border-[#2a2a2a] py-3 my-2.5 bg-[#121212]/80 rounded-xl px-2.5 md:px-4">
                  <div className="text-[#6a9955] mb-2 flex items-center justify-between flex-wrap gap-2 text-xs md:text-[13px]">
                    <span className="flex items-center gap-2">
                      <span>{`# Active Schema Stream (Identity: ${role === 'user' ? 'A' : 'H'})`}</span>
                      {isPeerTyping && (
                        <span className="text-[#38bdf8] font-mono animate-pulse flex items-center gap-1.5 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                          {role === 'user' ? 'H' : 'A'} is typing...
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] md:text-xs text-gray-500 font-sans">
                      {role === 'parent' 
                        ? `Total (${displayedStealthMessages.length}) records [Permanent View]` 
                        : `Showing last (${displayedStealthMessages.length}) records`}
                    </span>
                  </div>

                  <div 
                    ref={streamContainerRef}
                    className="space-y-1.5 min-h-[180px] max-h-64 md:max-h-[50vh] overflow-y-auto pr-1.5 scrollbar-none flex flex-col"
                  >
                    {displayedStealthMessages.length === 0 ? (
                      <div className="text-[#6a9955] pl-2">{`# Waiting for execution runtime data...`}</div>
                    ) : (
                      displayedStealthMessages.map((m, idx) => {
                        const displayName = m.senderRole === 'user' ? 'A' : 'H';
                        const showStatusReceipt = m.senderRole === role;
                        const isSeen = Boolean(m.isSeen);
                        const isReactionOpen = activeReactionMsgId === m._id;
                        const isHighlighted = highlightedMsgId === m._id;

                        const hasReplyTag = m.text && m.text.startsWith('[⤴');
                        let replySnippet = "";
                        let cleanBody = m.text;

                        if (hasReplyTag) {
                          const closingIndex = m.text.indexOf(']');
                          if (closingIndex !== -1) {
                            replySnippet = m.text.substring(1, closingIndex);
                            cleanBody = m.text.substring(closingIndex + 1).trim();
                          }
                        }

                        return (
                          <div 
                            key={idx} 
                            id={`stealth-msg-${m._id}`}
                            className={`group relative flex items-start justify-between px-2 py-1 md:py-1.5 rounded-lg transition-all gap-2 ${
                              isHighlighted ? 'bg-emerald-950/70 border border-emerald-500/50' : 'hover:bg-[#202020]'
                            }`}
                          >
                            <div className="flex-1 break-words overflow-wrap-anywhere text-left flex flex-wrap items-center text-xs md:text-sm">
                              <span className="text-[#9cdcfe] shrink-0 font-bold">{displayName}</span>
                              <span className="mx-1.5 text-[#d4d4d4]">=</span>

                              {hasReplyTag && (
                                <button
                                  type="button"
                                  onClick={() => handleScrollToMessage(m.replyRefId)}
                                  className="inline-flex items-center text-[11px] md:text-xs bg-[#222] hover:bg-[#2d2d2d] text-emerald-400 px-2 py-0.5 rounded border border-[#333] mr-1.5 cursor-pointer font-medium"
                                  title="Jump to quoted message"
                                >
                                  {replySnippet}
                                </button>
                              )}

                              {m.isMedia ? (
                                <button 
                                  type="button"
                                  onClick={() => handleOpenViewOnce(m)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs md:text-[13px] font-mono cursor-pointer transition-all border ${
                                    m.mediaOpened 
                                      ? 'bg-[#18261e] border-emerald-700 text-emerald-300' 
                                      : 'bg-[#252525] hover:bg-[#333] border-[#3d3d3d] text-amber-300'
                                  }`}
                                  title={m.mediaOpened ? "Asset viewed" : "Click to view once"}
                                >
                                  {m.mediaOpened ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} className="text-amber-400 animate-pulse" />}
                                  <span>{m.mediaOpened ? '[Opened: binary_raw]' : '[View Once: payload_locked]'}</span>
                                </button>
                              ) : (
                                <span className="text-[#ce9178] break-all">{`"${cleanBody}"`}</span>
                              )}
                              
                              <button 
                                type="button"
                                onClick={() => handleStartReply(m)}
                                title="Reply to this message"
                                className="inline-flex items-center text-gray-400 hover:text-emerald-400 hover:scale-125 transition-transform px-1.5 ml-1 cursor-pointer font-bold text-sm"
                              >
                                ⤴
                              </button>
                              
                              <div 
                                className="relative inline-flex items-center ml-1 py-0.5"
                                onMouseEnter={() => setActiveReactionMsgId(m._id)}
                                onMouseLeave={() => setActiveReactionMsgId(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveReactionMsgId(activeReactionMsgId === m._id ? null : m._id);
                                }}
                              >
                                <span className="text-[#6a9955] text-[11px] md:text-xs shrink-0 font-mono cursor-pointer hover:text-emerald-400 transition-colors">
                                  {`[${m.timeFormatted}]`}
                                </span>

                                {isReactionOpen && (
                                  <div 
                                    className="absolute left-0 -top-9 z-30 bg-[#1e1e1e] border border-[#3a3a3a] px-2.5 py-1 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {HOVER_REACTIONS.map((emoji, eIdx) => (
                                      <button
                                        key={eIdx}
                                        type="button"
                                        onClick={() => handleSelectReaction(m._id, emoji)}
                                        className="text-base md:text-lg p-0.5 hover:scale-125 transition-transform cursor-pointer"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {m.reaction && (
                                <span className="ml-1.5 inline-flex items-center bg-[#252525] border border-[#383838] px-1.5 py-0.2 rounded-full text-xs shadow">
                                  {m.reaction}
                                </span>
                              )}
                              
                              {showStatusReceipt && (
                                <span 
                                  className={`text-[13px] md:text-sm font-mono tracking-tighter shrink-0 ml-1.5 font-bold transition-colors duration-100 ${
                                    isSeen ? 'text-[#38bdf8]' : 'text-gray-500'
                                  }`}
                                  title={isSeen ? "Seen by counterpart" : "Sent"}
                                >
                                  {isSeen ? '..' : '.'}
                                </span>
                              )}
                            </div>

                            {role === 'parent' && (
                              <button 
                                type="button"
                                onClick={(e) => togglePendingFlag(e, m)}
                                title={m.flaggedPending ? "Mark as Resolved" : "Add to Answer Pending"}
                                className={`px-2.5 py-0.5 text-xs font-bold rounded cursor-pointer transition-all shrink-0 ${
                                  m.flaggedPending 
                                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105' 
                                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#383838]'
                                }`}
                              >
                                !
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messageEndRef} />
                  </div>
                </div>

                <div><span className="text-[#9cdcfe]">numbers</span> = <span className="text-[#dcdcaa]">generate_random_data</span>(<span className="text-[#b5cea8]">20</span>)</div>
                <div><span className="text-[#dcdcaa]">print</span>(<span className="text-[#ce9178]">"Generated numbers:"</span>, <span className="text-[#9cdcfe]">numbers</span>)</div>
                <br />
                <div><span className="text-[#9cdcfe]">total</span> = <span className="text-[#dcdcaa]">sum</span>(<span className="text-[#9cdcfe]">numbers</span>)</div>
                <div><span className="text-[#9cdcfe]">average</span> = <span className="text-[#9cdcfe]">total</span> / <span className="text-[#dcdcaa]">len</span>(<span className="text-[#9cdcfe]">numbers</span>)</div>
                <div><span className="text-[#9cdcfe]">maximum</span> = <span className="text-[#dcdcaa]">max</span>(<span className="text-[#9cdcfe]">numbers</span>)</div>
                <div><span className="text-[#9cdcfe]">minimum</span> = <span className="text-[#dcdcaa]">min</span>(<span className="text-[#9cdcfe]">numbers</span>)</div>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 3: ARCHIVED IMAGES VAULT */}
        {viewMode === 'images_archive' && (
          <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-4xl w-full mx-auto space-y-3 scrollbar-none font-sans">
            <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="text-blue-400" size={18} />
                <h2 className="text-sm font-semibold text-white">Archived Media Vault</h2>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">{archivedImages.length} items</span>
            </div>

            {archivedImages.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs">
                No images archived yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {archivedImages.map((item, idx) => (
                  <div key={idx} className="bg-[#171717] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-lg group relative">
                    <img 
                      src={item.data} 
                      alt="Archived" 
                      className="w-full h-32 sm:h-36 object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(item.data, '_blank')}
                    />
                    <div className="p-2 bg-[#121212] flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span className="font-bold text-blue-400">{item.sender}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* VIEW 4: SCHEDULED / SYNCHRONIZED TWO-WAY MUSIC LOUNGE */}
        {viewMode === 'scheduled' && (
          <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-4xl w-full mx-auto space-y-4 scrollbar-none font-sans">
            <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Music size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Synced Music Lounge</h2>
                  <p className="text-[11px] text-gray-400">Continuous background audio synchronization</p>
                </div>
              </div>

              {syncStatus === 'connected' && (
                <button
                  onClick={handleDisconnectSync}
                  className="flex items-center gap-1 bg-rose-950 border border-rose-800 text-rose-300 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Unlink size={12} /> Disconnect
                </button>
              )}
            </div>

            {syncStatus !== 'connected' ? (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-amber-400 mx-auto">
                  <Radio size={26} className={syncStatus === 'requested' ? 'animate-pulse text-blue-400' : ''} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">Two-Way Handshake</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Both sides must authorize the synchronized audio stream.
                  </p>
                </div>

                {syncStatus === 'idle' && (
                  <button
                    onClick={handleSendSyncInvite}
                    className="w-full sm:w-auto bg-[#1c3a6b] text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Link2 size={15} />
                    <span>Send Connection Request ({role === 'parent' ? 'Admin' : 'User'})</span>
                  </button>
                )}

                {syncStatus === 'requested' && (
                  <div className="inline-flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Invitation sent! Waiting for counterpart...</span>
                  </div>
                )}

                {syncStatus === 'incoming_request' && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl max-w-sm mx-auto space-y-3">
                    <p className="text-xs text-emerald-300 font-medium">
                      Incoming lounge invitation from <strong className="text-white uppercase">{incomingInviteRole}</strong>!
                    </p>
                    <button
                      onClick={handleAcceptSyncInvite}
                      className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check size={16} /> Accept & Join Synced Lounge
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>LINKED (Persists across refresh)</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">Exact Sync</span>
                </div>

                <div className="relative">
                  <form onSubmit={(e) => { e.preventDefault(); handleTriggerSong(youtubeUrlInput); }} className="flex gap-2">
                    <input 
                      type="text" 
                      value={youtubeUrlInput}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onFocus={() => { if (ytSuggestions.length > 0) setShowSuggestions(true); }}
                      placeholder="Paste YouTube link or type song name..."
                      className="flex-1 bg-[#171717] border border-[#2c2c2c] rounded-xl px-3.5 py-2.5 text-sm sm:text-xs text-white placeholder-gray-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingTrack}
                      className="bg-[#1c3a6b] text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {isLoadingTrack ? <Loader2 size={14} className="animate-spin" /> : null}
                      <span>{isLoadingTrack ? 'Syncing...' : 'Play'}</span>
                    </button>
                  </form>

                  {showSuggestions && ytSuggestions.length > 0 && (
                    <div className="absolute left-0 right-16 top-full mt-1.5 bg-[#171717] border border-[#333] rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto py-1">
                      {ytSuggestions.map((sugg, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => handleSelectSuggestion(sugg)}
                          className="px-4 py-2.5 text-xs text-gray-200 hover:bg-[#252525] cursor-pointer flex items-center gap-2 border-b border-[#222]/50 last:border-none"
                        >
                          <Search size={13} className="text-gray-500" />
                          <span>{sugg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full bg-[#121212] border border-[#242424] rounded-2xl p-5 sm:p-6 text-center space-y-2.5 shadow-xl">
                  <div className="w-14 h-14 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-emerald-400 mx-auto">
                    <Volume2 size={24} className={isPlaying ? 'animate-bounce' : ''} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Live Synchronized</span>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-1 break-words">
                      {activeTrackTitle || "No track playing. Search or paste link above."}
                    </h3>
                  </div>
                </div>

                {activeVideoId && (
                  <div className="bg-[#171717] border border-[#292929] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between">
                    <button
                      onClick={handleTogglePlayPause}
                      className="bg-[#242424] text-white p-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-2 text-xs font-semibold"
                    >
                      {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                      <span>{isPlaying ? 'Pause for Both' : 'Play for Both'}</span>
                    </button>

                    <button
                      onClick={handleDisconnectSync}
                      className="text-xs text-rose-400 px-3 py-2 rounded-lg border border-rose-900/50 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* VIEW 5: CODEX THEATER LOUNGE (STREAM, YOUTUBE, EMBED API, LOCAL FILE) */}
        {viewMode === 'codex' && (
          <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-5xl w-full mx-auto space-y-3 sm:space-y-4 scrollbar-none font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222] pb-2.5 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <TerminalSquare size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Codex</h2>
                  <p className="text-[11px] text-gray-400">Watch Together (Dual Cloud & Local)</p>
                </div>
              </div>

              {/* ADMIN-ONLY: 4 ENGINE SELECTOR TABS */}
              {role === 'parent' && (
                <div className="flex overflow-x-auto scrollbar-none bg-[#181818] p-1 rounded-xl border border-[#2c2c2c] gap-1 text-xs shrink-0 max-w-full">
                  <button
                    type="button"
                    onClick={() => { setCodexEngine('gofile'); setMovieError(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0 ${
                      codexEngine === 'gofile' ? 'bg-[#252525] text-emerald-400 shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Tv size={13} />
                    <span>Stream</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCodexEngine('youtube'); setMovieError(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0 ${
                      codexEngine === 'youtube' ? 'bg-[#252525] text-blue-400 shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Video size={13} />
                    <span>YouTube</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCodexEngine('embed'); setMovieError(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0 ${
                      codexEngine === 'embed' ? 'bg-[#252525] text-purple-400 shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe size={13} />
                    <span>Embed API</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCodexEngine('local'); setMovieError(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0 ${
                      codexEngine === 'local' ? 'bg-[#252525] text-amber-400 shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <HardDrive size={13} />
                    <span>Local File</span>
                  </button>
                </div>
              )}
            </div>

            {/* ADMIN BROADCAST INPUTS */}
            {role === 'parent' && (
              <div className="space-y-2">
                {codexEngine !== 'local' ? (
                  <form onSubmit={handleLoadMovie} className="flex gap-2">
                    <input 
                      type="text"
                      value={movieInputUrl}
                      onChange={(e) => setMovieInputUrl(e.target.value)}
                      placeholder={
                        codexEngine === 'gofile'
                          ? "Direct stream link (GoFile / Pixeldrain MP4)..."
                          : codexEngine === 'youtube'
                          ? "YouTube watch link..."
                          : "Enter IMDb ID (e.g. tt0499549)..."
                      }
                      className="flex-1 bg-[#171717] border border-[#2c2c2c] rounded-xl px-3.5 py-2.5 text-sm sm:text-xs text-white placeholder-gray-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 shadow active:scale-95"
                    >
                      Broadcast
                    </button>
                  </form>
                ) : (
                  <div className="bg-[#141414] border border-[#2c2c2c] p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-xs font-bold text-amber-400 block">Local File Zero-Data Mode Active</span>
                      <span className="text-[11px] text-gray-400">Play/pause will be synced locally with zero internet consumption!</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => localVideoInputRef.current && localVideoInputRef.current.click()}
                        className="bg-[#242424] text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-[#333]"
                      >
                        {localFileName ? `Change: ${localFileName.substring(0, 12)}...` : "📁 Pick Movie"}
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadMovie}
                        className="bg-amber-600 text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Broadcast
                      </button>
                    </div>
                  </div>
                )}

                {/* EMBED API SERVER SELECTOR */}
                {codexEngine === 'embed' && (
                  <div className="flex items-center justify-between bg-[#141414] border border-[#252525] px-3 py-2 rounded-xl text-xs gap-2 overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-gray-400 text-[11px] font-semibold">Mirror:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleSwitchEmbedServer('vidlink')}
                          className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${embedServer === 'vidlink' ? 'bg-purple-600 text-white' : 'bg-[#222] text-gray-400'}`}
                        >
                          Server 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchEmbedServer('autoembed')}
                          className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${embedServer === 'autoembed' ? 'bg-purple-600 text-white' : 'bg-[#222] text-gray-400'}`}
                        >
                          Server 2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchEmbedServer('vidsrc_xyz')}
                          className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${embedServer === 'vidsrc_xyz' ? 'bg-purple-600 text-white' : 'bg-[#222] text-gray-400'}`}
                        >
                          Server 3
                        </button>
                      </div>
                    </div>

                    {activeEmbedUrl && (
                      <a 
                        href={activeEmbedUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-purple-400 text-[11px] flex items-center gap-1 font-medium underline shrink-0"
                      >
                        <ExternalLink size={12} />
                        <span>Direct</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {movieError && (
              <div className="bg-amber-950/40 border border-amber-600/40 text-amber-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                <span>{movieError}</span>
              </div>
            )}

            {/* THEATER CINEMA SCREEN */}
            <div className="w-full bg-[#0a0a0a] border border-[#242424] rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center min-h-[220px] sm:min-h-[380px]">
              {codexEngine === 'gofile' ? (
                activeMovieSrc ? (
                  <video 
                    ref={html5VideoRef}
                    src={activeMovieSrc}
                    controls
                    playsInline
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onPlay={handleHtml5Play}
                    onPause={handleHtml5Pause}
                    onSeeked={handleHtml5Seeked}
                    onError={() => {
                      setMovieError("Cannot decode video. Web browsers (Chrome/Safari) do NOT support .MKV files. Please use standard .MP4 (H.264/AAC) format.");
                    }}
                    className="w-full max-h-[55vh] sm:max-h-[72vh] object-contain rounded-2xl bg-black"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-gray-500">
                    <Tv size={36} className="mx-auto opacity-30 text-emerald-400" />
                    <p className="text-xs">
                      {role === 'parent' ? "Paste direct MP4 link above and click Broadcast" : "Waiting for Admin to broadcast stream..."}
                    </p>
                  </div>
                )
              ) : codexEngine === 'youtube' ? (
                activeMovieYTId ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${activeMovieYTId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                    title="Codex YouTube"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-[45vh] sm:h-[65vh] rounded-2xl border-none"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-gray-500">
                    <Film size={36} className="mx-auto opacity-30 text-blue-400" />
                    <p className="text-xs">
                      {role === 'parent' ? "Paste YouTube watch link above to stream." : "Waiting for Admin to broadcast video..."}
                    </p>
                  </div>
                )
              ) : codexEngine === 'embed' ? (
                activeEmbedUrl ? (
                  <iframe 
                    key={activeEmbedUrl}
                    src={activeEmbedUrl}
                    title="Codex Embed API"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="origin"
                    className="w-full h-[50vh] sm:h-[68vh] rounded-2xl border-none bg-black"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-gray-500">
                    <Globe size={36} className="mx-auto opacity-30 text-purple-400" />
                    <p className="text-xs">
                      {role === 'parent' ? "Enter IMDb ID (e.g. tt0499549) to stream movies." : "Waiting for Admin to load Embed API..."}
                    </p>
                  </div>
                )
              ) : (
                localVideoSrc ? (
                  <div className="w-full relative flex flex-col items-center">
                    <video 
                      ref={html5VideoRef}
                      src={localVideoSrc}
                      controls
                      playsInline
                      onPlay={handleHtml5Play}
                      onPause={handleHtml5Pause}
                      onSeeked={handleHtml5Seeked}
                      className="w-full max-h-[50vh] sm:max-h-[70vh] object-contain rounded-2xl bg-black"
                    />
                    <div className="w-full bg-[#111] p-2 flex items-center justify-between text-[11px] text-gray-400 px-3 font-mono">
                      <span className="truncate max-w-[200px]">📁 {localFileName}</span>
                      <button 
                        onClick={() => localVideoInputRef.current && localVideoInputRef.current.click()}
                        className="text-amber-400 underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-2.5 text-gray-400">
                    <HardDrive size={36} className="mx-auto opacity-40 text-amber-400" />
                    <p className="text-xs font-semibold text-white">Local File Sync (Offline)</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      Select downloaded movie from your device. Both sides will be millisecond frame synced!
                    </p>
                    <button
                      type="button"
                      onClick={() => localVideoInputRef.current && localVideoInputRef.current.click()}
                      className="bg-[#242424] text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border border-[#333]"
                    >
                      Select Movie File
                    </button>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* Bottom Input Capsule */}
        <div className="px-3 sm:px-6 lg:px-8 pb-3 sm:pb-4 pt-1 max-w-4xl w-full mx-auto shrink-0 relative" onMouseLeave={() => setShowMiniEmojiBar(false)}>
          {replyTarget && (
            <div className="mb-2 bg-[#1a1a1a] border border-[#333] px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-emerald-400 font-bold">⤴ {replyTarget.senderRole}:</span>
                <span className="text-gray-300 truncate italic">"{replyTarget.text}"</span>
              </div>
              <button 
                type="button" 
                onClick={() => setReplyTarget(null)}
                className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {viewMode === 'stealth' && isPeerTyping && (
            <div className="mb-1.5 px-3 flex items-center gap-2 text-[11px] font-mono text-[#38bdf8] select-none animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
              <span>{role === 'user' ? 'H' : 'A'} is currently typing...</span>
            </div>
          )}

          {showMiniEmojiBar && (
            <div className="absolute right-12 bottom-16 z-30 bg-[#1e1e1e]/95 backdrop-blur-md border border-[#333] px-2 py-1 rounded-full shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
              {QUICK_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-base sm:text-lg p-1 hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full relative">
            <div className="w-full bg-[#212121] rounded-full border border-[#2e2e2e] focus-within:border-[#444] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-2xl min-h-[48px]">
              <button 
                type="button" 
                onClick={() => {
                  if (viewMode === 'stealth' && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className="text-[#9b9b9b] hover:text-white p-1 rounded-full cursor-pointer shrink-0"
                title={viewMode === 'stealth' ? "Send Photo" : "Options"}
              >
                <Plus size={20} />
              </button>

              <input 
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={
                  viewMode === 'stealth' 
                    ? (replyTarget ? `Reply to ${replyTarget.senderRole}...` : "Schema entry... (/gpt to exit)") 
                    : "Ask anything"
                }
                className="flex-1 bg-transparent text-base sm:text-[13.5px] text-white placeholder-[#8e8e8e] outline-none min-w-0"
              />

              <button 
                type="button"
                onClick={() => setShowMiniEmojiBar(!showMiniEmojiBar)}
                className={`p-1.5 rounded-full cursor-pointer shrink-0 ${showMiniEmojiBar ? 'text-amber-400' : 'text-[#8e8e8e] hover:text-white'}`}
                title="Reactions"
              >
                <Smile size={19} />
              </button>

              <button type="button" className="hidden sm:flex items-center gap-1 text-xs text-[#9b9b9b] hover:text-white px-2 py-1 rounded-full hover:bg-[#2c2c2c] cursor-pointer shrink-0">
                <Sparkles size={13} className="text-blue-400" />
                <span>Think</span>
              </button>

              <button type="button" className="text-[#9b9b9b] hover:text-white p-1 cursor-pointer shrink-0">
                <Mic size={19} />
              </button>

              <button 
                type="submit" 
                className="bg-[#1c3a6b] hover:bg-[#254d8f] text-white w-8 h-8 rounded-full cursor-pointer flex items-center justify-center shadow shrink-0 active:scale-95 transition-transform"
              >
                {input.trim() ? <ArrowUp size={16} /> : <AudioLines size={16} />}
              </button>
            </div>
          </form>
        </div>

        {/* View Once Fullscreen Modal */}
        {activeViewImage && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl max-w-xl w-full p-4 flex flex-col items-center space-y-4 shadow-2xl">
              <div className="w-full flex items-center justify-between text-xs text-gray-400 border-b border-[#222] pb-2 font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Eye size={13} /> View Once Photo ({activeViewImage.sender})
                </span>
                <span>{activeViewImage.time}</span>
              </div>
              
              <div className="max-h-[65vh] overflow-hidden rounded-xl">
                <img 
                  src={activeViewImage.data} 
                  alt="Secret View Once" 
                  className="max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              <button 
                type="button" 
                onClick={handleCloseViewOnce}
                className="w-full bg-[#1c3a6b] hover:bg-[#254d8f] text-white text-xs py-3 rounded-xl font-medium cursor-pointer"
              >
                Done (Save to Images)
              </button>
            </div>
          </div>
        )}

        {/* Answer Pending Modal */}
        {showPendingModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#171717] border border-[#2e2e2e] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertCircle size={18} />
                  <span>Answer Pending ({pendingMessages.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={downloadPendingPDF}
                    title="Export to PDF"
                    className="text-gray-400 hover:text-amber-400 p-1 cursor-pointer"
                  >
                    <Download size={16} />
                  </button>
                  <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {pendingMessages.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-8">
                    No pending questions bookmarked.
                  </div>
                ) : (
                  pendingMessages.map((m, idx) => (
                    <div key={idx} className="bg-[#212121] border border-[#2d2d2d] p-3 rounded-xl flex items-start justify-between gap-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                          <span className="text-blue-400">{m.senderRole === 'user' ? 'A' : 'H'}</span>
                          <span>•</span>
                          <span>{m.timeFormatted}</span>
                        </div>
                        <p className="text-gray-200 font-mono select-text line-clamp-3 break-words">
                          {m.isMedia ? "[Encrypted Photo]" : cleanOriginalText(m.text)}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => togglePendingFlag(e, m)}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Check size={13} /> Done
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Glass Bubble Alert */}
        {incomingAlert && (
          <div 
            onClick={handleBubbleDismiss}
            className={`absolute bottom-20 right-6 ${bubbleDimensions} rounded-full cursor-pointer z-50 flex items-center justify-center p-3 text-center transition-all duration-300 transform active:scale-95 animate-bounce shadow-2xl backdrop-blur-md overflow-hidden`}
            style={{
              background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0.25) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.2), inset 0 2px 10px 0 rgba(255, 255, 255, 0.7), inset 0 -4px 10px 0 rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="absolute top-3 left-4 w-5 h-2.5 bg-white/80 rounded-full blur-[0.5px] transform -rotate-45 pointer-events-none" />
            <p className={`${bubbleFontSize} font-medium text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] px-1 overflow-y-auto max-h-[85%] select-none scrollbar-none break-words`}>
              {incomingAlert.text}
            </p>
          </div>
        )}

        {/* ADMIN BOT DRAWER */}
        {role === 'parent' && (
          <div className="absolute bottom-16 right-4 sm:bottom-6 sm:right-6 z-40">
            <button 
              onClick={() => setIsBotOpen(!isBotOpen)}
              className="bg-[#212121] hover:bg-[#2c2c2c] border border-[#333] p-3.5 rounded-full shadow-2xl text-emerald-400 cursor-pointer active:scale-90 transition-transform"
            >
              <Bot size={20} />
            </button>

            {isBotOpen && (
              <div className="absolute bottom-14 right-0 w-80 max-w-[90vw] bg-[#121212] border border-[#282828] rounded-2xl p-4 shadow-2xl space-y-3 font-sans animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center text-xs font-semibold text-white pb-1 border-b border-[#222]">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBotTab('instant')}
                      className={`px-2 py-0.5 rounded ${botTab === 'instant' ? 'bg-[#252525] text-emerald-400' : 'text-gray-400'}`}
                    >
                      Instant Alert
                    </button>
                    <button
                      onClick={() => setBotTab('schedule')}
                      className={`px-2 py-0.5 rounded ${botTab === 'schedule' ? 'bg-[#252525] text-amber-400' : 'text-gray-400'}`}
                    >
                      Schedule
                    </button>
                  </div>
                  <button onClick={() => setIsBotOpen(false)} className="text-gray-400 hover:text-white p-1"><X size={15} /></button>
                </div>

                {botTab === 'instant' ? (
                  <div className="space-y-2.5">
                    <textarea 
                      rows={3}
                      value={customMsg}
                      onChange={(e) => setCustomMsg(e.target.value)}
                      placeholder="Type instant bubble message..."
                      className="w-full bg-[#1e1e1e] text-xs p-2.5 rounded-lg outline-none border border-[#333] text-white resize-none"
                    />
                    <button 
                      onClick={() => {
                        if (customMsg && socketRef.current) {
                          socketRef.current.emit('send_assistant_alert', { room: GLOBAL_ROOM, text: customMsg });
                          setCustomMsg('');
                          setIsBotOpen(false);
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-lg font-medium cursor-pointer transition-colors"
                    >
                      Broadcast Now
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleScheduleAlertSubmit} className="space-y-2.5 text-xs text-left">
                    <textarea 
                      rows={2}
                      required
                      value={schedMsg}
                      onChange={(e) => setSchedMsg(e.target.value)}
                      placeholder="Message for bubble alarm..."
                      className="w-full bg-[#1e1e1e] text-xs p-2.5 rounded-lg outline-none border border-[#333] text-white resize-none"
                    />

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Time Slot 1 (Required)</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={schedTime1}
                        onChange={(e) => setSchedTime1(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#333] text-white p-2 rounded text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Time Slot 2 (Optional Second Alarm)</label>
                      <input 
                        type="datetime-local" 
                        value={schedTime2}
                        onChange={(e) => setSchedTime2(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#333] text-white p-2 rounded text-xs outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs py-2.5 rounded-lg cursor-pointer"
                    >
                      Schedule Alert
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
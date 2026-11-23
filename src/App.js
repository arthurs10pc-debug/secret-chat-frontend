import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import ErrorBoundary from './ErrorBoundary';
import { 
  SquarePen, Image as ImageIcon, BookOpen, Clock, ToyBrick, FolderGit2, MoreHorizontal,
  Search, PanelLeft, ArrowUp, Plus, RefreshCw, Sparkles, Share,
  Bot, X, Download, AlertCircle, ShieldCheck, Smile,
  Copy, ThumbsUp, ThumbsDown, RotateCw, Check, Edit3, Maximize2, Mic, AudioLines, ChevronDown, ChevronUp,
  Code, Play, Pause, Eye, EyeOff, FileDown, Radio, Link2, Unlink, Music, Volume2, Loader2, VolumeX,
  Film, Tv, Video, TerminalSquare, AlertTriangle, HardDrive, Globe, ExternalLink, Gamepad2, Trophy, RotateCcw, Dices, Timer, Dice5, Send, MessageCircle, Phone, Video as VideoIcon, CheckCheck, MicOff, Disc, Lock, Trash2, Heart, Coins, Award, Scale, Gift, SlidersHorizontal, Bell, BellRing, Filter, CheckCircle2, XCircle, ArrowLeft, MoreVertical, Paperclip, Camera, Briefcase, Calendar, CheckCircle, Users, UserCheck, Mail, Pin, Star, CornerUpLeft,
  Menu, Sliders, Laptop, LayoutGrid
} from 'lucide-react';

import {
  SOCKET_URL,
  BACKEND_URL,
  SECRET_KEY,
  GLOBAL_ROOM,
  getLocalDateString,
  PUBLIC_VAPID_KEY,
  QUICK_EMOJIS,
  HOVER_REACTIONS,
  ROMANTIC_REGEX,
  ARCADE_GAMES,
  DEFAULT_DAILY_SLOTS,
  sortSlotsByTime,
  normalizeSlotTimeRange,
  DEFAULT_RECENT_CHATS,
  DEFAULT_LOVE_LEDGER,
  ROMANTIC_WISH_STORE,
  LOVE_EARNING_RULES,
  LOVE_DEDUCTION_RULES,
  cleanOriginalText,
  extractYouTubeId
} from './constants';

import DarshAssistantBot from './components/DarshAssistantBot';
import StealthAlertBubble from './components/StealthAlertBubble';
import WhatsAppMediaTray from './components/WhatsAppMediaTray';
import CircularVideoNoteModal from './components/CircularVideoNoteModal';
import AudioMessageBubble from './components/AudioMessageBubble';
import CircularVideoNoteBubble from './components/CircularVideoNoteBubble';

// Code-split heavy modals with React.lazy for instant initial page loading
const PassbookModal = lazy(() => import('./components/PassbookModal'));
const WishApprovalModal = lazy(() => import('./components/WishApprovalModal'));
const ClearConfirmModal = lazy(() => import('./components/ClearConfirmModal'));
const AnswerPendingModal = lazy(() => import('./components/AnswerPendingModal'));
const RoutineSlotModal = lazy(() => import('./components/RoutineSlotModal'));
const SlotReportModal = lazy(() => import('./components/SlotReportModal'));
const ImagePreviewModal = lazy(() => import('./components/ImagePreviewModal'));
const CoupleMiniGameModal = lazy(() => import('./components/CoupleMiniGameModal'));
const LudoGameModal = lazy(() => import('./components/LudoGameModal'));
const GamesHubModal = lazy(() => import('./components/GamesHubModal'));

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
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const ChatGPTLogo = ({ className = "w-4 h-4", fill = "currentColor" }) => (
  <svg viewBox="0 0 24 24" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
  </svg>
);

// Auto-linkify helper for interactive, smooth link rendering (Instagram/Google style)
const renderTextWithLinks = (text) => {
  if (!text || typeof text !== 'string') return text;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  if (parts.length <= 1) return text;

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-400 hover:text-blue-300 underline font-semibold transition-colors duration-150 break-all inline-block hover:opacity-90"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Isolated self-updating countdown to prevent re-rendering the whole 11,000-line App component every second
const AutoDownloadCountdown = React.memo(({ prefix = "", suffix = "" }) => {
  const [countdown, setCountdown] = useState("00:00:00");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextTarget = new Date();
      nextTarget.setHours(19, 20, 0, 0);
      if (now.getTime() >= nextTarget.getTime()) {
        nextTarget.setDate(nextTarget.getDate() + 1);
      }
      const diff = nextTarget.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{prefix}{countdown}{suffix}</>;
});

const GOOGLE_CLIENT_ID = "644760404837-q0g258ajc1r1vjo8jqtru2c1cc11q1n7.apps.googleusercontent.com";

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const formatLoveBalance = (bal) => {
  const n = Number(bal || 0);
  if (isNaN(n)) return '₹ 0.00';
  if (n < 0) return `-₹ ${Math.abs(n).toFixed(2)}`;
  return `₹ ${n.toFixed(2)}`;
};

export default function App() {
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          const isAdmin = parsed.email.toLowerCase().trim() === 'arthurs10pc@gmail.com';
          return {
            ...parsed,
            role: isAdmin ? 'parent' : 'user',
            name: isAdmin ? 'Darsh' : 'Dora',
            isAdmin
          };
        }
      }
    } catch (e) {}
    return null;
  });

  const [role, setRole] = useState(() => {
    try {
      const savedProfile = localStorage.getItem('stealth_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.email?.toLowerCase().trim() === 'arthurs10pc@gmail.com') {
          return 'parent';
        } else if (parsed?.email) {
          return 'user';
        }
      }
    } catch (e) {}
    return localStorage.getItem('stealth_role') || 'user';
  });
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
  const [usersDirectory, setUsersDirectory] = useState(() => {
    const defaultList = [
      {
        email: 'arthurs10pc@gmail.com',
        name: 'Darsh',
        originalName: 'Darsh (Admin)',
        role: 'parent',
        isAdmin: true,
        isDora: false,
        picture: 'https://lh3.googleusercontent.com/a/default-user',
        isOnline: true,
        connectedSessions: 1,
        lastLogin: new Date().toISOString()
      }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('stealth_known_users') || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        const map = new Map();
        defaultList.forEach(u => map.set(u.email.toLowerCase(), u));
        saved.forEach(u => {
          if (u && u.email && u.email.toLowerCase() !== 'dora@gmail.com') {
            map.set(u.email.toLowerCase(), { ...map.get(u.email.toLowerCase()), ...u });
          }
        });
        const merged = Array.from(map.values()).filter(u => u && u.email && u.email.toLowerCase() !== 'dora@gmail.com');
        return {
          totalCount: merged.length,
          onlineCount: 1,
          users: merged
        };
      }
    } catch (e) {}
    return {
      totalCount: defaultList.length,
      onlineCount: 1,
      users: defaultList
    };
  });

  const displayUsers = useMemo(() => {
    const list = (usersDirectory.users || []).filter(u => u && u.email && u.email.toLowerCase() !== 'dora@gmail.com');
    if (googleUser && googleUser.email && googleUser.email.toLowerCase() !== 'dora@gmail.com') {
      const exists = list.some(u => u && u.email && u.email.toLowerCase() === googleUser.email.toLowerCase());
      if (!exists) {
        list.unshift({
          email: googleUser.email,
          name: googleUser.name || (googleUser.isAdmin ? 'Darsh' : 'User'),
          firstName: googleUser.firstName || '',
          fullName: googleUser.fullName || '',
          originalName: googleUser.originalName || googleUser.name || '',
          role: googleUser.role,
          isAdmin: googleUser.isAdmin,
          isDora: Boolean(googleUser.isDora),
          picture: googleUser.picture || '',
          isOnline: true,
          connectedSessions: 1,
          lastLogin: new Date().toISOString()
        });
      }
    }
    return list;
  }, [usersDirectory, googleUser]);

  const activeDoraUser = useMemo(() => {
    const list = (displayUsers || []).filter(u => u && u.email && u.email.toLowerCase() !== 'dora@gmail.com');
    const designated = list.find(u => u && !u.isAdmin && u.isDora);
    if (designated) return designated;
    // Fallback: any logged in non-admin user
    const otherUser = list.find(u => u && !u.isAdmin && u.email && u.email.toLowerCase() !== 'arthurs10pc@gmail.com');
    if (otherUser) return otherUser;
    return null;
  }, [displayUsers]);

  const activeDoraName = useMemo(() => {
    if (!activeDoraUser) return 'Dora';
    let candidate = activeDoraUser.firstName || '';
    if (!candidate || candidate.toLowerCase() === 'user' || candidate.toLowerCase() === 'admin') {
      candidate = activeDoraUser.name ? activeDoraUser.name.split(' ')[0] : '';
    }
    if (!candidate || candidate.toLowerCase() === 'user' || candidate.toLowerCase() === 'admin') {
      candidate = activeDoraUser.fullName ? activeDoraUser.fullName.split(' ')[0] : '';
    }
    if (!candidate || candidate.toLowerCase() === 'user' || candidate.toLowerCase() === 'admin') {
      candidate = activeDoraUser.originalName ? activeDoraUser.originalName.split(' ')[0] : '';
    }
    if (!candidate || candidate.toLowerCase() === 'user' || candidate.toLowerCase() === 'admin') {
      if (activeDoraUser.email) {
        const rawPrefix = activeDoraUser.email.split('@')[0].split('.')[0].replace(/[0-9_]/g, '');
        if (rawPrefix && rawPrefix.length > 1) {
          candidate = rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1).toLowerCase();
        }
      }
    }
    return (candidate && candidate.toLowerCase() !== 'user' && candidate.toLowerCase() !== 'admin') ? candidate : 'Dora';
  }, [activeDoraUser]);

  const isCurrentUserDora = useMemo(() => {
    if (!googleUser || !googleUser.email) return false;
    const clean = googleUser.email.toLowerCase().trim();
    if (clean === 'arthurs10pc@gmail.com') return false;
    const fromUser = Boolean(googleUser.isDora);
    const fromDir = (usersDirectory?.users || []).some(u => u && u.email && u.email.toLowerCase() === clean && u.isDora);
    return fromUser || fromDir;
  }, [googleUser, usersDirectory]);

  const partnerName = role === 'parent' ? activeDoraName : 'Darsh';

  useEffect(() => {
    // Purge demo id 'dora@gmail.com' from localStorage
    try {
      const known = JSON.parse(localStorage.getItem('stealth_known_users') || '[]');
      if (Array.isArray(known)) {
        const filtered = known.filter(u => u && u.email && u.email.toLowerCase() !== 'dora@gmail.com');
        localStorage.setItem('stealth_known_users', JSON.stringify(filtered));
      }
      if ((localStorage.getItem('stealth_user_email') || '').toLowerCase() === 'dora@gmail.com') {
        localStorage.removeItem('stealth_user_email');
      }
    } catch(e) {}

    fetch(`${BACKEND_URL}/api/auth/users-directory`)
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.users)) {
          const cleanUsers = data.users.filter(u => u && u.email && u.email.toLowerCase() !== 'dora@gmail.com');
          setUsersDirectory({
            ...data,
            totalCount: cleanUsers.length,
            onlineCount: cleanUsers.filter(u => u.isOnline).length,
            users: cleanUsers
          });
          try {
            localStorage.setItem('stealth_known_users', JSON.stringify(cleanUsers));
          } catch(e) {}
        }
      })
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/daily-tasks/sync`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          if (Array.isArray(data.deletedSlotIds)) {
            const curDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
            const nextDel = Array.from(new Set([...curDel, ...data.deletedSlotIds]));
            try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(nextDel)); } catch(e) {}
            setDeletedSlotIds(nextDel);
          }
          if (Array.isArray(data.slots)) {
            const activeDel = Array.isArray(data.deletedSlotIds) ? data.deletedSlotIds : JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
            const cleanSlots = sortSlotsByTime(data.slots.filter(s => s && !activeDel.includes(s.id)));
            setDailySlots(cleanSlots);
            try { localStorage.setItem('stealth_daily_slots', JSON.stringify(cleanSlots)); } catch(e) {}
          }
          if (Array.isArray(data.submissions)) {
            setDailySubmissions(prev => {
              const map = new Map();
              prev.forEach(s => map.set(s.id, s));
              data.submissions.forEach(s => map.set(s.id, s));
              const merged = Array.from(map.values());
              try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(merged)); } catch(e) {}
              return merged;
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const [isPressingThink, setIsPressingThink] = useState(false);
  const thinkLongPressTimerRef = useRef(null);
  const thinkTriggeredRef = useRef(false);
  const [activeAwardMsgId, setActiveAwardMsgId] = useState(null);
  const [isWhatsAppView, setIsWhatsAppView] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Real WebRTC Audio Call States & MediaRecorder for Audio Recording
  const [isInAudioCall, setIsInAudioCall] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isWhisperModeEnabled, setIsWhisperModeEnabled] = useState(false);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [callDurationSec, setCallDurationSec] = useState(0);
  const callDurationRef = useRef(0);
  const callTimerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioMixerDestRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  // Admin Call Recording Vault State
  const [showAdminRecordingsModal, setShowAdminRecordingsModal] = useState(false);
  const [adminRecordingsList, setAdminRecordingsList] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_admin_call_recordings');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const now = Date.now();
      return parsed.filter(rec => now - rec.createdAt < 24 * 60 * 60 * 1000);
    } catch {
      return [];
    }
  });

  // Plugins & Arcade States
  const [showArcadePlugins, setShowArcadePlugins] = useState(false);
  const [incomingGameRequest, setIncomingGameRequest] = useState(false);
  const [activeGame, setActiveGame] = useState(null);

  // PWA Mobile Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false);

  // Togepi Live Chat Widget State inside Codex
  const [showTogepiMenu, setShowTogepiMenu] = useState(false);
  const [togepiInput, setTogepiInput] = useState('');
  const [togepiChatHistory, setTogepiChatHistory] = useState([]);
  const [incomingTogepiAlert, setIncomingTogepiAlert] = useState(null);
  const [isTogepiVisible, setIsTogepiVisible] = useState(true);

  // Codex Cinema Delay Gap Sync State
  const [syncDelayGapText, setSyncDelayGapText] = useState('');
  const delayGapTimeoutRef = useRef(null);
  const codexYTPlayerRef = useRef(null);
  const togepiScrollRef = useRef(null);

  // Live Scores & Ludo Royal Clash Game State (Player H = Red vs Player A = Green)
  const [scores, setScores] = useState({ H: 0, A: 0 });
  const [winnerMessage, setWinnerMessage] = useState('');
  const [ludoTokens, setLudoTokens] = useState({
    H: [-1, -1, -1, -1],
    A: [-1, -1, -1, -1]
  });
  const [ludoTurn, setLudoTurn] = useState('H'); // 'H' (Admin) or 'A' (User)
  const [diceVal, setDiceVal] = useState(6);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [ludoStatusMsg, setLudoStatusMsg] = useState('Welcome to Ludo Royal! Admin rolls first.');
  const [movableTokens, setMovableTokens] = useState([]);

  // 7:20 PM Auto-Download Daily Ref
  const autoDownloadedRef = useRef(false);

  // Love Balance & Karma Currency State
  const [loveBalance, setLoveBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_love_balance');
      return saved !== null ? (parseFloat(saved) || 0.00) : 0.00;
    } catch {
      return 0.00;
    }
  });

  const isLegacyMockEntry = useCallback((item) => {
    if (!item) return true;
    if (item.id && /^lb_([1-9]|1[0-1])$/.test(item.id)) return true;
    if (item.description && (
      item.description.includes('Announcement Read') ||
      item.description.includes('Monthly Punctuality Reward')
    )) return true;
    // Purge any auto habit/missed penalties from before today (Nov 17, 2026 onwards)
    if (item.id && (item.id.startsWith('habit_') || item.id.startsWith('penalty_'))) {
      const match = (item.id + ' ' + (item.description || '')).match(/(\d{4}-\d{2}-\d{2})/);
      if (match && match[1] < '2026-11-17') return true;
    }
    return false;
  }, []);

  const [loveLedger, setLoveLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_love_ledger');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(item => item && !isLegacyMockEntry(item))
            .map(item => ({
              ...item,
              target: item.target || (item.description && item.description.includes('[Darsh]') ? 'admin' : 'user')
            }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Pure Mathematical Ledger Balance Calculation (Strict Single Source of Truth)
  const getNetLedgerBalance = useCallback((ledger, target = 'user') => {
    if (!Array.isArray(ledger)) return 0;
    const entries = ledger.filter(e => {
      if (!e || isLegacyMockEntry(e)) return false;
      if (target === 'admin') {
        return e.target === 'admin' || (e.description && e.description.includes('[Darsh]'));
      }
      return e.target !== 'admin' && !(e.description && e.description.includes('[Darsh]'));
    });

    const credits = entries
      .filter(e => e.type === 'credit')
      .reduce((sum, e) => sum + Math.abs(Number(e.points) || 0), 0);

    const debits = entries
      .filter(e => e.type === 'debit' && e.status !== 'Redeemed')
      .reduce((sum, e) => sum + Math.abs(Number(e.points) || 0), 0);

    const redeems = entries
      .filter(e => e.type === 'redeem' || e.status === 'Redeemed')
      .reduce((sum, e) => sum + Math.abs(Number(e.points) || 0), 0);

    const net = parseFloat((credits - debits - redeems).toFixed(2));
    return net;
  }, [isLegacyMockEntry]);

  const doraNetBalance = useMemo(() => {
    const userEntries = (loveLedger || []).filter(e => e && !isLegacyMockEntry(e) && e.target !== 'admin' && !(e.description && e.description.includes('[Darsh]')));
    if (userEntries.length > 0) {
      return getNetLedgerBalance(loveLedger, 'user');
    }
    if (typeof loveBalance === 'number') return loveBalance;
    const activeDoraUser = (usersDirectory?.users || []).find(u => u && !u.isAdmin && u.isDora);
    if (activeDoraUser && typeof activeDoraUser.loveBalance === 'number') {
      return activeDoraUser.loveBalance;
    }
    return typeof loveBalance === 'number' ? loveBalance : 0;
  }, [loveLedger, getNetLedgerBalance, loveBalance, isLegacyMockEntry, usersDirectory]);
  const adminNetBalance = useMemo(() => getNetLedgerBalance(loveLedger, 'admin'), [loveLedger, getNetLedgerBalance]);

  // Synchronize loveBalance and adminLoveBalance state with pure mathematical ledger totals
  useEffect(() => {
    setLoveBalance(doraNetBalance);
    try { localStorage.setItem('stealth_love_balance', doraNetBalance.toString()); } catch(e) {}
    const myRole = roleRef.current || role || localStorage.getItem('stealth_role');
    const myEmail = (googleUser?.email || localStorage.getItem('stealth_user_email') || '').toLowerCase().trim();
    if (myRole !== 'parent' && myEmail && myEmail !== 'dora@gmail.com') {
      if (socketRef.current) {
        socketRef.current.emit('user_sync_state', {
          email: myEmail,
          loveBalance: doraNetBalance,
          loveLedger: loveLedger
        });
      }
      fetch(`${BACKEND_URL}/api/user/sync-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: myEmail,
          loveBalance: doraNetBalance,
          loveLedger: loveLedger
        })
      }).catch(() => {});
    }
  }, [doraNetBalance, role, googleUser?.email, loveLedger]);

  useEffect(() => {
    setAdminLoveBalance(adminNetBalance);
    try { localStorage.setItem('stealth_admin_love_balance', adminNetBalance.toString()); } catch(e) {}
  }, [adminNetBalance]);

  // On mount: unconditionally purge any legacy mock template entries from storage and state
  useEffect(() => {
    try {
      const savedBal = localStorage.getItem('stealth_love_balance');
      if (savedBal && parseFloat(savedBal) < 0) {
        localStorage.setItem('stealth_love_balance', '0');
        setLoveBalance(0);
      }
      const savedAdminBal = localStorage.getItem('stealth_admin_love_balance');
      if (savedAdminBal && parseFloat(savedAdminBal) < 0) {
        localStorage.setItem('stealth_admin_love_balance', '0');
        setAdminLoveBalance(0);
      }
      const saved = localStorage.getItem('stealth_love_ledger');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(item => !isLegacyMockEntry(item));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('stealth_love_ledger', JSON.stringify(cleaned));
            setLoveLedger(cleaned);
          }
        }
      }
    } catch(e) {}
  }, [isLegacyMockEntry]);

  const [showLoveBalanceModal, setShowLoveBalanceModal] = useState(false);
  const [showCoupleMiniGameModal, setShowCoupleMiniGameModal] = useState(false);
  const [showLudoModal, setShowLudoModal] = useState(false);
  const [showGamesHubModal, setShowGamesHubModal] = useState(false);
  const [incomingGameChallenge, setIncomingGameChallenge] = useState(null);

  // Authoritative real-time game states (millisecond sync across both phones)
  const [tictactoeState, setTictactoeState] = useState({
    board: Array(9).fill(null),
    turn: 'H',
    betAmount: 2.0,
    scores: { H: 0, A: 0 },
    winner: null,
    isDraw: false,
    gameStatus: 'PLAYING'
  });

  const [ludoGameState, setLudoGameState] = useState({
    tokens: { H: [-1, -1, -1, -1], A: [-1, -1, -1, -1] },
    turn: 'H',
    dice: 6,
    statusMsg: 'Match ready! Darsh rolls first.',
    scores: { H: 0, A: 0 },
    betAmount: 2.0,
    winner: null
  });

  // --- WHATSAPP SIGNATURE UPGRADE STATES ---
  const [showWhatsAppMediaTray, setShowWhatsAppMediaTray] = useState(false);
  const [bottomInputMode, setBottomInputMode] = useState('mic'); // 'mic' | 'camera'
  const [showCircularVideoNoteModal, setShowCircularVideoNoteModal] = useState(false);
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
  const [voiceNoteSeconds, setVoiceNoteSeconds] = useState(0);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [doubleTapHeartAnimMsgId, setDoubleTapHeartAnimMsgId] = useState(null);
  const [touchSwipeState, setTouchSwipeState] = useState({ msgId: null, deltaX: 0 });

  const wpInputRef = useRef(null);
  const voiceMediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);
  const lastTouchTapRef = useRef({ time: 0, msgId: null });

  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearModalTarget, setClearModalTarget] = useState('user'); // 'user' | 'admin' | 'both'
  const [wishRequests, setWishRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_wish_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeWishApprovalModal, setActiveWishApprovalModal] = useState(null);
  const [loveModalTab, setLoveModalTab] = useState('passbook'); // 'passbook' | 'redeem' | 'rules'
  const [loveSourceFilter, setLoveSourceFilter] = useState('All');
  const [loveStatusFilter, setLoveStatusFilter] = useState('All');
  const [loveDateFrom, setLoveDateFrom] = useState('');
  const [loveDateTo, setLoveDateTo] = useState('');
  const [adminLbAmount, setAdminLbAmount] = useState('');
  const [adminLbReason, setAdminLbReason] = useState('');

  // Real-time Presence & WhatsApp View States
  const [onlineRoles, setOnlineRoles] = useState([]);
  const [showWpMenu, setShowWpMenu] = useState(false);
  const [showWpSearch, setShowWpSearch] = useState(false);
  const [wpSearchQuery, setWpSearchQuery] = useState('');

  // Dual Balance & Power Tools State
  const [adminLoveBalance, setAdminLoveBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_admin_love_balance');
      return saved !== null ? Math.max(0, parseFloat(saved) || 0) : 0.00;
    } catch {
      return 0.00;
    }
  });
  const [activeLbTarget, setActiveLbTarget] = useState('user'); // 'user' (Partner A) or 'admin' (Admin H)
  const [adminOverrideVal, setAdminOverrideVal] = useState('');

  // Persistent Deleted Slot IDs (Tombstones so deleted slots NEVER reappear after refresh or app close)
  const [deletedSlotIds, setDeletedSlotIds] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_deleted_slot_ids');
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  // --- DAILY PROJECTS & HOURLY ROUTINE STATE ---
  const [dailySlots, setDailySlots] = useState(() => {
    try {
      const savedDeleted = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
      const map = new Map();
      DEFAULT_DAILY_SLOTS.filter(d => !savedDeleted.includes(d.id)).forEach(d => map.set(d.id, d));
      const saved = localStorage.getItem('stealth_daily_slots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(s => { if (s && s.id && !savedDeleted.includes(s.id)) map.set(s.id, s); });
        }
      }
      return sortSlotsByTime(
        Array.from(map.values()).filter(s => s && !savedDeleted.includes(s.id))
      );
    } catch(e) {
      return sortSlotsByTime(DEFAULT_DAILY_SLOTS);
    }
  });
  const [dailySubmissions, setDailySubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_daily_submissions');
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });
  const [dailySelectedDate, setDailySelectedDate] = useState(() => getLocalDateString());
  const [dailySelectedSlotId, setDailySelectedSlotId] = useState('slot_1');
  const [dailyNoteInput, setDailyNoteInput] = useState('');
  const [dailyImageProof, setDailyImageProof] = useState('');
  const [dailySubmitting, setDailySubmitting] = useState(false);
  const [dailyPreviewModalImg, setDailyPreviewModalImg] = useState(null);
  const [showSlotReportModal, setShowSlotReportModal] = useState(false);
  const [dailyAdminToast, setDailyAdminToast] = useState(null);
  const [dailyAdminTab, setDailyAdminTab] = useState('review'); // 'review' | 'slots'
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotFormTitle, setSlotFormTitle] = useState('');
  const [slotFormTimeRange, setSlotFormTimeRange] = useState('');
  const [slotFormTag, setSlotFormTag] = useState('Task');
  const [slotFormPoints, setSlotFormPoints] = useState('2.0');
  const [dailyAITip, setDailyAITip] = useState('');
  const [refreshingSection, setRefreshingSection] = useState(null);
  const [expandedAdminParts, setExpandedAdminParts] = useState({
    part1: false,
    part2: false,
    part3: false,
    part4: false
  });
  const toggleAdminPart = useCallback((partKey) => {
    setExpandedAdminParts(prev => ({ ...prev, [partKey]: !prev[partKey] }));
  }, []);
  const toggleAllAdminParts = useCallback((expand) => {
    setExpandedAdminParts({
      part1: expand,
      part2: expand,
      part3: expand,
      part4: expand
    });
  }, []);
  const areAllAdminPartsExpanded = useMemo(() => {
    return Object.values(expandedAdminParts).every(Boolean);
  }, [expandedAdminParts]);

  const checkDailyHabitInfractionsRef = useRef(null);

  const handleManualSectionRefresh = useCallback((sectionName) => {
    setRefreshingSection(sectionName);
    fetch(`${BACKEND_URL}/api/love-balance/evaluate`, { method: 'POST' }).catch(() => {});
    if (checkDailyHabitInfractionsRef.current) {
      try { checkDailyHabitInfractionsRef.current(); } catch(e) {}
    }

    const myRole = roleRef.current || role || localStorage.getItem('stealth_role');
    const myEmail = (googleUser?.email || localStorage.getItem('stealth_user_email') || '').toLowerCase().trim();

    // 1. If Dora / non-admin: push current local state to backend
    if (myRole !== 'parent' && myEmail && myEmail !== 'dora@gmail.com') {
      fetch(`${BACKEND_URL}/api/user/sync-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: myEmail,
          loveBalance: doraNetBalance,
          loveLedger: loveLedger
        })
      }).catch(() => {});
    }

    // 2. Comprehensive Socket Broadcasts for real-time peer syncing
    if (socketRef.current) {
      socketRef.current.emit('request_peer_balance', { from: myRole, email: myEmail });
      socketRef.current.emit('togepi_movie_chat', {
        room: GLOBAL_ROOM,
        senderRole: myRole,
        text: '__PING_DORA_BALANCE__'
      });
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'REQUEST_SYNC',
        loveBalance: doraNetBalance,
        loveLedger: loveLedger
      });
      socketRef.current.emit('request_users_directory');
      socketRef.current.emit('daily_task_request_sync', { date: dailySelectedDate });

      if (sectionName === 'part3_pending' || sectionName === 'chat_header') {
        socketRef.current.emit('request_initial_messages', { room: GLOBAL_ROOM });
      }
    }

    // 3. REST Hydration for guaranteed instant parity across devices
    fetch(`${BACKEND_URL}/api/auth/users-directory`)
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.users)) {
          const cleanUsers = data.users.filter(u => u && u.email && u.email.toLowerCase() !== 'dora@gmail.com');
          setUsersDirectory({
            ...data,
            totalCount: cleanUsers.length,
            onlineCount: cleanUsers.filter(u => u.isOnline).length,
            users: cleanUsers
          });
          try { localStorage.setItem('stealth_known_users', JSON.stringify(cleanUsers)); } catch(e) {}
        }
      })
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/daily-tasks/sync`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          if (Array.isArray(data.deletedSlotIds)) {
            const curDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
            const nextDel = Array.from(new Set([...curDel, ...data.deletedSlotIds]));
            try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(nextDel)); } catch(e) {}
            setDeletedSlotIds(nextDel);
          }
          if (Array.isArray(data.slots)) {
            const activeDel = Array.isArray(data.deletedSlotIds) ? data.deletedSlotIds : JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
            const cleanSlots = sortSlotsByTime(data.slots.filter(s => s && !activeDel.includes(s.id)));
            setDailySlots(cleanSlots);
            try { localStorage.setItem('stealth_daily_slots', JSON.stringify(cleanSlots)); } catch(e) {}
          }
          if (Array.isArray(data.submissions)) {
            setDailySubmissions(prev => {
              const map = new Map();
              prev.forEach(s => map.set(s.id, s));
              data.submissions.forEach(s => map.set(s.id, s));
              const merged = Array.from(map.values());
              try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(merged)); } catch(e) {}
              return merged;
            });
          }
        }
      })
      .catch(() => {});

    if (sectionName === 'part2_recordings') {
      try {
        const recs = JSON.parse(localStorage.getItem('stealth_admin_call_recordings') || '[]');
        setAdminRecordingsList(recs);
      } catch(e) {}
    }

    setTimeout(() => {
      setRefreshingSection(null);
    }, 1000);
  }, [dailySelectedDate, doraNetBalance, googleUser?.email, loveLedger, role]);
  const [dailyAILoading, setDailyAILoading] = useState(false);
  const dailyFileInputRef = useRef(null);

  // Helper to accurately lookup a submission for a slot on the given date (prioritizes APPROVED, then PENDING)
  const getSlotSubmission = useCallback((slotId, date) => {
    if (!slotId) return null;
    const matches = dailySubmissions.filter(s => s && s.slotId === slotId && (!date || !s.date || s.date === date));
    if (matches.length === 0) return null;
    const approved = matches.find(s => s.status === 'APPROVED');
    if (approved) return approved;
    const pending = matches.find(s => s.status === 'PENDING');
    if (pending) return pending;
    return matches[matches.length - 1];
  }, [dailySubmissions]);

  const checkSlotOverdue = useCallback((slot, date) => {
    if (!slot || !slot.timeRange) return false;
    try {
      const parts = slot.timeRange.split('-').map(p => p.trim());
      if (parts.length < 2) return false;
      let [endH, endM] = parts[1].split(':').map(n => parseInt(n, 10));
      if (slot.tag === 'Lunch' && endH < 12) endH += 12;
      if (slot.tag === 'Water' && endH < 12) endH += 12;
      if (slot.tag === 'Tea' && endH < 12) endH += 12;
      if (slot.tag === 'Dinner' && endH < 12) endH += 12;
      if (slot.tag === 'Steps' && endH < 12) endH += 12;
      if (slot.tag === 'Skincare' && endH < 12) endH += 12;

      const targetDate = date || dailySelectedDate;
      const todayStr = getLocalDateString();
      if (targetDate < todayStr) return true;
      if (targetDate > todayStr) return false;

      const now = new Date();
      const curMinutes = now.getHours() * 60 + now.getMinutes();
      return curMinutes > (endH * 60 + (endM || 0));
    } catch {
      return false;
    }
  }, [dailySelectedDate]);

  const handleExportDayPdf = useCallback((dateStr) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Daily Routine Tasks Report - ${dateStr}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Stealth Chat Engine`, 14, 28);
      doc.setLineWidth(0.5);
      doc.line(14, 32, 196, 32);

      const daySubs = dailySubmissions.filter(s => s && (!s.date || s.date === dateStr));
      let y = 42;
      doc.setFontSize(11);
      doc.text(`Total Routine Slots: ${dailySlots.filter(s => s.isActive).length} | Submissions Found: ${daySubs.length}`, 14, y);
      y += 10;

      dailySlots.filter(s => s.isActive).forEach((slot, idx) => {
        const sub = daySubs.find(s => s.slotId === slot.id);
        const status = sub ? sub.status : 'NOT SUBMITTED';
        const points = sub ? (sub.pointsAwarded || 0) : 0;
        const note = sub?.note ? `Note: "${sub.note}"` : 'No note provided';
        
        doc.setFontSize(10);
        doc.text(`${idx + 1}. [${slot.timeRange}] ${slot.title}`, 14, y);
        y += 6;
        doc.setFontSize(9);
        doc.text(`   Status: ${status} | Points Awarded: ₹ ${points} | ${note}`, 14, y);
        y += 8;
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save(`daily_routine_report_${dateStr}.pdf`);
    } catch(e) {
      console.error("PDF export error:", e);
      alert("Could not generate PDF: " + e.message);
    }
  }, [dailySubmissions, dailySlots]);

  // Mobile Notification Permission State
  // Touch Swipe Gesture State for Mobile Sidebar (Left-to-Right Opens)
  const sidebarSwipeStartXRef = useRef(0);
  const sidebarSwipeStartYRef = useRef(0);
  const sidebarSwipeCurrentXRef = useRef(0);
  const sidebarSwipeCurrentYRef = useRef(0);

  const handleSidebarTouchStart = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    sidebarSwipeStartXRef.current = e.touches[0].clientX;
    sidebarSwipeStartYRef.current = e.touches[0].clientY;
    sidebarSwipeCurrentXRef.current = e.touches[0].clientX;
    sidebarSwipeCurrentYRef.current = e.touches[0].clientY;
  }, []);

  const handleSidebarTouchMove = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    sidebarSwipeCurrentXRef.current = e.touches[0].clientX;
    sidebarSwipeCurrentYRef.current = e.touches[0].clientY;
  }, []);

  const handleSidebarTouchEnd = useCallback(() => {
    const deltaX = sidebarSwipeCurrentXRef.current - sidebarSwipeStartXRef.current;
    const deltaY = sidebarSwipeCurrentYRef.current - sidebarSwipeStartYRef.current;

    // Check if horizontal swipe is dominant (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && Math.abs(deltaX) > 45) {
      // Swipe from Left to Right (swiping right) -> Open Sidebar
      if (deltaX > 45) {
        setSidebarOpen(true);
      }
      // Swipe from Right to Left (swiping left) -> Close Sidebar
      else if (deltaX < -45) {
        setSidebarOpen(false);
      }
    }
  }, []);

  const [notificationPermission, setNotificationPermission] = useState(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission;
      }
    } catch (e) {
      return 'default';
    }
    return 'default';
  });

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
  const codexEngineRef = useRef(codexEngine);
  useEffect(() => {
    codexEngineRef.current = codexEngine;
  }, [codexEngine]);

  const [movieInputUrl, setMovieInputUrl] = useState('');
  const [activeMovieSrc, setActiveMovieSrc] = useState('');
  const [activeMovieYTId, setActiveMovieYTId] = useState('');
  
  const [embedServer, setEmbedServer] = useState('vidlink');
  const [currentImdbId, setCurrentImdbId] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState('');
  
  const [localVideoSrc, setLocalVideoSrc] = useState('');
  const [localFileName, setLocalFileName] = useState('');
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);
  const [movieError, setMovieError] = useState('');
  
  const html5VideoRef = useRef(null);
  const html5LocalVideoRef = useRef(null);
  const localVideoInputRef = useRef(null);
  const isMovieRemoteTriggerRef = useRef(false);

  const handleSwitchCodexEngine = (engine) => {
    setCodexEngine(engine);
    setMovieError('');
    if (engine !== 'youtube' && codexYTPlayerRef.current && typeof codexYTPlayerRef.current.pauseVideo === 'function') {
      try { codexYTPlayerRef.current.pauseVideo(); } catch (e) {}
    }
    if (engine !== 'gofile' && html5VideoRef.current && typeof html5VideoRef.current.pause === 'function') {
      try { html5VideoRef.current.pause(); } catch (e) {}
    }
    if (engine !== 'local' && html5LocalVideoRef.current && typeof html5LocalVideoRef.current.pause === 'function') {
      try { html5LocalVideoRef.current.pause(); } catch (e) {}
    }
  };

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

  const touchStartXRef = useRef(0);
  const activeSwipeMsgIdRef = useRef(null);

  const socketRef = useRef(null);
  const stealthMessagesRef = useRef([]);
  const messageEndRef = useRef(null);
  const streamContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const wpChatScrollRef = useRef(null);
  const escPressCount = useRef(0);
  const escTimer = useRef(null);
  const swRegistrationRef = useRef(null);

  const viewModeRef = useRef(viewMode);
  const isWhatsAppViewRef = useRef(isWhatsAppView);
  const roleRef = useRef(role);
  const isCurrentAdmin = role === 'parent';

  // --- CODEX CINEMA YOUTUBE PLAYER SYNC ENGINE ---
  useEffect(() => {
    if (codexEngine === 'youtube' && activeMovieYTId) {
      let ytTimer = null;
      const initCodexYT = () => {
        if (!window.YT || !window.YT.Player) return;
        const targetEl = document.getElementById('codex-cinema-yt-player');
        if (!targetEl) return;
        try {
          if (codexYTPlayerRef.current && typeof codexYTPlayerRef.current.loadVideoById === 'function') {
            codexYTPlayerRef.current.loadVideoById(activeMovieYTId);
            return;
          }
          codexYTPlayerRef.current = new window.YT.Player('codex-cinema-yt-player', {
            videoId: activeMovieYTId,
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
                if (isMoviePlaying && codexYTPlayerRef.current?.playVideo) {
                  codexYTPlayerRef.current.playVideo();
                }
              },
              onStateChange: (event) => {
                if (isMovieRemoteTriggerRef.current) return;
                // 1 = PLAYING, 2 = PAUSED
                if (event.data === 1) {
                  setIsMoviePlaying(true);
                  if (socketRef.current) {
                    socketRef.current.emit('codex_movie_sync', {
                      room: GLOBAL_ROOM,
                      state: 'PLAY',
                      currentTime: codexYTPlayerRef.current?.getCurrentTime() || 0,
                      timestamp: Date.now()
                    });
                  }
                } else if (event.data === 2) {
                  setIsMoviePlaying(false);
                  if (socketRef.current) {
                    socketRef.current.emit('codex_movie_sync', {
                      room: GLOBAL_ROOM,
                      state: 'PAUSE',
                      currentTime: codexYTPlayerRef.current?.getCurrentTime() || 0,
                      timestamp: Date.now()
                    });
                  }
                }
              }
            }
          });
        } catch (e) {
          console.warn("Codex YT Player Init Error:", e);
        }
      };

      ytTimer = setInterval(() => {
        const targetEl = document.getElementById('codex-cinema-yt-player');
        if (window.YT && window.YT.Player && targetEl) {
          initCodexYT();
          clearInterval(ytTimer);
        }
      }, 300);

      return () => {
        if (ytTimer) clearInterval(ytTimer);
        if (codexYTPlayerRef.current && typeof codexYTPlayerRef.current.pauseVideo === 'function') {
          try { codexYTPlayerRef.current.pauseVideo(); } catch (e) {}
        }
      };
    }
  }, [codexEngine, activeMovieYTId]);

  useEffect(() => {
    if (togepiScrollRef.current) {
      togepiScrollRef.current.scrollTop = togepiScrollRef.current.scrollHeight;
    }
  }, [togepiChatHistory, showTogepiMenu]);

  // --- PERSIST CALL RECORDINGS TO LOCALSTORAGE ---
  useEffect(() => {
    try {
      localStorage.setItem('stealth_admin_call_recordings', JSON.stringify(adminRecordingsList));
    } catch (e) {
      console.warn("Storage quota limit reached for recordings:", e);
    }
  }, [adminRecordingsList]);

  const formatCallTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper: Acquire Local Microphone Stream
  const getLocalAudioStream = async () => {
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Microphone permission error:", err);
      alert("Microphone permission required for audio calls: " + err.message);
      return null;
    }
  };

  // Handler: Install PWA on Mobile Devices (Android & iOS)
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsAppInstalled(true);
        }
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
      setDeferredPrompt(null);
    } else {
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIos) {
        setShowIosInstallGuide(true);
      } else {
        alert("To install this app on your phone:\n\n1. Tap your browser menu (⋮ or Share)\n2. Select 'Add to Home screen' or 'Install App'");
      }
    }
  };

  // Helper: Setup WebRTC PeerConnection with ICE and Track listeners
  const setupPeerConnection = (stream) => {
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice_candidate', { room: GLOBAL_ROOM, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const rStream = event.streams[0];
        remoteStreamRef.current = rStream;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = rStream;
          remoteAudioRef.current.play().catch(e => console.log("Audio autoplay note:", e));
        }
        // Connect incoming remote audio to the call recording mixer
        if (audioContextRef.current && audioMixerDestRef.current) {
          try {
            const remoteSource = audioContextRef.current.createMediaStreamSource(rStream);
            remoteSource.connect(audioMixerDestRef.current);
          } catch (e) {}
        }
      }
    };

    return pc;
  };

  // Helper: Mix local mic and remote audio together for HD Call Recording
  const startCallRecording = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const dest = ctx.createMediaStreamDestination();
      audioMixerDestRef.current = dest;

      if (stream) {
        const localSource = ctx.createMediaStreamSource(stream);
        localSource.connect(dest);
      }
      if (remoteStreamRef.current) {
        const remoteSource = ctx.createMediaStreamSource(remoteStreamRef.current);
        remoteSource.connect(dest);
      }

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(dest.stream, { mimeType }) : new MediaRecorder(dest.stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const duration = callDurationRef.current;
        if (duration >= 1 && audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result;
            const newRec = {
              id: 'rec_' + Date.now(),
              title: `Call Session (${new Date().toLocaleDateString()})`,
              duration: formatCallTime(duration),
              date: new Date().toLocaleString(),
              size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
              audioUrl: base64Audio,
              createdAt: Date.now()
            };
            setAdminRecordingsList(prev => [newRec, ...prev]);
          };
          reader.readAsDataURL(blob);
        }
      };

      recorder.start(1000);
    } catch (e) {
      console.log("MediaRecorder setup note:", e);
    }
  };

  // User/Admin initiates audio call
  const handleStartAudioCall = async () => {
    const stream = await getLocalAudioStream();
    if (!stream) return;
    setIsCalling(true);
    playSentSound();
    if (socketRef.current) {
      socketRef.current.emit('start_audio_call', { room: GLOBAL_ROOM, fromRole: role });
    }
  };

  // Receiver accepts incoming audio call
  const handleAcceptIncomingCall = async () => {
    setIsIncomingCall(false);
    setIsCalling(false);
    setIsInAudioCall(true);
    playReceiveSound();

    setCallDurationSec(0);
    callDurationRef.current = 0;
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      callDurationRef.current += 1;
      setCallDurationSec(prev => prev + 1);
    }, 1000);

    const stream = await getLocalAudioStream();
    if (!stream) return;

    setupPeerConnection(stream);
    startCallRecording(stream);

    if (socketRef.current) {
      socketRef.current.emit('accept_audio_call', { room: GLOBAL_ROOM, role });
    }
  };

  // End or decline active call
  const handleEndAudioCall = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }

    remoteStreamRef.current = null;
    audioMixerDestRef.current = null;
    pendingIceCandidatesRef.current = [];

    setIsInAudioCall(false);
    setIsIncomingCall(false);
    setIsCalling(false);
    setIsWhisperModeEnabled(false);
    setIsCallMuted(false);
    setCallDurationSec(0);
    callDurationRef.current = 0;

    if (socketRef.current) {
      socketRef.current.emit('end_audio_call', { room: GLOBAL_ROOM });
    }
  };

  // --- GOOGLE GSI DIRECT ACCOUNT CHOOSER AUTH ENGINE ---
  const googleBtnRef = useRef(null);
  const googleSidebarBtnRef = useRef(null);

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    if (!response || !response.credential) return;
    try {
      const decoded = parseJwt(response.credential);
      if (decoded && decoded.email) {
        await applyAuthenticatedUser(decoded.email, decoded.name, decoded.picture);
      }
    } catch (err) {
      console.error("JWT parse error:", err);
    }
  }, []);

  useEffect(() => {
    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });

        if (googleSidebarBtnRef.current) {
          googleSidebarBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleSidebarBtnRef.current, {
            theme: 'filled_black',
            size: 'medium',
            text: 'signin_with',
            shape: 'pill',
            width: 220
          });
        }

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 280
          });
        }
      } catch (e) {
        console.error("GSI initialize error:", e);
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [handleGoogleCredentialResponse]);

  const applyAuthenticatedUser = useCallback(async (email, displayName, pictureUrl) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return;
    const isAdmin = cleanEmail === 'arthurs10pc@gmail.com';
    const userRole = isAdmin ? 'parent' : 'user';
    const fullName = displayName || (isAdmin ? 'Darsh' : 'User');
    const firstName = fullName.trim().split(' ')[0] || fullName;
    const finalName = isAdmin ? 'Darsh' : firstName;

    // Check if this account is already authorized as Dora
    let isDora = false;
    try {
      const savedDir = usersDirectory?.users || [];
      const found = savedDir.find(u => u && u.email && u.email.toLowerCase() === cleanEmail);
      if (found) isDora = Boolean(found.isDora);
    } catch(e) {}

    const profileObj = {
      email: cleanEmail,
      name: finalName,
      firstName,
      fullName,
      originalName: displayName || fullName,
      picture: pictureUrl || (isAdmin ? 'https://lh3.googleusercontent.com/a/default-user' : ''),
      role: userRole,
      isAdmin,
      isDora,
      loveBalance: doraNetBalance,
      loveLedger: loveLedger
    };

    setGoogleUser(profileObj);
    setRole(userRole);
    try {
      localStorage.setItem('stealth_role', userRole);
      localStorage.setItem('stealth_user_profile', JSON.stringify(profileObj));
    } catch (e) {}

    // Notify backend and get authoritative user data
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileObj)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          const authObj = {
            ...profileObj,
            isDora: Boolean(data.user.isDora)
          };
          setGoogleUser(authObj);
          try {
            localStorage.setItem('stealth_user_profile', JSON.stringify(authObj));
          } catch(e) {}
        }
      }
    } catch (e) {
      console.warn("Backend auth update error:", e);
    }

    setUsersDirectory(prev => {
      const list = Array.isArray(prev?.users) ? [...prev.users] : [];
      const idx = list.findIndex(u => u && u.email && u.email.toLowerCase() === cleanEmail);
      const userItem = {
        email: cleanEmail,
        name: finalName,
        firstName,
        fullName,
        originalName: displayName || fullName,
        picture: pictureUrl || '',
        role: userRole,
        isAdmin,
        isDora,
        isOnline: true,
        connectedSessions: 1,
        lastLogin: new Date().toISOString()
      };
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...userItem };
      } else {
        list.push(userItem);
      }
      try {
        localStorage.setItem('stealth_known_users', JSON.stringify(list));
      } catch (err) {}
      return {
        totalCount: list.length,
        onlineCount: list.filter(u => u.isOnline).length,
        users: list
      };
    });

    if (socketRef.current) {
      socketRef.current.emit('auth_identify', profileObj);
      socketRef.current.emit('togepi_movie_chat', {
        room: GLOBAL_ROOM,
        senderRole: userRole,
        text: `__USER_ANNOUNCE__:${JSON.stringify(profileObj)}`
      });
      socketRef.current.emit('request_users_directory');
      socketRef.current.emit('love_balance_action', { action: 'SYNC_STATE' });
    }
  }, [usersDirectory]);

  const handleGoogleLogin = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      alert("Google Identity Services is initializing... Please click again in 2 seconds.");
      return;
    }
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            if (tokenResponse.error === 'popup_closed_by_user') return;
            console.error("Google Auth error:", tokenResponse);
            return;
          }
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const info = await res.json();
            if (info && info.email) {
              await applyAuthenticatedUser(info.email, info.name, info.picture);
            }
          } catch (err) {
            console.error("Error fetching Google profile:", err);
          }
        }
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (e) {
      console.error("Failed to start Google OAuth:", e);
    }
  }, [applyAuthenticatedUser]);

  const handleGoogleLogout = useCallback(() => {
    setGoogleUser(null);
    setRole('user');
    try {
      localStorage.removeItem('stealth_user_profile');
      localStorage.setItem('stealth_role', 'user');
    } catch (e) {}
    if (socketRef.current) {
      socketRef.current.emit('auth_identify', { email: '', role: 'user', name: 'Dora' });
      socketRef.current.emit('love_balance_action', { action: 'SYNC_STATE' });
    }
  }, []);

  const handleSetDora = useCallback(async (targetEmail, isDora = true) => {
    if (!targetEmail) return;
    const cleanEmail = targetEmail.toLowerCase().trim();
    if (cleanEmail === 'arthurs10pc@gmail.com') {
      alert("Admin cannot be set as Dora.");
      return;
    }
    try {
      const targetUser = (usersDirectory?.users || []).find(u => (u.email || '').toLowerCase() === cleanEmail);
      const targetName = targetUser?.firstName || (targetUser?.name ? targetUser.name.split(' ')[0] : cleanEmail.split('@')[0]);
      const targetBal = typeof targetUser?.loveBalance === 'number' ? targetUser.loveBalance : 0;

      setUsersDirectory(prev => {
        const currentList = Array.isArray(prev?.users) ? prev.users : [];
        const updated = currentList.map(u => {
          const isTarget = u.email && u.email.toLowerCase() === cleanEmail;
          if (isDora) {
            return {
              ...u,
              isDora: isTarget,
              loveBalance: isTarget ? targetBal : u.loveBalance
            };
          } else {
            return isTarget ? { ...u, isDora: false } : u;
          }
        });
        try {
          localStorage.setItem('stealth_known_users', JSON.stringify(updated));
        } catch (e) {}
        return {
          ...prev,
          users: updated
        };
      });

      if (Boolean(isDora)) {
        setLoveBalance(targetBal);
        try { localStorage.setItem('stealth_love_balance', targetBal.toString()); } catch(e) {}
        setLoveLedger(prev => {
          const adminOnly = (prev || []).filter(e => e && (e.target === 'admin' || (e.description && e.description.includes('[Darsh]'))));
          try { localStorage.setItem('stealth_love_ledger', JSON.stringify(adminOnly)); } catch(e) {}
          return adminOnly;
        });
      }

      if (socketRef.current) {
        socketRef.current.emit('admin_set_dora', { email: cleanEmail, isDora });
        socketRef.current.emit('togepi_movie_chat', {
          room: GLOBAL_ROOM,
          senderRole: 'parent',
          text: `__DORA_UPDATE__:${JSON.stringify({ email: cleanEmail, isDora, name: targetName, loveBalance: targetBal })}`
        });
      }
      const res = await fetch(`${BACKEND_URL}/api/admin/set-dora`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, isDora, adminEmail: googleUser?.email || 'arthurs10pc@gmail.com' })
      });
      const data = await res.json();
      if (data && data.success && typeof data.balance === 'number') {
        setLoveBalance(data.balance);
        try { localStorage.setItem('stealth_love_balance', data.balance.toString()); } catch(e) {}
      }
    } catch (e) {
      console.error("handleSetDora error:", e);
    }
  }, [googleUser, usersDirectory]);

  const handleDeleteUser = useCallback(async (targetEmail) => {
    if (!targetEmail) return;
    const cleanEmail = targetEmail.toLowerCase().trim();
    if (cleanEmail === 'arthurs10pc@gmail.com') {
      alert("Cannot delete primary Admin account.");
      return;
    }
    const confirmed = window.confirm(`⚠️ Permanently Delete User?\n\nAre you sure you want to permanently delete "${cleanEmail}" from database?`);
    if (!confirmed) return;

    try {
      setUsersDirectory(prev => {
        const currentList = Array.isArray(prev?.users) ? prev.users : [];
        const updatedList = currentList.filter(u => (u.email || '').toLowerCase() !== cleanEmail);
        try {
          localStorage.setItem('stealth_known_users', JSON.stringify(updatedList));
        } catch (e) {}
        return {
          ...prev,
          totalCount: updatedList.length,
          users: updatedList
        };
      });

      if (socketRef.current) {
        socketRef.current.emit('admin_delete_user', { email: cleanEmail });
        socketRef.current.emit('togepi_movie_chat', {
          room: GLOBAL_ROOM,
          senderRole: 'parent',
          text: `__DELETE_USER__:${JSON.stringify({ email: cleanEmail })}`
        });
      }

      await fetch(`${BACKEND_URL}/api/admin/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, adminEmail: googleUser?.email || 'arthurs10pc@gmail.com' })
      });
    } catch (e) {
      console.error("handleDeleteUser error:", e);
    }
  }, [googleUser]);

  // Toggle Microphone Mute
  const handleToggleCallMute = () => {
    const newMuted = !isCallMuted;
    setIsCallMuted(newMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
    }
  };

  // Playback recorded call
  const handlePlayRecordingAudio = (rec) => {
    if (rec.audioUrl) {
      const audio = new Audio(rec.audioUrl);
      audio.play().catch(e => alert("Playback error: " + e.message));
    } else {
      alert("Audio file stream not found in local cache.");
    }
  };

  // Download recorded call as audio file
  const handleDownloadRecording = (rec) => {
    if (rec.audioUrl) {
      const a = document.createElement('a');
      a.href = rec.audioUrl;
      a.download = `Call_Recording_${rec.id}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Call Recording Log Report`, 14, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Session Title: ${rec.title}`, 14, 28);
      doc.text(`Timestamp: ${rec.date}`, 14, 34);
      doc.text(`Duration: ${rec.duration}`, 14, 40);
      doc.text(`File Size: ${rec.size}`, 14, 46);
      doc.line(14, 52, 196, 52);
      doc.text("Encrypted Whisper Voice Stream Audio Log Verified.", 14, 62);
      doc.save(`Call_Recording_${rec.id}.pdf`);
    }
  };

  const handleDeleteRecording = (recId) => {
    setAdminRecordingsList(prev => prev.filter(r => r.id !== recId));
  };

  // --- INSTANT AUTO-UNLOCK & AUTO-CLEAR PIN GATE FOR WP UPGRADE VIEW ---
  const handleUpgradeClick = () => {
    setPinInput('');
    setPinError(false);
    setShowPinModal(true);
  };

  const handlePinInputChange = (e) => {
    const val = e.target.value;
    setPinInput(val);
    setPinError(false);

    if (val.length === 4) {
      if (val === '7860') {
        setRole('parent');
        roleRef.current = 'parent';
        try { localStorage.setItem('stealth_role', 'parent'); } catch(err) {}
        if (socketRef.current && isConnected) {
          socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'parent' });
          socketRef.current.emit('presence_ping', { room: GLOBAL_ROOM, role: 'parent', isForeground: true });
        }
        setShowPinModal(false);
        setIsWhatsAppView(true);
        setPinInput('');
      } else if (val === '0000') {
        setRole('user');
        roleRef.current = 'user';
        try { localStorage.setItem('stealth_role', 'user'); } catch(err) {}
        if (socketRef.current && isConnected) {
          socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'user' });
          socketRef.current.emit('presence_ping', { room: GLOBAL_ROOM, role: 'user', isForeground: true });
        }
        setShowPinModal(false);
        setIsWhatsAppView(true);
        setPinInput('');
      } else {
        setPinError(true);
        setPinInput(''); // Instant auto-clear on wrong password
      }
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    const val = pinInput.trim();
    if (val === '7860') {
      setRole('parent');
      roleRef.current = 'parent';
      try { localStorage.setItem('stealth_role', 'parent'); } catch(err) {}
      if (socketRef.current && isConnected) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'parent' });
        socketRef.current.emit('presence_ping', { room: GLOBAL_ROOM, role: 'parent', isForeground: true });
      }
      setShowPinModal(false);
      setIsWhatsAppView(true);
      setPinInput('');
    } else if (val === '0000') {
      setRole('user');
      roleRef.current = 'user';
      try { localStorage.setItem('stealth_role', 'user'); } catch(err) {}
      if (socketRef.current && isConnected) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'user' });
        socketRef.current.emit('presence_ping', { room: GLOBAL_ROOM, role: 'user', isForeground: true });
      }
      setShowPinModal(false);
      setIsWhatsAppView(true);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // --- HELPER FUNCTIONS ---
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
      osc1.type = 'sine'; osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
      osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.08);
      osc2.start(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.28);
    } catch (e) {}
  }, []);

  const playBubblePopSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, []);

  // --- CUSTOM LOW-VOLUME POINT EARNED REWARD SOUND (UPLOADED BY USER) ---
  const playPointEarnedSound = useCallback(() => {
    try {
      const audio = new Audio(process.env.PUBLIC_URL + '/point_reward.wav');
      audio.volume = 0.35; // Thoda kam volume par as requested by user
      audio.play().catch(() => {
        // Safe synth fallback if needed
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.18);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        } catch (err) {}
      });
    } catch(e) {}
  }, []);

  // --- ULTRA-RELIABLE DUAL-PATH MESSAGE DISPATCHER (WEBSOCKET + REST FALLBACK) ---
  const dispatchStealthMessage = useCallback((msgPayload) => {
    const activeRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
    const payload = {
      room: GLOBAL_ROOM,
      role: activeRole,
      ...msgPayload
    };

    let sentViaSocket = false;
    if (socketRef.current && socketRef.current.connected) {
      try {
        socketRef.current.emit('send_stealth_msg', payload);
        sentViaSocket = true;
      } catch (e) {
        console.warn("Socket send error:", e);
      }
    }

    // If socket is disconnected, lagging, or drops, send via REST fallback immediately!
    if (!sentViaSocket) {
      fetch(`${BACKEND_URL}/api/stealth-messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.warn("REST message send error:", err);
      });

      if (socketRef.current && !socketRef.current.connected) {
        try { socketRef.current.connect(); } catch (err) {}
      }
    }
  }, []);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const markMessagesAsSeen = useCallback(() => {
    const isChatOpen = viewModeRef.current === 'stealth' || isWhatsAppViewRef.current;
    const isTabActive = document.visibilityState === 'visible' && document.hasFocus();

    if (isChatOpen && isTabActive && socketRef.current) {
      const currentRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: currentRole });
    }
  }, []);

  const handleStartReply = (msg) => {
    const pureText = msg.isMedia ? "[Photo Asset]" : cleanOriginalText(msg.text);
    setReplyTarget({
      id: msg._id,
      text: pureText,
      senderRole: msg.senderRole === 'user' ? 'A' : 'H'
    });
    if (inputRef.current) inputRef.current.focus();
  };

  const handleNewChat = () => {
    setConversations([]);
    setCurrentRoom("New chat");
    setViewMode('real_gpt');
    setReplyTarget(null);
    closeSidebarOnMobile();
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

    if (cleanCmd === '/shadow7860') {
      setRole('parent');
      localStorage.setItem('stealth_role', 'parent');
      setViewMode('stealth');
      if (socketRef.current) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'parent' });
        socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: 'parent' });
      }
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      } catch (e) {}
      setInput('');
      setReplyTarget(null);
      return;
    }

    if (cleanCmd === '/dora') {
      const isAllowed = role === 'parent' || googleUser?.isAdmin || googleUser?.isDora || (usersDirectory?.users || []).some(u => u && u.email && u.email.toLowerCase() === (googleUser?.email || '').toLowerCase() && u.isDora);
      if (!isAllowed) {
        setIsThinking(false);
        const warningMsg = {
          id: 'warn_' + Date.now(),
          role: 'assistant',
          text: `🔒 **Access Locked**: Your Google account (${googleUser?.email || 'Logged User'}) is currently in Standard Mode. Only users designated as **Dora** by Admin (Darsh) can unlock Secret Chat & WhatsApp modes. Ask Darsh to click "✨ Make a Dora" in the Admin Dashboard!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setConversations(prev => [...prev, warningMsg]);
        setInput('');
        setReplyTarget(null);
        return;
      }
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

    if (viewMode === 'stealth' || isWhatsAppView) {
      let finalMessageText = val;
      let replyRefId = null;

      if (replyTarget) {
        const cleanSnippet = cleanOriginalText(replyTarget.text);
        const shortReply = cleanSnippet.length > 25 ? cleanSnippet.substring(0, 22) + '...' : cleanSnippet;
        finalMessageText = `[⤴ ${replyTarget.senderRole}: "${shortReply}"] ${val}`;
        replyRefId = replyTarget.id;
      }

      const activeRole = roleRef.current || role || localStorage.getItem('stealth_role') || 'user';
      const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const now = new Date();
      const encrypted = encryptText(finalMessageText);

      // 1. Instant Optimistic Rendering for Dora & Darsh!
      const optimisticMsg = {
        _id: tempId,
        clientMsgId: tempId,
        tempId: tempId,
        room: GLOBAL_ROOM,
        senderRole: activeRole,
        encryptedText: encrypted,
        text: finalMessageText,
        timestamp: now.toISOString(),
        timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        flaggedPending: false,
        isSeen: false,
        isDelivered: false,
        isMedia: false,
        mediaType: 'text',
        mediaOpened: false,
        reaction: null,
        isPinned: false,
        isStarred: false,
        replyRefId: replyRefId || null
      };

      setStealthMessages(prev => [...prev, optimisticMsg]);
      playSentSound();

      // 2. Dual-Path Dispatch (Socket + REST Fallback)
      dispatchStealthMessage({
        encryptedText: encrypted,
        isMedia: false,
        replyRefId,
        clientMsgId: tempId
      });

      // --- AUTOMATIC LOVE KARMA REAL-TIME EVALUATION ---
      const prevMessage = stealthMessages[stealthMessages.length - 1] || null;
      evaluateLoveKarmaMessageRules(val, activeRole, prevMessage);
      try { checkDailyHabitInfractions(stealthMessages); } catch(e) {}
      setInput('');
      setReplyTarget(null);
      if (wpInputRef.current) {
        wpInputRef.current.focus();
      }
      setTimeout(() => {
        if (wpChatScrollRef.current) {
          wpChatScrollRef.current.scrollTop = wpChatScrollRef.current.scrollHeight;
        }
      }, 50);
      return;
    }

    playSentSound();
    fetchLiveAIResponse(val);
    setInput('');
    setReplyTarget(null);
  };

  // --- WHATSAPP SIGNATURE UPGRADE HANDLERS ---
  const handleDoubleTapToLike = (msgId) => {
    if (!msgId) return;
    const targetMsg = stealthMessages.find(m => m._id === msgId);
    if (!targetMsg) return;

    const newReaction = targetMsg.reaction === '❤️' ? null : '❤️';
    try { navigator.vibrate?.(40); } catch (e) {}

    setDoubleTapHeartAnimMsgId(msgId);
    setTimeout(() => {
      setDoubleTapHeartAnimMsgId(null);
    }, 850);

    setStealthMessages(prev => prev.map(m => m._id === msgId ? { ...m, reaction: newReaction } : m));
    if (socketRef.current) {
      socketRef.current.emit('add_reaction', { room: GLOBAL_ROOM, messageId: msgId, reaction: newReaction });
    }
  };

  const handleTogglePinMessage = (msgId) => {
    if (!msgId) return;
    const targetMsg = stealthMessages.find(m => m._id === msgId);
    if (!targetMsg) return;

    const newPinned = !targetMsg.isPinned;
    setStealthMessages(prev => prev.map(m => m._id === msgId ? { ...m, isPinned: newPinned } : (newPinned ? { ...m, isPinned: false } : m)));
    if (socketRef.current) {
      socketRef.current.emit('pin_stealth_msg', { room: GLOBAL_ROOM, messageId: msgId, isPinned: newPinned });
    }
  };

  const handleToggleStarMessage = (msgId) => {
    if (!msgId) return;
    const targetMsg = stealthMessages.find(m => m._id === msgId);
    if (!targetMsg) return;

    const newStarred = !targetMsg.isStarred;
    setStealthMessages(prev => prev.map(m => m._id === msgId ? { ...m, isStarred: newStarred } : m));
    if (socketRef.current) {
      socketRef.current.emit('star_stealth_msg', { room: GLOBAL_ROOM, messageId: msgId, isStarred: newStarred });
    }
  };

  const handleStartVoiceNoteRecording = async () => {
    try {
      voiceChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else mimeType = '';
      }
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      voiceMediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) voiceChunksRef.current.push(e.data);
      };

      recorder.start(200);
      setIsRecordingVoiceNote(true);
      setVoiceNoteSeconds(0);

      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = setInterval(() => {
        setVoiceNoteSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Microphone permission is required to record voice messages.");
    }
  };

  const handleStopAndSendVoiceNote = () => {
    if (!voiceMediaRecorderRef.current || voiceMediaRecorderRef.current.state === 'inactive') return;
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);

    voiceMediaRecorderRef.current.onstop = () => {
      const mime = voiceMediaRecorderRef.current?.mimeType || 'audio/webm';
      const blob = new Blob(voiceChunksRef.current, { type: mime });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        const encrypted = encryptText(base64Audio);
        if (socketRef.current) {
          socketRef.current.emit('send_stealth_msg', {
            room: GLOBAL_ROOM,
            role,
            encryptedText: encrypted,
            isMedia: true,
            mediaType: 'audio'
          });
          playSentSound();
        }
      };
      reader.readAsDataURL(blob);
      setIsRecordingVoiceNote(false);
      setVoiceNoteSeconds(0);
      voiceChunksRef.current = [];
    };

    try {
      voiceMediaRecorderRef.current.stop();
      voiceMediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    } catch (e) {}
  };

  const handleCancelVoiceNote = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (voiceMediaRecorderRef.current && voiceMediaRecorderRef.current.state !== 'inactive') {
      try {
        voiceMediaRecorderRef.current.stop();
        voiceMediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      } catch (e) {}
    }
    setIsRecordingVoiceNote(false);
    setVoiceNoteSeconds(0);
    voiceChunksRef.current = [];
  };

  const handleSendVideoNote = (base64Video) => {
    if (!base64Video) return;
    const encrypted = encryptText(base64Video);
    const tempId = 'temp_vid_' + Date.now();
    const activeRole = roleRef.current || role || 'user';
    const optMsg = {
      _id: tempId,
      clientMsgId: tempId,
      room: GLOBAL_ROOM,
      senderRole: activeRole,
      encryptedText: encrypted,
      text: base64Video,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMedia: true,
      mediaType: 'video_note'
    };
    setStealthMessages(prev => [...prev, optMsg]);
    playSentSound();
    dispatchStealthMessage({
      encryptedText: encrypted,
      isMedia: true,
      mediaType: 'video_note',
      clientMsgId: tempId
    });
  };

  const handleSendInstantPhoto = (base64Photo) => {
    if (!base64Photo) return;
    const encrypted = encryptText(base64Photo);
    const tempId = 'temp_photo_' + Date.now();
    const activeRole = roleRef.current || role || 'user';
    const optMsg = {
      _id: tempId,
      clientMsgId: tempId,
      room: GLOBAL_ROOM,
      senderRole: activeRole,
      encryptedText: encrypted,
      text: base64Photo,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMedia: true,
      mediaType: 'photo'
    };
    setStealthMessages(prev => [...prev, optMsg]);
    playSentSound();
    dispatchStealthMessage({
      encryptedText: encrypted,
      isMedia: true,
      mediaType: 'photo',
      clientMsgId: tempId
    });
  };

  const handleSendSticker = (stickerUrl) => {
    if (!stickerUrl) return;
    const encrypted = encryptText(stickerUrl);
    const tempId = 'temp_stk_' + Date.now();
    const activeRole = roleRef.current || role || 'user';
    const optMsg = {
      _id: tempId,
      clientMsgId: tempId,
      room: GLOBAL_ROOM,
      senderRole: activeRole,
      encryptedText: encrypted,
      text: stickerUrl,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMedia: true,
      mediaType: 'sticker'
    };
    setStealthMessages(prev => [...prev, optMsg]);
    playSentSound();
    dispatchStealthMessage({
      encryptedText: encrypted,
      isMedia: true,
      mediaType: 'sticker',
      clientMsgId: tempId
    });
    setShowWhatsAppMediaTray(false);
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

  const processAndSendImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const encrypted = encryptText(base64Data);

      if (socketRef.current) {
        socketRef.current.emit('send_stealth_msg', {
          room: GLOBAL_ROOM,
          role,
          encryptedText: encrypted,
          isMedia: true
        });
        playSentSound();
        if (wpChatScrollRef.current) {
          wpChatScrollRef.current.scrollTop = wpChatScrollRef.current.scrollHeight;
        }
      }
    };
    reader.readAsDataURL(file);
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

  const downloadPendingPDF = (e) => {
    if (e) e.stopPropagation();
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

  const handleScrollToMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const el = document.getElementById(`stealth-msg-${targetMsgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => setHighlightedMsgId(null), 1800);
    }
  };

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

  const handleHtml5Play = () => {
    const videoEl = html5LocalVideoRef.current || html5VideoRef.current;
    if (isMovieRemoteTriggerRef.current || !videoEl) return;
    setIsMoviePlaying(true);
    if (socketRef.current) {
      socketRef.current.emit('codex_movie_sync', {
        room: GLOBAL_ROOM,
        state: 'PLAY',
        currentTime: videoEl.currentTime || 0,
        timestamp: Date.now()
      });
    }
  };

  const handleHtml5Pause = () => {
    const videoEl = html5LocalVideoRef.current || html5VideoRef.current;
    if (isMovieRemoteTriggerRef.current || !videoEl) return;
    setIsMoviePlaying(false);
    if (socketRef.current) {
      socketRef.current.emit('codex_movie_sync', {
        room: GLOBAL_ROOM,
        state: 'PAUSE',
        currentTime: videoEl.currentTime || 0,
        timestamp: Date.now()
      });
    }
  };

  const handleHtml5Seeked = () => {
    const videoEl = html5LocalVideoRef.current || html5VideoRef.current;
    if (isMovieRemoteTriggerRef.current || !videoEl) return;
    if (socketRef.current) {
      socketRef.current.emit('codex_movie_sync', {
        room: GLOBAL_ROOM,
        state: videoEl.paused ? 'PAUSE' : 'PLAY',
        currentTime: videoEl.currentTime || 0,
        timestamp: Date.now()
      });
    }
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

  const handleSendTogepiMessage = (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;
    const clean = textToSend.trim();
    const msgObj = { 
      sender: role, 
      text: clean, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setTogepiChatHistory(prev => [...prev, msgObj]);
    setTogepiInput('');

    if (socketRef.current) {
      socketRef.current.emit('togepi_movie_chat', { room: GLOBAL_ROOM, senderRole: role, text: clean });
    }
    playSentSound();
  };

  const handleUniversalSyncRealign = () => {
    let currTime = 0;
    let currState = 'PAUSE';

    if (codexEngine === 'youtube') {
      if (codexYTPlayerRef.current && typeof codexYTPlayerRef.current.getCurrentTime === 'function') {
        currTime = codexYTPlayerRef.current.getCurrentTime() || 0;
        const s = typeof codexYTPlayerRef.current.getPlayerState === 'function' ? codexYTPlayerRef.current.getPlayerState() : 2;
        currState = s === 1 ? 'PLAY' : 'PAUSE';
      }
    } else {
      const videoEl = html5LocalVideoRef.current || html5VideoRef.current;
      if (videoEl) {
        currTime = videoEl.currentTime || 0;
        currState = videoEl.paused ? 'PAUSE' : 'PLAY';
      }
    }

    setSyncDelayGapText('⚡ Realigned (0.0s gap)');
    if (delayGapTimeoutRef.current) clearTimeout(delayGapTimeoutRef.current);
    delayGapTimeoutRef.current = setTimeout(() => setSyncDelayGapText(''), 3500);

    if (socketRef.current) {
      socketRef.current.emit('codex_force_realign', {
        room: GLOBAL_ROOM,
        engine: codexEngine,
        state: currState,
        currentTime: currTime,
        timestamp: Date.now(),
        senderRole: role
      });
    }
  };

  useEffect(() => {
    const checkAutoDownload = () => {
      const now = new Date();
      // Auto-download check at 7:20 PM (19:20)
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      if (currentHours === 19 && currentMinutes === 20) {
        if (!autoDownloadedRef.current) {
          autoDownloadedRef.current = true;
          downloadFullChatPDF();
        }
      } else {
        autoDownloadedRef.current = false;
      }
    };

    checkAutoDownload();
    const timerInterval = setInterval(checkAutoDownload, 15000);
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        escPressCount.current += 1;
        if (escPressCount.current === 1) {
          if (escTimer.current) clearTimeout(escTimer.current);
          escTimer.current = setTimeout(() => { 
            escPressCount.current = 0; 
          }, 400);
        } else if (escPressCount.current === 2) {
          if (escTimer.current) clearTimeout(escTimer.current);
          escPressCount.current = 0;
          setViewMode('real_gpt');
          setShowPendingModal(false);
          setShowMiniEmojiBar(false);
          setIncomingAlert(null);
          setIsBotOpen(false);
          setActiveViewImage(null);
          setActiveReactionMsgId(null);
          setShowTogepiMenu(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    viewModeRef.current = viewMode;
    if (viewMode === 'codex' && playerRef.current && isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, [viewMode, isPlaying]);

  useEffect(() => {
    isWhatsAppViewRef.current = isWhatsAppView;
    if (isWhatsAppView) {
      markMessagesAsSeen();
    }
  }, [isWhatsAppView, markMessagesAsSeen]);

  useEffect(() => {
    roleRef.current = role;
    if (viewMode === 'admin_dashboard' && role !== 'parent') {
      setViewMode('real_gpt');
    }
  }, [role, viewMode]);

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
                const playerInst = pendingRestoreRef.current;
                pendingRestoreRef.current = null;
                isRemoteTriggerRef.current = true;
                playerRef.current.loadVideoById({
                  videoId: playerInst.videoId,
                  startSeconds: playerInst.currentTime || 0
                });
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
                if (playerInst.state === 'PLAY' && viewModeRef.current !== 'codex') {
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
      } catch (e) {}
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
    // 1. Register Service Worker on all browsers (including iOS Safari)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(async (reg) => {
        swRegistrationRef.current = reg;
        try { 
          reg.update(); 
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  window.location.reload();
                }
              });
            }
          });
        } catch (e) {}
        if ('PushManager' in window) {
          try {
            let subscription = await reg.pushManager.getSubscription();
            if (!subscription) {
              subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array("BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_WJJjzWDMWJKEusEK66q5mt0oBN431Mnv31JA")
              });
            }
            await fetch(`${SOCKET_URL}/api/save-subscription`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription)
            });
          } catch (err) {
            console.warn("Push subscription failed or rejected:", err);
          }
        }
      }).catch(err => {
        console.warn("SW Registration Error:", err);
      });
    }

    // 2. Listen for PWA beforeinstallprompt on Android & Desktop
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Detect if already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsAppInstalled(true);
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Real-Time Foreground App Presence Sync & Continuous Heartbeat Ping
  useEffect(() => {
    const activeRole = roleRef.current || role || localStorage.getItem('stealth_role') || 'user';

    const sendPresence = (isFg = document.visibilityState === 'visible') => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('presence_ping', {
          room: GLOBAL_ROOM,
          role: activeRole,
          isForeground: isFg
        });
      }
    };

    // Send immediately on connect / role change
    sendPresence();

    // 4-second continuous presence heartbeat
    const heartbeatTimer = setInterval(() => {
      sendPresence();
    }, 4000);

    const handleVisibility = () => {
      const isFg = document.visibilityState === 'visible';
      sendPresence(isFg);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('blur', handleVisibility);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('blur', handleVisibility);
    };
  }, [isConnected, role]);

  // Persist Dual Love Balance to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('stealth_love_balance', loveBalance.toString());
      localStorage.setItem('stealth_admin_love_balance', adminLoveBalance.toString());
      localStorage.setItem('stealth_love_ledger', JSON.stringify(loveLedger));
      localStorage.setItem('stealth_wish_requests', JSON.stringify(wishRequests));
    } catch (e) {
      console.warn("Storage quota limit reached for love balance:", e);
    }
  }, [loveBalance, adminLoveBalance, loveLedger, wishRequests]);

  // Sync Daily Routine Tasks & Submissions
  useEffect(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('daily_task_request_sync', { date: dailySelectedDate });
    }
  }, [dailySelectedDate, isConnected]);

  const requestNotificationAccess = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        return perm;
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
    return 'denied';
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(perm => {
            setNotificationPermission(perm);
          }).catch(() => {});
        } else {
          setNotificationPermission(Notification.permission);
        }
      }
    } catch (e) {}
  }, []);

  const triggerMobileNotification = useCallback((incomingText, senderRole) => {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const senderTag = senderRole === 'parent' ? 'Darsh' : 'Dora';
    const title = `ChatGPT • ${senderTag}`;

    const bodyText = incomingText 
      ? `• ${incomingText.length > 50 ? incomingText.substring(0, 47) + '...' : incomingText}`
      : '• New message received';

    const options = {
      body: bodyText,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'stealth_chat_message',
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
  } catch (err) {
    console.warn("triggerMobileNotification failed:", err);
  }
  }, []);

  const handleLoveBalanceTransaction = useCallback((amount, type, reason, isBroadcast = false, target = 'user', extraData = null) => {
    const numAmount = Math.abs(parseFloat(amount) || 0);
    if (numAmount === 0) return;
    const finalDelta = type === 'credit' ? numAmount : -numAmount;

    if (target === 'user') {
      setLoveBalance(prev => {
        const next = parseFloat((prev + finalDelta).toFixed(2));
        try { localStorage.setItem('stealth_love_balance', next.toString()); } catch(e) {}
        return next;
      });
    } else {
      setAdminLoveBalance(prev => {
        const next = parseFloat((prev + finalDelta).toFixed(2));
        try { localStorage.setItem('stealth_admin_love_balance', next.toString()); } catch(e) {}
        return next;
      });
    }

    const nowStr = new Date().toLocaleString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + 1);
    const expStr = expDate.toLocaleDateString('en-GB');

    const targetLabel = target === 'user' ? activeDoraName : 'Darsh';
    const cleanReason = reason || (type === 'credit' ? 'Love Balance Reward' : (type === 'redeem' ? 'Wish Redeemed' : 'Love Balance Deduction'));
    const customTxId = extraData && extraData.customId;
    const newEntry = {
      id: customTxId || ('lb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      sl: 1,
      target: target,
      description: '[' + targetLabel + '] ' + cleanReason,
      earnedAt: (extraData && extraData.earnedAt) || nowStr,
      expireDate: expStr,
      points: type === 'credit' ? numAmount : -numAmount,
      type: type,
      remarks: (extraData && extraData.remarks) || cleanReason,
      messageSnippet: (extraData && extraData.messageSnippet) || undefined,
      status: type === 'credit' ? 'Confirmed' : (type === 'redeem' ? 'Redeemed' : 'Deducted'),
      wishTitle: (extraData && extraData.title) || (type === 'redeem' ? cleanReason.replace(/^Redeemed:\s*/i, '') : undefined),
      wishIcon: (extraData && extraData.icon) || '🎁',
      wishCost: numAmount,
      fulfillmentStatus: type === 'redeem' ? 'Pending' : undefined
    };

    setLoveLedger(prev => {
      if (prev && prev.some(e => e && e.id === newEntry.id)) return prev;
      const nextLedger = [newEntry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
      try { localStorage.setItem('stealth_love_ledger', JSON.stringify(nextLedger)); } catch(e) {}
      return nextLedger;
    });

    if (type === 'credit' && !isBroadcast) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 } });
        playPointEarnedSound();
      } catch (e) {}
    }

    if (!isBroadcast && socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'TRANSACTION',
        target: target,
        amount: numAmount,
        type: type,
        reason: reason,
        extraData: extraData,
        newEntry: newEntry,
        senderRole: roleRef.current || role || 'user',
        timestamp: Date.now()
      });
    }
  }, [role]);

  // --- SMOOTH ERROR-LESS LONG PRESS CONTROLLER FOR ADMIN STEALTH TOGGLE ---
  const handleThinkPointerDown = useCallback((e) => {
    if (role !== 'parent') return;
    thinkTriggeredRef.current = false;
    setIsPressingThink(true);
    if (thinkLongPressTimerRef.current) clearTimeout(thinkLongPressTimerRef.current);

    thinkLongPressTimerRef.current = setTimeout(() => {
      thinkTriggeredRef.current = true;
      setIsPressingThink(false);
      try {
        if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
      } catch (err) {}
      setViewMode(prev => prev === 'stealth' ? 'real_gpt' : 'stealth');
    }, 420); // 420ms smooth, responsive hold
  }, [role]);

  const handleThinkPointerUp = useCallback((e) => {
    setIsPressingThink(false);
    if (thinkLongPressTimerRef.current) {
      clearTimeout(thinkLongPressTimerRef.current);
      thinkLongPressTimerRef.current = null;
    }
    if (thinkTriggeredRef.current) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, []);

  const handleThinkPointerCancel = useCallback(() => {
    setIsPressingThink(false);
    if (thinkLongPressTimerRef.current) {
      clearTimeout(thinkLongPressTimerRef.current);
      thinkLongPressTimerRef.current = null;
    }
  }, []);


  // --- REAL-TIME AUTOMATIC LOVE KARMA / LOVE BALANCE RULES ENGINE (2-WAY FOR BOTH DORA & DARSH) ---
  const evaluateLoveKarmaMessageRules = useCallback((messageText, senderRole, prevMessage = null) => {
    if (!messageText || typeof messageText !== 'string') return;
    const cleanText = messageText.trim();
    if (!cleanText) return;

    const targetUser = (senderRole === 'parent' || senderRole === 'admin' || senderRole === 'H') ? 'admin' : 'user';
    const now = new Date();
    const currentHour = now.getHours();
    const cleanLower = cleanText.toLowerCase();

    // 1. Virtual Hug / Kiss / Heart Emoji (+0.40 Point) - 5-MIN COOLDOWN
    const lastHeartKey = 'lb_last_heart_' + targetUser;
    const lastHeartTime = Number(localStorage.getItem(lastHeartKey) || 0);
    if (ROMANTIC_REGEX.test(cleanText)) {
      if (Date.now() - lastHeartTime >= 5 * 60 * 1000) {
        localStorage.setItem(lastHeartKey, Date.now().toString());
        handleLoveBalanceTransaction(0.40, 'credit', 'Virtual Hug / Kiss / Heart Emoji Shared (❤️)', false, targetUser);
      }
    }

    // 2. Morning Sweet Text before 10:00 AM (+2 Points)
    if (currentHour >= 5 && currentHour < 10) {
      const todayDateKey = 'lb_morning_' + targetUser + '_' + now.toDateString();
      if (!localStorage.getItem(todayDateKey)) {
        localStorage.setItem(todayDateKey, 'true');
        handleLoveBalanceTransaction(2.00, 'credit', 'Morning Sweet Text (Before 10:00 AM)', false, targetUser);
      }
    }

    // 3. Instant Reply within 5 minutes (+1 Point) - 5-MIN COOLDOWN
    // Checked when either user replies to a message sent by counterpart within 5 mins
    const lastInstantKey = 'lb_last_instant_' + targetUser;
    const lastInstantTime = Number(localStorage.getItem(lastInstantKey) || 0);
    const isCounterpartMsg = prevMessage && (
      targetUser === 'user'
        ? (prevMessage.senderRole === 'parent' || prevMessage.senderRole === 'admin' || prevMessage.senderRole === 'H')
        : (prevMessage.senderRole === 'user' || prevMessage.senderRole === 'A')
    );
    if (isCounterpartMsg && prevMessage.timestamp) {
      const diffMs = Math.abs(Date.now() - new Date(prevMessage.timestamp).getTime());
      if (diffMs <= 5 * 60 * 1000 && (Date.now() - lastInstantTime >= 4 * 60 * 1000)) {
        localStorage.setItem(lastInstantKey, Date.now().toString());
        handleLoveBalanceTransaction(1.00, 'credit', 'Instant Reply (Within 5 Mins)', false, targetUser);
      }
    }

    // 4. Food / Meal Care Check-in (+2 Points) - 30-MIN COOLDOWN
    const lastFoodKey = 'lb_last_food_' + targetUser;
    const lastFoodTime = Number(localStorage.getItem(lastFoodKey) || 0);
    const foodKeywords = ['khana', 'khaana', 'lunch', 'dinner', 'breakfast', 'nashta', 'meal', 'eat', 'khaya', 'khao', 'khali', 'food'];
    const hasFoodCheck = foodKeywords.some(kw => cleanLower.includes(kw));
    if (hasFoodCheck && (cleanLower.includes('?') || cleanLower.includes('khaya') || cleanLower.includes('khao') || cleanLower.includes('eat') || cleanLower.includes('lunch') || cleanLower.includes('dinner'))) {
      if (Date.now() - lastFoodTime >= 30 * 60 * 1000) {
        localStorage.setItem(lastFoodKey, Date.now().toString());
        handleLoveBalanceTransaction(2.00, 'credit', 'Food / Meal Care Check-in', false, targetUser);
      }
    }

    // 5. Compliment Drop & Romantic Sweet Talk (+3 Points) - 15-MIN COOLDOWN
    const lastComplimentKey = 'lb_last_compliment_' + targetUser;
    const lastComplimentTime = Number(localStorage.getItem(lastComplimentKey) || 0);
    const complimentWords = [
      'love you', 'love u', 'i love you', 'i love u', 'ily', 'loveyou',
      'miss you', 'miss u', 'cute', 'sundar', 'pyaari', 'pyari', 'handsome',
      'so sweet', 'sweetheart', 'darling', 'proud of you', 'meri jaan',
      'babu', 'shona', 'tareef', 'pyaar', 'kiss', 'muah', 'hug', 'hugs',
      'jaan', 'jaana', 'baby', 'cutie'
    ];
    const hasCompliment = complimentWords.some(w => cleanLower.includes(w));
    if (hasCompliment) {
      if (Date.now() - lastComplimentTime >= 15 * 60 * 1000) {
        localStorage.setItem(lastComplimentKey, Date.now().toString());
        handleLoveBalanceTransaction(3.00, 'credit', 'Romantic Compliment Drop', false, targetUser);
      }
    }

    // 6. Long Romantic Paragraph (+10 Points) - 30-MIN COOLDOWN
    const lastLongKey = 'lb_last_long_' + targetUser;
    const lastLongTime = Number(localStorage.getItem(lastLongKey) || 0);
    if (cleanText.length >= 70) {
      if (Date.now() - lastLongTime >= 30 * 60 * 1000) {
        localStorage.setItem(lastLongKey, Date.now().toString());
        handleLoveBalanceTransaction(10.00, 'credit', 'Deep Romantic Long Message', false, targetUser);
      }
    }

    // 7. Dry Reply Check (-2 Points) - 10-MIN COOLDOWN
    const lastDryKey = 'lb_last_dry_' + targetUser;
    const lastDryTime = Number(localStorage.getItem(lastDryKey) || 0);
    if (prevMessage && prevMessage.senderRole !== senderRole && prevMessage.text && prevMessage.text.length > 35) {
      const dryWords = ['hmm', 'ok', 'k', 'acha', 'thik', 'humm', 'kk'];
      if (dryWords.includes(cleanLower)) {
        if (Date.now() - lastDryTime >= 10 * 60 * 1000) {
          localStorage.setItem(lastDryKey, Date.now().toString());
          handleLoveBalanceTransaction(2.00, 'debit', 'Dry Single-Word Reply ("Hmm"/"Ok")', false, targetUser);
        }
      }
    }
  }, [handleLoveBalanceTransaction]);

  // --- REAL-TIME AUTHORITATIVE SYNC TRIGGER ---
  // The backend server is the STRICT SINGLE SOURCE OF TRUTH for habits, routine tasks, and ledger transactions.
  // The client requests synchronization from backend so no client device ever drifts or invents local transactions.
  const checkDailyHabitInfractions = useCallback(() => {
    fetch(`${BACKEND_URL}/api/love-balance/evaluate`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          if (typeof data.loveBalance === 'number') {
            setLoveBalance(data.loveBalance);
            try { localStorage.setItem('stealth_love_balance', data.loveBalance.toString()); } catch(e) {}
          }
          if (typeof data.adminLoveBalance === 'number') {
            setAdminLoveBalance(data.adminLoveBalance);
            try { localStorage.setItem('stealth_admin_love_balance', data.adminLoveBalance.toString()); } catch(e) {}
          }
          if (Array.isArray(data.loveLedger)) {
            setLoveLedger(data.loveLedger);
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(data.loveLedger)); } catch(e) {}
          }
        }
      })
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/daily-tasks/sync`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.slots)) {
          const activeDel = Array.isArray(data.deletedSlotIds) ? data.deletedSlotIds : JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
          const cleanSlots = sortSlotsByTime(data.slots.filter(s => s && !activeDel.includes(s.id)));
          setDailySlots(cleanSlots);
          try { localStorage.setItem('stealth_daily_slots', JSON.stringify(cleanSlots)); } catch(e) {}
        }
      })
      .catch(() => {});

    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', { room: GLOBAL_ROOM, action: 'REQUEST_SYNC' });
      socketRef.current.emit('daily_task_request_sync', { date: dailySelectedDate });
    }
  }, [dailySelectedDate]);

  useEffect(() => {
    checkDailyHabitInfractionsRef.current = checkDailyHabitInfractions;
  }, [checkDailyHabitInfractions]);

  // Periodic Real-Time Sync Request from Backend (Every 20s)
  useEffect(() => {
    checkDailyHabitInfractions();
    const interval = setInterval(() => {
      checkDailyHabitInfractions();
    }, 20000);
    return () => clearInterval(interval);
  }, [checkDailyHabitInfractions]);

  // Request authoritative initial sync from backend upon connection
  useEffect(() => {
    if (socketRef.current && isConnected) {
      const activeDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
      const activeDelTxs = JSON.parse(localStorage.getItem('stealth_deleted_tx_ids') || '[]');
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'REQUEST_SYNC',
        deletedSlotIds: activeDel,
        deletedTransactionIds: activeDelTxs,
        senderRole: roleRef.current || role || 'user',
        timestamp: Date.now()
      });
      socketRef.current.emit('daily_task_request_sync', { date: dailySelectedDate });
    }
  }, [isConnected, dailySelectedDate, role]);


  const handleOpenClearModal = useCallback((target = null) => {
    setClearModalTarget(target || activeLbTarget || 'user');
    setShowClearConfirmModal(true);
  }, [activeLbTarget]);

  const handleConfirmClearLedger = useCallback(() => {
    const target = clearModalTarget; // 'user', 'admin', or 'both'

    if (target === 'user') {
      setLoveBalance(0);
      localStorage.setItem('stealth_love_balance', '0');
      setLoveLedger(prev => {
        const next = prev.filter(e => e.target === 'admin' || (e.description && e.description.includes('[Darsh]')));
        localStorage.setItem('stealth_love_ledger', JSON.stringify(next));
        return next;
      });
    } else if (target === 'admin') {
      setAdminLoveBalance(0);
      localStorage.setItem('stealth_admin_love_balance', '0');
      setLoveLedger(prev => {
        const next = prev.filter(e => e.target !== 'admin' && !(e.description && e.description.includes('[Darsh]')));
        localStorage.setItem('stealth_love_ledger', JSON.stringify(next));
        return next;
      });
    } else { // 'both'
      setLoveBalance(0);
      setAdminLoveBalance(0);
      localStorage.setItem('stealth_love_balance', '0');
      localStorage.setItem('stealth_admin_love_balance', '0');
      setLoveLedger([]);
      localStorage.setItem('stealth_love_ledger', '[]');
    }

    try {
      const now = new Date();
      const todayStr = getLocalDateString(now);
      const yesterday = new Date(now.getTime() - 86400000);
      const yesterdayStr = getLocalDateString(yesterday);
      const evals = JSON.parse(localStorage.getItem('stealth_habit_evals') || '{}');
      if (!evals[todayStr]) evals[todayStr] = {};
      evals[todayStr].doraMorningEvaluated = true;
      evals[todayStr].darshMorningEvaluated = true;
      evals[todayStr].doraNightEvaluated = true;
      evals[todayStr].darshNightEvaluated = true;
      if (!evals[todayStr].slotsEvaluated) evals[todayStr].slotsEvaluated = {};
      (dailySlots || []).forEach(s => { evals[todayStr].slotsEvaluated[s.id] = true; });

      if (!evals[yesterdayStr]) evals[yesterdayStr] = {};
      evals[yesterdayStr].doraMorningEvaluated = true;
      evals[yesterdayStr].darshMorningEvaluated = true;
      evals[yesterdayStr].doraNightEvaluated = true;
      evals[yesterdayStr].darshNightEvaluated = true;
      if (!evals[yesterdayStr].slotsEvaluated) evals[yesterdayStr].slotsEvaluated = {};
      (dailySlots || []).forEach(s => { evals[yesterdayStr].slotsEvaluated[s.id] = true; });

      localStorage.setItem('stealth_habit_evals', JSON.stringify(evals));
      localStorage.setItem('stealth_last_cleared_at', Date.now().toString());
    } catch(e) {}

    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'CLEAR_LEDGER',
        target: target,
        resetBalance: true,
        senderRole: roleRef.current || role || 'user',
        timestamp: Date.now()
      });
    }

    setShowClearConfirmModal(false);
  }, [clearModalTarget, role, dailySlots]);

  const handleDeleteTransaction = useCallback((txId) => {
    if (!txId) return;
    setLoveLedger(prev => {
      const next = prev.filter(e => e.id !== txId);
      try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
      return next;
    });
    try {
      const delTxs = JSON.parse(localStorage.getItem('stealth_deleted_tx_ids') || '[]');
      delTxs.push(txId);
      localStorage.setItem('stealth_deleted_tx_ids', JSON.stringify(delTxs));
    } catch(e) {}

    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'DELETE_TRANSACTION',
        transactionId: txId,
        senderRole: roleRef.current || role || 'user',
        timestamp: Date.now()
      });
    }
  }, [role]);

  const handleAdminOverrideBalance = useCallback((target, newBal) => {
    const val = parseFloat(newBal);
    if (isNaN(val)) {
      alert("Please enter a valid balance amount.");
      return;
    }
    const current = target === 'admin' ? adminNetBalance : doraNetBalance;
    const diff = parseFloat((val - current).toFixed(2));
    if (diff !== 0) {
      const type = diff > 0 ? 'credit' : 'debit';
      const numAmount = Math.abs(diff);
      handleLoveBalanceTransaction(numAmount, type, `Admin Balance Adjustment (${diff > 0 ? '+' : ''}${diff.toFixed(2)})`, false, target);
    }
    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'OVERRIDE_BALANCE',
        target: target,
        newBalance: val,
        senderRole: roleRef.current || 'admin',
        timestamp: Date.now()
      });
    }
    setAdminOverrideVal('');
    alert(`Success: ${target === 'user' ? `${activeDoraName}'s` : "Darsh's"} Love Balance set to ₹ ${val.toFixed(2)}!`);
  }, [activeDoraName, adminNetBalance, doraNetBalance, handleLoveBalanceTransaction]);

  const handleSendLoveNudge = useCallback((target) => {
    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'LOVE_NUDGE',
        target: target,
        message: target === 'user' ? "💖 Darsh sent you a sweet Love Nudge!" : `💖 ${activeDoraName} sent you a Love Nudge!`,
        senderRole: roleRef.current || 'admin',
        timestamp: Date.now()
      });
      alert('Love Nudge dispatched to ' + (target === 'user' ? activeDoraName : 'Darsh') + '!');
    }
  }, [activeDoraName]);

  const compressImage = (file, maxWidth = 960, quality = 0.65) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleDailyImageSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      if (!compressed) return;
      setDailyImageProof(compressed);

      if (roleRef.current === 'parent' || role === 'parent') {
        alert(`Task upload is only for ${activeDoraName}. Admin (Darsh) reviews and approves.`);
        return;
      }

      const targetSlotId = dailySelectedSlotId || (dailySlots[0] && dailySlots[0].id);
      if (!targetSlotId) return;

      const selectedSlot = dailySlots.find(s => s.id === targetSlotId);
      const submissionId = 'sub_' + dailySelectedDate + '_' + targetSlotId;
      const submissionData = {
        id: submissionId,
        date: dailySelectedDate,
        slotId: targetSlotId,
        slotTitle: selectedSlot ? selectedSlot.title : 'Routine Task',
        note: '',
        image: compressed,
        userRole: roleRef.current || role || 'user',
        status: 'PENDING',
        pointsAwarded: 0,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        adminFeedback: ''
      };

      // 1. Instant optimistic local update
      setDailySubmissions(prev => {
        const filtered = prev.filter(s => s.id !== submissionId);
        const updated = [...filtered, submissionData];
        try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      // 2. Dual-channel socket emission for 100% reliable instant delivery
      if (socketRef.current) {
        socketRef.current.emit('daily_task_submit', submissionData);
        socketRef.current.emit('love_balance_action', {
          room: GLOBAL_ROOM,
          action: 'DAILY_TASK_SUBMIT',
          submission: submissionData,
          senderRole: 'user',
          timestamp: Date.now()
        });
        socketRef.current.emit('togepi_movie_chat', {
          room: GLOBAL_ROOM,
          senderRole: 'user',
          text: '__TASK_SUBMIT__:' + JSON.stringify(submissionData),
          timestamp: Date.now()
        });
      }

      alert(`✨ Photo Proof for "${selectedSlot ? selectedSlot.title : 'Routine Task'}" attached!\n\nStatus is now Under Review (⏳) by Darsh. Points will be awarded once approved!`);
    } catch (err) {
      console.warn('Image processing error:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleDailyTaskSubmit = () => {
    if (roleRef.current === 'parent' || role === 'parent') {
      alert(`Task upload is only for ${activeDoraName}. Admin (Darsh) reviews and approves.`);
      return;
    }
    if (!dailySelectedSlotId) return;
    if (!dailyImageProof) {
      alert("📸 Photo Proof is compulsory! Please tap the ➕ camera button to capture or attach a photo before submitting.");
      return;
    }
    const selectedSlot = dailySlots.find(s => s.id === dailySelectedSlotId);
    const submissionId = 'sub_' + dailySelectedDate + '_' + dailySelectedSlotId;
    const submissionData = {
      id: submissionId,
      date: dailySelectedDate,
      slotId: dailySelectedSlotId,
      slotTitle: selectedSlot ? selectedSlot.title : 'Routine Task',
      note: dailyNoteInput.trim(),
      image: dailyImageProof,
      userRole: roleRef.current || role || 'user',
      status: 'PENDING',
      pointsAwarded: 0,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      adminFeedback: ''
    };

    // 1. Instant optimistic local update
    setDailySubmissions(prev => {
      const filtered = prev.filter(s => s.id !== submissionId);
      const updated = [...filtered, submissionData];
      try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });

    // 2. Dual-channel socket emission for 100% reliable instant delivery
    if (socketRef.current) {
      socketRef.current.emit('daily_task_submit', submissionData);
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'DAILY_TASK_SUBMIT',
        submission: submissionData,
        senderRole: 'user',
        timestamp: Date.now()
      });
      socketRef.current.emit('togepi_movie_chat', {
        room: GLOBAL_ROOM,
        senderRole: 'user',
        text: '__TASK_SUBMIT__:' + JSON.stringify(submissionData),
        timestamp: Date.now()
      });
    }

    setDailyNoteInput('');
    setDailyImageProof('');
    alert("✨ Task submitted with photo proof! Status is now PENDING REVIEW by Darsh. Points will be awarded once approved!");
  };

  const handleApproveDailyTask = (sub) => {
    if (!sub) return;
    const slot = dailySlots.find(s => s.id === sub.slotId);
    const pts = slot ? Number(slot.rewardPoints || 2.0) : 2.0;
    const slotTitle = slot ? slot.title : 'Routine Task';

    // 1. Optimistic update (matches by id OR by slotId + date so retakes immediately turn green ✓ Done)
    setDailySubmissions(prev => {
      let matched = false;
      const updated = prev.map(s => {
        if (s.id === sub.id || (s.slotId === sub.slotId && (!sub.date || s.date === sub.date))) {
          matched = true;
          return {
            ...s,
            status: 'APPROVED',
            pointsAwarded: pts,
            reviewedAt: new Date().toISOString(),
            adminFeedback: 'Approved by Darsh'
          };
        }
        return s;
      });
      if (!matched) {
        updated.push({
          ...sub,
          status: 'APPROVED',
          pointsAwarded: pts,
          reviewedAt: new Date().toISOString(),
          adminFeedback: 'Approved by Darsh'
        });
      }
      try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });

    // 2. Award Love Balance to Dora (deduplicated by submission ID)
    const approvalId = 'lb_appr_' + (sub.id || `${sub.date}_${sub.slotId}`);
    if (!loveLedger.some(e => e.id === approvalId)) {
      handleLoveBalanceTransaction(pts, 'credit', `Approved Task: ${slotTitle}`, false, 'user', { approvalId, customId: approvalId });
    }

    // 3. Dual-channel emission
    if (socketRef.current) {
      socketRef.current.emit('daily_task_approve', {
        submissionId: sub.id,
        slotId: sub.slotId,
        date: sub.date,
        points: pts,
        feedback: 'Approved by Darsh',
        slotTitle
      });
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'DAILY_TASK_APPROVED',
        submissionId: sub.id,
        slotId: sub.slotId,
        date: sub.date,
        points: pts,
        slotTitle,
        senderRole: 'admin',
        timestamp: Date.now()
      });
      socketRef.current.emit('togepi_movie_chat', {
        room: GLOBAL_ROOM,
        senderRole: 'parent',
        text: '__TASK_APPROVE__:' + JSON.stringify({ submissionId: sub.id, slotId: sub.slotId, points: pts, date: sub.date }),
        timestamp: Date.now()
      });
    }

    try {
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.4 } });
    } catch(e) {}
  };

  const handleRejectDailyTask = (sub) => {
    if (!sub) return;
    let reason = "Please retake with a clear proof photo";
    try {
      const input = window.prompt("Enter reason for requesting retake:", reason);
      if (input === null) return;
      if (input.trim()) reason = input.trim();
    } catch(e) {}

    // 1. Optimistic update
    setDailySubmissions(prev => {
      const updated = prev.map(s => s.id === sub.id ? { ...s, status: 'REJECTED', adminFeedback: reason, reviewedAt: new Date().toISOString() } : s);
      try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });

    // 2. Dual-channel emission
    if (socketRef.current) {
      socketRef.current.emit('daily_task_reject', {
        submissionId: sub.id,
        feedback: reason
      });
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'DAILY_TASK_REJECTED',
        submissionId: sub.id,
        feedback: reason,
        senderRole: 'admin',
        timestamp: Date.now()
      });
      socketRef.current.emit('togepi_movie_chat', {
        room: GLOBAL_ROOM,
        senderRole: 'parent',
        text: '__TASK_REJECT__:' + JSON.stringify({ submissionId: sub.id, slotId: sub.slotId, date: sub.date }),
        timestamp: Date.now()
      });
    }
  };

  const handleCancelSlotModal = useCallback(() => {
    setShowAddSlotModal(false);
    setEditingSlotId(null);
    setSlotFormTitle('');
    setSlotFormTimeRange('');
    setSlotFormTag('Task');
    setSlotFormPoints('2.0');
  }, []);

  const handleSaveSlotForm = () => {
    if (!slotFormTitle.trim() || !slotFormTimeRange.trim()) {
      alert("Please provide both title and time range.");
      return;
    }
    const newReward = parseFloat(slotFormPoints) || 1.0;
    if (editingSlotId) {
      const updates = {
        id: editingSlotId,
        title: slotFormTitle.trim(),
        timeRange: slotFormTimeRange.trim(),
        tag: slotFormTag,
        rewardPoints: newReward,
        isActive: true
      };
      setDailySlots(prev => {
        const updated = prev.map(s => s.id === editingSlotId ? { ...s, ...updates } : s);
        try { localStorage.setItem('stealth_daily_slots', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
      fetch(`${BACKEND_URL}/api/daily-tasks/slots/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(() => {});
      if (socketRef.current) {
        socketRef.current.emit('daily_slot_update', { slotId: editingSlotId, updates });
        socketRef.current.emit('love_balance_action', {
          room: GLOBAL_ROOM,
          action: 'DAILY_SLOT_UPDATE',
          slotId: editingSlotId,
          updates,
          senderRole: roleRef.current || role || 'admin',
          timestamp: Date.now()
        });
      }
    } else {
      const newSlot = {
        id: 'slot_' + Date.now(),
        title: slotFormTitle.trim(),
        timeRange: slotFormTimeRange.trim(),
        tag: slotFormTag,
        rewardPoints: newReward,
        order: dailySlots.length + 1,
        isActive: true
      };
      setDailySlots(prev => {
        const updated = [...prev, newSlot];
        try { localStorage.setItem('stealth_daily_slots', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
      fetch(`${BACKEND_URL}/api/daily-tasks/slots/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot)
      })
      .then(r => r.json())
      .then(res => {
        if (res && Array.isArray(res.slots)) {
          setDailySlots(res.slots);
          try { localStorage.setItem('stealth_daily_slots', JSON.stringify(res.slots)); } catch(e) {}
        }
      })
      .catch(() => {});

      if (socketRef.current) {
        socketRef.current.emit('daily_slot_create', newSlot);
        socketRef.current.emit('love_balance_action', {
          room: GLOBAL_ROOM,
          action: 'DAILY_SLOT_CREATE',
          slot: newSlot,
          senderRole: roleRef.current || role || 'admin',
          timestamp: Date.now()
        });
      }
    }
    handleCancelSlotModal();
  };

  const handleDeleteSlot = async (slotId) => {
    if (!slotId) return;
    const curDeleted = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
    const nextDeleted = Array.from(new Set([...curDeleted, slotId]));
    try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(nextDeleted)); } catch(e) {}
    setDeletedSlotIds(nextDeleted);

    setDailySlots(prev => {
      const updated = prev.filter(s => s && s.id !== slotId && !nextDeleted.includes(s.id));
      try { localStorage.setItem('stealth_daily_slots', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });
    if (socketRef.current) {
      socketRef.current.emit('daily_slot_delete', { slotId, deletedSlotIds: nextDeleted });
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'DAILY_SLOT_DELETE',
        slotId,
        deletedSlotIds: nextDeleted,
        senderRole: roleRef.current || role || 'admin',
        timestamp: Date.now()
      });
      socketRef.current.emit('togepi_movie_chat', {
        room: GLOBAL_ROOM,
        senderRole: 'parent',
        text: `__SLOT_DELETE__:${JSON.stringify({ slotId, deletedSlotIds: nextDeleted })}`
      });
    }

    try {
      await fetch(`${BACKEND_URL}/api/daily-tasks/slots/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, deletedSlotIds: nextDeleted })
      });
    } catch(e) {}
  };

  const handleAskAICoach = async (topic) => {
    setDailyAILoading(true);
    setDailyAITip('');
    try {
      const prompt = `Give a short, friendly, cute and highly motivating 2-sentence tip for a girl's daily routine: Topic: ${topic}. Focus on healthy weight gain, glowing skin, or completing 8000 steps. Keep it sweet, caring, and under 35 words.`;
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a warm, sweet, encouraging personal daily habit and wellness coach." },
            { role: "user", content: prompt }
          ],
          model: "openai",
          seed: Math.floor(Math.random() * 99999)
        })
      });
      if (response.ok) {
        const text = await response.text();
        setDailyAITip(text || "Drink water, stay active, and fuel your body with wholesome calorie-dense treats today!");
      } else {
        setDailyAITip("Remember: Small daily habits build amazing results! Eat well, hydrate, and get those 8,000 steps in today! 💖");
      }
    } catch (e) {
      setDailyAITip("Remember: Small daily habits build amazing results! Eat well, hydrate, and get those 8,000 steps in today! 💖");
    } finally {
      setDailyAILoading(false);
    }
  };

  const handleToggleWishFulfillment = useCallback((wishId) => {
    setLoveLedger(prev => prev.map(item => {
      if (item.id === wishId) {
        const nextStatus = item.fulfillmentStatus === 'Fulfilled' ? 'Pending' : 'Fulfilled';
        return { ...item, fulfillmentStatus: nextStatus };
      }
      return item;
    }));
    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'TOGGLE_FULFILLMENT',
        wishId: wishId,
        senderRole: roleRef.current || 'admin',
        timestamp: Date.now()
      });
    }
  }, []);

  const handleInitiateWishRequest = (wish) => {
    const isDarsh = role === 'parent';
    const requesterRole = isDarsh ? (activeLbTarget === 'admin' ? 'admin' : 'user') : 'user';
    const requesterName = requesterRole === 'admin' ? 'Darsh' : 'Dora';
    const targetName = requesterRole === 'admin' ? 'Dora' : 'Darsh';
    const currentBal = requesterRole === 'admin' ? adminLoveBalance : loveBalance;

    if (currentBal < wish.cost) {
      alert('Insufficient Love Balance! You have ₹ ' + currentBal.toFixed(2) + ', but need ₹ ' + wish.cost.toFixed(2) + '. Earn more Love Balance through sweet messages and caring gestures!');
      return;
    }

    const alreadyPending = wishRequests.some(r => r.wishId === wish.id && r.status === 'PENDING' && r.requesterRole === requesterRole);
    if (alreadyPending) {
      alert('You already have a pending request for "' + wish.title + '". Awaiting ' + targetName + "\'s approval!");
      setLoveModalTab('claimed');
      return;
    }

    const newReq = {
      id: 'wreq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      wishId: wish.id,
      wishTitle: wish.title,
      wishIcon: wish.icon,
      wishCost: wish.cost,
      wishDesc: wish.description,
      requesterRole: requesterRole,
      requesterName: requesterName,
      targetName: targetName,
      requestedAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'PENDING'
    };

    setWishRequests(prev => [newReq, ...prev]);

    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'WISH_REQUEST',
        wishRequest: newReq,
        senderRole: roleRef.current || 'user',
        timestamp: Date.now()
      });
    }

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
    } catch (e) {}

    alert('💌 Wish Request Sent!\n\n"' + wish.title + '" request dispatched to ' + targetName + '.\n\nOnce ' + targetName + ' approves, your ₹ ' + wish.cost.toFixed(2) + ' Love Balance will be redeemed!');
    setLoveModalTab('claimed');
  };

  const handleApproveWishRequest = (req) => {
    // 1. Deduct points from requester in real time and log confirmed transaction
    handleLoveBalanceTransaction(
      req.wishCost,
      'redeem',
      'Redeemed: ' + req.wishTitle,
      false,
      req.requesterRole,
      {
        title: req.wishTitle,
        icon: req.wishIcon,
        cost: req.wishCost,
        approvedBy: role === 'parent' ? 'Darsh' : 'Dora'
      }
    );

    // 2. Mark request as APPROVED
    setWishRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED' } : r));
    setActiveWishApprovalModal(null);

    // 3. Real-time Socket Broadcast
    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'WISH_APPROVED',
        wishRequest: { ...req, status: 'APPROVED' },
        senderRole: roleRef.current || 'admin',
        timestamp: Date.now()
      });
    }

    try {
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.4 } });
    } catch (e) {}

    alert('🎉 Wish Approved!\n\nYou granted "' + req.wishTitle + '" for ' + req.requesterName + '!\n₹ ' + req.wishCost.toFixed(2) + ' Love Balance has been redeemed.');
  };

  const handleDeclineWishRequest = (req) => {
    setWishRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'DECLINED' } : r));
    setActiveWishApprovalModal(null);

    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'WISH_DECLINED',
        wishRequest: { ...req, status: 'DECLINED' },
        senderRole: roleRef.current || 'admin',
        timestamp: Date.now()
      });
    }
    alert('Wish request for "' + req.wishTitle + '" has been declined.');
  };

  useEffect(() => {
    stealthMessagesRef.current = stealthMessages;
    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
    if (wpChatScrollRef.current) {
      wpChatScrollRef.current.scrollTop = wpChatScrollRef.current.scrollHeight;
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

  // --- FULLY RESTORED SOCKET.IO CONNECTION & LISTENERS WITH REAL AUDIO CALL & CODEX CHAT RELAYS ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    const handleVisibilityRecovery = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityRecovery);
    window.addEventListener('focus', handleVisibilityRecovery);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      if (socketRef.current) {
        const curDeleted = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
        const curDelTxs = JSON.parse(localStorage.getItem('stealth_deleted_tx_ids') || '[]');
        socketRef.current.emit('love_balance_action', {
          room: GLOBAL_ROOM,
          action: 'REQUEST_SYNC',
          deletedSlotIds: curDeleted,
          deletedTransactionIds: curDelTxs,
          senderRole: roleRef.current || 'user',
          timestamp: Date.now()
        });
        socketRef.current.emit('daily_task_request_sync', { date: dailySelectedDate });
      }
      const currentRole = localStorage.getItem('stealth_role') || 'user';
      socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: currentRole });
      const savedUser = JSON.parse(localStorage.getItem('stealth_user_profile') || 'null');
      if (savedUser && savedUser.email) {
        socketRef.current.emit('auth_identify', savedUser);
        socketRef.current.emit('togepi_movie_chat', {
          room: GLOBAL_ROOM,
          senderRole: savedUser.role || 'user',
          text: `__USER_ANNOUNCE__:${JSON.stringify(savedUser)}`
        });
      }
      socketRef.current.emit('request_users_directory');
      socketRef.current.emit('couple_game_get_state', { gameId: 'tictactoe' });
      socketRef.current.emit('couple_game_get_state', { gameId: 'ludo' });
      markMessagesAsSeen();
    });

    socketRef.current.on('users_directory_update', (data) => {
      if (data && Array.isArray(data.users)) {
        const cleanUsers = data.users.filter(u => u && u.email && u.email.toLowerCase() !== 'dora@gmail.com');
        setUsersDirectory({
          ...data,
          totalCount: cleanUsers.length,
          onlineCount: cleanUsers.filter(u => u.isOnline).length,
          users: cleanUsers
        });
        try {
          localStorage.setItem('stealth_known_users', JSON.stringify(cleanUsers));
        } catch (e) {}
      }
    });

    socketRef.current.on('dora_status_update', (data) => {
      const { email, isDora, loveBalance, loveLedger } = data || {};
      const clean = (email || '').toLowerCase().trim();
      setUsersDirectory(prev => {
        if (!prev || !Array.isArray(prev.users)) return prev;
        const updated = prev.users.map(u => {
          const isTarget = u.email && u.email.toLowerCase() === clean;
          if (isDora) {
            return {
              ...u,
              isDora: isTarget,
              loveBalance: isTarget && typeof loveBalance === 'number' ? loveBalance : u.loveBalance
            };
          } else {
            return isTarget ? { ...u, isDora: false } : u;
          }
        });
        try {
          localStorage.setItem('stealth_known_users', JSON.stringify(updated));
        } catch (e) {}
        return {
          ...prev,
          users: updated
        };
      });

      if (isDora && typeof loveBalance === 'number') {
        setLoveBalance(loveBalance);
        try { localStorage.setItem('stealth_love_balance', loveBalance.toString()); } catch(e) {}
      }
      if (Array.isArray(loveLedger)) {
        setLoveLedger(loveLedger);
        try { localStorage.setItem('stealth_love_ledger', JSON.stringify(loveLedger)); } catch(e) {}
      }

      setGoogleUser(prev => {
        if (!prev || !prev.email) return prev;
        const isTarget = prev.email.toLowerCase() === clean;
        const updated = {
          ...prev,
          isDora: isDora ? isTarget : (isTarget ? false : prev.isDora),
          loveBalance: isTarget && typeof loveBalance === 'number' ? loveBalance : prev.loveBalance
        };
        try { localStorage.setItem('stealth_user_profile', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
    });

    socketRef.current.on('user_permanently_deleted', ({ email }) => {
      if (!email) return;
      const clean = email.toLowerCase().trim();
      setUsersDirectory(prev => {
        if (!prev || !Array.isArray(prev.users)) return prev;
        const filtered = prev.users.filter(u => (u.email || '').toLowerCase() !== clean);
        try {
          localStorage.setItem('stealth_known_users', JSON.stringify(filtered));
        } catch (e) {}
        return {
          ...prev,
          totalCount: filtered.length,
          users: filtered
        };
      });
      setGoogleUser(prev => {
        if (prev && prev.email && prev.email.toLowerCase() === clean) {
          try {
            localStorage.removeItem('stealth_user_profile');
            localStorage.setItem('stealth_role', 'user');
          } catch(e) {}
          alert("Your account has been removed from this workspace by Admin.");
          return null;
        }
        return prev;
      });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      setIsPeerTyping(false);
    });

    socketRef.current.on('start_audio_call', ({ fromRole }) => {
      const myRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      if (fromRole !== myRole) {
        setIsIncomingCall(true);
        playReceiveSound();
      }
    });

    socketRef.current.on('accept_audio_call', () => {
      setIsIncomingCall(false);
      setIsCalling(false);
      setIsInAudioCall(true);
      playReceiveSound();

      setCallDurationSec(0);
      callDurationRef.current = 0;
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        callDurationRef.current += 1;
        setCallDurationSec(prev => prev + 1);
      }, 1000);

      // Caller creates offer and starts recording
      (async () => {
        const stream = localStreamRef.current || await getLocalAudioStream();
        if (!stream) return;
        const pc = setupPeerConnection(stream);
        startCallRecording(stream);
        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true });
          await pc.setLocalDescription(offer);
          if (socketRef.current) {
            socketRef.current.emit('webrtc_offer', { room: GLOBAL_ROOM, offer });
          }
        } catch (err) {
          console.error("WebRTC create offer error:", err);
        }
      })();
    });

    socketRef.current.on('end_audio_call', () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (callTimerRef.current) clearInterval(callTimerRef.current);

      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) {}
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }
      remoteStreamRef.current = null;
      audioMixerDestRef.current = null;
      pendingIceCandidatesRef.current = [];

      setIsInAudioCall(false);
      setIsIncomingCall(false);
      setIsCalling(false);
      setIsWhisperModeEnabled(false);
      setIsCallMuted(false);
      setCallDurationSec(0);
      callDurationRef.current = 0;
    });

    socketRef.current.on('webrtc_offer', async ({ offer }) => {
      try {
        const stream = localStreamRef.current || await getLocalAudioStream();
        const pc = peerConnectionRef.current || setupPeerConnection(stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        while (pendingIceCandidatesRef.current.length > 0) {
          const c = pendingIceCandidatesRef.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socketRef.current) {
          socketRef.current.emit('webrtc_answer', { room: GLOBAL_ROOM, answer });
        }
      } catch (e) {
        console.error("WebRTC offer handling error:", e);
      }
    });

    socketRef.current.on('webrtc_answer', async ({ answer }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          while (pendingIceCandidatesRef.current.length > 0) {
            const c = pendingIceCandidatesRef.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        }
      } catch (e) {
        console.error("WebRTC answer handling error:", e);
      }
    });

    socketRef.current.on('webrtc_ice_candidate', async ({ candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (e) {
        console.error("ICE candidate error:", e);
      }
    });

    socketRef.current.on('load_history', (history) => {
      const parsed = (history || []).map(m => ({
        ...m,
        text: decryptText(m.encryptedText),
        timeFormatted: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSeen: m.isSeen || false,
        isMedia: m.isMedia || false,
        mediaType: m.mediaType || (m.isMedia ? 'photo' : 'text'),
        mediaOpened: m.mediaOpened || false,
        reaction: m.reaction || null,
        isPinned: Boolean(m.isPinned),
        isStarred: Boolean(m.isStarred)
      }));
      setStealthMessages(parsed);
      markMessagesAsSeen();
      checkDailyHabitInfractions(parsed);
    });

    socketRef.current.on('update_message_pinned', ({ messageId, isPinned }) => {
      setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, isPinned } : m));
    });

    socketRef.current.on('update_message_starred', ({ messageId, isStarred }) => {
      setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, isStarred } : m));
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

    socketRef.current.on('presence_status', (data) => {
      if (data && Array.isArray(data.onlineRoles)) {
        setOnlineRoles(data.onlineRoles);
      }
    });

    socketRef.current.on('arcade_request_received', () => {
      if (role !== 'parent') {
        setIncomingGameRequest(true);
        playReceiveSound();
      }
    });

    socketRef.current.on('toggle_arcade_plugins', (status) => {
      setShowArcadePlugins(status);
      if (!status) {
        setActiveGame(null);
        setIncomingGameRequest(false);
      }
    });

    socketRef.current.on('launch_game_session', (gameObj) => {
      if (gameObj && (gameObj.id === 'ludo' || gameObj === 'ludo')) {
        setShowLudoModal(true);
      } else {
        setActiveGame(gameObj);
      }
      setWinnerMessage('');
      playReceiveSound();
    });

    socketRef.current.on('couple_game_invite_broadcast', (inviteData) => {
      if (!inviteData) return;
      setIncomingGameChallenge(inviteData);
      playReceiveSound();
    });

    const handleIncomingGameBroadcast = (data) => {
      if (!data) return;
      const targetGame = data.gameId || (data.board ? 'tictactoe' : 'ludo');
      const state = data.state || data;
      
      if (targetGame === 'tictactoe') {
        setTictactoeState(prev => ({
          ...prev,
          board: state.board ? [...state.board] : prev.board,
          turn: state.turn || prev.turn,
          betAmount: state.betAmount !== undefined ? state.betAmount : prev.betAmount,
          scores: state.scores || prev.scores,
          winner: state.winner !== undefined ? state.winner : prev.winner,
          isDraw: state.isDraw !== undefined ? state.isDraw : prev.isDraw,
          gameStatus: state.winner ? 'WON' : (state.isDraw ? 'DRAW' : 'PLAYING')
        }));
      } else if (targetGame === 'ludo') {
        setLudoGameState(prev => ({
          ...prev,
          tokens: state.tokens ? { H: [...state.tokens.H], A: [...state.tokens.A] } : prev.tokens,
          turn: state.turn || prev.turn,
          dice: state.dice !== undefined ? state.dice : prev.dice,
          statusMsg: state.statusMsg || prev.statusMsg,
          scores: state.scores || prev.scores,
          betAmount: state.betAmount !== undefined ? state.betAmount : prev.betAmount,
          winner: state.winner !== undefined ? state.winner : prev.winner
        }));
      }
    };

    socketRef.current.on('couple_game_broadcast', handleIncomingGameBroadcast);
    socketRef.current.on('arcade_game_action_broadcast', handleIncomingGameBroadcast);

    socketRef.current.on('couple_game_state_sync', ({ gameId, state }) => {
      if (!state) return;
      if (gameId === 'tictactoe') {
        setTictactoeState({
          board: state.board ? [...state.board] : Array(9).fill(null),
          turn: state.turn || 'H',
          betAmount: state.betAmount !== undefined ? state.betAmount : 2.0,
          scores: state.scores || { H: 0, A: 0 },
          winner: state.winner || null,
          isDraw: Boolean(state.isDraw),
          gameStatus: state.winner ? 'WON' : (state.isDraw ? 'DRAW' : 'PLAYING')
        });
      } else if (gameId === 'ludo') {
        setLudoGameState({
          tokens: state.tokens ? { H: [...state.tokens.H], A: [...state.tokens.A] } : { H: [-1, -1, -1, -1], A: [-1, -1, -1, -1] },
          turn: state.turn || 'H',
          dice: state.dice !== undefined ? state.dice : 6,
          statusMsg: state.statusMsg || 'Match ready! Darsh rolls first.',
          scores: state.scores || { H: 0, A: 0 },
          betAmount: state.betAmount !== undefined ? state.betAmount : 2.0,
          winner: state.winner || null
        });
      }
    });

    socketRef.current.on('togepi_movie_chat', ({ senderRole, text }) => {
      // 1. Peer-to-peer user announcement
      if (typeof text === 'string' && text.startsWith('__USER_ANNOUNCE__:')) {
        try {
          const userObj = JSON.parse(text.substring(18));
          if (userObj && userObj.email) {
            const clean = userObj.email.toLowerCase().trim();
            setUsersDirectory(prev => {
              const list = Array.isArray(prev?.users) ? [...prev.users] : [];
              const idx = list.findIndex(u => u && u.email && u.email.toLowerCase() === clean);
              const merged = {
                email: clean,
                name: userObj.name || (clean === 'arthurs10pc@gmail.com' ? 'Darsh' : 'User'),
                firstName: userObj.firstName || userObj.name || 'User',
                fullName: userObj.fullName || userObj.name || '',
                originalName: userObj.originalName || userObj.name || '',
                role: clean === 'arthurs10pc@gmail.com' ? 'parent' : 'user',
                isAdmin: clean === 'arthurs10pc@gmail.com',
                isDora: Boolean(userObj.isDora),
                picture: userObj.picture || '',
                isOnline: true,
                connectedSessions: 1,
                lastLogin: new Date().toISOString()
              };
              if (idx >= 0) {
                list[idx] = { ...list[idx], ...merged };
              } else {
                list.push(merged);
              }
              try {
                localStorage.setItem('stealth_known_users', JSON.stringify(list));
              } catch (e) {}
              return {
                totalCount: list.length,
                onlineCount: list.filter(u => u.isOnline).length,
                users: list
              };
            });
          }
        } catch (e) {}
        return;
      }

      // 2. Dora role toggle sync
      if (typeof text === 'string' && text.startsWith('__DORA_UPDATE__:')) {
        try {
          const payload = JSON.parse(text.substring(16));
          const { email, isDora, loveBalance } = payload || {};
          if (email) {
            const clean = email.toLowerCase().trim();
            setUsersDirectory(prev => {
              if (!prev || !Array.isArray(prev.users)) return prev;
              const updated = prev.users.map(u => {
                const isTarget = u.email && u.email.toLowerCase() === clean;
                if (isDora) {
                  return {
                    ...u,
                    isDora: isTarget,
                    loveBalance: isTarget && typeof loveBalance === 'number' ? loveBalance : u.loveBalance
                  };
                } else {
                  return isTarget ? { ...u, isDora: false } : u;
                }
              });
              try {
                localStorage.setItem('stealth_known_users', JSON.stringify(updated));
              } catch (e) {}
              return { ...prev, users: updated };
            });
            if (isDora && typeof loveBalance === 'number') {
              setLoveBalance(loveBalance);
              try { localStorage.setItem('stealth_love_balance', loveBalance.toString()); } catch (e) {}
            }
            setGoogleUser(prev => {
              if (prev && prev.email && prev.email.toLowerCase() === clean) {
                const upd = { ...prev, isDora: Boolean(isDora), loveBalance: typeof loveBalance === 'number' ? loveBalance : prev.loveBalance };
                try { localStorage.setItem('stealth_user_profile', JSON.stringify(upd)); } catch (e) {}
                return upd;
              }
              return prev;
            });
          }
        } catch (e) {}
        return;
      }

      // 3. User delete sync
      if (typeof text === 'string' && text.startsWith('__DELETE_USER__:')) {
        try {
          const { email } = JSON.parse(text.substring(16));
          if (email) {
            const clean = email.toLowerCase().trim();
            setUsersDirectory(prev => {
              if (!prev || !Array.isArray(prev.users)) return prev;
              const updated = prev.users.filter(u => (u.email || '').toLowerCase() !== clean);
              try {
                localStorage.setItem('stealth_known_users', JSON.stringify(updated));
              } catch (e) {}
              return { ...prev, totalCount: updated.length, users: updated };
            });
            setGoogleUser(prev => {
              if (prev && prev.email && prev.email.toLowerCase() === clean) {
                try {
                  localStorage.removeItem('stealth_user_profile');
                  localStorage.setItem('stealth_role', 'user');
                } catch (e) {}
                alert("Your account has been permanently removed from this workspace by Admin.");
                return null;
              }
              return prev;
            });
          }
        } catch (e) {}
        return;
      }

      // 3b. Real-time Slot Delete Sync across all accounts
      if (typeof text === 'string' && text.startsWith('__SLOT_DELETE__:')) {
        try {
          const payload = JSON.parse(text.substring(16));
          if (payload && payload.slotId) {
            const curDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
            const nextDel = Array.from(new Set([...curDel, payload.slotId, ...(Array.isArray(payload.deletedSlotIds) ? payload.deletedSlotIds : [])]));
            try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(nextDel)); } catch (e) {}
            setDeletedSlotIds(nextDel);
            setDailySlots(prev => {
              const updated = prev.filter(s => s && s.id !== payload.slotId && !nextDel.includes(s.id));
              try { localStorage.setItem('stealth_daily_slots', JSON.stringify(updated)); } catch (e) {}
              return updated;
            });
          }
        } catch (e) {}
        return;
      }

      // 3c. Real-time Dora Balance Ping & Pong Protocol
      if (text === '__PING_DORA_BALANCE__') {
        const myRole = roleRef.current || role || localStorage.getItem('stealth_role');
        if (myRole !== 'parent') {
          const curBal = Number(localStorage.getItem('stealth_love_balance') || 0);
          const curLedger = JSON.parse(localStorage.getItem('stealth_love_ledger') || '[]');
          const myEmail = (googleUser?.email || localStorage.getItem('stealth_user_email') || '').toLowerCase().trim();
          if (myEmail && myEmail !== 'dora@gmail.com') {
            if (socketRef.current) {
              socketRef.current.emit('user_sync_state', {
                email: myEmail,
                loveBalance: curBal,
                loveLedger: curLedger
              });
              socketRef.current.emit('togepi_movie_chat', {
                room: GLOBAL_ROOM,
                senderRole: 'user',
                text: '__DORA_BALANCE_REPORT__:' + JSON.stringify({ email: myEmail, loveBalance: curBal, loveLedger: curLedger })
              });
            }
            fetch(`${BACKEND_URL}/api/user/sync-state`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: myEmail, loveBalance: curBal, loveLedger: curLedger })
            }).catch(() => {});
          }
        }
        return;
      }

      if (typeof text === 'string' && text.startsWith('__DORA_BALANCE_REPORT__:')) {
        try {
          const rep = JSON.parse(text.substring(24));
          if (rep && typeof rep.loveBalance === 'number') {
            setLoveBalance(rep.loveBalance);
            try { localStorage.setItem('stealth_love_balance', rep.loveBalance.toString()); } catch(e) {}
            if (Array.isArray(rep.loveLedger) && rep.loveLedger.length > 0) {
              setLoveLedger(prev => {
                const map = new Map();
                (prev || []).forEach(e => { if (e && e.id) map.set(e.id, e); });
                rep.loveLedger.forEach(e => { if (e && e.id) map.set(e.id, e); });
                const merged = Array.from(map.values());
                try { localStorage.setItem('stealth_love_ledger', JSON.stringify(merged)); } catch(e) {}
                return merged;
              });
            }
            if (rep.email) {
              const clean = rep.email.toLowerCase().trim();
              setUsersDirectory(prev => {
                if (!prev || !Array.isArray(prev.users)) return prev;
                const updated = prev.users.map(u => u && u.email && u.email.toLowerCase() === clean ? { ...u, loveBalance: rep.loveBalance } : u);
                return { ...prev, users: updated };
              });
            }
          }
        } catch(e) {}
        return;
      }

      // 4. Request all active users
      if (text === '__REQUEST_ALL_USERS__') {
        const myProfile = JSON.parse(localStorage.getItem('stealth_user_profile') || 'null');
        if (myProfile && myProfile.email && socketRef.current) {
          socketRef.current.emit('togepi_movie_chat', {
            room: GLOBAL_ROOM,
            senderRole: myProfile.role || 'user',
            text: `__USER_ANNOUNCE__:${JSON.stringify(myProfile)}`
          });
        }
        return;
      }

      // 5. Daily Task Submission Real-time Broadcast
      if (typeof text === 'string' && text.startsWith('__TASK_SUBMIT__:')) {
        try {
          const submission = JSON.parse(text.substring(16));
          if (submission && submission.id) {
            setDailySubmissions(prev => {
              const idx = prev.findIndex(s => s.id === submission.id);
              const next = idx >= 0 ? [...prev] : [...prev, submission];
              if (idx >= 0) next[idx] = submission;
              try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(next)); } catch (e) {}
              return next;
            });
            const myCurrentRole = roleRef.current || role || localStorage.getItem('stealth_role');
            if (myCurrentRole === 'parent' || myCurrentRole === 'admin') {
              try { playReceiveSound(); } catch (e) {}
              setDailyAdminToast({
                slotId: submission.slotId,
                slotTitle: submission.slotTitle || 'Routine Task',
                date: submission.date,
                note: submission.note,
                hasImage: Boolean(submission.image),
                timestamp: Date.now()
              });
              triggerMobileNotification(`New Hourly Task Proof submitted by ${activeDoraName}!`, "user");
            }
          }
        } catch (e) {}
        return;
      }

      // 6. Daily Task Approved Real-time Broadcast
      if (typeof text === 'string' && text.startsWith('__TASK_APPROVE__:')) {
        try {
          const { submissionId, slotId, points, date } = JSON.parse(text.substring(17));
          setDailySubmissions(prev => {
            const updated = prev.map(s => {
              if ((submissionId && s.id === submissionId) || (slotId && s.slotId === slotId && (!date || s.date === date))) {
                return { ...s, status: 'APPROVED', pointsAwarded: points || 2.0, reviewedAt: new Date().toISOString() };
              }
              return s;
            });
            try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          const myCurrentRole = roleRef.current || role || localStorage.getItem('stealth_role');
          if (myCurrentRole !== 'parent' && myCurrentRole !== 'admin') {
            try { confetti({ particleCount: 80, spread: 90, origin: { y: 0.4 } }); } catch (e) {}
            playPointEarnedSound(); alert(`🎉 Task Approved by Darsh!\n\n+₹ ${points || 2.0} has been added to your Love Balance! 💖`);
          }
        } catch (e) {}
        return;
      }

      // 7. Daily Task Rejected Real-time Broadcast
      if (typeof text === 'string' && text.startsWith('__TASK_REJECT__:')) {
        try {
          const { submissionId, slotId, date } = JSON.parse(text.substring(16));
          setDailySubmissions(prev => {
            const updated = prev.map(s => {
              if ((submissionId && s.id === submissionId) || (slotId && s.slotId === slotId && (!date || s.date === date))) {
                return { ...s, status: 'REJECTED', reviewedAt: new Date().toISOString() };
              }
              return s;
            });
            try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          const myCurrentRole = roleRef.current || role || localStorage.getItem('stealth_role');
          if (myCurrentRole !== 'parent' && myCurrentRole !== 'admin') {
            alert("Note: Darsh requested a retake on your submitted task. Please tap ➕ to re-upload clear proof!");
          }
        } catch (e) {}
        return;
      }

      const myRole = roleRef.current || localStorage.getItem('stealth_role') || 'user';
      if (senderRole !== myRole) {
        setTogepiChatHistory(prev => [...prev, { 
          sender: senderRole, 
          text, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
        setIncomingTogepiAlert({ sender: senderRole, text, time: Date.now() });
        playReceiveSound();
      }
    });

    socketRef.current.on('codex_force_realign_broadcast', (data) => {
      if (!data) return;
      const latency = Math.max(0, (Date.now() - (data.timestamp || Date.now())) / 1000);
      const target = (data.currentTime || 0) + (data.state === 'PLAY' ? latency : 0);

      const videoEl = html5LocalVideoRef.current || html5VideoRef.current;
      const currentVTime = videoEl ? videoEl.currentTime : (codexYTPlayerRef.current?.getCurrentTime() || 0);
      const gap = Math.abs(currentVTime - target);
      setSyncDelayGapText(`⚡ Realigned (-${gap.toFixed(1)}s gap fixed)`);
      if (delayGapTimeoutRef.current) clearTimeout(delayGapTimeoutRef.current);
      delayGapTimeoutRef.current = setTimeout(() => setSyncDelayGapText(''), 3500);

      if (codexEngineRef.current === 'youtube' && codexYTPlayerRef.current && typeof codexYTPlayerRef.current.seekTo === 'function') {
        codexYTPlayerRef.current.seekTo(target, true);
        if (data.state === 'PLAY') codexYTPlayerRef.current.playVideo();
        else codexYTPlayerRef.current.pauseVideo();
      } else if (videoEl) {
        isMovieRemoteTriggerRef.current = true;
        videoEl.currentTime = target;
        if (data.state === 'PLAY') {
          videoEl.play().catch(() => {});
          setIsMoviePlaying(true);
        } else {
          videoEl.pause();
          setIsMoviePlaying(false);
        }
        setTimeout(() => { isMovieRemoteTriggerRef.current = false; }, 600);
      }
      playReceiveSound();
    });

    socketRef.current.on('arcade_game_action_broadcast', (moveData) => {
      if (moveData.gameId === 'ludo') {
        if (moveData.tokens) setLudoTokens(moveData.tokens);
        if (moveData.turn) setLudoTurn(moveData.turn);
        if (moveData.dice) setDiceVal(moveData.dice);
        if (moveData.statusMsg) setLudoStatusMsg(moveData.statusMsg);
        if (moveData.scores) setScores(moveData.scores);
        if (moveData.winner) {
          setWinnerMessage(moveData.winner);
          confetti({ particleCount: 90, spread: 100 });
        }
        playReceiveSound();
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
            const playPromise = playerRef.current.playVideo();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => setAutoplayBlocked(true));
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

    socketRef.current.on('request_peer_balance', () => {
      const myRole = roleRef.current || role || localStorage.getItem('stealth_role');
      if (myRole !== 'parent') {
        const curBal = Number(localStorage.getItem('stealth_love_balance') || 0);
        const curLedger = JSON.parse(localStorage.getItem('stealth_love_ledger') || '[]');
        const myEmail = (googleUser?.email || localStorage.getItem('stealth_user_email') || '').toLowerCase().trim();
        if (myEmail && myEmail !== 'dora@gmail.com') {
          if (socketRef.current) {
            socketRef.current.emit('user_sync_state', {
              email: myEmail,
              loveBalance: curBal,
              loveLedger: curLedger
            });
            socketRef.current.emit('togepi_movie_chat', {
              room: GLOBAL_ROOM,
              senderRole: 'user',
              text: '__DORA_BALANCE_REPORT__:' + JSON.stringify({ email: myEmail, loveBalance: curBal, loveLedger: curLedger })
            });
          }
          fetch(`${BACKEND_URL}/api/user/sync-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: myEmail, loveBalance: curBal, loveLedger: curLedger })
          }).catch(() => {});
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
      const latency = Math.max(0, (Date.now() - (timestamp || Date.now())) / 1000);
      const target = (currentTime || 0) + (state === 'PLAY' ? latency : 0);
      const videoEl = html5LocalVideoRef.current || html5VideoRef.current;

      if (codexEngineRef.current === 'youtube' && codexYTPlayerRef.current && typeof codexYTPlayerRef.current.seekTo === 'function') {
        isMovieRemoteTriggerRef.current = true;
        const currentYT = codexYTPlayerRef.current.getCurrentTime() || 0;
        if (Math.abs(currentYT - target) > 0.4) {
          codexYTPlayerRef.current.seekTo(target, true);
        }
        if (state === 'PLAY') {
          codexYTPlayerRef.current.playVideo();
          setIsMoviePlaying(true);
        } else {
          codexYTPlayerRef.current.pauseVideo();
          setIsMoviePlaying(false);
        }
        setTimeout(() => { isMovieRemoteTriggerRef.current = false; }, 600);
      } else if ((codexEngineRef.current === 'gofile' || codexEngineRef.current === 'local') && videoEl) {
        isMovieRemoteTriggerRef.current = true;
        if (Math.abs(videoEl.currentTime - target) > 0.4) {
          videoEl.currentTime = target;
        }

        if (state === 'PLAY') {
          videoEl.play().catch(() => {});
          setIsMoviePlaying(true);
        } else {
          videoEl.pause();
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
      const isCurrentlyStealth = viewModeRef.current === 'stealth' || isWhatsAppViewRef.current;
      const isTabActive = document.visibilityState === 'visible' && document.hasFocus();
      const shouldAutoSeen = isCurrentlyStealth && isTabActive && data.senderRole !== myCurrentRole;

      const formatted = {
        ...data,
        text,
        timeFormatted: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSeen: shouldAutoSeen,
        isMedia: data.isMedia || false,
        mediaType: data.mediaType || (data.isMedia ? 'photo' : 'text'),
        mediaOpened: false,
        reaction: data.reaction || null,
        isPinned: Boolean(data.isPinned),
        isStarred: Boolean(data.isStarred)
      };

      setStealthMessages(prev => {
        // If this message matches an optimistic local message, replace it!
        const existingIdx = prev.findIndex(m => 
          m._id === formatted._id || 
          (m.clientMsgId && (m.clientMsgId === data.clientMsgId || m.clientMsgId === formatted.clientMsgId)) ||
          (m.tempId && (m.tempId === data.clientMsgId || (m.senderRole === formatted.senderRole && m.text === formatted.text)))
        );
        if (existingIdx !== -1) {
          const copy = [...prev];
          copy[existingIdx] = { ...formatted, tempId: undefined };
          return copy;
        }
        const next = [...prev, formatted];
        try { checkDailyHabitInfractions(next); } catch(e) {}
        return next;
      });

      if (data.senderRole !== myCurrentRole) {
        playReceiveSound();
        if (shouldAutoSeen && socketRef.current) {
          socketRef.current.emit('mark_seen', { room: GLOBAL_ROOM, viewerRole: myCurrentRole });
        }

        if (text && ROMANTIC_REGEX.test(text)) {
          try {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 } });
          } catch(e) {}
        }

        triggerMobileNotification(formatted.isMedia ? "[Photo Asset]" : text, data.senderRole);
      }
    });

    socketRef.current.on('messages_marked_seen', ({ viewerRole }) => {
      setStealthMessages(prev => prev.map(m => {
        if (m.senderRole !== viewerRole) {
          return { ...m, isSeen: true, isDelivered: true };
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

    // High-Frequency Authoritative Sync Heartbeat from Backend (Every 4 seconds)
    socketRef.current.on('love_balance_heartbeat_sync', (data) => {
      if (!data) return;
      if (Array.isArray(data.deletedTransactionIds) && data.deletedTransactionIds.length > 0) {
        try {
          const curDelTxs = JSON.parse(localStorage.getItem('stealth_deleted_tx_ids') || '[]');
          const mergedDelTxs = Array.from(new Set([...curDelTxs, ...data.deletedTransactionIds]));
          localStorage.setItem('stealth_deleted_tx_ids', JSON.stringify(mergedDelTxs));
        } catch(e) {}
      }
      if (typeof data.lastClearedAt === 'number' && data.lastClearedAt > 0) {
        try { localStorage.setItem('stealth_last_cleared_at', data.lastClearedAt.toString()); } catch(e) {}
      }
      if (Array.isArray(data.loveLedger)) {
        const activeDelTxs = Array.isArray(data.deletedTransactionIds) 
          ? data.deletedTransactionIds 
          : JSON.parse(localStorage.getItem('stealth_deleted_tx_ids') || '[]');
        const cleanLedger = data.loveLedger.filter(e => e && !activeDelTxs.includes(e.id) && !isLegacyMockEntry(e));
        setLoveLedger(cleanLedger);
        try { localStorage.setItem('stealth_love_ledger', JSON.stringify(cleanLedger)); } catch(e) {}
      }
      if (typeof data.loveBalance === 'number') {
        setLoveBalance(data.loveBalance);
        try { localStorage.setItem('stealth_love_balance', data.loveBalance.toString()); } catch(e) {}
      }
      if (typeof data.adminLoveBalance === 'number') {
        setAdminLoveBalance(data.adminLoveBalance);
        try { localStorage.setItem('stealth_admin_love_balance', data.adminLoveBalance.toString()); } catch(e) {}
      }
      if (Array.isArray(data.wishRequests)) {
        setWishRequests(data.wishRequests);
        try { localStorage.setItem('stealth_wish_requests', JSON.stringify(data.wishRequests)); } catch(e) {}
      }
      if (Array.isArray(data.dailySubmissions)) {
        setDailySubmissions(prev => {
          const map = new Map();
          prev.forEach(s => map.set(s.id, s));
          data.dailySubmissions.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values());
          try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(merged)); } catch(e) {}
          return merged;
        });
      }
      if (Array.isArray(data.deletedSlotIds) && data.deletedSlotIds.length > 0) {
        const localDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
        const mergedDel = Array.from(new Set([...localDel, ...data.deletedSlotIds]));
        try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(mergedDel)); } catch(e) {}
        setDeletedSlotIds(mergedDel);
      }
      const activeDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
      if (Array.isArray(data.dailySlots)) {
        const cleanSlots = data.dailySlots
          .filter(s => s && !activeDel.includes(s.id))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setDailySlots(cleanSlots);
        try { localStorage.setItem('stealth_daily_slots', JSON.stringify(cleanSlots)); } catch(e) {}
      }
    });

    socketRef.current.on('love_balance_broadcast', (data) => {
      if (!data) return;
      const myRole = roleRef.current || role || localStorage.getItem('stealth_role');
      // Socket-based check ensures cross-device updates for same role (e.g. Darsh's laptop vs phone) sync in real time
      const isMyOwnAction = Boolean(data.originSocketId && socketRef.current && data.originSocketId === socketRef.current.id);

      // Authoritative real-time sync from server
      const serverLoveBal = typeof data.currentLoveBalance === 'number' ? data.currentLoveBalance : (typeof data.loveBalance === 'number' ? data.loveBalance : null);
      if (serverLoveBal !== null) {
        setLoveBalance(serverLoveBal);
        try { localStorage.setItem('stealth_love_balance', serverLoveBal.toString()); } catch(e) {}
      }
      const serverAdminLoveBal = typeof data.currentAdminLoveBalance === 'number' ? data.currentAdminLoveBalance : (typeof data.adminLoveBalance === 'number' ? data.adminLoveBalance : null);
      if (serverAdminLoveBal !== null) {
        setAdminLoveBalance(serverAdminLoveBal);
        try { localStorage.setItem('stealth_admin_love_balance', serverAdminLoveBal.toString()); } catch(e) {}
      }
      if (Array.isArray(data.loveLedger)) {
        const activeDelTxs = Array.isArray(data.deletedTransactionIds)
          ? data.deletedTransactionIds
          : JSON.parse(localStorage.getItem('stealth_deleted_tx_ids') || '[]');
        const cleanLedger = data.loveLedger.filter(e => e && !activeDelTxs.includes(e.id) && !isLegacyMockEntry(e));
        setLoveLedger(cleanLedger);
        try { localStorage.setItem('stealth_love_ledger', JSON.stringify(cleanLedger)); } catch(e) {}
      }
      if (Array.isArray(data.wishRequests)) {
        setWishRequests(data.wishRequests);
        try { localStorage.setItem('stealth_wish_requests', JSON.stringify(data.wishRequests)); } catch(e) {}
      }

      if (data.action === 'DELETE_TRANSACTION' && data.transactionId) {
        setLoveLedger(prev => {
          const next = prev.filter(e => e.id !== data.transactionId);
          try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
          return next;
        });
        return;
      }

      if (data.action === 'CLEAR_LEDGER') {
        const clearTarget = data.target || 'user';
        if (clearTarget === 'user') {
          setLoveLedger(prev => {
            const next = prev.filter(e => e.target === 'admin' || (e.description && e.description.includes('[Darsh]')));
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
            return next;
          });
        } else if (clearTarget === 'admin') {
          setLoveLedger(prev => {
            const next = prev.filter(e => e.target !== 'admin' && !(e.description && e.description.includes('[Darsh]')));
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
            return next;
          });
        } else {
          setLoveLedger([]);
          try { localStorage.setItem('stealth_love_ledger', '[]'); } catch(e) {}
        }

        if (clearTarget === 'user' || clearTarget === 'both') {
          setLoveBalance(0);
          try { localStorage.setItem('stealth_love_balance', '0'); } catch(e) {}
        }
        if (clearTarget === 'admin' || clearTarget === 'both') {
          setAdminLoveBalance(0);
          try { localStorage.setItem('stealth_admin_love_balance', '0'); } catch(e) {}
        }

        try {
          const clrTime = data.timestamp || Date.now();
          localStorage.setItem('stealth_last_cleared_at', clrTime.toString());
          const now = new Date(clrTime);
          const todayStr = getLocalDateString(now);
          const yesterdayStr = getLocalDateString(new Date(now.getTime() - 86400000));
          const evals = JSON.parse(localStorage.getItem('stealth_habit_evals') || '{}');
          if (!evals[todayStr]) evals[todayStr] = {};
          evals[todayStr].doraMorningEvaluated = true;
          evals[todayStr].darshMorningEvaluated = true;
          evals[todayStr].doraNightEvaluated = true;
          evals[todayStr].darshNightEvaluated = true;
          if (!evals[todayStr].slotsEvaluated) evals[todayStr].slotsEvaluated = {};
          (data.dailySlots || []).forEach(s => { evals[todayStr].slotsEvaluated[s.id] = true; });

          if (!evals[yesterdayStr]) evals[yesterdayStr] = {};
          evals[yesterdayStr].doraMorningEvaluated = true;
          evals[yesterdayStr].darshMorningEvaluated = true;
          evals[yesterdayStr].doraNightEvaluated = true;
          evals[yesterdayStr].darshNightEvaluated = true;
          if (!evals[yesterdayStr].slotsEvaluated) evals[yesterdayStr].slotsEvaluated = {};
          (data.dailySlots || []).forEach(s => { evals[yesterdayStr].slotsEvaluated[s.id] = true; });

          localStorage.setItem('stealth_habit_evals', JSON.stringify(evals));
        } catch(e) {}
        return;
      }

      if (isMyOwnAction) return;

      // PRIVACY ENFORCEMENT: Dora must NEVER receive or view Darsh's personal routine task deductions,
      // BUT shared couple wish events (redeem transactions, approvals, fulfillment) MUST be synchronized!
      const isSharedWishAction = data.action === 'WISH_APPROVED' || data.action === 'WISH_REQUEST' || data.action === 'TOGGLE_FULFILLMENT' || data.action === 'SYNC_UNLOCKED_VOUCHERS';
      if (myRole !== 'parent' && myRole !== 'admin' && data.target === 'admin' && !isSharedWishAction && !(data.action === 'TRANSACTION' && data.newEntry && data.newEntry.type === 'redeem')) {
        return;
      }

      if (data.action === 'TRANSACTION' && data.newEntry) {
        const entry = data.newEntry;
        if (myRole !== 'parent' && myRole !== 'admin' && entry.target === 'admin' && entry.type !== 'redeem') {
          return;
        }
        setLoveLedger(prev => {
          if (prev.some(e => e.id === entry.id)) return prev;
          const next = [entry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
          try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
          return next;
        });
      } else if (data.action === 'OVERRIDE_BALANCE') {
        if (data.newEntry) {
          const entry = data.newEntry;
          setLoveLedger(prev => {
            if (prev.some(e => e.id === entry.id)) return prev;
            const next = [entry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
            return next;
          });
        } else if (Array.isArray(data.loveLedger)) {
          setLoveLedger(data.loveLedger);
          try { localStorage.setItem('stealth_love_ledger', JSON.stringify(data.loveLedger)); } catch(e) {}
        }
        if (data.target === 'user') {
          setLoveBalance(data.newBalance);
          try { localStorage.setItem('stealth_love_balance', data.newBalance.toString()); } catch(e) {}
          if (myRole !== 'parent' && myRole !== 'admin') {
            alert('⚡ Love Balance updated to ₹ ' + Number(data.newBalance || 0).toFixed(2) + ' by Darsh!');
          }
        } else if (data.target === 'admin') {
          setAdminLoveBalance(data.newBalance);
          try { localStorage.setItem('stealth_admin_love_balance', data.newBalance.toString()); } catch(e) {}
        }
      } else if (data.action === 'LOVE_NUDGE') {
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 } });
        } catch (e) {}
        alert(data.message || "💖 Love Alert received!");
      } else if (data.action === 'TOGGLE_FULFILLMENT') {
        setLoveLedger(prev => prev.map(item => {
          if (item.id === data.wishId) {
            const nextStatus = item.fulfillmentStatus === 'Fulfilled' ? 'Pending' : 'Fulfilled';
            return { ...item, fulfillmentStatus: nextStatus };
          }
          return item;
        }));
      } else if (data.action === 'DAILY_TASK_SUBMIT' && data.submission) {
        const sub = data.submission;
        setDailySubmissions(prev => {
          const idx = prev.findIndex(s => s.id === sub.id);
          const next = idx >= 0 ? [...prev] : [...prev, sub];
          if (idx >= 0) next[idx] = sub;
          try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(next)); } catch(e) {}
          return next;
        });

        if (myRole === 'parent' || myRole === 'admin') {
          try { playReceiveSound(); } catch(e) {}
          setDailyAdminToast({
            slotId: sub.slotId,
            slotTitle: sub.slotTitle || 'Routine Task',
            date: sub.date,
            note: sub.note,
            hasImage: Boolean(sub.image),
            timestamp: Date.now()
          });
          triggerMobileNotification("New Hourly Task Proof submitted by Dora!", "user");
        }
      } else if (data.action === 'DAILY_TASK_APPROVED' && data.submissionId) {
        setDailySubmissions(prev => {
          const updated = prev.map(s => s.id === data.submissionId ? { ...s, status: 'APPROVED', pointsAwarded: data.points } : s);
          try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch(e) {}
          return updated;
        });
        if (myRole !== 'parent' && myRole !== 'admin') {
          try { confetti({ particleCount: 80, spread: 90, origin: { y: 0.4 } }); } catch(e) {}
          alert(`🎉 Task Approved by Darsh!\n\n+₹ ${data.points || 0} has been added to your Love Balance! 💖`);
        }
      } else if (data.action === 'DAILY_TASK_REJECTED' && data.submissionId) {
        setDailySubmissions(prev => {
          const updated = prev.map(s => s.id === data.submissionId ? { ...s, status: 'REJECTED', adminFeedback: data.feedback } : s);
          try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(updated)); } catch(e) {}
          return updated;
        });
        if (myRole !== 'parent' && myRole !== 'admin') {
          alert(`Note: Darsh requested a retake on this task:\n"${data.feedback || 'Please retake with clear proof'}"`);
        }
      } else if (data.action === 'WISH_REQUEST') {
        const req = data.wishRequest;
        if (req) {
          setWishRequests(prev => [req, ...prev.filter(r => r.id !== req.id)]);
          try {
            playReceiveSound();
            confetti({ particleCount: 60, spread: 80, origin: { y: 0.4 } });
          } catch (e) {}
          setActiveWishApprovalModal(req);
        }
      } else if (data.action === 'WISH_APPROVED') {
        const req = data.wishRequest;
        if (req) {
          setWishRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED' } : r));
          try {
            confetti({ particleCount: 100, spread: 100, origin: { y: 0.4 } });
          } catch (e) {}

          // Ensure the redeemed wish is recorded in loveLedger with status Pending
          setLoveLedger(prev => {
            const exists = prev.some(e => e.wishTitle === req.wishTitle && (e.id === ('lb_wish_' + req.id) || e.remarks === ('Redeemed: ' + req.wishTitle)));
            if (exists) return prev;
            const newRedeemEntry = {
              id: 'lb_wish_' + req.id,
              sl: 1,
              target: req.requesterRole,
              description: '[' + req.requesterName + '] Redeemed: ' + req.wishTitle,
              earnedAt: req.requestedAt || new Date().toLocaleString('en-GB'),
              points: -Number(req.wishCost || 0),
              type: 'redeem',
              remarks: 'Redeemed: ' + req.wishTitle,
              status: 'Redeemed',
              wishTitle: req.wishTitle,
              wishIcon: req.wishIcon || '🎁',
              wishCost: Number(req.wishCost || 0),
              fulfillmentStatus: 'Pending',
              approvedBy: req.targetName || (role === 'parent' ? 'Darsh' : 'Dora')
            };
            const updated = [newRedeemEntry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(updated)); } catch(e) {}
            return updated;
          });

          alert('🎉 IT\'S APPROVED! 💖\n\n' + (req.targetName || 'Your partner') + ' APPROVED your wish:\n"' + req.wishTitle + '"!\n\nPoints deducted and wish is pending completion!');
        }
      } else if (data.action === 'SYNC_UNLOCKED_VOUCHERS' && Array.isArray(data.vouchers)) {
        try { localStorage.setItem('stealth_unlocked_scratch_vouchers', JSON.stringify(data.vouchers)); } catch(e) {}
        window.dispatchEvent(new CustomEvent('stealth_unlocked_vouchers_updated', { detail: data.vouchers }));
      } else if (data.action === 'WISH_DECLINED') {
        const req = data.wishRequest;
        if (req) {
          setWishRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'DECLINED' } : r));
          alert('Note: Wish request for "' + req.wishTitle + '" was declined.');
        }
      } else if (data.action === 'DAILY_TASK_APPROVED') {
        const subId = data.submissionId;
        const targetSlotId = data.slotId;
        const targetDate = data.date;
        const pts = parseFloat(data.points) || 2.0;
        const slotTitle = data.slotTitle || 'Routine Task';
        const approvalId = 'lb_appr_' + (subId || `${targetDate}_${targetSlotId}`);

        setDailySubmissions(prev => {
          let found = false;
          const next = prev.map(s => {
            if ((subId && s.id === subId) || (targetSlotId && s.slotId === targetSlotId && (!targetDate || s.date === targetDate))) {
              found = true;
              return {
                ...s,
                status: 'APPROVED',
                pointsAwarded: pts,
                reviewedAt: new Date().toISOString()
              };
            }
            return s;
          });
          try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(next)); } catch(e) {}
          return next;
        });

        // Award Love Balance credit in Dora's passbook
        setLoveLedger(prev => {
          if (prev.some(e => e.id === approvalId)) return prev;
          const nowStr = new Date().toLocaleString('en-GB');
          const expDate = new Date();
          expDate.setMonth(expDate.getMonth() + 1);
          const creditEntry = {
            id: approvalId,
            sl: 1,
            target: 'user',
            description: `[Dora] Approved Task: ${slotTitle}`,
            earnedAt: nowStr,
            expireDate: expDate.toLocaleDateString('en-GB'),
            points: pts,
            type: 'credit',
            remarks: `Approved Task: ${slotTitle}`,
            status: 'Confirmed'
          };
          const next = [creditEntry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
          try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
          return next;
        });

        if (myRole !== 'parent' && myRole !== 'admin') {
          try { confetti({ particleCount: 80, spread: 80, origin: { y: 0.4 } }); } catch(e) {}
        }
      } else if (data.action === 'SYNC_STATE_RESPONSE') {
        if (typeof data.loveBalance === 'number') {
          setLoveBalance(data.loveBalance);
          try { localStorage.setItem('stealth_love_balance', data.loveBalance.toString()); } catch(e) {}
        }
        if (typeof data.adminLoveBalance === 'number') {
          setAdminLoveBalance(data.adminLoveBalance);
          try { localStorage.setItem('stealth_admin_love_balance', data.adminLoveBalance.toString()); } catch(e) {}
        }
        if (Array.isArray(data.loveLedger)) {
          const activeDelTxs = Array.isArray(data.deletedTransactionIds) 
            ? data.deletedTransactionIds 
            : JSON.parse(localStorage.getItem('stealth_deleted_tx_ids') || '[]');
          const cleanLedger = data.loveLedger.filter(e => e && !activeDelTxs.includes(e.id) && !isLegacyMockEntry(e));
          setLoveLedger(cleanLedger);
          try { localStorage.setItem('stealth_love_ledger', JSON.stringify(cleanLedger)); } catch(e) {}
        }
        if (Array.isArray(data.wishRequests) && data.wishRequests.length > 0) {
          setWishRequests(data.wishRequests);
          try { localStorage.setItem('stealth_wish_requests', JSON.stringify(data.wishRequests)); } catch(e) {}
        }
        if (Array.isArray(data.dailySubmissions) && data.dailySubmissions.length > 0) {
          setDailySubmissions(prev => {
            const map = new Map();
            prev.forEach(s => map.set(s.id, s));
            data.dailySubmissions.forEach(s => map.set(s.id, s));
            const merged = Array.from(map.values());
            try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(merged)); } catch(e) {}
            return merged;
          });
        }
        if (Array.isArray(data.deletedSlotIds) && data.deletedSlotIds.length > 0) {
          const localDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
          const mergedDel = Array.from(new Set([...localDel, ...data.deletedSlotIds]));
          try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(mergedDel)); } catch(e) {}
          setDeletedSlotIds(mergedDel);
        }
        const activeDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
        if (Array.isArray(data.dailySlots)) {
          const cleanSlots = data.dailySlots
            .filter(s => s && !activeDel.includes(s.id))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setDailySlots(cleanSlots);
          try { localStorage.setItem('stealth_daily_slots', JSON.stringify(cleanSlots)); } catch(e) {}
        }
      } else if (data.action === 'DAILY_SLOT_DELETE' && data.slotId) {
        const localDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
        const mergedDel = Array.from(new Set([...localDel, data.slotId, ...(Array.isArray(data.deletedSlotIds) ? data.deletedSlotIds : [])]));
        try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(mergedDel)); } catch(e) {}
        setDeletedSlotIds(mergedDel);
        setDailySlots(prev => {
          const updated = prev.filter(s => s && s.id !== data.slotId && !mergedDel.includes(s.id));
          try { localStorage.setItem('stealth_daily_slots', JSON.stringify(updated)); } catch(e) {}
          return updated;
        });
      } else if (data.action === 'DAILY_SLOT_UPDATE' && data.slotId && data.updates) {
        setDailySlots(prev => {
          const updated = prev.map(s => s.id === data.slotId ? { ...s, ...data.updates } : s);
          try { localStorage.setItem('stealth_daily_slots', JSON.stringify(updated)); } catch(e) {}
          return updated;
        });
      } else if (data.action === 'DAILY_SLOT_CREATE' && data.slot) {
        if (data.slot && data.slot.id) {
          const localDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]').filter(id => id !== data.slot.id);
          try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(localDel)); } catch(e) {}
          setDeletedSlotIds(localDel);
        }
        setDailySlots(prev => {
          if (prev.some(s => s.id === data.slot.id)) return prev;
          const updated = [...prev, data.slot];
          try { localStorage.setItem('stealth_daily_slots', JSON.stringify(updated)); } catch(e) {}
          return updated;
        });
      } else {
        if (data.newEntry) {
          setLoveLedger(prev => {
            if (prev.some(e => e.id === data.newEntry.id)) return prev;
            const updated = [data.newEntry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(updated)); } catch(e) {}
            return updated;
          });
        }
        if (!data.newEntry && typeof data.currentLoveBalance !== 'number') {
          handleLoveBalanceTransaction(data.amount, data.type, data.reason, true, data.target || 'user', data.extraData);
        }
        if (data.type === 'credit') {
          try {
            confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 } });
            playPointEarnedSound();
          } catch (e) {}
        }
      }
    });

    socketRef.current.on('daily_task_sync_response', ({ date, slots, submissions, deletedSlotIds: incomingDeleted }) => {
      if (Array.isArray(incomingDeleted) && incomingDeleted.length > 0) {
        const localDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
        const mergedDel = Array.from(new Set([...localDel, ...incomingDeleted]));
        try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(mergedDel)); } catch(e) {}
        setDeletedSlotIds(mergedDel);
      }
      const activeDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
      if (Array.isArray(slots)) {
        const cleanSlots = slots
          .filter(s => s && !activeDel.includes(s.id))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setDailySlots(cleanSlots);
        try { localStorage.setItem('stealth_daily_slots', JSON.stringify(cleanSlots)); } catch(e) {}
      }
      if (Array.isArray(submissions) && submissions.length > 0) {
        setDailySubmissions(prev => {
          const map = new Map();
          prev.forEach(s => map.set(s.id, s));
          submissions.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values());
          try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(merged)); } catch(e) {}
          return merged;
        });
      }
    });

    socketRef.current.on('daily_task_submission_updated', ({ submission, submissionId, approved, rejected, isNew, pointsAwarded }) => {
      const targetId = (submission && submission.id) || submissionId;
      const targetSlotId = submission && submission.slotId;
      const targetDate = submission && submission.date;

      if (targetId || targetSlotId) {
        setDailySubmissions(prev => {
          let found = false;
          const next = prev.map(s => {
            if ((targetId && s.id === targetId) || (targetSlotId && s.slotId === targetSlotId && (!targetDate || s.date === targetDate))) {
              found = true;
              return {
                ...s,
                ...(submission || {}),
                status: approved ? 'APPROVED' : (rejected ? 'REJECTED' : (submission?.status || s.status)),
                pointsAwarded: approved ? (pointsAwarded || submission?.pointsAwarded || s.pointsAwarded || 2.0) : s.pointsAwarded
              };
            }
            return s;
          });
          if (!found && submission && submission.id) {
            next.push(submission);
          }
          try { localStorage.setItem('stealth_daily_submissions', JSON.stringify(next)); } catch(e) {}
          return next;
        });

        const activeRole = roleRef.current || role || localStorage.getItem('stealth_role');
        if (isNew && (activeRole === 'parent' || activeRole === 'admin') && submission) {
          try { playReceiveSound(); } catch (e) {}
          setDailyAdminToast({
            slotId: submission.slotId,
            slotTitle: submission.slotTitle || 'Routine Task',
            date: submission.date,
            note: submission.note,
            hasImage: Boolean(submission.image),
            timestamp: Date.now()
          });
          triggerMobileNotification("New Hourly Task Proof submitted by Dora!", "user");
        } else if (approved) {
          const pts = pointsAwarded || (submission && submission.pointsAwarded) || 2.0;
          const approvalId = 'lb_appr_' + (targetId || `${targetDate}_${targetSlotId}`);
          setLoveLedger(prev => {
            if (prev.some(e => e.id === approvalId)) return prev;
            const nowStr = new Date().toLocaleString('en-GB');
            const expDate = new Date();
            expDate.setMonth(expDate.getMonth() + 1);
            const creditEntry = {
              id: approvalId,
              sl: 1,
              target: 'user',
              description: `[Dora] Approved Task: ${(submission && submission.slotTitle) || 'Routine Task'}`,
              earnedAt: nowStr,
              expireDate: expDate.toLocaleDateString('en-GB'),
              points: pts,
              type: 'credit',
              remarks: `Approved Task: ${(submission && submission.slotTitle) || 'Routine Task'}`,
              status: 'Confirmed'
            };
            const next = [creditEntry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(next)); } catch(e) {}
            return next;
          });
          try {
            confetti({ particleCount: 80, spread: 90, origin: { y: 0.4 } });
          } catch (e) {}
          if (activeRole !== 'parent' && activeRole !== 'admin') {
            alert(`🎉 Task Approved by Darsh!\n\n+₹ ${pts.toFixed(2)} has been added to your Love Balance! 💖`);
          }
        } else if (rejected) {
          if (activeRole !== 'parent' && activeRole !== 'admin') {
            alert(`Note: Darsh requested a retake on this task:\n"${(submission && submission.adminFeedback) || 'Please retake with clear proof'}"`);
          }
        }
      }
    });

    socketRef.current.on('daily_task_admin_alert', (alertData) => {
      const activeRole = roleRef.current || role || localStorage.getItem('stealth_role');
      if (activeRole === 'parent' || activeRole === 'admin') {
        try { playReceiveSound(); } catch (e) {}
        setDailyAdminToast(alertData);
      }
    });

    socketRef.current.on('daily_slots_updated', ({ slots, deletedSlotIds: incomingDeleted }) => {
      if (Array.isArray(incomingDeleted) && incomingDeleted.length > 0) {
        const localDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
        const mergedDel = Array.from(new Set([...localDel, ...incomingDeleted]));
        try { localStorage.setItem('stealth_deleted_slot_ids', JSON.stringify(mergedDel)); } catch(e) {}
        setDeletedSlotIds(mergedDel);
      }
      const activeDel = JSON.parse(localStorage.getItem('stealth_deleted_slot_ids') || '[]');
      if (Array.isArray(slots)) {
        const cleanSlots = sortSlotsByTime(slots.filter(s => s && !activeDel.includes(s.id)));
        setDailySlots(cleanSlots);
        try { localStorage.setItem('stealth_daily_slots', JSON.stringify(cleanSlots)); } catch(e) {}
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [playReceiveSound, playBubblePopSound, markMessagesAsSeen, triggerMobileNotification, handleLoveBalanceTransaction]);

  const handleAdminSendRequest = () => {
    if (socketRef.current) {
      socketRef.current.emit('admin_send_arcade_request');
      alert("Ludo game request dispatched to Dora!");
    }
  };

  const handleUserAcceptRequest = () => {
    setIncomingGameRequest(false);
    setShowArcadePlugins(true);
    if (socketRef.current) {
      socketRef.current.emit('user_accept_arcade_request');
    }
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
  };

  const handleAdminDisconnectArcade = () => {
    setShowArcadePlugins(false);
    setActiveGame(null);
    setIncomingGameRequest(false);
    if (socketRef.current) {
      socketRef.current.emit('admin_toggle_arcade', false);
    }
  };

  const handleLaunchGame = (game) => {
    if (game && (game.id === 'ludo' || game === 'ludo')) {
      setShowLudoModal(true);
    } else {
      setActiveGame(game);
    }
    setWinnerMessage('');
    if (socketRef.current) {
      socketRef.current.emit('launch_multiplayer_game', game);
    }
  };

  const handleSendChatGameInvite = (gameType, bet = 2.0) => {
    const isCurrentAdmin = (role === 'parent' || role === 'admin');
    const myName = isCurrentAdmin ? 'Darsh' : activeDoraName;
    const oppName = isCurrentAdmin ? activeDoraName : 'Darsh';
    const gameLabel = gameType === 'ludo' ? 'Ludo Royale (2P)' : 'Couple Tic-Tac-Toe';
    const betLabel = bet > 0 ? ` (₹${bet.toFixed(2)} Bet)` : ' (Friendly Match)';
    const inviteMsg = `[GAME_CHALLENGE:${gameType}] ${myName} challenged ${oppName} to ${gameLabel}${betLabel}! Tap to join!`;

    if (socketRef.current) {
      const encrypted = encryptText(inviteMsg);
      socketRef.current.emit('send_stealth_msg', {
        room: GLOBAL_ROOM,
        role,
        encryptedText: encrypted,
        isMedia: false
      });
      playSentSound();
      socketRef.current.emit('couple_game_invite', {
        game: gameType,
        challenger: myName,
        challengerRole: role,
        betAmount: bet
      });
    }
  };

  const handleGameAction = useCallback((payload) => {
    if (!payload) return;
    const targetGame = payload.gameId || (payload.board ? 'tictactoe' : 'ludo');
    if (targetGame === 'tictactoe') {
      setTictactoeState(prev => ({
        ...prev,
        board: payload.board ? [...payload.board] : prev.board,
        turn: payload.turn || prev.turn,
        betAmount: payload.betAmount !== undefined ? payload.betAmount : prev.betAmount,
        scores: payload.scores || prev.scores,
        winner: payload.winner !== undefined ? payload.winner : prev.winner,
        isDraw: payload.isDraw !== undefined ? payload.isDraw : prev.isDraw,
        gameStatus: payload.winner ? 'WON' : (payload.isDraw ? 'DRAW' : 'PLAYING')
      }));
    } else if (targetGame === 'ludo') {
      setLudoGameState(prev => ({
        ...prev,
        tokens: payload.tokens ? { H: [...payload.tokens.H], A: [...payload.tokens.A] } : prev.tokens,
        turn: payload.turn || prev.turn,
        dice: payload.dice !== undefined ? payload.dice : prev.dice,
        statusMsg: payload.statusMsg || prev.statusMsg,
        scores: payload.scores || prev.scores,
        betAmount: payload.betAmount !== undefined ? payload.betAmount : prev.betAmount,
        winner: payload.winner !== undefined ? payload.winner : prev.winner
      }));
    }
    if (socketRef.current) {
      socketRef.current.emit('couple_game_action', payload);
      socketRef.current.emit('arcade_game_action', payload);
    }
  }, []);

  const downloadFullChatPDF = async () => {
    try {
      let rawMessages = [];
      try {
        const resp = await fetch(`${BACKEND_URL}/api/chat-history?room=${GLOBAL_ROOM}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            rawMessages = data.map(m => ({
              ...m,
              text: m.text || decryptText(m.encryptedText || ''),
              timeFormatted: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
          }
        }
      } catch (e) {
        console.warn("Could not fetch remote chat-history, using local buffer:", e);
      }

      if (rawMessages.length === 0) {
        rawMessages = stealthMessagesRef.current && stealthMessagesRef.current.length > 0 
          ? stealthMessagesRef.current 
          : stealthMessages;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("WhatsApp / Complete Secret Chat Transcript", 14, 11);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`Auto-Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)  |  Total Messages: ${rawMessages.length}`, 14, 18);

      let y = 32;
      const pageHeight = 297;
      const maxWidth = 95;
      const margin = 14;

      if (!rawMessages || rawMessages.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(11);
        doc.text("No messages recorded in this chat stream.", margin, y);
      } else {
        rawMessages.forEach((m) => {
          const isUser = (m.senderRole === 'user' || m.senderRole === 'A');
          const senderLabel = isUser ? `A (${activeDoraName || 'Dora'})` : 'H (Darsh)';
          const time = m.timeFormatted || new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          let fullRawText = m.text || "";
          let replyHeader = "";
          let actualText = fullRawText;

          // Check if message is a reply
          const replyMatch = fullRawText.match(/^\[⤴\s*([AH]):\s*"([^"]*)"\]\s*(.*)/s);
          if (replyMatch) {
            const replierRole = isUser ? 'A' : 'H';
            const repliedToRole = replyMatch[1];
            const quotedSnippet = replyMatch[2];
            const remainder = replyMatch[3];
            const replierName = replierRole === 'A' ? (activeDoraName || 'Dora') : 'Darsh';
            const repliedToName = repliedToRole === 'A' ? (activeDoraName || 'Dora') : 'Darsh';
            
            replyHeader = `[↩ ${repliedToName} ke message ka reply ${replierName} ne diya: "${quotedSnippet}"]`;
            actualText = remainder;
          }

          if (m.mediaType === 'audio') {
            actualText = "[🎙️ Voice Note Recording]";
          } else if (m.mediaType === 'video_note') {
            actualText = "[🎥 60s Circular Video Note]";
          } else if (m.mediaType === 'sticker') {
            actualText = "[🎨 Sticker Asset]";
          } else if (m.isMedia || m.mediaType === 'photo') {
            actualText = "[📷 Photo Asset]";
          } else if (actualText && actualText.includes('[GAME_CHALLENGE:')) {
            actualText = actualText.includes('ludo') ? "🎲 [Ludo Royale 2P Match Challenge]" : "⚔️ [Couple Tic-Tac-Toe Duel Challenge]";
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);

          const linesHeader = replyHeader ? doc.splitTextToSize(replyHeader, maxWidth - 8) : [];
          const linesBody = doc.splitTextToSize(actualText || "(empty)", maxWidth - 8);
          
          const headerHeight = linesHeader.length > 0 ? (linesHeader.length * 3.8) + 3 : 0;
          const bodyHeight = (linesBody.length * 4.2);
          const bubbleHeight = 11 + headerHeight + bodyHeight;

          if (y + bubbleHeight > pageHeight - 15) {
            doc.addPage();
            y = 20;
          }

          const xPos = isUser ? margin : (210 - margin - maxWidth);

          // Bubble background
          if (isUser) {
            doc.setFillColor(241, 245, 249);
            doc.setDrawColor(203, 213, 225);
          } else {
            doc.setFillColor(220, 252, 231);
            doc.setDrawColor(187, 247, 208);
          }
          doc.roundedRect(xPos, y, maxWidth, bubbleHeight, 3, 3, 'FD');

          // Sender Name
          doc.setTextColor(isUser ? 30 : 6, isUser ? 41 : 78, isUser ? 59 : 59);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(senderLabel, xPos + 4, y + 5);

          let currentY = y + 9;

          // Render Quoted Reply Box if present
          if (linesHeader.length > 0) {
            doc.setFillColor(isUser ? 226 : 187, isUser ? 232 : 247, isUser ? 240 : 208);
            doc.roundedRect(xPos + 3, currentY - 3, maxWidth - 6, headerHeight, 1.5, 1.5, 'F');
            doc.setTextColor(71, 85, 105);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7);
            doc.text(linesHeader, xPos + 5, currentY + 0.5);
            currentY += headerHeight + 2;
          }

          // Message Body
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.text(linesBody, xPos + 4, currentY);

          // Timestamp
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(time, xPos + maxWidth - 16, y + bubbleHeight - 2.5);

          y += bubbleHeight + 3.5;
        });
      }

      // Add Page Numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages}`, 190, 292, { align: 'right' });
      }

      doc.save(`Complete_Chat_History_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  // --- LUDO ROYAL CLASH MULTIPLAYER ENGINE ---
  const isSafeLudoTile = (tileIndex) => {
    return tileIndex === 0 || tileIndex === 7 || tileIndex === 14 || tileIndex === 21;
  };

  const getLudoMovableTokens = (player, roll, currentTokens) => {
    const list = [];
    const myTokens = currentTokens[player] || [-1, -1, -1, -1];
    myTokens.forEach((pos, idx) => {
      if (pos === -1) {
        if (roll === 6) list.push(idx);
      } else if (pos >= 0 && pos < 33) {
        if (pos + roll <= 33) list.push(idx);
      }
    });
    return list;
  };

  const handleLudoRoll = () => {
    const isMyTurn = (isCurrentAdmin && ludoTurn === 'H') || (!isCurrentAdmin && ludoTurn === 'A');
    if (!isMyTurn || isDiceRolling || winnerMessage) return;

    setIsDiceRolling(true);
    playBubblePopSound();

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceVal(roll);
      setIsDiceRolling(false);

      const movable = getLudoMovableTokens(ludoTurn, roll, ludoTokens);
      const activeName = ludoTurn === 'H' ? 'Darsh' : 'Dora';

      if (movable.length === 0) {
        const nextTurn = ludoTurn === 'H' ? 'A' : 'H';
        const msg = `🎲 ${activeName} rolled ${roll} - No moves possible! Next turn.`;
        setLudoStatusMsg(msg);
        setMovableTokens([]);

        setTimeout(() => {
          setLudoTurn(nextTurn);
          if (socketRef.current) {
            socketRef.current.emit('arcade_game_action', {
              gameId: 'ludo',
              tokens: ludoTokens,
              turn: nextTurn,
              dice: roll,
              statusMsg: msg,
              scores
            });
          }
        }, 1200);
      } else if (movable.length === 1) {
        setMovableTokens([]);
        executeLudoMove(ludoTurn, movable[0], roll);
      } else {
        setMovableTokens(movable);
        setLudoStatusMsg(`🎲 ${activeName} rolled ${roll}! Select which token to advance.`);
      }
    }, 400);
  };

  const executeLudoMove = (player, tokenIdx, roll) => {
    const newTokens = {
      H: [...ludoTokens.H],
      A: [...ludoTokens.A]
    };
    const currentPos = newTokens[player][tokenIdx];
    let newPos = currentPos;
    let isCapture = false;
    let status = '';

    if (currentPos === -1) {
      newPos = player === 'H' ? 0 : 14;
      status = `🚀 ${player === 'H' ? 'Darsh' : 'Dora'} deployed Token #${tokenIdx + 1}!`;
    } else {
      newPos = Math.min(33, currentPos + roll);
      status = `➡️ ${player === 'H' ? 'Darsh' : 'Dora'} moved Token #${tokenIdx + 1} to step ${newPos}.`;
    }

    newTokens[player][tokenIdx] = newPos;

    // Check opponent capture on standard track (0 to 27)
    if (newPos >= 0 && newPos <= 27 && !isSafeLudoTile(newPos)) {
      const opponent = player === 'H' ? 'A' : 'H';
      newTokens[opponent] = newTokens[opponent].map((oppPos) => {
        if (oppPos === newPos) {
          isCapture = true;
          return -1; // Reset opponent token to yard!
        }
        return oppPos;
      });
      if (isCapture) {
        confetti({ particleCount: 80, spread: 90 });
        playReceiveSound();
        status = `⚔️ ${player === 'H' ? 'Admin' : 'User'} captured opponent token! Bonus turn granted!`;
      }
    }

    // Check win condition: 2 or more tokens reached Home (33)
    const homeCount = newTokens[player].filter(p => p === 33).length;
    let winText = '';
    let newScores = { ...scores };

    if (homeCount >= 2) {
      winText = `🏆 ${player === 'H' ? 'Player H (Admin)' : 'Player A (User)'} Won Ludo Royal Clash! 🎉`;
      newScores[player] += 1;
      setScores(newScores);
      setWinnerMessage(winText);
      confetti({ particleCount: 120, spread: 130 });
    }

    // Determine next turn
    let nextTurn = player;
    if (!winText) {
      if (roll === 6 || isCapture) {
        nextTurn = player;
        status += " (Bonus roll!)";
      } else {
        nextTurn = player === 'H' ? 'A' : 'H';
      }
    }

    setLudoTokens(newTokens);
    setLudoTurn(nextTurn);
    setLudoStatusMsg(status);
    setMovableTokens([]);

    if (socketRef.current) {
      socketRef.current.emit('arcade_game_action', {
        gameId: 'ludo',
        tokens: newTokens,
        turn: nextTurn,
        dice: roll,
        statusMsg: status,
        scores: newScores,
        winner: winText
      });
    }
  };

  const handleResetLudo = () => {
    const initTokens = { H: [-1, -1, -1, -1], A: [-1, -1, -1, -1] };
    setLudoTokens(initTokens);
    setLudoTurn('H');
    setDiceVal(6);
    setWinnerMessage('');
    setMovableTokens([]);
    const resetMsg = 'Game reset! Darsh rolls first.';
    setLudoStatusMsg(resetMsg);

    if (socketRef.current) {
      socketRef.current.emit('arcade_game_action', {
        gameId: 'ludo',
        tokens: initTokens,
        turn: 'H',
        dice: 6,
        statusMsg: resetMsg,
        scores,
        winner: ''
      });
    }
  };

  const handleSeekSlider = (e) => {
    const val = parseFloat(e.target.value);
    setTrackProgress(val);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(val, true);
      lastSyncActionTimeRef.current = Date.now();
      if (socketRef.current) {
        socketRef.current.emit('sync_playback_state', {
          room: GLOBAL_ROOM,
          state: isPlaying ? 'PLAY' : 'PAUSE',
          currentTime: val,
          timestamp: Date.now()
        });
      }
    }
  };

  const handleLoadMovie = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setMovieError('');

    if (codexEngine === 'youtube') {
      const vid = extractYouTubeId((movieInputUrl || '').trim());
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
      const input = (movieInputUrl || '').trim();
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
      const trimmed = (movieInputUrl || '').trim();
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

  const handleSelectReaction = (messageId, emoji) => {
    setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, reaction: emoji } : m));
    setActiveReactionMsgId(null);

    // Any reaction on message earns +0.10 points!
    const targetUser = role === 'parent' ? 'admin' : 'user';
    const lastReactKey = 'lb_last_react_' + targetUser;
    const lastReactTime = Number(localStorage.getItem(lastReactKey) || 0);
    if (Date.now() - lastReactTime >= 10 * 1000) {
      localStorage.setItem(lastReactKey, Date.now().toString());
      handleLoveBalanceTransaction(0.10, 'credit', `Reaction on Message (${emoji})`, false, targetUser);
    }

    if (socketRef.current) {
      socketRef.current.emit('add_reaction', {
        room: GLOBAL_ROOM,
        messageId,
        reaction: emoji
      });
    }
  };

  const handleAwardMessageKarma = (m, points, title) => {
    if (!m) return;
    // Always award to author of message m (the person who sent the message)
    const isMsgFromAdmin = (m.senderRole === 'parent' || m.senderRole === 'admin' || m.senderRole === 'H');
    const awardTarget = isMsgFromAdmin ? 'admin' : 'user';
    const rawMsg = cleanOriginalText(m.text || m.encryptedText || '');
    const snippet = rawMsg.length > 50 ? rawMsg.substring(0, 50) + '...' : rawMsg;

    handleLoveBalanceTransaction(
      points,
      'credit',
      `${title} (Message: "${snippet}")`,
      false,
      awardTarget,
      {
        messageSnippet: rawMsg || snippet,
        remarks: `${title} on "${snippet}"`
      }
    );
    setActiveAwardMsgId(null);
  };

  const handleEmojiClick = (emoji) => {
    setInput(prev => prev + emoji);
    setShowMiniEmojiBar(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const displayedStealthMessages = role === 'user' ? stealthMessages.slice(-60) : stealthMessages;
  const partnerRole = role === 'parent' ? 'user' : 'parent';
  const isPartnerOnline = onlineRoles.includes(partnerRole) || Boolean(usersDirectory?.users?.some(u => (u.isAdmin ? 'parent' : 'user') === partnerRole && u.isOnline));
  const filteredWpMessages = useMemo(() => {
    let list = displayedStealthMessages;
    if (filterStarredOnly) {
      list = list.filter(m => m.isStarred);
    }
    if (wpSearchQuery.trim()) {
      list = list.filter(m => m.text && m.text.toLowerCase().includes(wpSearchQuery.toLowerCase()));
    }
    return list;
  }, [displayedStealthMessages, filterStarredOnly, wpSearchQuery]);

  const pinnedMessage = useMemo(() => {
    return stealthMessages.find(m => m.isPinned);
  }, [stealthMessages]);

  const firstUnreadIndex = useMemo(() => {
    return filteredWpMessages.findIndex(m => m.senderRole !== role && !m.isSeen);
  }, [filteredWpMessages, role]);
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

  // Love Balance Isolation & Metrics (Darsh points 100% hidden from Dora)
  const isParentAdmin = role === 'parent';
  const lbViewerTarget = isParentAdmin ? activeLbTarget : 'user';
  const displayedLoveBalance = isParentAdmin
    ? (lbViewerTarget === 'admin' ? Number(adminNetBalance || 0) : Number(doraNetBalance || 0))
    : Number(doraNetBalance || 0);

  // Dora can NEVER see Darsh's transactions or points
  const visibleLoveLedger = isParentAdmin
    ? (lbViewerTarget === 'admin'
        ? loveLedger.filter(e => e.target === 'admin' || (e.description && e.description.includes('[Darsh]')))
        : loveLedger.filter(e => e.target !== 'admin' && !(e.description && e.description.includes('[Darsh]'))))
    : loveLedger.filter(e => e.target !== 'admin' && !(e.description && e.description.includes('[Darsh]')));

  const cutPointsTotal = visibleLoveLedger
    .filter(e => e.type === 'debit' && e.status !== 'Redeemed')
    .reduce((sum, e) => sum + Math.abs(e.points), 0);

  const payoutsTotal = visibleLoveLedger
    .filter(e => e.type === 'credit')
    .reduce((sum, e) => sum + Math.abs(e.points), 0);

  // Redeemed Wishes are shared couple promises (both Darsh & Dora must see all couple wishes)
  const redeemedWishesList = loveLedger
    .filter(e => e.type === 'redeem' || e.status === 'Redeemed');

  const redeemedWishesTotal = redeemedWishesList
    .reduce((sum, e) => sum + Math.abs(e.points), 0);

  const myRole = role === 'parent' ? 'admin' : 'user';
  const hasIncomingPendingWish = Boolean(
    wishRequests && wishRequests.some(r => r.status === 'PENDING' && r.requesterRole !== myRole)
  );

  return (
    <div 
      className="flex h-[100dvh] w-screen overflow-hidden bg-[#000000] text-[#ececf1] font-sans antialiased select-none relative text-sm md:text-[14.5px]"
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

      <input 
        type="file" 
        accept="video/*" 
        ref={localVideoInputRef} 
        onChange={handleSelectLocalFile}
        className="hidden" 
      />

      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* UNIVERSAL INCOMING VOICE CALL OVERLAY (VISIBLE IN ALL VIEWS) */}
      {isIncomingCall && !isInAudioCall && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[999999] w-[94vw] max-w-md bg-[#1a2e26]/95 border-2 border-emerald-500 text-white p-3 sm:p-3.5 px-4 sm:px-6 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center justify-between gap-2.5 sm:gap-4 animate-in slide-in-from-top duration-300 font-sans">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 animate-pulse shrink-0">
            <Phone size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-white">Incoming Whisper Voice Call...</p>
            <p className="text-[10px] text-emerald-300 font-mono">From {partnerName}</p>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <button
              type="button"
              onClick={handleAcceptIncomingCall}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Phone size={14} /> Answer
            </button>
            <button
              type="button"
              onClick={handleEndAudioCall}
              className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL OUTGOING CALLING BANNER */}
      {isCalling && !isInAudioCall && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[999999] w-[92vw] max-w-md bg-[#141d24]/95 border-2 border-blue-500 text-white p-3 px-4 sm:px-5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 font-sans">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400 animate-pulse shrink-0">
            <Phone size={16} />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-white">Calling {partnerName}...</p>
            <p className="text-[10px] text-gray-400 font-mono">Waiting for peer to answer</p>
          </div>
          <button
            type="button"
            onClick={handleEndAudioCall}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* UNIVERSAL ACTIVE CALL FLOATING BAR (VISIBLE IN ALL VIEWS) */}
      {isInAudioCall && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[999999] w-[95vw] max-w-lg bg-[#0c1813]/95 border-2 border-emerald-500/80 text-white p-2.5 px-3 sm:px-5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center justify-between gap-2 sm:gap-3.5 animate-in slide-in-from-top duration-300 font-sans flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-black text-emerald-300">
              LIVE ({formatCallTime(callDurationSec)})
            </span>
            <span className="text-[9px] bg-rose-500/30 text-rose-300 border border-rose-500/50 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
              ● REC
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWhisperModeEnabled(!isWhisperModeEnabled)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isWhisperModeEnabled ? 'bg-emerald-600 text-white shadow' : 'bg-[#20342b] text-emerald-300 hover:text-white'
              }`}
            >
              <Radio size={12} />
              <span>{isWhisperModeEnabled ? 'Whisper ON' : 'Whisper'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleCallMute}
              className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                isCallMuted ? 'bg-rose-600 text-white' : 'bg-[#20342b] text-gray-300 hover:text-white'
              }`}
              title={isCallMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isCallMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            <button
              type="button"
              onClick={handleEndAudioCall}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer shadow active:scale-95 transition-all"
            >
              End Call
            </button>
          </div>
        </div>
      )}

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

      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* COMPACT SIDEBAR / WHATSAPP VIEW */}
      {!isWhatsAppView ? (
        <aside 
          className={`
            fixed md:static inset-y-0 left-0 z-40
            w-72 md:w-60 max-w-[82vw]
            transition-transform md:transition-[width] duration-300 ease-out
            bg-[#171717] md:bg-[#000000] flex flex-col border-r border-[#262626] md:border-[#171717] overflow-hidden select-none shrink-0 shadow-2xl md:shadow-none
            ${sidebarOpen ? 'translate-x-0 md:w-60' : '-translate-x-full md:translate-x-0 md:w-0'}
          `}
        >
          {/* SIDEBAR HEADER MATCHING OFFICIAL CHATGPT (IMAGE 2) */}
          <div className="h-16 flex items-center justify-between px-4 pt-2 shrink-0">
            <span className="font-serif sm:font-sans font-bold text-xl tracking-tight text-white flex items-center gap-2">
              <span className="md:hidden">ChatGPT</span>
              <span className="hidden md:flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center p-1 shadow-sm shrink-0">
                  <ChatGPTLogo className="w-4 h-4 text-black" />
                </span>
                <span>ChatGPT</span>
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                className="w-9 h-9 rounded-full bg-[#262626] hover:bg-[#333] flex items-center justify-center text-gray-200 hover:text-white transition-all cursor-pointer"
                title="Search Chats"
              >
                <Search size={16} />
              </button>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="w-9 h-9 rounded-full bg-[#262626] hover:bg-[#333] text-[#9b9b9b] hover:text-white flex items-center justify-center cursor-pointer"
                title="Close"
              >
                <PanelLeft size={16} />
              </button>
            </div>
          </div>

          <div className="px-3 py-1 space-y-1 shrink-0 text-sm">
            {/* Images */}
            <div 
              onClick={() => { setViewMode('images_archive'); closeSidebarOnMobile(); }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${viewMode === 'images_archive' ? 'bg-[#262626] text-white font-medium' : 'text-gray-200 hover:bg-[#222]'}`}
            >
              <span className="flex items-center gap-3 font-serif sm:font-sans text-[15px]">
                <ImageIcon size={18} className="text-gray-300" /> Images
              </span>
              <span className="text-[11px] text-gray-400 font-mono">{archivedImages.length}</span>
            </div>

            {/* Library */}
            <div 
              onClick={() => { setLoveModalTab('redeem'); setShowLoveBalanceModal(true); closeSidebarOnMobile(); }}
              className="flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer text-gray-200 hover:bg-[#222] transition-colors"
            >
              <BookOpen size={18} className="text-gray-300" />
              <span className="font-serif sm:font-sans text-[15px]">Library</span>
            </div>

            {/* Customize */}
            <div 
              onClick={() => { setShowGamesHubModal(true); closeSidebarOnMobile(); }}
              className="flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer text-gray-200 hover:bg-[#222] transition-colors"
            >
              <Sliders size={18} className="text-gray-300" />
              <span className="font-serif sm:font-sans text-[15px]">Customize</span>
            </div>

            {/* Projects */}
            <div 
              onClick={() => { 
                setViewMode('daily_projects');
                setDailyAdminTab('review');
                closeSidebarOnMobile(); 
              }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${
                viewMode === 'daily_projects' ? 'bg-[#262626] text-white font-medium' : 'text-gray-200 hover:bg-[#222]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderGit2 size={18} className="text-gray-300" />
                <span className="font-serif sm:font-sans text-[15px]">Projects</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                role === 'parent'
                  ? (dailySubmissions.filter(s => s.status === 'PENDING').length > 0 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {role === 'parent' 
                  ? (dailySubmissions.filter(s => s.status === 'PENDING').length > 0 
                      ? `${dailySubmissions.filter(s => s.status === 'PENDING').length} PENDING` 
                      : 'CHECK') 
                  : 'HOURLY'}
              </span>
            </div>

            {/* Remote */}
            <div 
              onClick={() => { setViewMode('scheduled'); closeSidebarOnMobile(); }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${viewMode === 'scheduled' ? 'bg-[#262626] text-white font-medium' : 'text-gray-200 hover:bg-[#222]'}`}
            >
              <span className="flex items-center gap-3 font-serif sm:font-sans text-[15px]">
                <Laptop size={18} className="text-gray-300" /> Remote
              </span>
              {syncStatus === 'connected' ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Joint Synced" />
              ) : (
                syncStatus === 'incoming_request' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />
              )}
            </div>

            {/* Explore */}
            <div 
              onClick={() => {
                setShowArcadePlugins(!showArcadePlugins);
              }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${
                incomingGameRequest ? 'bg-amber-500/20 border border-amber-500/50 animate-pulse' : (showArcadePlugins ? 'bg-[#262626] text-white font-medium' : 'text-gray-200 hover:bg-[#222]')
              }`}
            >
              <span className="flex items-center gap-3 font-serif sm:font-sans text-[15px]">
                <LayoutGrid size={18} className={incomingGameRequest ? 'text-amber-400 animate-spin' : 'text-gray-300'} /> Explore
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                incomingGameRequest ? 'bg-amber-500 text-black animate-bounce' : (showArcadePlugins ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400')
              }`}>
                {incomingGameRequest ? 'NEW REQ' : (showArcadePlugins ? 'ACTIVE' : 'READY')}
              </span>
            </div>

            {/* ADMIN (H) CONTROLS INSIDE PLUGINS MENU */}
            {showArcadePlugins && role === 'parent' && (
              <div className="pl-2 pr-1.5 py-2 space-y-2 bg-[#0c0c0c] rounded-xl border border-[#222] my-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                  <span className="flex items-center gap-1"><Gamepad2 size={13} /> Arcade Master (Darsh)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleAdminSendRequest}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1.5 rounded-lg cursor-pointer transition-all shadow"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={handleAdminDisconnectArcade}
                    className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-bold py-1.5 rounded-lg cursor-pointer transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* USER (A) ACCEPT HANDSHAKE BANNER INSIDE PLUGINS MENU */}
            {incomingGameRequest && role !== 'parent' && (
              <div className="bg-amber-950/60 border border-amber-500/50 p-2.5 rounded-xl my-1 space-y-2 text-left animate-in fade-in duration-200">
                <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                  <Radio size={13} className="animate-pulse" /> Darsh sent arcade request!
                </p>
                <button
                  onClick={handleUserAcceptRequest}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
                >
                  <Check size={13} /> Accept & Unlock
                </button>
              </div>
            )}

            {/* LUDO & TIC-TAC-TOE MULTIPLAYER LAUNCHER IN PLUGINS MENU */}
            {showArcadePlugins && (
              <div className="p-2 space-y-2 bg-[#0c0c0c] rounded-xl border border-amber-500/40 my-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 px-1">
                  <span className="flex items-center gap-1">🎲 COUPLE GAMES</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">2-PLAYER LIVE</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGamesHubModal(true)}
                  className="w-full bg-[#181818] hover:bg-[#222] border border-amber-500/30 text-amber-300 p-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95 transition-all"
                >
                  <Gamepad2 size={14} className="text-amber-400" />
                  <span>All Couple Games (Hub)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLudoModal(true)}
                  className="w-full bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  <Gamepad2 size={15} />
                  <span>Play Ludo Royale 2P</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCoupleMiniGameModal(true)}
                  className="w-full bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-600 hover:to-indigo-500 text-white p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  <Trophy size={14} className="text-amber-400" />
                  <span>Couple Tic-Tac-Toe ⚔️</span>
                </button>
              </div>
            )}

            <div 
              onClick={() => { setViewMode('codex'); closeSidebarOnMobile(); }}
              className={`flex items-center gap-2.5 py-2 px-3 rounded-xl cursor-pointer transition-colors ${viewMode === 'codex' ? 'bg-[#212121] text-white font-medium' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}
            >
              <TerminalSquare size={16} className={viewMode === 'codex' ? 'text-emerald-400' : 'text-[#9b9b9b]'} />
              <span>Codex</span>
            </div>

            <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2 px-3 rounded-xl cursor-pointer transition-colors">
              <MoreHorizontal size={16} className="text-[#9b9b9b]" /> More
            </div>
          </div>

          {/* DIVIDER MATCHING IMAGE 2 */}
          <div className="border-t border-[#262626] mx-3 my-2" />

          {/* RECENTS CHAT LIST */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-none text-[15px]">
            {roomList.map((roomName, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setCurrentRoom(roomName);
                  setViewMode('real_gpt');
                  setReplyTarget(null);
                  closeSidebarOnMobile();
                }}
                className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors group font-serif sm:font-sans ${currentRoom === roomName && viewMode === 'real_gpt' ? 'bg-[#262626] text-white font-medium' : 'text-gray-300 hover:bg-[#202020] hover:text-white'}`}
              >
                <span className="truncate max-w-[210px]">{roomName}</span>
              </div>
            ))}
            <div 
              onClick={() => {}}
              className="text-xs text-gray-400 font-serif px-3 py-2 cursor-pointer hover:text-gray-200"
            >
              See all...
            </div>
          </div>

          {!isAppInstalled && (
            <div className="px-3 py-2 border-t border-[#262626] bg-[#121212]">
              <button
                onClick={() => { handleInstallApp(); closeSidebarOnMobile(); }}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                title="Install ChatGPT on your phone"
              >
                <Download size={14} className="animate-bounce" />
                <span>Install App on Mobile</span>
              </button>
            </div>
          )}

          {/* MOBILE BOTTOM FLOATING BAR MATCHING IMAGE 2: [✏️ Chat] BLUE PILL + AVATAR HS */}
          <div className="md:hidden p-3 border-t border-[#262626] bg-[#171717] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                handleNewChat();
                closeSidebarOnMobile();
              }}
              className="bg-[#2563eb] hover:bg-blue-600 active:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <SquarePen size={16} />
              <span>Chat</span>
            </button>

            <div 
              onClick={() => {
                if (role === 'parent') {
                  setViewMode('admin_dashboard');
                  closeSidebarOnMobile();
                } else if (handleUpgradeClick) {
                  handleUpgradeClick();
                }
              }}
              className="w-10 h-10 rounded-full bg-[#d97706] text-white font-bold flex items-center justify-center text-sm shadow cursor-pointer active:scale-95 transition-transform"
              title={role === 'parent' ? "Admin Dashboard (Darsh)" : (googleUser?.email || "User Profile")}
            >
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                role === 'parent' ? 'HS' : 'A'
              )}
            </div>
          </div>

          {/* DESKTOP GOOGLE SIGN IN & USER PROFILE BOTTOM BAR (hidden md:block) */}
          <div className="hidden md:block p-2.5 border-t border-[#171717] bg-[#000000] space-y-2">
            {!googleUser && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#1f1f1f] border border-[#2d2d2d] hover:border-emerald-500/50 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer group"
                title="Sign in with your Google Account"
              >
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            )}

            <div className="flex items-center justify-between text-xs">
              {/* PROFILE ROW */}
              <div 
                onClick={() => {
                  if (role === 'parent') {
                    setViewMode('admin_dashboard');
                    closeSidebarOnMobile();
                  }
                }}
                className={`flex items-center gap-2.5 overflow-hidden transition-all ${
                  role === 'parent' 
                    ? 'cursor-pointer hover:bg-[#1a1a1a] p-1.5 -ml-1.5 rounded-xl group select-none ring-1 ring-transparent hover:ring-amber-500/40 active:scale-95' 
                    : ''
                }`}
                title={role === 'parent' ? "Click to open Admin Dashboard" : (googleUser?.email || "User Profile")}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-transform overflow-hidden ${
                  role === 'parent' 
                    ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 border-amber-400 text-black shadow-md group-hover:scale-105' 
                    : 'bg-[#1e293b] border-[#333] text-white'
                }`}>
                  {googleUser?.picture ? (
                    <img src={googleUser.picture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    role === 'parent' ? '👑' : 'A'
                  )}
                </div>
                <div className="truncate text-left">
                  <p className={`font-medium truncate flex items-center gap-1.5 ${
                    role === 'parent' ? 'text-amber-400 group-hover:text-amber-300 font-bold' : 'text-white'
                  }`}>
                    <span>
                      {role === 'parent' 
                        ? 'Darsh' 
                        : (googleUser?.firstName || (googleUser?.name ? googleUser.name.split(' ')[0] : 'User'))}
                    </span>
                    {/* ONLY ARTHURS10PC@GMAIL.COM (DARSH) SEES DASHBOARD BUTTON */}
                    {role === 'parent' && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-mono font-bold animate-pulse">
                        DASHBOARD ➔
                      </span>
                    )}
                    {role !== 'parent' && Boolean(googleUser?.isDora) && (
                      <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-1 py-0.2 rounded font-mono font-bold">
                        DORA
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span>Free</span>
                    {role === 'parent' && <span className="text-amber-500/80 font-mono">• Click to open</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {googleUser && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="p-1 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded transition-all cursor-pointer text-[10px]"
                    title={`Signed in as ${googleUser.email}. Click to switch Google account`}
                  >
                    Switch
                  </button>
                )}
                {/* UPGRADE BUTTON REQUIRING PIN GATE - ONLY FOR DESIGNATED DORA OR ADMIN */}
                {(role === 'parent' || isCurrentUserDora) && (
                  <button 
                    onClick={handleUpgradeClick}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 font-bold"
                    title="Switch to WhatsApp View"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      ) : (
        /* WHATSAPP FULL IMMERSIVE CHAT VIEW - IOS LIQUID GLASS UI */
        <aside className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#070c10] bg-gradient-to-b from-[#0a151b] via-[#070f14] to-[#04080a] flex flex-col overflow-hidden select-none font-sans relative">
          
          {/* Ambient Frosted Glass Glow Spheres */}
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* IOS LIQUID GLASS WHATSAPP HEADER */}
          <div className="h-16 backdrop-blur-2xl bg-black/50 sm:bg-[#0c181f]/75 flex items-center justify-between px-2.5 sm:px-4 shrink-0 text-[#e9edef] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-20 border-b border-white/10 relative overflow-hidden">
            {/* LEFT SECTION: BACK BUTTON, AVATAR, PARTNER NAME & STATUS */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
              <button
                type="button"
                onClick={() => setIsWhatsAppView(false)}
                className="backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 text-[#aebac1] hover:text-white p-2 rounded-full transition-all cursor-pointer active:scale-95 shrink-0"
                title="Return to Secret Chat"
              >
                <ArrowLeft size={18} />
              </button>

              <div 
                onClick={() => setIsWhatsAppView(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.15] border border-emerald-400/40 flex items-center justify-center text-sm sm:text-base font-bold text-[#e9edef] relative shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
              >
                {partnerName[0]}
                {isPartnerOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 border-2 border-[#0c181f] rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-[15px] font-bold text-white tracking-tight truncate leading-tight flex items-center gap-1.5">
                  <span className="truncate">{partnerName}</span>
                  <span className="hidden sm:inline-block text-[9px] backdrop-blur-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded-full font-mono font-semibold">
                    IOS GLASS
                  </span>
                </h3>
                <div className="text-[11px] sm:text-[11.5px] font-normal leading-tight h-3.5 flex items-center">
                  {isPeerTyping ? (
                    <span className="text-emerald-400 animate-pulse font-medium">typing...</span>
                  ) : isPartnerOnline ? (
                    <span className="text-emerald-400/90 font-medium">online</span>
                  ) : (
                    <span className="text-gray-400 text-[10px] sm:text-[11px]">encrypted</span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SECTION: ACTIONS, BALANCES, GAMES, MENU */}
            <div className="flex items-center gap-1 sm:gap-2 text-[#aebac1] shrink-0">
              {/* VIDEO CALL: VISIBLE ON SM+ */}
              <button
                type="button"
                onClick={() => alert("WhatsApp Video Call feature: Secure connection established with " + partnerName + "!")}
                className="hidden sm:flex p-2 text-white/80 hover:text-white backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
                title="WhatsApp Video Call"
              >
                <VideoIcon size={16} />
              </button>

              {/* DUAL BALANCE PILL: ADMIN GETS BOTH (DESKTOP & MOBILE), DORA GETS HER OWN */}
              {role === 'parent' ? (
                <div
                  className={`flex items-center gap-1 sm:gap-1.5 backdrop-blur-xl text-white px-2 sm:px-2.5 py-1 rounded-full sm:rounded-2xl text-[10.5px] sm:text-xs font-mono font-bold shrink-0 shadow-md transition-all ${
                    hasIncomingPendingWish 
                      ? 'bg-pink-600/30 border-2 border-pink-400 animate-pulse ring-2 ring-pink-500 shadow-[0_0_16px_rgba(244,63,94,0.8)]' 
                      : 'bg-white/[0.08] hover:bg-white/[0.12] border border-white/20'
                  }`}
                  title={hasIncomingPendingWish ? "Incoming Wish Request Waiting! Tap to Review & Approve" : `${activeDoraName}: 💕 Love Balance | Darsh: 👑 Love Balance`}
                >
                  {hasIncomingPendingWish && (
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping mr-0.5 shrink-0" />
                  )}
                  {/* Dora's points */}
                  <button
                    type="button"
                    onClick={() => { setActiveLbTarget('user'); setShowLoveBalanceModal(true); setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook'); }}
                    className={`flex items-center gap-0.5 sm:gap-1 hover:text-white cursor-pointer transition-all active:scale-95 ${Number(doraNetBalance || 0) < 0 ? 'text-rose-400 font-bold' : 'text-pink-300'}`}
                    title={`${activeDoraName}: 💕`}
                  >
                    <span className="text-[9px] text-pink-400/90 font-sans font-semibold">{activeDoraName}:</span>
                    <span>{Number(doraNetBalance || 0) < 0 ? '💔' : '💕'}</span>
                    <span>{formatLoveBalance(doraNetBalance)}</span>
                  </button>
                  <span className="text-white/20">|</span>
                  {/* Darsh's points */}
                  <button
                    type="button"
                    onClick={() => { setActiveLbTarget('admin'); setShowLoveBalanceModal(true); setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook'); }}
                    className={`flex items-center gap-0.5 sm:gap-1 hover:text-white cursor-pointer transition-all active:scale-95 ${Number(adminNetBalance || 0) < 0 ? 'text-rose-400 font-bold' : 'text-blue-300'}`}
                    title="Darsh: 👑"
                  >
                    <span className="text-[9px] text-blue-400/90 font-sans font-semibold">Darsh:</span>
                    <span>{Number(adminNetBalance || 0) < 0 ? '💔' : '👑'}</span>
                    <span>{formatLoveBalance(adminNetBalance)}</span>
                  </button>
                </div>
              ) : (
                /* Dora's side: Show ONLY Dora's points */
                <button
                  type="button"
                  onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook'); }}
                  className={`flex items-center gap-1 backdrop-blur-xl hover:bg-white/[0.14] border ${
                    hasIncomingPendingWish
                      ? 'bg-pink-600/40 border-2 border-pink-400 text-white animate-pulse ring-2 ring-pink-500 shadow-[0_0_18px_rgba(244,63,94,0.85)]'
                      : (Number(doraNetBalance || 0) < 0 ? 'bg-white/[0.08] border-rose-500/60 text-rose-300' : 'bg-white/[0.08] border-pink-500/50 text-pink-300')
                  } hover:text-white px-2 sm:px-2.5 py-1 rounded-full text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shrink-0 shadow-md`}
                  title={hasIncomingPendingWish ? "Incoming Wish Request Waiting! Tap to Review & Approve" : "Your Love Balance Passbook & Wish Store"}
                >
                  {hasIncomingPendingWish && (
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping mr-0.5 shrink-0" />
                  )}
                  <span>{Number(doraNetBalance || 0) < 0 ? '💔' : '💕'}</span>
                  <span>{formatLoveBalance(doraNetBalance)}</span>
                </button>
              )}

              {/* COUPLE MINI-GAMES BUTTON */}
              <button
                type="button"
                onClick={() => setShowGamesHubModal(true)}
                className="flex items-center gap-1 backdrop-blur-xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/40 text-purple-200 px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shrink-0"
                title="Play Couple Games: Ludo & Tic-Tac-Toe"
              >
                <Gamepad2 size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Games</span>
              </button>

              {/* PHONE CALL: ON MOBILE AND DESKTOP */}
              <button
                type="button"
                onClick={handleStartAudioCall}
                className="p-1.5 sm:p-2 text-white/80 hover:text-emerald-400 backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 rounded-full transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                title="WhatsApp Voice Call"
              >
                <Phone size={15} />
              </button>

              {/* SEARCH: VISIBLE ON SM+ */}
              <button
                type="button"
                onClick={() => setShowWpSearch(!showWpSearch)}
                className="hidden sm:flex p-2 text-white/80 hover:text-white backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 rounded-full transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                title="Search Messages"
              >
                <Search size={16} />
              </button>

              {/* 3-DOT MORE MENU */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowWpMenu(!showWpMenu)}
                  className="p-1.5 sm:p-2 text-white/80 hover:text-white backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Menu"
                >
                  <MoreVertical size={16} />
                </button>

                {showWpMenu && (
                  <div 
                    className="absolute right-0 top-11 backdrop-blur-2xl bg-black/90 border border-white/20 rounded-2xl shadow-2xl py-2 w-52 z-50 text-xs text-gray-200 font-medium animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      type="button"
                      onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('passbook'); setShowWpMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors flex items-center justify-between text-pink-300 font-bold"
                    >
                      <span>💖 Love Passbook</span>
                      <span className="font-mono text-[11px]">
                        {role === 'parent' ? `Darsh: ${formatLoveBalance(adminNetBalance)}` : formatLoveBalance(doraNetBalance)}
                      </span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setShowGamesHubModal(true); setShowWpMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors flex items-center gap-2 text-purple-300"
                    >
                      <Gamepad2 size={13} className="text-amber-400" />
                      <span>Couple Games (Ludo & XO)</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setShowWpSearch(true); setShowWpMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Search size={13} />
                      <span>Search in chat</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { 
                        setFilterStarredOnly(!filterStarredOnly); 
                        setShowWpMenu(false); 
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-amber-300 transition-colors flex items-center justify-between"
                    >
                      <span>{filterStarredOnly ? 'Show All Messages' : 'Starred Messages'}</span>
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                    </button>
                    {role === 'parent' && (
                      <button 
                        type="button"
                        onClick={() => { downloadFullChatPDF(); setShowWpMenu(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors"
                      >
                        Export chat PDF
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => { 
                        setStealthMessages([]); 
                        setShowWpMenu(false); 
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-rose-400 transition-colors"
                    >
                      Clear chat
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button 
                      type="button"
                      onClick={() => { setIsWhatsAppView(false); setShowWpMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-amber-300 font-bold transition-colors"
                    >
                      Exit WhatsApp View
                    </button>
                  </div>
                )}
              </div>

              {/* EXIT WP BUTTON: HIDDEN ON MOBILE (ACCESSIBLE VIA ARROWLEFT AND MENU), VISIBLE ON SM+ */}
              <button 
                type="button"
                onClick={() => setIsWhatsAppView(false)}
                className="hidden sm:inline-flex backdrop-blur-md bg-white/10 hover:bg-white/20 text-[#e9edef] hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer border border-white/20 transition-all active:scale-95 shadow shrink-0"
              >
                Exit WP
              </button>
            </div>
          </div>

          {/* PINNED MESSAGE BANNER */}
          {pinnedMessage && (
            <div 
              onClick={() => {
                if (wpChatScrollRef.current) {
                  wpChatScrollRef.current.scrollTop = 0;
                }
              }}
              className="backdrop-blur-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/70 to-emerald-950/70 border-b border-emerald-500/30 px-3.5 py-1.5 flex items-center justify-between text-xs text-emerald-200 z-20 cursor-pointer shadow-md select-none"
            >
              <div className="flex items-center gap-2 truncate">
                <Pin size={13} className="text-emerald-400 rotate-45 shrink-0" />
                <span className="font-bold text-[11px] text-emerald-300">Pinned:</span>
                <span className="truncate text-[11px] text-gray-200">{cleanOriginalText(pinnedMessage.text)}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePinMessage(pinnedMessage._id, false);
                }}
                className="text-gray-400 hover:text-white p-1 text-[11px] font-bold cursor-pointer"
                title="Unpin message"
              >
                ✕
              </button>
            </div>
          )}

          {/* STARRED MESSAGES FILTER ALERT */}
          {filterStarredOnly && (
            <div className="backdrop-blur-xl bg-amber-950/80 border-b border-amber-500/40 px-3.5 py-1.5 flex items-center justify-between text-xs text-amber-200 z-20 select-none">
              <div className="flex items-center gap-2">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="font-bold text-[11px]">Showing Starred Messages Only</span>
              </div>
              <button
                type="button"
                onClick={() => setFilterStarredOnly(false)}
                className="bg-amber-400 text-black font-bold text-[10px] px-2 py-0.5 rounded-full cursor-pointer hover:bg-amber-300"
              >
                Show All
              </button>
            </div>
          )}

          {/* SEARCH BAR IN WP VIEW - IOS GLASS */}
          {showWpSearch && (
            <div className="backdrop-blur-2xl bg-black/50 border-b border-white/10 px-4 py-2.5 flex items-center gap-2.5 z-20">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text"
                value={wpSearchQuery}
                onChange={(e) => setWpSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none"
                autoFocus
              />
              {wpSearchQuery && (
                <button onClick={() => setWpSearchQuery('')} className="text-gray-400 hover:text-white">
                  <X size={15} />
                </button>
              )}
              <button onClick={() => { setShowWpSearch(false); setWpSearchQuery(''); }} className="text-xs text-emerald-400 font-semibold cursor-pointer">
                Close
              </button>
            </div>
          )}

          {/* INCOMING CALL BANNER - IOS GLASS */}
          {isIncomingCall && !isInAudioCall && (
            <div className="absolute top-16 left-0 right-0 z-[99999] backdrop-blur-2xl bg-black/75 border-b-2 border-emerald-400/80 p-3 px-5 flex items-center justify-between text-white shadow-2xl animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2.5">
                <Phone size={20} className="text-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white">Incoming Whisper Audio Call...</p>
                  <p className="text-[10px] text-gray-300">Secure Peer-to-Peer Stream</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleAcceptIncomingCall}
                  className="backdrop-blur-md bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  Answer
                </button>
                <button
                  type="button"
                  onClick={() => setIsIncomingCall(false)}
                  className="backdrop-blur-md bg-rose-600 hover:bg-rose-500 border border-rose-400/40 text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE WHISPER AUDIO CALL OVERLAY - IOS GLASS */}
          {isInAudioCall && (
            <div className="backdrop-blur-2xl bg-black/60 border-b border-white/10 p-3 px-4 flex flex-col gap-2 shrink-0 animate-in slide-in-from-top duration-200 shadow-xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold">Whisper Call Active ({formatCallTime(callDurationSec)})</span>
                </div>
                <span className="text-[10px] backdrop-blur-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
                  {isWhisperModeEnabled ? '🤫 Whisper & Noise Scrambler ON' : 'HD Call'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsWhisperModeEnabled(!isWhisperModeEnabled)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isWhisperModeEnabled ? 'backdrop-blur-md bg-emerald-600 text-white shadow-lg border border-emerald-400/40' : 'backdrop-blur-md bg-white/10 text-gray-200 hover:text-white border border-white/10'
                  }`}
                >
                  <Radio size={13} />
                  <span>{isWhisperModeEnabled ? 'Whisper Mode Active' : 'Enable Whisper Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCallMuted(!isCallMuted)}
                  className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all backdrop-blur-md border border-white/10 ${
                    isCallMuted ? 'bg-rose-600 text-white' : 'bg-white/10 text-gray-200'
                  }`}
                  title={isCallMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isCallMuted ? <MicOff size={15} /> : <Mic size={15} />}
                </button>

                <button
                  type="button"
                  onClick={handleEndAudioCall}
                  className="backdrop-blur-md bg-rose-600 hover:bg-rose-500 border border-rose-400/40 text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow active:scale-95 transition-all"
                >
                  End Call
                </button>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES BODY - IOS LIQUID GLASS CHAT BUBBLES */}
          <div 
            ref={wpChatScrollRef}
            onClick={() => { setShowWpMenu(false); setActiveReactionMsgId(null); }}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-transparent relative z-10"
          >
            {/* DATE DIVIDER - IOS FROSTED CAPSULE */}
            <div className="flex justify-center my-2 sticky top-1 z-10">
              <span className="backdrop-blur-xl bg-white/[0.08] border border-white/15 text-gray-300 text-[11px] font-semibold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                TODAY
              </span>
            </div>

            {filteredWpMessages.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-16 space-y-1">
                <p className="font-semibold text-gray-200">No messages found</p>
                <p className="text-[11px]">Messages are end-to-end encrypted and completely private.</p>
              </div>
            ) : (
              filteredWpMessages.map((m, idx) => {
                const isMine = m.senderRole === role;
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

                const isReactionOpen = activeReactionMsgId === m._id;

                return (
                  <React.Fragment key={m._id || idx}>
                    {/* UNREAD MESSAGES DIVIDER */}
                    {idx === firstUnreadIndex && (
                      <div className="flex items-center justify-center my-3 select-none">
                        <div className="flex-1 border-t border-emerald-500/30"></div>
                        <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-black rounded-full shadow tracking-wider uppercase">
                          Unread Messages
                        </span>
                        <div className="flex-1 border-t border-emerald-500/30"></div>
                      </div>
                    )}

                    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        onTouchStart={(e) => {
                          if (e.touches && e.touches[0]) {
                            touchStartXRef.current = e.touches[0].clientX;
                            activeSwipeMsgIdRef.current = m;
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (e.changedTouches && e.changedTouches[0]) {
                            const diffX = e.changedTouches[0].clientX - (touchStartXRef.current || 0);
                            if (diffX > 60 && activeSwipeMsgIdRef.current) {
                              handleStartReply(activeSwipeMsgIdRef.current);
                            }
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setActiveReactionMsgId(activeReactionMsgId === m._id ? null : m._id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleDoubleTapToLike(m._id);
                        }}
                        title="Double-tap to like ❤️ • Swipe right to reply • Click ⋯ for actions"
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 pt-2.5 pb-3.5 shadow-md relative cursor-pointer text-[14.5px] leading-relaxed transition-transform duration-100 will-change-transform ${
                          isMine 
                            ? 'bg-[#0f4431] border border-emerald-500/40 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] rounded-tr-none' 
                            : 'bg-[#182334] border border-slate-700/60 text-[#f1f5f9] shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-tl-none'
                        }`}
                      >
                        {/* FLOATING HEART ANIMATION ON DOUBLE-TAP */}
                        {doubleTapHeartAnimMsgId === m._id && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in duration-150">
                            <span className="text-4xl filter drop-shadow-[0_0_12px_#ec4899] animate-bounce">❤️</span>
                          </div>
                        )}

                        {hasReplyTag && (
                          <div className="backdrop-blur-md bg-black/40 border-l-2 border-emerald-400 pl-2.5 py-1 mb-1.5 text-xs text-emerald-300 italic truncate rounded">
                            {replySnippet}
                          </div>
                        )}

                        {/* MESSAGE CONTENT BY MEDIA TYPE */}
                        {m.mediaType === 'audio' ? (
                          <AudioMessageBubble audioUrl={m.text} isMine={isMine} />
                        ) : m.mediaType === 'video_note' ? (
                          <CircularVideoNoteBubble videoUrl={m.text} isMine={isMine} />
                        ) : m.mediaType === 'sticker' ? (
                          <div className="p-1 select-none flex items-center justify-center">
                            <img 
                              src={m.text} 
                              alt="Sticker" 
                              className="w-32 h-32 object-contain filter drop-shadow-md cursor-pointer hover:scale-105 transition-transform" 
                            />
                          </div>
                        ) : m.isMedia ? (
                          <div className="space-y-1">
                            <img 
                              src={m.text} 
                              alt="Shared Photo" 
                              className="max-h-64 rounded-xl object-contain cursor-pointer shadow-md" 
                              onClick={() => window.open(m.text, '_blank')} 
                            />
                          </div>
                        ) : cleanBody && cleanBody.includes('[GAME_CHALLENGE:') ? (
                          <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 border border-purple-500/50 rounded-2xl p-3 space-y-2 text-left my-1 shadow-lg select-none">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{cleanBody.includes('ludo') ? '🎲' : '⚔️'}</span>
                              <div>
                                <h4 className="text-xs font-black text-amber-300">
                                  {cleanBody.includes('ludo') ? 'Ludo Royale Challenge' : 'Couple Tic-Tac-Toe Duel'}
                                </h4>
                                <p className="text-[11px] text-gray-300">
                                  {cleanBody.replace(/\[GAME_CHALLENGE:[^\]]+\]\s*/, '')}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cleanBody.includes('ludo')) setShowLudoModal(true);
                                else setShowCoupleMiniGameModal(true);
                              }}
                              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black py-2 rounded-xl shadow cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>🎮 Join & Play Match Now!</span>
                            </button>
                          </div>
                        ) : (
                          <p className="break-words select-text">{renderTextWithLinks(cleanBody)}</p>
                        )}

                        {/* REACTION & ACTIONS POPUP TRAY - IOS LIQUID GLASS */}
                        {isReactionOpen && (
                          <div 
                            className={`absolute -top-12 z-30 backdrop-blur-2xl bg-black/95 border border-white/25 px-2.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 animate-in zoom-in-95 duration-100 max-w-[calc(100vw-36px)] overflow-x-auto scrollbar-none whitespace-nowrap ${isMine ? 'right-0' : 'left-0'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {["👍", "❤️", "😂", "😮", "🙏", "➕"].map((emoji, eIdx) => (
                              <button
                                key={eIdx}
                                type="button"
                                onClick={() => {
                                  if (emoji === '➕') {
                                    setShowWhatsAppMediaTray(true);
                                    setActiveReactionMsgId(null);
                                  } else {
                                    handleSelectReaction(m._id, emoji);
                                  }
                                }}
                                className="text-base p-0.5 hover:scale-125 transition-transform cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                            <div className="w-[1px] h-4 bg-white/20 mx-0.5" />
                            <button
                              type="button"
                              onClick={() => {
                                handleTogglePinMessage(m._id, !m.isPinned);
                                setActiveReactionMsgId(null);
                              }}
                              className={`text-xs px-2 py-0.5 rounded-lg hover:scale-110 transition-transform cursor-pointer flex items-center gap-1 ${
                                m.isPinned ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'text-gray-300 hover:text-white'
                              }`}
                              title={m.isPinned ? "Unpin message" : "Pin message"}
                            >
                              <Pin size={11} className={m.isPinned ? "text-emerald-400 rotate-45" : ""} />
                              <span>{m.isPinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleToggleStarMessage(m._id, !m.isStarred);
                                setActiveReactionMsgId(null);
                              }}
                              className={`text-xs px-2 py-0.5 rounded-lg hover:scale-110 transition-transform cursor-pointer flex items-center gap-1 ${
                                m.isStarred ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-gray-300 hover:text-white'
                              }`}
                              title={m.isStarred ? "Unstar message" : "Star message"}
                            >
                              <Star size={11} className={m.isStarred ? "text-amber-400 fill-amber-400" : ""} />
                              <span>{m.isStarred ? 'Unstar' : 'Star'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleStartReply(m);
                                setActiveReactionMsgId(null);
                              }}
                              className="text-xs px-2 py-0.5 rounded-lg hover:scale-110 text-gray-300 hover:text-white transition-transform cursor-pointer flex items-center gap-1"
                              title="Reply"
                            >
                              <CornerUpLeft size={11} />
                              <span>Reply</span>
                            </button>
                          </div>
                        )}

                        {/* MESSAGE REACTION BADGE */}
                        {m.reaction && (
                          <span className="absolute -bottom-2 right-2 backdrop-blur-md bg-black/70 border border-white/20 px-2 py-0.5 rounded-full text-xs shadow-lg">
                            {m.reaction}
                          </span>
                        )}

                        {/* TIME, DELIVERY TICKS & AWARD BUTTON */}
                        <div className="flex items-center justify-between gap-2 mt-2 pt-1 pb-0.5 text-[11px] text-gray-400 select-none font-normal">
                          {!isMine ? (
                            <div className="relative inline-flex items-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAwardMsgId(activeAwardMsgId === m._id ? null : m._id);
                                }}
                                title={'Award Love Karma to ' + partnerName}
                                className="px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-md bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-300 hover:text-white cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                <Heart size={10} className="text-pink-400 fill-pink-400" />
                                <span>Award</span>
                              </button>

                              {activeAwardMsgId === m._id && (
                                <div 
                                  className="absolute left-0 bottom-6 z-50 backdrop-blur-2xl bg-black/85 border border-pink-500/50 p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1 w-48 text-left text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wider px-1">💖 Award {partnerName} Karma</p>
                                  <button
                                    type="button"
                                    onClick={() => handleAwardMessageKarma(m, 1.00, 'Cute Reaction')}
                                    className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                  >
                                    +1 ₹ Cute Reaction
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAwardMessageKarma(m, 3.00, 'Romantic Compliment Drop')}
                                    className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                  >
                                    +3 ₹ Sweet Compliment
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAwardMessageKarma(m, 5.00, 'Movie / Song Recommendation')}
                                    className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                  >
                                    +5 ₹ Song/Movie Pick
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAwardMessageKarma(m, 10.00, 'Deep Romantic Talk')}
                                    className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                  >
                                    +10 ₹ Romantic Talk
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : <span />}

                          <div className="flex items-center gap-1.5">
                            {m.isPinned && (
                              <Pin size={11} className="text-emerald-400 rotate-45 shrink-0" title="Pinned Message" />
                            )}
                            {m.isStarred && (
                              <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" title="Starred Message" />
                            )}
                            <span>{m.timeFormatted}</span>
                            {isMine && (
                              m.isSeen ? (
                                <CheckCheck size={14} className="text-cyan-400" title="Seen" />
                              ) : (isPartnerOnline || m.isDelivered) ? (
                                <CheckCheck size={14} className="text-gray-400" title="Delivered" />
                              ) : (
                                <Check size={14} className="text-gray-400" title="Sent" />
                              )
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReactionMsgId(activeReactionMsgId === m._id ? null : m._id);
                              }}
                              className="opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-opacity cursor-pointer shrink-0 ml-0.5"
                              title="Reaction, Pin & Star Menu"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messageEndRef} />
          </div>

          {replyTarget && (
            <div className="backdrop-blur-xl bg-black/60 border-t border-white/10 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-400">
              <span className="truncate italic">Replying to: "{replyTarget.text}"</span>
              <button onClick={() => setReplyTarget(null)} className="text-gray-400 hover:text-white cursor-pointer"><X size={15} /></button>
            </div>
          )}

          {/* WHATSAPP BOTTOM INPUT BAR & VOICE NOTE RECORDER */}
          {isRecordingVoiceNote ? (
            <div className="backdrop-blur-2xl bg-black/85 px-4 py-3 flex items-center justify-between gap-3 shrink-0 border-t border-rose-500/30 z-20 shadow-2xl animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-rose-300">
                  {Math.floor(voiceNoteSeconds / 60).toString().padStart(2, '0')}:{(voiceNoteSeconds % 60).toString().padStart(2, '0')}
                </span>
                <div className="flex items-center gap-0.5 ml-2">
                  {[4, 12, 8, 16, 10, 14, 6, 12].map((h, i) => (
                    <div 
                      key={i} 
                      style={{ height: `${h}px` }} 
                      className="w-1 bg-rose-400/80 rounded-full animate-pulse" 
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelVoiceNote}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStopAndSendVoiceNote}
                  className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all"
                  title="Send Voice Note"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="backdrop-blur-2xl bg-black/45 sm:bg-[#0c181f]/70 px-2.5 sm:px-4 py-2.5 flex items-center gap-2 shrink-0 border-t border-white/10 z-20 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
              <button 
                type="button"
                onClick={() => setShowWhatsAppMediaTray(!showWhatsAppMediaTray)}
                className="backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 hover:border-white/25 text-gray-300 hover:text-white p-2 rounded-full transition-all cursor-pointer active:scale-95"
                title="Emojis & Stickers"
              >
                <Smile size={20} />
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 hover:border-white/25 text-gray-300 hover:text-white p-2 rounded-full transition-all cursor-pointer active:scale-95 shrink-0"
                title="Attach Photo or Document"
              >
                <Paperclip size={19} />
              </button>
              <button 
                type="button"
                onClick={() => setShowCircularVideoNoteModal(true)}
                className="backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 hover:border-white/25 text-purple-300 hover:text-white p-2 rounded-full transition-all cursor-pointer active:scale-95 shrink-0"
                title="Instant Camera & Video"
              >
                <Camera size={19} />
              </button>
              <textarea 
                ref={wpInputRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onFocus={() => {
                  if (wpChatScrollRef.current) {
                    wpChatScrollRef.current.scrollTop = wpChatScrollRef.current.scrollHeight;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 backdrop-blur-xl bg-white/[0.08] border border-white/15 focus:border-emerald-400/50 text-[#e9edef] placeholder-gray-400 text-[14.5px] px-4 py-2.5 rounded-full outline-none resize-none max-h-28 overflow-y-auto leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all"
              />
              {input.trim().length > 0 ? (
                <button 
                  type="submit" 
                  className="w-10 h-10 rounded-full backdrop-blur-md bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 border border-emerald-300/40 text-white flex items-center justify-center cursor-pointer shadow-[0_0_18px_rgba(16,185,129,0.45)] transition-all active:scale-90 shrink-0"
                  title="Send Message"
                >
                  <Send size={16} className="translate-x-0.5" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleStartVoiceNoteRecording}
                  className="w-10 h-10 rounded-full backdrop-blur-md bg-emerald-600/40 hover:bg-emerald-500/60 border border-emerald-400/40 text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-sm shrink-0"
                  title="Click to Record Voice Note"
                >
                  <Mic size={18} />
                </button>
              )}
            </form>
          )}

          {/* WHATSAPP RICH MEDIA TRAY (EMOJIS, STICKERS, ADD FROM WEB) */}
          <WhatsAppMediaTray
            isOpen={showWhatsAppMediaTray}
            onClose={() => setShowWhatsAppMediaTray(false)}
            onSelectEmoji={handleEmojiClick}
            onSelectSticker={handleSendSticker}
          />

          {/* CIRCULAR 60-SECOND VIDEO NOTE RECORDER MODAL */}
          <CircularVideoNoteModal
            isOpen={showCircularVideoNoteModal}
            onClose={() => setShowCircularVideoNoteModal(false)}
            onSendVideoNote={handleSendVideoNote}
            onSendPhoto={handleSendInstantPhoto}
          />
        </aside>
      )}


      {/* SECURITY PIN GATE MODAL FOR UPGRADE VIEW WITH INSTANT AUTO-UNLOCK & ANIMATION */}
      {/* IOS INSTALLATION HELPER GUIDE MODAL */}
      {showIosInstallGuide && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-emerald-500/50 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 font-sans text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl">
              📱
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Install on iPhone / iPad</h3>
              <p className="text-xs text-gray-400">Install as a full-screen app in 3 quick steps:</p>
            </div>

            <div className="space-y-3 text-left text-xs bg-[#1a1a1a] p-4 rounded-2xl border border-[#2a2a2a]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">1</span>
                <p className="text-gray-200">Tap the <strong className="text-emerald-400">Share button</strong> (square with up arrow) in the bottom bar of Safari.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">2</span>
                <p className="text-gray-200">Scroll down and tap <strong className="text-emerald-400">"Add to Home Screen"</strong> (+ icon).</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">3</span>
                <p className="text-gray-200">Tap <strong className="text-white">Add</strong> in the top-right corner.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosInstallGuide(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl cursor-pointer shadow active:scale-95 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-emerald-500/55 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-center font-sans transform animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <Lock size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Security PIN Verification</h3>
              <p className="text-xs text-gray-400">
                Enter 4-digit PIN to access WP view
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input 
                type="password"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={handlePinInputChange}
                placeholder="••••"
                className="w-36 bg-[#1a1a1a] border border-[#333] text-center tracking-[1em] text-white text-xl py-3 rounded-2xl outline-none focus:border-emerald-400 font-mono mx-auto block"
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-bold">Incorrect PIN! Automatically cleared.</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-bold py-3 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl cursor-pointer shadow"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main 
        onTouchStart={handleSidebarTouchStart}
        onTouchMove={handleSidebarTouchMove}
        onTouchEnd={handleSidebarTouchEnd}
        className="flex-1 flex flex-col relative bg-[#000000] overflow-hidden min-w-0"
      >
        {/* MOBILE LEFT EDGE SWIPE SENSOR (TOUCH FROM LEFT TO OPEN SIDEBAR) */}
        <div 
          className="fixed inset-y-0 left-0 w-6 z-20 md:hidden pointer-events-auto"
          onTouchStart={handleSidebarTouchStart}
          onTouchMove={handleSidebarTouchMove}
          onTouchEnd={handleSidebarTouchEnd}
          title="Swipe right from edge to open chats"
        />
        {/* MOBILE CHATGPT HEADER (MATCHING OFFICIAL CHATGPT APP - IMAGE 1) */}
        <header className="md:hidden h-14 bg-black flex items-center justify-between px-3 shrink-0 z-20 select-none gap-2">
          {/* LEFT: CIRCULAR HAMBURGER BUTTON */}
          <button 
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full bg-[#212121] active:bg-[#2c2c2c] text-white flex items-center justify-center transition-transform active:scale-95 shadow cursor-pointer shrink-0"
            title="Open Menu"
          >
            <Menu size={20} className="text-white" />
          </button>

          {/* CENTER: GET PLUS (SLIGHTLY LEFT) & LOVE BALANCE PILL */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* GET PLUS PILL BUTTON -> OPENS PIN GATE FOR WHATSAPP UPGRADE VIEW */}
            <button
              type="button"
              onClick={handleUpgradeClick}
              className="px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95 shadow cursor-pointer shrink-0 bg-[#1e2430] hover:bg-[#283244] text-[#8cb2ea] border border-[#2d3a4f]/50"
              title="Get Plus (Enter PIN for WhatsApp View)"
            >
              <Sparkles size={13} className="text-[#8cb2ea] fill-[#8cb2ea]/30" />
              <span className="text-xs font-semibold tracking-wide whitespace-nowrap">Get Plus</span>
            </button>

            {/* LOVE BALANCE PILL BUTTON -> OPENS PASSBOOK */}
            {role === 'parent' ? (
              <button
                type="button"
                onClick={() => {
                  setShowLoveBalanceModal(true);
                  setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook');
                }}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-[#141414] hover:bg-[#1f1f1f] border text-white shadow active:scale-95 cursor-pointer shrink-0 ${
                  hasIncomingPendingWish
                    ? 'border-pink-500 animate-pulse bg-pink-950/40 ring-1 ring-pink-500'
                    : 'border-[#2d3a4f]'
                }`}
                title="Admin: Dora & Darsh Love Balance"
              >
                <span className="flex items-center gap-0.5 text-[10px] font-mono whitespace-nowrap">
                  <span className="text-xs">❤️</span>
                  <span className={doraNetBalance >= 0 ? 'text-pink-300 font-bold' : 'text-rose-400 font-bold'}>
                    ₹{formatLoveBalance(doraNetBalance)}
                  </span>
                </span>
                <span className="text-gray-600 text-[10px]">|</span>
                <span className="flex items-center gap-0.5 text-[10px] font-mono whitespace-nowrap">
                  <span className="text-xs">👑</span>
                  <span className={adminNetBalance >= 0 ? 'text-amber-300 font-bold' : 'text-rose-400 font-bold'}>
                    ₹{formatLoveBalance(adminNetBalance)}
                  </span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowLoveBalanceModal(true);
                  setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook');
                }}
                className={`px-2.5 py-1.5 rounded-full flex items-center gap-1.5 bg-[#141414] hover:bg-[#1f1f1f] border text-white shadow active:scale-95 cursor-pointer shrink-0 ${
                  hasIncomingPendingWish
                    ? 'border-pink-500 animate-pulse bg-pink-950/40 ring-1 ring-pink-500'
                    : 'border-pink-500/30'
                }`}
                title="Dora: My Love Balance"
              >
                <span className="text-xs">❤️</span>
                <span className={`text-xs font-mono font-bold whitespace-nowrap ${doraNetBalance >= 0 ? 'text-pink-300' : 'text-rose-400'}`}>
                  ₹{formatLoveBalance(doraNetBalance)}
                </span>
              </button>
            )}
          </div>

          {/* RIGHT: CIRCULAR NEW CHAT BUTTON */}
          <button
            type="button"
            onClick={handleNewChat}
            className="w-10 h-10 rounded-full bg-[#212121] active:bg-[#2c2c2c] text-white flex items-center justify-center transition-transform active:scale-95 shadow cursor-pointer shrink-0"
            title="New Chat"
          >
            <SquarePen size={18} className="text-gray-200" />
          </button>
        </header>

        {/* DESKTOP CHATGPT HEADER (hidden md:flex) */}
        <header className="hidden md:flex h-14 items-center justify-between px-4 shrink-0 z-10 border-b border-[#141414]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="hidden md:flex items-center gap-1.5 bg-[#181818] hover:bg-[#252525] border border-[#2e2e2e] text-gray-200 hover:text-white p-2 rounded-xl active:scale-95 cursor-pointer shrink-0 shadow-sm"
                title="Open Sidebar Menu"
              >
                <PanelLeft size={17} className="text-emerald-400" />
              </button>
            )}

            <div 
              onClick={() => {
                if (viewMode === 'admin_dashboard') setViewMode('real_gpt');
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity select-none py-1 px-1.5 rounded-xl hover:bg-[#1a1a1a]"
              title="ChatGPT 4o mini"
            >
              <span className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center p-1 shadow-sm shrink-0">
                <ChatGPTLogo className="w-4 h-4 text-black" />
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-100 text-sm tracking-tight">
                <span>ChatGPT</span>
                <span className="text-xs text-gray-400 font-normal hidden sm:inline">4o mini</span>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>

            {viewMode === 'codex' && (
              <span className="text-xs bg-[#1f1f1f] text-emerald-400 px-2 py-0.5 rounded font-mono border border-[#333]">
                Codex
              </span>
            )}

            {role === 'parent' && (
              <div className="flex items-center gap-1.5 sm:gap-2">


                <button
                  onClick={downloadFullChatPDF}
                  title="Click to export chat PDF manually (Auto-downloads daily at 7:20 PM)"
                  className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)] active:scale-95 shrink-0"
                >
                  <Timer size={15} className="text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="hidden md:inline">7:20 PM: <AutoDownloadCountdown /></span>
                  <span className="md:hidden text-[11px] font-mono">7:20 PM</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 text-xs md:text-sm text-[#9b9b9b] shrink-0">
            <span 
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                !isConnected 
                  ? 'bg-zinc-600' 
                  : (hasUnreadSecret ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]')
              }`} 
              title={
                !isConnected 
                  ? 'Connecting...' 
                  : (hasUnreadSecret ? 'Unread Secret Message Pending!' : 'Server Connected')
              } 
            />
            
            
            {/* VOICE CALL INITIATION BUTTON */}
            <button 
              type="button"
              onClick={handleStartAudioCall}
              className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 hover:text-white px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all shadow active:scale-95"
              title="Start Whisper Voice Call"
            >
              <Phone size={13} className={isInAudioCall ? 'animate-pulse text-emerald-400' : ''} />
              <span>Call</span>
            </button>

            {/* LOVE BALANCE BUTTON PILL (SHOW BOTH FOR DARSH, DORA ONLY SEES DORA) */}
            {role === 'parent' ? (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold shrink-0 transition-all ${
                  hasIncomingPendingWish
                    ? 'bg-pink-900/60 border-2 border-pink-400 text-white animate-pulse ring-2 ring-pink-500 shadow-[0_0_18px_rgba(244,63,94,0.85)]'
                    : 'bg-emerald-950/50 border border-emerald-500/60 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                }`}
                title={hasIncomingPendingWish ? "Incoming Wish Request Waiting! Tap to Review & Approve" : `${activeDoraName}: 💕 Love Balance | Darsh: 👑 Love Balance (Click either to view passbook)`}
              >
                {hasIncomingPendingWish && (
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping mr-0.5 shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => { setActiveLbTarget('user'); setShowLoveBalanceModal(true); setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook'); }}
                  className={`flex items-center gap-1 hover:text-white cursor-pointer transition-all active:scale-95 ${Number(doraNetBalance || 0) < 0 ? 'text-rose-400 font-bold' : 'text-pink-300'}`}
                  title={`${activeDoraName}'s Available Balance`}
                >
                  <span className="text-[10px] text-pink-400/80 font-sans font-semibold">{activeDoraName}:</span>
                  <span>{Number(doraNetBalance || 0) < 0 ? '💔' : '💕'}</span>
                  <span>{formatLoveBalance(doraNetBalance)}</span>
                </button>
                <span className="text-emerald-700">|</span>
                <button
                  type="button"
                  onClick={() => { setActiveLbTarget('admin'); setShowLoveBalanceModal(true); setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook'); }}
                  className={`flex items-center gap-1 hover:text-white cursor-pointer transition-all active:scale-95 ${Number(adminNetBalance || 0) < 0 ? 'text-rose-400 font-bold' : 'text-blue-300'}`}
                  title="Darsh's Available Balance"
                >
                  <span className="text-[10px] text-blue-400/80 font-sans font-semibold">Darsh:</span>
                  <span>{Number(adminNetBalance || 0) < 0 ? '💔' : '👑'}</span>
                  <span>{formatLoveBalance(adminNetBalance)}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab(hasIncomingPendingWish ? 'claimed' : 'passbook'); }}
                className={`flex items-center gap-1 border px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shrink-0 ${
                  hasIncomingPendingWish
                    ? 'bg-pink-900/70 border-2 border-pink-400 text-white animate-pulse ring-2 ring-pink-500 shadow-[0_0_18px_rgba(244,63,94,0.85)]'
                    : (Number(doraNetBalance || 0) < 0 ? 'bg-emerald-950/50 border-rose-500/70 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]')
                } hover:text-white`}
                title={hasIncomingPendingWish ? "Incoming Wish Request Waiting! Tap to Review & Approve" : "Open Love Balance Passbook & Wish Store"}
              >
                {hasIncomingPendingWish && (
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping mr-0.5 shrink-0" />
                )}
                <span>{Number(doraNetBalance || 0) < 0 ? '💔' : '💕'}</span>
                <span>{formatLoveBalance(doraNetBalance)}</span>
              </button>
            )}

            {/* HEADER REFRESH BUTTON */}
            <button
              type="button"
              onClick={() => handleManualSectionRefresh('chat_header')}
              className="w-7 h-7 rounded-full bg-[#181818] hover:bg-emerald-600/30 border border-[#333] hover:border-emerald-500 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
              title="Refresh Chat & Balance"
            >
              <RefreshCw size={12} className={refreshingSection === 'chat_header' ? 'animate-spin text-emerald-400' : ''} />
            </button>

            {/* UPGRADE BUTTON - ONLY FOR DESIGNATED DORA OR ADMIN */}
            {(role === 'parent' || isCurrentUserDora) && (
              <button 
                onClick={handleUpgradeClick}
                className="hidden sm:flex items-center gap-1.5 text-white hover:text-gray-200 cursor-pointer font-medium"
              >
                <span>Upgrade</span>
              </button>
            )}

            {/* MOBILE NOTIFICATION TOGGLE / STATUS */}
            <button
              type="button"
              onClick={async () => {
                const res = await requestNotificationAccess();
                if (res === 'granted') {
                  alert("Mobile Notifications Activated! Instant alerts will notify on incoming secret messages.");
                } else if (res === 'denied') {
                  alert("Notifications blocked in browser settings. Please enable notifications in site permissions.");
                }
              }}
              className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                notificationPermission === 'granted'
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-amber-400 hover:text-amber-300 animate-pulse'
              }`}
              title={notificationPermission === 'granted' ? "Mobile Notifications: ACTIVE" : "Click to Turn ON Mobile Notifications"}
            >
              {notificationPermission === 'granted' ? <Bell size={15} /> : <BellRing size={15} />}
            </button>
            

            <button className="p-1.5 text-white hover:text-gray-200 cursor-pointer" onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {autoplayBlocked && (
          <div 
            onClick={handleManualUnmuteClick}
            className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-4 py-2 text-xs flex items-center justify-between cursor-pointer animate-pulse z-30 font-medium"
          >
            <div className="flex items-center gap-2 truncate">
              <VolumeX size={16} className="shrink-0" />
              <span className="truncate">Tap here to unmute synchronized playback</span>
            </div>
            <span className="bg-amber-500 text-black font-bold px-2 py-0.5 rounded text-xs shrink-0 ml-2">Unmute</span>
          </div>
        )}

        {syncStatus === 'connected' && activeVideoId && viewMode !== 'scheduled' && viewMode !== 'codex' && (
          <div className="bg-[#141414]/95 border-b border-[#2a2a2a] px-4 py-2 flex items-center justify-between z-20 text-xs backdrop-blur-md shadow-lg shrink-0">
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Music size={14} className={isPlaying ? 'animate-bounce' : ''} />
              </div>
              <span className="text-gray-300 truncate font-mono text-xs">
                🎵 <strong className="text-white">Live:</strong> {activeTrackTitle || "Synced Track"}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleTogglePlayPause}
                className="bg-[#222] hover:bg-[#333] text-white p-1.5 px-2.5 rounded-xl flex items-center gap-1 cursor-pointer text-xs font-semibold border border-[#333]"
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => setViewMode('scheduled')}
                className="text-amber-400 text-xs font-semibold px-2 py-1 cursor-pointer underline decoration-dotted"
              >
                Lounge
              </button>
              <button
                onClick={handleDisconnectSync}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 p-1.5 rounded-xl cursor-pointer"
                title="Disconnect Audio completely"
              >
                <Unlink size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE PLUGIN GAME VIEW: LUDO ROYAL CLASH (MULTIPLAYER) */}
        {activeGame ? (
          <section className="flex-1 overflow-y-auto px-1 sm:px-4 py-2 sm:py-4 max-w-2xl w-full mx-auto space-y-3 scrollbar-none font-sans flex flex-col items-center justify-center">
            <div className="w-full bg-[#121212] border-2 border-amber-500/50 rounded-3xl p-2.5 sm:p-6 shadow-2xl relative space-y-3 sm:space-y-4 text-center">
              
              {/* HEADER BAR */}
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">🎲</span>
                  <div className="text-left">
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <span>Ludo Royal Clash</span>
                      <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">LIVE 2P</span>
                    </h2>
                    <p className="text-[11px] text-gray-400">Darsh (Red) vs Dora (Green)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetLudo}
                    className="bg-[#222] hover:bg-[#333] text-amber-400 p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border border-[#333]"
                    title="Reset Board"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button 
                    onClick={() => setActiveGame(null)} 
                    className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* LIVE SCOREBOARD & TURN INDICATOR */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between px-4 ${
                  ludoTurn === 'H' 
                    ? 'bg-red-950/60 border-red-500 text-red-200 ring-2 ring-red-500/50 shadow-lg shadow-red-900/30 animate-pulse' 
                    : 'bg-[#181818] border-[#2c2c2c] text-gray-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <span className="font-bold">Darsh (Red)</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <Trophy size={14} className="text-amber-400" />
                    <span>{scores.H}</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between px-4 ${
                  ludoTurn === 'A' 
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-900/30 animate-pulse' 
                    : 'bg-[#181818] border-[#2c2c2c] text-gray-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="font-bold">Dora (Green)</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <Trophy size={14} className="text-amber-400" />
                    <span>{scores.A}</span>
                  </div>
                </div>
              </div>

              {/* WINNER BANNER */}
              {winnerMessage && (
                <div className="bg-gradient-to-r from-amber-500/30 via-emerald-500/30 to-amber-500/30 border-2 border-amber-400 text-amber-200 py-3 px-4 rounded-2xl text-xs font-black animate-bounce shadow-xl flex items-center justify-center gap-2">
                  <Trophy size={18} className="text-amber-400 animate-spin" />
                  <span>{winnerMessage}</span>
                  <button
                    onClick={handleResetLudo}
                    className="ml-3 bg-amber-500 hover:bg-amber-400 text-black px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              )}

              {/* STATUS BAR */}
              <div className="bg-[#181818] border border-[#262626] p-2 rounded-xl text-xs font-medium text-amber-300">
                {ludoStatusMsg}
              </div>

              {/* --- COLORFUL AUTHENTIC LUDO BOARD --- */}
              <div className="w-full max-w-[390px] aspect-square mx-auto bg-[#f8fafc] border-4 border-amber-500/80 rounded-3xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative select-none flex flex-col justify-between overflow-hidden">
                
                {/* TOP HALF: RED BASE | TOP ARM | GREEN BASE */}
                <div className="h-[40%] flex justify-between gap-1.5">
                  {/* RED BASE (ADMIN H) */}
                  <div className="w-[40%] h-full bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-2xl p-2 border-2 border-red-800 shadow-md flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-black text-white px-1">
                      <span>RED BASE</span>
                      <span>👑 H</span>
                    </div>
                    <div className="bg-white/90 rounded-xl p-2 h-[75%] grid grid-cols-2 gap-2 place-items-center shadow-inner">
                      {[0, 1, 2, 3].map((tIdx) => {
                        const inYard = ludoTokens.H[tIdx] === -1;
                        const isMovable = movableTokens.includes(tIdx) && ludoTurn === 'H';
                        return (
                          <div 
                            key={tIdx} 
                            onClick={() => {
                              if (isMovable && ((isCurrentAdmin && ludoTurn === 'H') || (!isCurrentAdmin && ludoTurn === 'A'))) {
                                executeLudoMove('H', tIdx, diceVal);
                              }
                            }}
                            className={`w-8 h-8 rounded-full border-2 border-dashed border-red-300 flex items-center justify-center transition-transform ${
                              inYard ? 'bg-red-100' : 'bg-gray-100 opacity-40'
                            } ${isMovable ? 'cursor-pointer scale-110 ring-4 ring-amber-400 animate-bounce' : ''}`}
                            title={`Token H${tIdx + 1}`}
                          >
                            {inYard && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white text-[11px] font-black flex items-center justify-center shadow-md border border-white">
                                H{tIdx + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TOP ARM TILES */}
                  <div className="w-[18%] h-full bg-[#e2e8f0] rounded-xl border border-gray-300 p-1 flex flex-col justify-between">
                    <div className="text-[9px] font-black text-gray-500 text-center uppercase tracking-tighter">Safe Spot</div>
                    <div className="w-full flex-1 flex flex-col justify-around py-1">
                      <div className="h-6 w-full rounded bg-amber-400/30 border border-amber-400 flex items-center justify-center text-amber-600 text-xs font-bold" title="Safe Star Cell">
                        ★
                      </div>
                      <div className="text-[10px] text-gray-400 text-center font-mono font-bold">28 Tiles</div>
                      <div className="h-6 w-full rounded bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 text-xs font-bold">
                        ↓
                      </div>
                    </div>
                  </div>

                  {/* GREEN BASE (USER A) */}
                  <div className="w-[40%] h-full bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-2 border-2 border-emerald-800 shadow-md flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-black text-white px-1">
                      <span>GREEN BASE</span>
                      <span>👑 A</span>
                    </div>
                    <div className="bg-white/90 rounded-xl p-2 h-[75%] grid grid-cols-2 gap-2 place-items-center shadow-inner">
                      {[0, 1, 2, 3].map((tIdx) => {
                        const inYard = ludoTokens.A[tIdx] === -1;
                        const isMovable = movableTokens.includes(tIdx) && ludoTurn === 'A';
                        return (
                          <div 
                            key={tIdx} 
                            onClick={() => {
                              if (isMovable && ((isCurrentAdmin && ludoTurn === 'H') || (!isCurrentAdmin && ludoTurn === 'A'))) {
                                executeLudoMove('A', tIdx, diceVal);
                              }
                            }}
                            className={`w-8 h-8 rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center transition-transform ${
                              inYard ? 'bg-emerald-100' : 'bg-gray-100 opacity-40'
                            } ${isMovable ? 'cursor-pointer scale-110 ring-4 ring-amber-400 animate-bounce' : ''}`}
                            title={`Token A${tIdx + 1}`}
                          >
                            {inYard && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[11px] font-black flex items-center justify-center shadow-md border border-white">
                                A{tIdx + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* MIDDLE HALF: RED RUNWAY | CENTER HOME TRIANGLE | GREEN RUNWAY */}
                <div className="h-[20%] flex justify-between items-center gap-1.5 my-1">
                  {/* RED RUNWAY COLUMN */}
                  <div className="w-[40%] h-full bg-red-100 rounded-xl border border-red-300 flex items-center justify-around px-2">
                    <span className="text-[10px] font-bold text-red-600">Start ★</span>
                    <span className="text-xs text-red-500 font-bold">➔ ➔ ➔</span>
                  </div>

                  {/* CENTER HOME CROWN */}
                  <div className="w-[18%] h-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-2xl border-2 border-amber-600 shadow-lg flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-xl">👑</span>
                    <span className="text-[8px] font-black text-amber-950 uppercase">HOME</span>
                  </div>

                  {/* GREEN RUNWAY COLUMN */}
                  <div className="w-[40%] h-full bg-emerald-100 rounded-xl border border-emerald-300 flex items-center justify-around px-2">
                    <span className="text-xs text-emerald-500 font-bold">⬅ ⬅ ⬅</span>
                    <span className="text-[10px] font-bold text-emerald-600">★ Start</span>
                  </div>
                </div>

                {/* ACTIVE TOKENS ON FIELD TRAY */}
                <div className="bg-white rounded-2xl p-2.5 border-2 border-gray-200 shadow-inner flex flex-col gap-1.5 text-left">
                  <div className="flex items-center justify-between text-[11px] font-black text-gray-600">
                    <span>ACTIVE TOKENS ON BOARD</span>
                    <span className="text-[9px] text-gray-400">Click highlighted token to move</span>
                  </div>
                  
                  {/* ACTIVE TOKENS ROW */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* RED PLAYER ACTIVE */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>H (Red):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ludoTokens.H.map((pos, tIdx) => {
                          if (pos === -1) return null;
                          const isMovable = movableTokens.includes(tIdx) && ludoTurn === 'H';
                          const isHome = pos === 33;
                          return (
                            <button
                              key={tIdx}
                              disabled={!isMovable || !(isCurrentAdmin ? ludoTurn === 'H' : ludoTurn === 'A')}
                              onClick={() => executeLudoMove('H', tIdx, diceVal)}
                              className={`p-1.5 px-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow ${
                                isHome 
                                  ? 'bg-amber-500 text-black border border-amber-600' 
                                  : 'bg-red-600 hover:bg-red-500 text-white'
                              } ${isMovable ? 'cursor-pointer ring-4 ring-amber-400 scale-105 animate-pulse' : 'opacity-85'}`}
                            >
                              <span>H{tIdx + 1}</span>
                              <span className="text-[10px] opacity-90 font-mono">[{isHome ? '👑 HOME' : `Step ${pos}/33`}]</span>
                            </button>
                          );
                        })}
                        {ludoTokens.H.every(p => p === -1) && (
                          <span className="text-[11px] text-gray-400 italic">All in base (Roll 6 to launch)</span>
                        )}
                      </div>
                    </div>

                    {/* GREEN PLAYER ACTIVE */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>A (Green):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ludoTokens.A.map((pos, tIdx) => {
                          if (pos === -1) return null;
                          const isMovable = movableTokens.includes(tIdx) && ludoTurn === 'A';
                          const isHome = pos === 33;
                          return (
                            <button
                              key={tIdx}
                              disabled={!isMovable || !(isCurrentAdmin ? ludoTurn === 'H' : ludoTurn === 'A')}
                              onClick={() => executeLudoMove('A', tIdx, diceVal)}
                              className={`p-1.5 px-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow ${
                                isHome 
                                  ? 'bg-amber-500 text-black border border-amber-600' 
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              } ${isMovable ? 'cursor-pointer ring-4 ring-amber-400 scale-105 animate-pulse' : 'opacity-85'}`}
                            >
                              <span>A{tIdx + 1}</span>
                              <span className="text-[10px] opacity-90 font-mono">[{isHome ? '👑 HOME' : `Step ${pos}/33`}]</span>
                            </button>
                          );
                        })}
                        {ludoTokens.A.every(p => p === -1) && (
                          <span className="text-[11px] text-gray-400 italic">All in base (Roll 6 to launch)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM HALF: YELLOW DECOR | BOTTOM TRACK | BLUE DECOR */}
                <div className="h-[22%] flex justify-between gap-1.5 mt-1">
                  <div className="w-[40%] h-full bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-2 border border-amber-600 flex items-center justify-center opacity-85 shadow-sm">
                    <span className="text-[11px] font-black text-amber-950">⭐ ROYAL LUDO</span>
                  </div>

                  <div className="w-[18%] h-full bg-[#e2e8f0] rounded-xl border border-gray-300 flex items-center justify-center">
                    <span className="text-amber-500 font-bold text-sm">★</span>
                  </div>

                  <div className="w-[40%] h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-2 border border-blue-700 flex items-center justify-center opacity-85 shadow-sm">
                    <span className="text-[11px] font-black text-white">CLASSIC 2026</span>
                  </div>
                </div>

              </div>

              {/* 3D ANIMATED DICE CONTROLLER BOX */}
              <div className="bg-[#141414] border-2 border-[#2c2c2c] p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl max-w-md mx-auto">
                <div className="flex items-center gap-3.5">
                  {/* 3D DICE */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black font-black text-3xl flex items-center justify-center shadow-xl border-2 border-white/60 transition-transform ${
                    isDiceRolling ? 'rotate-180 scale-110 animate-spin' : 'hover:scale-105'
                  }`}>
                    {diceVal}
                  </div>
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Current Turn:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ludoTurn === 'H' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {ludoTurn === 'H' ? 'Player H (Admin)' : 'Player A (User)'}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {(isCurrentAdmin && ludoTurn === 'H') || (!isCurrentAdmin && ludoTurn === 'A')
                        ? "✨ Your Turn to Roll!"
                        : "⏳ Opponent's Turn..."}
                    </p>
                  </div>
                </div>

                {/* ROLL BUTTON */}
                <button
                  type="button"
                  disabled={!((isCurrentAdmin && ludoTurn === 'H') || (!isCurrentAdmin && ludoTurn === 'A')) || isDiceRolling || winnerMessage}
                  onClick={handleLudoRoll}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                    ((isCurrentAdmin && ludoTurn === 'H') || (!isCurrentAdmin && ludoTurn === 'A')) && !winnerMessage
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black ring-4 ring-amber-500/30 active:scale-95'
                      : 'bg-[#222] text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Dices size={18} className={isDiceRolling ? 'animate-spin' : ''} />
                  <span>{isDiceRolling ? 'Rolling...' : 'Roll Dice'}</span>
                </button>
              </div>

            </div>
          </section>
        ) : (
          <>
            {viewMode === 'real_gpt' && (
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-4xl w-full mx-auto space-y-4 sm:space-y-6 scrollbar-none text-sm md:text-[14.5px] flex flex-col">
                {conversations.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 max-w-md mx-auto select-none my-auto">
                    <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center p-2.5 shadow-2xl mb-4">
                      <ChatGPTLogo className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-6">
                      What can I help with today?
                    </h2>
                    <div className="grid grid-cols-2 gap-2.5 w-full text-xs text-left">
                      <div 
                        onClick={() => setInput("Summarize a meeting or text")}
                        className="p-3 rounded-2xl border border-[#262626] bg-[#141414] hover:bg-[#1e1e1e] text-gray-300 cursor-pointer transition-colors"
                      >
                        <p className="font-semibold text-white mb-0.5">Summarize text</p>
                        <p className="text-[11px] text-gray-400">condense long paragraphs</p>
                      </div>
                      <div 
                        onClick={() => setInput("Help me write a reply")}
                        className="p-3 rounded-2xl border border-[#262626] bg-[#141414] hover:bg-[#1e1e1e] text-gray-300 cursor-pointer transition-colors"
                      >
                        <p className="font-semibold text-white mb-0.5">Help me write</p>
                        <p className="text-[11px] text-gray-400">draft professional reply</p>
                      </div>
                      <div 
                        onClick={() => setInput("Analyze and break down data")}
                        className="p-3 rounded-2xl border border-[#262626] bg-[#141414] hover:bg-[#1e1e1e] text-gray-300 cursor-pointer transition-colors"
                      >
                        <p className="font-semibold text-white mb-0.5">Analyze data</p>
                        <p className="text-[11px] text-gray-400">find insights and trends</p>
                      </div>
                      <div 
                        onClick={() => setInput("Code helper and debug syntax")}
                        className="p-3 rounded-2xl border border-[#262626] bg-[#141414] hover:bg-[#1e1e1e] text-gray-300 cursor-pointer transition-colors"
                      >
                        <p className="font-semibold text-white mb-0.5">Code helper</p>
                        <p className="text-[11px] text-gray-400">debug scripts and logic</p>
                      </div>
                    </div>
                  </div>
                )}

                {conversations.map((msg) => (
                  <div key={msg.id} className="w-full">
                    {msg.role === 'user' ? (
                      <div className="flex justify-end my-2 sm:my-3">
                        <div className="bg-[#1c3a6b] text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl max-w-[88%] sm:max-w-[80%] text-sm leading-relaxed shadow-lg whitespace-pre-wrap break-words select-text">
                          {renderTextWithLinks(msg.text)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full my-3 sm:my-4">
                        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-4 sm:p-6 shadow-2xl relative space-y-3 font-sans select-text">
                          <div className="flex items-center justify-between border-b border-[#282828] pb-2.5 text-[#a3a3a3]">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center p-1 shadow-sm shrink-0">
                                <ChatGPTLogo className="w-3.5 h-3.5 text-black" />
                              </span>
                              <span className="text-xs font-semibold text-gray-200">ChatGPT</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button className="hover:text-white cursor-pointer" title="Copy"><Copy size={15} /></button>
                              <button className="hover:text-white cursor-pointer" title="Download"><Download size={15} /></button>
                              <button className="hover:text-white cursor-pointer" title="Full Screen"><Maximize2 size={15} /></button>
                            </div>
                          </div>

                          <div className="text-[#ececf1] text-sm leading-[1.7] whitespace-pre-wrap break-words">
                            {renderTextWithLinks(msg.text)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic px-2">
                    <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center p-0.5 animate-spin">
                      <ChatGPTLogo className="w-3 h-3 text-black" />
                    </span>
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

            {viewMode === 'stealth' && (
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 max-w-4xl w-full mx-auto flex flex-col justify-center my-auto scrollbar-none">
                <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl font-mono text-xs md:text-[12.5px]">
                  <div className="bg-[#212121] px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between border-b border-[#2e2e2e] text-[#b4b4b4]">
                    <div className="flex items-center gap-2">
                      <Code size={15} className="text-[#888]" />
                      <span className="text-xs md:text-[13px] font-medium text-[#dedede]">JSON Schema</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button className="hover:text-white cursor-pointer p-1">
                        <Copy size={14} />
                      </button>
                      <button className="flex items-center gap-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-white px-2.5 py-1 rounded-md cursor-pointer text-xs font-medium">
                        <Play size={11} fill="currentColor" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 text-[#d4d4d4] space-y-2 overflow-x-hidden leading-relaxed text-[12px] md:text-[12.5px]">
                    <div><span className="text-[#c586c0]">import</span> <span className="text-[#9cdcfe]">random</span></div>
                    <br />
                    <div>
                      <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">generate_random_data</span>(<span className="text-[#9cdcfe]">size</span>=<span className="text-[#b5cea8]">10</span>):
                    </div>
                    <div className="pl-3 sm:pl-4"><span className="text-[#9cdcfe]">data</span> = []</div>
                    <div className="pl-3 sm:pl-4">
                      <span className="text-[#c586c0]">for</span> <span className="text-[#9cdcfe]">_</span> <span className="text-[#c586c0]">in</span> <span className="text-[#dcdcaa]">range</span>(<span className="text-[#9cdcfe]">size</span>):
                    </div>
                    <div className="pl-6 sm:pl-8">
                      <span className="text-[#9cdcfe]">number</span> = <span className="text-[#9cdcfe]">random</span>.<span className="text-[#dcdcaa]">randint</span>(<span className="text-[#b5cea8]">1</span>, <span className="text-[#b5cea8]">100</span>)
                    </div>
                    <div className="pl-6 sm:pl-8">
                      <span className="text-[#9cdcfe]">data</span>.<span className="text-[#dcdcaa]">append</span>(<span className="text-[#9cdcfe]">number</span>)
                    </div>
                    <div className="pl-3 sm:pl-4">
                      <span className="text-[#c586c0]">return</span> <span className="text-[#9cdcfe]">data</span>
                    </div>
                    <br />

                    <div className="border-y border-[#2a2a2a] py-2.5 my-2 bg-[#121212]/80 rounded-xl px-2.5 md:px-3.5">
                      <div className="text-[#6a9955] mb-1.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-2">
                          <span>{`# Active Schema Stream (Identity: ${role === 'user' ? 'A' : 'H'})`}</span>
                          {isPeerTyping && (
                            <span className="text-[#38bdf8] font-mono animate-pulse flex items-center gap-1.5 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                              {role === 'user' ? 'H' : 'A'} is typing...
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-gray-500 font-sans">
                          {role === 'parent' 
                            ? `Total (${displayedStealthMessages.length}) records [Permanent View]` 
                            : `Showing last (${displayedStealthMessages.length}) records`}
                        </span>
                      </div>

                      <div 
                        ref={streamContainerRef}
                        className="space-y-1 max-h-60 sm:max-h-64 overflow-y-auto pr-1 scrollbar-none flex flex-col"
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
                                onDoubleClick={() => handleStartReply(m)}
                                title="Double click to reply"
                                className={`group relative flex items-start justify-between px-2 py-1 rounded-lg transition-all gap-2 cursor-pointer ${
                                  isHighlighted ? 'bg-emerald-950/70 border border-emerald-500/50' : 'hover:bg-[#202020]'
                                }`}
                              >
                                <div className="flex-1 break-words overflow-wrap-anywhere text-left flex flex-wrap items-center text-xs">
                                  <span className="text-[#9cdcfe] shrink-0 font-bold">{displayName}</span>
                                  <span className="mx-1 text-[#d4d4d4]">=</span>

                                  {hasReplyTag && (
                                    <button
                                      type="button"
                                      onClick={() => handleScrollToMessage(m.replyRefId)}
                                      className="inline-flex items-center text-[10px] bg-[#222] hover:bg-[#2d2d2d] text-emerald-400 px-1.5 py-0.5 rounded border border-[#333] mr-1.5 cursor-pointer font-medium"
                                      title="Jump to quoted message"
                                    >
                                      {replySnippet}
                                    </button>
                                  )}

                                  {m.isMedia ? (
                                    <button 
                                      type="button"
                                      onClick={() => handleOpenViewOnce(m)}
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all border ${
                                        m.mediaOpened 
                                          ? 'bg-[#18261e] border-emerald-700 text-emerald-300' 
                                          : 'bg-[#252525] hover:bg-[#333] border-[#3d3d3d] text-amber-300'
                                      }`}
                                      title={m.mediaOpened ? "Asset viewed" : "Click to view once"}
                                    >
                                      {m.mediaOpened ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} className="text-amber-400 animate-pulse" />}
                                      <span>{m.mediaOpened ? '[Opened: binary_raw]' : '[View Once: payload_locked]'}</span>
                                    </button>
                                  ) : cleanBody && cleanBody.includes('[GAME_CHALLENGE:') ? (
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        if (cleanBody.includes('ludo')) setShowLudoModal(true);
                                        else setShowCoupleMiniGameModal(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black px-2.5 py-1 rounded-lg text-xs cursor-pointer shadow hover:from-amber-400 hover:to-yellow-400 active:scale-95 transition-all"
                                    >
                                      <span>{cleanBody.includes('ludo') ? '🎲 Join Ludo Royale' : '⚔️ Join Tic-Tac-Toe'}</span>
                                      <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded font-mono font-bold">PLAY</span>
                                    </button>
                                  ) : (
                                    <span className="text-[#ce9178] break-all">{`"${cleanBody}"`}</span>
                                  )}
                                  
                                  <button 
                                    type="button"
                                    onClick={() => handleStartReply(m)}
                                    title="Reply to this message"
                                    className="inline-flex items-center text-gray-400 hover:text-emerald-400 hover:scale-125 transition-transform px-1 ml-1 cursor-pointer font-bold text-xs"
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
                                    <span className="text-[#6a9955] text-[10px] shrink-0 font-mono cursor-pointer hover:text-emerald-400 transition-colors">
                                      {`[${m.timeFormatted}]`}
                                    </span>

                                    {isReactionOpen && (
                                      <div 
                                        className={`absolute -top-8 z-30 bg-[#1e1e1e] border border-[#3a3a3a] px-2 py-1 rounded-full shadow-2xl flex items-center gap-1.5 backdrop-blur-md max-w-[calc(100vw-36px)] overflow-x-auto scrollbar-none whitespace-nowrap ${m.senderRole === role ? 'right-0' : 'left-0'}`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {HOVER_REACTIONS.map((emoji, eIdx) => (
                                          <button
                                            key={eIdx}
                                            type="button"
                                            onClick={() => handleSelectReaction(m._id, emoji)}
                                            className="text-sm p-0.5 hover:scale-125 transition-transform cursor-pointer"
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {m.reaction && (
                                    <span className="ml-1 inline-flex items-center bg-[#252525] border border-[#383838] px-1.5 py-0.2 rounded-full text-[10px] shadow">
                                      {m.reaction}
                                    </span>
                                  )}
                                  
                                  {showStatusReceipt && (
                                    <span 
                                      className={`text-[12px] font-mono tracking-tighter shrink-0 ml-1 font-bold transition-colors duration-100 ${
                                        isSeen ? 'text-[#38bdf8]' : ((isPartnerOnline || m.isDelivered) ? 'text-gray-400' : 'text-gray-600')
                                      }`}
                                      title={isSeen ? "Seen by counterpart" : ((isPartnerOnline || m.isDelivered) ? "Delivered" : "Sent")}
                                    >
                                      {isSeen ? '..' : ((isPartnerOnline || m.isDelivered) ? '..' : '.')}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {m.senderRole !== role && (
                                    <div className="relative inline-flex items-center">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveAwardMsgId(activeAwardMsgId === m._id ? null : m._id);
                                        }}
                                        title={'Award Love Karma Points to ' + partnerName + ' for this message'}
                                        className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-pink-950/70 hover:bg-pink-900 border border-pink-700/60 text-pink-300 hover:text-white cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                                      >
                                        <Heart size={11} className="text-pink-400 fill-pink-400" />
                                        <span>Award</span>
                                      </button>

                                      {activeAwardMsgId === m._id && (
                                        <div 
                                          className="absolute right-0 top-6 z-50 bg-[#141414] border border-pink-500/50 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 w-44 text-left text-xs font-sans animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wider px-1">💖 Award {partnerName} Karma</p>
                                          <button
                                            type="button"
                                            onClick={() => handleAwardMessageKarma(m, 1.00, 'Cute Reaction')}
                                            className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                          >
                                            +1 ₹ Cute Reaction
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleAwardMessageKarma(m, 3.00, 'Romantic Compliment Drop')}
                                            className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                          >
                                            +3 ₹ Sweet Compliment
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleAwardMessageKarma(m, 5.00, 'Movie / Song Recommendation')}
                                            className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                          >
                                            +5 ₹ Song/Movie Pick
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleAwardMessageKarma(m, 10.00, 'Deep Romantic Talk')}
                                            className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                          >
                                            +10 ₹ Romantic Talk
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {role === 'parent' && (
                                    <button 
                                      type="button"
                                      onClick={(e) => togglePendingFlag(e, m)}
                                      title={m.flaggedPending ? "Mark as Resolved" : "Add to Answer Pending"}
                                      className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-all shrink-0 ${
                                        m.flaggedPending 
                                          ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105" 
                                          : "bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#383838]"
                                      }`}
                                    >
                                      !
                                    </button>
                                  )}
                                </div>
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

                        {/* --- SEPARATE DEDICATED ADMIN DASHBOARD (ADMIN PARENT ONLY) - IOS LIQUID GLASS & COMPACT EXPANDABLE ROWS --- */}
            {viewMode === 'admin_dashboard' && role === 'parent' && (
              <section className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 w-full max-w-7xl mx-auto space-y-3 font-sans animate-in fade-in duration-200">
                
                {/* DASHBOARD HERO HEADER - IOS LIQUID GLASS */}
                <div className="backdrop-blur-2xl bg-white/[0.06] dark:bg-black/35 border border-white/20 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] relative overflow-hidden">
                  <div className="absolute -top-16 -left-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-amber-400/90 via-amber-500/80 to-amber-600/90 text-black flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] border border-amber-300/60 font-black shrink-0">
                        👑
                      </div>
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h1 className="text-base sm:text-lg font-black text-white tracking-tight">Admin Command Center</h1>
                          <span className="text-[10px] backdrop-blur-md bg-amber-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.2 rounded-full font-bold">DARSH</span>
                        </div>
                        <p className="text-[11px] text-amber-200/80 font-mono">
                          Session Verified • Darsh (Superuser) • Master Access
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleAllAdminParts(!areAllAdminPartsExpanded)}
                        className="backdrop-blur-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow"
                        title="Expand or collapse all command center modules"
                      >
                        {areAllAdminPartsExpanded ? (
                          <>
                            <ChevronUp size={13} className="text-amber-400" />
                            <span>Collapse All</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} className="text-amber-400" />
                            <span>Expand All</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="backdrop-blur-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow md:hidden"
                      >
                        <PanelLeft size={13} className="text-emerald-400" />
                        <span>Menu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDailyAdminTab('review');
                          setViewMode('daily_projects');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow ${
                          dailySubmissions.filter(s => s.status === 'PENDING').length > 0
                            ? 'backdrop-blur-xl bg-amber-500/80 text-black border border-amber-300 animate-pulse'
                            : 'backdrop-blur-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-emerald-300'
                        }`}
                        title={`Review ${activeDoraName}'s Project Submissions & Hourly Tasks Proofs`}
                      >
                        <Briefcase size={13} />
                        <span>Project Submissions {dailySubmissions.filter(s => s.status === 'PENDING').length > 0 ? `(${dailySubmissions.filter(s => s.status === 'PENDING').length} PENDING)` : ''}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('real_gpt')}
                        className="backdrop-blur-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow"
                      >
                        <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center p-0.5 shrink-0">
                          <ChatGPTLogo className="w-2.5 h-2.5 text-black" />
                        </span>
                        <span>← Return to Chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleManualSectionRefresh('admin_command_center')}
                        className="backdrop-blur-xl bg-amber-500 hover:bg-amber-400 text-black p-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow active:scale-90"
                        title="Reload Dashboard"
                      >
                        <RefreshCw size={13} className={refreshingSection === 'admin_command_center' ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 SLEEK COMPACT LINE MODULES (STACKED IOS LIQUID GLASS ACCORDION) */}
                <div className="space-y-3 text-left font-sans">
                  
                  {/* ===================== PART 1: LOVE BALANCE CENTRAL ENGINE ===================== */}
                  <div className="backdrop-blur-2xl bg-white/[0.06] hover:bg-white/[0.08] border border-pink-500/30 hover:border-pink-500/50 rounded-2xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
                    {/* COMPACT LINE BAR */}
                    <div 
                      onClick={() => toggleAdminPart('part1')}
                      className="py-3 px-3.5 sm:px-4.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl backdrop-blur-md bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 text-base shrink-0 shadow-sm">
                          💖
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-white tracking-tight">Part 1: Love Balance Engine</span>
                            <span className="text-[9px] backdrop-blur-md bg-pink-500/20 text-pink-300 border border-pink-400/30 px-1.5 py-0.2 rounded font-mono font-bold">2-WAY</span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate hidden sm:block">Control & award points for {activeDoraName} and Darsh</p>
                        </div>
                      </div>

                      {/* INLINE SUMMARY CHIPS & CHEVRON */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className={`backdrop-blur-md px-2 py-0.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1 ${
                          Number(doraNetBalance || 0) < 0 
                            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' 
                            : 'bg-white/[0.07] border-pink-500/30 text-emerald-400'
                        }`}>
                          <span className="text-[9px] text-pink-400 font-sans">{activeDoraName}:</span>
                          <span>{Number(doraNetBalance || 0) < 0 ? '💔' : '💕'}</span>
                          <span>{formatLoveBalance(doraNetBalance)}</span>
                        </div>

                        <div className={`backdrop-blur-md px-2 py-0.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1 hidden sm:flex ${
                          Number(adminNetBalance || 0) < 0 
                            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' 
                            : 'bg-white/[0.07] border-blue-500/30 text-blue-400'
                        }`}>
                          <span className="text-[9px] text-blue-400 font-sans">Darsh:</span>
                          <span>👑</span>
                          <span>{formatLoveBalance(adminNetBalance)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualSectionRefresh('part1_love_balance');
                          }}
                          className="w-7 h-7 rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-pink-600/30 border border-white/15 hover:border-pink-500 text-gray-300 hover:text-pink-300 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="Refresh Love Balance"
                        >
                          <RefreshCw size={12} className={refreshingSection === 'part1_love_balance' ? 'animate-spin text-pink-400' : ''} />
                        </button>

                        <div className="backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-gray-200 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all">
                          <span className="hidden sm:inline">{expandedAdminParts.part1 ? 'Collapse' : 'Details'}</span>
                          {expandedAdminParts.part1 ? <ChevronUp size={13} className="text-pink-400" /> : <ChevronDown size={13} className="text-pink-400" />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS BODY - IOS LIQUID GLASS */}
                    {expandedAdminParts.part1 && (
                      <div className="p-3.5 sm:p-4 border-t border-white/10 space-y-3 bg-black/25 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
                        {/* 2 PARTS SELECTOR: PARTNER (A) VS ADMIN (H) */}
                        <div className="flex backdrop-blur-xl bg-white/[0.06] p-1 rounded-xl border border-white/15 text-xs font-bold gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveLbTarget('user')}
                            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              activeLbTarget === 'user' 
                                ? 'backdrop-blur-md bg-pink-600/80 border border-pink-400/50 text-white shadow font-black' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <span>💕 {activeDoraName}</span>
                            <span className={`text-[9px] bg-black/40 px-1.5 py-0.2 rounded font-mono ${Number(doraNetBalance || 0) < 0 ? 'text-rose-400 font-bold' : ''}`}>
                              {formatLoveBalance(doraNetBalance)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveLbTarget('admin')}
                            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              activeLbTarget === 'admin' 
                                ? 'backdrop-blur-md bg-blue-600/80 border border-blue-400/50 text-white shadow font-black' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <span>👑 Darsh</span>
                            <span className={`text-[9px] bg-black/40 px-1.5 py-0.2 rounded font-mono ${Number(adminNetBalance || 0) < 0 ? 'text-rose-400 font-bold' : ''}`}>
                              {formatLoveBalance(adminNetBalance)}
                            </span>
                          </button>
                        </div>

                        {/* QUICK AWARD PRESETS */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                            ✨ Quick Awards to {activeLbTarget === 'user' ? activeDoraName : 'Darsh'} (+₹):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                            {[
                              { label: '+₹2 Morning Text', amount: 2, reason: 'Sweet Morning Wish' },
                              { label: '+₹1 Fast Reply', amount: 1, reason: 'Instant Reply Under 30s' },
                              { label: '+₹3 Compliment', amount: 3, reason: 'Cute Romantic Compliment' },
                              { label: '+₹5 Song/Movie', amount: 5, reason: 'Recommended Good Music/Film' },
                              { label: '+₹10 Paragraph', amount: 10, reason: 'Long Romantic Paragraph' },
                              { label: '+₹15 Milestone', amount: 15, reason: 'Daily Relationship Milestone' },
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleLoveBalanceTransaction(preset.amount, 'credit', preset.reason, false, activeLbTarget)}
                                className="backdrop-blur-md bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 hover:text-white py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer active:scale-95 shadow-sm text-center truncate"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* QUICK DEDUCTION PRESETS */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                            💔 Quick Deductions from {activeLbTarget === 'user' ? activeDoraName : 'Darsh'} (-₹):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                            {[
                              { label: '-₹2 Dry Reply', amount: 2, reason: 'Dry / One-word Reply' },
                              { label: '-₹3 Seen & Left', amount: 3, reason: 'Seen & No Reply for >15m' },
                              { label: '-₹3 Slept w/o GN', amount: 3, reason: 'Slept without saying Good Night' },
                              { label: '-₹5 Late Reply', amount: 5, reason: 'Disappeared without informing' },
                              { label: '-₹10 Rude Tone', amount: 10, reason: 'Cold / Argumentative Tone' },
                              { label: '-₹20 Forgot Date', amount: 20, reason: 'Forgot Routine / Special Request' },
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleLoveBalanceTransaction(preset.amount, 'debit', preset.reason, false, activeLbTarget)}
                                className="backdrop-blur-md bg-rose-500/10 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 hover:text-white py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer active:scale-95 shadow-sm text-center truncate"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* MANUAL BALANCE CONTROL FORM */}
                        <div className="backdrop-blur-md bg-white/[0.04] p-3 rounded-2xl border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-gray-300 font-bold">
                            <span>⚡ Balance Control for {activeLbTarget === 'user' ? activeDoraName : 'Darsh'}</span>
                            <span className="text-[10px] text-emerald-400 font-mono">Live Real-time Sync</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="number"
                              step="0.5"
                              value={adminLbAmount}
                              onChange={(e) => setAdminLbAmount(e.target.value)}
                              placeholder="Points / ₹ (e.g. 5.0)"
                              className="backdrop-blur-md bg-white/[0.06] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                            />
                            <input
                              type="text"
                              value={adminLbReason}
                              onChange={(e) => setAdminLbReason(e.target.value)}
                              placeholder="Remark / Reason"
                              className="backdrop-blur-md bg-white/[0.06] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (!adminLbAmount) return;
                                handleLoveBalanceTransaction(parseFloat(adminLbAmount), 'credit', adminLbReason || 'Admin Manual Credit', false, activeLbTarget);
                                setAdminLbAmount('');
                                setAdminLbReason('');
                              }}
                              className="backdrop-blur-md bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/40 text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow text-center"
                            >
                              + Credit (+₹)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!adminLbAmount) return;
                                handleLoveBalanceTransaction(parseFloat(adminLbAmount), 'debit', adminLbReason || 'Admin Manual Deduction', false, activeLbTarget);
                                setAdminLbAmount('');
                                setAdminLbReason('');
                              }}
                              className="backdrop-blur-md bg-rose-600/80 hover:bg-rose-500 border border-rose-400/40 text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow text-center"
                            >
                              - Deduct (-₹)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!adminLbAmount) {
                                  alert(`Please enter the exact balance amount in the points box for ${activeLbTarget === 'user' ? activeDoraName : 'Darsh'}.`);
                                  return;
                                }
                                handleAdminOverrideBalance(activeLbTarget, adminLbAmount);
                                setAdminLbAmount('');
                                setAdminLbReason('');
                              }}
                              className="backdrop-blur-md bg-amber-600/80 hover:bg-amber-500 border border-amber-400/40 text-black text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow text-center"
                              title="Set exact balance directly"
                            >
                              Force Set Exact
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendLoveNudge(activeLbTarget)}
                              className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-pink-300 text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 text-center truncate"
                              title="Send instant love alert / ping"
                            >
                              🔔 Nudge
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenClearModal(activeLbTarget)}
                              className="backdrop-blur-md bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-1 col-span-2 sm:col-span-1"
                              title="Clear all transaction history and reset points"
                            >
                              <Trash2 size={12} />
                              <span>Clear All</span>
                            </button>
                          </div>
                        </div>

                        {/* PASSBOOK & WISH STORE LAUNCHERS */}
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('passbook'); }}
                            className="flex-1 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                          >
                            <Coins size={13} className="text-amber-400" />
                            <span>Open Passbook</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('redeem'); }}
                            className="flex-1 backdrop-blur-md bg-gradient-to-r from-pink-600/80 to-rose-600/80 hover:from-pink-500 hover:to-rose-500 border border-pink-400/40 text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                          >
                            <Gift size={13} />
                            <span>Wish Store</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('rules'); }}
                            className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow"
                            title="Love Balance Policy"
                          >
                            📖
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ===================== PART 2: CALL RECORDINGS VAULT ===================== */}
                  <div className="backdrop-blur-2xl bg-white/[0.06] hover:bg-white/[0.08] border border-rose-500/30 hover:border-rose-500/50 rounded-2xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
                    {/* COMPACT LINE BAR */}
                    <div 
                      onClick={() => toggleAdminPart('part2')}
                      className="py-3 px-3.5 sm:px-4.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl backdrop-blur-md bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 text-base shrink-0 shadow-sm">
                          <Disc size={16} className="animate-spin text-rose-400" style={{ animationDuration: '4s' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-white tracking-tight">Part 2: Call Recordings Vault</span>
                            <span className="text-[9px] backdrop-blur-md bg-rose-500/20 text-rose-300 border border-rose-400/30 px-1.5 py-0.2 rounded font-mono font-bold">
                              {adminRecordingsList.length} STORED
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate hidden sm:block">Mixed dual-channel HD recordings with 24h retention</p>
                        </div>
                      </div>

                      {/* INLINE SUMMARY CHIPS & CHEVRON */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="backdrop-blur-md bg-white/[0.07] border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-xl text-[11px] font-mono font-bold hidden sm:inline">
                          ⏱️ 24h Vault Active
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartAudioCall();
                          }}
                          className="backdrop-blur-md bg-rose-600 hover:bg-rose-500 border border-rose-400/40 text-white text-xs font-bold px-2.5 py-1 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center gap-1"
                        >
                          <Phone size={11} />
                          <span>Call Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualSectionRefresh('part2_recordings');
                          }}
                          className="w-7 h-7 rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-rose-600/30 border border-white/15 hover:border-rose-500 text-gray-300 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="Refresh Recordings"
                        >
                          <RefreshCw size={12} className={refreshingSection === 'part2_recordings' ? 'animate-spin text-rose-400' : ''} />
                        </button>

                        <div className="backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-gray-200 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all">
                          <span className="hidden sm:inline">{expandedAdminParts.part2 ? 'Collapse' : 'Details'}</span>
                          {expandedAdminParts.part2 ? <ChevronUp size={13} className="text-rose-400" /> : <ChevronDown size={13} className="text-rose-400" />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS BODY */}
                    {expandedAdminParts.part2 && (
                      <div className="p-3.5 sm:p-4 border-t border-white/10 space-y-3 bg-black/25 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>Recent Audio Recordings:</span>
                          <span className="font-mono text-rose-400">Auto-expires after 24h</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {adminRecordingsList.length === 0 ? (
                            <div className="text-center py-6 backdrop-blur-md bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                              <p className="text-xs text-gray-400 font-medium">No call recordings stored in vault yet.</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Start an encrypted whisper call to automatically record and preserve audio.</p>
                            </div>
                          ) : (
                            adminRecordingsList.map((rec, rIdx) => (
                              <div key={rIdx} className="backdrop-blur-md bg-white/[0.05] border border-white/10 hover:border-rose-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">Call #{rIdx + 1}</span>
                                    <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded font-mono">
                                      {rec.durationFormatted || 'Encrypted'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-mono truncate">{rec.timestampFormatted || '24h retention'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {rec.audioUrl && (
                                    <audio src={rec.audioUrl} controls className="h-7 w-36 sm:w-48" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecording(rec.id)}
                                    className="p-1.5 rounded-lg hover:bg-rose-950/80 text-gray-400 hover:text-rose-300 transition-colors cursor-pointer"
                                    title="Delete Recording"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* VAULT MODAL ACTION */}
                        <div className="pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setShowAdminRecordingsModal(true)}
                            className="w-full backdrop-blur-md bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                          >
                            <Disc size={13} className="text-rose-400 animate-spin" />
                            <span>Open Dedicated Audio Vault ({adminRecordingsList.length})</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ===================== PART 3: ANSWER PENDING & PDF ===================== */}
                  <div className="backdrop-blur-2xl bg-white/[0.06] hover:bg-white/[0.08] border border-amber-500/30 hover:border-amber-500/50 rounded-2xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
                    {/* COMPACT LINE BAR */}
                    <div 
                      onClick={() => toggleAdminPart('part3')}
                      className="py-3 px-3.5 sm:px-4.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl backdrop-blur-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-base shrink-0 shadow-sm">
                          <AlertCircle size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-white tracking-tight">Part 3: Answer Pending & PDF</span>
                            <span className="text-[9px] backdrop-blur-md bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-mono font-bold">
                              {pendingMessages.length} PENDING
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate hidden sm:block">Flagged questions & 7:20 PM daily auto-export scheduler</p>
                        </div>
                      </div>

                      {/* INLINE SUMMARY CHIPS & CHEVRON */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="backdrop-blur-md bg-white/[0.07] border border-amber-500/30 px-2 py-0.5 rounded-xl text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1 hidden sm:flex">
                          <Clock size={11} />
                          <span><AutoDownloadCountdown prefix="7:20 PM (" suffix=")" /></span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualSectionRefresh('part3_pending');
                          }}
                          className="w-7 h-7 rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-amber-600/30 border border-white/15 hover:border-amber-500 text-gray-300 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="Refresh Pending Messages"
                        >
                          <RefreshCw size={12} className={refreshingSection === 'part3_pending' ? 'animate-spin text-amber-400' : ''} />
                        </button>

                        <div className="backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-gray-200 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all">
                          <span className="hidden sm:inline">{expandedAdminParts.part3 ? 'Collapse' : 'Details'}</span>
                          {expandedAdminParts.part3 ? <ChevronUp size={13} className="text-amber-400" /> : <ChevronDown size={13} className="text-amber-400" />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS BODY */}
                    {expandedAdminParts.part3 && (
                      <div className="p-3.5 sm:p-4 border-t border-white/10 space-y-3 bg-black/25 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>Flagged Questions ({pendingMessages.length}):</span>
                          <span className="font-mono text-amber-400">Auto-downloads at 7:20 PM</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {pendingMessages.length === 0 ? (
                            <div className="text-center py-6 backdrop-blur-md bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                              <p className="text-xs text-emerald-400 font-bold">All questions answered! Zero pending flags.</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Flag important questions in secret chat to highlight and review here.</p>
                            </div>
                          ) : (
                            pendingMessages.map((pm, pIdx) => (
                              <div key={pIdx} className="backdrop-blur-md bg-white/[0.05] border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs text-white font-medium break-words">{pm.text}</p>
                                  <span className="text-[10px] text-gray-400 font-mono">{pm.timeFormatted || 'Flagged message'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => togglePendingFlag(e, pm)}
                                  className="text-[10px] backdrop-blur-md bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 px-2 py-1 rounded-lg font-bold shrink-0 cursor-pointer"
                                >
                                  Mark Answered
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* EXPORT ACTIONS */}
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={downloadFullChatPDF}
                            className="flex-1 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                          >
                            <Download size={13} className="text-amber-400" />
                            <span>Instant Full Chat PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={downloadPendingPDF}
                            className="flex-1 backdrop-blur-md bg-amber-600/80 hover:bg-amber-500 border border-amber-400/40 text-black text-xs font-bold py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1"
                          >
                            <FileDown size={13} />
                            <span>Export Pending PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPendingModal(true)}
                            className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow"
                            title="View All Pending Questions"
                          >
                            🔍
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ===================== PART 4: CONNECTED GMAIL ACCOUNTS DIRECTORY ===================== */}
                  <div className="backdrop-blur-2xl bg-white/[0.06] hover:bg-white/[0.08] border border-cyan-500/30 hover:border-cyan-500/50 rounded-2xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
                    {/* COMPACT LINE BAR */}
                    <div 
                      onClick={() => toggleAdminPart('part4')}
                      className="py-3 px-3.5 sm:px-4.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl backdrop-blur-md bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-base shrink-0 shadow-sm">
                          <Users size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-white tracking-tight">Part 4: Connected Accounts Directory</span>
                            <span className="text-[9px] backdrop-blur-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.2 rounded font-mono font-bold">
                              GMAIL DIRECTORY
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate hidden sm:block">Live directory of all logged-in Gmail IDs & active user sessions</p>
                        </div>
                      </div>

                      {/* INLINE SUMMARY CHIPS & CHEVRON */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="backdrop-blur-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{(usersDirectory?.users || []).filter(u => u.isOnline).length} Active</span>
                        </span>

                        <span className="backdrop-blur-md bg-white/[0.07] border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-xl text-[11px] font-mono font-bold hidden sm:inline">
                          {(usersDirectory?.users || []).length} Accounts
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualSectionRefresh('part4_users');
                          }}
                          className="w-7 h-7 rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-cyan-600/30 border border-white/15 hover:border-cyan-500 text-gray-300 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="Refresh Connected Accounts"
                        >
                          <RefreshCw size={12} className={refreshingSection === 'part4_users' ? 'animate-spin text-cyan-400' : ''} />
                        </button>

                        <div className="backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-gray-200 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all">
                          <span className="hidden sm:inline">{expandedAdminParts.part4 ? 'Collapse' : 'Details'}</span>
                          {expandedAdminParts.part4 ? <ChevronUp size={13} className="text-cyan-400" /> : <ChevronDown size={13} className="text-cyan-400" />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS BODY */}
                    {expandedAdminParts.part4 && (
                      <div className="p-3.5 sm:p-4 border-t border-white/10 space-y-3 bg-black/25 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
                        {/* QUICK STATS CARDS */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="backdrop-blur-md bg-white/[0.04] border border-emerald-500/30 rounded-xl p-2 text-center">
                            <div className="text-[10px] text-gray-400">Live Online</div>
                            <div className="text-sm font-black text-emerald-400 font-mono">
                              {(usersDirectory?.users || []).filter(u => u.isOnline).length} active
                            </div>
                          </div>
                          <div className="backdrop-blur-md bg-white/[0.04] border border-cyan-500/30 rounded-xl p-2 text-center">
                            <div className="text-[10px] text-gray-400">Total Accounts</div>
                            <div className="text-sm font-black text-cyan-400 font-mono">
                              {(usersDirectory?.users || []).length} Gmails
                            </div>
                          </div>
                          <div className="backdrop-blur-md bg-white/[0.04] border border-amber-500/30 rounded-xl p-2 text-center">
                            <div className="text-[10px] text-gray-400">Admin ID</div>
                            <div className="text-xs font-black text-amber-300 font-mono truncate">
                              arthurs10pc
                            </div>
                          </div>
                        </div>

                        {/* USERS LIST */}
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {(usersDirectory?.users || []).map((user, uIdx) => (
                            <div key={user.email || uIdx} className="backdrop-blur-md bg-white/[0.05] border border-white/10 hover:border-cyan-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    {user.picture ? (
                                      <img src={user.picture} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      user.isAdmin ? '👑' : 'A'
                                    )}
                                  </div>
                                  <span 
                                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${
                                      user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                                    }`}
                                    title={user.isOnline ? 'Live Online' : 'Offline'}
                                  />
                                </div>

                                <div className="min-w-0 text-left">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-white truncate">
                                      {user.name}
                                    </span>
                                    {user.isAdmin ? (
                                      <span className="text-[9px] backdrop-blur-md bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 rounded font-mono font-bold">
                                        ADMIN
                                      </span>
                                    ) : (
                                      <span className="text-[9px] backdrop-blur-md bg-pink-500/20 text-pink-300 border border-pink-500/40 px-1.5 rounded font-mono font-bold">
                                        USER
                                      </span>
                                    )}
                                    {!user.isAdmin && (
                                      <span className={`text-[9px] border px-1.5 py-0.2 rounded font-mono font-bold backdrop-blur-md ${
                                        Number(user.isDora ? doraNetBalance : (user.loveBalance || 0)) < 0 
                                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/50' 
                                          : 'bg-pink-950/60 text-pink-300 border border-pink-500/40'
                                      }`} title="Current Love Balance">
                                        {Number(user.isDora ? doraNetBalance : (user.loveBalance || 0)) < 0 ? '💔 ' : '💕 '}
                                        {formatLoveBalance(user.isDora ? doraNetBalance : (user.loveBalance || 0))}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-gray-300 truncate flex items-center gap-1 mt-0.5" title={user.email}>
                                    <Mail size={10} className="text-gray-400 shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {!user.isAdmin && (
                                  <>
                                    {user.isDora ? (
                                      <button
                                        type="button"
                                        onClick={() => handleSetDora(user.email, false)}
                                        className="text-[9px] backdrop-blur-md bg-pink-500/20 hover:bg-rose-950 border border-pink-500/50 hover:border-rose-500 text-pink-300 hover:text-rose-300 px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                                        title="Click to Revoke Dora Role"
                                      >
                                        <span>💖 Active Dora</span>
                                        <span className="text-xs text-rose-400 font-bold">×</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSetDora(user.email, true)}
                                        className="text-[9px] backdrop-blur-md bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white px-2.5 py-0.5 rounded-full font-bold shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                        title="Grant Dora Role (unlocks /dora secret chat & WP view)"
                                      >
                                        <span>✨ Make a Dora</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user.email)}
                                      className="text-[9px] backdrop-blur-md bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 hover:border-rose-400 text-rose-400 hover:text-white px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                                      title={`Permanently delete ${user.email} from database`}
                                    >
                                      <Trash2 size={10} className="shrink-0" />
                                      <span>Delete</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* FOOTER ACTIONS */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                            <span>Real-time OAuth Directory</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleManualSectionRefresh('part4_users')}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors active:scale-95"
                          >
                            Sync Users ➔
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PROJECT SUBMISSIONS & HOURLY TASKS QUICK ACCESS LINK */}
                  <div className="backdrop-blur-2xl bg-white/[0.06] border border-white/15 hover:border-emerald-500/50 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl backdrop-blur-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-base shrink-0 shadow-sm">
                        <Briefcase size={17} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white">Daily Projects & Hourly Routine Engine</h4>
                          <span className="text-[9px] backdrop-blur-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                            DEDICATED SECTION
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">Review {activeDoraName}'s task proofs, download day reports, and manage routine slots in dedicated screen</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDailyAdminTab('review');
                        setViewMode('daily_projects');
                      }}
                      className="backdrop-blur-md bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open Project Submissions</span>
                      <span>➔</span>
                    </button>
                  </div>

                </div>

              </section>
            )}


{/* --- DARSH ADMIN DEDICATED PROJECT SUBMISSION & HOURLY REPORT SCREEN --- */}
            {viewMode === 'daily_projects' && role === 'parent' && (
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-5xl w-full mx-auto space-y-4 scrollbar-none font-sans animate-in fade-in duration-150">
                {/* ADMIN APPROVAL HERO HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('admin_dashboard')}
                      className="text-gray-400 hover:text-white p-1.5 rounded-xl cursor-pointer transition-colors bg-[#181818] border border-[#2a2a2a] flex items-center gap-1 text-xs font-semibold"
                      title="Back to Admin Dashboard"
                    >
                      <ArrowLeft size={16} />
                      <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-white">Daily Projects & Routine Tasks</h2>
                        <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold font-mono">
                          DARSH ADMIN
                        </span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono hidden sm:inline">
                          HOURLY ENGINE
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">Review {activeDoraName}'s submissions, download high-res proof & customize routine slots</p>
                    </div>
                  </div>

                  {/* TAB SWITCHER, DATE PICKER & ACTIONS */}
                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                    <div className="flex bg-[#181818] p-0.5 rounded-xl border border-[#2a2a2a] text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setDailyAdminTab('review')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          dailyAdminTab === 'review' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>Review Tasks</span>
                        {dailySubmissions.filter(s => s.date === dailySelectedDate && s.status === 'PENDING').length > 0 && (
                          <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                            {dailySubmissions.filter(s => s.date === dailySelectedDate && s.status === 'PENDING').length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyAdminTab('slots')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          dailyAdminTab === 'slots' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>⚙️ Slot Manager</span>
                      </button>
                    </div>

                    <input
                      type="date"
                      value={dailySelectedDate}
                      onChange={(e) => setDailySelectedDate(e.target.value)}
                      className="bg-[#181818] border border-[#333] text-white text-xs px-2.5 py-1.5 rounded-xl outline-none focus:border-amber-500 font-mono"
                      title="Select date to review or download historical data"
                    />
                    <button
                      type="button"
                      onClick={() => setDailySelectedDate(getLocalDateString())}
                      className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportDayPdf(dailySelectedDate)}
                      className="bg-[#181818] hover:bg-[#252525] border border-[#333] hover:border-emerald-500/50 text-gray-200 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
                      title={`Download Full Day Report PDF for ${dailySelectedDate}`}
                    >
                      <FileDown size={13} className="text-emerald-400" />
                      <span className="hidden sm:inline">Export PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualSectionRefresh('hourly_report')}
                      className="w-8 h-8 rounded-full bg-[#181818] hover:bg-amber-600/30 border border-[#333] hover:border-amber-500 text-gray-400 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Refresh Hourly Report & Submissions"
                    >
                      <RefreshCw size={13} className={refreshingSection === 'hourly_report' ? 'animate-spin text-amber-400' : ''} />
                    </button>
                  </div>
                </div>

                {dailyAdminTab === 'review' && (
                  <div className="space-y-4">
                    {/* STATS OVERVIEW (DAY-WISE) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-[#141414] border border-[#262626] p-2.5 rounded-2xl">
                        <div className="text-[10px] text-gray-400">Total Routine Slots</div>
                        <div className="text-base font-bold text-white font-mono">{dailySlots.filter(s => s.isActive).length}</div>
                      </div>
                      <div className="bg-[#141414] border border-amber-500/40 p-2.5 rounded-2xl">
                        <div className="text-[10px] text-amber-300 font-bold">Pending Review</div>
                        <div className="text-base font-black text-amber-400 font-mono">
                          {dailySubmissions.filter(s => s.date === dailySelectedDate && s.status === 'PENDING').length} ⏳
                        </div>
                      </div>
                      <div className="bg-[#141414] border border-emerald-500/30 p-2.5 rounded-2xl">
                        <div className="text-[10px] text-emerald-400 font-bold">
                          {dailySelectedDate === getLocalDateString() ? 'Approved Today' : `Approved (${dailySelectedDate})`}
                        </div>
                        <div className="text-base font-black text-emerald-400 font-mono">
                          {dailySubmissions.filter(s => s.date === dailySelectedDate && s.status === 'APPROVED').length} ✓
                        </div>
                      </div>
                      <div className="bg-[#141414] border border-blue-500/30 p-2.5 rounded-2xl">
                        <div className="text-[10px] text-blue-300 font-bold">Points Awarded</div>
                        <div className="text-base font-bold text-blue-400 font-mono">
                          ₹ {dailySubmissions.filter(s => s.date === dailySelectedDate && s.status === 'APPROVED').reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* HOURLY REPORT TIMELINE BAR (MATCHING SCREENSHOT) */}
                    <div className="bg-[#0f172a] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl border border-blue-900/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow">
                            <Briefcase size={13} />
                          </div>
                          <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                            Hourly Report
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-300 font-mono">Tap slot to inspect ➔</span>
                      </div>

                      {/* HORIZONTAL SCROLLING PILLS */}
                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-1">
                        {sortSlotsByTime(dailySlots.filter(s => s.isActive)).map((slot) => {
                          const sub = getSlotSubmission(slot.id, dailySelectedDate);
                          const isSelected = dailySelectedSlotId === slot.id;
                          const isApproved = sub && sub.status === 'APPROVED';
                          const isPending = sub && sub.status === 'PENDING';
                          const isRejected = sub && sub.status === 'REJECTED';
                          const isOverdue = checkSlotOverdue(slot, dailySelectedDate);

                          const timeParts = slot.timeRange.split('-').map(t => t.trim());
                          const topTime = timeParts[0] || slot.timeRange;
                          const botTime = timeParts[1] || '';

                          return (
                            <div
                              key={slot.id}
                              onClick={() => {
                                setDailySelectedSlotId(slot.id);
                                setShowSlotReportModal(true);
                              }}
                              className={`min-w-[85px] sm:min-w-[100px] max-w-[120px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center select-none shrink-0 ${
                                isSelected 
                                  ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-400 shadow-lg scale-105' 
                                  : (isOverdue && !isApproved 
                                      ? 'bg-rose-950/30 border-rose-500/60 text-rose-300 shadow-sm' 
                                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800 shadow-sm')
                              }`}
                            >
                              <div className="space-y-0.5 w-full">
                                <div className={`text-sm sm:text-base font-black ${isSelected ? 'text-white' : (isOverdue && !isApproved ? 'text-rose-300' : 'text-gray-900')}`}>
                                  {topTime}
                                </div>
                                {botTime && (
                                  <div className={`text-[11px] font-medium ${isSelected ? 'text-amber-300' : (isOverdue && !isApproved ? 'text-rose-400' : 'text-gray-500')}`}>
                                    {botTime}
                                  </div>
                                )}
                              </div>

                              <div className="my-1.5 w-full flex flex-col items-center gap-1">
                                {isApproved ? (
                                  <>
                                    <div className="bg-emerald-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center justify-center gap-1 shadow-sm">
                                      <span>✓</span>
                                      <span>Done</span>
                                    </div>
                                    {sub && sub.image && (
                                      <div className="w-5 h-5 rounded-full border border-blue-400 bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] shadow-xs mt-0.5" title="View proof">
                                        <Eye size={10} />
                                      </div>
                                    )}
                                  </>
                                ) : isPending ? (
                                  <div className="bg-amber-500 text-black text-[9px] font-black py-0.5 px-1.5 rounded-full flex items-center justify-center gap-0.5 shadow-sm animate-pulse">
                                    <span>⏳</span>
                                    <span>Review</span>
                                  </div>
                                ) : isRejected ? (
                                  <div className="bg-rose-600 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-full flex items-center justify-center shadow-sm">
                                    <span>Retake</span>
                                  </div>
                                ) : isOverdue ? (
                                  <div className="bg-rose-600/30 border border-rose-500/50 text-rose-300 text-[9px] font-bold py-0.5 px-1.5 rounded-full flex items-center justify-center gap-0.5 shadow-sm">
                                    <span>⏰</span>
                                    <span>Late (50%)</span>
                                  </div>
                                ) : (
                                  <div className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center justify-center gap-1 shadow-sm">
                                    <span>⏰</span>
                                    <span>Pending</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SUBMISSIONS REQUIRING APPROVAL (PRIORITY BANNER) */}
                    {dailySubmissions.filter(s => s.status === 'PENDING').length > 0 && (
                      <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>⚡ Submissions Requiring Your Approval:</span>
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full font-mono text-[10px]">
                              {dailySubmissions.filter(s => s.status === 'PENDING').length}
                            </span>
                          </span>
                        </div>

                        <div className="space-y-3">
                          {dailySubmissions.filter(s => s.status === 'PENDING').map(sub => {
                            const slot = dailySlots.find(s => s.id === sub.slotId);
                            const isLate = checkSlotOverdue(slot, dailySelectedDate);
                            const reward = slot ? (isLate ? Number(slot.rewardPoints || 2.0) / 2 : Number(slot.rewardPoints || 2.0)) : 2.0;

                            return (
                              <div key={sub.id} className="bg-[#141414] border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
                                <div className="flex items-start justify-between gap-2 border-b border-[#222] pb-2.5">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full">
                                        {slot ? slot.timeRange : 'Routine'}
                                      </span>
                                      <span className="text-xs font-bold text-white">
                                        {slot ? slot.title : 'Routine Task'}
                                      </span>
                                      {isLate && (
                                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.2 rounded-full font-bold">
                                          ⏰ Submitted Late (50% pts)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-gray-400 mt-1">
                                      Submitted: {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                  <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl shrink-0">
                                    +₹ {Number(reward).toFixed(2)}
                                  </div>
                                </div>

                                {sub.note && (
                                  <p className="text-xs text-gray-200 italic bg-[#181818] p-2 rounded-xl border border-[#262626]">
                                    "{sub.note}"
                                  </p>
                                )}

                                {sub.image && (
                                  <div className="bg-[#101010] p-2.5 rounded-2xl border border-[#262626]">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                      <img
                                        src={sub.image}
                                        alt="Proof"
                                        className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-xl border border-[#333] cursor-pointer hover:scale-102 transition-transform shadow-md"
                                        onClick={() => setDailyPreviewModalImg(sub.image)}
                                      />
                                      <div className="space-y-2 text-xs">
                                        <button
                                          type="button"
                                          onClick={() => setDailyPreviewModalImg(sub.image)}
                                          className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow"
                                        >
                                          <Eye size={13} />
                                          <span>View High-Res Photo</span>
                                        </button>
                                        <a
                                          href={sub.image}
                                          download={`dora_task_${sub.id}.jpg`}
                                          className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer inline-flex shadow"
                                        >
                                          <Download size={13} />
                                          <span>Download Proof</span>
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveDailyTask(sub)}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                                  >
                                    <CheckCircle size={15} />
                                    <span>Approve & Award +₹{Number(reward).toFixed(2)}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectDailyTask(sub)}
                                    className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow"
                                  >
                                    <RotateCcw size={14} />
                                    <span>Request Retake</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* COMPLETE ALL ROUTINE SLOTS & SUBMISSIONS GRID (MATCHING USER SCREENSHOT) */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1 border-t border-[#222] pt-3">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-400" />
                          <span>All Hourly Routine Slots ({dailySelectedDate}):</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {dailySlots.filter(s => s.isActive).length} Slots Total
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {sortSlotsByTime(dailySlots.filter(s => s.isActive)).map((slot) => {
                          const sub = getSlotSubmission(slot.id, dailySelectedDate);
                          const isApproved = sub && sub.status === 'APPROVED';
                          const isPending = sub && sub.status === 'PENDING';
                          const isRejected = sub && sub.status === 'REJECTED';

                          return (
                            <div
                              key={slot.id}
                              className={`p-3 rounded-2xl border transition-all ${
                                isPending 
                                  ? 'bg-[#1a1813] border-amber-500/60 shadow-lg' 
                                  : isApproved 
                                    ? 'bg-[#121815] border-emerald-500/40' 
                                    : 'bg-[#161616] border-[#262626]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                      {slot.timeRange}
                                    </span>
                                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">
                                      {slot.tag}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-white mt-1">{slot.title}</h4>
                                </div>
                                <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">
                                  +₹ {Number(slot.rewardPoints || 0).toFixed(2)}
                                </span>
                              </div>

                              {sub ? (
                                <div className="mt-2.5 space-y-2 pt-2 border-t border-[#222]">
                                  {sub.note && (
                                    <p className="text-xs text-gray-300 italic bg-[#101010] p-2 rounded-xl border border-[#242424]">
                                      "{sub.note}"
                                    </p>
                                  )}

                                  {sub.image && (
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={sub.image}
                                        alt="Proof"
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-[#333] cursor-pointer hover:scale-105 transition-transform shrink-0"
                                        onClick={() => setDailyPreviewModalImg(sub.image)}
                                      />
                                      <div className="space-y-1 text-[11px] flex-1 min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => setDailyPreviewModalImg(sub.image)}
                                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                                        >
                                          <Eye size={12} />
                                          <span>Full Preview</span>
                                        </button>
                                        <a
                                          href={sub.image}
                                          download={`dora_task_${dailySelectedDate}_${slot.id}.jpg`}
                                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                                        >
                                          <Download size={12} />
                                          <span>Download Photo</span>
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {/* ACTION BUTTONS FOR DARSH */}
                                  <div className="pt-1 flex items-center gap-2">
                                    {isPending ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveDailyTask(sub)}
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                                        >
                                          <Check size={13} />
                                          <span>Approve & Award +₹{slot.rewardPoints}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRejectDailyTask(sub)}
                                          className="bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-semibold py-1.5 px-2.5 rounded-xl cursor-pointer active:scale-95"
                                        >
                                          Retake
                                        </button>
                                      </>
                                    ) : isApproved ? (
                                      <div className="w-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold py-1 px-2 rounded-xl text-center flex items-center justify-center gap-1">
                                        <span>✓ Approved & Awarded (+₹{sub.pointsAwarded})</span>
                                      </div>
                                    ) : isRejected ? (
                                      <div className="w-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-bold py-1 px-2 rounded-xl text-center">
                                        <span>Retake Requested</span>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 pt-2 border-t border-[#222] text-[10px] text-gray-500 italic">
                                  No submission from {activeDoraName} yet for this time slot.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* SLOTS MANAGER TAB (DYNAMIC ADD / EDIT / DELETE) */}
                {dailyAdminTab === 'slots' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">
                        Configure Hourly Routine Slots:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlotId(null);
                          setSlotFormTitle('');
                          setSlotFormTimeRange('');
                          setSlotFormTag('Task');
                          setSlotFormPoints('2.0');
                          setShowAddSlotModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Add New Routine Slot</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sortSlotsByTime(dailySlots).map((slot) => (
                        <div key={slot.id} className="bg-[#181818] border border-[#2a2a2a] p-3 rounded-2xl flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span 
                                onClick={() => {
                                  setEditingSlotId(slot.id);
                                  setSlotFormTitle(slot.title);
                                  setSlotFormTimeRange(slot.timeRange);
                                  setSlotFormTag(slot.tag);
                                  setSlotFormPoints(String(slot.rewardPoints));
                                  setShowAddSlotModal(true);
                                }}
                                className="text-[10px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-white px-2 py-0.5 rounded-lg font-mono font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                                title="Click to quickly change slot time"
                              >
                                🕒 {slot.timeRange}
                              </span>
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">
                                {slot.tag}
                              </span>
                              <span className="text-xs font-bold text-emerald-400 font-mono">
                                +₹{slot.rewardPoints}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white">{slot.title}</h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSlotId(slot.id);
                                setSlotFormTitle(slot.title);
                                setSlotFormTimeRange(slot.timeRange);
                                setSlotFormTag(slot.tag);
                                setSlotFormPoints(String(slot.rewardPoints));
                                setShowAddSlotModal(true);
                              }}
                              className="text-gray-400 hover:text-white p-1 rounded-lg bg-[#222]"
                              title="Edit Slot"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="text-gray-400 hover:text-rose-400 p-1 rounded-lg bg-[#222]"
                              title="Delete Slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* --- DORA'S ROUTINE SUBMISSION SCREEN (DORA ONLY) --- */}
            {viewMode === 'daily_projects' && role !== 'parent' && (
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-4xl w-full mx-auto space-y-4 scrollbar-none font-sans animate-in fade-in duration-150">
                {/* TOP HEADER & DATE BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#222]">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('real_gpt')}
                      className="text-gray-400 hover:text-white p-1 rounded-xl cursor-pointer transition-colors"
                      title="Back to ChatGPT Chat"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <span>Daily Projects & Hourly Routine</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                          DORA
                        </span>
                      </h2>
                      <p className="text-[11px] text-gray-400">Submit hourly tasks & routine proofs for Darsh's review & rewards</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <input
                      type="date"
                      value={dailySelectedDate}
                      onChange={(e) => setDailySelectedDate(e.target.value)}
                      className="bg-[#181818] border border-[#333] text-white text-xs px-2.5 py-1 rounded-xl outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setDailySelectedDate(getLocalDateString())}
                      className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 px-2 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualSectionRefresh('dora_tasks')}
                      className="w-7 h-7 rounded-full bg-[#181818] hover:bg-blue-600/30 border border-[#333] hover:border-blue-500 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Refresh Routine Tasks"
                    >
                      <RefreshCw size={12} className={refreshingSection === 'dora_tasks' ? 'animate-spin text-blue-400' : ''} />
                    </button>
                  </div>
                </div>

                {/* SUMMARY STATS BAR (DAY-WISE) */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#141414] border border-[#262626] p-2.5 rounded-2xl">
                    <div className="text-[10px] text-gray-400">Total Routine Slots</div>
                    <div className="text-base font-bold text-white font-mono">{dailySlots.filter(s => s.isActive).length}</div>
                  </div>
                  <div className="bg-[#141414] border border-[#262626] p-2.5 rounded-2xl">
                    <div className="text-[10px] text-gray-400">
                      {dailySelectedDate === getLocalDateString() ? 'Completed Today' : `Completed (${dailySelectedDate})`}
                    </div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {dailySubmissions.filter(s => s.date === dailySelectedDate && s.status === 'APPROVED').length} ✓
                    </div>
                  </div>
                  <div className="bg-[#141414] border border-[#262626] p-2.5 rounded-2xl">
                    <div className="text-[10px] text-gray-400">Under Review</div>
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {dailySubmissions.filter(s => s.date === dailySelectedDate && s.status === 'PENDING').length} ⏳
                    </div>
                  </div>
                </div>

                {/* THE HOURLY REPORT TIMELINE BAR (MATCHING USER'S SCREENSHOT) */}
                <div className="bg-[#0f172a] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl border border-blue-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow">
                        <Briefcase size={13} />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                        Hourly Report
                      </span>
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center justify-center cursor-help" title="Tap a slot pill to submit or review proof">
                        i
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-300 font-mono">Scroll horizontal ➔</span>
                  </div>

                  {/* HORIZONTAL SCROLLING SLOT PILLS ROW */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-1">
                    {dailySlots.filter(s => s.isActive).map((slot) => {
                      const sub = getSlotSubmission(slot.id, dailySelectedDate);
                      const isSelected = dailySelectedSlotId === slot.id;
                      const isApproved = sub && sub.status === 'APPROVED';
                      const isPending = sub && sub.status === 'PENDING';
                      const isRejected = sub && sub.status === 'REJECTED';
                      const isOverdue = checkSlotOverdue(slot, dailySelectedDate);

                      const timeParts = slot.timeRange.split('-').map(t => t.trim());
                      const topTime = timeParts[0] || slot.timeRange;
                      const botTime = timeParts[1] || '';

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            setDailySelectedSlotId(slot.id);
                            setShowSlotReportModal(true);
                          }}
                          className={`min-w-[85px] sm:min-w-[100px] max-w-[120px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center select-none shrink-0 ${
                            isSelected 
                              ? (isOverdue && !isApproved 
                                  ? 'bg-rose-950/90 border-rose-500 ring-2 ring-rose-400 shadow-lg scale-105 text-white' 
                                  : 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-400 shadow-lg scale-105 text-white')
                              : (isOverdue && !isApproved
                                  ? 'bg-rose-950/30 hover:bg-rose-950/50 border-rose-500/80 text-rose-200 shadow-sm ring-1 ring-rose-500/30'
                                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800 shadow-sm')
                          }`}
                        >
                          {/* TIME HEADER */}
                          <div className="space-y-0.5 w-full">
                            <div className={`text-sm sm:text-base font-black ${
                              isSelected 
                                ? 'text-white' 
                                : (isOverdue && !isApproved ? 'text-rose-400' : 'text-gray-900')
                            }`}>
                              {topTime}
                            </div>
                            {botTime && (
                              <div className={`text-[11px] font-medium ${
                                isSelected 
                                  ? (isOverdue && !isApproved ? 'text-rose-300' : 'text-blue-300')
                                  : (isOverdue && !isApproved ? 'text-rose-300/80' : 'text-gray-500')
                              }`}>
                                {botTime}
                              </div>
                            )}
                          </div>

                          {/* STATUS BADGE ONLY (BAHAR SIFT TIME AUR STATUS DIKHEGA) */}
                          <div className="my-1.5 w-full flex flex-col items-center gap-1">
                            {isApproved ? (
                              <>
                                <div className="bg-emerald-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center justify-center gap-1 shadow-sm">
                                  <span>✓</span>
                                  <span>Done</span>
                                </div>
                                {sub && sub.image && (
                                  <div className="w-5 h-5 rounded-full border border-blue-400 bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] shadow-xs mt-0.5" title="Proof submitted">
                                    <Eye size={10} />
                                  </div>
                                )}
                              </>
                            ) : isPending ? (
                              <div className="bg-amber-500 text-black text-[9px] font-bold py-0.5 px-1.5 rounded-full flex items-center justify-center gap-0.5 shadow-sm animate-pulse">
                                <span>⏳</span>
                                <span>Review</span>
                              </div>
                            ) : isRejected ? (
                              <div className="bg-rose-600 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-full flex items-center justify-center shadow-sm">
                                <span>Retake (+)</span>
                              </div>
                            ) : isOverdue ? (
                              <div className="bg-rose-600/30 border border-rose-500/50 text-rose-300 text-[9px] font-bold py-0.5 px-1.5 rounded-full flex items-center justify-center gap-0.5 shadow-sm">
                                <span>⏰</span>
                                <span>Late (50%)</span>
                              </div>
                            ) : (
                              <div className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center justify-center gap-1 shadow-sm">
                                <span>⏰</span>
                                <span>Pending</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HIDDEN FILE INPUT FOR DIRECT HOURLY REPORT PROOF UPLOAD */}
                <input
                  ref={dailyFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleDailyImageSelected}
                  className="hidden"
                />
              </section>
            )}

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

                      {activeVideoId && (
                        <div className="mt-2.5 px-1 flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={trackDuration || 100}
                            value={trackProgress}
                            onChange={handleSeekSlider}
                            className="w-full accent-emerald-400 bg-[#2a2a2a] h-1.5 rounded-lg cursor-pointer outline-none"
                          />
                        </div>
                      )}

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

            {viewMode === 'codex' && (
              <ErrorBoundary fallback={
                <section className="flex-1 p-6 text-center text-white flex flex-col items-center justify-center font-sans space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xl">🎬</div>
                  <h3 className="text-sm font-bold">Codex Cinema Recovered</h3>
                  <p className="text-xs text-gray-400 max-w-sm">An engine display issue occurred. Click below to reload the player.</p>
                  <button onClick={() => setCodexEngine('gofile')} className="bg-emerald-600 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow">Reset to Stream</button>
                </section>
              }>
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

                  {role === 'parent' && (
                    <div className="flex overflow-x-auto scrollbar-none bg-[#181818] p-1 rounded-xl border border-[#2c2c2c] gap-1 text-xs shrink-0 max-w-full">
                      <button
                        type="button"
                        onClick={() => handleSwitchCodexEngine('gofile')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0 ${
                          codexEngine === 'gofile' ? 'bg-[#252525] text-emerald-400 shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Tv size={13} />
                        <span>Stream</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchCodexEngine('youtube')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0 ${
                          codexEngine === 'youtube' ? 'bg-[#252525] text-blue-400 shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Video size={13} />
                        <span>YouTube</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchCodexEngine('embed')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0 ${
                          codexEngine === 'embed' ? 'bg-[#252525] text-purple-400 shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Globe size={13} />
                        <span>Embed API</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchCodexEngine('local')}
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
                            onClick={() => localVideoInputRef?.current?.click()}
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

                {/* --- VIDEO CONTAINER WITH UNIVERSAL WHITE DOT & TOGEPI OVERLAY --- */}
                <div className="w-full bg-[#0a0a0a] border border-[#242424] rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center min-h-[220px] sm:min-h-[380px]">
                  
                  {/* WHITE DOT UNIVERSAL DELAY GAP SYNC */}
                  <div className="absolute top-3 left-3 z-[99999] flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleUniversalSyncRealign}
                      className="w-4 h-4 rounded-full bg-white hover:bg-white shadow-[0_0_12px_rgba(255,255,255,1)] ring-2 ring-white/60 cursor-pointer active:scale-90 transition-all flex items-center justify-center border border-black/50 group"
                      title="White Dot: Click to calculate & force-sync video delay gap between both viewers!"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-black/40 group-hover:scale-0 transition-transform" />
                    </button>
                    {syncDelayGapText ? (
                      <span className="bg-black/90 backdrop-blur-md text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold shadow-xl animate-in fade-in duration-200">
                        {syncDelayGapText}
                      </span>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleUniversalSyncRealign}
                        className="hidden sm:inline-block bg-black/70 backdrop-blur-sm text-gray-300 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-mono opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                        title="Click to fix delay gap"
                      >
                        ⚡ Sync Gap
                      </button>
                    )}
                  </div>

                  {/* 1. GOFILE / DIRECT STREAM CONTAINER */}
                  {codexEngine === 'gofile' && (
                    <div className="w-full flex items-center justify-center">
                      {activeMovieSrc ? (
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
                      )}
                    </div>
                  )}

                  {/* 2. YOUTUBE CONTAINER - CONTINUOUSLY MOUNTED IN DOM TO PREVENT REACT REMOVECHILD CRASH */}
                  <div className={`w-full flex items-center justify-center ${codexEngine === 'youtube' ? 'block' : 'hidden'}`}>
                    {activeMovieYTId ? (
                      <div className="w-full h-[45vh] sm:h-[65vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                        <div id="codex-cinema-yt-player" className="w-full h-full" />
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-2 text-gray-500">
                        <Film size={36} className="mx-auto opacity-30 text-blue-400" />
                        <p className="text-xs">
                          {role === 'parent' ? "Paste YouTube watch link above to stream." : "Waiting for Admin to broadcast video..."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 3. EMBED API CONTAINER */}
                  {codexEngine === 'embed' && (
                    <div className="w-full flex items-center justify-center">
                      {activeEmbedUrl ? (
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
                      )}
                    </div>
                  )}

                  {/* 4. LOCAL FILE CONTAINER */}
                  {codexEngine === 'local' && (
                    <div className="w-full flex items-center justify-center">
                      {localVideoSrc ? (
                        <div className="w-full relative flex flex-col items-center">
                          <video 
                            ref={html5LocalVideoRef}
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
                              onClick={() => localVideoInputRef?.current?.click()}
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
                            onClick={() => localVideoInputRef?.current?.click()}
                            className="bg-[#242424] text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border border-[#333]"
                          >
                            Select Movie File
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- IN-CINEMA LIVE NOTIFICATION BANNER (VISIBLE WHEN TOGEPI MENU CLOSED) --- */}
                  {incomingTogepiAlert && !showTogepiMenu && (
                    <div 
                      onClick={() => { setShowTogepiMenu(true); setIncomingTogepiAlert(null); }}
                      className="absolute top-3 right-16 z-[99999] max-w-xs bg-black/90 backdrop-blur-md border border-amber-400/80 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-top-3 duration-200 pointer-events-auto"
                    >
                      <span className="text-base shrink-0 animate-bounce">🐣</span>
                      <div className="flex flex-col text-left truncate">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">{incomingTogepiAlert.sender === 'parent' ? 'Admin' : 'User'}:</span>
                        <span className="text-xs text-white truncate max-w-[170px]">{incomingTogepiAlert.text}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/40 shrink-0">Reply</span>
                    </div>
                  )}

                  {/* --- ABSOLUTE BOTTOM-RIGHT TOGEPI WIDGET (STAYS ON FULLSCREEN) --- */}
                  <div className="absolute bottom-4 right-4 z-[999999] flex flex-col items-end pointer-events-auto">
                    {showTogepiMenu && (
                      <div className="w-72 sm:w-80 bg-[#121212]/95 border border-amber-400/60 rounded-2xl p-3 shadow-2xl backdrop-blur-md mb-2 space-y-2.5 text-left animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-[#262626] pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🐣</span>
                            <span className="text-xs font-bold text-amber-300">Togepi In-Cinema Chat</span>
                          </div>
                          <button onClick={() => setShowTogepiMenu(false)} className="text-gray-400 hover:text-white p-0.5 cursor-pointer"><X size={14} /></button>
                        </div>

                        {/* Quick Reaction Emoji Bar */}
                        <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#222]">
                          {['🍿', '🎬', '😂', '😱', '❤️', '🤫', '🔥', '👏'].map((emoji, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendTogepiMessage(emoji)}
                              className="text-sm hover:scale-125 active:scale-90 transition-transform cursor-pointer p-0.5"
                              title={`React ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <div ref={togepiScrollRef} className="max-h-44 overflow-y-auto space-y-1.5 pr-1 scrollbar-none text-[11px]">
                          {togepiChatHistory.length === 0 ? (
                            <p className="text-[10px] text-gray-500 text-center py-4 italic">Send live reactions & chat while watching!</p>
                          ) : (
                            togepiChatHistory.map((msg, mIdx) => (
                              <div key={mIdx} className={`p-1.5 px-2.5 rounded-xl flex flex-col max-w-[85%] ${msg.sender === role ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 ml-auto items-end text-right' : 'bg-[#1e1e1e] text-gray-200 border border-[#333] mr-auto items-start text-left'}`}>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">{msg.sender === role ? 'You' : (msg.sender === 'parent' ? 'Admin' : 'User')} ({msg.time})</span>
                                <span className="font-medium mt-0.5 break-words">{msg.text}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <input 
                            type="text"
                            value={togepiInput}
                            onChange={(e) => setTogepiInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendTogepiMessage(togepiInput); } }}
                            placeholder="Type movie reaction..."
                            className="flex-1 bg-[#181818] border border-[#333] text-white px-3 py-1.5 rounded-xl text-xs outline-none focus:border-amber-400"
                          />
                          <button 
                            type="button"
                            onClick={() => handleSendTogepiMessage(togepiInput)}
                            className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowTogepiMenu(!showTogepiMenu);
                        if (incomingTogepiAlert) setIncomingTogepiAlert(null);
                      }}
                      className="w-10 h-10 rounded-full hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center relative group drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] opacity-95 hover:opacity-100"
                      title="Togepi In-Cinema Chat"
                    >
                      <img 
                        src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23fef08a' stroke='%23ca8a04' stroke-width='4'/><path d='M30 40 Q50 20 70 40 Z' fill='%23f97316'/><path d='M25 60 Q50 35 75 60 Z' fill='%233b82f6'/><circle cx='40' cy='45' r='5' fill='%23000'/><circle cx='60' cy='45' r='5' fill='%23000'/></svg>" 
                        alt="Togepi" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-lg bg-black"
                      />
                      {incomingTogepiAlert && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-ping">!</span>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            </ErrorBoundary>
          )}

            {viewMode !== 'admin_dashboard' && viewMode !== 'daily_projects' && (
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
                  <span>{role === 'user' ? 'H' : 'A'} is typing...</span>
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

              {/* PROMPT SUGGESTIONS (MATCHING OFFICIAL CHATGPT APP - IMAGE 1) */}
              {viewMode !== 'stealth' && (!stealthMessages || stealthMessages.length === 0 || viewMode === 'real_gpt') && (
                <div className="flex flex-col gap-2.5 mb-3 px-2 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setInput("Create an image or sticker of ");
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="flex items-center gap-3 text-gray-200 hover:text-white text-sm font-serif sm:font-sans transition-colors cursor-pointer text-left py-1"
                  >
                    <ImageIcon size={20} className="text-gray-400 shrink-0" />
                    <span>Create an image or sticker</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInput("Write or edit ");
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="flex items-center gap-3 text-gray-200 hover:text-white text-sm font-serif sm:font-sans transition-colors cursor-pointer text-left py-1"
                  >
                    <SquarePen size={20} className="text-gray-400 shrink-0" />
                    <span>Write or edit</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full relative">
                <div className="w-full bg-[#212121] rounded-full border border-[#2e2e2e] focus-within:border-[#444] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-2xl min-h-[48px]">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="text-[#9b9b9b] hover:text-white p-1 rounded-full cursor-pointer shrink-0"
                    title="Send Photo"
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
                        : "Ask ChatGPT"
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

                  <button 
                    type="button" 
                    onPointerDown={handleThinkPointerDown}
                    onPointerUp={handleThinkPointerUp}
                    onPointerCancel={handleThinkPointerCancel}
                    onPointerLeave={handleThinkPointerCancel}
                    onContextMenu={(e) => {
                      if (role === 'parent') {
                        e.preventDefault();
                        setViewMode(prev => prev === 'stealth' ? 'real_gpt' : 'stealth');
                      }
                    }}
                    title={role === 'parent' ? "Hold 0.4s to toggle secret chat" : "Think"}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full cursor-pointer shrink-0 select-none touch-none transition-all duration-150 ${
                      isPressingThink 
                        ? 'bg-blue-600/40 text-cyan-200 scale-90 ring-2 ring-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]' 
                        : 'text-[#9b9b9b] hover:text-white hover:bg-[#2c2c2c]'
                    }`}
                  >
                    <Sparkles size={13} className={isPressingThink ? 'text-cyan-300 animate-spin' : 'text-blue-400'} />
                    <span className="hidden sm:inline">Think</span>
                  </button>

                  <button type="button" className="text-[#9b9b9b] hover:text-white p-1 cursor-pointer shrink-0">
                    <Mic size={19} />
                  </button>

                  <button 
                    type="submit" 
                    className="bg-[#3b82f6] hover:bg-blue-600 text-white w-9 h-9 rounded-full cursor-pointer flex items-center justify-center shadow-lg shrink-0 active:scale-95 transition-transform"
                    title={input.trim() ? "Send message" : "Voice mode"}
                  >
                    {input.trim() ? <ArrowUp size={18} /> : <AudioLines size={18} />}
                  </button>
                </div>
              </form>
            </div>
          )}
          </>
        )}

        {/* ADMIN CALL RECORDINGS VAULT MODAL WITH PLAY, DOWNLOAD & DELETE */}
        {showAdminRecordingsModal && role === 'parent' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-rose-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 font-sans text-left">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <Disc size={18} className="animate-spin" />
                  <span>Admin Call Recordings Vault ({adminRecordingsList.length})</span>
                </div>
                <button onClick={() => setShowAdminRecordingsModal(false)} className="text-gray-400 hover:text-white cursor-pointer"><X size={18} /></button>
              </div>

              <p className="text-[11px] text-gray-400 italic">Recordings auto-delete after 24 hours.</p>

              <div className="max-h-72 overflow-y-auto space-y-2.5 scrollbar-none pr-1">
                {adminRecordingsList.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No call recordings stored in vault yet. Complete a live audio call to generate records.</p>
                ) : (
                  adminRecordingsList.map((rec) => (
                    <div key={rec.id} className="bg-[#1c1c1c] border border-[#2a2a2a] p-3 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-200">{rec.title}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{rec.date} | ⏱ {rec.duration} | 📦 {rec.size}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handlePlayRecordingAudio(rec)}
                          className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-xl cursor-pointer shadow"
                          title="Play Audio Recording"
                        >
                          <Play size={13} fill="currentColor" />
                        </button>
                        <button 
                          onClick={() => handleDownloadRecording(rec)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl cursor-pointer shadow"
                          title="Download MP3 / PDF Report"
                        >
                          <Download size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecording(rec.id)}
                          className="bg-zinc-800 hover:bg-rose-900 text-gray-300 hover:text-white p-2 rounded-xl cursor-pointer shadow"
                          title="Delete Recording"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowAdminRecordingsModal(false)}
                className="w-full bg-[#222] hover:bg-[#333] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Close Vault
              </button>
            </div>
          </div>
        )}

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

        {/* LAZY LOADED MODALS SUSPENSE WRAPPER */}
        <Suspense fallback={null}>
          <PassbookModal
            showLoveBalanceModal={showLoveBalanceModal}
          setShowLoveBalanceModal={setShowLoveBalanceModal}
          displayedLoveBalance={displayedLoveBalance}
          formatLoveBalance={formatLoveBalance}
          isParentAdmin={isParentAdmin}
          activeLbTarget={activeLbTarget}
          setActiveLbTarget={setActiveLbTarget}
          activeDoraName={activeDoraName}
          doraNetBalance={doraNetBalance}
          adminNetBalance={adminNetBalance}
          loveModalTab={loveModalTab}
          setLoveModalTab={setLoveModalTab}
          redeemedWishesList={redeemedWishesList}
          handleManualSectionRefresh={handleManualSectionRefresh}
          refreshingSection={refreshingSection}
          cutPointsTotal={cutPointsTotal}
          payoutsTotal={payoutsTotal}
          redeemedWishesTotal={redeemedWishesTotal}
          role={role}
          wishRequests={wishRequests}
          handleApproveWishRequest={handleApproveWishRequest}
          handleDeclineWishRequest={handleDeclineWishRequest}
          visibleLoveLedger={visibleLoveLedger}
          handleOpenClearModal={handleOpenClearModal}
          loveSourceFilter={loveSourceFilter}
          setLoveSourceFilter={setLoveSourceFilter}
          loveStatusFilter={loveStatusFilter}
          setLoveStatusFilter={setLoveStatusFilter}
          loveDateFrom={loveDateFrom}
          setLoveDateFrom={setLoveDateFrom}
          loveDateTo={loveDateTo}
          setLoveDateTo={setLoveDateTo}
          handleDeleteTransaction={handleDeleteTransaction}
          handleInitiateWishRequest={handleInitiateWishRequest}
          handleToggleWishFulfillment={handleToggleWishFulfillment}
          handleLoveBalanceTransaction={handleLoveBalanceTransaction}
          socketRef={socketRef}
        />

        {/* INCOMING GAME CHALLENGE NOTIFICATION (LIVE POPUP FROM PARTNER) */}
        {incomingGameChallenge && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100000] w-[92%] max-w-md bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-3 animate-bounce font-sans">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{incomingGameChallenge.game === 'ludo' ? '🎲' : '⚔️'}</span>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-black text-amber-300">
                  {incomingGameChallenge.challenger} Challenged You!
                </h4>
                <p className="text-[11px] text-gray-200">
                  {incomingGameChallenge.game === 'ludo' ? 'Ludo Royale (2P Live Board)' : 'Couple Tic-Tac-Toe'}
                  {incomingGameChallenge.betAmount ? ` • ₹${incomingGameChallenge.betAmount} Bet` : ' • Friendly'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const g = incomingGameChallenge.game;
                  setIncomingGameChallenge(null);
                  if (g === 'ludo') setShowLudoModal(true);
                  else setShowCoupleMiniGameModal(true);
                }}
                className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-3 py-1.5 rounded-xl shadow cursor-pointer active:scale-95 transition-all"
              >
                Accept & Play
              </button>
              <button
                type="button"
                onClick={() => setIncomingGameChallenge(null)}
                className="text-gray-300 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* COUPLE GAMES HUB MODAL */}
        <GamesHubModal
          isOpen={showGamesHubModal}
          onClose={() => setShowGamesHubModal(false)}
          onOpenLudo={() => setShowLudoModal(true)}
          onOpenTicTacToe={() => setShowCoupleMiniGameModal(true)}
          role={role}
          activeDoraName={activeDoraName}
        />

        {/* AUTHENTIC 2-PLAYER MOBILE LUDO ROYALE MODAL */}
        <LudoGameModal
          isOpen={showLudoModal}
          onClose={() => setShowLudoModal(false)}
          socketRef={socketRef}
          role={role}
          activeDoraName={activeDoraName}
          onSendChatInvite={handleSendChatGameInvite}
          gameState={ludoGameState}
          onAction={handleGameAction}
        />

        {/* REAL-TIME COUPLE MINI-GAME: TIC-TAC-TOE WITH POINTS BETTING */}
        <CoupleMiniGameModal
          isOpen={showCoupleMiniGameModal}
          onClose={() => setShowCoupleMiniGameModal(false)}
          socketRef={socketRef}
          role={role}
          activeDoraName={activeDoraName}
          onSendChatInvite={handleSendChatGameInvite}
          gameState={tictactoeState}
          onAction={handleGameAction}
        />

        {/* INCOMING WISH REQUEST APPROVAL POPUP */}
        <WishApprovalModal
          activeWishApprovalModal={activeWishApprovalModal}
          handleApproveWishRequest={handleApproveWishRequest}
          handleDeclineWishRequest={handleDeclineWishRequest}
        />

        {/* ANSWER PENDING MODAL */}
        <AnswerPendingModal
          showPendingModal={showPendingModal}
          setShowPendingModal={setShowPendingModal}
          pendingMessages={pendingMessages}
          downloadPendingPDF={downloadPendingPDF}
          togglePendingFlag={togglePendingFlag}
        />

        {/* STEALTH ALERT BUBBLE */}
        <StealthAlertBubble
          incomingAlert={incomingAlert}
          handleBubbleDismiss={handleBubbleDismiss}
          bubbleDimensions={bubbleDimensions}
          bubbleFontSize={bubbleFontSize}
        />

        {/* DARSH ASSISTANT BOT */}
        <DarshAssistantBot
          role={role}
          isBotOpen={isBotOpen}
          setIsBotOpen={setIsBotOpen}
          botTab={botTab}
          setBotTab={setBotTab}
          customMsg={customMsg}
          setCustomMsg={setCustomMsg}
          socketRef={socketRef}
          schedMsg={schedMsg}
          setSchedMsg={setSchedMsg}
          schedTime1={schedTime1}
          setSchedTime1={setSchedTime1}
          schedTime2={schedTime2}
          setSchedTime2={setSchedTime2}
          handleScheduleAlertSubmit={handleScheduleAlertSubmit}
        />
        </Suspense>

      </main>

        {/* LAZY LOADED MODALS OUTSIDE MAIN */}
        <Suspense fallback={null}>
        {/* CLEAR ALL CONFIRMATION POPUP */}
        <ClearConfirmModal
          showClearConfirmModal={showClearConfirmModal}
          setShowClearConfirmModal={setShowClearConfirmModal}
          clearModalTarget={clearModalTarget}
          setClearModalTarget={setClearModalTarget}
          activeDoraName={activeDoraName}
          handleConfirmClearLedger={handleConfirmClearLedger}
        />

        {/* FULL IMAGE PROOF PREVIEW MODAL */}
        <ImagePreviewModal
          dailyPreviewModalImg={dailyPreviewModalImg}
          setDailyPreviewModalImg={setDailyPreviewModalImg}
        />

        {/* ADMIN REAL-TIME TASK NOTIFICATION TOAST BANNER */}
        {dailyAdminToast && (role === 'parent' || role === 'admin') && (
          <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-[#1c1917] border-2 border-amber-500 rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-top-4 duration-200 font-sans">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">New Task Proof Submitted!</h4>
                  <p className="text-[11px] text-gray-200 font-semibold">{dailyAdminToast.slotTitle}</p>
                  {dailyAdminToast.note && <p className="text-[10px] text-gray-400 italic">"{dailyAdminToast.note}"</p>}
                </div>
              </div>
              <button 
                onClick={() => setDailyAdminToast(null)}
                className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  setViewMode('admin_dashboard');
                  setDailyAdminTab('review');
                  setDailyAdminToast(null);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1 px-2.5 rounded-lg text-center cursor-pointer shadow active:scale-95 transition-all"
              >
                Review Now in Admin Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* ADD / EDIT ROUTINE SLOT MODAL (FOR DARSH) */}
        <RoutineSlotModal
          showAddSlotModal={showAddSlotModal}
          handleCancelSlotModal={handleCancelSlotModal}
          editingSlotId={editingSlotId}
          slotFormTitle={slotFormTitle}
          setSlotFormTitle={setSlotFormTitle}
          slotFormTimeRange={slotFormTimeRange}
          setSlotFormTimeRange={setSlotFormTimeRange}
          slotFormTag={slotFormTag}
          setSlotFormTag={setSlotFormTag}
          slotFormPoints={slotFormPoints}
          setSlotFormPoints={setSlotFormPoints}
          handleSaveSlotForm={handleSaveSlotForm}
        />

        {/* SLOT REPORT & PROOF MODAL (MATCHING USER REPORT SCREEN) */}
        <SlotReportModal
          isOpen={showSlotReportModal}
          onClose={() => setShowSlotReportModal(false)}
          slot={dailySlots.find(s => s.id === dailySelectedSlotId) || dailySlots.find(s => s.isActive)}
          submission={getSlotSubmission(dailySelectedSlotId || (dailySlots[0] && dailySlots[0].id), dailySelectedDate)}
          selectedDate={dailySelectedDate}
          role={role}
          onTriggerUpload={(slotId) => {
            if (slotId) setDailySelectedSlotId(slotId);
            if (dailyFileInputRef.current) {
              dailyFileInputRef.current.value = "";
              dailyFileInputRef.current.click();
            }
          }}
          onPreviewImage={(img) => setDailyPreviewModalImg(img)}
          onApprove={(subId, slot) => {
            const sub = getSlotSubmission(slot.id, dailySelectedDate);
            if (sub) handleApproveDailyTask(sub);
          }}
          onReject={(subId, slot) => {
            const sub = getSlotSubmission(slot.id, dailySelectedDate);
            if (sub) handleRejectDailyTask(sub);
          }}
          isOverdue={checkSlotOverdue(dailySlots.find(s => s.id === dailySelectedSlotId), dailySelectedDate)}
        />
        </Suspense>
    </div>
  );
}
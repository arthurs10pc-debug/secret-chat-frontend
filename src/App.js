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
  Film, Tv, Video, TerminalSquare, AlertTriangle, HardDrive, Globe, ExternalLink, Gamepad2, Trophy, RotateCcw, Dices, Timer, Dice5, Send, MessageCircle, Phone, Video as VideoIcon, CheckCheck, MicOff, Disc, Lock, Trash2, Heart, Coins, Award, Scale, Gift, SlidersHorizontal, Bell, BellRing, Filter, CheckCircle2, XCircle, ArrowLeft, MoreVertical, Paperclip, Camera, Briefcase, Calendar, CheckCircle
} from 'lucide-react';

const SOCKET_URL = "https://secret-chat-backend-07d0.onrender.com";
const SECRET_KEY = "StealthMasterKey99";
const GLOBAL_ROOM = "stealth_master_room";

const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-8vMeAtA5cHmDkJ0d8Q9cW4vG0mJ5M3Q5lK0P8vWq6X5LwG0J7j6W0Yg';

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🙏", "👌", "💯", "🤫", "✨"];
const HOVER_REACTIONS = ["👍", "❤️", "🥰", "😆", "😮", "😢", "➕"];
const ROMANTIC_REGEX = /[\u2764\u2665\u2763\u2765\u2661\uD83D\uDC93-\uD83D\uDC9F\uD83E\uDDE1\uD83E\uDD0D\uD83E\uDD0E\uD83E\uDEF6\uD83D\uDE18\uD83E\uDD70\uD83D\uDE0D\uD83D\uDC8B\uD83E\uDE75-\uD83E\uDE77\uD83D\uDC8F\uD83D\uDC91\uD83C\uDF39\uD83D\uDC90\uD83E\uDD17]|<3|:heart:|\bdil\b|\bpyaar\b|\blove\b/iu;

const ARCADE_GAMES = [
  { id: 'ludo', name: 'Ludo (Royal Clash)', desc: '2-Player Real-Time Multiplayer Board Game with Colorful Tokens & Animated 3D Dice' }
];

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

const DEFAULT_LOVE_LEDGER = [];

const ROMANTIC_WISH_STORE = [
  {
    id: 'wish_voicenote',
    title: 'Voice Note on Demand',
    cost: 20.00,
    icon: '🎙️',
    description: 'A personalized cute voice note with sweet romantic nicknames and compliments on demand.'
  },
  {
    id: 'wish_icecream',
    title: 'Ice Cream / Dessert Treat',
    cost: 40.00,
    icon: '🍦',
    description: 'Guaranteed favorite ice cream flavor or dessert delivered or enjoyed together.'
  },
  {
    id: 'wish_movie',
    title: 'Codex Cinema Movie Choice',
    cost: 75.00,
    icon: '🎬',
    description: 'Full sovereign pick of the next romantic movie or show to stream synchronized together.'
  },
  {
    id: 'wish_custom',
    title: 'Custom Romantic Wish',
    cost: 120.00,
    icon: '✨',
    description: 'Any personal cute favor, romantic request, or surprise granted without hesitation.'
  },
  {
    id: 'wish_dinner',
    title: 'Candlelight Dinner Date',
    cost: 250.00,
    icon: '🥂',
    description: 'A fully planned and organized romantic dinner date with VIP royal couple treatment.'
  }
];

const LOVE_EARNING_RULES = [
  { sno: 1, task: 'Daily Morning Sweet Text', criteria: 'Send sweet Good Morning message before 9:00 AM', reward: '+2.00' },
  { sno: 2, task: 'Instant Reply', criteria: 'Reply within 5 minutes of incoming message', reward: '+1.00' },
  { sno: 3, task: 'Compliment Drop', criteria: 'Spontaneous, genuine romantic compliment during conversation', reward: '+3.00' },
  { sno: 4, task: 'Meal Check-in', criteria: 'Caring "Had food?" reminder sent before 2:00 PM / 9:00 PM', reward: '+2.00' },
  { sno: 5, task: 'Virtual Hug / Kiss Emoji', criteria: 'Sharing cute romantic emojis, stickers, or kisses in chat', reward: '+1.00' },
  { sno: 6, task: 'Romantic Song / Movie Suggestion', criteria: 'Suggesting a quality romantic track or movie to enjoy together', reward: '+5.00' },
  { sno: 7, task: 'Late Night Romantic Paragraph', criteria: 'Writing a heartfelt, emotional paragraph at night before bed', reward: '+10.00' },
  { sno: 8, task: '100% Weekend Availability', criteria: 'Spending dedicated quality time without gaps on weekends', reward: '+10.00' },
  { sno: 9, task: 'Anniversary / Milestone Reminder', criteria: 'Remembering and wishing special date or anniversary in advance', reward: '+15.00' },
  { sno: 10, task: 'Apology without Ego', criteria: 'Promptly apologizing with love and zero ego after misunderstanding', reward: '+5.00' },
  { sno: 11, task: 'Surprise Cute Selfie', criteria: 'Sending a spontaneous smile or cute picture', reward: '+3.00' },
  { sno: 12, task: 'Patient Listening', criteria: 'Listening to full story/rant with empathy without interrupting', reward: '+5.00' },
  { sno: 13, task: 'Future Date Planning', criteria: 'Suggesting and planning a fun upcoming date idea together', reward: '+8.00' }
];

const LOVE_DEDUCTION_RULES = [
  { sno: 1, infraction: 'Seen & Ignored (Left on Read)', criteria: 'Message seen but left unreplied for more than 1 hour', penalty: '-3.00' },
  { sno: 2, infraction: 'Late Reply / Ghosting', criteria: 'Disappearing for hours without giving prior heads-up', penalty: '-5.00' },
  { sno: 3, infraction: 'Dry Replies ("Hmm", "Ok", "K")', criteria: 'Replying with dry 1-word answers to long sweet messages', penalty: '-2.00' },
  { sno: 4, infraction: 'Fighting / Rudeness', criteria: 'Using harsh tone, anger, or unromantic rudeness in chat', penalty: '-10.00' },
  { sno: 5, infraction: 'Forgetting Special Dates', criteria: 'Forgetting important anniversaries, milestones, or birthdays', penalty: '-20.00' },
  { sno: 6, infraction: 'Sleeping Without "Good Night"', criteria: 'Falling asleep without wishing sweet Good Night', penalty: '-3.00' },
  { sno: 7, infraction: 'Broken Romantic Promise', criteria: 'Cancelling a promised call or romantic activity without reason', penalty: '-8.00' }
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

  // 7:20 PM Auto-Download Countdown Timer State
  const [countdownStr, setCountdownStr] = useState("00:00:00");
  const autoDownloadedRef = useRef(false);

  // Love Balance & Karma Currency State
  const [loveBalance, setLoveBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_love_balance');
      return saved !== null ? parseFloat(saved) : 0.00;
    } catch {
      return 0.00;
    }
  });


  const [loveLedger, setLoveLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_love_ledger');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(item => {
              if (!item) return false;
              // Purge ONLY legacy mock template entries by exact ID pattern (lb_1 .. lb_11) or mock announcement
              if (item.id && /^lb_([1-9]|1[0-1])$/.test(item.id)) return false;
              if (item.description && (
                item.description.includes('Announcement Read') ||
                item.description.includes('Monthly Punctuality Reward')
              )) return false;
              return true;
            })
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

  const [showLoveBalanceModal, setShowLoveBalanceModal] = useState(false);
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
      return saved !== null ? parseFloat(saved) : 0.00;
    } catch {
      return 0.00;
    }
  });
  const [activeLbTarget, setActiveLbTarget] = useState('user'); // 'user' (Partner A) or 'admin' (Admin H)
  const [adminOverrideVal, setAdminOverrideVal] = useState('');

  // --- DAILY PROJECTS & HOURLY ROUTINE STATE ---
  const [dailySlots, setDailySlots] = useState([
    { id: 'slot_1', title: 'Morning Workout (10 Squats / Stretch)', timeRange: '08:00 - 09:00', tag: 'Workout', rewardPoints: 2.0, order: 1, isActive: true },
    { id: 'slot_2', title: 'Healthy Detox Juice / Morning Drink', timeRange: '09:00 - 10:00', tag: 'Juice', rewardPoints: 1.5, order: 2, isActive: true },
    { id: 'slot_3', title: 'Heavy Breakfast (High-Calorie Meal Plate)', timeRange: '10:00 - 11:00', tag: 'Breakfast', rewardPoints: 2.5, order: 3, isActive: true },
    { id: 'slot_4', title: 'Lunch Check-in & Care Update', timeRange: '01:00 - 02:00', tag: 'Lunch', rewardPoints: 2.0, order: 4, isActive: true },
    { id: 'slot_5', title: 'Hydration Milestone (Water Intake)', timeRange: '03:30 - 04:30', tag: 'Water', rewardPoints: 1.0, order: 5, isActive: true },
    { id: 'slot_6', title: 'Evening Tea & Healthy Snack', timeRange: '05:00 - 05:30', tag: 'Tea', rewardPoints: 1.0, order: 6, isActive: true },
    { id: 'slot_7', title: 'High-Protein Dinner Plate', timeRange: '08:30 - 09:30', tag: 'Dinner', rewardPoints: 2.0, order: 7, isActive: true },
    { id: 'slot_8', title: 'Google Fit 8,000 Steps Screenshot', timeRange: '10:00 - 10:30', tag: 'Steps', rewardPoints: 3.0, order: 8, isActive: true },
    { id: 'slot_9', title: 'Night Skin Care Routine & Glow Check', timeRange: '10:30 - 11:00', tag: 'Skincare', rewardPoints: 2.0, order: 9, isActive: true }
  ]);
  const [dailySubmissions, setDailySubmissions] = useState([]);
  const [dailySelectedDate, setDailySelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailySelectedSlotId, setDailySelectedSlotId] = useState('slot_1');
  const [dailyNoteInput, setDailyNoteInput] = useState('');
  const [dailyImageProof, setDailyImageProof] = useState('');
  const [dailySubmitting, setDailySubmitting] = useState(false);
  const [dailyPreviewModalImg, setDailyPreviewModalImg] = useState(null);
  const [dailyAdminToast, setDailyAdminToast] = useState(null);
  const [dailyAdminTab, setDailyAdminTab] = useState('review'); // 'review' | 'slots'
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotFormTitle, setSlotFormTitle] = useState('');
  const [slotFormTimeRange, setSlotFormTimeRange] = useState('');
  const [slotFormTag, setSlotFormTag] = useState('Task');
  const [slotFormPoints, setSlotFormPoints] = useState('2.0');
  const [dailyAITip, setDailyAITip] = useState('');
  const [dailyAILoading, setDailyAILoading] = useState(false);
  const dailyFileInputRef = useRef(null);

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
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
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
  const roleRef = useRef(role);
  const isCurrentAdmin = role === 'parent';

  // --- CODEX CINEMA YOUTUBE PLAYER SYNC ENGINE ---
  useEffect(() => {
    if (codexEngine === 'youtube' && activeMovieYTId) {
      let ytTimer = null;
      const initCodexYT = () => {
        if (!window.YT || !window.YT.Player) return;
        try {
          if (codexYTPlayerRef.current && typeof codexYTPlayerRef.current.destroy === 'function') {
            codexYTPlayerRef.current.destroy();
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
        if (codexYTPlayerRef.current && typeof codexYTPlayerRef.current.destroy === 'function') {
          try { codexYTPlayerRef.current.destroy(); } catch (e) {}
          codexYTPlayerRef.current = null;
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
      if (val === '1111') {
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
    if (val === '1111') {
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

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
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

    if (viewMode === 'stealth' || isWhatsAppView) {
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

      // --- AUTOMATIC LOVE KARMA REAL-TIME EVALUATION ---
      const prevMessage = stealthMessages[stealthMessages.length - 1] || null;
      evaluateLoveKarmaMessageRules(val, role, prevMessage);
      setInput('');
      setReplyTarget(null);
      if (wpChatScrollRef.current) {
        wpChatScrollRef.current.scrollTop = wpChatScrollRef.current.scrollHeight;
      }
      return;
    }

    playSentSound();
    fetchLiveAIResponse(val);
    setInput('');
    setReplyTarget(null);
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
        const s = codexYTPlayerRef.current.getPlayerState();
        currState = s === 1 ? 'PLAY' : 'PAUSE';
      }
    } else if (html5VideoRef.current) {
      currTime = html5VideoRef.current.currentTime || 0;
      currState = html5VideoRef.current.paused ? 'PAUSE' : 'PLAY';
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
    const timerInterval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(19, 20, 0, 0);

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
    roleRef.current = role;
    if (viewMode === 'admin_dashboard' && role !== 'parent') {
      setViewMode('real_gpt');
    }
    // Only Dora uploads tasks; Darsh (admin) checks & approves inside the Admin Dashboard
    if (viewMode === 'daily_projects' && role === 'parent') {
      setViewMode('admin_dashboard');
      setDailyAdminTab('review');
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
        try { reg.update(); } catch (e) {}
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
  }, [loveBalance, adminLoveBalance, loveLedger]);

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
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setNotificationPermission(perm);
        }).catch(() => {});
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  const triggerMobileNotification = useCallback((incomingText, senderRole) => {
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
  }, []);

  const handleLoveBalanceTransaction = useCallback((amount, type, reason, isBroadcast = false, target = 'user', extraData = null) => {
    const numAmount = Math.abs(parseFloat(amount) || 0);
    if (numAmount === 0) return;
    const finalDelta = type === 'credit' ? numAmount : -numAmount;

    if (target === 'user') {
      setLoveBalance(prev => {
        const next = Math.max(0, parseFloat((prev + finalDelta).toFixed(2)));
        try { localStorage.setItem('stealth_love_balance', next.toString()); } catch(e) {}
        return next;
      });
    } else {
      setAdminLoveBalance(prev => {
        const next = Math.max(0, parseFloat((prev + finalDelta).toFixed(2)));
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

    const targetLabel = target === 'user' ? 'Dora' : 'Darsh';
    const cleanReason = reason || (type === 'credit' ? 'Love Balance Reward' : (type === 'redeem' ? 'Wish Redeemed' : 'Love Balance Deduction'));
    const newEntry = {
      id: 'lb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      sl: 1,
      target: target,
      description: '[' + targetLabel + '] ' + cleanReason,
      earnedAt: nowStr,
      expireDate: expStr,
      points: type === 'credit' ? numAmount : -numAmount,
      type: type,
      remarks: cleanReason,
      status: type === 'credit' ? 'Confirmed' : (type === 'redeem' ? 'Redeemed' : 'Deducted'),
      wishTitle: (extraData && extraData.title) || (type === 'redeem' ? cleanReason.replace(/^Redeemed:\s*/i, '') : undefined),
      wishIcon: (extraData && extraData.icon) || '🎁',
      wishCost: numAmount,
      fulfillmentStatus: type === 'redeem' ? 'Pending' : undefined
    };

    setLoveLedger(prev => {
      const nextLedger = [newEntry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
      try { localStorage.setItem('stealth_love_ledger', JSON.stringify(nextLedger)); } catch(e) {}
      return nextLedger;
    });

    if (type === 'credit' && !isBroadcast) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 } });
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


  // --- REAL-TIME AUTOMATIC LOVE KARMA / LOVE BALANCE RULES ENGINE ---
  const evaluateLoveKarmaMessageRules = useCallback((messageText, senderRole, prevMessage = null) => {
    if (!messageText || typeof messageText !== 'string') return;
    const cleanText = messageText.trim();
    if (!cleanText) return;

    const targetUser = senderRole === 'parent' ? 'admin' : 'user';
    const now = new Date();
    const currentHour = now.getHours();
    const cleanLower = cleanText.toLowerCase();

    // 1. Virtual Hug / Kiss / Heart Emoji (+1 Point)
    if (ROMANTIC_REGEX.test(cleanText)) {
      handleLoveBalanceTransaction(1.00, 'credit', 'Virtual Hug / Heart Emoji Shared (❤️)', false, targetUser);
    }

    // 2. Morning Sweet Text before 10:00 AM (+2 Points)
    if (currentHour >= 5 && currentHour < 10) {
      const todayDateKey = 'lb_morning_' + targetUser + '_' + now.toDateString();
      if (!localStorage.getItem(todayDateKey)) {
        localStorage.setItem(todayDateKey, 'true');
        handleLoveBalanceTransaction(2.00, 'credit', 'Morning Sweet Text (Before 10:00 AM)', false, targetUser);
      }
    }

    // 3. Instant Reply within 5 minutes (+1 Point)
    if (prevMessage && prevMessage.senderRole !== senderRole && prevMessage.timestamp) {
      const diffMs = Date.now() - new Date(prevMessage.timestamp).getTime();
      if (diffMs > 0 && diffMs <= 5 * 60 * 1000) {
        handleLoveBalanceTransaction(1.00, 'credit', 'Instant Reply (Within 5 Mins)', false, targetUser);
      }
    }

    // 4. Food / Meal Care Check-in (+2 Points)
    const foodKeywords = ['khana', 'khaana', 'lunch', 'dinner', 'breakfast', 'nashta', 'meal', 'eat', 'khaya', 'khao', 'khali', 'food'];
    const hasFoodCheck = foodKeywords.some(kw => cleanLower.includes(kw));
    if (hasFoodCheck && (cleanLower.includes('?') || cleanLower.includes('khaya') || cleanLower.includes('khao') || cleanLower.includes('eat') || cleanLower.includes('lunch') || cleanLower.includes('dinner'))) {
      handleLoveBalanceTransaction(2.00, 'credit', 'Food / Meal Care Check-in', false, targetUser);
    }

    // 5. Compliment Drop & Romantic Sweet Talk (+3 Points)
    const complimentWords = [
      'love you', 'love u', 'i love you', 'i love u', 'ily', 'loveyou',
      'miss you', 'miss u', 'cute', 'sundar', 'pyaari', 'pyari', 'handsome',
      'so sweet', 'sweetheart', 'darling', 'proud of you', 'meri jaan',
      'babu', 'shona', 'tareef', 'pyaar', 'kiss', 'muah', 'hug', 'hugs',
      'jaan', 'jaana', 'baby', 'cutie'
    ];
    const hasCompliment = complimentWords.some(w => cleanLower.includes(w));
    if (hasCompliment) {
      handleLoveBalanceTransaction(3.00, 'credit', 'Romantic Compliment Drop', false, targetUser);
    }

    // 6. Long Romantic Paragraph (+10 Points)
    if (cleanText.length >= 70) {
      handleLoveBalanceTransaction(10.00, 'credit', 'Deep Romantic Long Message', false, targetUser);
    }

    // 7. Dry Reply Check (-2 Points)
    if (prevMessage && prevMessage.senderRole !== senderRole && prevMessage.text && prevMessage.text.length > 35) {
      const dryWords = ['hmm', 'ok', 'k', 'acha', 'thik', 'humm', 'kk'];
      if (dryWords.includes(cleanLower)) {
        handleLoveBalanceTransaction(2.00, 'debit', 'Dry Single-Word Reply ("Hmm"/"Ok")', false, targetUser);
      }
    }
  }, [handleLoveBalanceTransaction]);


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
  }, [clearModalTarget, role]);

  const handleAdminOverrideBalance = useCallback((target, newBal) => {
    const val = parseFloat(newBal);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid balance amount (>= 0).");
      return;
    }
    if (target === 'user') {
      setLoveBalance(val);
      try { localStorage.setItem('stealth_love_balance', val.toString()); } catch(e) {}
    } else {
      setAdminLoveBalance(val);
      try { localStorage.setItem('stealth_admin_love_balance', val.toString()); } catch(e) {}
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
    alert('Success: ' + (target === 'user' ? 'Dora' : 'Darsh') + ' Love Balance set to ₹ ' + val.toFixed(2) + '.');
  }, []);

  const handleSendLoveNudge = useCallback((target) => {
    if (socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: GLOBAL_ROOM,
        action: 'LOVE_NUDGE',
        target: target,
        message: target === 'user' ? "💖 Darsh sent you a sweet Love Nudge!" : "💖 Dora sent you a Love Nudge!",
        senderRole: roleRef.current || 'admin',
        timestamp: Date.now()
      });
      alert('Love Nudge dispatched to ' + (target === 'user' ? 'Dora' : 'Darsh') + '!');
    }
  }, []);

  const compressImage = (file, maxWidth = 1280, quality = 0.8) => {
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
      setDailyImageProof(compressed);
    } catch (err) {
      console.warn('Image processing error:', err);
    }
  };

  const handleDailyTaskSubmit = () => {
    if (roleRef.current === 'parent' || role === 'parent') {
      alert("Task upload is only for Dora. Admin (Darsh) reviews and approves inside the Admin Dashboard.");
      return;
    }
    if (!dailySelectedSlotId) return;
    if (!dailyNoteInput.trim() && !dailyImageProof) {
      alert("Please enter a short note or attach a photo proof.");
      return;
    }
    const selectedSlot = dailySlots.find(s => s.id === dailySelectedSlotId);
    if (socketRef.current) {
      socketRef.current.emit('daily_task_submit', {
        date: dailySelectedDate,
        slotId: dailySelectedSlotId,
        slotTitle: selectedSlot ? selectedSlot.title : 'Routine Task',
        note: dailyNoteInput.trim(),
        image: dailyImageProof,
        userRole: roleRef.current || role || 'user'
      });
    }
    setDailyNoteInput('');
    setDailyImageProof('');
    alert("✨ Task submitted! Status is now PENDING REVIEW by Darsh. Points will be awarded once approved!");
  };

  const handleApproveDailyTask = (sub) => {
    if (!sub || !socketRef.current) return;
    const slot = dailySlots.find(s => s.id === sub.slotId);
    const pts = slot ? slot.rewardPoints : 2.0;
    socketRef.current.emit('daily_task_approve', {
      submissionId: sub.id,
      points: pts,
      feedback: 'Approved by Darsh',
      slotTitle: slot ? slot.title : 'Routine Task'
    });
  };

  const handleRejectDailyTask = (sub) => {
    if (!sub || !socketRef.current) return;
    const reason = window.prompt("Enter reason for requesting retake:", "Please retake with clear proof photo");
    if (reason === null) return;
    socketRef.current.emit('daily_task_reject', {
      submissionId: sub.id,
      feedback: reason
    });
  };

  const handleSaveSlotForm = () => {
    if (!slotFormTitle.trim() || !slotFormTimeRange.trim()) {
      alert("Please provide both title and time range.");
      return;
    }
    if (editingSlotId) {
      if (socketRef.current) {
        socketRef.current.emit('daily_slot_update', {
          slotId: editingSlotId,
          updates: {
            title: slotFormTitle.trim(),
            timeRange: slotFormTimeRange.trim(),
            tag: slotFormTag,
            rewardPoints: parseFloat(slotFormPoints) || 1.0
          }
        });
      }
    } else {
      if (socketRef.current) {
        socketRef.current.emit('daily_slot_create', {
          title: slotFormTitle.trim(),
          timeRange: slotFormTimeRange.trim(),
          tag: slotFormTag,
          rewardPoints: parseFloat(slotFormPoints) || 1.0,
          order: dailySlots.length + 1
        });
      }
    }
    setShowAddSlotModal(false);
    setEditingSlotId(null);
    setSlotFormTitle('');
    setSlotFormTimeRange('');
    setSlotFormPoints('2.0');
  };

  const handleDeleteSlot = (slotId) => {
    if (!window.confirm("Are you sure you want to delete this routine slot?")) return;
    if (socketRef.current) {
      socketRef.current.emit('daily_slot_delete', { slotId });
    }
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
      reconnectionAttempts: 30,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      if (socketRef.current) {
        socketRef.current.emit('love_balance_action', {
          room: GLOBAL_ROOM,
          action: 'REQUEST_SYNC',
          senderRole: roleRef.current || 'user',
          timestamp: Date.now()
        });
      }
      const currentRole = localStorage.getItem('stealth_role') || 'user';
      socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: currentRole });
      markMessagesAsSeen();
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
      setActiveGame(gameObj);
      setWinnerMessage('');
      playReceiveSound();
    });

    socketRef.current.on('togepi_movie_chat', ({ senderRole, text }) => {
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

      const currentVTime = html5VideoRef.current ? html5VideoRef.current.currentTime : (codexYTPlayerRef.current?.getCurrentTime() || 0);
      const gap = Math.abs(currentVTime - target);
      setSyncDelayGapText(`⚡ Realigned (-${gap.toFixed(1)}s gap fixed)`);
      if (delayGapTimeoutRef.current) clearTimeout(delayGapTimeoutRef.current);
      delayGapTimeoutRef.current = setTimeout(() => setSyncDelayGapText(''), 3500);

      if (codexEngine === 'youtube' && codexYTPlayerRef.current && typeof codexYTPlayerRef.current.seekTo === 'function') {
        codexYTPlayerRef.current.seekTo(target, true);
        if (data.state === 'PLAY') codexYTPlayerRef.current.playVideo();
        else codexYTPlayerRef.current.pauseVideo();
      } else if (html5VideoRef.current) {
        isMovieRemoteTriggerRef.current = true;
        html5VideoRef.current.currentTime = target;
        if (data.state === 'PLAY') {
          html5VideoRef.current.play().catch(() => {});
          setIsMoviePlaying(true);
        } else {
          html5VideoRef.current.pause();
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

      if (codexEngine === 'youtube' && codexYTPlayerRef.current && typeof codexYTPlayerRef.current.seekTo === 'function') {
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
      } else if ((codexEngine === 'gofile' || codexEngine === 'local') && html5VideoRef.current) {
        isMovieRemoteTriggerRef.current = true;
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

    socketRef.current.on('love_balance_broadcast', (data) => {
      if (!data) return;
      const myRole = roleRef.current || role || localStorage.getItem('stealth_role');
      const isMyOwnAction = (data.senderRole && data.senderRole === myRole) || 
        ((myRole === 'parent' || myRole === 'admin') && (data.senderRole === 'parent' || data.senderRole === 'admin'));

      // Authoritative real-time sync from server
      if (typeof data.currentLoveBalance === 'number') {
        setLoveBalance(data.currentLoveBalance);
        try { localStorage.setItem('stealth_love_balance', data.currentLoveBalance.toString()); } catch(e) {}
      }
      if (typeof data.currentAdminLoveBalance === 'number') {
        setAdminLoveBalance(data.currentAdminLoveBalance);
        try { localStorage.setItem('stealth_admin_love_balance', data.currentAdminLoveBalance.toString()); } catch(e) {}
      }

      if (isMyOwnAction) return;

      // PRIVACY ENFORCEMENT: Dora must NEVER receive or view Darsh's points
      if (myRole !== 'parent' && myRole !== 'admin' && data.target === 'admin') {
        return;
      }

      if (data.action === 'CLEAR_LEDGER') {
        const clearTarget = data.target || 'user';
        if (clearTarget === 'user') {
          setLoveBalance(0);
          localStorage.setItem('stealth_love_balance', '0');
          setLoveLedger(prev => {
            const next = prev.filter(e => e.target === 'admin' || (e.description && e.description.includes('[Darsh]')));
            localStorage.setItem('stealth_love_ledger', JSON.stringify(next));
            return next;
          });
        } else if (clearTarget === 'admin') {
          setAdminLoveBalance(0);
          localStorage.setItem('stealth_admin_love_balance', '0');
          setLoveLedger(prev => {
            const next = prev.filter(e => e.target !== 'admin' && !(e.description && e.description.includes('[Darsh]')));
            localStorage.setItem('stealth_love_ledger', JSON.stringify(next));
            return next;
          });
        } else {
          setLoveBalance(0);
          localStorage.setItem('stealth_love_balance', '0');
          setAdminLoveBalance(0);
          localStorage.setItem('stealth_admin_love_balance', '0');
          setLoveLedger([]);
          localStorage.setItem('stealth_love_ledger', '[]');
        }
      } else if (data.action === 'OVERRIDE_BALANCE') {
        if (data.target === 'user') {
          setLoveBalance(data.newBalance);
          try { localStorage.setItem('stealth_love_balance', data.newBalance.toString()); } catch(e) {}
          alert('⚡ Love Balance updated to ₹ ' + data.newBalance.toFixed(2) + ' by Darsh!');
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
          alert('🎉 IT\'S APPROVED! 💖\n\n' + (req.targetName || 'Your partner') + ' APPROVED your wish:\n"' + req.wishTitle + '"!\n\nPoints deducted and wish granted!');
        }
      } else if (data.action === 'WISH_DECLINED') {
        const req = data.wishRequest;
        if (req) {
          setWishRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'DECLINED' } : r));
          alert('Note: Wish request for "' + req.wishTitle + '" was declined.');
        }
      } else if (data.action === 'REQUEST_SYNC') {
        if (socketRef.current) {
          socketRef.current.emit('love_balance_action', {
            room: GLOBAL_ROOM,
            action: 'SYNC_STATE_RESPONSE',
            loveBalance: loveBalance,
            adminLoveBalance: adminLoveBalance,
            loveLedger: loveLedger,
            wishRequests: wishRequests,
            senderRole: roleRef.current || role || 'user',
            timestamp: Date.now()
          });
        }
      } else if (data.action === 'SYNC_STATE_RESPONSE') {
        if (typeof data.loveBalance === 'number') {
          setLoveBalance(prev => {
            const serverVal = data.loveBalance;
            const finalVal = (serverVal > 0) ? serverVal : (prev > 0 ? prev : 0);
            try { localStorage.setItem('stealth_love_balance', finalVal.toString()); } catch(e) {}
            if (serverVal === 0 && prev > 0 && socketRef.current) {
              socketRef.current.emit('love_balance_action', {
                room: GLOBAL_ROOM,
                action: 'OVERRIDE_BALANCE',
                target: 'user',
                newBalance: prev
              });
            }
            return finalVal;
          });
        }
        if (typeof data.adminLoveBalance === 'number') {
          setAdminLoveBalance(prev => {
            const serverVal = data.adminLoveBalance;
            const finalVal = (serverVal > 0) ? serverVal : (prev > 0 ? prev : 0);
            try { localStorage.setItem('stealth_admin_love_balance', finalVal.toString()); } catch(e) {}
            if (serverVal === 0 && prev > 0 && socketRef.current) {
              socketRef.current.emit('love_balance_action', {
                room: GLOBAL_ROOM,
                action: 'OVERRIDE_BALANCE',
                target: 'admin',
                newBalance: prev
              });
            }
            return finalVal;
          });
        }
        if (Array.isArray(data.loveLedger) && data.loveLedger.length > 0) {
          const sanitized = data.loveLedger.filter(item => {
            if (!item) return false;
            if (item.id && /^lb_([1-9]|1[0-1])$/.test(item.id)) return false;
            if (item.description && (
              item.description.includes('Announcement Read') ||
              item.description.includes('Monthly Punctuality Reward')
            )) return false;
            return true;
          });
          setLoveLedger(sanitized);
          try { localStorage.setItem('stealth_love_ledger', JSON.stringify(sanitized)); } catch(e) {}
        }
        if (Array.isArray(data.wishRequests) && data.wishRequests.length > 0) {
          setWishRequests(data.wishRequests);
          try { localStorage.setItem('stealth_wish_requests', JSON.stringify(data.wishRequests)); } catch(e) {}
        }
      } else {
        if (data.newEntry) {
          setLoveLedger(prev => {
            if (prev.some(e => e.id === data.newEntry.id)) return prev;
            const updated = [data.newEntry, ...prev.map((e, idx) => ({ ...e, sl: idx + 2 }))];
            try { localStorage.setItem('stealth_love_ledger', JSON.stringify(updated)); } catch(e) {}
            return updated;
          });
        }
        if (typeof data.currentLoveBalance !== 'number') {
          handleLoveBalanceTransaction(data.amount, data.type, data.reason, true, data.target || 'user', data.extraData);
        }
        if (data.type === 'credit') {
          try {
            confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 } });
          } catch (e) {}
        }
      }
    });

    socketRef.current.on('daily_task_sync_response', ({ date, slots, submissions }) => {
      if (Array.isArray(slots) && slots.length > 0) setDailySlots(slots);
      if (Array.isArray(submissions)) setDailySubmissions(submissions);
    });

    socketRef.current.on('daily_task_submission_updated', ({ submission, approved, rejected, isNew, pointsAwarded }) => {
      if (submission) {
        setDailySubmissions(prev => {
          const idx = prev.findIndex(s => s.id === submission.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = submission;
            return next;
          }
          return [...prev, submission];
        });

        if (approved) {
          try {
            confetti({ particleCount: 80, spread: 90, origin: { y: 0.4 } });
          } catch (e) {}
          const activeRole = roleRef.current || role || localStorage.getItem('stealth_role');
          if (activeRole !== 'parent' && activeRole !== 'admin') {
            alert(`🎉 Task Approved by Darsh!\n\n+₹ ${pointsAwarded || submission.pointsAwarded || 0} has been added to your Love Balance! 💖`);
          }
        } else if (rejected) {
          const activeRole = roleRef.current || role || localStorage.getItem('stealth_role');
          if (activeRole !== 'parent' && activeRole !== 'admin') {
            alert(`Note: Darsh requested a retake on this task:\n"${submission.adminFeedback || 'Please retake with clear proof'}"`);
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

    socketRef.current.on('daily_slots_updated', ({ slots }) => {
      if (Array.isArray(slots)) setDailySlots(slots);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [playReceiveSound, playBubblePopSound, markMessagesAsSeen, triggerMobileNotification, handleLoveBalanceTransaction, codexEngine]);

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
    setActiveGame(game);
    setWinnerMessage('');
    if (socketRef.current) {
      socketRef.current.emit('launch_multiplayer_game', game);
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
      doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("WhatsApp / Chat Transcript - Bubble Export", 14, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`Exported: ${new Date().toLocaleString()}  |  Total Messages: ${stealthMessages.length}`, 14, 19);

      let y = 32;
      const pageHeight = 297;
      const maxWidth = 90;
      const margin = 14;

      if (stealthMessages.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(11);
        doc.text("No messages recorded in this chat stream.", margin, y);
      } else {
        stealthMessages.forEach((m) => {
          const isUser = m.senderRole === 'user';
          const senderLabel = isUser ? 'A (User)' : 'H (Admin)';
          const time = m.timeFormatted || new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const content = m.isMedia ? "[Encrypted Secret Photo Asset]" : cleanOriginalText(m.text || "");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const splitLines = doc.splitTextToSize(content || "(empty)", maxWidth);
          const bubbleHeight = (splitLines.length * 4.5) + 10;

          if (y + bubbleHeight > pageHeight - 15) {
            doc.addPage();
            y = 20;
          }

          const xPos = isUser ? margin : (210 - margin - maxWidth);

          if (isUser) {
            doc.setFillColor(241, 245, 249);
            doc.setDrawColor(203, 213, 225);
          } else {
            doc.setFillColor(220, 252, 231);
            doc.setDrawColor(187, 247, 208);
          }
          doc.roundedRect(xPos, y, maxWidth, bubbleHeight, 3, 3, 'FD');

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(`${senderLabel}`, xPos + 4, y + 5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(splitLines, xPos + 4, y + 10);

          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(time, xPos + maxWidth - 16, y + bubbleHeight - 3);

          y += bubbleHeight + 4;
        });
      }

      doc.save(`WhatsApp_Chat_Bubble_Transcript_${Date.now()}.pdf`);
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

    if (ROMANTIC_REGEX.test(emoji) || emoji === '❤️' || emoji === '🥰' || emoji === '❤') {
      const targetUser = role === 'parent' ? 'admin' : 'user';
      handleLoveBalanceTransaction(1.00, 'credit', 'Heart Reaction on Message (❤️)', false, targetUser);
    }

    if (socketRef.current) {
      socketRef.current.emit('add_reaction', {
        room: GLOBAL_ROOM,
        messageId,
        reaction: emoji
      });
    }
  };

  const handleEmojiClick = (emoji) => {
    setInput(prev => prev + emoji);
    setShowMiniEmojiBar(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const displayedStealthMessages = role === 'user' ? stealthMessages.slice(-60) : stealthMessages;
  const partnerRole = role === 'parent' ? 'user' : 'parent';
  const partnerName = role === 'parent' ? 'Dora' : 'Darsh';
  const isPartnerOnline = onlineRoles.includes(partnerRole);
  const filteredWpMessages = wpSearchQuery.trim()
    ? displayedStealthMessages.filter(m => m.text && m.text.toLowerCase().includes(wpSearchQuery.toLowerCase()))
    : displayedStealthMessages;
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
    ? (lbViewerTarget === 'admin' ? Number(adminLoveBalance || 0) : Number(loveBalance || 0))
    : Number(loveBalance || 0);

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

  const redeemedWishesList = visibleLoveLedger
    .filter(e => e.type === 'redeem' || e.status === 'Redeemed');

  const redeemedWishesTotal = redeemedWishesList
    .reduce((sum, e) => sum + Math.abs(e.points), 0);

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
            <p className="text-[10px] text-emerald-300 font-mono">From {role === 'parent' ? 'Dora' : 'Darsh'}</p>
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
            <p className="text-xs font-black text-white">Calling {role === 'parent' ? 'Dora' : 'Darsh'}...</p>
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
            w-64 md:w-60 max-w-[85vw]
            transition-transform md:transition-[width] duration-250 ease-in-out
            bg-[#000000] flex flex-col border-r border-[#171717] overflow-hidden select-none shrink-0
            ${sidebarOpen ? 'translate-x-0 md:w-60' : '-translate-x-full md:translate-x-0 md:w-0'}
          `}
        >
          <div className="h-14 flex items-center justify-between px-3.5 pt-1.5 shrink-0">
            <span className="font-semibold text-base tracking-tight text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center p-1 shadow-sm shrink-0">
                <ChatGPTLogo className="w-4 h-4 text-black" />
              </span>
              <span>ChatGPT</span>
            </span>
            <div className="flex items-center gap-2.5 text-[#9b9b9b]">
              <Search size={18} className="cursor-pointer hover:text-white" />
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[#9b9b9b] hover:text-white cursor-pointer"
              >
                <PanelLeft size={18} />
              </button>
            </div>
          </div>

          <div className="px-2.5 py-1 space-y-1 shrink-0 text-xs md:text-[13px]">
            <div 
              onClick={handleNewChat}
              className="flex items-center justify-between py-2 px-3 rounded-xl text-[#ececf1] hover:bg-[#1a1a1a] transition-colors cursor-pointer font-medium"
            >
              <span className="flex items-center gap-2.5">
                <SquarePen size={16} /> New chat
              </span>
              {role === 'parent' && <ShieldCheck size={14} className="text-emerald-400" />}
            </div>

            <div 
              onClick={() => { setViewMode('images_archive'); closeSidebarOnMobile(); }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${viewMode === 'images_archive' ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}
            >
              <span className="flex items-center gap-2.5">
                <ImageIcon size={16} className={viewMode === 'images_archive' ? 'text-blue-400' : 'text-[#9b9b9b]'} /> Images
              </span>
              <span className="text-[11px] text-gray-400 font-mono">{archivedImages.length}</span>
            </div>

            <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-2 px-3 rounded-xl cursor-pointer transition-colors">
              <BookOpen size={16} className="text-[#9b9b9b]" /> Library
            </div>

            <div 
              onClick={() => { setViewMode('scheduled'); closeSidebarOnMobile(); }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${viewMode === 'scheduled' ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]'}`}
            >
              <span className="flex items-center gap-2.5">
                <Clock size={16} className={viewMode === 'scheduled' ? 'text-amber-400' : 'text-[#9b9b9b]'} /> Scheduled
              </span>
              {syncStatus === 'connected' ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Joint Synced" />
              ) : (
                syncStatus === 'incoming_request' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />
              )}
            </div>

            {/* PLUGINS MENU ITEM */}
            <div 
              onClick={() => {
                if (role === 'parent' || showArcadePlugins) {
                  setShowArcadePlugins(!showArcadePlugins);
                }
              }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${
                incomingGameRequest ? 'bg-amber-500/20 border border-amber-500/50 animate-pulse' : (showArcadePlugins ? 'bg-[#212121] text-white' : 'text-[#ececf1] hover:bg-[#1a1a1a]')
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ToyBrick size={16} className={incomingGameRequest ? 'text-amber-400 animate-spin' : (showArcadePlugins ? 'text-emerald-400' : 'text-[#9b9b9b]')} /> 
                <span>Plugins</span>
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                incomingGameRequest ? 'bg-amber-500 text-black animate-bounce' : (showArcadePlugins ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400')
              }`}>
                {incomingGameRequest ? 'NEW REQ' : (showArcadePlugins ? 'ACTIVE' : 'LOCKED')}
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

            {/* LUDO MULTIPLAYER LAUNCHER IN PLUGINS MENU */}
            {showArcadePlugins && (role === 'parent' || !incomingGameRequest) && (
              <div className="p-2 space-y-2 bg-[#0c0c0c] rounded-xl border border-amber-500/40 my-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 px-1">
                  <span className="flex items-center gap-1">🎲 LUDO ROYALE</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">2-PLAYER</span>
                </div>
                <button
                  onClick={() => handleLaunchGame(ARCADE_GAMES[0])}
                  className="w-full bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  <Gamepad2 size={15} className="animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Play Ludo (H vs A)</span>
                </button>
              </div>
            )}

            <div 
              onClick={() => { 
                if (role === 'parent') {
                  setViewMode('admin_dashboard');
                  setDailyAdminTab('review');
                } else {
                  setViewMode('daily_projects');
                }
                closeSidebarOnMobile(); 
              }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${
                (role !== 'parent' && viewMode === 'daily_projects') || (role === 'parent' && viewMode === 'admin_dashboard' && dailyAdminTab === 'review')
                  ? 'bg-[#212121] text-white font-medium' 
                  : 'text-[#ececf1] hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 size={16} className={(role !== 'parent' && viewMode === 'daily_projects') || (role === 'parent' && viewMode === 'admin_dashboard' && dailyAdminTab === 'review') ? 'text-blue-400' : 'text-[#9b9b9b]'} />
                <span>{role === 'parent' ? "Dora's Tasks (Admin)" : "Projects"}</span>
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

          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 border-t border-[#1a1a1a] mt-1 scrollbar-none text-xs">
            <div className="text-[11px] text-[#737373] px-3 py-1.5 font-semibold uppercase tracking-wider">Recents</div>
            {roomList.map((roomName, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setCurrentRoom(roomName);
                  setViewMode('real_gpt');
                  setReplyTarget(null);
                  closeSidebarOnMobile();
                }}
                className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors group ${currentRoom === roomName && viewMode === 'real_gpt' ? 'bg-[#212121] text-white font-medium' : 'text-[#b4b4b4] hover:bg-[#171717] hover:text-white'}`}
              >
                <span className="truncate max-w-[190px]">{roomName}</span>
              </div>
            ))}
          </div>

          

          {!isAppInstalled && (
            <div className="px-3 py-2 border-t border-[#171717] bg-[#0c0c0c]">
              <button
                onClick={() => { handleInstallApp(); closeSidebarOnMobile(); }}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                title="Install ChatGPT on your phone"
              >
                <Download size={15} className="animate-bounce" />
                <span>Install App on Mobile</span>
              </button>
            </div>
          )}

          <div className="p-3 border-t border-[#171717] flex items-center justify-between text-xs bg-[#000000]">
            {/* ADMIN ONLY CLICKABLE PROFILE TO OPEN SEPARATE DASHBOARD */}
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
              title={role === 'parent' ? "Click to open Admin Dashboard" : "User Profile"}
            >
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                role === 'parent' 
                  ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 border-amber-400 text-black shadow-md group-hover:scale-105' 
                  : 'bg-[#1e293b] border-[#333] text-white'
              }`}>
                {role === 'parent' ? '👑' : 'A'}
              </div>
              <div className="truncate text-left">
                <p className={`font-medium truncate flex items-center gap-1.5 ${
                  role === 'parent' ? 'text-amber-400 group-hover:text-amber-300 font-bold' : 'text-white'
                }`}>
                  <span>{role === 'parent' ? 'Darsh' : 'Dora'}</span>
                  {role === 'parent' && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-mono font-bold animate-pulse">
                      DASHBOARD ➔
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span>Free</span>
                  {role === 'parent' && <span className="text-amber-500/80 font-mono">• Click to open</span>}
                </p>
              </div>
            </div>
            {/* UPGRADE BUTTON REQUIRING PIN GATE */}
            <button 
              onClick={handleUpgradeClick}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 font-bold"
              title="Switch to WhatsApp View"
            >
              Upgrade
            </button>
          </div>
        </aside>
      ) : (
        /* WHATSAPP FULL IMMERSIVE CHAT VIEW */
        <aside className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#0b141a] flex flex-col overflow-hidden select-none font-sans">
          {/* WHATSAPP HEADER */}
          <div className="h-16 bg-[#202c33] flex items-center justify-between px-3 sm:px-4 shrink-0 text-[#e9edef] shadow-md z-20 border-b border-[#2a3942]/60 relative">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsWhatsAppView(false)}
                className="text-[#aebac1] hover:text-white p-1.5 -ml-1 rounded-full hover:bg-[#374248]/50 transition-colors cursor-pointer"
                title="Return to Secret Chat"
              >
                <ArrowLeft size={20} />
              </button>

              <div 
                onClick={() => setIsWhatsAppView(false)}
                className="w-10 h-10 rounded-full bg-[#128c7e]/20 border border-[#25d366]/40 flex items-center justify-center text-base font-bold text-[#e9edef] relative shrink-0 cursor-pointer shadow-inner"
              >
                {partnerName[0]}
                {isPartnerOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-[#202c33] rounded-full animate-pulse shadow-sm" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-[#e9edef] tracking-tight truncate leading-tight">
                  {partnerName}
                </h3>
                <div className="text-[11.5px] font-normal leading-tight h-3.5 flex items-center">
                  {isPeerTyping ? (
                    <span className="text-[#25d366] animate-pulse">typing...</span>
                  ) : isPartnerOnline ? (
                    <span className="text-[#25d366]">online</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-[#aebac1] relative">
              <button
                type="button"
                onClick={() => alert("WhatsApp Video Call feature: Secure connection established with " + partnerName + "!")}
                className="p-2 hover:text-white hover:bg-[#374248]/40 rounded-full transition-colors cursor-pointer"
                title="WhatsApp Video Call"
              >
                <VideoIcon size={19} />
              </button>

              {role === 'parent' ? (
                <button
                  type="button"
                  onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('passbook'); }}
                  className="flex items-center gap-1.5 bg-[#182229] hover:bg-[#2a3942] border border-pink-500/50 text-white px-2 sm:px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shrink-0 shadow-sm"
                  title="Dora: 💕 Love Balance | Darsh: 👑 Love Balance"
                >
                  <span className="flex items-center gap-1 text-pink-300">
                    <span>💕</span>
                    <span>₹{Number(loveBalance || 0).toFixed(2)}</span>
                  </span>
                  <span className="text-[#374248]">|</span>
                  <span className="flex items-center gap-1 text-blue-300">
                    <span>👑</span>
                    <span>₹{Number(adminLoveBalance || 0).toFixed(2)}</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('passbook'); }}
                  className="flex items-center gap-1 bg-[#182229] hover:bg-[#2a3942] border border-pink-500/50 text-pink-300 hover:text-white px-2 sm:px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shrink-0 shadow-sm"
                  title="Your Love Balance Passbook & Wish Store"
                >
                  <span className="text-pink-400">💖</span>
                  <span>₹ {Number(loveBalance || 0).toFixed(2)}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleStartAudioCall}
                className="p-2 hover:text-[#25d366] hover:bg-[#374248]/40 rounded-full transition-colors cursor-pointer"
                title="WhatsApp Voice Call"
              >
                <Phone size={19} />
              </button>

              <button
                type="button"
                onClick={() => setShowWpSearch(!showWpSearch)}
                className="p-2 hover:text-white hover:bg-[#374248]/40 rounded-full transition-colors cursor-pointer"
                title="Search Messages"
              >
                <Search size={19} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowWpMenu(!showWpMenu)}
                  className="p-2 hover:text-white hover:bg-[#374248]/40 rounded-full transition-colors cursor-pointer"
                  title="Menu"
                >
                  <MoreVertical size={19} />
                </button>

                {showWpMenu && (
                  <div 
                    className="absolute right-0 top-11 bg-[#233138] border border-[#374248] rounded-2xl shadow-2xl py-2 w-48 z-50 text-xs text-[#d1d7db] font-medium animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      type="button"
                      onClick={() => { setShowWpSearch(true); setShowWpMenu(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors"
                    >
                      Search in chat
                    </button>
                    {role === 'parent' && (
                      <button 
                        type="button"
                        onClick={() => { downloadFullChatPDF(); setShowWpMenu(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors"
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
                      className="w-full text-left px-4 py-2.5 hover:bg-[#182229] text-rose-400 transition-colors"
                    >
                      Clear chat
                    </button>
                    <div className="border-t border-[#374248] my-1" />
                    <button 
                      type="button"
                      onClick={() => { setIsWhatsAppView(false); setShowWpMenu(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#182229] text-amber-300 font-bold transition-colors"
                    >
                      Exit WhatsApp View
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="button"
                onClick={() => setIsWhatsAppView(false)}
                className="bg-[#182229] hover:bg-[#2a3942] text-[#e9edef] text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer border border-[#374248] transition-all active:scale-95"
              >
                Exit WP
              </button>
            </div>
          </div>

          {/* SEARCH BAR IN WP VIEW */}
          {showWpSearch && (
            <div className="bg-[#111b21] border-b border-[#2a3942] px-4 py-2 flex items-center gap-2.5 z-20">
              <Search size={16} className="text-[#8696a0]" />
              <input 
                type="text"
                value={wpSearchQuery}
                onChange={(e) => setWpSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none"
                autoFocus
              />
              {wpSearchQuery && (
                <button onClick={() => setWpSearchQuery('')} className="text-[#8696a0] hover:text-white">
                  <X size={15} />
                </button>
              )}
              <button onClick={() => { setShowWpSearch(false); setWpSearchQuery(''); }} className="text-xs text-[#25d366] font-semibold">
                Close
              </button>
            </div>
          )}

          {/* INCOMING CALL BANNER AT UPPER SIDE WITH ANSWER & DECLINE */}
          {isIncomingCall && !isInAudioCall && (
            <div className="absolute top-16 left-0 right-0 z-[99999] bg-[#202c33] border-b-2 border-emerald-500 p-3 px-5 flex items-center justify-between text-white shadow-2xl animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2.5">
                <Phone size={20} className="text-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white">Incoming Whisper Audio Call...</p>
                  <p className="text-[10px] text-gray-400">Secure Peer-to-Peer Stream</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleAcceptIncomingCall}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow active:scale-95 transition-all"
                >
                  Answer
                </button>
                <button
                  type="button"
                  onClick={() => setIsIncomingCall(false)}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow active:scale-95 transition-all"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE WHISPER AUDIO CALL MODAL OVERLAY IN WP VIEW WITH END CALL BUTTON */}
          {isInAudioCall && (
            <div className="bg-[#111b21] border-b border-[#2a3942] p-3 px-4 flex flex-col gap-2 shrink-0 animate-in slide-in-from-top duration-200 shadow-xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold">Whisper Call Active ({formatCallTime(callDurationSec)})</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  {isWhisperModeEnabled ? '🤫 Whisper & Noise Scrambler ON' : 'HD Call'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsWhisperModeEnabled(!isWhisperModeEnabled)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isWhisperModeEnabled ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#2a3942] text-gray-300 hover:text-white'
                  }`}
                >
                  <Radio size={13} />
                  <span>{isWhisperModeEnabled ? 'Whisper Mode Active' : 'Enable Whisper Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCallMuted(!isCallMuted)}
                  className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    isCallMuted ? 'bg-rose-600 text-white' : 'bg-[#2a3942] text-gray-300'
                  }`}
                  title={isCallMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isCallMuted ? <MicOff size={15} /> : <Mic size={15} />}
                </button>

                <button
                  type="button"
                  onClick={handleEndAudioCall}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow"
                >
                  End Call
                </button>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES BODY WITH AUTHENTIC WHATSAPP DOODLE PATTERN */}
          <div 
            ref={wpChatScrollRef}
            onClick={() => { setShowWpMenu(false); setActiveReactionMsgId(null); }}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] bg-[size:18px_18px]"
          >
            {/* WHATSAPP DATE DIVIDER */}
            <div className="flex justify-center my-2 sticky top-1 z-10">
              <span className="bg-[#182229] border border-[#222d34] text-[#8696a0] text-[11px] font-semibold px-3 py-1 rounded-lg shadow uppercase tracking-wide">
                TODAY
              </span>
            </div>

            {filteredWpMessages.length === 0 ? (
              <div className="text-center text-xs text-[#8696a0] py-16 space-y-1">
                <p className="font-semibold text-[#d1d7db]">No messages found</p>
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
                  <div key={m._id || idx} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      onTouchStart={(e) => {
                        touchStartXRef.current = e.touches[0].clientX;
                        activeSwipeMsgIdRef.current = m;
                      }}
                      onTouchEnd={(e) => {
                        const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
                        if (diffX > 60 && activeSwipeMsgIdRef.current) {
                          handleStartReply(activeSwipeMsgIdRef.current);
                        }
                      }}
                      onDoubleClick={() => {
                        setActiveReactionMsgId(activeReactionMsgId === m._id ? null : m._id);
                      }}
                      title="Swipe right to reply • Double tap for reactions"
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm relative cursor-pointer text-[14.5px] leading-relaxed transition-all ${
                        isMine 
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
                          : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#2a3942]/60'
                      }`}
                    >
                      {hasReplyTag && (
                        <div className="bg-black/30 border-l-2 border-[#25d366] pl-2.5 py-1 mb-1.5 text-xs text-[#25d366] italic truncate rounded">
                          {replySnippet}
                        </div>
                      )}

                      {m.isMedia ? (
                        <div className="space-y-1">
                          <img 
                            src={m.text} 
                            alt="Shared Photo" 
                            className="max-h-64 rounded-xl object-contain cursor-pointer shadow-md" 
                            onClick={() => window.open(m.text, '_blank')} 
                          />
                        </div>
                      ) : (
                        <p className="break-words select-text">{cleanBody}</p>
                      )}

                      {/* REACTION POPUP TRAY ON DOUBLE TAP */}
                      {isReactionOpen && (
                        <div 
                          className="absolute -top-11 left-0 z-30 bg-[#233138] border border-[#374248] px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {["👍", "❤️", "😂", "😮", "🙏", "➕"].map((emoji, eIdx) => (
                            <button
                              key={eIdx}
                              type="button"
                              onClick={() => {
                                if (emoji === '➕') {
                                  setShowMiniEmojiBar(!showMiniEmojiBar);
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
                        </div>
                      )}

                      {/* MESSAGE REACTION BADGE */}
                      {m.reaction && (
                        <span className="absolute -bottom-2 right-2 bg-[#202c33] border border-[#374248] px-2 py-0.5 rounded-full text-xs shadow-md">
                          {m.reaction}
                        </span>
                      )}

                      {/* TIME, WHATSAPP DELIVERY TICKS & AWARD BUTTON */}
                      <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-[#8696a0] select-none font-normal">
                        {!isMine ? (
                          <div className="relative inline-flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAwardMsgId(activeAwardMsgId === m._id ? null : m._id);
                              }}
                              title={'Award Love Karma to ' + partnerName}
                              className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-pink-950/70 hover:bg-pink-900 border border-pink-700/60 text-pink-300 hover:text-white cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                              <Heart size={10} className="text-pink-400 fill-pink-400" />
                              <span>Award</span>
                            </button>

                            {activeAwardMsgId === m._id && (
                              <div 
                                className="absolute left-0 bottom-6 z-50 bg-[#141414] border border-pink-500/50 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 w-44 text-left text-xs font-sans animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wider px-1">💖 Award {partnerName} Karma</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const awardTarget = role === 'parent' ? 'user' : 'admin';
                                    handleLoveBalanceTransaction(1.00, 'credit', 'Cute Gesture / Heart', false, awardTarget);
                                    setActiveAwardMsgId(null);
                                  }}
                                  className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                >
                                  +1 ₹ Cute Reaction
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const awardTarget = role === 'parent' ? 'user' : 'admin';
                                    handleLoveBalanceTransaction(3.00, 'credit', 'Romantic Compliment Drop', false, awardTarget);
                                    setActiveAwardMsgId(null);
                                  }}
                                  className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                >
                                  +3 ₹ Sweet Compliment
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const awardTarget = role === 'parent' ? 'user' : 'admin';
                                    handleLoveBalanceTransaction(5.00, 'credit', 'Movie / Song Recommendation', false, awardTarget);
                                    setActiveAwardMsgId(null);
                                  }}
                                  className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                >
                                  +5 ₹ Song/Movie Pick
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const awardTarget = role === 'parent' ? 'user' : 'admin';
                                    handleLoveBalanceTransaction(10.00, 'credit', 'Deep Romantic Talk', false, awardTarget);
                                    setActiveAwardMsgId(null);
                                  }}
                                  className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                >
                                  +10 ₹ Romantic Talk
                                </button>
                              </div>
                            )}
                          </div>
                        ) : <span />}

                        <div className="flex items-center gap-1">
                          <span>{m.timeFormatted}</span>
                          {isMine && (
                            m.isSeen && isPartnerOnline ? (
                              <CheckCheck size={14} className="text-[#53bdeb]" title="Seen" />
                            ) : isPartnerOnline ? (
                              <CheckCheck size={14} className="text-[#8696a0]" title="Delivered" />
                            ) : (
                              <Check size={14} className="text-[#8696a0]" title="Sent" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messageEndRef} />
          </div>

          {replyTarget && (
            <div className="bg-[#1f2c34] border-t border-[#2a3942] px-4 py-2.5 flex items-center justify-between text-xs text-[#25d366]">
              <span className="truncate italic">Replying to: "{replyTarget.text}"</span>
              <button onClick={() => setReplyTarget(null)} className="text-[#8696a0] hover:text-white cursor-pointer"><X size={15} /></button>
            </div>
          )}

          {showMiniEmojiBar && (
            <div className="bg-[#202c33] border-t border-[#2a3942] p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {QUICK_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-lg p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* WHATSAPP BOTTOM INPUT BAR */}
          <form onSubmit={handleSubmit} className="bg-[#202c33] px-2.5 sm:px-4 py-2.5 flex items-center gap-2 shrink-0 border-t border-[#2a3942]/60">
            <button 
              type="button"
              onClick={() => setShowMiniEmojiBar(!showMiniEmojiBar)}
              className="text-[#8696a0] hover:text-[#d1d7db] p-2 hover:bg-[#374248]/40 rounded-full transition-colors cursor-pointer"
              title="Emojis"
            >
              <Smile size={22} />
            </button>
            <button 
              type="button" 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="text-[#8696a0] hover:text-[#d1d7db] p-2 hover:bg-[#374248]/40 rounded-full transition-colors cursor-pointer"
              title="Attach Photo or Document"
            >
              <Paperclip size={21} />
            </button>
            <textarea 
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
              className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] text-[14.5px] px-4 py-2.5 rounded-3xl outline-none resize-none max-h-28 overflow-y-auto leading-relaxed shadow-inner"
            />
            {input.trim().length > 0 ? (
              <button 
                type="submit" 
                className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#029374] active:scale-90 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform shrink-0"
                title="Send Message"
              >
                <Send size={18} className="translate-x-0.5" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleStartAudioCall}
                className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#029374] active:scale-90 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform shrink-0"
                title="Start Whisper Call"
              >
                <Mic size={19} />
              </button>
            )}
          </form>
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
        <header className="h-14 flex items-center justify-between px-4 shrink-0 z-10 border-b border-[#141414]">
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
                  <span className="hidden md:inline">7:20 PM: {countdownStr}</span>
                  <span className="md:hidden text-[11px] font-mono">7:20 PM</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs md:text-sm text-[#9b9b9b] shrink-0">
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
              <button
                type="button"
                onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('passbook'); }}
                className="flex items-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/60 hover:border-emerald-400 text-white px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95 shrink-0"
                title="Dora: 💕 Love Balance | Darsh: 👑 Love Balance"
              >
                <span className="flex items-center gap-1 text-pink-300">
                  <span>💕</span>
                  <span>₹{Number(loveBalance || 0).toFixed(2)}</span>
                </span>
                <span className="text-emerald-700">|</span>
                <span className="flex items-center gap-1 text-blue-300">
                  <span>👑</span>
                  <span>₹{Number(adminLoveBalance || 0).toFixed(2)}</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('passbook'); }}
                className="flex items-center gap-1 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-white px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95 shrink-0"
                title="Open Love Balance Passbook & Wish Store"
              >
                <span className="text-pink-400 font-sans font-black text-sm">💖</span>
                <span>₹ {Number(loveBalance || 0).toFixed(2)}</span>
              </button>
            )}

            {/* UPGRADE BUTTON (SPARKLES REMOVED) */}
            <button className="hidden sm:flex items-center gap-1.5 text-white hover:text-gray-200 cursor-pointer font-medium">
              <span>Upgrade</span>
            </button>

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
                          {msg.text}
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
                            {msg.text}
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
                                        className="absolute left-0 -top-8 z-30 bg-[#1e1e1e] border border-[#3a3a3a] px-2 py-1 rounded-full shadow-2xl flex items-center gap-1.5 backdrop-blur-md"
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
                                        isSeen ? 'text-[#38bdf8]' : 'text-gray-500'
                                      }`}
                                      title={isSeen ? "Seen by counterpart" : "Sent"}
                                    >
                                      {isSeen ? '..' : '.'}
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
                                            onClick={() => {
                                              const awardTarget = role === 'parent' ? 'user' : 'admin';
                                              handleLoveBalanceTransaction(1.00, 'credit', 'Cute Gesture / Heart', false, awardTarget);
                                              setActiveAwardMsgId(null);
                                            }}
                                            className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                          >
                                            +1 ₹ Cute Reaction
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const awardTarget = role === 'parent' ? 'user' : 'admin';
                                              handleLoveBalanceTransaction(3.00, 'credit', 'Romantic Compliment Drop', false, awardTarget);
                                              setActiveAwardMsgId(null);
                                            }}
                                            className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                          >
                                            +3 ₹ Sweet Compliment
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const awardTarget = role === 'parent' ? 'user' : 'admin';
                                              handleLoveBalanceTransaction(5.00, 'credit', 'Movie / Song Recommendation', false, awardTarget);
                                              setActiveAwardMsgId(null);
                                            }}
                                            className="text-left px-2 py-1 rounded-lg hover:bg-pink-950/70 text-gray-200 hover:text-pink-200 transition-colors"
                                          >
                                            +5 ₹ Song/Movie Pick
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const awardTarget = role === 'parent' ? 'user' : 'admin';
                                              handleLoveBalanceTransaction(10.00, 'credit', 'Deep Romantic Talk', false, awardTarget);
                                              setActiveAwardMsgId(null);
                                            }}
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

            {/* --- SEPARATE DEDICATED ADMIN DASHBOARD (ADMIN PARENT ONLY) --- */}
            {viewMode === 'admin_dashboard' && role === 'parent' && (
              <section className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 w-full max-w-7xl mx-auto space-y-3 font-sans animate-in fade-in duration-200">
                
                {/* DASHBOARD HERO HEADER */}
                <div className="bg-gradient-to-r from-[#161616] via-[#1c1813] to-[#161616] border border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center text-xl shadow-lg border border-amber-300 font-black shrink-0">
                        👑
                      </div>
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h1 className="text-base sm:text-lg font-black text-white">Admin Command Center</h1>
                          <span className="text-[10px] bg-amber-500 text-black px-2 py-0.2 rounded-full font-bold">DARSH</span>
                        </div>
                        <p className="text-[11px] text-amber-300/80 font-mono">
                          Session Verified • Darsh (Superuser) • Master Access
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="bg-[#242424] hover:bg-[#333] border border-[#3a3a3a] text-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow md:hidden"
                      >
                        <PanelLeft size={13} className="text-emerald-400" />
                        <span>Menu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDailyAdminTab('review');
                          const el = document.getElementById('admin-part-5-daily-tasks');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow ${
                          dailySubmissions.filter(s => s.status === 'PENDING').length > 0
                            ? 'bg-amber-500 text-black border border-amber-300 animate-pulse'
                            : 'bg-[#242424] hover:bg-[#333] border border-[#3a3a3a] text-emerald-300'
                        }`}
                        title="Review Dora's Hourly Tasks Proofs & Submissions"
                      >
                        <Briefcase size={13} />
                        <span>Dora Tasks {dailySubmissions.filter(s => s.status === 'PENDING').length > 0 ? `(${dailySubmissions.filter(s => s.status === 'PENDING').length} PENDING)` : ''}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('real_gpt')}
                        className="bg-[#242424] hover:bg-[#333] border border-[#3a3a3a] text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow"
                      >
                        <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center p-0.5 shrink-0">
                          <ChatGPTLogo className="w-2.5 h-2.5 text-black" />
                        </span>
                        <span>← Return to Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="bg-amber-500 hover:bg-amber-400 text-black p-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow"
                        title="Reload Dashboard"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 DISTINCT CLEAN MODULAR PARTS (FULL SCREEN FITTED 4 SQUARES) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 text-left font-sans">
                  
                  {/* PART 1: LOVE BALANCE CENTRAL ENGINE (2-PART: ADMIN H & PARTNER A) */}
                  <div className="bg-[#121212] border-2 border-pink-500/40 hover:border-pink-500/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      
                      {/* CARD HEADER WITH DUAL BALANCES */}
                      <div className="flex items-center justify-between border-b border-[#222] pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-base">
                            💖
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                              <span>Part 1: Love Balance Engine</span>
                              <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1.5 py-0.2 rounded font-mono">2-WAY</span>
                            </h3>
                            <p className="text-[10px] text-gray-400">Control & award points for Dora and Darsh</p>
                          </div>
                        </div>

                        {/* DUAL BALANCES DISPLAY */}
                        <div className="flex items-center gap-1.5 text-right">
                          <div className="bg-[#181818] border border-pink-500/30 px-2 py-0.5 rounded-xl">
                            <div className="text-[9px] text-gray-400">Dora</div>
                            <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">₹ {Number(loveBalance || 0).toFixed(2)}</div>
                          </div>
                          <div className="bg-[#181818] border border-blue-500/30 px-2 py-0.5 rounded-xl">
                            <div className="text-[9px] text-gray-400">Darsh</div>
                            <div className="text-xs sm:text-sm font-black text-blue-400 font-mono">₹ {Number(adminLoveBalance || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      {/* 2 PARTS SELECTOR: PARTNER (A) VS ADMIN (H) */}
                      <div className="flex bg-[#181818] p-1 rounded-xl border border-[#2a2a2a] text-xs font-bold gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveLbTarget('user')}
                          className={`flex-1 py-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeLbTarget === 'user' 
                              ? 'bg-pink-600 text-white shadow font-black' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <span>💕 Dora</span>
                          <span className="text-[9px] bg-black/40 px-1 py-0.2 rounded font-mono">₹ {Number(loveBalance || 0).toFixed(2)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveLbTarget('admin')}
                          className={`flex-1 py-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeLbTarget === 'admin' 
                              ? 'bg-blue-600 text-white shadow font-black' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <span>👑 Darsh</span>
                          <span className="text-[9px] bg-black/40 px-1 py-0.2 rounded font-mono">₹ {Number(adminLoveBalance || 0).toFixed(2)}</span>
                        </button>
                      </div>

                      {/* QUICK AWARDS & DEDUCTIONS FOR CURRENT TARGET */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-300">
                          <span className="text-emerald-400 flex items-center gap-1">
                            ✨ Quick Awards to {activeLbTarget === 'user' ? 'Dora' : 'Darsh'} (+₹):
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(2, 'credit', 'Morning Sweet Text (Before 9 AM)', false, activeLbTarget)}
                            className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Morning Sweet Text (+₹2.00)"
                          >
                            +₹2 Morning Text
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(1, 'credit', 'Instant Reply (< 5 mins)', false, activeLbTarget)}
                            className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Instant Reply (+₹1.00)"
                          >
                            +₹1 Fast Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(3, 'credit', 'Compliment Drop', false, activeLbTarget)}
                            className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Compliment Drop (+₹3.00)"
                          >
                            +₹3 Compliment
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(5, 'credit', 'Romantic Song / Movie', false, activeLbTarget)}
                            className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Romantic Song / Movie (+₹5.00)"
                          >
                            +₹5 Song/Movie
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(10, 'credit', 'Late Night Romantic Paragraph', false, activeLbTarget)}
                            className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Late Night Romantic Paragraph (+₹10.00)"
                          >
                            +₹10 Paragraph
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(15, 'credit', 'Special Milestone / Anniversary', false, activeLbTarget)}
                            className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Special Date / Milestone (+₹15.00)"
                          >
                            +₹15 Milestone
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-300 pt-0.5">
                          <span className="text-rose-400 flex items-center gap-1">
                            💔 Quick Deductions from {activeLbTarget === 'user' ? 'Dora' : 'Darsh'} (-₹):
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(2, 'debit', 'Dry Replies ("Hmm", "Ok")', false, activeLbTarget)}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Dry Reply (-₹2.00)"
                          >
                            -₹2 Dry Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(3, 'debit', 'Seen & Ignored (>1 hr)', false, activeLbTarget)}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Seen & Ignored (-₹3.00)"
                          >
                            -₹3 Seen & Left
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(3, 'debit', 'Slept without Good Night', false, activeLbTarget)}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Slept without Good Night (-₹3.00)"
                          >
                            -₹3 Slept w/o GN
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(5, 'debit', 'Late Reply / Ghosting', false, activeLbTarget)}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Late Reply (-₹5.00)"
                          >
                            -₹5 Late Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(10, 'debit', 'Rudeness / Harsh Words', false, activeLbTarget)}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Rudeness (-₹10.00)"
                          >
                            -₹10 Rude Tone
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoveBalanceTransaction(20, 'debit', 'Forgetting Anniversary / Date', false, activeLbTarget)}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 py-1 px-1.5 rounded-lg text-[10px] font-semibold truncate transition-all active:scale-95 cursor-pointer text-center"
                            title="Forgetting Date (-₹20.00)"
                          >
                            -₹20 Forgot Date
                          </button>
                        </div>
                      </div>

                      {/* UNIFIED BALANCE ADJUSTMENT & MASTER POWER CONTROLS */}
                      <div className="bg-[#161616] border border-amber-500/30 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-200">
                          <span className="flex items-center gap-1.5 text-amber-300">
                            ⚡ Balance Control for {activeLbTarget === 'user' ? 'Dora' : 'Darsh'}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">Live Real-time Sync</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={adminLbAmount}
                            onChange={(e) => setAdminLbAmount(e.target.value)}
                            placeholder="Points / ₹ (e.g. 5.0)"
                            className="bg-[#101010] border border-[#333] text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-amber-400 font-mono"
                          />
                          <input
                            type="text"
                            value={adminLbReason}
                            onChange={(e) => setAdminLbReason(e.target.value)}
                            placeholder="Remark / Reason"
                            className="bg-[#101010] border border-[#333] text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (!adminLbAmount) return;
                              handleLoveBalanceTransaction(parseFloat(adminLbAmount), 'credit', adminLbReason || 'Admin Sweet Reward', false, activeLbTarget);
                              setAdminLbAmount('');
                              setAdminLbReason('');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded-lg cursor-pointer shadow active:scale-95 transition-all text-center"
                          >
                            + Credit (+₹)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!adminLbAmount) return;
                              handleLoveBalanceTransaction(parseFloat(adminLbAmount), 'debit', adminLbReason || 'Admin Karma Deduction', false, activeLbTarget);
                              setAdminLbAmount('');
                              setAdminLbReason('');
                            }}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-1.5 rounded-lg cursor-pointer shadow active:scale-95 transition-all text-center"
                          >
                            - Deduct (-₹)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!adminLbAmount) {
                                alert(`Please enter the exact balance amount in the points box for ${activeLbTarget === 'user' ? 'Dora' : 'Darsh'}.`);
                                return;
                              }
                              handleAdminOverrideBalance(activeLbTarget, adminLbAmount);
                              setAdminLbAmount('');
                              setAdminLbReason('');
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 shadow text-center"
                            title="Set exact balance directly"
                          >
                            Force Set Exact
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendLoveNudge(activeLbTarget)}
                            className="bg-[#242424] hover:bg-[#303030] border border-[#3e3e3e] text-pink-300 text-xs font-bold py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 text-center truncate"
                            title="Send instant love alert / ping"
                          >
                            🔔 Nudge
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenClearModal(activeLbTarget)}
                            className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-bold py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-1 col-span-2 sm:col-span-1"
                            title="Clear all transaction history and reset points"
                          >
                            <Trash2 size={12} />
                            <span>Clear All</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* PASSBOOK & WISH STORE LAUNCHERS */}
                    <div className="flex gap-1.5 pt-2 border-t border-[#222]">
                      <button
                        type="button"
                        onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('passbook'); }}
                        className="flex-1 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                      >
                        <Coins size={13} className="text-amber-400" />
                        <span>Open Passbook</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('redeem'); }}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                      >
                        <Gift size={13} />
                        <span>Wish Store</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowLoveBalanceModal(true); setLoveModalTab('rules'); }}
                        className="bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow"
                        title="Love Balance Policy"
                      >
                        📖
                      </button>
                    </div>
                  </div>

                  {/* PART 2: CALL RECORDINGS VAULT & AUDIO HUB */}
                  <div className="bg-[#121212] border-2 border-rose-500/40 hover:border-rose-500/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#222] pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-base">
                            <Disc size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                              <span>Part 2: Call Recordings Vault</span>
                              <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">
                                {adminRecordingsList.length} STORED
                              </span>
                            </h3>
                            <p className="text-[10px] text-gray-400">Mixed dual-channel HD recordings with 24h retention</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartAudioCall}
                          className="bg-rose-950 hover:bg-rose-900 border border-rose-600/60 text-rose-300 px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all shadow flex items-center gap-1 active:scale-95"
                        >
                          <Phone size={11} />
                          <span>Call Now</span>
                        </button>
                      </div>

                      {/* RECORDINGS LIST PREVIEW */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400">
                          <span>Recent Audio Recordings:</span>
                          <span className="text-[9px] text-gray-500">Auto-expires after 24h</span>
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-1.5 scrollbar-none pr-1">
                          {adminRecordingsList.length === 0 ? (
                            <div className="bg-[#181818] border border-[#262626] rounded-xl p-4 text-center text-xs text-gray-500 space-y-1">
                              <p>No call recordings stored in vault yet.</p>
                              <p className="text-[10px] text-gray-600">Start an encrypted whisper call to automatically record and preserve audio.</p>
                            </div>
                          ) : (
                            adminRecordingsList.slice(0, 4).map((rec) => (
                              <div key={rec.id} className="bg-[#181818] border border-[#2a2a2a] p-2.5 rounded-xl flex items-center justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-xs font-bold text-gray-200 truncate">{rec.title || 'Voice Call Recording'}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">
                                    {rec.duration || '0:00'} • {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {rec.audioUrl && (
                                    <audio controls src={rec.audioUrl} className="h-6 w-24 sm:w-32 outline-none" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecording(rec.id)}
                                    className="text-gray-500 hover:text-rose-400 p-1 cursor-pointer rounded-lg hover:bg-[#252525] transition-colors"
                                    title="Delete Recording"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* VAULT MODAL ACTION */}
                    <div className="pt-2 border-t border-[#222]">
                      <button
                        type="button"
                        onClick={() => setShowAdminRecordingsModal(true)}
                        className="w-full bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                      >
                        <Disc size={13} className="text-rose-400 animate-spin" />
                        <span>Open Dedicated Audio Vault ({adminRecordingsList.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* PART 3: ANSWER PENDING & 7:20 PM PDF AUTO-EXPORT */}
                  <div className="bg-[#121212] border-2 border-amber-500/40 hover:border-amber-500/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#222] pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base">
                            <AlertCircle size={16} />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                              <span>Part 3: Answer Pending & PDF</span>
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                                {pendingMessages.length} PENDING
                              </span>
                            </h3>
                            <p className="text-[10px] text-gray-400">Flagged questions & 7:20 PM daily auto-export scheduler</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-gray-400">Daily Export In</div>
                          <div className="text-xs sm:text-sm font-black text-amber-400 font-mono flex items-center gap-1 justify-end">
                            <Timer size={11} className="animate-spin" />
                            <span>{countdownStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* PENDING LIST PREVIEW */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400">
                          <span>Flagged Questions ({pendingMessages.length}):</span>
                          <span className="text-[9px] text-emerald-400">Auto-downloads at 7:20 PM</span>
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-1.5 scrollbar-none pr-1">
                          {pendingMessages.length === 0 ? (
                            <div className="bg-[#181818] border border-[#262626] rounded-xl p-4 text-center text-xs text-gray-500 space-y-1">
                              <p>All questions answered! Zero pending flags.</p>
                              <p className="text-[10px] text-gray-600">Flag important questions in secret chat to highlight and review here.</p>
                            </div>
                          ) : (
                            pendingMessages.slice(0, 4).map((msg) => (
                              <div key={msg._id} className="bg-[#181818] border border-[#2a2a2a] p-2.5 rounded-xl flex items-center justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-xs font-semibold text-gray-200 truncate">{msg.text}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">
                                    By {msg.senderRole === 'parent' ? 'Darsh' : 'Dora'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => togglePendingFlag(e, msg)}
                                  className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-all active:scale-95 shrink-0"
                                >
                                  Resolve
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PDF EXPORT ACTION BUTTONS */}
                    <div className="flex gap-1.5 pt-2 border-t border-[#222]">
                      <button
                        type="button"
                        onClick={downloadFullChatPDF}
                        className="flex-1 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1"
                      >
                        <Download size={13} className="text-amber-400" />
                        <span>Instant Full Chat PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={downloadPendingPDF}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1"
                      >
                        <FileDown size={13} />
                        <span>Export Pending PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPendingModal(true)}
                        className="bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow"
                        title="View All Pending Questions"
                      >
                        🔍
                      </button>
                    </div>
                  </div>

                  {/* PART 4: REAL-TIME ARENA & MEDIA HUB */}
                  <div className="bg-[#121212] border-2 border-blue-500/40 hover:border-blue-500/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#222] pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-base">
                            <Gamepad2 size={16} />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                              <span>Part 4: Real-time Arena & Media</span>
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                                2-PLAYER & CINEMA
                              </span>
                            </h3>
                            <p className="text-[10px] text-gray-400">Ludo Royale Clash board arena & Codex synchronized cinema</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-gray-400">Ludo Score</div>
                          <div className="text-xs sm:text-sm font-black text-amber-400 font-mono">Darsh: {scores.H} vs Dora: {scores.A}</div>
                        </div>
                      </div>

                      {/* ARENA & CINEMA SPLIT CARDS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* LUDO ROYALE CARD */}
                        <div className="bg-[#181818] border border-[#2a2a2a] p-3 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <span>🎲</span>
                              <span>Ludo Royale 2P</span>
                            </span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            Multiplayer board game with animated 3D dice and live token tracking.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveGame(ARCADE_GAMES[0])}
                            className="w-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-xs font-bold py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 shadow mt-1"
                          >
                            Launch Ludo Arena
                          </button>
                        </div>

                        {/* CODEX CINEMA CARD */}
                        <div className="bg-[#181818] border border-[#2a2a2a] p-3 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                              <Tv size={13} />
                              <span>Codex Cinema</span>
                            </span>
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                              WHITE DOT
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            Synchronized player with delay gap calculator & Togepi live chat.
                          </p>
                          <button
                            type="button"
                            onClick={() => setViewMode('codex')}
                            className="w-full bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-200 text-xs font-bold py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 shadow mt-1"
                          >
                            Open Cinema
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* QUICK MEDIA CONTROLS */}
                    <div className="flex gap-1.5 pt-2 border-t border-[#222]">
                      <button
                        type="button"
                        onClick={handleAdminSendRequest}
                        className="flex-1 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1"
                      >
                        <span>🎯 Invite Dora to Ludo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleUniversalSyncRealign}
                        className="flex-1 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-gray-200 text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1"
                        title="Calculate Frame Sync Gap"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>Sync White Dot</span>
                      </button>
                    </div>
                  </div>

                  {/* PART 5: DAILY PROJECTS & HOURLY TASK MANAGER (FOR DARSH TO CHECK & APPROVE) */}
                  <div id="admin-part-5-daily-tasks" className="bg-[#121212] border-2 border-emerald-500/40 hover:border-emerald-500/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-3 lg:col-span-2 text-left font-sans scroll-mt-4">
                    {/* PART 5 HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                          <Briefcase size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                            <span>Part 5: Daily Projects & Routine Tasks</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                              HOURLY ENGINE
                            </span>
                          </h3>
                          <p className="text-[10px] text-gray-400">Review Dora's submissions, download high-res proof & customize routine slots</p>
                        </div>
                      </div>

                      {/* TAB SWITCHER & DATE PICKER */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex bg-[#181818] p-0.5 rounded-xl border border-[#2a2a2a] text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setDailyAdminTab('review')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                              dailyAdminTab === 'review' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <span>Review Tasks</span>
                            {dailySubmissions.filter(s => s.status === 'PENDING').length > 0 && (
                              <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                                {dailySubmissions.filter(s => s.status === 'PENDING').length}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDailyAdminTab('slots')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              dailyAdminTab === 'slots' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            ⚙️ Slot Manager
                          </button>
                        </div>

                        <input
                          type="date"
                          value={dailySelectedDate}
                          onChange={(e) => setDailySelectedDate(e.target.value)}
                          className="bg-[#181818] border border-[#333] text-white text-xs px-2 py-1 rounded-xl outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* REVIEW TAB */}
                    {dailyAdminTab === 'review' && (
                      <div className="space-y-3">
                        {/* SUMMARY CARDS */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-[#181818] border border-[#262626] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400">Total Slots</span>
                            <div className="text-sm font-bold text-white font-mono">{dailySlots.filter(s => s.isActive).length}</div>
                          </div>
                          <div className="bg-[#181818] border border-amber-500/30 p-2 rounded-xl">
                            <span className="text-[10px] text-amber-300">Pending Review</span>
                            <div className="text-sm font-bold text-amber-400 font-mono">
                              {dailySubmissions.filter(s => s.status === 'PENDING').length}
                            </div>
                          </div>
                          <div className="bg-[#181818] border border-emerald-500/30 p-2 rounded-xl">
                            <span className="text-[10px] text-emerald-300">Approved</span>
                            <div className="text-sm font-bold text-emerald-400 font-mono">
                              {dailySubmissions.filter(s => s.status === 'APPROVED').length}
                            </div>
                          </div>
                          <div className="bg-[#181818] border border-blue-500/30 p-2 rounded-xl">
                            <span className="text-[10px] text-blue-300">Points Awarded</span>
                            <div className="text-sm font-bold text-blue-400 font-mono">
                              ₹ {dailySubmissions.filter(s => s.status === 'APPROVED').reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* SUBMISSIONS LIST */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {dailySlots.filter(s => s.isActive).map((slot) => {
                            const sub = dailySubmissions.find(s => s.slotId === slot.id);
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
                                    No submission from Dora yet for this time slot.
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
                          {dailySlots.map((slot) => (
                            <div key={slot.id} className="bg-[#181818] border border-[#2a2a2a] p-3 rounded-2xl flex items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                    {slot.timeRange}
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
                  </div>

                </div>

              </section>
            )}

            {/* DORA'S DAILY PROJECTS & HOURLY REPORT VIEW */}
            {viewMode === 'daily_projects' && (
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 max-w-4xl w-full mx-auto space-y-4 scrollbar-none font-sans">
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
                      onClick={() => setDailySelectedDate(new Date().toISOString().split('T')[0])}
                      className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 px-2 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Today
                    </button>
                  </div>
                </div>

                {/* SUMMARY STATS BAR */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#141414] border border-[#262626] p-2.5 rounded-2xl">
                    <div className="text-[10px] text-gray-400">Total Routine Slots</div>
                    <div className="text-base font-bold text-white font-mono">{dailySlots.filter(s => s.isActive).length}</div>
                  </div>
                  <div className="bg-[#141414] border border-[#262626] p-2.5 rounded-2xl">
                    <div className="text-[10px] text-gray-400">Completed (Approved)</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {dailySubmissions.filter(s => s.status === 'APPROVED').length} ✓
                    </div>
                  </div>
                  <div className="bg-[#141414] border border-[#262626] p-2.5 rounded-2xl">
                    <div className="text-[10px] text-gray-400">Under Review</div>
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {dailySubmissions.filter(s => s.status === 'PENDING').length} ⏳
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
                      const sub = dailySubmissions.find(s => s.slotId === slot.id);
                      const isSelected = dailySelectedSlotId === slot.id;
                      const isApproved = sub && sub.status === 'APPROVED';
                      const isPending = sub && sub.status === 'PENDING';
                      const isRejected = sub && sub.status === 'REJECTED';

                      const timeParts = slot.timeRange.split('-').map(t => t.trim());
                      const topTime = timeParts[0] || slot.timeRange;
                      const botTime = timeParts[1] || '';

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setDailySelectedSlotId(slot.id)}
                          className={`min-w-[90px] sm:min-w-[105px] max-w-[115px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center select-none shrink-0 ${
                            isSelected 
                              ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-400 shadow-lg scale-105' 
                              : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800 shadow-sm'
                          }`}
                        >
                          {/* TIME HEADER */}
                          <div className="space-y-0.5">
                            <div className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {topTime}
                            </div>
                            {botTime && (
                              <div className={`text-[10px] font-medium ${isSelected ? 'text-blue-300' : 'text-gray-500'}`}>
                                {botTime}
                              </div>
                            )}
                          </div>

                          {/* STATUS BADGE */}
                          <div className="my-1.5 w-full">
                            {isApproved ? (
                              <div className="bg-emerald-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center justify-center gap-1 shadow-sm">
                                <span>✓</span>
                                <span>Done</span>
                              </div>
                            ) : isPending ? (
                              <div className="bg-amber-500 text-black text-[9px] font-bold py-0.5 px-1.5 rounded-full flex items-center justify-center gap-0.5 shadow-sm animate-pulse">
                                <span>⏳</span>
                                <span>Review</span>
                              </div>
                            ) : isRejected ? (
                              <div className="bg-rose-600 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-full flex items-center justify-center shadow-sm">
                                <span>Retake</span>
                              </div>
                            ) : slot.tag === 'Lunch' ? (
                              <div className="bg-amber-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center justify-center gap-1 shadow-sm">
                                <span>🍴</span>
                                <span>Lunch</span>
                              </div>
                            ) : slot.tag === 'Tea' ? (
                              <div className="bg-blue-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center justify-center gap-1 shadow-sm">
                                <span>☕</span>
                                <span>Tea</span>
                              </div>
                            ) : (
                              <div className={`text-[9px] py-0.5 px-1.5 rounded-full font-medium ${isSelected ? 'bg-blue-900/50 text-blue-200' : 'bg-gray-100 text-gray-600'}`}>
                                {slot.tag || 'Pending'}
                              </div>
                            )}
                          </div>

                          {/* EYE ICON VIEW BUTTON (EXACTLY AS IN SCREENSHOT) */}
                          {sub && sub.image ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDailyPreviewModalImg(sub.image);
                              }}
                              className="w-6 h-6 rounded-full border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 mt-0.5"
                              title="View Proof Photo"
                            >
                              <Eye size={12} />
                            </button>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-gray-300 text-gray-300 flex items-center justify-center mt-0.5">
                              <Eye size={12} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVE SLOT SUBMISSION / STATUS CARD */}
                {(() => {
                  const activeSlot = dailySlots.find(s => s.id === dailySelectedSlotId) || dailySlots[0];
                  if (!activeSlot) return null;
                  const activeSub = dailySubmissions.find(s => s.slotId === activeSlot.id);
                  const isApproved = activeSub && activeSub.status === 'APPROVED';
                  const isPending = activeSub && activeSub.status === 'PENDING';
                  const isRejected = activeSub && activeSub.status === 'REJECTED';

                  return (
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl space-y-4">
                      {/* SLOT HEADER */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#222] pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                              {activeSlot.timeRange}
                            </span>
                            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                              {activeSlot.tag}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                            {activeSlot.title}
                          </h3>
                        </div>

                        <div className="bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-right shrink-0">
                          <div className="text-[9px] text-gray-400">Reward</div>
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            +₹ {Number(activeSlot.rewardPoints || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* STATUS BANNER */}
                      {isApproved ? (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-300">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎉</span>
                            <div>
                              <div className="font-bold text-white">Task Approved by Darsh!</div>
                              <div className="text-[11px] text-emerald-300">
                                +₹ {activeSub.pointsAwarded || activeSlot.rewardPoints} Love Balance has been credited!
                              </div>
                            </div>
                          </div>
                          <div className="bg-emerald-600 text-white text-[10px] font-bold py-1 px-2.5 rounded-xl">
                            ✓ Done
                          </div>
                        </div>
                      ) : isPending ? (
                        <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-300 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-lg animate-spin" style={{ animationDuration: '3s' }}>⏳</span>
                            <div>
                              <div className="font-bold text-white">Under Review by Darsh</div>
                              <div className="text-[11px] text-amber-300">
                                Proof submitted. Status will change to green "Done" once Darsh approves!
                              </div>
                            </div>
                          </div>
                          <div className="bg-amber-500 text-black text-[10px] font-bold py-1 px-2 rounded-xl">
                            Pending Approval
                          </div>
                        </div>
                      ) : isRejected ? (
                        <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs text-rose-300">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <div>
                              <div className="font-bold text-white">Retake Requested</div>
                              <div className="text-[11px] text-rose-300">
                                {activeSub.adminFeedback || "Please retake with clear proof photo."}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* EXISTING SUBMISSION PREVIEW */}
                      {activeSub && (activeSub.image || activeSub.note) && (
                        <div className="bg-[#101010] border border-[#222] p-3 rounded-2xl space-y-2">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Your Submitted Proof:
                          </div>
                          {activeSub.note && (
                            <p className="text-xs text-gray-200 italic bg-[#181818] p-2 rounded-xl border border-[#242424]">
                              "{activeSub.note}"
                            </p>
                          )}
                          {activeSub.image && (
                            <div className="flex items-center gap-3">
                              <img
                                src={activeSub.image}
                                alt="Proof"
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-[#333] cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setDailyPreviewModalImg(activeSub.image)}
                              />
                              <div className="space-y-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setDailyPreviewModalImg(activeSub.image)}
                                  className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye size={13} />
                                  <span>View High-Res Photo</span>
                                </button>
                                <a
                                  href={activeSub.image}
                                  download={`proof_${activeSlot.id}.jpg`}
                                  className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Download size={13} />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUBMISSION FORM (EXCLUSIVELY FOR DORA - HIDDEN FROM DARSH) */}
                      {role !== 'parent' && (!activeSub || activeSub.status === 'REJECTED') && (
                        <div className="space-y-3 pt-1">
                          <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <span>Upload Proof for {activeSlot.title}:</span>
                          </div>

                          {/* SINGLE TEXT LINE INPUT + CAMERA PLUS BUTTON (EXACTLY AS ASKED) */}
                          <div className="flex items-center gap-2 bg-[#101010] border border-[#333] focus-within:border-blue-500 rounded-2xl px-3 py-2 transition-all shadow-inner">
                            <input
                              type="text"
                              value={dailyNoteInput}
                              onChange={(e) => setDailyNoteInput(e.target.value)}
                              placeholder={`Enter note (e.g. 10 squats done / juice glass / 8k steps proof)...`}
                              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none min-w-0"
                            />

                            {/* HIDDEN FILE INPUT */}
                            <input
                              ref={dailyFileInputRef}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleDailyImageSelected}
                              className="hidden"
                            />

                            {/* PLUS CAMERA BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                if (dailyFileInputRef.current) dailyFileInputRef.current.click();
                              }}
                              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                dailyImageProof 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-[#222] hover:bg-blue-600 text-gray-300 hover:text-white'
                              }`}
                              title="Click to take camera photo or upload screenshot"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* IMAGE PREVIEW BOX IF SELECTED */}
                          {dailyImageProof && (
                            <div className="flex items-center gap-3 bg-[#181818] border border-emerald-500/30 p-2.5 rounded-2xl animate-in zoom-in-95">
                              <img
                                src={dailyImageProof}
                                alt="Selected Proof"
                                className="w-16 h-16 object-cover rounded-xl border border-[#333]"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-emerald-400">Photo Proof Ready</p>
                                <p className="text-[10px] text-gray-400">Click submit to send to Darsh</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDailyImageProof('')}
                                className="text-gray-400 hover:text-rose-400 p-1 rounded cursor-pointer"
                                title="Remove photo"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}

                          {/* SUBMIT BUTTON */}
                          <button
                            type="button"
                            onClick={handleDailyTaskSubmit}
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Camera size={15} />
                            <span>Submit Task Proof for Darsh's Review</span>
                          </button>
                        </div>
                      )}

                      {/* DARSH ADMIN CALLOUT IF ACCESSED AS PARENT */}
                      {role === 'parent' && (
                        <div className="bg-gradient-to-r from-amber-950/40 via-[#1c1813] to-amber-950/40 border border-amber-500/40 p-4 rounded-2xl text-center space-y-2 animate-in fade-in">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center mx-auto text-base">
                            👑
                          </div>
                          <h4 className="text-sm font-bold text-white">Admin Checking Mode (Darsh)</h4>
                          <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                            Routine tasks are for Dora to upload. Check proofs, view full-resolution photos, and approve awards inside the Admin Dashboard.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setViewMode('admin_dashboard');
                              setDailyAdminTab('review');
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow transition-all active:scale-95 inline-flex items-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>Open Admin Dashboard Review</span>
                          </button>
                        </div>
                      )}

                      {/* CHATGPT DAILY HABIT COACH WIDGET */}
                      <div className="bg-[#101010] border border-[#222] rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                            <Sparkles size={13} />
                            <span>ChatGPT Daily Routine Assistant</span>
                          </span>
                          {dailyAILoading && <Loader2 size={12} className="animate-spin text-amber-400" />}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleAskAICoach('10 Squats & Workout Routine')}
                            className="text-[10px] bg-[#1c1c1c] hover:bg-[#282828] text-gray-300 px-2 py-1 rounded-lg border border-[#333] cursor-pointer"
                          >
                            💪 Squats Form
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAskAICoach('Healthy Morning Detox Juice')}
                            className="text-[10px] bg-[#1c1c1c] hover:bg-[#282828] text-gray-300 px-2 py-1 rounded-lg border border-[#333] cursor-pointer"
                          >
                            🥤 Detox Juice
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAskAICoach('Heavy Breakfast for Weight Gain')}
                            className="text-[10px] bg-[#1c1c1c] hover:bg-[#282828] text-gray-300 px-2 py-1 rounded-lg border border-[#333] cursor-pointer"
                          >
                            🍳 Weight Gain Meal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAskAICoach('8,000 Steps Daily Motivation')}
                            className="text-[10px] bg-[#1c1c1c] hover:bg-[#282828] text-gray-300 px-2 py-1 rounded-lg border border-[#333] cursor-pointer"
                          >
                            🚶 8K Steps
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAskAICoach('Night Glowing Skin Care')}
                            className="text-[10px] bg-[#1c1c1c] hover:bg-[#282828] text-gray-300 px-2 py-1 rounded-lg border border-[#333] cursor-pointer"
                          >
                            ✨ Skincare Tip
                          </button>
                        </div>

                        {dailyAITip && (
                          <div className="bg-[#181818] border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-200 italic animate-in fade-in">
                            "{dailyAITip}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
                    className="bg-[#1c3a6b] hover:bg-[#254d8f] text-white w-8 h-8 rounded-full cursor-pointer flex items-center justify-center shadow shrink-0 active:scale-95 transition-transform"
                  >
                    {input.trim() ? <ArrowUp size={16} /> : <AudioLines size={16} />}
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

        {/* --- LOVE BALANCE MASTER MODAL (PASSBOOK, WISH STORE, REDEEMED WISHES, RULES) --- */}
        {showLoveBalanceModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#121212] border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-left">
              
              {/* MODAL HEADER */}
              <div className="p-4 sm:p-5 border-b border-[#222] flex items-center justify-between bg-[#161616]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
                    ₹
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>Love Balance</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                        ₹ {displayedLoveBalance.toFixed(2)}
                      </span>
                      {isParentAdmin && (
                        <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (
                          lbViewerTarget === 'admin' 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                            : 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                        )}>
                          {lbViewerTarget === 'admin' ? "Darsh's Ledger" : "Dora's Ledger"}
                        </span>
                      )}
                    </h2>
                    
                  </div>
                </div>

                {/* TAB BUTTONS & CLOSE */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex bg-[#1f1f1f] border border-[#2e2e2e] p-1 rounded-xl text-xs font-semibold gap-1">
                    <button
                      onClick={() => setLoveModalTab('passbook')}
                      className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer ' + (
                        loveModalTab === 'passbook' ? 'bg-blue-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      Passbook Ledger
                    </button>
                    <button
                      onClick={() => setLoveModalTab('redeem')}
                      className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer ' + (
                        loveModalTab === 'redeem' ? 'bg-pink-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      Wish Store
                    </button>
                    <button
                      onClick={() => setLoveModalTab('claimed')}
                      className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ' + (
                        loveModalTab === 'claimed' ? 'bg-amber-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      <span>Redeemed Wishes</span>
                      <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded font-mono font-bold">
                        {redeemedWishesList.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setLoveModalTab('rules')}
                      className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer ' + (
                        loveModalTab === 'rules' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      Love Policy
                    </button>
                  </div>

                  <button
                    onClick={() => setShowLoveBalanceModal(false)}
                    className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#222] transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* MOBILE TAB BAR */}
              <div className="sm:hidden grid grid-cols-4 bg-[#161616] border-b border-[#222] p-1.5 text-[11px] font-semibold gap-1 text-center">
                <button
                  onClick={() => setLoveModalTab('passbook')}
                  className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
                    loveModalTab === 'passbook' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400'
                  )}
                >
                  Passbook
                </button>
                <button
                  onClick={() => setLoveModalTab('redeem')}
                  className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
                    loveModalTab === 'redeem' ? 'bg-pink-600 text-white font-bold' : 'text-gray-400'
                  )}
                >
                  Wishes
                </button>
                <button
                  onClick={() => setLoveModalTab('claimed')}
                  className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
                    loveModalTab === 'claimed' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400'
                  )}
                >
                  Redeemed ({redeemedWishesList.length})
                </button>
                <button
                  onClick={() => setLoveModalTab('rules')}
                  className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
                    loveModalTab === 'rules' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400'
                  )}
                >
                  Policy
                </button>
              </div>

              {/* MODAL BODY (SCROLLABLE) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
                
                {/* TAB 1: PASSBOOK LEDGER */}
                {loveModalTab === 'passbook' && (
                  <div className="space-y-4">
                    
                    {/* DARSH ADMIN SELECTOR: SWITCH BETWEEN DORA AND DARSH PASSBOOK (NEVER SHOWN TO DORA) */}
                    {isParentAdmin && (
                      <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#2d2d2d] text-xs font-bold gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveLbTarget('user')}
                          className={'flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ' + (
                            activeLbTarget === 'user' 
                              ? 'bg-pink-600 text-white shadow font-black' 
                              : 'text-gray-400 hover:text-white'
                          )}
                        >
                          <span>💕 Dora</span>
                          <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono">₹ {Number(loveBalance || 0).toFixed(2)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveLbTarget('admin')}
                          className={'flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ' + (
                            activeLbTarget === 'admin' 
                              ? 'bg-blue-600 text-white shadow font-black' 
                              : 'text-gray-400 hover:text-white'
                          )}
                        >
                          <span>👑 Darsh</span>
                          <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono">₹ {Number(adminLoveBalance || 0).toFixed(2)}</span>
                        </button>
                      </div>
                    )}

                    {/* 4 TOP SUMMARY CARDS (AVAILABLE BALANCE, TOTAL CUT POINTS, TOTAL LOVE PAYOUTS, REDEEMED WISHES) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-sans">
                      
                      {/* CARD 1: AVAILABLE BALANCE (BLUE) */}
                      <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs font-bold tracking-wide">Available Balance</span>
                          <span className="text-sm">🤝</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono">
                          ₹ {displayedLoveBalance.toFixed(2)}
                        </div>
                      </div>

                      {/* CARD 2: TOTAL CUT POINTS (RED) */}
                      <div className="bg-rose-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs font-bold tracking-wide">Total Cut Points</span>
                          <span className="text-sm">⚖️</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono">
                          -₹ {cutPointsTotal.toFixed(2)}
                        </div>
                      </div>

                      {/* CARD 3: TOTAL LOVE PAYOUTS (GREEN) */}
                      <div className="bg-emerald-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs font-bold tracking-wide">Total Love Payouts</span>
                          <span className="text-sm">💰</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono">
                          ₹ {payoutsTotal.toFixed(2)}
                        </div>
                      </div>

                      {/* CARD 4: REDEEMED WISHES (AMBER) */}
                      <div className="bg-amber-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs font-bold tracking-wide">Redeemed Wishes</span>
                          <span className="text-sm">🎁</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono">
                          ₹ {redeemedWishesTotal.toFixed(2)}
                        </div>
                      </div>

                    </div>

                    {/* PENDING APPROVAL REQUESTS BANNER */}
                    {(() => {
                      const myRole = role === 'parent' ? 'admin' : 'user';
                      const incomingPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole !== myRole);
                      const myPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole === myRole);
                      if (incomingPendingReqs.length === 0 && myPendingReqs.length === 0) return null;
                      return (
                        <div className="bg-[#181818] border border-amber-500/30 rounded-2xl p-3 sm:p-4 space-y-2">
                          {incomingPendingReqs.map(req => (
                            <div key={req.id} className="bg-pink-950/50 border border-pink-500/60 p-3 rounded-xl flex items-center justify-between gap-2 shadow-lg animate-pulse">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">{req.wishIcon || '🎁'}</span>
                                <div>
                                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{req.requesterName} requested: {req.wishTitle}</span>
                                    <span className="text-[10px] text-amber-300 font-mono font-bold bg-black/40 px-1.5 py-0.2 rounded">₹ {req.wishCost.toFixed(2)}</span>
                                  </h5>
                                  <p className="text-[10px] text-pink-300">Awaiting your approval to grant wish & deduct points</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleApproveWishRequest(req)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow active:scale-95"
                                >
                                  Approve & Grant 💝
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineWishRequest(req)}
                                  className="bg-[#242424] hover:bg-[#333] text-gray-300 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer border border-[#3a3a3a]"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}

                          {myPendingReqs.map(req => (
                            <div key={req.id} className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{req.wishIcon || '🎁'}</span>
                                <span className="text-xs font-bold text-amber-200">
                                  Requested: {req.wishTitle} (₹ {req.wishCost.toFixed(2)})
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-900/60 border border-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                                ⏳ Awaiting {req.targetName}\'s Approval
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}


                    {/* ACTION ROW: ONLY REDEEM WISH BUTTON */}
                    <div className="flex items-center justify-between bg-[#181818] border border-[#282828] p-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs sm:text-sm font-bold text-white">Love Balance Passbook</span>
                        <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">({visibleLoveLedger.length} Records)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {role === 'parent' && (
                          <button
                            type="button"
                            onClick={() => handleOpenClearModal(activeLbTarget)}
                            className="bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5"
                            title="Clear passbook ledger history"
                          >
                            <Trash2 size={13} />
                            <span>Clear All</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setLoveModalTab('claimed')}
                          className="bg-[#242424] hover:bg-[#2e2e2e] text-amber-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5 border border-amber-500/30"
                        >
                          <span>🎁 Redeemed ({redeemedWishesList.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoveModalTab('redeem')}
                          className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Gift size={14} />
                          <span>Redeem Wish</span>
                        </button>
                      </div>
                    </div>

                    {/* PASSBOOK DATA TABLE (STRICTLY ISOLATED: DORA NEVER SEES DARSH'S RECORDS) */}
                    <div className="bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans min-w-[650px]">
                          <thead className="bg-[#121212] text-gray-400 uppercase text-[10px] font-mono border-b border-[#262626]">
                            <tr>
                              <th className="py-2.5 px-3">SL</th>
                              <th className="py-2.5 px-3">Description</th>
                              <th className="py-2.5 px-3">Earned At</th>
                              <th className="py-2.5 px-3">Expire Date</th>
                              <th className="py-2.5 px-3">Points</th>
                              <th className="py-2.5 px-3">Remarks</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#242424] text-gray-300">
                            {visibleLoveLedger
                              .filter(e => {
                                if (loveSourceFilter !== 'All' && e.type !== loveSourceFilter) return false;
                                if (loveStatusFilter !== 'All' && e.status !== loveStatusFilter) return false;
                                return true;
                              })
                              .map((row, idx) => (
                                <tr key={row.id || idx} className="hover:bg-[#202020] transition-colors">
                                  <td className="py-2.5 px-3 font-mono text-gray-400">{row.sl || idx + 1}</td>
                                  <td className="py-2.5 px-3 font-bold text-white">
                                    {!isParentAdmin ? row.description.replace(/^\[Dora\]\s*/i, '') : row.description}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">{row.earnedAt}</td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">{row.expireDate || '—'}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold">
                                    <span className={'px-2 py-0.5 rounded-full text-[11px] ' + (
                                      row.points > 0 
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                        : (row.status === 'Redeemed'
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')
                                    )}>
                                      {row.points > 0 ? '+' + row.points.toFixed(2) : row.points.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-400 text-[11px] max-w-[200px] truncate" title={row.remarks}>
                                    {row.remarks || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                                      row.status === 'Confirmed' 
                                        ? 'bg-emerald-600 text-white' 
                                        : (row.status === 'Redeemed' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white')
                                    )}>
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: REDEEM WISH STORE */}
                {loveModalTab === 'redeem' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-pink-950/40 border border-pink-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                          <span>Romantic Wish Store</span>
                          <span className="text-xs bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full">INSTANT CLAIM</span>
                        </h3>
                        <p className="text-xs text-gray-300">Exchange your earned Love Balance for sweet promises and real dates!</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-gray-400">Your Wallet</div>
                        <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">₹ {displayedLoveBalance.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {ROMANTIC_WISH_STORE.map((wish) => {
                        const canAfford = displayedLoveBalance >= wish.cost;
                        return (
                          <div key={wish.id} className="bg-[#181818] border border-[#2a2a2a] hover:border-pink-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow transition-colors">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl">{wish.icon}</span>
                                <span className="text-sm font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-xl">
                                  ₹ {wish.cost.toFixed(2)}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white">{wish.title}</h4>
                              <p className="text-xs text-gray-400 leading-relaxed">{wish.description}</p>
                            </div>

                            {(() => {
                              const requesterRole = isParentAdmin ? (activeLbTarget === 'admin' ? 'admin' : 'user') : 'user';
                              const isPending = wishRequests.some(r => r.wishId === wish.id && r.status === 'PENDING' && r.requesterRole === requesterRole);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleInitiateWishRequest(wish)}
                                  className={'w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow active:scale-95 ' + (
                                    isPending
                                      ? 'bg-amber-600 text-white animate-pulse border border-amber-400'
                                      : (canAfford 
                                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white' 
                                          : 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-[#333]')
                                  )}
                                >
                                  {isPending 
                                    ? '⏳ Awaiting Partner Approval' 
                                    : (canAfford ? ('Request Wish for ₹ ' + wish.cost.toFixed(2) + ' 💝') : ('Need ₹ ' + (wish.cost - displayedLoveBalance).toFixed(2) + ' More'))}
                                </button>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: REDEEMED WISHES VAULT & TIMELINE */}
                {loveModalTab === 'claimed' && (
                  <div className="space-y-4">
                    {/* INCOMING PENDING REQUESTS IN TAB 3 */}
                    {(() => {
                      const myRole = role === 'parent' ? 'admin' : 'user';
                      const incomingPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole !== myRole);
                      const myPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole === myRole);
                      if (incomingPendingReqs.length === 0 && myPendingReqs.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          {incomingPendingReqs.map(req => (
                            <div key={req.id} className="bg-gradient-to-r from-pink-950/60 to-purple-950/60 border-2 border-pink-500/70 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl p-2 bg-black/40 rounded-xl">{req.wishIcon || '🎁'}</span>
                                <div className="text-left space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">{req.requesterName} wants: {req.wishTitle}</h4>
                                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.2 rounded-lg">₹ {req.wishCost.toFixed(2)}</span>
                                  </div>
                                  <p className="text-xs text-gray-300">{req.wishDesc}</p>
                                  <p className="text-[10px] text-gray-500 font-mono">Requested: {req.requestedAt}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => handleApproveWishRequest(req)}
                                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all"
                                >
                                  Approve & Grant 💝
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineWishRequest(req)}
                                  className="bg-[#242424] hover:bg-[#333] text-gray-300 text-xs px-3 py-2 rounded-xl cursor-pointer border border-[#3a3a3a]"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}

                          {myPendingReqs.map(req => (
                            <div key={req.id} className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">{req.wishIcon || '🎁'}</span>
                                <div className="text-left">
                                  <h5 className="text-xs font-bold text-white">Your Request: {req.wishTitle}</h5>
                                  <span className="text-[10px] text-gray-400 font-mono">₹ {req.wishCost.toFixed(2)} • {req.requestedAt}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-600/60 px-3 py-1 rounded-full animate-pulse">
                                ⏳ Waiting for {req.targetName}\'s Approval
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <div className="bg-gradient-to-r from-amber-950/40 via-orange-950/40 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                          <span>Redeemed Wishes & Promises</span>
                          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                            {redeemedWishesList.length} TOTAL
                          </span>
                        </h3>
                        <p className="text-xs text-gray-300">Track and fulfill all romantic wishes redeemed with Love Balance.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-gray-400">Total Spent</div>
                        <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">₹ {redeemedWishesTotal.toFixed(2)}</div>
                      </div>
                    </div>

                    {redeemedWishesList.length === 0 ? (
                      <div className="bg-[#181818] border border-[#282828] rounded-2xl p-8 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto">
                          🎁
                        </div>
                        <h4 className="text-base font-bold text-white">No Wishes Redeemed Yet</h4>
                        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                          You haven't claimed any romantic wishes yet. Save up your Love Balance and treat yourself in the Wish Store!
                        </p>
                        <button
                          type="button"
                          onClick={() => setLoveModalTab('redeem')}
                          className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow active:scale-95 transition-all inline-flex items-center gap-2"
                        >
                          <Gift size={15} />
                          <span>Go to Wish Store</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {redeemedWishesList.map((rw, idx) => (
                          <div key={rw.id || idx} className="bg-[#181818] border border-[#2a2a2a] hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl p-2 bg-[#222] rounded-2xl border border-[#333] shrink-0">{rw.wishIcon || '🎁'}</span>
                                <div className="space-y-0.5">
                                  <h4 className="text-sm font-black text-white">
                                    {rw.wishTitle || rw.description.replace(/^\[(Dora|Darsh)\]\s*Redeemed:\s*/i, '').replace(/^Redeemed:\s*/i, '')}
                                  </h4>
                                  <div className="text-[11px] text-gray-400 font-mono">Redeemed: {rw.earnedAt}</div>
                                  <div className="text-[10px] text-gray-500">Remarks: {rw.remarks}</div>
                                </div>
                              </div>
                              <span className="text-sm font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl shrink-0">
                                ₹ {Math.abs(rw.points).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#252525]">
                              <span className={'text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ' + (
                                rw.fulfillmentStatus === 'Fulfilled'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              )}>
                                {rw.fulfillmentStatus === 'Fulfilled' ? '✅ Granted & Fulfilled' : '⏳ Date / Reward Pending'}
                              </span>

                              {isParentAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleWishFulfillment(rw.id)}
                                  className="text-xs font-bold bg-[#262626] hover:bg-[#333] text-white px-3 py-1.5 rounded-xl border border-[#3d3d3d] cursor-pointer transition-all active:scale-95"
                                  title="Toggle fulfillment status"
                                >
                                  {rw.fulfillmentStatus === 'Fulfilled' ? 'Mark Pending ⏳' : 'Mark Fulfilled ✅'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: RULES ENGINE GUIDE (ALL IN ENGLISH) */}
                {loveModalTab === 'rules' && (
                  <div className="space-y-5">
                    {/* INTRO HERO */}
                    <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-blue-950/40 border border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <span>Love Balance Policy</span>
                      </h3>

                    </div>

                    {/* REWARD EARNING RULES */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                        <span>✨ Love Balance Earning Rules</span>
                      </h4>
                      <div className="bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-sans min-w-[550px]">
                            <thead className="bg-[#121212] text-gray-400 uppercase text-[10px] font-mono border-b border-[#262626]">
                              <tr>
                                <th className="py-2.5 px-3 w-12">S.NO</th>
                                <th className="py-2.5 px-3">GESTURE / TASK TYPE</th>
                                <th className="py-2.5 px-3">CRITERIA</th>
                                <th className="py-2.5 px-3 text-right">REWARD POINTS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#242424] text-gray-300">
                              {LOVE_EARNING_RULES.map((rule) => (
                                <tr key={rule.sno} className="hover:bg-[#202020] transition-colors">
                                  <td className="py-2.5 px-3 font-mono text-gray-400">{rule.sno}</td>
                                  <td className="py-2.5 px-3 font-bold text-white">{rule.task}</td>
                                  <td className="py-2.5 px-3 text-gray-400 text-xs">{rule.criteria}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className="bg-blue-600 text-white font-mono font-bold px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                                      {rule.reward}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* DEDUCTION RULES */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
                        <span>💔 Love Balance Deductions</span>
                      </h4>
                      <div className="bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-sans min-w-[550px]">
                            <thead className="bg-[#121212] text-gray-400 uppercase text-[10px] font-mono border-b border-[#262626]">
                              <tr>
                                <th className="py-2.5 px-3 w-12">S.NO</th>
                                <th className="py-2.5 px-3">DEDUCTION TYPE</th>
                                <th className="py-2.5 px-3">CRITERIA</th>
                                <th className="py-2.5 px-3 text-right">DEDUCTION POINTS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#242424] text-gray-300">
                              {LOVE_DEDUCTION_RULES.map((rule) => (
                                <tr key={rule.sno} className="hover:bg-[#202020] transition-colors">
                                  <td className="py-2.5 px-3 font-mono text-gray-400">{rule.sno}</td>
                                  <td className="py-2.5 px-3 font-bold text-rose-200">{rule.infraction}</td>
                                  <td className="py-2.5 px-3 text-gray-400 text-xs">{rule.criteria}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className="bg-rose-600 text-white font-mono font-bold px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                                      {rule.penalty}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* INCOMING WISH REQUEST APPROVAL POPUP */}
        {activeWishApprovalModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-[#141414] border-2 border-pink-500/70 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-4xl flex items-center justify-center mx-auto shadow-inner">
                {activeWishApprovalModal.wishIcon || '🎁'}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-pink-400 bg-pink-950/60 border border-pink-700/60 px-3 py-1 rounded-full">
                  Incoming Wish Request 💖
                </span>
                <h3 className="text-lg font-black text-white pt-1">
                  {activeWishApprovalModal.requesterName} wants to redeem:
                </h3>
                <h4 className="text-base font-bold text-amber-300">
                  {activeWishApprovalModal.wishTitle}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  {activeWishApprovalModal.wishDesc}
                </p>
                <div className="pt-2">
                  <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-xl">
                    Cost: ₹ {Number(activeWishApprovalModal.wishCost || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                Approving will deduct ₹ {Number(activeWishApprovalModal.wishCost || 0).toFixed(2)} from {activeWishApprovalModal.requesterName}'s Love Balance and grant the wish!
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleApproveWishRequest(activeWishApprovalModal)}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <Check size={16} />
                  <span>Approve & Grant 💝</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclineWishRequest(activeWishApprovalModal)}
                  className="bg-[#222] hover:bg-[#2c2c2c] text-gray-400 hover:text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer border border-[#333] transition-all text-xs"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

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
    
        {/* IN-APP CONFIRMATION POPUP FOR CLEAR ALL (MATCHING APP COLOR THEME) */}
        {showClearConfirmModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#141414] border-2 border-rose-500/60 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left font-sans animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Clear Love Balance & Passbook</h3>
                    <p className="text-[10px] text-gray-400 font-mono">Delete passbook & reset points</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowClearConfirmModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#222] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* TARGET SELECTOR PILLS */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Select Target to Clear:</p>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0d0d0d] rounded-xl border border-[#222]">
                  <button
                    type="button"
                    onClick={() => setClearModalTarget('user')}
                    className={'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                      clearModalTarget === 'user' 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    Dora (User)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearModalTarget('admin')}
                    className={'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                      clearModalTarget === 'admin' 
                        ? 'bg-amber-600 text-black shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    Darsh (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearModalTarget('both')}
                    className={'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                      clearModalTarget === 'both' 
                        ? 'bg-red-700 text-white shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    Both (All)
                  </button>
                </div>
              </div>

              {/* SUMMARY DETAIL CARD */}
              <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <p className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  <span>Target: <strong className="text-white underline">{clearModalTarget === 'user' ? 'Dora' : (clearModalTarget === 'admin' ? 'Darsh' : 'Both Dora & Darsh')}</strong></span>
                </p>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {clearModalTarget === 'user' 
                    ? "Dora's Love Balance will be reset to ₹0.00 and all her passbook entries will be deleted. Darsh's points will remain intact."
                    : (clearModalTarget === 'admin'
                      ? "Darsh's Love Balance will be reset to ₹0.00 and all his passbook entries will be deleted. Dora's points will remain intact."
                      : "Both Dora and Darsh will have their Love Balance reset to ₹0.00 and the entire passbook history will be cleared.")
                  }
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(false)}
                  className="bg-[#222] hover:bg-[#2c2c2c] text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearLedger}
                  className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 hover:from-rose-600 hover:to-red-500 text-white text-xs font-black py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-rose-950/60 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Yes, Clear Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL IMAGE PROOF PREVIEW & DOWNLOAD MODAL */}
        {dailyPreviewModalImg && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 font-sans"
            onClick={() => setDailyPreviewModalImg(null)}
          >
            <div 
              className="relative max-w-2xl w-full bg-[#141414] border border-[#333] rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>📸</span>
                    <span>Task Proof Photo</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={dailyPreviewModalImg}
                    download={`task_proof_${Date.now()}.jpg`}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
                    title="Download Photo"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDailyPreviewModalImg(null)}
                    className="text-gray-400 hover:text-white p-1 rounded-xl cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center py-4">
                <img 
                  src={dailyPreviewModalImg} 
                  alt="Proof" 
                  className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-lg"
                />
              </div>
            </div>
          </div>
        )}

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
        {showAddSlotModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 font-sans"
            onClick={() => setShowAddSlotModal(false)}
          >
            <div 
              className="bg-[#171717] border border-[#2e2e2e] rounded-3xl p-4 sm:p-5 w-full max-w-md shadow-2xl space-y-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-400" />
                  <span>{editingSlotId ? 'Edit Routine Slot' : 'Add New Routine Slot'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-xl cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Slot Title:</label>
                  <input
                    type="text"
                    value={slotFormTitle}
                    onChange={(e) => setSlotFormTitle(e.target.value)}
                    placeholder="e.g. Morning Workout (10 Squats)"
                    className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Time Range (e.g. 08:00 - 09:00):</label>
                  <input
                    type="text"
                    value={slotFormTimeRange}
                    onChange={(e) => setSlotFormTimeRange(e.target.value)}
                    placeholder="e.g. 08:00 - 09:00"
                    className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Category / Tag:</label>
                    <select
                      value={slotFormTag}
                      onChange={(e) => setSlotFormTag(e.target.value)}
                      className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500"
                    >
                      <option value="Workout">Workout</option>
                      <option value="Juice">Juice</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Water">Water</option>
                      <option value="Tea">Tea</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Steps">Steps</option>
                      <option value="Skincare">Skincare</option>
                      <option value="Task">Task</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Reward Points (₹):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={slotFormPoints}
                      onChange={(e) => setSlotFormPoints(e.target.value)}
                      placeholder="2.0"
                      className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="bg-[#222] hover:bg-[#2c2c2c] text-gray-300 text-xs font-bold py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlotForm}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all"
                >
                  {editingSlotId ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
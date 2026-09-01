import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import { 
  SquarePen, Image, BookOpen, Clock, ToyBrick, FolderGit2, TerminalSquare, MoreHorizontal,
  Search, PanelLeft, ArrowUp, Plus, RefreshCw, Sparkles, Share,
  Bot, X, Download, AlertCircle, ShieldCheck, Trash2, Smile,
  Copy, ThumbsUp, ThumbsDown, RotateCw, Check, Edit3, Maximize2, Mic, AudioLines, ChevronDown,
  Code, Play, CornerUpLeft, Menu
} from 'lucide-react';

const SOCKET_URL = "https://secret-chat-backend-07d0.onrender.com";
const SECRET_KEY = "StealthMasterKey99";
const GLOBAL_ROOM = "stealth_master_room";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🙏", "👌", "💯", "🤫", "✨"];

const DEFAULT_RECENT_CHATS = [
  "GMB new ( R )",
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

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('stealth_role') || 'user');
  const [currentRoom, setCurrentRoom] = useState("GMB new ( R )");
  const [roomList, setRoomList] = useState(() => {
    const saved = localStorage.getItem('stealth_rooms');
    return saved ? JSON.parse(saved) : DEFAULT_RECENT_CHATS;
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
        text: "Invisalign aligners treatment is a modern orthodontic approach designed to gradually straighten teeth and improve dental alignment using a series of clear, removable aligners. It may be suitable for concerns such as crooked teeth, spacing, crowding, and certain bite irregularities, depending on the individual's orthodontic condition. The transparent design provides a discreet alternative to traditional braces while allowing aligners to be removed during eating, brushing, and flossing. At Smile Architect Orthodontic Centre & Dental Clinic, patients receive a detailed orthodontic assessment to evaluate tooth alignment, bite, jaw relationship, and overall oral health before treatment planning. A personalised Invisalign aligners treatment plan is prepared according to individual dental requirements, with regular follow-ups to monitor tooth movement and treatment progress. If you are searching for the best Invisalign Aligners Treatment in Patil Colony, Nashik, an experienced Orthodontist in Patil Colony, Nashik, or a trusted Dental Clinic in Patil Colony, Nashik, Smile Architect Orthodontic Centre & Dental Clinic provides personalised Invisalign aligners treatment focused on improving tooth alignment, bite function, and smile aesthetics.",
        time: "5:27 PM"
      }
    ];
  });

  const [stealthMessages, setStealthMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [isConnected, setIsConnected] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showMiniEmojiBar, setShowMiniEmojiBar] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const [isBotOpen, setIsBotOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [incomingAlert, setIncomingAlert] = useState(null);

  const socketRef = useRef(null);
  const stealthMessagesRef = useRef([]);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const escPressCount = useRef(0);
  const escTimer = useRef(null);

  useEffect(() => {
    stealthMessagesRef.current = stealthMessages;
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stealthMessages, conversations, viewMode]);

  useEffect(() => {
    localStorage.setItem('stealth_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('stealth_rooms', JSON.stringify(roomList));
  }, [roomList]);

  // Handle mobile screen resize auto-collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      const currentRole = localStorage.getItem('stealth_role') || 'user';
      socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: currentRole });
    });

    socketRef.current.on('disconnect', () => setIsConnected(false));

    socketRef.current.on('load_history', (history) => {
      const parsed = (history || []).map(m => ({
        ...m,
        text: decryptText(m.encryptedText),
        timeFormatted: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setStealthMessages(parsed);
    });

    socketRef.current.on('receive_stealth_msg', (data) => {
      const text = decryptText(data.encryptedText);
      const formatted = {
        ...data,
        text,
        timeFormatted: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setStealthMessages(prev => {
        if (prev.some(m => m._id === formatted._id)) return prev;
        return [...prev, formatted];
      });

      const myCurrentRole = localStorage.getItem('stealth_role') || 'user';
      if (data.senderRole !== myCurrentRole) {
        playReceiveSound();
      }
    });

    socketRef.current.on('update_msg_status', ({ messageId, flaggedPending }) => {
      setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, flaggedPending } : m));
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

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [playReceiveSound, playBubblePopSound]);

  // Double 'Esc' Panic Shortcut
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
    setReplyTarget({
      text: msg.text,
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
      const generatedTitle = userPrompt.length > 20 ? userPrompt.substring(0, 18) + '...' : userPrompt;
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
      try {
        const cleanQuery = encodeURIComponent(
          `System: You are ChatGPT. Provide comprehensive, accurate, factual, and well-explained information with depth.\nUser: ${userPrompt}`
        );
        const getRes = await fetch(`https://text.pollinations.ai/${cleanQuery}?model=mistral&seed=${Math.floor(Math.random() * 99999)}`);
        if (getRes.ok) {
          const rawText = await getRes.text();
          if (rawText && rawText.trim().length > 15 && !rawText.includes("402")) {
            reply = rawText.trim();
          }
        }
      } catch (e) {}
    }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;

    setShowMiniEmojiBar(false);
    const cleanCmd = val.toLowerCase();

    if (cleanCmd === '/shadow') {
      setRole('parent');
      localStorage.setItem('stealth_role', 'parent');
      setViewMode('stealth');
      if (socketRef.current) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'parent' });
      }
      setInput('');
      setReplyTarget(null);
      if (window.innerWidth <= 768) setSidebarOpen(false);
      return;
    }

    if (cleanCmd === '/dora') {
      setRole('user');
      localStorage.setItem('stealth_role', 'user');
      setViewMode('stealth');
      if (socketRef.current) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'user' });
      }
      setInput('');
      setReplyTarget(null);
      if (window.innerWidth <= 768) setSidebarOpen(false);
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
      if (replyTarget) {
        const shortReply = replyTarget.text.length > 20 ? replyTarget.text.substring(0, 18) + '...' : replyTarget.text;
        finalMessageText = `[⤴ ${replyTarget.senderRole}: "${shortReply}"] ${val}`;
      }

      const encrypted = encryptText(finalMessageText);
      if (socketRef.current) {
        socketRef.current.emit('send_stealth_msg', {
          room: GLOBAL_ROOM,
          role,
          encryptedText: encrypted
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
    if (window.innerWidth <= 768) setSidebarOpen(false);
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
        const splitText = doc.splitTextToSize(m.text || "", 175);
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
      particleCount: 40,
      spread: 60,
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

  const displayedStealthMessages = stealthMessages.slice(-30);
  const pendingMessages = stealthMessages.filter(m => m.flaggedPending);

  const alertText = incomingAlert?.text || '';
  const textLength = alertText.length;

  let bubbleDimensions = 'w-24 h-24';
  let bubbleFontSize = 'text-xs';

  if (textLength > 90) {
    bubbleDimensions = 'w-40 h-40 sm:w-44 sm:h-44';
    bubbleFontSize = 'text-[9px] leading-[13px]';
  } else if (textLength > 50) {
    bubbleDimensions = 'w-32 h-32 sm:w-36 sm:h-36';
    bubbleFontSize = 'text-[10px] leading-[14px]';
  } else if (textLength > 25) {
    bubbleDimensions = 'w-28 h-28 sm:w-32 sm:h-32';
    bubbleFontSize = 'text-[11px] leading-[15px]';
  }

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-[#000000] text-[#ececf1] font-sans antialiased select-none touch-manipulation">
      
      {/* Mobile Backdrop for Sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-sm transition-opacity duration-200"
        />
      )}

      {/* Sidebar (Responsive Drawer on Mobile, Seamless on Desktop) */}
      <aside 
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-20 bg-[#000000] flex flex-col border-r border-[#171717] overflow-hidden select-none shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72 md:w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 pt-1 shrink-0">
          <span className="font-semibold text-base tracking-tight text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block md:hidden"></span>
            ChatGPT
          </span>
          <div className="flex items-center gap-2 text-[#9b9b9b]">
            <Search size={17} className="cursor-pointer hover:text-white p-0.5" />
            <PanelLeft size={18} className="cursor-pointer hover:text-white p-0.5" onClick={() => setSidebarOpen(false)} />
          </div>
        </div>

        <div className="px-3 py-1.5 space-y-1 shrink-0 text-[13.5px]">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-between text-white hover:bg-[#1f1f1f] py-2 px-3 rounded-xl transition-colors cursor-pointer bg-[#141414]"
          >
            <span className="flex items-center gap-2.5 font-medium">
              <SquarePen size={16} /> New chat
            </span>
            {role === 'parent' && <ShieldCheck size={14} className="text-emerald-400" />}
          </button>

          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-3 rounded-lg cursor-pointer transition-colors">
            <Image size={15} className="text-[#9b9b9b]" /> Images
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-3 rounded-lg cursor-pointer transition-colors">
            <BookOpen size={15} className="text-[#9b9b9b]" /> Library
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-3 rounded-lg cursor-pointer transition-colors">
            <ToyBrick size={15} className="text-[#9b9b9b]" /> Plugins
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-3 rounded-lg cursor-pointer transition-colors">
            <TerminalSquare size={15} className="text-[#9b9b9b]" /> Codex
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5 border-t border-[#1a1a1a] mt-1 scrollbar-none text-[13px]">
          <div className="text-[11px] text-[#737373] px-3 py-1 font-semibold uppercase tracking-wider">Recents</div>
          {roomList.map((roomName, idx) => (
            <div 
              key={idx}
              onClick={() => {
                setCurrentRoom(roomName);
                setViewMode('real_gpt');
                setReplyTarget(null);
                if (window.innerWidth <= 768) setSidebarOpen(false);
              }}
              className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors group ${currentRoom === roomName ? 'bg-[#212121] text-white font-medium' : 'text-[#b4b4b4] hover:bg-[#171717] hover:text-white'}`}
            >
              <span className="truncate max-w-[200px]">{roomName}</span>
            </div>
          ))}
        </div>

        {/* Answer Pending Drawer */}
        {role === 'parent' && (
          <div className="p-2 border-t border-[#1e1e1e] flex items-center gap-1.5 shrink-0 bg-[#0a0a0a]">
            <button 
              onClick={() => setShowPendingModal(true)}
              className="flex-1 flex items-center justify-between text-xs text-amber-400 hover:bg-[#1a1a1a] p-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
            >
              <span className="flex items-center gap-2 font-medium"><AlertCircle size={15} /> Answer Pending</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${pendingMessages.length > 0 ? 'bg-amber-500 text-black animate-pulse' : 'bg-amber-500/20 text-amber-300'}`}>
                {pendingMessages.length}
              </span>
            </button>
            <button 
              onClick={downloadPendingPDF}
              title="Download Answer Pending Report"
              className="p-2.5 text-gray-400 hover:text-amber-400 hover:bg-[#1a1a1a] rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <Download size={15} />
            </button>
          </div>
        )}

        {/* Bottom Profile Card */}
        <div className="p-3 border-t border-[#171717] flex items-center justify-between text-xs bg-[#000000]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {role === 'parent' ? 'HS' : 'U'}
            </div>
            <div className="truncate">
              <p className="text-white text-xs font-semibold truncate">
                {role === 'parent' ? 'hetkumar satap...' : 'User'}
              </p>
              <p className="text-[10px] text-gray-400">Free</p>
            </div>
          </div>
          <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] text-white text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0">
            Upgrade
          </button>
        </div>
      </aside>

      {/* Main Screen */}
      <main className="flex-1 flex flex-col relative bg-[#000000] overflow-hidden w-full max-w-full">
        
        {/* Header (Clean & Touch-friendly) */}
        <header className="h-13 min-h-[52px] flex items-center justify-between px-3 sm:px-4 border-b border-[#141414] shrink-0 z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-1.5 rounded-lg text-[#9b9b9b] hover:text-white hover:bg-[#1f1f1f] cursor-pointer"
            >
              <PanelLeft size={19} />
            </button>
            <span className="text-xs font-medium text-white truncate max-w-[140px] sm:max-w-xs">{currentRoom}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#9b9b9b]">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} title={isConnected ? 'Server Online' : 'Connecting...'} />
            {role === 'parent' && <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">ADMIN</span>}
            <button className="hidden sm:flex items-center gap-1.5 text-white hover:text-gray-200 transition-colors cursor-pointer text-xs font-medium">
              <Sparkles size={14} className="text-blue-400" />
              <span>Upgrade</span>
            </button>
            <RefreshCw size={15} className="cursor-pointer hover:text-white p-0.5" onClick={() => window.location.reload()} />
          </div>
        </header>

        {/* VIEW 1: NORMAL CHATGPT CONVERSATION STREAM */}
        {viewMode === 'real_gpt' ? (
          <section className="flex-1 overflow-y-auto px-3 sm:px-6 py-2 max-w-3xl w-full mx-auto space-y-4 sm:space-y-6 scrollbar-none">
            {conversations.map((msg) => (
              <div key={msg.id} className="w-full">
                {msg.role === 'user' ? (
                  <div className="flex justify-end my-2">
                    <div className="bg-[#1c3a6b] hover:bg-[#1f4077] transition-colors text-white px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl max-w-[88%] sm:max-w-[80%] text-[13px] sm:text-[13.5px] leading-relaxed shadow-lg whitespace-pre-wrap break-words select-text">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="w-full my-3">
                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6 shadow-2xl relative space-y-3 font-sans select-text">
                      <div className="flex items-center justify-between border-b border-[#282828] pb-2 text-[#a3a3a3]">
                        <button className="flex items-center gap-1 bg-[#2a2a2a] hover:bg-[#383838] text-gray-300 text-[11px] px-2 py-0.5 rounded-md transition-colors cursor-pointer">
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                        <div className="flex items-center gap-2.5">
                          <button className="hover:text-white cursor-pointer" title="Copy"><Copy size={13} /></button>
                          <button className="hover:text-white cursor-pointer" title="Download"><Download size={13} /></button>
                        </div>
                      </div>

                      <div className="text-[#ececf1] text-[13px] sm:text-[13.5px] leading-[1.65] font-normal tracking-wide whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[#737373] px-2 pt-1.5 text-xs">
                      <button className="hover:text-white cursor-pointer"><Copy size={13} /></button>
                      <button className="hover:text-white cursor-pointer"><ThumbsUp size={13} /></button>
                      <button className="hover:text-white cursor-pointer"><ThumbsDown size={13} /></button>
                      <button className="hover:text-white cursor-pointer"><RotateCw size={13} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>ChatGPT is writing detailed response...</span>
              </div>
            )}

            <div className="flex justify-center items-center gap-1.5 text-[11px] text-[#737373] pt-2 pb-1">
              <span>Today 5:27 PM</span>
              <ChevronDown size={12} />
            </div>

            <div ref={messageEndRef} />
          </section>
        ) : (
          /* VIEW 2: STEALTH JSON SCHEMA VIEW (Mobile Fluid Responsive) */
          <section className="flex-1 overflow-y-auto px-2 sm:px-6 py-2 max-w-3xl w-full mx-auto flex flex-col justify-center my-auto scrollbar-none">
            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl font-mono text-[11.5px] sm:text-xs">
              <div className="bg-[#212121] px-3.5 py-2.5 flex items-center justify-between border-b border-[#2e2e2e] text-[#b4b4b4]">
                <div className="flex items-center gap-1.5">
                  <Code size={14} className="text-[#888]" />
                  <span className="font-medium text-[#dedede]">JSON Schema</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 bg-[#2c2c2c] hover:bg-[#383838] text-white px-2 py-0.5 rounded cursor-pointer transition-colors text-[10.5px]">
                    <Play size={10} fill="currentColor" />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 sm:p-5 text-[#d4d4d4] space-y-1.5 overflow-x-hidden leading-relaxed">
                <div><span className="text-[#c586c0]">import</span> <span className="text-[#9cdcfe]">random</span></div>
                <div>
                  <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">generate_random_data</span>(<span className="text-[#9cdcfe]">size</span>=<span className="text-[#b5cea8]">10</span>):
                </div>
                <div className="pl-3 sm:pl-4">
                  <span className="text-[#9cdcfe]">data</span> = []
                </div>
                <div className="pl-3 sm:pl-4">
                  <span className="text-[#c586c0]">for</span> <span className="text-[#9cdcfe]">_</span> <span className="text-[#c586c0]">in</span> <span className="text-[#dcdcaa]">range</span>(<span className="text-[#9cdcfe]">size</span>):
                </div>
                <div className="pl-6 sm:pl-8">
                  <span className="text-[#9cdcfe]">data</span>.<span className="text-[#dcdcaa]">append</span>(<span className="text-[#9cdcfe]">random</span>.<span className="text-[#dcdcaa]">randint</span>(<span className="text-[#b5cea8]">1</span>, <span className="text-[#b5cea8]">100</span>))
                </div>
                <div className="pl-3 sm:pl-4">
                  <span className="text-[#c586c0]">return</span> <span className="text-[#9cdcfe]">data</span>
                </div>

                {/* Secret Messages Stream (Fluid Auto-wrap for Mobile) */}
                <div className="border-y border-[#2a2a2a] py-2 my-2 bg-[#121212]/60 rounded-xl px-2.5">
                  <div className="text-[#6a9955] mb-1.5 flex items-center justify-between text-[10.5px] sm:text-xs">
                    <span>{`# Stream (ID: ${role === 'user' ? 'A' : 'H'})`}</span>
                    <span className="text-[9.5px] text-gray-500 font-sans">
                      {`(${displayedStealthMessages.length}) records`}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-56 sm:max-h-64 overflow-y-auto pr-1 scrollbar-none">
                    {displayedStealthMessages.length === 0 ? (
                      <div className="text-[#6a9955] pl-2">{`# Waiting for execution runtime data...`}</div>
                    ) : (
                      displayedStealthMessages.map((m, idx) => {
                        const displayName = m.senderRole === 'user' ? 'A' : 'H';
                        return (
                          <div key={idx} className="group flex items-start justify-between hover:bg-[#202020] px-1.5 py-1 rounded-lg transition-colors gap-1.5">
                            <div className="flex-1 break-words overflow-wrap-anywhere text-left leading-normal">
                              <span className="text-[#9cdcfe] shrink-0 font-bold">{displayName}</span> = <span className="text-[#ce9178] break-all">{`"${m.text}"`}</span> 
                              
                              <button 
                                type="button"
                                onClick={() => handleStartReply(m)}
                                title="Reply to this message"
                                className="inline-flex items-center text-gray-400 hover:text-emerald-400 active:scale-125 transition-transform px-1 ml-0.5 cursor-pointer font-bold text-[11px]"
                              >
                                ⤴
                              </button>
                              
                              <span className="text-[#6a9955] text-[9.5px] shrink-0 ml-0.5">{`[${m.timeFormatted}]`}</span>
                            </div>

                            {role === 'parent' && (
                              <button 
                                type="button"
                                onClick={(e) => togglePendingFlag(e, m)}
                                title={m.flaggedPending ? "Mark as Resolved" : "Add to Answer Pending"}
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all duration-150 active:scale-90 shrink-0 mt-0.5 ${
                                  m.flaggedPending 
                                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105' 
                                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
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
                <div><span className="text-[#dcdcaa]">print</span>(<span className="text-[#ce9178]">"Average:"</span>, <span className="text-[#dcdcaa]">sum</span>(<span className="text-[#9cdcfe]">numbers</span>) / <span className="text-[#dcdcaa]">len</span>(<span className="text-[#9cdcfe]">numbers</span>))</div>
              </div>
            </div>
          </section>
        )}

        {/* Bottom Input Capsule (Fully Responsive & Big Touch Target) */}
        <div className="px-3 sm:px-6 pb-3 pt-1 max-w-3xl w-full mx-auto shrink-0 relative" onMouseLeave={() => setShowMiniEmojiBar(false)}>
          
          {/* Active Reply Banner */}
          {replyTarget && (
            <div className="mb-1.5 bg-[#1a1a1a] border border-[#333] px-3 py-1.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-emerald-400 font-bold text-[11px]">⤴ {replyTarget.senderRole}:</span>
                <span className="text-gray-300 truncate max-w-[200px] sm:max-w-md italic text-[11px]">"{replyTarget.text}"</span>
              </div>
              <button 
                type="button" 
                onClick={() => setReplyTarget(null)}
                className="text-gray-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {showMiniEmojiBar && (
            <div className="absolute right-6 bottom-16 z-30 bg-[#1e1e1e]/95 backdrop-blur-md border border-[#333] px-2 py-1 rounded-full shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
              {QUICK_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-lg p-1 hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full relative">
            <div className="w-full bg-[#212121] rounded-full border border-[#2e2e2e] focus-within:border-[#444] px-3.5 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-2xl">
              
              <button type="button" className="text-[#9b9b9b] hover:text-white transition-colors cursor-pointer p-0.5 shrink-0">
                <Plus size={18} />
              </button>

              <input 
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  viewMode === 'stealth' 
                    ? (replyTarget ? `Reply to ${replyTarget.senderRole}...` : "Type schema entry... (/gpt to exit)") 
                    : "Ask anything"
                }
                className="flex-1 bg-transparent text-[13.5px] sm:text-[14px] text-white placeholder-[#8e8e8e] outline-none min-w-0"
              />

              <button 
                type="button"
                onClick={() => setShowMiniEmojiBar(!showMiniEmojiBar)}
                className={`p-1 rounded-full transition-colors cursor-pointer shrink-0 ${showMiniEmojiBar ? 'text-amber-400' : 'text-[#8e8e8e] hover:text-white'}`}
                title="Reactions"
              >
                <Smile size={18} />
              </button>

              <button 
                type="submit" 
                className="bg-[#1c3a6b] hover:bg-[#254d8f] text-white p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow shrink-0"
              >
                {input.trim() ? <ArrowUp size={15} /> : <AudioLines size={15} />}
              </button>
            </div>
          </form>
        </div>

        {/* Answer Pending Modal (Mobile-Optimized) */}
        {showPendingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#171717] border border-[#2e2e2e] rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                  <AlertCircle size={16} />
                  <span>Answer Pending ({pendingMessages.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={downloadPendingPDF}
                    title="Export to PDF"
                    className="text-gray-400 hover:text-amber-400 p-1 cursor-pointer transition-colors"
                  >
                    <Download size={15} />
                  </button>
                  <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-white cursor-pointer p-1">
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {pendingMessages.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-6">
                    No pending questions bookmarked.
                  </div>
                ) : (
                  pendingMessages.map((m, idx) => (
                    <div key={idx} className="bg-[#212121] border border-[#2d2d2d] p-2.5 rounded-xl flex items-start justify-between gap-2.5">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                          <span className="text-blue-400 font-bold">{m.senderRole === 'user' ? 'A' : 'H'}</span>
                          <span>•</span>
                          <span>{m.timeFormatted}</span>
                        </div>
                        <p className="text-gray-200 font-mono select-text line-clamp-3 break-words">{m.text}</p>
                      </div>
                      <button 
                        onClick={(e) => togglePendingFlag(e, m)}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[10px] px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Check size={11} /> Done
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
            className={`fixed bottom-20 right-4 sm:right-8 ${bubbleDimensions} rounded-full cursor-pointer z-50 flex items-center justify-center p-3 text-center transition-all duration-300 transform active:scale-95 animate-bounce shadow-2xl backdrop-blur-md overflow-hidden`}
            style={{
              background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0.25) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.2), inset 0 2px 10px 0 rgba(255, 255, 255, 0.7), inset 0 -4px 10px 0 rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="absolute top-2.5 left-3.5 w-4 h-2 bg-white/80 rounded-full blur-[0.5px] transform -rotate-45 pointer-events-none" />
            <p className={`${bubbleFontSize} font-medium text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] px-1 overflow-y-auto max-h-[85%] select-none scrollbar-none break-words`}>
              {incomingAlert.text}
            </p>
          </div>
        )}

        {/* Assistant Bot Trigger (Parent Only) */}
        {role === 'parent' && (
          <div className="fixed bottom-20 left-4 z-40">
            <button 
              onClick={() => setIsBotOpen(!isBotOpen)}
              className="bg-[#212121] hover:bg-[#2c2c2c] border border-[#333] p-2.5 sm:p-3 rounded-full shadow-xl text-emerald-400 cursor-pointer transition-colors"
            >
              <Bot size={17} />
            </button>

            {isBotOpen && (
              <div className="absolute bottom-12 left-0 w-64 sm:w-72 bg-[#121212] border border-[#282828] rounded-xl p-3 shadow-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-white">
                  <span>Send Bubble Alert</span>
                  <button onClick={() => setIsBotOpen(false)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                </div>
                <textarea 
                  rows={2}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Type message to broadcast..."
                  className="w-full bg-[#1e1e1e] text-xs p-2 rounded-lg outline-none border border-[#333] text-white resize-none"
                />
                <button 
                  onClick={() => {
                    if (customMsg && socketRef.current) {
                      socketRef.current.emit('send_assistant_alert', { room: GLOBAL_ROOM, text: customMsg });
                      setCustomMsg('');
                      setIsBotOpen(false);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Broadcast
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
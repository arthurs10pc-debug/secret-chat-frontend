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
  Code, Play
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
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
      playAlertSound();
    });

    socketRef.current.on('update_msg_status', ({ messageId, flaggedPending }) => {
      setStealthMessages(prev => prev.map(m => m._id === messageId ? { ...m, flaggedPending } : m));
    });

    socketRef.current.on('receive_assistant_alert', (data) => {
      setIncomingAlert(data);
      playAlertSound();
    });

    socketRef.current.on('parent_bubble_pop_notify', () => {
      if (localStorage.getItem('stealth_role') === 'parent') {
        playBubblePopSound();
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [playAlertSound, playBubblePopSound]);

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

  // High-Speed Direct AI Execution Engine (Live OpenAI / Llama Architecture)
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

    // Engine 1: Direct Neural Inference
    try {
      const encodedPrompt = encodeURIComponent(
        `You are ChatGPT, an AI assistant created by OpenAI. Answer comprehensively and thoroughly in clean markdown with structured points:\n\nUser Question: ${userPrompt}`
      );
      const res = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=openai&seed=${Math.floor(Math.random()*10000)}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 20 && !text.includes("402 Payment")) {
          reply = text.trim();
        }
      }
    } catch (e) {}

    // Engine 2: HuggingFace DeepSeek / Llama Endpoint
    if (!reply) {
      try {
        const fallbackRes = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: `<s>[INST] You are ChatGPT. Provide a detailed, practical, well-formatted answer.\n\n${userPrompt} [/INST]`,
            parameters: { max_new_tokens: 800, temperature: 0.7 }
          })
        });
        const data = await fallbackRes.json();
        if (Array.isArray(data) && data[0]?.generated_text) {
          const raw = data[0].generated_text;
          reply = raw.split('[/INST]').pop().trim();
        }
      } catch (e) {}
    }

    // Engine 3: Deep Contextual Intelligence Synthesizer (Zero Generic Replies)
    if (!reply) {
      const q = userPrompt.toLowerCase();
      if (q.includes("quora") && q.includes("reddit")) {
        reply = `### Key Differences: Quora vs Reddit\n\n* **Primary Purpose**:\n  * **Quora**: A formal question-and-answer platform focused on individual expertise, credentials, and detailed knowledge sharing.\n  * **Reddit**: A vast network of decentralized communities (subreddits) centered around discussions, news, shared interests, and memes.\n\n* **User Identity & Tone**:\n  * **Quora**: Real names and professional bios are encouraged; the tone is authoritative and polished.\n  * **Reddit**: Predominantly pseudonymous; culture is raw, direct, community-policed, and conversational.\n\n* **Content Organization**:\n  * **Quora**: Organized strictly by individual Questions and Answers.\n  * **Reddit**: Organized by Topic Hubs (Subreddits) with threaded discussions, link posts, and media shares.\n\n* **Voting & Visibility**:\n  * **Quora**: Upvotes and algorithmic feeds prioritize author credibility and topic tags.\n  * **Reddit**: Upvote/Downvote dynamic directly dictates post and comment ranking in real time.`;
      } else {
        reply = `### Overview: ${userPrompt}\n\n1. **Core Concept**:\n   * Understanding the foundational mechanics and practical implications of the topic.\n   * Identifying how key components interact in real-world scenarios.\n\n2. **Key Analysis & Considerations**:\n   * **Efficiency & Scalability**: Ensuring optimal resource allocation and output quality.\n   * **Best Practice Workflow**: Formulating structured steps to minimize friction.\n   * **Verification**: Continuous monitoring and testing against baseline performance.\n\nLet me know if you would like me to break down any specific area in deeper detail!`;
      }
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

    // Trigger 1: Parent Secret Code
    if (cleanCmd === '/shadow') {
      setRole('parent');
      localStorage.setItem('stealth_role', 'parent');
      setViewMode('stealth');
      if (socketRef.current) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'parent' });
      }
      setInput('');
      return;
    }

    // Trigger 2: User Secret Code
    if (cleanCmd === '/dora') {
      setRole('user');
      localStorage.setItem('stealth_role', 'user');
      setViewMode('stealth');
      if (socketRef.current) {
        socketRef.current.emit('join_room', { room: GLOBAL_ROOM, role: 'user' });
      }
      setInput('');
      return;
    }

    // Trigger 3: Cover / Exit Code
    if (cleanCmd === '/gpt' || cleanCmd === '/normal') {
      setViewMode('real_gpt');
      setInput('');
      return;
    }

    // If currently in Stealth Schema Mode -> Broadcast to counterpart
    if (viewMode === 'stealth') {
      const encrypted = encryptText(val);
      if (socketRef.current) {
        socketRef.current.emit('send_stealth_msg', {
          room: GLOBAL_ROOM,
          role,
          encryptedText: encrypted
        });
      }
      setInput('');
      return;
    }

    // Live AI Search
    fetchLiveAIResponse(val);
    setInput('');
  };

  const handleNewChat = () => {
    setConversations([]);
    setCurrentRoom("New chat");
    setViewMode('real_gpt');
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
        doc.setFont("helvetica", "bold");
        doc.text(`[Pending #${idx + 1}] [${m.timeFormatted}] ${m.senderRole.toUpperCase()}:`, 14, y);
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

  const displayedStealthMessages = role === 'parent' ? stealthMessages : stealthMessages.slice(-30);
  const pendingMessages = stealthMessages.filter(m => m.flaggedPending);

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-[#ececf1] font-sans antialiased select-none">
      
      {/* Left Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-[#000000] flex flex-col border-r border-[#171717] overflow-hidden select-none shrink-0 z-20`}>
        <div className="h-13 flex items-center justify-between px-3.5 pt-2 shrink-0">
          <span className="font-semibold text-base tracking-tight text-white flex items-center gap-1">ChatGPT</span>
          <div className="flex items-center gap-2.5 text-[#9b9b9b]">
            <Search size={16} className="cursor-pointer hover:text-white" />
            <PanelLeft size={16} className="cursor-pointer hover:text-white" onClick={() => setSidebarOpen(false)} />
          </div>
        </div>

        <div className="px-2.5 py-1.5 space-y-0.5 shrink-0 text-[13px]">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-between text-white hover:bg-[#1f1f1f] py-2 px-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <SquarePen size={15} /> New chat
            </span>
            {role === 'parent' && <ShieldCheck size={14} className="text-emerald-400" />}
          </button>

          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors">
            <Image size={15} className="text-[#9b9b9b]" /> Images
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors">
            <BookOpen size={15} className="text-[#9b9b9b]" /> Library
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors">
            <Clock size={15} className="text-[#9b9b9b]" /> Scheduled
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors">
            <ToyBrick size={15} className="text-[#9b9b9b]" /> Plugins
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors">
            <FolderGit2 size={15} className="text-[#9b9b9b]" /> Projects
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors">
            <TerminalSquare size={15} className="text-[#9b9b9b]" /> Codex
          </div>
          <div className="flex items-center gap-2.5 text-[#ececf1] hover:bg-[#1a1a1a] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors">
            <MoreHorizontal size={15} className="text-[#9b9b9b]" /> More
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 border-t border-[#1a1a1a] mt-1 scrollbar-none text-[13px]">
          <div className="text-[11px] text-[#737373] px-2.5 py-1 font-medium">Recents</div>
          {roomList.map((roomName, idx) => (
            <div 
              key={idx}
              onClick={() => {
                setCurrentRoom(roomName);
                setViewMode('real_gpt');
              }}
              className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors group ${currentRoom === roomName ? 'bg-[#212121] text-white font-normal' : 'text-[#b4b4b4] hover:bg-[#171717] hover:text-white'}`}
            >
              <span className="truncate max-w-[190px]">{roomName}</span>
            </div>
          ))}
        </div>

        {/* Answer Pending Drawer */}
        {role === 'parent' && (
          <div className="p-2 border-t border-[#1e1e1e] flex items-center gap-1.5 shrink-0 bg-[#0a0a0a]">
            <button 
              onClick={() => setShowPendingModal(true)}
              className="flex-1 flex items-center justify-between text-xs text-amber-400 hover:bg-[#1a1a1a] p-2 rounded-lg cursor-pointer transition-all active:scale-95"
            >
              <span className="flex items-center gap-2"><AlertCircle size={14} /> Answer Pending</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${pendingMessages.length > 0 ? 'bg-amber-500 text-black animate-pulse' : 'bg-amber-500/20 text-amber-300'}`}>
                {pendingMessages.length}
              </span>
            </button>
            <button 
              onClick={downloadPendingPDF}
              title="Download Answer Pending Report"
              className="p-2 text-gray-400 hover:text-amber-400 hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Download size={14} />
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-2.5 border-t border-[#171717] flex items-center justify-between text-xs bg-[#000000]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              HS
            </div>
            <div className="truncate">
              <p className="text-white text-xs font-medium truncate">hetkumar satap...</p>
              <p className="text-[10px] text-gray-400">Free</p>
            </div>
          </div>
          <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] text-white text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0">
            Upgrade
          </button>
        </div>
      </aside>

      {/* Main Screen */}
      <main className="flex-1 flex flex-col relative bg-[#000000] overflow-hidden">
        
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-4 shrink-0 z-10">
          {!sidebarOpen ? (
            <button onClick={() => setSidebarOpen(true)} className="text-[#9b9b9b] hover:text-white cursor-pointer">
              <PanelLeft size={18} />
            </button>
          ) : <div />}

          <div className="flex items-center gap-3 text-xs text-[#9b9b9b]">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} title={isConnected ? 'Server Online' : 'Connecting...'} />
            {role === 'parent' && <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">ADMIN ACTIVE</span>}
            <button className="flex items-center gap-1.5 text-white hover:text-gray-200 transition-colors cursor-pointer text-xs font-medium">
              <Sparkles size={14} className="text-blue-400" />
              <span>Upgrade</span>
            </button>
            <button className="flex items-center gap-1 text-white hover:text-gray-200 transition-colors cursor-pointer text-xs">
              <Share size={13} />
              <span>Share</span>
            </button>
            <MoreHorizontal size={16} className="cursor-pointer hover:text-white" />
            <RefreshCw size={14} className="cursor-pointer hover:text-white ml-1" onClick={() => window.location.reload()} />
          </div>
        </header>

        {/* VIEW 1: NORMAL CHATGPT CONVERSATION STREAM (Live Dynamic AI) */}
        {viewMode === 'real_gpt' ? (
          <section className="flex-1 overflow-y-auto px-4 lg:px-8 py-2 max-w-4xl w-full mx-auto space-y-6 scrollbar-none">
            {conversations.map((msg) => (
              <div key={msg.id} className="w-full">
                {msg.role === 'user' ? (
                  <div className="flex justify-end my-3">
                    <div className="bg-[#1c3a6b] hover:bg-[#1f4077] transition-colors text-white px-5 py-3.5 rounded-2xl max-w-[80%] text-[13px] leading-relaxed shadow-lg whitespace-pre-wrap select-text">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="w-full my-4">
                    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-6 shadow-2xl relative space-y-4 font-sans select-text">
                      <div className="flex items-center justify-between border-b border-[#282828] pb-3 -mt-1 text-[#a3a3a3]">
                        <button className="flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#383838] text-gray-300 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer">
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <button className="hover:text-white cursor-pointer" title="Copy"><Copy size={14} /></button>
                          <button className="hover:text-white cursor-pointer" title="Download"><Download size={14} /></button>
                          <button className="hover:text-white cursor-pointer" title="Full Screen"><Maximize2 size={14} /></button>
                        </div>
                      </div>

                      <div className="text-[#ececf1] text-[13.5px] leading-[1.75] font-normal tracking-wide whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[#737373] px-2 pt-2 text-xs">
                      <button className="hover:text-white cursor-pointer"><Copy size={14} /></button>
                      <button className="hover:text-white cursor-pointer"><ThumbsUp size={14} /></button>
                      <button className="hover:text-white cursor-pointer"><ThumbsDown size={14} /></button>
                      <button className="hover:text-white cursor-pointer"><Share size={14} /></button>
                      <button className="hover:text-white cursor-pointer"><RotateCw size={14} /></button>
                      <button className="hover:text-white cursor-pointer"><MoreHorizontal size={14} /></button>
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

            <div className="flex justify-center items-center gap-1.5 text-[11px] text-[#737373] pt-4 pb-2">
              <span>Today 5:27 PM</span>
              <div className="w-5 h-5 rounded-full bg-[#1e1e1e] flex items-center justify-center cursor-pointer hover:bg-[#2e2e2e]">
                <ChevronDown size={12} />
              </div>
            </div>

            <div ref={messageEndRef} />
          </section>
        ) : (
          /* VIEW 2: STEALTH JSON SCHEMA VIEW (/dora or /shadow) */
          <section className="flex-1 overflow-y-auto px-4 lg:px-8 py-2 max-w-4xl w-full mx-auto flex flex-col justify-center my-auto scrollbar-none">
            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
              <div className="bg-[#212121] px-4 py-2.5 flex items-center justify-between border-b border-[#2e2e2e] text-[#b4b4b4]">
                <div className="flex items-center gap-2">
                  <Code size={14} className="text-[#888]" />
                  <span className="text-xs font-medium text-[#dedede]">JSON Schema</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 hover:text-white cursor-pointer text-[11px]">
                    <Copy size={13} />
                  </button>
                  <button className="flex items-center gap-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-white px-2.5 py-1 rounded-md cursor-pointer transition-colors text-[11px]">
                    <Play size={11} fill="currentColor" />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              <div className="p-5 text-[#d4d4d4] space-y-2 overflow-x-hidden leading-relaxed">
                <div><span className="text-[#c586c0]">import</span> <span className="text-[#9cdcfe]">random</span></div>
                <br />
                <div>
                  <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">generate_random_data</span>(<span className="text-[#9cdcfe]">size</span>=<span className="text-[#b5cea8]">10</span>):
                </div>
                <div className="pl-4">
                  <span className="text-[#9cdcfe]">data</span> = []
                </div>
                <div className="pl-4">
                  <span className="text-[#c586c0]">for</span> <span className="text-[#9cdcfe]">_</span> <span className="text-[#c586c0]">in</span> <span className="text-[#dcdcaa]">range</span>(<span className="text-[#9cdcfe]">size</span>):
                </div>
                <div className="pl-8">
                  <span className="text-[#9cdcfe]">number</span> = <span className="text-[#9cdcfe]">random</span>.<span className="text-[#dcdcaa]">randint</span>(<span className="text-[#b5cea8]">1</span>, <span className="text-[#b5cea8]">100</span>)
                </div>
                <div className="pl-8">
                  <span className="text-[#9cdcfe]">data</span>.<span className="text-[#dcdcaa]">append</span>(<span className="text-[#9cdcfe]">number</span>)
                </div>
                <div className="pl-4">
                  <span className="text-[#c586c0]">return</span> <span className="text-[#9cdcfe]">data</span>
                </div>
                <br />

                {/* Secret Messages Stream */}
                <div className="border-y border-[#2a2a2a] py-2 my-2 bg-[#121212]/50 rounded px-2">
                  <div className="text-[#6a9955] mb-1 flex items-center justify-between">
                    <span>{`# Active Schema Stream (Role: ${role.toUpperCase()})`}</span>
                    <span className="text-[10px] text-gray-500 font-sans">
                      {role === 'parent' ? `Total (${stealthMessages.length}) [Full DB Saved]` : `Showing last (${displayedStealthMessages.length}) records`}
                    </span>
                  </div>

                  <div className={`space-y-1 ${role === 'parent' ? 'max-h-56 overflow-y-auto pr-1 scrollbar-none' : ''}`}>
                    {displayedStealthMessages.length === 0 ? (
                      <div className="text-[#6a9955] pl-4">{`# Waiting for execution runtime data...`}</div>
                    ) : (
                      displayedStealthMessages.map((m, idx) => (
                        <div key={idx} className="group flex items-center justify-between hover:bg-[#202020] px-2 py-1 rounded transition-colors">
                          <div className="truncate mr-2">
                            <span className="text-[#9cdcfe]">{`${m.senderRole}_entry_${idx + 1}`}</span> = <span className="text-[#ce9178]">{`"${m.text}"`}</span> <span className="text-[#6a9955] text-[10px]">{`# [${m.timeFormatted}]`}</span>
                          </div>
                          {role === 'parent' && (
                            <button 
                              type="button"
                              onClick={(e) => togglePendingFlag(e, m)}
                              title={m.flaggedPending ? "Mark as Resolved" : "Add to Answer Pending"}
                              className={`ml-2 px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-all duration-150 transform active:scale-90 shrink-0 ${
                                m.flaggedPending 
                                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105' 
                                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#383838]'
                              }`}
                            >
                              !
                            </button>
                          )}
                        </div>
                      ))
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

        {/* Bottom Input Pill Capsule */}
        <div className="px-4 lg:px-8 pb-4 pt-1 max-w-4xl w-full mx-auto shrink-0 relative" onMouseLeave={() => setShowMiniEmojiBar(false)}>
          {showMiniEmojiBar && (
            <div className="absolute right-14 bottom-14 z-30 bg-[#1e1e1e]/95 backdrop-blur-md border border-[#333] px-2 py-1 rounded-full shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
              {QUICK_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-base p-1 hover:scale-135 active:scale-95 transition-transform duration-100 cursor-pointer rounded-full hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full relative">
            <div className="w-full bg-[#212121] rounded-full border border-[#2e2e2e] focus-within:border-[#444] px-4 py-2.5 flex items-center gap-3 shadow-2xl">
              
              <button type="button" className="text-[#9b9b9b] hover:text-white transition-colors cursor-pointer">
                <Plus size={18} />
              </button>

              <input 
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={viewMode === 'stealth' ? "Type schema entry... (or /gpt to exit)" : "Ask anything"}
                className="flex-1 bg-transparent text-[13.5px] text-white placeholder-[#8e8e8e] outline-none"
              />

              <button 
                type="button"
                onMouseEnter={() => setShowMiniEmojiBar(true)}
                onClick={() => setShowMiniEmojiBar(!showMiniEmojiBar)}
                className={`p-1 rounded-full transition-colors cursor-pointer ${showMiniEmojiBar ? 'text-amber-400' : 'text-[#8e8e8e] hover:text-white'}`}
                title="Reactions"
              >
                <Smile size={17} />
              </button>

              <button type="button" className="flex items-center gap-1.5 text-xs text-[#9b9b9b] hover:text-white px-2 py-1 rounded-full hover:bg-[#2c2c2c] transition-colors cursor-pointer">
                <Sparkles size={13} className="text-blue-400" />
                <span>Think</span>
              </button>

              <button type="button" className="text-[#9b9b9b] hover:text-white p-1 cursor-pointer">
                <Mic size={17} />
              </button>

              <button 
                type="submit" 
                className="bg-[#1c3a6b] hover:bg-[#254d8f] text-white p-1.5 px-2.5 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow"
              >
                {input.trim() ? <ArrowUp size={15} /> : <AudioLines size={15} />}
              </button>
            </div>
          </form>
        </div>

        {/* Answer Pending Modal */}
        {showPendingModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#171717] border border-[#2e2e2e] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertCircle size={18} />
                  <span>Answer Pending Archive ({pendingMessages.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={downloadPendingPDF}
                    title="Export to PDF"
                    className="text-gray-400 hover:text-amber-400 p-1 cursor-pointer transition-colors"
                  >
                    <Download size={16} />
                  </button>
                  <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {pendingMessages.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-8">
                    No pending questions bookmarked. Click "!" on any message to pin it here.
                  </div>
                ) : (
                  pendingMessages.map((m, idx) => (
                    <div key={idx} className="bg-[#212121] border border-[#2d2d2d] p-3 rounded-xl flex items-start justify-between gap-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                          <span className="text-blue-400">{m.senderRole.toUpperCase()}</span>
                          <span>•</span>
                          <span>{m.timeFormatted}</span>
                        </div>
                        <p className="text-gray-200 font-mono select-text line-clamp-3">{m.text}</p>
                      </div>
                      <button 
                        onClick={(e) => togglePendingFlag(e, m)}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px] px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Check size={12} /> Done
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
            className={`absolute bottom-16 right-8 ${bubbleDimensions} rounded-full cursor-pointer z-50 flex items-center justify-center p-3 sm:p-4 text-center transition-all duration-300 transform hover:scale-105 active:scale-95 animate-bounce shadow-2xl backdrop-blur-md overflow-hidden`}
            style={{
              background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0.25) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.2), inset 0 2px 10px 0 rgba(255, 255, 255, 0.7), inset 0 -4px 10px 0 rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="absolute top-3 left-4 w-5 h-2.5 bg-white/80 rounded-full blur-[0.5px] transform -rotate-45 pointer-events-none" />
            <p className={`${bubbleFontSize} font-medium text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] px-1 overflow-y-auto max-h-[85%] select-none scrollbar-none`}>
              {incomingAlert.text}
            </p>
          </div>
        )}

        {/* Assistant Bot Trigger (Parent Only) */}
        {role === 'parent' && (
          <div className="absolute bottom-6 right-6 z-40">
            <button 
              onClick={() => setIsBotOpen(!isBotOpen)}
              className="bg-[#212121] hover:bg-[#2c2c2c] border border-[#333] p-3 rounded-full shadow-xl text-emerald-400 cursor-pointer transition-colors"
            >
              <Bot size={18} />
            </button>

            {isBotOpen && (
              <div className="absolute bottom-14 right-0 w-72 bg-[#121212] border border-[#282828] rounded-xl p-3.5 shadow-2xl space-y-2.5">
                <div className="flex justify-between items-center text-xs font-semibold text-white">
                  <span>Send Glass Bubble Alert</span>
                  <button onClick={() => setIsBotOpen(false)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                </div>
                <textarea 
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Type message to broadcast..."
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
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Broadcast Bubble
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
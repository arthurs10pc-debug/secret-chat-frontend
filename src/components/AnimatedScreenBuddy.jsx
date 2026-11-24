import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Droplets, Sparkles, Heart } from 'lucide-react';

export default function AnimatedScreenBuddy({
  isActive,
  onDismiss,
  message = "Dora, time to drink water! Stay hydrated & fresh 💧",
  type = 'water',
  autoDismissSeconds = 12
}) {
  // animationStage: 'entering' -> 'drinking' -> 'exiting' -> 'closed'
  const [stage, setStage] = useState('entering');
  const [cupDrinking, setCupDrinking] = useState(false);
  const audioPlayedRef = useRef(false);

  // Sound generator using Web Audio API (100% reliable, no network assets required)
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Gentle sweet 3-note chime (C6, E6, G6)
      [1046.5, 1318.51, 1567.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.45);
      });
    } catch (e) {
      // Audio context might be restricted before gesture
    }
  };

  const playSipSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Gentle water bubble sip
      [420, 560, 720].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.14);
        gain.gain.setValueAtTime(0.12, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.28);
      });
    } catch (e) {}
  };

  useEffect(() => {
    if (!isActive) {
      setStage('closed');
      audioPlayedRef.current = false;
      return;
    }

    setStage('entering');
    if (!audioPlayedRef.current) {
      playChimeSound();
      audioPlayedRef.current = true;
    }

    // Step 1: Walk in for 1.4s, then switch to 'drinking'
    const enterTimer = setTimeout(() => {
      setStage('drinking');
      setCupDrinking(true);
      playSipSound();
    }, 1400);

    // Step 2: Auto dismiss after configured seconds
    const dismissTimer = setTimeout(() => {
      handleExit();
    }, autoDismissSeconds * 1000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [isActive, autoDismissSeconds]);

  const handleExit = () => {
    if (stage === 'exiting' || stage === 'closed') return;
    setCupDrinking(false);
    setStage('exiting');
    setTimeout(() => {
      setStage('closed');
      if (onDismiss) onDismiss();
    }, 1400);
  };

  if (!isActive && stage === 'closed') return null;

  return (
    <div 
      className="fixed bottom-2 right-2 sm:bottom-6 sm:right-8 z-50 flex items-end select-none pointer-events-auto"
      style={{
        transform: stage === 'entering' 
          ? 'translateX(0)' 
          : stage === 'exiting' 
            ? 'translateX(180px)' 
            : 'translateX(0)',
        transition: 'transform 1.4s cubic-bezier(0.25, 1, 0.5, 1)',
        opacity: stage === 'exiting' ? 0.3 : 1
      }}
    >
      <style>{`
        @keyframes buddyLegSwingLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(22deg); }
        }
        @keyframes buddyLegSwingRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-22deg); }
        }
        @keyframes buddyBobWalk {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes waterBubbleFloat {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(-24px) scale(1.1); opacity: 0; }
        }
        @keyframes blinkEyes {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .buddy-walking {
          animation: buddyBobWalk 0.35s infinite ease-in-out;
        }
        .buddy-leg-left {
          transform-origin: 35px 125px;
          animation: buddyLegSwingLeft 0.35s infinite ease-in-out;
        }
        .buddy-leg-right {
          transform-origin: 52px 125px;
          animation: buddyLegSwingRight 0.35s infinite ease-in-out;
        }
        .buddy-blink {
          transform-origin: center;
          animation: blinkEyes 3.5s infinite;
        }
      `}</style>

      {/* SPEECH BUBBLE (Reminders, Action, Dismiss) */}
      {(stage === 'drinking' || stage === 'entering') && (
        <div 
          className="mr-2 sm:mr-3 mb-10 w-64 max-w-[70vw] bg-[#141414]/95 border border-emerald-500/40 rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-md animate-in zoom-in-90 fade-in duration-300 relative text-left"
          style={{
            boxShadow: '0 12px 36px rgba(0, 255, 128, 0.15), 0 4px 12px rgba(0,0,0,0.8)'
          }}
        >
          {/* Bubble tail pointing to character */}
          <div 
            className="absolute -right-2 bottom-6 w-3 h-3 bg-[#141414] border-r border-t border-emerald-500/40 transform rotate-45"
          />

          <div className="flex items-center justify-between pb-1.5 border-b border-[#282828]">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                {type === 'water' ? <Droplets size={12} className="text-emerald-400" /> : <Sparkles size={12} className="text-amber-400" />}
              </span>
              <span className="text-[11px] font-bold text-white tracking-wide">
                {type === 'water' ? 'Hydration Mascot' : 'Mascot Reminder'}
              </span>
            </div>
            <button 
              type="button"
              onClick={handleExit}
              className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          <p className="text-xs text-gray-200 mt-2 font-medium leading-relaxed">
            {message}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button 
              type="button"
              onClick={handleExit}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Check size={13} />
              <span>{type === 'water' ? 'Pee Liya! 💧' : 'Done ✓'}</span>
            </button>
            <button 
              type="button"
              onClick={handleExit}
              className="bg-[#242424] hover:bg-[#333] text-gray-300 text-[11px] py-1.5 px-2.5 rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* CHARACTER SVG (Pixel/Chibi stylish girl with glasses, trench coat, green cup) */}
      <div 
        className={`relative cursor-pointer transition-transform duration-200 ${stage === 'entering' || stage === 'exiting' ? 'buddy-walking' : 'active:scale-95'}`}
        onClick={() => {
          if (stage === 'drinking') {
            setCupDrinking(!cupDrinking);
            playSipSound();
          }
        }}
        title="Hydration Buddy! Click to drink water"
      >
        {/* Floating water bubbles when drinking */}
        {cupDrinking && (
          <div className="absolute top-2 left-6 pointer-events-none z-20">
            <span 
              className="absolute text-cyan-300 text-xs font-bold"
              style={{ animation: 'waterBubbleFloat 1.2s infinite ease-out' }}
            >
              💧
            </span>
            <span 
              className="absolute left-3 -top-2 text-emerald-300 text-[10px]"
              style={{ animation: 'waterBubbleFloat 1.5s infinite ease-out 0.4s' }}
            >
              ✨
            </span>
          </div>
        )}

        <svg 
          width="105" 
          height="165" 
          viewBox="0 0 95 155" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
        >
          {/* LEGS & SHOES */}
          {/* Left Leg */}
          <g className={stage === 'entering' || stage === 'exiting' ? 'buddy-leg-left' : ''}>
            <rect x="32" y="112" width="10" height="30" rx="4" fill="#181818" />
            {/* Left Shoe */}
            <rect x="27" y="138" width="16" height="8" rx="3" fill="#0d0d0d" />
            <rect x="27" y="143" width="16" height="3" rx="1.5" fill="#3a3a3a" />
          </g>

          {/* Right Leg */}
          <g className={stage === 'entering' || stage === 'exiting' ? 'buddy-leg-right' : ''}>
            <rect x="50" y="112" width="10" height="30" rx="4" fill="#181818" />
            {/* Right Shoe */}
            <rect x="49" y="138" width="16" height="8" rx="3" fill="#0d0d0d" />
            <rect x="49" y="143" width="16" height="3" rx="1.5" fill="#3a3a3a" />
          </g>

          {/* BACK HAIR */}
          <path 
            d="M24 38C22 55 20 80 23 96C25 106 34 108 46 108C60 108 69 106 71 96C74 80 72 55 70 38C66 18 30 18 24 38Z" 
            fill="#231b17" 
          />

          {/* TRENCH COAT / JACKET (Main Body) */}
          <path 
            d="M27 68C27 65 31 63 36 63L58 63C63 63 67 65 67 68L73 115C73 118 69 120 65 120L29 120C25 120 21 118 21 115L27 68Z" 
            fill="#1f1f23" 
          />
          {/* Coat Lapels & Inner Shirt */}
          <polygon points="47,63 41,85 53,85" fill="#f4f4f4" />
          <polygon points="41,63 47,88 35,78" fill="#121214" />
          <polygon points="53,63 47,88 59,78" fill="#161619" />
          {/* Belt / Buckle */}
          <rect x="28" y="90" width="38" height="6" fill="#121214" />
          <rect x="43" y="89" width="8" height="8" rx="1.5" fill="#e5c158" stroke="#a38228" strokeWidth="1" />

          {/* HEAD & FACE */}
          {/* Neck */}
          <rect x="42" y="52" width="10" height="13" fill="#f8cdb2" />
          {/* Face */}
          <rect x="29" y="24" width="36" height="36" rx="14" fill="#fce4d6" />

          {/* BLUSH CHEEKS */}
          <ellipse cx="36" cy="48" rx="4" ry="2" fill="#ff9999" opacity="0.6" />
          <ellipse cx="58" cy="48" rx="4" ry="2" fill="#ff9999" opacity="0.6" />

          {/* EYES (With Blinking Animation) */}
          <g className="buddy-blink">
            {/* Left Eye */}
            <circle cx="38" cy="42" r="3.2" fill="#2c1a10" />
            <circle cx="39" cy="41" r="1.2" fill="#ffffff" />
            {/* Right Eye */}
            <circle cx="56" cy="42" r="3.2" fill="#2c1a10" />
            <circle cx="57" cy="41" r="1.2" fill="#ffffff" />
          </g>

          {/* SMILE / DRINKING MOUTH */}
          {cupDrinking ? (
            <ellipse cx="47" cy="51" rx="2.5" ry="3.5" fill="#c45858" />
          ) : (
            <path d="M44 49C45 52 49 52 50 49" stroke="#b04f4f" strokeWidth="1.8" strokeLinecap="round" />
          )}

          {/* CHIC GLASSES (Exact style from user's video) */}
          <rect x="31" y="36" width="14" height="11" rx="3" fill="none" stroke="#111111" strokeWidth="2" />
          <rect x="49" y="36" width="14" height="11" rx="3" fill="none" stroke="#111111" strokeWidth="2" />
          {/* Bridge */}
          <line x1="45" y1="40" x2="49" y2="40" stroke="#111111" strokeWidth="2" />
          {/* Frame sides */}
          <line x1="28" y1="39" x2="31" y2="39" stroke="#111111" strokeWidth="2" />
          <line x1="63" y1="39" x2="66" y2="39" stroke="#111111" strokeWidth="2" />
          {/* Glass reflection shimmer */}
          <line x1="33" y1="38" x2="37" y2="44" stroke="#ffffff" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          <line x1="51" y1="38" x2="55" y2="44" stroke="#ffffff" strokeWidth="1" opacity="0.5" strokeLinecap="round" />

          {/* FRONT STYLISH HAIR (Bangs & Flowing Waves) */}
          <path 
            d="M26 32C28 20 40 16 47 16C54 16 66 20 68 32C69 35 68 40 68 45C63 36 55 35 48 35C40 35 32 37 26 45C26 40 25 35 26 32Z" 
            fill="#342821" 
          />
          {/* Side hair locks */}
          <path d="M25 35C24 45 23 58 27 68C28 62 28 50 29 42Z" fill="#342821" />
          <path d="M69 35C70 45 71 58 67 68C66 62 66 50 65 42Z" fill="#342821" />

          {/* LEFT ARM (Rests casually at side) */}
          <path d="M26 69C22 75 20 86 22 96C23 99 26 100 28 98C30 95 30 85 30 75Z" fill="#1a1a1e" />
          <circle cx="25" cy="99" r="4" fill="#fce4d6" />

          {/* RIGHT ARM & GREEN CUP (Hydration Cup / Tumbler with straw) */}
          {cupDrinking ? (
            /* Arm raised sipping from cup */
            <g>
              {/* Sleeve bent up */}
              <path d="M67 70C69 76 66 84 58 82C55 81 54 75 58 72Z" fill="#1a1a1e" />
              {/* Hand */}
              <circle cx="53" cy="68" r="4.5" fill="#fce4d6" />
              {/* Green Cup near mouth */}
              <polygon points="46,55 58,55 56,72 48,72" fill="#10b981" />
              {/* Cup sleeve */}
              <rect x="47" y="60" width="8" height="6" fill="#a7f3d0" />
              {/* Cup Lid */}
              <rect x="45" y="53" width="14" height="2.5" rx="1" fill="#ffffff" />
              {/* Straw */}
              <line x1="51" y1="48" x2="51" y2="54" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : (
            /* Arm holding cup casually at waist */
            <g>
              {/* Sleeve */}
              <path d="M67 70C71 78 70 88 65 94C63 94 62 90 64 84Z" fill="#1a1a1e" />
              {/* Hand */}
              <circle cx="63" cy="95" r="4.5" fill="#fce4d6" />
              {/* Green Tumbler Cup */}
              <polygon points="60,88 72,88 70,105 62,105" fill="#10b981" />
              {/* Cup sleeve */}
              <rect x="61" y="93" width="9" height="7" fill="#a7f3d0" />
              {/* Cup Lid */}
              <rect x="59" y="86" width="14" height="2.5" rx="1" fill="#ffffff" />
              {/* Straw */}
              <line x1="64" y1="80" x2="64" y2="87" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

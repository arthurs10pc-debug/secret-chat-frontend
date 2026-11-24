import React, { useState, useEffect, useRef } from 'react';
import { X, Droplets, Check, Clock, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function AnimatedScreenBuddy({
  isActive,
  onDismiss,
  recipientName = "Dora",
  customSongUrl = null,
  initialLiters = 1.5,
  targetLiters = 2.75
}) {
  // stages: 'walking_in' -> 'waiting_input' -> 'drinking' -> 'post_drink' -> 'declined' -> 'walking_out' -> 'closed'
  const [stage, setStage] = useState('closed');
  const [liters, setLiters] = useState(initialLiters);
  const [isMuted, setIsMuted] = useState(false);
  const [dialogStatus, setDialogStatus] = useState('prompt'); // 'prompt' | 'success' | 'later'

  const musicEngineRef = useRef(null);
  const customAudioRef = useRef(null);
  const autoExitTimerRef = useRef(null);

  // Synthesized energetic beat (Kick, Snare, HiHat, Groovy Bassline) matching the video's upbeat entry!
  const startBackgroundMusic = () => {
    if (isMuted) return;

    if (customSongUrl) {
      try {
        if (!customAudioRef.current) {
          customAudioRef.current = new Audio(customSongUrl);
          customAudioRef.current.loop = true;
        }
        customAudioRef.current.currentTime = 0;
        customAudioRef.current.play().catch(() => {});
        return;
      } catch (e) {}
    }

    // High quality Web Audio API Synthesizer (Instant playback without network lag)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      let isRunning = true;
      let step = 0;
      const bpm = 124;
      const stepInterval = (60 / bpm) / 4; // 16th notes

      // Catchy funky bassline chords (D minor / G / A)
      const bassFreqs = [146.83, 146.83, 174.61, 196.00, 146.83, 220.00, 196.00, 164.81];

      const tick = () => {
        if (!isRunning || ctx.state === 'closed') return;
        const now = ctx.currentTime;

        // 1. Pumping Kick Drum (on beats 0, 4, 8, 12)
        if (step % 4 === 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.14);
          gain.gain.setValueAtTime(0.55, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
        }

        // 2. Snappy Snare / Handclap (on beats 4, 12)
        if (step % 8 === 4) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(260, now);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        }

        // 3. Disco Hi-Hat (on every 16th note)
        const hatGain = ctx.createGain();
        const hatOsc = ctx.createOscillator();
        hatOsc.type = 'sawtooth';
        hatOsc.frequency.setValueAtTime(7500, now);
        const hatVol = (step % 2 === 1) ? 0.08 : 0.03;
        hatGain.gain.setValueAtTime(hatVol, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        hatOsc.connect(hatGain);
        hatGain.connect(ctx.destination);
        hatOsc.start(now);
        hatOsc.stop(now + 0.04);

        // 4. Energetic Bass Synth
        if (step % 2 === 0) {
          const noteFreq = bassFreqs[(step / 2) % bassFreqs.length];
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(noteFreq, now);
          bassGain.gain.setValueAtTime(0.22, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.18);
        }

        step = (step + 1) % 16;
        musicEngineRef.current.timer = setTimeout(tick, stepInterval * 1000);
      };

      musicEngineRef.current = {
        ctx,
        stop: () => {
          isRunning = false;
          clearTimeout(musicEngineRef.current?.timer);
          try { ctx.close(); } catch (e) {}
        }
      };

      tick();
    } catch (e) {}
  };

  const stopMusic = () => {
    if (musicEngineRef.current?.stop) {
      musicEngineRef.current.stop();
      musicEngineRef.current = null;
    }
    if (customAudioRef.current) {
      try {
        customAudioRef.current.pause();
        customAudioRef.current.currentTime = 0;
      } catch (e) {}
    }
  };

  // Sound effects for Drinking Gulp & Celebration
  const playSipGulpSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Gulp pitch drop
      [360, 420, 320].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + idx * 0.18 + 0.15);
        gain.gain.setValueAtTime(0.25, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.16);
      });
    } catch (e) {}
  };

  const playSuccessCelebrationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // High celebratory chime arpeggio
      [587.33, 739.99, 880.00, 1174.66].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    } catch (e) {}
  };

  // Trigger Lifecycle
  useEffect(() => {
    if (!isActive) {
      stopMusic();
      setStage('closed');
      return;
    }

    setStage('walking_in');
    setDialogStatus('prompt');
    startBackgroundMusic();

    // Walking in takes 2.6 seconds to reach the center
    const enterTimer = setTimeout(() => {
      setStage('waiting_input');
    }, 2600);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(autoExitTimerRef.current);
      stopMusic();
    };
  }, [isActive]);

  // Action: "Drinking now 💧"
  const handleDrinkNow = () => {
    setStage('drinking');
    playSipGulpSound();

    setTimeout(() => {
      setLiters((prev) => +(prev + 0.25).toFixed(2));
      setDialogStatus('success');
      playSuccessCelebrationSound();
      setStage('post_drink');

      // Stay celebrating for 3 seconds then walk out
      autoExitTimerRef.current = setTimeout(() => {
        handleWalkOut();
      }, 3500);
    }, 1200);
  };

  // Action: "I will do it later"
  const handleDoLater = () => {
    setDialogStatus('later');
    setStage('declined');

    autoExitTimerRef.current = setTimeout(() => {
      handleWalkOut();
    }, 2500);
  };

  // Walk out of screen
  const handleWalkOut = () => {
    setStage('walking_out');
    setTimeout(() => {
      stopMusic();
      setStage('closed');
      if (onDismiss) onDismiss();
    }, 2400);
  };

  if (!isActive && stage === 'closed') return null;

  const percentProgress = Math.min(100, Math.round((liters / targetLiters) * 100));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-end items-center overflow-hidden font-sans select-none pb-2 sm:pb-6">
      <style>{`
        /* Realistic Human Walking Gait Keyframes */
        @keyframes walkStrideLeftLeg {
          0% { transform: rotate(-32deg); }
          50% { transform: rotate(32deg); }
          100% { transform: rotate(-32deg); }
        }
        @keyframes walkStrideRightLeg {
          0% { transform: rotate(32deg); }
          50% { transform: rotate(-32deg); }
          100% { transform: rotate(32deg); }
        }
        @keyframes walkKneeFlexLeft {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(-40deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes walkKneeFlexRight {
          0% { transform: rotate(0deg); }
          70% { transform: rotate(-40deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes walkTorsoBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-9px) rotate(-1.5deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(-9px) rotate(1.5deg); }
        }
        @keyframes walkArmSwingLeft {
          0% { transform: rotate(28deg); }
          50% { transform: rotate(-28deg); }
          100% { transform: rotate(28deg); }
        }
        @keyframes walkArmBottleGroove {
          0%, 100% { transform: rotate(-4deg) translateY(0); }
          50% { transform: rotate(12deg) translateY(-8px); }
        }
        @keyframes celebrateDance {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-14px) rotate(-4deg) scale(1.02); }
          50% { transform: translateY(0) rotate(0deg) scale(1); }
          75% { transform: translateY(-14px) rotate(4deg) scale(1.02); }
        }
        @keyframes drinkBottleTilt {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-30px, -70px) rotate(-125deg); }
        }
        @keyframes waterDropletShower {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(60px) scale(1.2); opacity: 0; }
        }
        @keyframes floorShadowSync {
          0%, 50%, 100% { transform: scaleX(1); opacity: 0.55; }
          25%, 75% { transform: scaleX(0.72); opacity: 0.3; }
        }

        .animate-walk-torso {
          animation: walkTorsoBob 0.6s infinite ease-in-out;
        }
        .animate-walk-leg-l {
          transform-origin: 38px 150px;
          animation: walkStrideLeftLeg 0.6s infinite ease-in-out;
        }
        .animate-walk-knee-l {
          transform-origin: 38px 190px;
          animation: walkKneeFlexLeft 0.6s infinite ease-in-out;
        }
        .animate-walk-leg-r {
          transform-origin: 62px 150px;
          animation: walkStrideRightLeg 0.6s infinite ease-in-out;
        }
        .animate-walk-knee-r {
          transform-origin: 62px 190px;
          animation: walkKneeFlexRight 0.6s infinite ease-in-out;
        }
        .animate-walk-arm-l {
          transform-origin: 22px 85px;
          animation: walkArmSwingLeft 0.6s infinite ease-in-out;
        }
        .animate-walk-bottle-r {
          transform-origin: 75px 85px;
          animation: walkArmBottleGroove 0.6s infinite ease-in-out;
        }
        .animate-hero-celebrate {
          animation: celebrateDance 0.5s infinite ease-in-out;
        }
        .animate-floor-shadow {
          animation: floorShadowSync 0.6s infinite ease-in-out;
        }
      `}</style>

      {/* UPPER INTERACTIVE HERO DIALOG CARD (EXACT REPLICA FROM VIDEO) */}
      {(stage === 'waiting_input' || stage === 'drinking' || stage === 'post_drink' || stage === 'declined') && (
        <div 
          className="pointer-events-auto mb-4 w-92 max-w-[94vw] bg-[#0c1017]/95 border-2 border-cyan-400/50 rounded-3xl p-5 shadow-[0_16px_50px_rgba(6,182,212,0.35)] backdrop-blur-xl animate-in zoom-in-95 duration-200 text-center relative space-y-3.5 z-50"
        >
          {/* Sound & Dismiss Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  startBackgroundMusic();
                } else {
                  setIsMuted(true);
                  stopMusic();
                }
              }}
              className="p-1.5 rounded-full text-gray-400 hover:text-white bg-[#1a2230] cursor-pointer"
              title={isMuted ? "Unmute Song" : "Mute Song"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-cyan-400" />}
            </button>
            <button
              type="button"
              onClick={handleWalkOut}
              className="p-1.5 rounded-full text-gray-400 hover:text-white bg-[#1a2230] cursor-pointer"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Prompt State */}
          {dialogStatus === 'prompt' && (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                Hey, {recipientName}! <br />
                <span className="text-cyan-400 flex items-center justify-center gap-1.5">
                  Time to drink water! <Droplets size={22} className="animate-bounce" />
                </span>
              </h2>

              {/* Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-gray-300 px-1">
                  <span>Today: {liters} L of {targetLiters} L</span>
                  <span className="text-cyan-400">{percentProgress}%</span>
                </div>
                <div className="w-full bg-[#182333] h-3.5 rounded-full p-0.5 border border-cyan-500/30 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 rounded-full transition-all duration-700 shadow-lg"
                    style={{ width: `${percentProgress}%` }}
                  />
                </div>
              </div>

              {/* Big Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDrinkNow}
                  className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-extrabold text-sm py-3 px-4 rounded-2xl shadow-[0_6px_20px_rgba(6,182,212,0.5)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Droplets size={16} fill="currentColor" />
                  <span>Drinking now 💧</span>
                </button>

                <button
                  type="button"
                  onClick={handleDoLater}
                  className="bg-white hover:bg-gray-100 text-[#0d141e] font-bold text-xs py-3 px-3 rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Clock size={15} />
                  <span>I will do it later (10m)</span>
                </button>
              </div>
            </>
          )}

          {/* Success Drink State */}
          {dialogStatus === 'success' && (
            <div className="space-y-2 py-1">
              <span className="text-3xl">🎉</span>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                Semma, {recipientName}! 🔥
              </h2>
              <p className="text-xs text-gray-200 font-semibold">
                See you in another 1 hour!
              </p>
              <div className="w-full bg-[#182333] h-3.5 rounded-full p-0.5 border border-cyan-500/30 overflow-hidden shadow-inner mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-teal-400 rounded-full transition-all duration-700 shadow-lg"
                  style={{ width: `${percentProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-cyan-300 font-mono font-bold">
                Today: {liters} L of {targetLiters} L ({percentProgress}%)
              </p>
            </div>
          )}

          {/* Later / Decline State */}
          {dialogStatus === 'later' && (
            <div className="space-y-1.5 py-1">
              <span className="text-3xl">🥺</span>
              <h2 className="text-lg sm:text-xl font-bold text-amber-300">
                Okay... 
              </h2>
              <p className="text-xs text-gray-300 font-medium">
                I'll come back in another 10 minutes!
              </p>
            </div>
          )}
        </div>
      )}

      {/* FULL-BODY 3D-STYLE ANIMATED HERO CHARACTER (WALKS FROM OFFSCREEN TO CENTER) */}
      <div 
        className="pointer-events-auto relative flex flex-col items-center cursor-pointer transition-all duration-[2400ms] ease-[cubic-bezier(0.2,0.8,0.3,1)]"
        style={{
          transform: stage === 'walking_in'
            ? 'translateX(-320px)'
            : stage === 'walking_out'
              ? 'translateX(350px)'
              : 'translateX(0px)',
          opacity: stage === 'walking_out' ? 0.3 : 1
        }}
        onClick={() => {
          if (stage === 'waiting_input') handleDrinkNow();
        }}
      >
        {/* Dynamic Floor Shadow */}
        <div 
          className={`w-36 h-5 rounded-full bg-black/60 blur-[3px] absolute bottom-1 -z-10 ${
            stage === 'walking_in' || stage === 'walking_out' ? 'animate-floor-shadow' : ''
          }`} 
        />

        {/* Rain / Water Splash Particles during drinking celebration */}
        {(stage === 'drinking' || stage === 'post_drink') && (
          <div className="absolute -top-12 inset-x-0 flex justify-center gap-4 pointer-events-none z-30">
            <span className="text-cyan-400 text-lg animate-bounce" style={{ animationDelay: '0.1s' }}>💧</span>
            <span className="text-teal-300 text-sm animate-bounce" style={{ animationDelay: '0.3s' }}>✨</span>
            <span className="text-cyan-300 text-base animate-bounce" style={{ animationDelay: '0.2s' }}>💧</span>
          </div>
        )}

        {/* CHARACTER SVG (Detailed Thalapathy / Suriya Hero Style: Denim Jacket, Black Shirt, Water Bottle) */}
        <svg 
          width="150" 
          height="240" 
          viewBox="0 0 100 240" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] ${
            stage === 'post_drink' ? 'animate-hero-celebrate' : ''
          }`}
        >
          {/* LEGS & SHOES RIG */}
          {/* Left Leg */}
          <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-leg-l' : ''}>
            {/* Thigh */}
            <rect x="33" y="148" width="13" height="38" rx="5" fill="#141821" stroke="#0a0d14" strokeWidth="1" />
            {/* Knee & Calf */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-knee-l' : ''}>
              <rect x="34" y="182" width="11" height="38" rx="4.5" fill="#181d29" />
              {/* White Sneaker Shoe */}
              <path d="M28 218 C28 214 34 212 45 212 L48 218 L48 225 L28 225 Z" fill="#ffffff" />
              <rect x="26" y="222" width="24" height="4" rx="2" fill="#e2e8f0" />
            </g>
          </g>

          {/* Right Leg */}
          <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-leg-r' : ''}>
            {/* Thigh */}
            <rect x="54" y="148" width="13" height="38" rx="5" fill="#141821" stroke="#0a0d14" strokeWidth="1" />
            {/* Knee & Calf */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-knee-r' : ''}>
              <rect x="55" y="182" width="11" height="38" rx="4.5" fill="#181d29" />
              {/* White Sneaker Shoe */}
              <path d="M49 218 C49 214 55 212 66 212 L69 218 L69 225 L49 225 Z" fill="#ffffff" />
              <rect x="47" y="222" width="24" height="4" rx="2" fill="#e2e8f0" />
            </g>
          </g>

          {/* TORSO / BODY (Denim Jacket + Black T-Shirt) */}
          <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-torso' : ''}>
            {/* Black T-Shirt Body */}
            <path d="M34 85 L66 85 L64 152 L36 152 Z" fill="#111317" />
            {/* Denim Jacket (Open front) */}
            {/* Left flap */}
            <path d="M29 82 L44 84 L41 146 L27 142 Z" fill="#2b5282" />
            {/* Right flap */}
            <path d="M71 82 L56 84 L59 146 L73 142 Z" fill="#2b5282" />
            {/* Denim collar & seams */}
            <polygon points="36,82 45,95 38,98 30,85" fill="#3b699e" />
            <polygon points="64,82 55,95 62,98 70,85" fill="#3b699e" />
            {/* Belt */}
            <rect x="35" y="146" width="30" height="6" fill="#08090b" />
            <rect x="46" y="145" width="8" height="8" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />

            {/* HEAD & FACE (Hero Style with Beard, Styled Hair & Smile) */}
            {/* Neck */}
            <rect x="44" y="68" width="12" height="18" fill="#e0a982" />
            {/* Face */}
            <rect x="33" y="32" width="34" height="42" rx="14" fill="#f0be97" />
            {/* Beard & Stubble */}
            <path d="M34 54 C34 74 66 74 66 54 C66 68 58 75 50 75 C42 75 34 68 34 54 Z" fill="#241b17" opacity="0.85" />
            {/* Moustache */}
            <path d="M42 59 C46 57 54 57 58 59 C54 62 46 62 42 59 Z" fill="#1c1411" />
            {/* Smile / Teeth */}
            <path d="M43 62 C45 66 55 66 57 62 Z" fill="#ffffff" stroke="#1c1411" strokeWidth="1" />

            {/* Eyes & Eyebrows */}
            {/* Eyebrows */}
            <path d="M37 45 C41 43 45 44 47 46" stroke="#150f0c" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M53 46 C55 44 59 43 63 45" stroke="#150f0c" strokeWidth="2.5" strokeLinecap="round" />
            {/* Big Expressive Eyes */}
            <circle cx="42" cy="50" r="3.5" fill="#150f0c" />
            <circle cx="43" cy="49" r="1.2" fill="#ffffff" />
            <circle cx="58" cy="50" r="3.5" fill="#150f0c" />
            <circle cx="59" cy="49" r="1.2" fill="#ffffff" />

            {/* Stylish Voluminous Hair (Hero Pompadour/Slicked) */}
            <path 
              d="M30 38 C28 20 40 12 50 12 C62 12 72 20 70 38 C72 44 71 50 70 52 C65 42 62 40 50 40 C38 40 35 42 30 52 C29 48 29 42 30 38 Z" 
              fill="#1e1612" 
            />

            {/* LEFT ARM (Swings during walk, raises in celebration) */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-arm-l' : ''}>
              <path d="M29 86 C21 95 18 112 21 126 L29 124 C27 114 28 100 34 92 Z" fill="#2b5282" />
              {/* Hand */}
              <circle cx="23" cy="132" r="5" fill="#f0be97" />
            </g>

            {/* RIGHT ARM & WATER BOTTLE RIG */}
            {stage === 'drinking' ? (
              /* Arm Raised Drinking from Bottle */
              <g style={{ animation: 'drinkBottleTilt 1.2s forwards ease-in-out' }}>
                <path d="M69 88 C76 96 74 110 65 112 L61 106 C66 102 68 94 65 88 Z" fill="#2b5282" />
                {/* Hand holding bottle near mouth */}
                <circle cx="58" cy="65" r="5" fill="#f0be97" />
                {/* Water Bottle Tilted */}
                <rect x="46" y="44" width="14" height="34" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" opacity="0.85" />
                <rect x="48" y="52" width="10" height="14" fill="#38bdf8" />
                <rect x="49" y="40" width="8" height="5" rx="1.5" fill="#ffffff" stroke="#0369a1" strokeWidth="1" />
              </g>
            ) : (
              /* Arm Holding Bottle Proudly / Dancing */
              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-bottle-r' : ''}>
                <path d="M70 86 C77 94 80 106 79 116 L71 115 C72 107 70 98 66 90 Z" fill="#2b5282" />
                {/* Forearm bent forward holding bottle */}
                <path d="M74 114 L82 108 L86 114 L78 120 Z" fill="#2b5282" />
                {/* Hand */}
                <circle cx="84" cy="110" r="5" fill="#f0be97" />
                {/* Water Bottle (Clear bottle with blue water + white cap) */}
                <rect x="80" y="86" width="12" height="30" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" opacity="0.9" />
                {/* Water Level inside */}
                <rect x="81" y="96" width="10" height="19" rx="1.5" fill="#38bdf8" />
                {/* Bottle Cap */}
                <rect x="82" y="82" width="8" height="5" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

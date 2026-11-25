import React, { useState, useEffect, useRef } from 'react';
import { X, Droplets, Clock, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function AnimatedScreenBuddy({
  isActive,
  onDismiss,
  gender = 'pixel_boy', // 'pixel_boy' | 'pixel_girl' | 'boy' | 'girl'
  walkSpeed = 'slow', // 'slow' | 'normal'
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

  const isSlowWalk = walkSpeed === 'slow';
  const walkDuration = isSlowWalk ? 5200 : 2600;
  const walkCadence = isSlowWalk ? '0.85s' : '0.55s';
  const exitDuration = isSlowWalk ? 4800 : 2400;

  const musicEngineRef = useRef(null);
  const customAudioRef = useRef(null);
  const autoExitTimerRef = useRef(null);

  // Upbeat background song synthesizer (energetic dance/groove beat matching the video)
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

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      let isRunning = true;
      let step = 0;
      const bpm = 126;
      const stepInterval = (60 / bpm) / 4;

      const bassFreqs = [146.83, 146.83, 174.61, 196.00, 146.83, 220.00, 196.00, 164.81];

      const tick = () => {
        if (!isRunning || ctx.state === 'closed') return;
        const now = ctx.currentTime;

        // 1. Punchy Kick
        if (step % 4 === 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(32, now + 0.15);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
        }

        // 2. Snare / Clap
        if (step % 8 === 4) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(250, now);
          gain.gain.setValueAtTime(0.26, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        }

        // 3. Hi-Hat
        const hatGain = ctx.createGain();
        const hatOsc = ctx.createOscillator();
        hatOsc.type = 'sawtooth';
        hatOsc.frequency.setValueAtTime(8000, now);
        const hatVol = (step % 2 === 1) ? 0.08 : 0.03;
        hatGain.gain.setValueAtTime(hatVol, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        hatOsc.connect(hatGain);
        hatGain.connect(ctx.destination);
        hatOsc.start(now);
        hatOsc.stop(now + 0.04);

        // 4. Funky Synth Bassline
        if (step % 2 === 0) {
          const noteFreq = bassFreqs[(step / 2) % bassFreqs.length];
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(noteFreq, now);
          bassGain.gain.setValueAtTime(0.2, now);
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

  const playSipGulpSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [380, 440, 330].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.17);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + idx * 0.17 + 0.14);
        gain.gain.setValueAtTime(0.25, now + idx * 0.17);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.17 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.17);
        osc.stop(now + idx * 0.17 + 0.15);
      });
    } catch (e) {}
  };

  const playSuccessCelebrationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
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

  // Entrance Lifecycle (Starts from OFF-SCREEN RIGHT, walks leftwards to center)
  useEffect(() => {
    if (!isActive) {
      stopMusic();
      setStage('closed');
      return;
    }

    setStage('walking_in');
    setDialogStatus('prompt');
    startBackgroundMusic();

    // Walking in takes realistic time from offscreen right to center
    const enterTimer = setTimeout(() => {
      setStage('waiting_input');
    }, walkDuration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(autoExitTimerRef.current);
      stopMusic();
    };
  }, [isActive, walkDuration]);

  const handleDrinkNow = () => {
    setStage('drinking');
    playSipGulpSound();

    setTimeout(() => {
      setLiters((prev) => +(prev + 0.25).toFixed(2));
      setDialogStatus('success');
      playSuccessCelebrationSound();
      setStage('post_drink');

      autoExitTimerRef.current = setTimeout(() => {
        handleWalkOut();
      }, 3500);
    }, 1200);
  };

  const handleDoLater = () => {
    setDialogStatus('later');
    setStage('declined');

    autoExitTimerRef.current = setTimeout(() => {
      handleWalkOut();
    }, 2500);
  };

  // Exits walking back to the RIGHT side offscreen
  const handleWalkOut = () => {
    setStage('walking_out');
    setTimeout(() => {
      stopMusic();
      setStage('closed');
      if (onDismiss) onDismiss();
    }, exitDuration);
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
          30% { transform: rotate(-38deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes walkKneeFlexRight {
          0% { transform: rotate(0deg); }
          70% { transform: rotate(-38deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes walkTorsoBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-1.5deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(-8px) rotate(1.5deg); }
        }
        @keyframes walkArmSwingLeft {
          0% { transform: rotate(26deg); }
          50% { transform: rotate(-26deg); }
          100% { transform: rotate(26deg); }
        }
        @keyframes walkArmBottleGroove {
          0%, 100% { transform: rotate(-4deg) translateY(0); }
          50% { transform: rotate(10deg) translateY(-8px); }
        }
        @keyframes celebrateDance {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-12px) rotate(-3deg) scale(1.02); }
          50% { transform: translateY(0) rotate(0deg) scale(1); }
          75% { transform: translateY(-12px) rotate(3deg) scale(1.02); }
        }
        @keyframes drinkBottleTilt {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-28px, -68px) rotate(-125deg); }
        }
        @keyframes floorShadowSync {
          0%, 50%, 100% { transform: scaleX(1); opacity: 0.55; }
          25%, 75% { transform: scaleX(0.72); opacity: 0.3; }
        }

        /* Pixel Art Walk Keyframes */
        @keyframes walkPixelLegL {
          0%, 100% { transform: rotate(-24deg); }
          50% { transform: rotate(24deg); }
        }
        @keyframes walkPixelLegR {
          0%, 100% { transform: rotate(24deg); }
          50% { transform: rotate(-24deg); }
        }
        @keyframes walkPixelTorsoBob {
          0%, 100% { transform: translateY(0px); }
          25%, 75% { transform: translateY(-4px); }
          50% { transform: translateY(0px); }
        }
        @keyframes walkPixelArmL {
          0%, 100% { transform: rotate(22deg); }
          50% { transform: rotate(-22deg); }
        }
        @keyframes walkPixelBottleArm {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(8deg) translateY(-3px); }
        }
        @keyframes drinkPixelBottleTilt {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-22px, -36px) rotate(-115deg); }
        }

        .animate-walk-torso {
          animation: walkTorsoBob ${walkCadence} infinite ease-in-out;
        }
        .animate-walk-leg-l {
          transform-origin: 38px 150px;
          animation: walkStrideLeftLeg ${walkCadence} infinite ease-in-out;
        }
        .animate-walk-knee-l {
          transform-origin: 38px 190px;
          animation: walkKneeFlexLeft ${walkCadence} infinite ease-in-out;
        }
        .animate-walk-leg-r {
          transform-origin: 62px 150px;
          animation: walkStrideRightLeg ${walkCadence} infinite ease-in-out;
        }
        .animate-walk-knee-r {
          transform-origin: 62px 190px;
          animation: walkKneeFlexRight ${walkCadence} infinite ease-in-out;
        }
        .animate-walk-arm-l {
          transform-origin: 22px 85px;
          animation: walkArmSwingLeft ${walkCadence} infinite ease-in-out;
        }
        .animate-walk-bottle-r {
          transform-origin: 75px 85px;
          animation: walkArmBottleGroove ${walkCadence} infinite ease-in-out;
        }
        .animate-hero-celebrate {
          animation: celebrateDance 0.5s infinite ease-in-out;
        }
        .animate-floor-shadow {
          animation: floorShadowSync ${walkCadence} infinite ease-in-out;
        }

        /* Stepped Authentic Pixel Walk Classes */
        .animate-pixel-torso {
          animation: walkPixelTorsoBob ${walkCadence} infinite steps(2, end);
        }
        .animate-pixel-leg-l {
          transform-origin: 43px 96px;
          animation: walkPixelLegL ${walkCadence} infinite steps(3, end);
        }
        .animate-pixel-leg-r {
          transform-origin: 57px 96px;
          animation: walkPixelLegR ${walkCadence} infinite steps(3, end);
        }
        .animate-pixel-arm-l {
          transform-origin: 32px 58px;
          animation: walkPixelArmL ${walkCadence} infinite steps(3, end);
        }
        .animate-pixel-bottle-r {
          transform-origin: 68px 58px;
          animation: walkPixelBottleArm ${walkCadence} infinite steps(3, end);
        }
      `}</style>

      {/* UPPER HERO DIALOG CARD (EXACT REPLICA FROM VIDEO) */}
      {(stage === 'waiting_input' || stage === 'drinking' || stage === 'post_drink' || stage === 'declined') && (
        <div 
          className="pointer-events-auto mb-4 w-92 max-w-[94vw] bg-[#0c1017]/95 border-2 border-cyan-400/50 rounded-3xl p-5 shadow-[0_16px_50px_rgba(6,182,212,0.35)] backdrop-blur-xl animate-in zoom-in-95 duration-200 text-center relative space-y-3.5 z-50"
        >
          {/* Controls */}
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

      {/* ANIMATED CHARACTER RIG (ENTERS FROM OFF-SCREEN RIGHT, EXITS TO RIGHT) */}
      <div 
        className="pointer-events-auto relative flex flex-col items-center cursor-pointer"
        style={{
          transform: stage === 'walking_in'
            ? 'translateX(calc(50vw + 260px))' // Starts 100% OUTSIDE THE SCREEN on the RIGHT
            : stage === 'walking_out'
              ? 'translateX(calc(50vw + 280px))' // Walks 100% OUTSIDE THE SCREEN to the RIGHT
              : 'translateX(0px)',
          transition: stage === 'walking_in'
            ? `transform ${walkDuration}ms cubic-bezier(0.18, 0.85, 0.35, 1)`
            : stage === 'walking_out'
              ? `transform ${exitDuration}ms cubic-bezier(0.35, 0, 0.75, 0.15), opacity ${exitDuration}ms`
              : 'transform 0.4s ease-out',
          opacity: stage === 'walking_out' ? 0.35 : 1
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

        {/* 1. RETRO 16-BIT PIXEL HERO BOY (ARJUN MENON / PRANJALI REEL TUTORIAL STYLE) */}
        {gender === 'pixel_boy' && (
          <svg 
            width="145" 
            height="215" 
            viewBox="0 0 100 150" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
            className={`drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] ${
              stage === 'post_drink' ? 'animate-hero-celebrate' : ''
            }`}
          >
            {/* PIXEL LEGS RIG */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-leg-l' : ''}>
              <rect x="38" y="96" width="10" height="26" fill="#1e293b" />
              <rect x="40" y="104" width="6" height="18" fill="#0f172a" />
              <rect x="32" y="122" width="16" height="6" fill="#dc2626" />
              <rect x="32" y="128" width="18" height="4" fill="#ffffff" />
            </g>

            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-leg-r' : ''}>
              <rect x="52" y="96" width="10" height="26" fill="#1e293b" />
              <rect x="54" y="104" width="6" height="18" fill="#0f172a" />
              <rect x="50" y="122" width="16" height="6" fill="#dc2626" />
              <rect x="50" y="128" width="18" height="4" fill="#ffffff" />
            </g>

            {/* PIXEL TORSO & HEAD */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-torso' : ''}>
              <rect x="42" y="56" width="16" height="38" fill="#111827" />
              <rect x="48" y="66" width="4" height="14" fill="#f8fafc" />
              <rect x="34" y="56" width="8" height="38" fill="#1d4ed8" />
              <rect x="58" y="56" width="8" height="38" fill="#1d4ed8" />
              <rect x="36" y="54" width="6" height="8" fill="#2563eb" />
              <rect x="58" y="54" width="6" height="8" fill="#2563eb" />
              <rect x="40" y="56" width="4" height="12" fill="#3b82f6" />
              <rect x="56" y="56" width="4" height="12" fill="#3b82f6" />
              <rect x="34" y="92" width="32" height="4" fill="#0f172a" />
              <rect x="48" y="92" width="4" height="4" fill="#fbbf24" />

              <rect x="46" y="48" width="8" height="8" fill="#f59e0b" />
              <rect x="34" y="18" width="32" height="30" fill="#fcd34d" />
              <rect x="30" y="26" width="4" height="8" fill="#f59e0b" />
              <rect x="66" y="26" width="4" height="8" fill="#f59e0b" />

              <rect x="32" y="8" width="36" height="12" fill="#1c1917" />
              <rect x="36" y="2" width="28" height="8" fill="#292524" />
              <rect x="42" y="0" width="16" height="4" fill="#44403c" />
              <rect x="30" y="16" width="6" height="12" fill="#1c1917" />
              <rect x="64" y="16" width="6" height="12" fill="#1c1917" />

              <rect x="38" y="26" width="10" height="8" fill="#0f172a" />
              <rect x="52" y="26" width="10" height="8" fill="#0f172a" />
              <rect x="48" y="28" width="4" height="2" fill="#0f172a" />
              <rect x="40" y="28" width="4" height="2" fill="#60a5fa" />
              <rect x="54" y="28" width="4" height="2" fill="#60a5fa" />

              <rect x="46" y="40" width="8" height="2" fill="#991b1b" />
              <rect x="48" y="42" width="4" height="2" fill="#ffffff" />

              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-arm-l' : ''}>
                <rect x="26" y="58" width="8" height="22" fill="#1d4ed8" />
                <rect x="26" y="80" width="8" height="10" fill="#fcd34d" />
              </g>

              {stage === 'drinking' ? (
                <g style={{ animation: 'drinkPixelBottleTilt 1.2s forwards ease-in-out' }}>
                  <rect x="66" y="58" width="8" height="18" fill="#1d4ed8" />
                  <rect x="64" y="46" width="8" height="14" fill="#fcd34d" />
                  <rect x="48" y="26" width="10" height="22" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <rect x="50" y="32" width="6" height="12" fill="#0284c7" />
                  <rect x="50" y="22" width="6" height="4" fill="#ffffff" />
                </g>
              ) : (
                <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-bottle-r' : ''}>
                  <rect x="66" y="58" width="8" height="20" fill="#1d4ed8" />
                  <rect x="68" y="78" width="8" height="10" fill="#fcd34d" />
                  <rect x="72" y="86" width="6" height="6" fill="#fcd34d" />
                  <rect x="76" y="66" width="10" height="24" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <rect x="78" y="74" width="6" height="14" fill="#0284c7" />
                  <rect x="78" y="62" width="6" height="4" fill="#ffffff" />
                  <rect x="78" y="68" width="2" height="18" fill="#ffffff" opacity="0.75" />
                </g>
              )}
            </g>
          </svg>
        )}

        {/* 2. RETRO 16-BIT PIXEL CUTE GIRL (DORA LOOK) */}
        {gender === 'pixel_girl' && (
          <svg 
            width="145" 
            height="215" 
            viewBox="0 0 100 150" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
            className={`drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] ${
              stage === 'post_drink' ? 'animate-hero-celebrate' : ''
            }`}
          >
            {/* PIXEL LEGS RIG */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-leg-l' : ''}>
              <rect x="38" y="96" width="8" height="24" fill="#fef08a" />
              <rect x="38" y="116" width="8" height="6" fill="#ffffff" />
              <rect x="34" y="122" width="14" height="6" fill="#ec4899" />
              <rect x="34" y="126" width="16" height="3" fill="#ffffff" />
            </g>

            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-leg-r' : ''}>
              <rect x="54" y="96" width="8" height="24" fill="#fef08a" />
              <rect x="54" y="116" width="8" height="6" fill="#ffffff" />
              <rect x="52" y="122" width="14" height="6" fill="#ec4899" />
              <rect x="52" y="126" width="16" height="3" fill="#ffffff" />
            </g>

            {/* BACK LONG WAVY HAIR */}
            <rect x="28" y="18" width="44" height="52" fill="#3f271d" />

            {/* PIXEL TORSO & HEAD */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-torso' : ''}>
              <rect x="44" y="56" width="12" height="32" fill="#ffffff" />
              <rect x="36" y="56" width="8" height="34" fill="#db2777" />
              <rect x="56" y="56" width="8" height="34" fill="#db2777" />
              <rect x="38" y="54" width="6" height="6" fill="#f472b6" />
              <rect x="56" y="54" width="6" height="6" fill="#f472b6" />
              <rect x="34" y="88" width="32" height="12" fill="#1e1b4b" />
              <rect x="36" y="98" width="4" height="2" fill="#312e81" />
              <rect x="44" y="98" width="4" height="2" fill="#312e81" />
              <rect x="52" y="98" width="4" height="2" fill="#312e81" />
              <rect x="60" y="98" width="4" height="2" fill="#312e81" />

              <rect x="46" y="48" width="8" height="8" fill="#fde047" />
              <rect x="34" y="18" width="32" height="30" fill="#fef08a" />

              <rect x="32" y="10" width="36" height="12" fill="#3f271d" />
              <rect x="30" y="18" width="6" height="16" fill="#3f271d" />
              <rect x="64" y="18" width="6" height="16" fill="#3f271d" />
              <rect x="34" y="14" width="32" height="8" fill="#451a03" />

              <rect x="38" y="38" width="4" height="4" fill="#f472b6" />
              <rect x="58" y="38" width="4" height="4" fill="#f472b6" />

              <rect x="38" y="28" width="8" height="8" fill="none" stroke="#0f172a" strokeWidth="2" />
              <rect x="54" y="28" width="8" height="8" fill="none" stroke="#0f172a" strokeWidth="2" />
              <rect x="46" y="31" width="8" height="2" fill="#0f172a" />
              <rect x="41" y="31" width="3" height="3" fill="#0f172a" />
              <rect x="57" y="31" width="3" height="3" fill="#0f172a" />

              <rect x="46" y="42" width="8" height="2" fill="#e11d48" />

              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-arm-l' : ''}>
                <rect x="28" y="58" width="8" height="22" fill="#db2777" />
                <rect x="28" y="80" width="8" height="8" fill="#fef08a" />
              </g>

              {stage === 'drinking' ? (
                <g style={{ animation: 'drinkPixelBottleTilt 1.2s forwards ease-in-out' }}>
                  <rect x="64" y="58" width="8" height="18" fill="#db2777" />
                  <rect x="62" y="46" width="8" height="14" fill="#fef08a" />
                  <rect x="48" y="26" width="10" height="22" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <rect x="50" y="32" width="6" height="12" fill="#0284c7" />
                  <rect x="50" y="22" width="6" height="4" fill="#f472b6" />
                </g>
              ) : (
                <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-pixel-bottle-r' : ''}>
                  <rect x="64" y="58" width="8" height="20" fill="#db2777" />
                  <rect x="66" y="78" width="8" height="10" fill="#fef08a" />
                  <rect x="70" y="86" width="6" height="6" fill="#fef08a" />
                  <rect x="74" y="66" width="10" height="24" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <rect x="76" y="74" width="6" height="14" fill="#0284c7" />
                  <rect x="76" y="62" width="6" height="4" fill="#f472b6" />
                  <rect x="76" y="68" width="2" height="18" fill="#ffffff" opacity="0.75" />
                </g>
              )}
            </g>
          </svg>
        )}

        {/* 1. BOY HERO CHARACTER (Vijay / Suriya Style: Denim Jacket / Black T-Shirt, Sneaker shoes, Water Bottle) */}
        {gender === 'boy' && (
          <svg 
            width="155" 
            height="245" 
            viewBox="0 0 100 240" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] ${
              stage === 'post_drink' ? 'animate-hero-celebrate' : ''
            }`}
          >
            {/* LEGS RIG */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-leg-l' : ''}>
              <rect x="33" y="148" width="13" height="38" rx="5" fill="#141821" stroke="#0a0d14" strokeWidth="1" />
              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-knee-l' : ''}>
                <rect x="34" y="182" width="11" height="38" rx="4.5" fill="#181d29" />
                <path d="M28 218 C28 214 34 212 45 212 L48 218 L48 225 L28 225 Z" fill="#ffffff" />
                <rect x="26" y="222" width="24" height="4" rx="2" fill="#e2e8f0" />
              </g>
            </g>

            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-leg-r' : ''}>
              <rect x="54" y="148" width="13" height="38" rx="5" fill="#141821" stroke="#0a0d14" strokeWidth="1" />
              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-knee-r' : ''}>
                <rect x="55" y="182" width="11" height="38" rx="4.5" fill="#181d29" />
                <path d="M49 218 C49 214 55 212 66 212 L69 218 L69 225 L49 225 Z" fill="#ffffff" />
                <rect x="47" y="222" width="24" height="4" rx="2" fill="#e2e8f0" />
              </g>
            </g>

            {/* TORSO & HERO HEAD */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-torso' : ''}>
              <path d="M34 85 L66 85 L64 152 L36 152 Z" fill="#111317" />
              <path d="M29 82 L44 84 L41 146 L27 142 Z" fill="#2b5282" />
              <path d="M71 82 L56 84 L59 146 L73 142 Z" fill="#2b5282" />
              <polygon points="36,82 45,95 38,98 30,85" fill="#3b699e" />
              <polygon points="64,82 55,95 62,98 70,85" fill="#3b699e" />
              <rect x="35" y="146" width="30" height="6" fill="#08090b" />
              <rect x="46" y="145" width="8" height="8" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />

              {/* Head & Hair */}
              <rect x="44" y="68" width="12" height="18" fill="#e0a982" />
              <rect x="33" y="32" width="34" height="42" rx="14" fill="#f0be97" />
              <path d="M34 54 C34 74 66 74 66 54 C66 68 58 75 50 75 C42 75 34 68 34 54 Z" fill="#241b17" opacity="0.85" />
              <path d="M42 59 C46 57 54 57 58 59 C54 62 46 62 42 59 Z" fill="#1c1411" />
              <path d="M43 62 C45 66 55 66 57 62 Z" fill="#ffffff" stroke="#1c1411" strokeWidth="1" />

              <path d="M37 45 C41 43 45 44 47 46" stroke="#150f0c" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M53 46 C55 44 59 43 63 45" stroke="#150f0c" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="42" cy="50" r="3.5" fill="#150f0c" />
              <circle cx="43" cy="49" r="1.2" fill="#ffffff" />
              <circle cx="58" cy="50" r="3.5" fill="#150f0c" />
              <circle cx="59" cy="49" r="1.2" fill="#ffffff" />

              <path 
                d="M30 38 C28 20 40 12 50 12 C62 12 72 20 70 38 C72 44 71 50 70 52 C65 42 62 40 50 40 C38 40 35 42 30 52 C29 48 29 42 30 38 Z" 
                fill="#1e1612" 
              />

              {/* Arms */}
              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-arm-l' : ''}>
                <path d="M29 86 C21 95 18 112 21 126 L29 124 C27 114 28 100 34 92 Z" fill="#2b5282" />
                <circle cx="23" cy="132" r="5" fill="#f0be97" />
              </g>

              {/* Bottle Arm */}
              {stage === 'drinking' ? (
                <g style={{ animation: 'drinkBottleTilt 1.2s forwards ease-in-out' }}>
                  <path d="M69 88 C76 96 74 110 65 112 L61 106 C66 102 68 94 65 88 Z" fill="#2b5282" />
                  <circle cx="58" cy="65" r="5" fill="#f0be97" />
                  <rect x="46" y="44" width="14" height="34" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" opacity="0.85" />
                  <rect x="48" y="52" width="10" height="14" fill="#38bdf8" />
                  <rect x="49" y="40" width="8" height="5" rx="1.5" fill="#ffffff" stroke="#0369a1" strokeWidth="1" />
                </g>
              ) : (
                <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-bottle-r' : ''}>
                  <path d="M70 86 C77 94 80 106 79 116 L71 115 C72 107 70 98 66 90 Z" fill="#2b5282" />
                  <path d="M74 114 L82 108 L86 114 L78 120 Z" fill="#2b5282" />
                  <circle cx="84" cy="110" r="5" fill="#f0be97" />
                  <rect x="80" y="86" width="12" height="30" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" opacity="0.9" />
                  <rect x="81" y="96" width="10" height="19" rx="1.5" fill="#38bdf8" />
                  <rect x="82" y="82" width="8" height="5" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                </g>
              )}
            </g>
          </svg>
        )}

        {/* 2. GIRL CHARACTER (Chic Stylish Anime/Chibi Girl: Dark Hair, Chic Glasses/Coat, Holding Bottle) */}
        {gender === 'girl' && (
          <svg 
            width="155" 
            height="245" 
            viewBox="0 0 100 240" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] ${
              stage === 'post_drink' ? 'animate-hero-celebrate' : ''
            }`}
          >
            {/* LEGS RIG */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-leg-l' : ''}>
              <rect x="34" y="148" width="11" height="38" rx="4" fill="#1f1824" />
              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-knee-l' : ''}>
                <rect x="35" y="182" width="9.5" height="38" rx="4" fill="#231b29" />
                <path d="M30 218 C30 214 36 212 45 212 L47 218 L47 225 L30 225 Z" fill="#0d0d0d" />
                <rect x="29" y="222" width="20" height="4" rx="2" fill="#e056fd" />
              </g>
            </g>

            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-leg-r' : ''}>
              <rect x="55" y="148" width="11" height="38" rx="4" fill="#1f1824" />
              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-knee-r' : ''}>
                <rect x="56" y="182" width="9.5" height="38" rx="4" fill="#231b29" />
                <path d="M51 218 C51 214 57 212 66 212 L68 218 L68 225 L51 225 Z" fill="#0d0d0d" />
                <rect x="50" y="222" width="20" height="4" rx="2" fill="#e056fd" />
              </g>
            </g>

            {/* BACK LONG FLOWING HAIR */}
            <path 
              d="M24 38 C20 70 18 100 24 130 C27 142 38 146 50 146 C62 146 73 142 76 130 C82 100 80 70 76 38 Z" 
              fill="#261c16" 
            />

            {/* TORSO / STYLISH COAT */}
            <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-torso' : ''}>
              <path d="M29 82 L71 82 L67 152 L33 152 Z" fill="#2c2738" />
              {/* Inner blouse */}
              <polygon points="50,82 43,105 57,105" fill="#fdf4ff" />
              {/* Trench lapels */}
              <polygon points="43,82 50,110 36,98" fill="#1c1824" />
              <polygon points="57,82 50,110 64,98" fill="#201b2a" />
              {/* Belt */}
              <rect x="33" y="120" width="34" height="6" fill="#131018" />
              <rect x="46" y="119" width="8" height="8" rx="1.5" fill="#f59e0b" />

              {/* Head & Face */}
              <rect x="44" y="66" width="12" height="18" fill="#fbd5c0" />
              <rect x="33" y="28" width="34" height="42" rx="14" fill="#fde5d4" />
              <ellipse cx="39" cy="54" rx="4" ry="2" fill="#ff7675" opacity="0.6" />
              <ellipse cx="61" cy="54" rx="4" ry="2" fill="#ff7675" opacity="0.6" />

              {/* Eyes & Glasses */}
              <circle cx="42" cy="48" r="3.2" fill="#1a110b" />
              <circle cx="43" cy="47" r="1.2" fill="#ffffff" />
              <circle cx="58" cy="48" r="3.2" fill="#1a110b" />
              <circle cx="59" cy="47" r="1.2" fill="#ffffff" />
              <path d="M47 56 C48 59 52 59 53 56" stroke="#d63031" strokeWidth="2" strokeLinecap="round" />

              {/* Chic Glasses */}
              <rect x="36" y="42" width="13" height="11" rx="3" fill="none" stroke="#111111" strokeWidth="1.8" />
              <rect x="52" y="42" width="13" height="11" rx="3" fill="none" stroke="#111111" strokeWidth="1.8" />
              <line x1="49" y1="46" x2="52" y2="46" stroke="#111" strokeWidth="1.8" />

              {/* Front Hair Bangs */}
              <path 
                d="M28 32 C30 18 42 14 50 14 C58 14 70 18 72 32 C74 38 73 45 72 50 C66 40 58 38 50 38 C42 38 34 40 28 50 Z" 
                fill="#382920" 
              />

              {/* Left Arm */}
              <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-arm-l' : ''}>
                <path d="M29 84 C21 94 18 110 22 124 L30 122 C27 112 28 98 34 90 Z" fill="#2c2738" />
                <circle cx="24" cy="130" r="4.5" fill="#fde5d4" />
              </g>

              {/* Bottle Arm */}
              {stage === 'drinking' ? (
                <g style={{ animation: 'drinkBottleTilt 1.2s forwards ease-in-out' }}>
                  <path d="M69 86 C76 94 74 108 65 110 L61 104 C66 100 68 92 65 86 Z" fill="#2c2738" />
                  <circle cx="58" cy="65" r="4.5" fill="#fde5d4" />
                  <rect x="46" y="44" width="14" height="34" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" opacity="0.85" />
                  <rect x="48" y="52" width="10" height="14" fill="#38bdf8" />
                  <rect x="49" y="40" width="8" height="5" rx="1.5" fill="#ffffff" stroke="#0369a1" strokeWidth="1" />
                </g>
              ) : (
                <g className={stage === 'walking_in' || stage === 'walking_out' ? 'animate-walk-bottle-r' : ''}>
                  <path d="M70 84 C77 92 80 104 79 114 L71 113 C72 105 70 96 66 88 Z" fill="#2c2738" />
                  <path d="M74 112 L82 106 L86 112 L78 118 Z" fill="#2c2738" />
                  <circle cx="84" cy="108" r="4.5" fill="#fde5d4" />
                  <rect x="80" y="84" width="12" height="30" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" opacity="0.9" />
                  <rect x="81" y="94" width="10" height="19" rx="1.5" fill="#38bdf8" />
                  <rect x="82" y="80" width="8" height="5" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                </g>
              )}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}

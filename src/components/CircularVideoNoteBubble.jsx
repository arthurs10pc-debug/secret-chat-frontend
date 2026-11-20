import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function CircularVideoNoteBubble({
  videoUrl
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration && !isNaN(video.duration)) {
        setProgress(video.currentTime / video.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div 
      onClick={togglePlay}
      className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden cursor-pointer select-none group shadow-[0_10px_30px_rgba(0,0,0,0.6)] my-1 border-2 border-emerald-400/80 bg-black flex items-center justify-center"
      title="Click to play / pause video note"
    >
      {/* SVG PROGRESS RING */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#10b981"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* VIDEO ELEMENT */}
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
        preload="metadata"
      />

      {/* PLAY / PAUSE OVERLAY */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
          <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play size={20} fill="currentColor" className="translate-x-0.5" />
          </div>
        </div>
      )}

      {/* MUTE TOGGLE BADGE */}
      {isPlaying && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-3 right-4 z-30 bg-black/70 hover:bg-black text-white p-1.5 rounded-full shadow border border-white/20 transition-all"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export default function AudioMessageBubble({
  audioUrl,
  isMine
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Playback error:", err);
      });
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newFraction = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = newFraction * duration;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Mock visual waveform bars (WhatsApp style)
  const barHeights = [20, 45, 75, 55, 30, 85, 95, 60, 40, 70, 90, 50, 65, 80, 40, 60, 85, 35, 20];
  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[210px] sm:min-w-[250px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* PLAY / PAUSE BUTTON */}
      <button
        type="button"
        onClick={togglePlayPause}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md cursor-pointer transition-transform active:scale-90 ${
          isMine
            ? 'bg-emerald-500 hover:bg-emerald-400'
            : 'bg-emerald-600 hover:bg-emerald-500'
        }`}
      >
        {isPlaying ? (
          <Pause size={17} fill="currentColor" />
        ) : (
          <Play size={17} fill="currentColor" className="translate-x-0.5" />
        )}
      </button>

      {/* WAVEFORM & TIME */}
      <div className="flex-1 space-y-1">
        <div 
          onClick={handleSeek}
          className="h-7 flex items-center gap-1 cursor-pointer select-none"
        >
          {barHeights.map((h, i) => {
            const barFraction = i / barHeights.length;
            const isFilled = barFraction <= progressPercent;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-colors ${
                  isFilled 
                    ? (isMine ? 'bg-white' : 'bg-emerald-400') 
                    : (isMine ? 'bg-white/30' : 'bg-gray-500/40')
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono">
          <span>{formatTime(currentTime > 0 ? currentTime : duration)}</span>
          <div className="flex items-center gap-1 opacity-70">
            <Mic size={11} />
            <span>Voice Note</span>
          </div>
        </div>
      </div>
    </div>
  );
}

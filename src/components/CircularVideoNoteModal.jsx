import React, { useState, useEffect, useRef } from 'react';
import { X, Check, RotateCw, Video, Camera, Sparkles, Circle, Image as ImageIcon, ShieldAlert } from 'lucide-react';

export default function CircularVideoNoteModal({
  isOpen,
  onClose,
  onSendVideoNote,
  onSendPhoto
}) {
  const [captureMode, setCaptureMode] = useState('photo'); // 'photo' | 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [hasPermission, setHasPermission] = useState(true);
  const [streamError, setStreamError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const nativeCameraRef = useRef(null);
  const nativeGalleryRef = useRef(null);

  // Initialize Camera Stream with robust mobile fallbacks
  const startCamera = async (explicitUserClick = false) => {
    try {
      setStreamError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const isVideo = captureMode === 'video';
      const md = navigator.mediaDevices;
      const legacyGUM = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!md && !legacyGUM) {
        throw new Error("Camera API not supported or secure HTTPS required.");
      }

      let stream = null;
      if (md && md.getUserMedia) {
        const constraintsList = isVideo ? [
          { video: { facingMode: { ideal: facingMode } }, audio: true },
          { video: { facingMode }, audio: true },
          { video: true, audio: true },
          { video: true, audio: false }
        ] : [
          // In photo mode, NEVER request audio to avoid microphone permission rejection!
          { video: { facingMode: { ideal: facingMode } } },
          { video: { facingMode } },
          { video: true }
        ];

        let lastErr = null;
        for (const c of constraintsList) {
          try {
            stream = await md.getUserMedia(c);
            if (stream) break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (!stream && lastErr) throw lastErr;
      } else if (legacyGUM) {
        stream = await new Promise((resolve, reject) => {
          legacyGUM.call(navigator, { video: true, audio: isVideo }, resolve, reject);
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasPermission(true);
      setStreamError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      if (isDenied) {
        setStreamError("Camera permission was not granted yet. Tap 'Ask Permission' below or use your device camera directly.");
      } else {
        setStreamError(err.message || "Camera stream unavailable. Use device camera below.");
      }
      setHasPermission(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      return;
    }

    startCamera();

    return () => {
      cleanupStream();
    };
  }, [isOpen, facingMode, captureMode]);

  const cleanupStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setSeconds(0);
    chunksRef.current = [];
  };

  // Native Camera / Gallery File Picker Handler (Guaranteed 100% on all mobile devices)
  const handleNativeFileSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const photoDataUrl = reader.result;
      if (onSendPhoto) {
        onSendPhoto(photoDataUrl);
      } else if (onSendVideoNote) {
        onSendVideoNote(photoDataUrl);
      }
      cleanupStream();
      onClose();
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // Instant Photo Capture (Instagram 1-click Direct Send)
  const handleCaptureInstantPhoto = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    try {
      setIsFlashing(true);
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 640;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // If user front camera, mirror image for natural selfie
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setTimeout(() => {
        setIsFlashing(false);
        if (onSendPhoto) {
          onSendPhoto(photoDataUrl);
        } else if (onSendVideoNote) {
          onSendVideoNote(photoDataUrl);
        }
        cleanupStream();
        onClose();
      }, 150);
    } catch (err) {
      console.error("Instant photo capture failed:", err);
      setIsFlashing(false);
    }
  };

  // Start Video Recording
  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;

    try {
      chunksRef.current = [];
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 59) {
            handleFinishAndSendVideo();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.error("Failed to start MediaRecorder:", e);
    }
  };

  const handleFinishAndSendVideo = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    mediaRecorderRef.current.onstop = () => {
      const mime = mediaRecorderRef.current?.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mime });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        if (onSendVideoNote) onSendVideoNote(base64data);
        cleanupStream();
        onClose();
      };
      reader.readAsDataURL(blob);
    };

    try {
      mediaRecorderRef.current.stop();
    } catch (e) {}
  };

  const handleShutterClick = () => {
    if (captureMode === 'photo') {
      handleCaptureInstantPhoto();
    } else {
      if (!isRecording) {
        startRecording();
      } else {
        handleFinishAndSendVideo();
      }
    }
  };

  const handleCancel = () => {
    cleanupStream();
    onClose();
  };

  const toggleCameraFacing = () => {
    if (isRecording) return;
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  // SVG Progress calculation for Video (Radius = 100)
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = (seconds / 60);
  const strokeDashoffset = circumference - (progressPercent * circumference);

  return (
    <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      
      {/* WHITE FLASH ANIMATION ON PHOTO CAPTURE */}
      {isFlashing && (
        <div className="fixed inset-0 z-[100000] bg-white animate-in fade-in duration-75 pointer-events-none" />
      )}

      {/* TOP BAR: CLOSE, MODE BADGE, FLIP */}
      <div className="w-full max-w-sm flex items-center justify-between z-20 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
          title="Close Camera"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-1.5 bg-black/60 border border-white/20 px-3 py-1 rounded-full text-xs font-mono font-bold text-white shadow-lg">
          {captureMode === 'video' ? (
            <>
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-gray-400'}`} />
              <span>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
              <span className="text-emerald-400 text-[10px]">VIDEO</span>
            </>
          ) : (
            <>
              <Camera size={13} className="text-amber-400" />
              <span>Camera</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCameraFacing}
          disabled={isRecording}
          className={`w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 ${isRecording ? 'opacity-30 cursor-not-allowed' : ''}`}
          title="Flip Camera (Front/Rear)"
        >
          <RotateCw size={18} />
        </button>
      </div>

      {/* CENTER VIEWFINDER */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-auto">
        {/* PROGRESS RING FOR VIDEO MODE */}
        {captureMode === 'video' && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke={isRecording ? "#ef4444" : "#10b981"}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
        )}

        {/* CIRCULAR / SQUIRCLE VIDEO ELEMENT */}
        <div className={`w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] ${captureMode === 'video' ? 'rounded-full' : 'rounded-3xl'} overflow-hidden bg-black border-2 border-white/25 shadow-2xl relative z-10 transition-all duration-300`}>
          {streamError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#111] space-y-2">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Camera size={18} />
              </div>
              <p className="text-[10px] text-gray-300 leading-tight px-1 font-medium">
                {streamError}
              </p>
              
              <div className="flex flex-col gap-1.5 w-full max-w-[190px]">
                <button
                  type="button"
                  onClick={() => startCamera(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] py-1.5 px-3 rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={12} />
                  <span>Ask Permission (Tap)</span>
                </button>

                <button
                  type="button"
                  onClick={() => nativeCameraRef.current && nativeCameraRef.current.click()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] py-1.5 px-3 rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Camera size={12} />
                  <span>📸 Open Phone Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => nativeGalleryRef.current && nativeGalleryRef.current.click()}
                  className="bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-[10px] py-1 px-2.5 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <span>➕ Choose Gallery</span>
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}
        </div>
      </div>

      {/* BOTTOM CONTROLS & SHUTTER (INSTAGRAM STYLE DIRECT 1-TAP SEND) */}
      <div className="w-full max-w-sm flex flex-col items-center gap-4 z-20 pb-4">
        
        {/* MODE SWITCHER: PHOTO VS VIDEO */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/15 text-xs font-bold text-gray-300">
          <button
            type="button"
            onClick={() => { if (!isRecording) setCaptureMode('photo'); }}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              captureMode === 'photo' ? 'bg-amber-400 text-black shadow font-black' : 'hover:text-white'
            }`}
          >
            <Camera size={13} />
            <span>📸 Photo</span>
          </button>
          <button
            type="button"
            onClick={() => { if (!isRecording) setCaptureMode('video'); }}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              captureMode === 'video' ? 'bg-emerald-500 text-black shadow font-black' : 'hover:text-white'
            }`}
          >
            <Video size={13} />
            <span>🎥 Video</span>
          </button>
        </div>

        {/* CONTROLS ROW: GALLERY + SHUTTER + NATIVE CAMERA */}
        <div className="flex items-center justify-center gap-5 w-full">
          {/* GALLERY BUTTON */}
          <button
            type="button"
            onClick={() => nativeGalleryRef.current && nativeGalleryRef.current.click()}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md border border-white/10"
            title="Upload from Gallery"
          >
            <ImageIcon size={18} />
          </button>

          {/* INSTAGRAM SHUTTER BUTTON */}
          <button
            type="button"
            onClick={handleShutterClick}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-2xl ${
              captureMode === 'photo'
                ? 'border-white bg-white/20 hover:bg-white/40 ring-4 ring-amber-400/50 hover:ring-amber-400'
                : (isRecording 
                    ? 'border-rose-500 bg-rose-600 ring-4 ring-rose-400/70 animate-pulse' 
                    : 'border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/40 ring-4 ring-emerald-400/50')
            }`}
            title={captureMode === 'photo' ? "Capture Photo" : (isRecording ? "Stop & Send Video" : "Record Video")}
          >
            <div className={`rounded-full transition-all ${
              captureMode === 'photo'
                ? 'w-14 h-14 bg-white shadow-inner'
                : (isRecording ? 'w-8 h-8 bg-white rounded-md' : 'w-14 h-14 bg-emerald-400')
            }`} />
          </button>

          {/* DIRECT PHONE CAMERA BUTTON */}
          <button
            type="button"
            onClick={() => nativeCameraRef.current && nativeCameraRef.current.click()}
            className="w-11 h-11 rounded-full bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md border border-emerald-500/40"
            title="Open Phone Camera App"
          >
            <Camera size={18} />
          </button>
        </div>

        <p className="text-[11px] text-gray-400 text-center font-medium">
          {captureMode === 'photo' ? 'Tap shutter to capture & send photo' : (isRecording ? '🔴 Recording... Tap shutter to finish & send' : 'Tap shutter to record video')}
        </p>

      </div>

      {/* HIDDEN INPUTS FOR NATIVE CAMERA AND GALLERY */}
      <input
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeFileSelected}
        className="hidden"
      />
      <input
        ref={nativeGalleryRef}
        type="file"
        accept="image/*"
        onChange={handleNativeFileSelected}
        className="hidden"
      />
    </div>
  );
}

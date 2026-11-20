import React, { useState, useEffect, useRef } from 'react';
import { X, Check, RotateCw, Video, Camera } from 'lucide-react';

export default function CircularVideoNoteModal({
  isOpen,
  onClose,
  onSendVideoNote
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [hasPermission, setHasPermission] = useState(true);
  const [streamError, setStreamError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Initialize Camera Stream
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      return;
    }

    let isMounted = true;
    async function startCamera() {
      try {
        setStreamError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 480 },
            height: { ideal: 480 }
          },
          audio: true
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasPermission(true);

        // Start Recording automatically when camera opens
        startRecording(stream);
      } catch (err) {
        console.error("Camera access error:", err);
        setStreamError("Camera & Microphone access is required for instant video notes.");
        setHasPermission(false);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      cleanupStream();
    };
  }, [isOpen, facingMode]);

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

  const startRecording = (stream) => {
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
            handleFinishAndSend();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.error("Failed to start MediaRecorder:", e);
    }
  };

  const handleFinishAndSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    mediaRecorderRef.current.onstop = () => {
      const mime = mediaRecorderRef.current?.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mime });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        onSendVideoNote(base64data);
        cleanupStream();
        onClose();
      };
      reader.readAsDataURL(blob);
    };

    try {
      mediaRecorderRef.current.stop();
    } catch (e) {}
  };

  const handleCancel = () => {
    cleanupStream();
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  // SVG Progress calculation (Radius = 110, Circumference = 2 * PI * 110 ≈ 691)
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = (seconds / 60);
  const strokeDashoffset = circumference - (progressPercent * circumference);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center space-y-5 max-w-xs w-full text-center">
        
        {/* TOP STATUS */}
        <div className="flex items-center gap-2 bg-black/60 border border-white/20 px-3 py-1 rounded-full text-xs font-mono font-bold text-white shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} / 01:00</span>
          <span className="text-gray-400 text-[10px]">VIDEO NOTE</span>
        </div>

        {/* CIRCULAR VIDEO VIEWFINDER WITH SVG PROGRESS RING */}
        <div className="relative w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center">
          
          {/* PROGRESS RING */}
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
              stroke="#10b981"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* CIRCULAR VIDEO ELEMENT */}
          <div className="w-[196px] h-[196px] sm:w-[208px] sm:h-[208px] rounded-full overflow-hidden bg-black border-2 border-white/20 shadow-2xl relative z-10">
            {streamError ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-xs text-rose-300">
                <Video size={24} className="mb-2 text-rose-400" />
                <p>{streamError}</p>
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

        {/* HELPER TEXT */}
        <p className="text-[11px] text-gray-400 font-medium">
          Instant circular video note (up to 60 sec)
        </p>

        {/* CONTROLS (CANCEL, FLIP, SEND) */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {/* CANCEL */}
          <button
            type="button"
            onClick={handleCancel}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-rose-900/60 text-gray-300 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg"
            title="Cancel"
          >
            <X size={20} />
          </button>

          {/* FLIP CAMERA */}
          <button
            type="button"
            onClick={toggleCameraFacing}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg"
            title="Switch Camera (Front/Back)"
          >
            <RotateCw size={19} />
          </button>

          {/* SEND */}
          <button
            type="button"
            onClick={handleFinishAndSend}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white border-2 border-white/30 flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
            title="Finish & Send Video Note"
          >
            <Check size={26} strokeWidth={3} />
          </button>
        </div>

      </div>
    </div>
  );
}

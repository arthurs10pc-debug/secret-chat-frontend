import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Sparkles, Gift, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SCRATCH_VOUCHERS_POOL } from '../constants';

export default function ScratchCardModal({
  isOpen,
  onClose,
  voucher,
  openerName = 'You',
  onSaveVoucher
}) {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawingRef = useRef(false);

  // Pick voucher if provided, or random item from pool
  const currentVoucher = useMemo(() => {
    if (voucher) return voucher;
    if (SCRATCH_VOUCHERS_POOL && SCRATCH_VOUCHERS_POOL.length > 0) {
      const rnd = SCRATCH_VOUCHERS_POOL[Math.floor(Math.random() * SCRATCH_VOUCHERS_POOL.length)];
      return {
        ...rnd,
        code: rnd.code + '-' + Math.floor(1000 + Math.random() * 9000)
      };
    }
    return {
      id: 'v_random_' + Date.now(),
      title: 'Romantic Movie & Snacks Date 🎬',
      code: 'MOVIE-DATE-' + Math.floor(1000 + Math.random() * 9000),
      description: 'Your choice of movie, warm butter popcorn, and cozy cuddles together!',
      icon: '🎬',
      points: '₹ 75.00',
      category: 'Entertainment'
    };
  }, [voucher, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsRevealed(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Fill with metallic silver-gold foil gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#d4af37');
    grad.addColorStop(0.3, '#f9e79f');
    grad.addColorStop(0.6, '#b7950b');
    grad.addColorStop(1, '#d4af37');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative text on scratch foil
    ctx.fillStyle = '#4a235a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH WITH FINGER ✨', width / 2, height / 2 - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#512e5f';
    ctx.fillText('Scratch to reveal your surprise voucher!', width / 2, height / 2 + 14);

    const checkScratchedPercentage = () => {
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        let transparentPixels = 0;
        const totalPixels = data.length / 4;

        for (let i = 3; i < data.length; i += 16) {
          if (data[i] === 0) transparentPixels++;
        }

        const scratchedRatio = (transparentPixels * 4) / totalPixels;
        if (scratchedRatio > 0.40 && !isRevealed) {
          setIsRevealed(true);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.5 }
            });
          } catch (e) {}
          if (onSaveVoucher && currentVoucher) {
            onSaveVoucher(currentVoucher);
          }
        }
      } catch (e) {}
    };

    const scratch = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2, false);
      ctx.fill();

      checkScratchedPercentage();
    };

    const handleMouseDown = (e) => {
      isDrawingRef.current = true;
      scratch(e.clientX, e.clientY);
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return;
      scratch(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
    };

    const handleTouchStart = (e) => {
      isDrawingRef.current = true;
      if (e.touches && e.touches[0]) {
        scratch(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (!isDrawingRef.current) return;
      if (e.touches && e.touches[0]) {
        scratch(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, isRevealed, currentVoucher, onSaveVoucher]);

  if (!isOpen) return null;

  const handleRevealAll = () => {
    setIsRevealed(true);
    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
    } catch (e) {}
    if (onSaveVoucher && currentVoucher) {
      onSaveVoucher(currentVoucher);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#141414] border-2 border-amber-500/70 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative space-y-3.5 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div className="text-left">
              <h3 className="text-sm font-black text-amber-300">Surprise Scratch Voucher</h3>
              <p className="text-[10px] text-gray-400 font-mono">Cost: 6 Love Points • Saved to Wish Store</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-xl cursor-pointer hover:bg-[#222]"
          >
            <X size={16} />
          </button>
        </div>

        {/* SCRATCH CONTAINER */}
        <div className="relative w-full min-h-[190px] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-inner bg-gradient-to-br from-pink-950/70 via-purple-950/70 to-pink-900/70 flex flex-col items-center justify-center p-3.5 text-center">
          
          {/* SMALL CORNER BADGE: OPENER NAME */}
          <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm border border-amber-400/40 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-amber-300 flex items-center gap-1 shadow">
            <span>👤</span>
            <span>Unlocked by: {openerName}</span>
          </div>

          {/* CATEGORY BADGE */}
          {currentVoucher.category && (
            <div className="absolute top-2 right-2 z-10 bg-purple-900/70 backdrop-blur-sm border border-purple-400/40 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-purple-200 shadow">
              {currentVoucher.category}
            </div>
          )}

          {/* SECRET REVEALED CONTENT UNDERNEATH */}
          <div className="space-y-1.5 select-none pt-4">
            <span className="text-3xl">{currentVoucher.icon || '🎁'}</span>
            <h4 className="text-sm font-black text-white px-2">
              {currentVoucher.title}
            </h4>
            <p className="text-[11px] text-pink-200 leading-snug px-3">
              {currentVoucher.description}
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/60 border border-amber-500/40 px-2 py-0.5 rounded-md">
                CODE: {currentVoucher.code}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                {currentVoucher.points || currentVoucher.value || 'Priceless'}
              </span>
            </div>
          </div>

          {/* SCRATCH-OFF FOIL CANVAS */}
          <canvas
            ref={canvasRef}
            width={340}
            height={190}
            className={`absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-500 ${
              isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />
        </div>

        {/* STATUS & ACTIONS */}
        <div className="space-y-2 pt-1">
          {isRevealed ? (
            <div className="bg-emerald-950/60 border border-emerald-500/60 p-2 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              <span>Saved to Wish Store! Claim anytime together 💖</span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1 text-[11px] text-gray-400">
              <span>Rub finger or mouse to scratch</span>
              <button
                type="button"
                onClick={handleRevealAll}
                className="text-amber-400 hover:text-amber-300 underline font-semibold text-[10px] cursor-pointer"
              >
                Quick Reveal ✨
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black py-2.5 rounded-xl cursor-pointer shadow text-xs transition-all active:scale-95"
            >
              {isRevealed ? 'Done & Saved to Wish Store 🎁' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

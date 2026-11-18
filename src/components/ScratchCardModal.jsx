import React, { useRef, useEffect, useState } from 'react';
import { X, Sparkles, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ScratchCardModal({
  isOpen,
  onClose,
  voucher
}) {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawingRef = useRef(false);

  const defaultVoucher = voucher || {
    title: 'Candlelight Dinner Date 🥂',
    code: 'LOVE-VIP-' + Math.floor(1000 + Math.random() * 9000),
    description: 'A fully organized royal romantic candlelight dinner date with sovereign menu choice!',
    icon: '🥂',
    value: '₹ 250.00'
  };

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
    ctx.fillText('Scratch to reveal your romantic reward!', width / 2, height / 2 + 14);

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
        if (scratchedRatio > 0.45 && !isRevealed) {
          setIsRevealed(true);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.5 }
            });
          } catch (e) {}
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
  }, [isOpen, isRevealed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#141414] border-2 border-amber-500/70 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative space-y-3.5 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div className="text-left">
              <h3 className="text-sm font-black text-amber-300">Romantic Scratch Card</h3>
              <p className="text-[10px] text-gray-400 font-mono">Special Couple Voucher</p>
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
        <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-inner bg-gradient-to-br from-pink-950/60 via-purple-950/60 to-pink-900/60 flex flex-col items-center justify-center p-3 text-center">
          
          {/* SECRET REVEALED CONTENT UNDERNEATH */}
          <div className="space-y-1.5 select-none pointer-events-none">
            <span className="text-3xl">{defaultVoucher.icon || '🎁'}</span>
            <h4 className="text-sm font-black text-white px-2">
              {defaultVoucher.title}
            </h4>
            <p className="text-[11px] text-pink-200 leading-snug px-3">
              {defaultVoucher.description}
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/50 border border-amber-500/40 px-2 py-0.5 rounded-md">
                CODE: {defaultVoucher.code}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                {defaultVoucher.value}
              </span>
            </div>
          </div>

          {/* SCRATCH-OFF FOIL CANVAS */}
          <canvas
            ref={canvasRef}
            width={340}
            height={176}
            className={`absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-500 ${
              isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />
        </div>

        {/* STATUS & ACTIONS */}
        <div className="space-y-2 pt-1">
          {isRevealed ? (
            <div className="bg-emerald-950/60 border border-emerald-500/60 p-2 rounded-xl text-xs font-bold text-emerald-300 animate-pulse">
              🎉 Voucher Unlocked! Take a screenshot & claim anytime!
            </div>
          ) : (
            <p className="text-[11px] text-gray-400">
              Rub your finger or mouse across the gold card to scratch!
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black py-2.5 rounded-xl cursor-pointer shadow text-xs transition-all active:scale-95"
            >
              {isRevealed ? 'Save & Close' : 'Done'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

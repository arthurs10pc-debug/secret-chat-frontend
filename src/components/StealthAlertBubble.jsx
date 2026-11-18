import React from 'react';

export default function StealthAlertBubble({
  incomingAlert,
  handleBubbleDismiss,
  bubbleDimensions,
  bubbleFontSize
}) {
  if (!incomingAlert) return null;

  return (
    <div 
      onClick={handleBubbleDismiss}
      className={`absolute bottom-20 right-6 ${bubbleDimensions} rounded-full cursor-pointer z-50 flex items-center justify-center p-3 text-center transition-all duration-300 transform active:scale-95 animate-bounce shadow-2xl backdrop-blur-md overflow-hidden`}
      style={{
        background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0.25) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.2), inset 0 2px 10px 0 rgba(255, 255, 255, 0.7), inset 0 -4px 10px 0 rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="absolute top-3 left-4 w-5 h-2.5 bg-white/80 rounded-full blur-[0.5px] transform -rotate-45 pointer-events-none" />
      <p className={`${bubbleFontSize} font-medium text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] px-1 overflow-y-auto max-h-[85%] select-none scrollbar-none break-words`}>
        {incomingAlert.text}
      </p>
    </div>
  );
}

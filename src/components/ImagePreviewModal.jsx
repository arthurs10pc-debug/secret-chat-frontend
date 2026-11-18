import React from 'react';
import { Download, X } from 'lucide-react';

export default function ImagePreviewModal({
  dailyPreviewModalImg,
  setDailyPreviewModalImg
}) {
  if (!dailyPreviewModalImg) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 font-sans"
      onClick={() => setDailyPreviewModalImg(null)}
    >
      <div 
        className="relative max-w-2xl w-full bg-[#141414] border border-[#333] rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white flex items-center gap-1.5">
              <span>📸</span>
              <span>Task Proof Photo</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={dailyPreviewModalImg}
              download={`task_proof_${Date.now()}.jpg`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
              title="Download Photo"
            >
              <Download size={14} />
              <span>Download</span>
            </a>
            <button
              type="button"
              onClick={() => setDailyPreviewModalImg(null)}
              className="text-gray-400 hover:text-white p-1 rounded-xl cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center py-4">
          <img 
            src={dailyPreviewModalImg} 
            alt="Proof" 
            className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}

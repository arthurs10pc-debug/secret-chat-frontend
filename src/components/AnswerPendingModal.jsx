import React from 'react';
import { AlertCircle, Download, X, Check } from 'lucide-react';
import { cleanOriginalText } from '../constants';

export default function AnswerPendingModal({
  showPendingModal,
  setShowPendingModal,
  pendingMessages,
  downloadPendingPDF,
  togglePendingFlag
}) {
  if (!showPendingModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#171717] border border-[#2e2e2e] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertCircle size={18} />
            <span>Answer Pending ({pendingMessages.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadPendingPDF}
              title="Export to PDF"
              className="text-gray-400 hover:text-amber-400 p-1 cursor-pointer"
            >
              <Download size={16} />
            </button>
            <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-none">
          {pendingMessages.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-8">
              No pending questions bookmarked.
            </div>
          ) : (
            pendingMessages.map((m, idx) => (
              <div key={idx} className="bg-[#212121] border border-[#2d2d2d] p-3 rounded-xl flex items-start justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                    <span className="text-blue-400">{m.senderRole === 'user' ? 'A' : 'H'}</span>
                    <span>•</span>
                    <span>{m.timeFormatted}</span>
                  </div>
                  <p className="text-gray-200 font-mono select-text line-clamp-3 break-words">
                    {m.isMedia ? "[Encrypted Photo]" : cleanOriginalText(m.text)}
                  </p>
                </div>
                <button 
                  onClick={(e) => togglePendingFlag(e, m)}
                  className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Check size={13} /> Done
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

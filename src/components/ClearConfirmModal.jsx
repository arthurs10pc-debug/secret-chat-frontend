import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

export default function ClearConfirmModal({
  showClearConfirmModal,
  setShowClearConfirmModal,
  clearModalTarget,
  setClearModalTarget,
  activeDoraName,
  handleConfirmClearLedger
}) {
  if (!showClearConfirmModal) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#141414] border-2 border-rose-500/60 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left font-sans animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Clear Love Balance & Passbook</h3>
              <p className="text-[10px] text-gray-400 font-mono">Delete passbook & reset points</p>
            </div>
          </div>
          <button 
            onClick={() => setShowClearConfirmModal(false)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#222] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TARGET SELECTOR PILLS */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Select Target to Clear:</p>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0d0d0d] rounded-xl border border-[#222]">
            <button
              type="button"
              onClick={() => setClearModalTarget('user')}
              className={'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                clearModalTarget === 'user' 
                  ? 'bg-rose-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Dora (User)
            </button>
            <button
              type="button"
              onClick={() => setClearModalTarget('admin')}
              className={'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                clearModalTarget === 'admin' 
                  ? 'bg-amber-600 text-black shadow-md' 
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Darsh (Admin)
            </button>
            <button
              type="button"
              onClick={() => setClearModalTarget('both')}
              className={'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                clearModalTarget === 'both' 
                  ? 'bg-red-700 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Both (All)
            </button>
          </div>
        </div>

        {/* SUMMARY DETAIL CARD */}
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-3.5 space-y-1.5 text-xs">
          <p className="font-bold text-rose-300 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-rose-400 shrink-0" />
            <span>Target: <strong className="text-white underline">{clearModalTarget === 'user' ? activeDoraName : (clearModalTarget === 'admin' ? 'Darsh' : `Both ${activeDoraName} & Darsh`)}</strong></span>
          </p>
          <p className="text-[11px] text-gray-300 leading-relaxed">
            {clearModalTarget === 'user' 
              ? `${activeDoraName}'s Love Balance will be reset to ₹0.00 and all her passbook entries will be deleted. Darsh's points will remain intact.`
              : (clearModalTarget === 'admin'
                ? "Darsh's Love Balance will be reset to ₹0.00 and all his passbook entries will be deleted. Dora's points will remain intact."
                : `Both ${activeDoraName} and Darsh will have their Love Balance reset to ₹0.00 and the entire passbook history will be cleared.`)
            }
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowClearConfirmModal(false)}
            className="bg-[#222] hover:bg-[#2c2c2c] text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClearLedger}
            className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 hover:from-rose-600 hover:to-red-500 text-white text-xs font-black py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-rose-950/60 flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>Yes, Clear Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Check } from 'lucide-react';

export default function WishApprovalModal({
  activeWishApprovalModal,
  handleApproveWishRequest,
  handleDeclineWishRequest
}) {
  if (!activeWishApprovalModal) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#141414] border-2 border-pink-500/70 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-4xl flex items-center justify-center mx-auto shadow-inner">
          {activeWishApprovalModal.wishIcon || '🎁'}
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-pink-400 bg-pink-950/60 border border-pink-700/60 px-3 py-1 rounded-full">
            Incoming Wish Request 💖
          </span>
          <h3 className="text-lg font-black text-white pt-1">
            {activeWishApprovalModal.requesterName} wants to redeem:
          </h3>
          <h4 className="text-base font-bold text-amber-300">
            {activeWishApprovalModal.wishTitle}
          </h4>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {activeWishApprovalModal.wishDesc}
          </p>
          <div className="pt-2">
            <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-xl">
              Cost: ₹ {Number(activeWishApprovalModal.wishCost || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
          Approving will deduct ₹ {Number(activeWishApprovalModal.wishCost || 0).toFixed(2)} from {activeWishApprovalModal.requesterName}'s Love Balance and grant the wish!
        </p>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => handleApproveWishRequest(activeWishApprovalModal)}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs"
          >
            <Check size={16} />
            <span>Approve & Grant 💝</span>
          </button>
          <button
            type="button"
            onClick={() => handleDeclineWishRequest(activeWishApprovalModal)}
            className="bg-[#222] hover:bg-[#2c2c2c] text-gray-400 hover:text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer border border-[#333] transition-all text-xs"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

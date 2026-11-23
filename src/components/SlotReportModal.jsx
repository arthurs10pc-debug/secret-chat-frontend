import React from 'react';
import { X, Check, Clock, Plus, Eye, Trash2, Camera, Image as ImageIcon } from 'lucide-react';

export default function SlotReportModal({
  isOpen,
  onClose,
  slot,
  submission,
  selectedDate,
  role,
  onTriggerUpload,
  onTriggerCamera,
  onTriggerGallery,
  onPreviewImage,
  onApprove,
  onReject,
  onDeleteSubmission,
  isOverdue
}) {
  if (!isOpen || !slot) return null;

  const isParentAdmin = role === 'parent' || role === 'admin';
  const isApproved = submission && submission.status === 'APPROVED';
  const isPending = submission && submission.status === 'PENDING';
  const isRejected = submission && submission.status === 'REJECTED';
  const isMissed = isOverdue && !isApproved;

  // Format date nicely e.g. "Sat, 21 Nov 2026"
  const formatDatePretty = (dStr) => {
    try {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const formattedDate = formatDatePretty(selectedDate);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 transition-colors ${
          isMissed 
            ? 'bg-[#1c080f] border-2 border-rose-500/80 text-rose-100 shadow-rose-950/60' 
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
          isMissed ? 'border-rose-900/60' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${
              isMissed ? 'text-rose-100' : 'text-gray-900'
            }`}>
              {isMissed ? '⏰ Late Routine Task' : 'Daily Routine Task'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMissed 
                ? 'text-rose-400 hover:text-white hover:bg-rose-900/50' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY (ONLY 4 ELEMENTS: TIME/DATE, TAG, TITLE, AND NICHE PLUS BUTTON) */}
        <div className="p-5 space-y-4 overflow-y-auto scrollbar-none text-left">
          
          {/* 1. TIME & DATE BANNER */}
          <div className={`rounded-2xl p-3 flex items-center gap-3 border ${
            isMissed 
              ? 'bg-rose-950/70 border-rose-500/40 text-rose-200' 
              : 'bg-emerald-50/90 border-emerald-300/90 text-emerald-950'
          }`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              isMissed ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isMissed ? <Clock size={18} strokeWidth={2.5} /> : <Check size={18} strokeWidth={3} />}
            </div>
            <div className="min-w-0">
              <div className={`text-sm sm:text-base font-black font-mono tracking-tight ${
                isMissed ? 'text-rose-100' : 'text-emerald-950'
              }`}>
                {slot.timeRange}
              </div>
              <div className={`text-xs font-semibold ${
                isMissed ? 'text-rose-300' : 'text-emerald-700'
              }`}>
                {formattedDate}
              </div>
            </div>
          </div>

          {/* 2. TAG / CATEGORY (TEA, WORKOUT, ETC.) */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 ${
              isMissed 
                ? 'bg-rose-900/60 text-rose-200 border border-rose-500/40' 
                : 'bg-blue-600 text-white'
            }`}>
              <span>🏷️</span>
              <span>{slot.tag || 'Routine Task'}</span>
            </span>

            {/* Reward point pill */}
            <span className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl border ${
              isMissed 
                ? 'bg-rose-950/50 text-rose-300 border-rose-500/30' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}>
              +₹{Number(slot.points || slot.rewardPoints || 2.0).toFixed(2)}
            </span>
          </div>

          {/* 3. TITLE OF THE SLOT */}
          <div className="space-y-1">
            <h4 className={`text-base sm:text-lg font-black leading-snug ${
              isMissed ? 'text-amber-300' : 'text-gray-900'
            }`}>
              {slot.title}
            </h4>
          </div>

          {/* 4. NICHE PLUS (+) BUTTON OR SUBMITTED PROOF */}
          <div className="pt-2">
            {submission && submission.image ? (
              /* IF PROOF IS ALREADY SUBMITTED */
              <div className={`space-y-3 rounded-2xl p-3 border ${
                isMissed ? 'bg-rose-950/40 border-rose-800/50' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <img
                    src={submission.image}
                    alt="Proof"
                    className="w-20 h-20 object-cover rounded-xl border border-gray-300 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                    onClick={() => onPreviewImage && onPreviewImage(submission.image)}
                    title="Click to zoom proof"
                  />
                  <div className="space-y-1 text-xs flex-1 min-w-0">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>📸 Attached Proof</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        isApproved 
                          ? 'bg-emerald-600 text-white' 
                          : isPending 
                            ? 'bg-amber-500 text-black animate-pulse' 
                            : 'bg-rose-600 text-white'
                      }`}>
                        {isApproved ? 'Verified ✓' : (isPending ? 'Under Review ⏳' : 'Retake Needed ❌')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPreviewImage && onPreviewImage(submission.image)}
                      className="text-blue-500 hover:text-blue-600 font-bold text-xs flex items-center gap-1 cursor-pointer pt-0.5"
                    >
                      <Eye size={12} />
                      <span>View Full Image</span>
                    </button>
                  </div>
                </div>

                {/* DORA RETAKE / CHANGE PHOTO (DIRECT CAMERA + GALLERY) */}
                {!isParentAdmin && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wide">
                      Retake Proof Options:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onTriggerCamera) onTriggerCamera(slot.id);
                          else if (onTriggerUpload) onTriggerUpload(slot.id);
                        }}
                        className={`font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                          isMissed 
                            ? 'bg-rose-700 hover:bg-rose-600 text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                        }`}
                      >
                        <Camera size={14} />
                        <span>📸 Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onTriggerGallery) onTriggerGallery(slot.id);
                          else if (onTriggerUpload) onTriggerUpload(slot.id);
                        }}
                        className={`font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border active:scale-95 ${
                          isMissed 
                            ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border-rose-500/40' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                        }`}
                      >
                        <Plus size={14} />
                        <span>➕ Gallery</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* IF NO PROOF SUBMITTED YET: DIRECT CAMERA + GALLERY BUTTONS */
              <div>
                {!isParentAdmin ? (
                  <div className="space-y-2">
                    {/* PRIMARY DIRECT CAMERA BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onTriggerCamera) onTriggerCamera(slot.id);
                        else if (onTriggerUpload) onTriggerUpload(slot.id);
                      }}
                      className={`w-full font-black text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg active:scale-98 transition-all cursor-pointer ${
                        isMissed 
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/50' 
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <Camera size={16} strokeWidth={2.5} />
                      </div>
                      <span>Open Camera (Direct Photo)</span>
                    </button>

                    {/* SECONDARY GALLERY (+) BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onTriggerGallery) onTriggerGallery(slot.id);
                        else if (onTriggerUpload) onTriggerUpload(slot.id);
                      }}
                      className={`w-full font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border active:scale-98 ${
                        isMissed 
                          ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-200 border-rose-500/40' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                      }`}
                    >
                      <Plus size={15} strokeWidth={2.5} />
                      <span>Choose from Gallery (+)</span>
                    </button>
                  </div>
                ) : (
                  <div className={`p-3 rounded-xl text-center text-xs font-semibold ${
                    isMissed ? 'text-rose-300 bg-rose-950/40' : 'text-gray-500 bg-gray-100'
                  }`}>
                    No proof submitted by Dora yet.
                  </div>
                )}
              </div>
            )}

            {/* ADMIN REVIEW ACTIONS (IF PROOF PENDING) */}
            {isParentAdmin && submission && isPending && (
              <div className="mt-3 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 space-y-2">
                <span className="text-xs font-black text-amber-400 block">Admin Action Required:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onApprove) onApprove(submission.id, slot);
                      onClose();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
                  >
                    <Check size={14} />
                    <span>Approve & Grant ❤️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onReject) onReject(submission.id, slot);
                      onClose();
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
                  >
                    <X size={14} />
                    <span>Reject & Retake</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADMIN DELETE & RESET (IF APPROVED) */}
            {isParentAdmin && submission && isApproved && (
              <div className="mt-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-300">✓ Awarded (+₹{submission.pointsAwarded})</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteSubmission) onDeleteSubmission(submission, slot);
                    onClose();
                  }}
                  className="bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                  title="Delete submission and reset slot to empty / missed"
                >
                  <Trash2 size={13} />
                  <span>Delete & Reset Slot</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER WITH CANCEL BUTTON */}
        <div className={`px-5 py-3 border-t flex justify-center ${
          isMissed ? 'border-rose-900/60 bg-rose-950/40' : 'border-gray-100 bg-gray-50/50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-32 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 ${
              isMissed 
                ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700/60' 
                : 'bg-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

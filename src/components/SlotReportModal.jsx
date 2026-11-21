import React, { useState } from 'react';
import { X, Check, Clock, Plus, Eye, Image as ImageIcon, Calendar, Briefcase, FileText, Sparkles, AlertCircle } from 'lucide-react';

export default function SlotReportModal({
  isOpen,
  onClose,
  slot,
  submission,
  selectedDate,
  role,
  onTriggerUpload,
  onPreviewImage,
  onApprove,
  onReject,
  isOverdue
}) {
  const [workDoneNote, setWorkDoneNote] = useState('');

  if (!isOpen || !slot) return null;

  const isParentAdmin = role === 'parent' || role === 'admin';
  const isApproved = submission && submission.status === 'APPROVED';
  const isPending = submission && submission.status === 'PENDING';
  const isRejected = submission && submission.status === 'REJECTED';

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

  // Status label & styling
  const statusLabel = isApproved 
    ? 'Completed' 
    : isPending 
      ? 'Under Review' 
      : isRejected 
        ? 'Rejected (Needs Retake)' 
        : isOverdue 
          ? 'Late (50%)' 
          : 'Pending';

  const statusBg = isApproved
    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
    : isPending
      ? 'bg-amber-50 text-amber-700 border-amber-300'
      : isRejected
        ? 'bg-rose-50 text-rose-700 border-rose-300'
        : isOverdue
          ? 'bg-rose-50 text-rose-700 border-rose-300'
          : 'bg-blue-50 text-blue-700 border-blue-300';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white text-gray-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER (MATCHING USER'S SCREENSHOT 2) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Report</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 overflow-y-auto scrollbar-none text-left">
          {/* TOP GREEN/BLUE TIME & DATE BANNER */}
          <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check size={16} strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-emerald-900 font-mono tracking-tight">
                {slot.timeRange}
              </div>
              <div className="text-xs font-semibold text-emerald-700">
                {formattedDate}
              </div>
            </div>
          </div>

          {/* PROJECT FIELD */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <span>Project</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="w-full bg-white border border-blue-500/70 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-xs">
              {slot.tag || 'Daily Routine Task'}
            </div>
          </div>

          {/* TITLE FIELD (PURPOSE OF THE SLOT - FULLY DISPLAYED) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <span>Title</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="w-full bg-white border border-blue-500/70 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 shadow-xs leading-relaxed">
              {slot.title}
            </div>
          </div>

          {/* WORK DONE & PROOF SECTION */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>Work done</span>
                <span className="text-red-500">*</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {submission && submission.note ? `${submission.note.length}/5000` : `${workDoneNote.length}/5000`}
              </span>
            </label>

            {/* IF SUBMISSION EXISTS: SHOW PHOTO THUMBNAIL & NOTE */}
            {submission && submission.image ? (
              <div className="space-y-2 border border-gray-200 rounded-2xl p-3 bg-gray-50/70">
                <div className="flex items-center gap-3">
                  <img
                    src={submission.image}
                    alt="Proof"
                    className="w-20 h-20 object-cover rounded-xl border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
                    onClick={() => onPreviewImage && onPreviewImage(submission.image)}
                    title="Click to zoom proof"
                  />
                  <div className="space-y-1 text-xs flex-1 min-w-0">
                    <div className="font-bold text-gray-800 flex items-center gap-1">
                      <span>📸 Attached Proof</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isApproved ? 'Verified' : 'Reviewing'}
                      </span>
                    </div>
                    {submission.note && (
                      <p className="text-gray-600 italic line-clamp-2">{submission.note}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => onPreviewImage && onPreviewImage(submission.image)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View Full Image</span>
                    </button>
                  </div>
                </div>

                {/* RETAKE OPTION IF USER WANTS TO UPDATE */}
                {!isParentAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerUpload) onTriggerUpload();
                    }}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <Plus size={14} />
                    <span>Change / Re-upload Photo Proof (+)</span>
                  </button>
                )}
              </div>
            ) : (
              /* IF NO PROOF YET: UPLOAD BUTTON & NOTE */
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={workDoneNote}
                    onChange={(e) => setWorkDoneNote(e.target.value)}
                    placeholder={`Enter details about ${slot.title}...`}
                    className="w-full bg-white border border-blue-500/70 focus:border-blue-600 rounded-xl p-3 text-xs text-gray-900 outline-none resize-none shadow-xs font-medium"
                    maxLength={5000}
                  />
                </div>

                {/* THE "+" BUTTON OPTION TO UPLOAD PROOF */}
                {!isParentAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerUpload) onTriggerUpload();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Plus size={14} />
                    </div>
                    <span>Upload Proof (+)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STATUS FIELD */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <span>Status</span>
              <span className="text-red-500">*</span>
            </label>
            <div className={`w-full border rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs ${statusBg}`}>
              {statusLabel}
            </div>
          </div>

          {/* REMARKS (OPTIONAL) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Remarks (optional)</label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-[11px] text-gray-600 leading-relaxed">
              Task assigned by Darsh: Complete and upload proof before deadline to earn +₹{Number(slot.rewardPoints || 2.0).toFixed(2)} Love Balance reward!
              {submission && submission.adminFeedback && (
                <div className="mt-1 text-rose-600 font-semibold border-t border-gray-200 pt-1">
                  Feedback from Darsh: {submission.adminFeedback}
                </div>
              )}
            </div>
          </div>

          {/* ADMIN APPROVAL ACTIONS */}
          {isParentAdmin && submission && isPending && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2">
              <span className="text-xs font-black text-amber-900 block">Admin Action Required:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onApprove) onApprove(submission.id, slot);
                    onClose();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
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
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
                >
                  <X size={14} />
                  <span>Reject & Retake</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER WITH CANCEL BUTTON (MATCHING USER'S SCREENSHOT 2) */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-32 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Briefcase, X, Clock, Sparkles, Check, ChevronDown, Plus, Calendar } from 'lucide-react';

const QUICK_START_HOURS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'
];

const DURATION_OPTIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1 hr', minutes: 60 },
  { label: '1.5 hr', minutes: 90 },
  { label: '2 hr', minutes: 120 },
  { label: '3 hr', minutes: 180 }
];

const MINUTE_CHIPS = ['00', '15', '30', '45'];

const parseRange = (rangeStr) => {
  if (!rangeStr) return { start: '07:00', end: '08:00' };
  const parts = rangeStr.split('-').map(s => s.trim());
  const norm = (t) => {
    if (!t) return '07:00';
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
    return t;
  };
  return {
    start: norm(parts[0]) || '07:00',
    end: norm(parts[1]) || '08:00'
  };
};

export default function RoutineSlotModal({
  showAddSlotModal,
  handleCancelSlotModal,
  editingSlotId,
  slotFormTitle,
  setSlotFormTitle,
  slotFormTimeRange,
  setSlotFormTimeRange,
  slotFormTag,
  setSlotFormTag,
  slotFormPoints,
  setSlotFormPoints,
  handleSaveSlotForm
}) {
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [isManualInput, setIsManualInput] = useState(false);

  // Sync internal start/end times whenever slotFormTimeRange or modal changes
  useEffect(() => {
    if (showAddSlotModal) {
      if (slotFormTimeRange && slotFormTimeRange.includes('-')) {
        const parsed = parseRange(slotFormTimeRange);
        setStartTime(parsed.start);
        setEndTime(parsed.end);
      } else if (!slotFormTimeRange) {
        setStartTime('07:00');
        setEndTime('08:00');
        setSlotFormTimeRange('07:00 - 08:00');
      }
    }
  }, [showAddSlotModal, slotFormTimeRange, setSlotFormTimeRange]);

  const handleStartChange = (val) => {
    setStartTime(val);
    setSlotFormTimeRange(`${val} - ${endTime}`);
  };

  const handleEndChange = (val) => {
    setEndTime(val);
    setSlotFormTimeRange(`${startTime} - ${val}`);
  };

  const handleStartMinuteClick = (minStr) => {
    const [h] = (startTime || '07:00').split(':');
    const newStart = `${(h || '07').padStart(2, '0')}:${minStr}`;
    setStartTime(newStart);
    setSlotFormTimeRange(`${newStart} - ${endTime}`);
  };

  const handleEndMinuteClick = (minStr) => {
    const [h] = (endTime || '08:00').split(':');
    const newEnd = `${(h || '08').padStart(2, '0')}:${minStr}`;
    setEndTime(newEnd);
    setSlotFormTimeRange(`${startTime} - ${newEnd}`);
  };

  const handleDurationClick = (durationMinutes) => {
    try {
      const [sh, sm] = (startTime || '07:00').split(':').map(Number);
      const totalMinutes = (sh * 60 + sm) + durationMinutes;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      const newEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      setEndTime(newEnd);
      setSlotFormTimeRange(`${startTime} - ${newEnd}`);
    } catch (e) {
      console.error(e);
    }
  };

  const getDurationText = () => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '';
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
      if (hours > 0) return `${hours} hr`;
      return `${mins} mins`;
    } catch (e) {
      return '';
    }
  };

  if (!showAddSlotModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 font-sans"
      onClick={handleCancelSlotModal}
    >
      <div 
        className="bg-[#141414] border border-blue-500/40 rounded-3xl p-4 sm:p-5 w-full max-w-lg shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {editingSlotId ? 'Edit Routine Slot' : 'Add New Routine Slot'}
              </h3>
              <p className="text-[11px] text-gray-400">Configure task timing, points and categories</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelSlotModal}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* 1. SLOT TITLE */}
          <div>
            <label className="text-gray-300 font-bold block mb-1">Slot Title / Routine Task:</label>
            <input
              type="text"
              value={slotFormTitle}
              onChange={(e) => setSlotFormTitle(e.target.value)}
              placeholder="e.g. Morning Workout (10 Squats / Stretch)"
              className="w-full bg-[#0d0d0d] border border-[#2e2e2e] text-white px-3 py-2 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* 2. TIME RANGE SECTION (ZERO MANUAL TYPING REQUIRED) */}
          <div className="bg-[#181818] border border-[#2b2b2b] p-3 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-blue-300 font-black flex items-center gap-1.5">
                <Clock size={14} className="text-blue-400" />
                <span>Slot Timing (Click to Pick - No Typing Needed)</span>
              </label>
              
              <button
                type="button"
                onClick={() => setIsManualInput(!isManualInput)}
                className="text-[10px] text-gray-400 hover:text-blue-300 underline cursor-pointer"
              >
                {isManualInput ? '🕒 Switch to Clock Pickers' : '✏️ Manual Text'}
              </button>
            </div>

            {isManualInput ? (
              <div>
                <input
                  type="text"
                  value={slotFormTimeRange}
                  onChange={(e) => setSlotFormTimeRange(e.target.value)}
                  placeholder="e.g. 08:00 - 09:00"
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-mono text-center font-bold"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* DUAL CLICKABLE TIME INPUTS (START & END) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-400 font-semibold block">Start Time (Click):</span>
                    <div className="relative">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleStartChange(e.target.value)}
                        className="w-full bg-[#0d0d0d] hover:bg-[#111] border border-blue-500/40 hover:border-blue-400 text-white font-mono font-black text-sm px-3 py-2 rounded-xl text-center cursor-pointer outline-none transition-all shadow-inner"
                      />
                    </div>
                    {/* Minute selector chips for Start Time */}
                    <div className="flex items-center gap-1 pt-0.5 justify-center">
                      <span className="text-[9px] text-gray-500 font-bold">Min:</span>
                      {MINUTE_CHIPS.map((min) => (
                        <button
                          key={`start-${min}`}
                          type="button"
                          onClick={() => handleStartMinuteClick(min)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            startTime.endsWith(`:${min}`)
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-[#222] hover:bg-[#2c2c2c] text-gray-400 hover:text-white'
                          }`}
                        >
                          :{min}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-400 font-semibold block">End Time (Click):</span>
                    <div className="relative">
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => handleEndChange(e.target.value)}
                        className="w-full bg-[#0d0d0d] hover:bg-[#111] border border-blue-500/40 hover:border-blue-400 text-white font-mono font-black text-sm px-3 py-2 rounded-xl text-center cursor-pointer outline-none transition-all shadow-inner"
                      />
                    </div>
                    {/* Minute selector chips for End Time */}
                    <div className="flex items-center gap-1 pt-0.5 justify-center">
                      <span className="text-[9px] text-gray-500 font-bold">Min:</span>
                      {MINUTE_CHIPS.map((min) => (
                        <button
                          key={`end-${min}`}
                          type="button"
                          onClick={() => handleEndMinuteClick(min)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            endTime.endsWith(`:${min}`)
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-[#222] hover:bg-[#2c2c2c] text-gray-400 hover:text-white'
                          }`}
                        >
                          :{min}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* QUICK DURATION / SLOT MIN TIME CHIPS */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block">Slot Duration / Min Time:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleDurationClick(opt.minutes)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#1e293b] hover:bg-[#334155] text-blue-300 border border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
                      >
                        +{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QUICK START HOUR SELECTOR CHIPS */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block">1-Tap Start Time:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_START_HOURS.map((hr) => (
                      <button
                        key={hr}
                        type="button"
                        onClick={() => {
                          handleStartChange(hr);
                          // Default +1 hour end
                          const [h, m] = hr.split(':').map(Number);
                          const newEnd = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                          setEndTime(newEnd);
                          setSlotFormTimeRange(`${hr} - ${newEnd}`);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 transition-all cursor-pointer ${
                          startTime === hr
                            ? 'bg-blue-500 text-white shadow'
                            : 'bg-[#222] hover:bg-[#2e2e2e] text-gray-300'
                        }`}
                      >
                        {hr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACTIVE TIME PREVIEW BANNER */}
                <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">Active Slot Range:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                      {slotFormTimeRange || `${startTime} - ${endTime}`}
                    </span>
                    {getDurationText() && (
                      <span className="text-[10px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded font-bold">
                        {getDurationText()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. CATEGORY & REWARD POINTS */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-gray-300 font-bold block mb-1">Category / Tag:</label>
              <select
                value={slotFormTag}
                onChange={(e) => setSlotFormTag(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#2e2e2e] text-white px-3 py-2 rounded-xl outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                <option value="Workout">Workout</option>
                <option value="Juice">Juice</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Water">Water</option>
                <option value="Tea">Tea</option>
                <option value="Dinner">Dinner</option>
                <option value="Steps">Steps</option>
                <option value="Skincare">Skincare</option>
                <option value="Task">Task</option>
              </select>
            </div>

            <div>
              <label className="text-gray-300 font-bold block mb-1">Reward Points (₹):</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={slotFormPoints}
                onChange={(e) => setSlotFormPoints(e.target.value)}
                placeholder="2.0"
                className="w-full bg-[#0d0d0d] border border-[#2e2e2e] text-white px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* MODAL ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#242424]">
          <button
            type="button"
            onClick={handleCancelSlotModal}
            className="bg-[#222] hover:bg-[#2a2a2a] text-gray-300 hover:text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSlotForm}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black py-2.5 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            <span>{editingSlotId ? 'Save Routine Slot' : 'Create Routine Slot'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

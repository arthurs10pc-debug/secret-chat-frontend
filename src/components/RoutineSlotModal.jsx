import React, { useState, useEffect } from 'react';
import { Briefcase, X, Clock, Sparkles, Check, ChevronDown, Plus, Calendar } from 'lucide-react';

const COMMON_PRESETS = [
  { label: 'Morning Workout', range: '08:00 - 09:00', tag: 'Workout', icon: '🌅' },
  { label: 'Detox Juice', range: '09:00 - 10:00', tag: 'Juice', icon: '🥤' },
  { label: 'Heavy Breakfast', range: '10:00 - 11:00', tag: 'Breakfast', icon: '🍳' },
  { label: 'Lunch Care', range: '13:00 - 14:00', tag: 'Lunch', icon: '🍱' },
  { label: 'Hydration Intake', range: '15:30 - 16:30', tag: 'Water', icon: '💧' },
  { label: 'Evening Tea', range: '17:00 - 17:30', tag: 'Tea', icon: '☕' },
  { label: 'Dinner Plate', range: '20:30 - 21:30', tag: 'Dinner', icon: '🥗' },
  { label: '8,000 Steps', range: '22:00 - 22:30', tag: 'Steps', icon: '👟' },
  { label: 'Night Skincare', range: '22:30 - 23:00', tag: 'Skincare', icon: '✨' }
];

const QUICK_START_HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:30', '17:00', '18:30', '20:00', '21:00', '22:00'
];

const parseRange = (rangeStr) => {
  if (!rangeStr) return { start: '08:00', end: '09:00' };
  const parts = rangeStr.split('-').map(s => s.trim());
  const norm = (t) => {
    if (!t) return '08:00';
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
    return t;
  };
  return {
    start: norm(parts[0]) || '08:00',
    end: norm(parts[1]) || '09:00'
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
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [isManualInput, setIsManualInput] = useState(false);

  // Sync internal start/end times whenever slotFormTimeRange or modal changes
  useEffect(() => {
    if (showAddSlotModal) {
      if (slotFormTimeRange && slotFormTimeRange.includes('-')) {
        const parsed = parseRange(slotFormTimeRange);
        setStartTime(parsed.start);
        setEndTime(parsed.end);
      } else if (!slotFormTimeRange) {
        setStartTime('08:00');
        setEndTime('09:00');
        setSlotFormTimeRange('08:00 - 09:00');
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

  const handleAddMinutes = (mins) => {
    if (!startTime) return;
    const [h, m] = startTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const totalMins = (h * 60 + m + mins) % (24 * 60);
    const newH = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const newM = String(totalMins % 60).padStart(2, '0');
    const newEnd = `${newH}:${newM}`;
    setEndTime(newEnd);
    setSlotFormTimeRange(`${startTime} - ${newEnd}`);
  };

  const handleApplyPreset = (preset) => {
    const parsed = parseRange(preset.range);
    setStartTime(parsed.start);
    setEndTime(parsed.end);
    setSlotFormTimeRange(preset.range);
    if (preset.tag && setSlotFormTag) {
      setSlotFormTag(preset.tag);
    }
    if ((!slotFormTitle || !slotFormTitle.trim()) && setSlotFormTitle) {
      setSlotFormTitle(preset.label);
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
                  </div>
                </div>

                {/* DURATION SHORTCUT BUTTONS */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-bold">Quick Duration:</span>
                  {[
                    { label: '+30m', mins: 30 },
                    { label: '+45m', mins: 45 },
                    { label: '+1 hr', mins: 60 },
                    { label: '+1.5 hr', mins: 90 },
                    { label: '+2 hr', mins: 120 }
                  ].map((dur) => (
                    <button
                      key={dur.mins}
                      type="button"
                      onClick={() => handleAddMinutes(dur.mins)}
                      className="bg-white/10 hover:bg-blue-600/60 text-gray-200 hover:text-white px-2 py-0.5 rounded-lg text-[10px] font-bold border border-white/10 transition-all cursor-pointer active:scale-95"
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>

                {/* QUICK START HOUR SELECTOR CHIPS */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block">1-Tap Start Hour:</span>
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

            {/* 1-CLICK POPULAR ROUTINE PRESETS */}
            <div className="space-y-1.5 pt-1 border-t border-[#262626]">
              <span className="text-[10px] text-gray-400 font-bold block">Or Pick a Standard Routine Preset:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {COMMON_PRESETS.map((preset) => {
                  const isCurrent = slotFormTimeRange === preset.range;
                  return (
                    <button
                      key={preset.range}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-blue-900/50 border-blue-400 text-white shadow'
                          : 'bg-[#1e1e1e] hover:bg-[#252525] border-[#2e2e2e] text-gray-300'
                      }`}
                    >
                      <span className="text-sm shrink-0">{preset.icon}</span>
                      <div className="truncate">
                        <div className="font-bold text-[10px] truncate text-white">{preset.label}</div>
                        <div className="text-[9px] font-mono text-gray-400">{preset.range}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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

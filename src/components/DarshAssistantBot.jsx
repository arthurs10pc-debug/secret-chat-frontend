import React, { useState } from 'react';
import { Bot, X, Droplets, Sparkles, Heart, Clock, Play, CheckCircle2 } from 'lucide-react';
import { GLOBAL_ROOM } from '../constants';

export default function DarshAssistantBot({
  role,
  isBotOpen,
  setIsBotOpen,
  botTab = 'buddy',
  setBotTab,
  customMsg,
  setCustomMsg,
  socketRef,
  schedMsg,
  setSchedMsg,
  schedTime1,
  setSchedTime1,
  schedTime2,
  setSchedTime2,
  handleScheduleAlertSubmit,
  handleTriggerBuddyTest,
  buddyIntervalMinutes,
  setBuddyIntervalMinutes
}) {
  const [buddyType, setBuddyType] = useState('water');
  const [buddyCustomText, setBuddyCustomText] = useState('Dora, time to drink water! Stay hydrated & fresh 💧');
  const [buddySongInput, setBuddySongInput] = useState('');
  const [scheduledSuccessMsg, setScheduledSuccessMsg] = useState('');

  if (role !== 'parent') return null;

  const presets = [
    {
      type: 'water',
      label: '💧 Water',
      msg: 'Dora, time to drink water! Stay hydrated & fresh 💧'
    },
    {
      type: 'medicine',
      label: '💊 Medicine',
      msg: "Health Reminder: Don't forget your medicine & vitamins! 💊"
    },
    {
      type: 'stretch',
      label: '🧘 Stretch',
      msg: 'Time for a 5-minute study break! Stretch and relax 🌸'
    },
    {
      type: 'love',
      label: '💖 Sweet',
      msg: 'Darsh Reminder: You are doing amazing today! Keep smiling 💕'
    }
  ];

  const handleSelectPreset = (p) => {
    setBuddyType(p.type);
    setBuddyCustomText(p.msg);
  };

  const handleStartInterval = (mins) => {
    if (setBuddyIntervalMinutes) {
      setBuddyIntervalMinutes(mins);
      setScheduledSuccessMsg(mins ? `Every ${mins} min reminder scheduled!` : 'Interval cleared');
      setTimeout(() => setScheduledSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="absolute bottom-16 right-4 sm:bottom-6 sm:right-6 z-40">
      <button 
        type="button"
        onClick={() => setIsBotOpen(!isBotOpen)}
        className="bg-[#212121] hover:bg-[#2c2c2c] border border-[#333] p-3.5 rounded-full shadow-2xl text-emerald-400 cursor-pointer active:scale-90 transition-transform relative group"
        title="Admin Bot & Mascot Lounge"
      >
        <Bot size={20} />
        {buddyIntervalMinutes > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
        )}
      </button>

      {isBotOpen && (
        <div className="absolute bottom-14 right-0 w-88 max-w-[92vw] bg-[#121212] border border-[#282828] rounded-2xl p-4 shadow-2xl space-y-3 font-sans animate-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center text-xs font-semibold text-white pb-1.5 border-b border-[#222]">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setBotTab('buddy')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  botTab === 'buddy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                Mascot Buddy
              </button>
              <button
                type="button"
                onClick={() => setBotTab('instant')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                  botTab === 'instant' ? 'bg-[#252525] text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                Instant
              </button>
              <button
                type="button"
                onClick={() => setBotTab('schedule')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                  botTab === 'schedule' ? 'bg-[#252525] text-amber-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                Schedule
              </button>
            </div>
            <button 
              type="button"
              onClick={() => setIsBotOpen(false)} 
              className="text-gray-400 hover:text-white p-1 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* TAB 1: ANIMATED MASCOT BUDDY (HYDRATION WATER BUDDY LIKE VIDEO) */}
          {botTab === 'buddy' && (
            <div className="space-y-3 text-left">
              {/* TESTING MODE NOTICE */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
                <span className="text-base shrink-0">🟡</span>
                <div>
                  <span className="font-bold block">Testing Mode (Admin Only):</span>
                  <span>Abhi testing ke liye yeh animation sirf aapki (Admin) screen par aayega. Dora ki screen par kuch nahi dikhega.</span>
                </div>
              </div>

              {/* Action Presets */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Select Reminder Preset:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`text-xs py-1.5 px-2 rounded-xl border text-left flex items-center gap-1.5 font-medium cursor-pointer transition-all ${
                        buddyType === p.type
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-[#181818] text-gray-300 border-[#2a2a2a] hover:bg-[#202020]'
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Speech Text */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Mascot Speech Message:
                </label>
                <textarea 
                  rows={2}
                  value={buddyCustomText}
                  onChange={(e) => setBuddyCustomText(e.target.value)}
                  placeholder="Type message for mascot..."
                  className="w-full bg-[#1a1a1a] text-xs p-2.5 rounded-xl outline-none border border-[#333] text-white resize-none focus:border-emerald-500/50"
                />
              </div>

              {/* Quick Interval Timer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Auto-Interval Schedule:
                  </label>
                  {buddyIntervalMinutes > 0 && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Active: {buddyIntervalMinutes}m
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {[15, 30, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleStartInterval(buddyIntervalMinutes === mins ? 0 : mins)}
                      className={`flex-1 text-[11px] py-1.5 rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                        buddyIntervalMinutes === mins
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : 'bg-[#1a1a1a] text-gray-300 border-[#333] hover:bg-[#252525]'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                  {buddyIntervalMinutes > 0 && (
                    <button
                      type="button"
                      onClick={() => handleStartInterval(0)}
                      className="text-[10px] px-2 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg hover:bg-rose-500/30 cursor-pointer"
                      title="Turn off recurring timer"
                    >
                      Stop
                    </button>
                  )}
                </div>
                {scheduledSuccessMsg && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {scheduledSuccessMsg}
                  </p>
                )}
              </div>

              {/* Optional Custom Song URL */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Optional Song URL (Song badme bata sakte hain, abhi groovy upbeat beat bajegi):
                </label>
                <input
                  type="text"
                  value={buddySongInput}
                  onChange={(e) => setBuddySongInput(e.target.value)}
                  placeholder="Paste audio / song URL (optional)..."
                  className="w-full bg-[#1a1a1a] text-xs p-2 rounded-xl outline-none border border-[#333] text-white focus:border-cyan-500/50"
                />
              </div>

              {/* TEST POPUP BUTTON */}
              <button 
                type="button"
                onClick={() => {
                  if (handleTriggerBuddyTest) {
                    handleTriggerBuddyTest(buddyCustomText, buddyType, buddySongInput);
                    setIsBotOpen(false);
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" />
                <span>Test Hero Walk-In (Song + Walk Animation)</span>
              </button>
            </div>
          )}

          {/* TAB 2: INSTANT ALERT */}
          {botTab === 'instant' && (
            <div className="space-y-2.5">
              <textarea 
                rows={3}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Type instant bubble message..."
                className="w-full bg-[#1e1e1e] text-xs p-2.5 rounded-lg outline-none border border-[#333] text-white resize-none"
              />
              <button 
                type="button"
                onClick={() => {
                  if (customMsg && socketRef.current) {
                    socketRef.current.emit('send_assistant_alert', { room: GLOBAL_ROOM, text: customMsg });
                    setCustomMsg('');
                    setIsBotOpen(false);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-lg font-medium cursor-pointer transition-colors"
              >
                Broadcast Now
              </button>
            </div>
          )}

          {/* TAB 3: SCHEDULE ALERT */}
          {botTab === 'schedule' && (
            <form onSubmit={handleScheduleAlertSubmit} className="space-y-2.5 text-xs text-left">
              <textarea 
                rows={2}
                required
                value={schedMsg}
                onChange={(e) => setSchedMsg(e.target.value)}
                placeholder="Message for bubble alarm..."
                className="w-full bg-[#1e1e1e] text-xs p-2.5 rounded-lg outline-none border border-[#333] text-white resize-none"
              />

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Time Slot 1 (Required)</label>
                <input 
                  type="datetime-local" 
                  required
                  value={schedTime1}
                  onChange={(e) => setSchedTime1(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] text-white p-2 rounded text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Time Slot 2 (Optional Second Alarm)</label>
                <input 
                  type="datetime-local" 
                  value={schedTime2}
                  onChange={(e) => setSchedTime2(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] text-white p-2 rounded text-xs outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs py-2.5 rounded-lg cursor-pointer"
              >
                Schedule Alert
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Bot, X } from 'lucide-react';
import { GLOBAL_ROOM } from '../constants';

export default function DarshAssistantBot({
  role,
  isBotOpen,
  setIsBotOpen,
  botTab,
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
  handleScheduleAlertSubmit
}) {
  if (role !== 'parent') return null;

  return (
    <div className="absolute bottom-16 right-4 sm:bottom-6 sm:right-6 z-40">
      <button 
        onClick={() => setIsBotOpen(!isBotOpen)}
        className="bg-[#212121] hover:bg-[#2c2c2c] border border-[#333] p-3.5 rounded-full shadow-2xl text-emerald-400 cursor-pointer active:scale-90 transition-transform"
      >
        <Bot size={20} />
      </button>

      {isBotOpen && (
        <div className="absolute bottom-14 right-0 w-80 max-w-[90vw] bg-[#121212] border border-[#282828] rounded-2xl p-4 shadow-2xl space-y-3 font-sans animate-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center text-xs font-semibold text-white pb-1 border-b border-[#222]">
            <div className="flex gap-2">
              <button
                onClick={() => setBotTab('instant')}
                className={`px-2 py-0.5 rounded ${botTab === 'instant' ? 'bg-[#252525] text-emerald-400' : 'text-gray-400'}`}
              >
                Instant Alert
              </button>
              <button
                onClick={() => setBotTab('schedule')}
                className={`px-2 py-0.5 rounded ${botTab === 'schedule' ? 'bg-[#252525] text-amber-400' : 'text-gray-400'}`}
              >
                Schedule
              </button>
            </div>
            <button onClick={() => setIsBotOpen(false)} className="text-gray-400 hover:text-white p-1">
              <X size={15} />
            </button>
          </div>

          {botTab === 'instant' ? (
            <div className="space-y-2.5">
              <textarea 
                rows={3}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Type instant bubble message..."
                className="w-full bg-[#1e1e1e] text-xs p-2.5 rounded-lg outline-none border border-[#333] text-white resize-none"
              />
              <button 
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
          ) : (
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

import React from 'react';
import { Briefcase, X } from 'lucide-react';

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
  if (!showAddSlotModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 font-sans"
      onClick={handleCancelSlotModal}
    >
      <div 
        className="bg-[#171717] border border-[#2e2e2e] rounded-3xl p-4 sm:p-5 w-full max-w-md shadow-2xl space-y-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Briefcase size={16} className="text-blue-400" />
            <span>{editingSlotId ? 'Edit Routine Slot' : 'Add New Routine Slot'}</span>
          </h3>
          <button
            type="button"
            onClick={handleCancelSlotModal}
            className="text-gray-400 hover:text-white p-1 rounded-xl cursor-pointer"
            title="Close Modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-gray-300 font-semibold block mb-1">Slot Title:</label>
            <input
              type="text"
              value={slotFormTitle}
              onChange={(e) => setSlotFormTitle(e.target.value)}
              placeholder="e.g. Morning Workout (10 Squats)"
              className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Time Range (e.g. 08:00 - 09:00):</label>
            <input
              type="text"
              value={slotFormTimeRange}
              onChange={(e) => setSlotFormTimeRange(e.target.value)}
              placeholder="e.g. 08:00 - 09:00"
              className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Category / Tag:</label>
              <select
                value={slotFormTag}
                onChange={(e) => setSlotFormTag(e.target.value)}
                className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500"
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
              <label className="text-gray-300 font-semibold block mb-1">Reward Points (₹):</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={slotFormPoints}
                onChange={(e) => setSlotFormPoints(e.target.value)}
                placeholder="2.0"
                className="w-full bg-[#101010] border border-[#333] text-white p-2 rounded-xl outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222]">
          <button
            type="button"
            onClick={handleCancelSlotModal}
            className="bg-[#222] hover:bg-[#2c2c2c] text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSlotForm}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow active:scale-95 transition-all"
          >
            {editingSlotId ? 'Save Changes' : 'Create Slot'}
          </button>
        </div>
      </div>
    </div>
  );
}

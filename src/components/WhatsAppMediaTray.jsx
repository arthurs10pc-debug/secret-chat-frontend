import React, { useState, useEffect } from 'react';
import { Smile, Heart, Image as ImageIcon, Plus, Trash2, Search, X, Sparkles, ExternalLink } from 'lucide-react';

// Built-in Curated WhatsApp Stickers
const DEFAULT_STICKERS = [
  // Love & Romance Stickers
  { id: 'stk_love_1', pack: 'Love', name: 'Heart Hug', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_love_2', pack: 'Love', name: 'Rose Bouquet', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_love_3', pack: 'Love', name: 'Teddy Bear', url: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_love_4', pack: 'Love', name: 'Couple Hands', url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_love_5', pack: 'Love', name: 'Heart Sparkles', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_love_6', pack: 'Love', name: 'Sweet Strawberry', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=160&auto=format&fit=crop&q=80' },

  // Cute Pets & Wholesome Memes
  { id: 'stk_cat_1', pack: 'Pets', name: 'Cute Kitten', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_cat_2', pack: 'Pets', name: 'Puppy Eyes', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_cat_3', pack: 'Pets', name: 'Bunny Love', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_cat_4', pack: 'Pets', name: 'Sleeping Fox', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&auto=format&fit=crop&q=80' },

  // Expressions & Fun
  { id: 'stk_fun_1', pack: 'Fun', name: 'Party Popper', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_fun_2', pack: 'Fun', name: 'Coffee Mug', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_fun_3', pack: 'Fun', name: 'Glowing Stars', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=160&auto=format&fit=crop&q=80' },
  { id: 'stk_fun_4', pack: 'Fun', name: 'Sweet Cupcake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&auto=format&fit=crop&q=80' }
];

const EMOJI_CATEGORIES = [
  {
    name: 'Love & Romance',
    icon: '❤️',
    emojis: ["❤️", "💖", "💕", "💘", "💓", "💞", "🌹", "💋", "🥰", "😍", "😘", "😻", "💑", "👩‍❤️‍👨", "✨", "💌", "💍", "🍫"]
  },
  {
    name: 'Smileys & Feelings',
    icon: '😊',
    emojis: ["😂", "🤣", "😊", "🥹", "🥺", "😇", "😌", "😋", "😜", "🤗", "🤭", "🤫", "🤩", "🥳", "😎", "😏", "😴", "🤤"]
  },
  {
    name: 'Hands & Gestures',
    icon: '👍',
    emojis: ["👍", "👎", "👏", "🙌", "🙏", "🤝", "✌️", "🤞", "🤟", "🤘", "🤙", "👌", "🤌", "🤏", "💪", "🫶", "👋", "🫂"]
  },
  {
    name: 'Cute Animals & Nature',
    icon: '🐱',
    emojis: ["🐱", "🐶", "🐼", "🐨", "🐰", "🐻", "🐣", "🦋", "🌸", "💐", "🌻", "🍓", "🍒", "🍇", "🧁", "🎂", "🍕", "🍔"]
  },
  {
    name: 'Sparkles & Magic',
    icon: '✨',
    emojis: ["🔥", "💯", "🎉", "👑", "⭐", "🌟", "💫", "⚡", "🌙", "☁️", "🌈", "☕", "🍿", "🎵", "🎧", "💎", "🏆", "🎁"]
  }
];

export default function WhatsAppMediaTray({
  isOpen,
  onClose,
  onSelectEmoji,
  onSendSticker
}) {
  const [activeTab, setActiveTab] = useState('emojis'); // 'emojis' | 'stickers' | 'custom'
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [customStickers, setCustomStickers] = useState(() => {
    try {
      const saved = localStorage.getItem('wp_custom_stickers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newStickerUrl, setNewStickerUrl] = useState('');
  const [newStickerName, setNewStickerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleAddCustomSticker = (e) => {
    e.preventDefault();
    if (!newStickerUrl.trim()) return;

    const newStk = {
      id: `custom_${Date.now()}`,
      name: newStickerName.trim() || 'Custom Sticker',
      url: newStickerUrl.trim(),
      isCustom: true
    };

    const updated = [newStk, ...customStickers];
    setCustomStickers(updated);
    try {
      localStorage.setItem('wp_custom_stickers', JSON.stringify(updated));
    } catch (e) {}

    setNewStickerUrl('');
    setNewStickerName('');
    setActiveTab('stickers');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result;
      const newStk = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Sticker',
        url: base64Url,
        isCustom: true
      };
      const updated = [newStk, ...customStickers];
      setCustomStickers(updated);
      try {
        localStorage.setItem('wp_custom_stickers', JSON.stringify(updated));
      } catch (e) {}
      setActiveTab('stickers');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCustomSticker = (id, e) => {
    e.stopPropagation();
    const updated = customStickers.filter(s => s.id !== id);
    setCustomStickers(updated);
    try {
      localStorage.setItem('wp_custom_stickers', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div className="backdrop-blur-3xl bg-[#0c181f]/95 border-t border-white/15 shadow-2xl z-30 flex flex-col h-72 sm:h-80 select-none animate-in slide-in-from-bottom duration-200">
      
      {/* HEADER TABS & CLOSE BUTTON */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 bg-black/30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'emojis'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smile size={14} />
            <span>Emojis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stickers'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles size={14} />
            <span>Stickers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-amber-300 hover:text-amber-200 hover:bg-white/10'
            }`}
            title="Add Custom Stickers from Chrome / Web"
          >
            <Plus size={13} />
            <span>Add from Web</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'emojis' && (
          <div className="space-y-3">
            {/* CATEGORY BAR */}
            <div className="flex items-center gap-1 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
              {EMOJI_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(idx)}
                  className={`text-sm px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                    selectedCategory === idx ? 'bg-white/20 scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={cat.name}
                >
                  <span>{cat.icon}</span>
                </button>
              ))}
            </div>

            {/* EMOJI GRID */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {EMOJI_CATEGORIES[selectedCategory].name}
              </p>
              <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 place-items-center">
                {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="text-2xl p-1.5 rounded-xl hover:bg-white/15 hover:scale-125 transition-all cursor-pointer active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stickers' && (
          <div className="space-y-4">
            {/* MY CUSTOM STICKERS */}
            {customStickers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    ★ My Custom Stickers ({customStickers.length})
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {customStickers.map((stk) => (
                    <div
                      key={stk.id}
                      onClick={() => onSendSticker(stk.url)}
                      className="group relative aspect-square rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-400/50 p-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md"
                      title={stk.name}
                    >
                      <img
                        src={stk.url}
                        alt={stk.name}
                        className="w-full h-full object-contain filter drop-shadow-md rounded-xl"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomSticker(stk.id, e)}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Delete sticker"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CURATED POPULAR STICKERS */}
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                🌸 WhatsApp Love & Expressions
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {DEFAULT_STICKERS.map((stk) => (
                  <div
                    key={stk.id}
                    onClick={() => onSendSticker(stk.url)}
                    className="aspect-square rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-400/60 p-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md"
                    title={`Send ${stk.name} Sticker`}
                  >
                    <img
                      src={stk.url}
                      alt={stk.name}
                      className="w-full h-full object-cover rounded-xl filter drop-shadow-md"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-3 max-w-md mx-auto">
            <div className="text-center space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>Add Stickers from Chrome / Web</span>
              </h4>
              <p className="text-[11px] text-gray-300">
                Chrome ya internet se kisi bhi cute image / sticker ka link paste karein ya device se upload karein.
              </p>
            </div>

            <form onSubmit={handleAddCustomSticker} className="space-y-2.5">
              <input
                type="url"
                value={newStickerUrl}
                onChange={(e) => setNewStickerUrl(e.target.value)}
                placeholder="Paste Image URL (e.g. https://.../sticker.png)"
                className="w-full backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs px-3 py-2 rounded-xl outline-none focus:border-amber-400"
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStickerName}
                  onChange={(e) => setNewStickerName(e.target.value)}
                  placeholder="Sticker Name (optional)"
                  className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs px-3 py-2 rounded-xl outline-none"
                />

                <label className="bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                  <ImageIcon size={14} />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                disabled={!newStickerUrl.trim()}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-40 text-black text-xs font-black py-2 rounded-xl shadow cursor-pointer active:scale-95 transition-all"
              >
                + Save to My Stickers
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

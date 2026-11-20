import React, { useState } from 'react';
import { Smile, Sparkles, Plus, Trash2, X, ExternalLink, Image as ImageIcon } from 'lucide-react';

// Built-in Real Transparent WhatsApp Stickers (High-res transparent vector stickers)
const DEFAULT_STICKERS = [
  // Love & Romance Stickers (Transparent SVG/WebP)
  { id: 'stk_love_1', pack: 'Love', name: 'Love Heart Hug', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Heart-Eyes.png' },
  { id: 'stk_love_2', pack: 'Love', name: 'Heart with Ribbon', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Heart%20with%20Ribbon.png' },
  { id: 'stk_love_3', pack: 'Love', name: 'Couple Kiss', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20Blowing%20a%20Kiss.png' },
  { id: 'stk_love_4', pack: 'Love', name: 'Two Hearts', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Two%20Hearts.png' },
  { id: 'stk_love_5', pack: 'Love', name: 'Bouquet of Roses', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Bouquet.png' },
  { id: 'stk_love_6', pack: 'Love', name: 'Sparkling Heart', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Sparkling%20Heart.png' },
  { id: 'stk_love_7', pack: 'Love', name: 'Teddy Love', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Teddy%20Bear.png' },
  { id: 'stk_love_8', pack: 'Love', name: 'Love Letter', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Love%20Letter.png' },

  // Cute Pets & Kawaii
  { id: 'stk_pet_1', pack: 'Pets', name: 'Smiling Cat', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png' },
  { id: 'stk_pet_2', pack: 'Pets', name: 'Heart Eyes Cat', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Smiling%20Cat%20with%20Heart-Eyes.png' },
  { id: 'stk_pet_3', pack: 'Pets', name: 'Playful Dog', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog%20Face.png' },
  { id: 'stk_pet_4', pack: 'Pets', name: 'Cute Bunny', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit%20Face.png' },
  { id: 'stk_pet_5', pack: 'Pets', name: 'Panda Bear', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Panda.png' },
  { id: 'stk_pet_6', pack: 'Pets', name: 'Fluffy Bear', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Bear.png' },

  // Fun & Memes
  { id: 'stk_fun_1', pack: 'Fun', name: 'Party Popper', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png' },
  { id: 'stk_fun_2', pack: 'Fun', name: 'Fire Flame', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png' },
  { id: 'stk_fun_3', pack: 'Fun', name: '100 Percent', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Hundred%20Points.png' },
  { id: 'stk_fun_4', pack: 'Fun', name: 'Golden Trophy', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png' },
  { id: 'stk_fun_5', pack: 'Fun', name: 'Magic Sparkles', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png' },
  { id: 'stk_fun_6', pack: 'Fun', name: 'Popcorn Snack', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Popcorn.png' }
];

// Comprehensive 300+ Complete Emoji Library
const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Feelings',
    icon: '😀',
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗",
      "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒",
      "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵",
      "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "🥱", "🥺", "😢", "😭", "😤"
    ]
  },
  {
    name: 'Love & Hearts',
    icon: '❤️',
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "💌", "💋", "🫂", "💏", "💑", "👩‍❤️‍👨", "👨‍❤️‍👨", "👩‍❤️‍👩", "💍", "💎", "💐", "🌹", "🥀", "🌺", "🌷",
      "🌸", "💮", "🪷", "🕊️", "🧸", "🍫", "🍓", "🍒", "✨", "💫", "🕯️", "🎀"
    ]
  },
  {
    name: 'Hands & Gestures',
    icon: '👍',
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈",
      "👉", "👆", "🖕", "👇", "☝️", "🫵", "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🤏", "🤌", "✍️", "🤳", "💪",
      "🦵", "🦶", "👂", "👃", "👀", "👁️", "👅", "👄", "🧠", "🫀", "🫁"
    ]
  },
  {
    name: 'Cute Animals & Nature',
    icon: '🐱',
    emojis: [
      "🐱", "🐶", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧",
      "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰",
      "🐢", "🐍", "🦎", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🦈", "🦭", "🐊", "🐆", "🦓"
    ]
  },
  {
    name: 'Food & Sweet Treats',
    icon: '🍕',
    emojis: [
      "🍕", "🍔", "🍟", "🌭", "🍿", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗",
      "🥘", "🍝", "🍜", "🍲", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮",
      "🍭", "🍬", "🍫", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕️", "🍵", "🧃", "🥤", "🧋", "🍎", "🍉", "🍇"
    ]
  },
  {
    name: 'Celebration & Sparkles',
    icon: '🎉',
    emojis: [
      "🎉", "🎊", "🎈", "🎁", "🎀", "🪄", "🪅", "🪆", "🎆", "🎇", "🧨", "✨", "🌟", "⭐️", "💫", "💥", "⚡️", "🔥",
      "🌈", "☀️", "🌙", "⭐", "🎵", "🎶", "🎸", "🎹", "🥁", "🎤", "🎧", "🎮", "🕹️", "🎲", "🎯", "🎳", "🏆", "🥇",
      "🥈", "🥉", "🏅", "🎖️", "⚽️", "🏀", "🏈", "⚾️", "🎾", "🏐", "👑", "🔮"
    ]
  }
];

export default function WhatsAppMediaTray({
  isOpen,
  onClose,
  onSelectEmoji,
  onSendSticker,
  onSelectSticker
}) {
  const handleStickerSend = onSendSticker || onSelectSticker;
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
    } catch (err) {}

    setNewStickerUrl('');
    setNewStickerName('');
    setActiveTab('stickers');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const newStk = {
        id: `custom_file_${Date.now()}`,
        name: file.name.split('.')[0] || 'My Sticker',
        url: dataUrl,
        isCustom: true
      };
      const updated = [newStk, ...customStickers];
      setCustomStickers(updated);
      try {
        localStorage.setItem('wp_custom_stickers', JSON.stringify(updated));
      } catch (err) {}
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
    } catch (err) {}
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
            <span>All Emojis</span>
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
            <div className="flex items-center gap-1.5 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
              {EMOJI_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(idx)}
                  className={`text-sm px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    selectedCategory === idx ? 'bg-white/25 scale-105 shadow text-white font-bold' : 'opacity-60 hover:opacity-100 text-gray-300'
                  }`}
                  title={cat.name}
                >
                  <span>{cat.icon}</span>
                  <span className="text-[11px] hidden sm:inline">{cat.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* EMOJI GRID */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {EMOJI_CATEGORIES[selectedCategory].name} ({EMOJI_CATEGORIES[selectedCategory].emojis.length})
              </p>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 place-items-center">
                {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="text-2xl p-1 rounded-xl hover:bg-white/15 hover:scale-125 transition-all cursor-pointer active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stickers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="font-bold uppercase tracking-wider text-emerald-400">WhatsApp Transparent Stickers</span>
              <span>Tap sticker to send instantly</span>
            </div>

            {/* BUILT-IN & CUSTOM STICKERS GRID */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 place-items-center">
              {[...customStickers, ...DEFAULT_STICKERS].map((stk) => (
                <div
                  key={stk.id}
                  onClick={() => handleStickerSend && handleStickerSend(stk.url)}
                  className="relative group w-20 h-20 p-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 hover:border-emerald-400/50 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md"
                  title={stk.name}
                >
                  <img
                    src={stk.url}
                    alt={stk.name}
                    className="w-14 h-14 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                    loading="lazy"
                  />
                  {stk.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomSticker(stk.id, e)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full text-[9px] opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="Delete custom sticker"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-4 max-w-md mx-auto text-left text-xs">
            <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-2xl space-y-1">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <ExternalLink size={14} /> Add Stickers from Chrome / Web
              </h4>
              <p className="text-[11px] text-gray-300">
                Google Chrome mein koi bhi cute sticker, GIF ya transparent PNG ka image address copy karein aur yahan paste karein.
              </p>
            </div>

            <form onSubmit={handleAddCustomSticker} className="space-y-2.5">
              <div>
                <label className="text-[11px] text-gray-300 font-bold block mb-1">Image URL (from Web / Chrome):</label>
                <input
                  type="url"
                  required
                  value={newStickerUrl}
                  onChange={(e) => setNewStickerUrl(e.target.value)}
                  placeholder="https://example.com/cute-cat.png"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-bold block mb-1">Sticker Name (Optional):</label>
                <input
                  type="text"
                  value={newStickerName}
                  onChange={(e) => setNewStickerName(e.target.value)}
                  placeholder="e.g. Cute Kitty"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-2 rounded-xl text-xs cursor-pointer shadow active:scale-95 transition-all"
                >
                  Save & Add Sticker
                </button>

                <label className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1 border border-white/20 transition-all">
                  <ImageIcon size={14} />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

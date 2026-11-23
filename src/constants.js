// Application Constants & Helper Functions
export const SOCKET_URL = "https://secret-chat-backend-07d0.onrender.com";
export const BACKEND_URL = SOCKET_URL;
export const SECRET_KEY = "StealthMasterKey99";
export const GLOBAL_ROOM = "stealth_master_room";

export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-8vMeAtA5cHmDkJ0d8Q9cW4vG0mJ5M3Q5lK0P8vWq6X5LwG0J7j6W0Yg';

export const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🙏", "👌", "💯", "🤫", "✨"];
export const HOVER_REACTIONS = ["👍", "❤️", "🥰", "😆", "😮", "😢", "➕"];
export const ROMANTIC_REGEX = /[\u2764\u2665\u2763\u2765\u2661\uD83D\uDC93-\uD83D\uDC9F\uD83E\uDDE1\uD83E\uDD0D\uD83E\uDD0E\uD83E\uDEF6\uD83D\uDE18\uD83E\uDD70\uD83D\uDE0D\uD83D\uDC8B\uD83E\uDE75-\uD83E\uDE77\uD83D\uDC8F\uD83D\uDC91\uD83C\uDF39\uD83D\uDC90\uD83E\uDD17]|<3|:heart:|\bdil\b|\bpyaar\b|\blove\b/iu;

export const ARCADE_GAMES = [
  { id: 'ludo', name: 'Ludo (Royal Clash)', desc: '2-Player Real-Time Multiplayer Board Game with Colorful Tokens & Animated 3D Dice' }
];

export const DEFAULT_DAILY_SLOTS = [
  { id: 'slot_1', title: 'Morning Workout (10 Squats / Stretch)', timeRange: '08:00 - 09:00', tag: 'Workout', rewardPoints: 2.0, order: 1, isActive: true },
  { id: 'slot_2', title: 'Healthy Detox Juice / Morning Drink', timeRange: '09:00 - 10:00', tag: 'Juice', rewardPoints: 1.5, order: 2, isActive: true },
  { id: 'slot_3', title: 'Heavy Breakfast (High-Calorie Meal Plate)', timeRange: '10:00 - 11:00', tag: 'Breakfast', rewardPoints: 2.5, order: 3, isActive: true },
  { id: 'slot_4', title: 'Lunch Check-in & Care Update', timeRange: '13:00 - 14:00', tag: 'Lunch', rewardPoints: 2.0, order: 4, isActive: true },
  { id: 'slot_5', title: 'Hydration Milestone (Water Intake)', timeRange: '15:30 - 16:30', tag: 'Water', rewardPoints: 1.0, order: 5, isActive: true },
  { id: 'slot_6', title: 'Evening Tea & Healthy Snack', timeRange: '17:00 - 17:30', tag: 'Tea', rewardPoints: 1.0, order: 6, isActive: true },
  { id: 'slot_7', title: 'High-Protein Dinner Plate', timeRange: '20:30 - 21:30', tag: 'Dinner', rewardPoints: 2.0, order: 7, isActive: true },
  { id: 'slot_8', title: 'Google Fit 8,000 Steps Screenshot', timeRange: '22:00 - 22:30', tag: 'Steps', rewardPoints: 3.0, order: 8, isActive: true },
  { id: 'slot_9', title: 'Night Skin Care Routine & Glow Check', timeRange: '22:30 - 23:00', tag: 'Skincare', rewardPoints: 2.0, order: 9, isActive: true }
];

export const normalizeSlotTimeRange = (slot) => {
  if (!slot || !slot.timeRange) return slot;
  let tr = String(slot.timeRange).trim();
  const lower = ((slot.tag || '') + ' ' + (slot.title || '')).toLowerCase();

  if (lower.includes('dinner') && /^0?8:30\s*-\s*0?9:30/i.test(tr)) {
    tr = '20:30 - 21:30';
  } else if (lower.includes('steps') && /^10:00\s*-\s*10:30/i.test(tr)) {
    tr = '22:00 - 22:30';
  } else if ((lower.includes('night') || lower.includes('skincare')) && /^10:30\s*-\s*11:00/i.test(tr)) {
    tr = '22:30 - 23:00';
  } else if ((lower.includes('lunch') || lower.includes('tifin') || lower.includes('tiffin')) && /^0?1:00\s*-\s*0?2:00/i.test(tr)) {
    tr = '13:00 - 14:00';
  } else if (lower.includes('water') && /^0?3:30\s*-\s*0?4:30/i.test(tr)) {
    tr = '15:30 - 16:30';
  } else if (lower.includes('tea') && /^0?5:00\s*-\s*0?5:30/i.test(tr)) {
    tr = '17:00 - 17:30';
  }

  return { ...slot, timeRange: tr };
};

export const getSlotTimeSortMinutes = (slot) => {
  if (!slot || !slot.timeRange) return 9999;
  try {
    const rawStart = String(slot.timeRange).split('-')[0].trim();
    const isPm = /pm/i.test(slot.timeRange) || /pm/i.test(rawStart);
    const isAm = /am/i.test(slot.timeRange) || /am/i.test(rawStart);

    const m = rawStart.match(/(\d{1,2}):(\d{2})/);
    if (!m) return 9999;
    let h = parseInt(m[1], 10);
    const mins = parseInt(m[2], 10);

    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;

    if (!isPm && !isAm) {
      const lower = ((slot.tag || '') + ' ' + (slot.title || '')).toLowerCase();
      if (lower.includes('dinner') && h < 12) {
        h += 12;
      } else if ((lower.includes('night') || lower.includes('skincare') || lower.includes('steps')) && h < 12) {
        h += 12;
      } else if (lower.includes('tea') && h < 12 && h <= 8) {
        h += 12;
      } else if ((lower.includes('lunch') || lower.includes('tifin') || lower.includes('tiffin')) && h < 12 && h <= 5) {
        h += 12;
      }
    }

    return h * 60 + mins;
  } catch {
    return 9999;
  }
};

export const sortSlotsByTime = (slots) => {
  if (!Array.isArray(slots)) return [];
  return slots
    .map(normalizeSlotTimeRange)
    .sort((a, b) => {
      const diff = getSlotTimeSortMinutes(a) - getSlotTimeSortMinutes(b);
      if (diff !== 0) return diff;
      return (a.order || 0) - (b.order || 0);
    });
};

export const DEFAULT_RECENT_CHATS = [
  "GMB Review Reply",
  "Prashant chotalia",
  "Shiva Pradakshina Meaning",
  "Generate random code",
  "Free Movie Watch Together",
  "Clinic Content Writing",
  "Write Kidney Article",
  "KidneyCure TOPIC",
  "Pest Control in Ahmedabad",
  "Blog Topics ( Pest Control )",
  "MTech Semester Dates",
  "Free Couple Watch Apps",
  "Tablet as Second Screen",
  "Bike Comparison Suggestion",
  "Punjabi Thali Search"
];

export const DEFAULT_LOVE_LEDGER = [];

export const ROMANTIC_WISH_STORE = [
  {
    id: 'wish_voicenote',
    title: 'Voice Note on Demand',
    cost: 20.00,
    icon: '🎙️',
    description: 'A personalized cute voice note with sweet romantic nicknames and compliments on demand.'
  },
  {
    id: 'wish_icecream',
    title: 'Ice Cream / Dessert Treat',
    cost: 30.00,
    icon: '🍦',
    description: 'Guaranteed favorite ice cream flavor or dessert delivered or enjoyed together.'
  },
  {
    id: 'wish_movie',
    title: 'Codex Cinema Movie Choice',
    cost: 50.00,
    icon: '🎬',
    description: 'Full sovereign pick of the next romantic movie or show to stream synchronized together.'
  },
  {
    id: 'wish_custom',
    title: 'Custom Romantic Wish',
    cost: 40.00,
    icon: '✨',
    description: 'Any personal cute favor, romantic request, or surprise granted without hesitation.'
  },
  {
    id: 'wish_dinner',
    title: 'Candlelight Dinner Date',
    cost: 120.00,
    icon: '🥂',
    description: 'A fully planned and organized romantic dinner date with VIP royal couple treatment.'
  }
];

export const LOVE_EARNING_RULES = [
  { sno: 1, task: 'Daily Morning Sweet Text', criteria: 'Send sweet Good Morning message before 9:00 AM', reward: '+2.00' },
  { sno: 2, task: 'Instant Reply', criteria: 'Reply within 30 seconds of incoming message', reward: '+0.50' },
  { sno: 3, task: 'Compliment Drop', criteria: 'Spontaneous, genuine romantic compliment during conversation', reward: '+3.00' },
  { sno: 4, task: 'Meal Check-in', criteria: 'Caring "Had food?" reminder sent before 2:00 PM / 9:00 PM', reward: '+2.00' },
  { sno: 5, task: 'Virtual Hug / Kiss Emoji', criteria: 'Sharing cute romantic emojis, stickers, or kisses in chat', reward: '+0.40' },
  { sno: 6, task: 'Message Reaction (Emoji)', criteria: 'Reacting to incoming messages with cute emoji or heart', reward: '+0.10' },
  { sno: 7, task: 'Romantic Song / Movie Suggestion', criteria: 'Suggesting a quality romantic track or movie to enjoy together', reward: '+5.00' },
  { sno: 8, task: 'Late Night Romantic Paragraph', criteria: 'Writing a heartfelt, emotional paragraph at night before bed', reward: '+1.00' },
  { sno: 9, task: '100% Weekend Availability', criteria: 'Spending dedicated quality time without gaps on weekends', reward: '+10.00' },
  { sno: 10, task: 'Anniversary / Milestone Reminder', criteria: 'Remembering and wishing special date or anniversary in advance', reward: '+15.00' },
  { sno: 11, task: 'Apology without Ego', criteria: 'Promptly apologizing with love and zero ego after misunderstanding', reward: '+5.00' },
  { sno: 12, task: 'Surprise Cute Selfie', criteria: 'Sending a spontaneous smile or cute picture', reward: '+3.00' },
  { sno: 13, task: 'Patient Listening', criteria: 'Listening to full story/rant with empathy without interrupting', reward: '+5.00' },
  { sno: 14, task: 'Future Date Planning', criteria: 'Suggesting and planning a fun upcoming date idea together', reward: '+8.00' }
];

export const LOVE_DEDUCTION_RULES = [
  { sno: 1, infraction: 'Seen & Ignored (Left on Read)', criteria: 'Message seen but left unreplied for more than 1 hour', penalty: '-3.00' },
  { sno: 2, infraction: 'Late Reply / Ghosting', criteria: 'Disappearing for hours without giving prior heads-up', penalty: '-5.00' },
  { sno: 3, infraction: 'Dry Replies ("Hmm", "Ok", "K")', criteria: 'Replying with dry 1-word answers to long sweet messages', penalty: '-2.00' },
  { sno: 4, infraction: 'Fighting / Rudeness', criteria: 'Using harsh tone, anger, or unromantic rudeness in chat', penalty: '-10.00' },
  { sno: 5, infraction: 'Forgetting Special Dates', criteria: 'Forgetting important anniversaries, milestones, or birthdays', penalty: '-20.00' },
  { sno: 6, infraction: 'Sleeping Without "Good Night"', criteria: 'Falling asleep without wishing sweet Good Night', penalty: '-3.00' },
  { sno: 7, infraction: 'Broken Romantic Promise', criteria: 'Cancelling a promised call or romantic activity without reason', penalty: '-8.00' }
];

export const cleanOriginalText = (raw) => {
  if (!raw) return "";
  let cleaned = raw;
  while (cleaned.includes('[⤴') || cleaned.startsWith('⤴')) {
    cleaned = cleaned.replace(/^\[⤴\s*[AH]:\s*"[^"]*"\s*\]\s*/g, '');
    cleaned = cleaned.replace(/^⤴\s*[AH]:\s*"[^"]*"\s*/g, '');
  }
  return cleaned.trim();
};

export const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const SCRATCH_VOUCHERS_POOL = [
  // Deeply Romantic Promises & Dates (Points tuned to easily accessible values)
  { id: 'v_dinner', title: 'Candlelight Dinner Date 🥂', code: 'ROMANCE-DINNER', icon: '🥂', points: '₹ 30.00', category: 'Romantic Date', description: 'A royal candlelight dinner date planned with sovereign menu choice and zero rush.' },
  { id: 'v_drive', title: 'Midnight Long Drive & Ice Cream 🍦', code: 'NIGHT-DRIVE', icon: '🚗', points: '₹ 15.00', category: 'Romantic Date', description: 'Late-night peaceful cruising with romantic songs & your favorite ice cream treat.' },
  { id: 'v_king', title: 'One Full Day Royal VIP Treatment 👑', code: 'ROYAL-TREAT', icon: '👑', points: '₹ 25.00', category: 'Couple VIP', description: 'Zero arguments! Full king/queen pampered treatment all day without question.' },
  { id: 'v_letter', title: 'Handwritten Romantic Love Letter 💌', code: 'LOVE-LETTER', icon: '💌', points: '₹ 8.00', category: 'Emotional Favor', description: 'A handwritten letter listing 10 sweet, candid reasons why you are so precious.' },
  { id: 'v_cuddle', title: 'Unlimited Cuddle & Hugs Pass 🤗', code: 'CUDDLE-PASS', icon: '🤗', points: '₹ 5.00', category: 'Affection', description: 'Instant warm cuddles and forehead kisses on demand whenever you need comfort.' },
  { id: 'v_headmassage', title: 'Relaxing Head Massage & Hair Stroking 💆', code: 'HEAD-MASSAGE', icon: '💆', points: '₹ 10.00', category: 'Care & Comfort', description: '20 minutes of relaxing head massage and loving hair stroking to melt stress.' },
  { id: 'v_dance', title: 'Slow Dance Under Starlight 💃', code: 'STAR-DANCE', icon: '💃', points: '₹ 6.00', category: 'Romantic', description: 'A quiet, sweet slow dance to our favorite track in each other\'s arms.' },
  { id: 'v_voice', title: 'Sweet Voice Note with Nicknames on Demand 🎙️', code: 'VOICE-NOTE', icon: '🎙️', points: '₹ 5.00', category: 'Sweet Audio', description: 'A cute 3-minute voice note overflowing with romantic compliments and nicknames.' },
  { id: 'v_sunset', title: 'Sunset Picnic Date Together 🌅', code: 'SUNSET-PICNIC', icon: '🌅', points: '₹ 15.00', category: 'Romantic Date', description: 'A cute outdoor picnic with snacks, blanket, and watching the sunset together.' },
  { id: 'v_forgive', title: 'Universal Forgiveness / "You Win" Pass 🕊️', code: 'FORGIVE-PASS', icon: '🕊️', points: '₹ 12.00', category: 'Couple Magic', description: 'Play this during any minor disagreement: instantly forgiven with a warm hug & zero ego!' },
  
  // Couple Fun & Bonding
  { id: 'v_movie', title: 'Movie Night (100% Your Choice) 🎬', code: 'MOVIE-PICK', icon: '🎬', points: '₹ 10.00', category: 'Entertainment', description: 'Full sovereign pick of the movie or web series, plus butter popcorn & snacks.' },
  { id: 'v_maggie', title: 'Late Night Maggie & Hot Chai Date 🍜', code: 'MIDNIGHT-CHAI', icon: '🍜', points: '₹ 6.00', category: 'Foodie Favor', description: 'Hot spicy midnight Maggie and special tea made with love and shared together.' },
  { id: 'v_truth', title: 'Truth or Dare - Deep Couple Edition 🎭', code: 'COUPLE-TRUTH', icon: '🎭', points: '₹ 8.00', category: 'Mini-Game', description: 'An intimate 30-minute game of deep romantic questions and cute affectionate dares.' },
  { id: 'v_firstdate', title: 'Recreate Our Very First Date ☕', code: 'RECREATE-DATE', icon: '☕', points: '₹ 20.00', category: 'Nostalgia', description: 'We dress up, relive where we started, and experience that same exciting feeling.' },
  { id: 'v_playlist', title: 'Curated 10-Song Romantic Playlist 🎵', code: 'CUSTOM-PLAYLIST', icon: '🎵', points: '₹ 6.00', category: 'Musical Gift', description: '10 songs handpicked specifically with lyrics that describe our bond.' },
  { id: 'v_outfit', title: 'Matching Couple Outfits for a Day 👕', code: 'MATCH-OUTFIT', icon: '👕', points: '₹ 12.00', category: 'Cute Bonding', description: 'Color-coordinated cute outfits worn proudly together for photos & outings.' },
  { id: 'v_selfie', title: 'Spontaneous Cute Couple Reel / Selfie 📸', code: 'CUTE-SELFIE', icon: '📸', points: '₹ 5.00', category: 'Memories', description: 'Capturing an adorable short memory video or candid aesthetic couple photo.' },
  { id: 'v_nophones', title: '1-Hour "No Phones, Just Us" Intimate Talk 📵', code: 'NO-PHONE-HOUR', icon: '📵', points: '₹ 5.00', category: 'Quality Time', description: 'Phones kept away, holding hands and sharing dreams straight from the heart.' },
  { id: 'v_wishgrant', title: 'Secret Wish Grant (Anything Within Reason) ✨', code: 'WISH-GRANT', icon: '✨', points: '₹ 18.00', category: 'Wildcard', description: 'Redeem for any special request, favor, or cute surprise you can imagine.' },

  // Normal / Everyday Sweet Treats
  { id: 'v_breakfast', title: 'Breakfast in Bed on Weekend 🥐', code: 'BED-BREAKFAST', icon: '🥐', points: '₹ 10.00', category: 'Care Favor', description: 'Wake up relaxed on the weekend to a served breakfast and hot drink in bed.' },
  { id: 'v_chores', title: 'Free Pass from Any Chores for 1 Day 🧹', code: 'CHORE-FREE', icon: '🧹', points: '₹ 8.00', category: 'Helping Hand', description: 'I take full care of whatever task or errand you don\'t feel like doing today.' },
  { id: 'v_dessert', title: 'Favorite Dessert / Bakery Treat Run 🍰', code: 'SWEET-DESSERT', icon: '🍰', points: '₹ 10.00', category: 'Foodie Favor', description: 'Your most craved pastry, brownie, waffle or cake delivered or enjoyed together.' },
  { id: 'v_cafe', title: 'Coffee & Books / Chill Cafe Date ☕', code: 'CAFE-CHILL', icon: '☕', points: '₹ 12.00', category: 'Casual Date', description: 'Peaceful afternoon spent at your favorite cozy cafe sipping coffee and chatting.' },
  { id: 'v_footmassage', title: 'Tired Foot Massage After Long Day 👣', code: 'FOOT-MASSAGE', icon: '👣', points: '₹ 8.00', category: 'Care & Comfort', description: 'Warm water soak followed by a relaxing foot massage to melt away all exhaustion.' },
  { id: 'v_surprise_gift', title: 'Small Mystery Surprise Delivery Gift 📦', code: 'MYSTERY-GIFT', icon: '📦', points: '₹ 15.00', category: 'Surprise', description: 'A cute surprise parcel arriving with something thoughtful to make you smile.' }
];

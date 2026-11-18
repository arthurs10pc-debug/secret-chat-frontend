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
  { id: 'slot_4', title: 'Lunch Check-in & Care Update', timeRange: '01:00 - 02:00', tag: 'Lunch', rewardPoints: 2.0, order: 4, isActive: true },
  { id: 'slot_5', title: 'Hydration Milestone (Water Intake)', timeRange: '03:30 - 04:30', tag: 'Water', rewardPoints: 1.0, order: 5, isActive: true },
  { id: 'slot_6', title: 'Evening Tea & Healthy Snack', timeRange: '05:00 - 05:30', tag: 'Tea', rewardPoints: 1.0, order: 6, isActive: true },
  { id: 'slot_7', title: 'High-Protein Dinner Plate', timeRange: '08:30 - 09:30', tag: 'Dinner', rewardPoints: 2.0, order: 7, isActive: true },
  { id: 'slot_8', title: 'Google Fit 8,000 Steps Screenshot', timeRange: '10:00 - 10:30', tag: 'Steps', rewardPoints: 3.0, order: 8, isActive: true },
  { id: 'slot_9', title: 'Night Skin Care Routine & Glow Check', timeRange: '10:30 - 11:00', tag: 'Skincare', rewardPoints: 2.0, order: 9, isActive: true }
];

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
    cost: 40.00,
    icon: '🍦',
    description: 'Guaranteed favorite ice cream flavor or dessert delivered or enjoyed together.'
  },
  {
    id: 'wish_movie',
    title: 'Codex Cinema Movie Choice',
    cost: 75.00,
    icon: '🎬',
    description: 'Full sovereign pick of the next romantic movie or show to stream synchronized together.'
  },
  {
    id: 'wish_custom',
    title: 'Custom Romantic Wish',
    cost: 120.00,
    icon: '✨',
    description: 'Any personal cute favor, romantic request, or surprise granted without hesitation.'
  },
  {
    id: 'wish_dinner',
    title: 'Candlelight Dinner Date',
    cost: 250.00,
    icon: '🥂',
    description: 'A fully planned and organized romantic dinner date with VIP royal couple treatment.'
  }
];

export const LOVE_EARNING_RULES = [
  { sno: 1, task: 'Daily Morning Sweet Text', criteria: 'Send sweet Good Morning message before 9:00 AM', reward: '+2.00' },
  { sno: 2, task: 'Instant Reply', criteria: 'Reply within 5 minutes of incoming message', reward: '+1.00' },
  { sno: 3, task: 'Compliment Drop', criteria: 'Spontaneous, genuine romantic compliment during conversation', reward: '+3.00' },
  { sno: 4, task: 'Meal Check-in', criteria: 'Caring "Had food?" reminder sent before 2:00 PM / 9:00 PM', reward: '+2.00' },
  { sno: 5, task: 'Virtual Hug / Kiss Emoji', criteria: 'Sharing cute romantic emojis, stickers, or kisses in chat', reward: '+1.00' },
  { sno: 6, task: 'Romantic Song / Movie Suggestion', criteria: 'Suggesting a quality romantic track or movie to enjoy together', reward: '+5.00' },
  { sno: 7, task: 'Late Night Romantic Paragraph', criteria: 'Writing a heartfelt, emotional paragraph at night before bed', reward: '+10.00' },
  { sno: 8, task: '100% Weekend Availability', criteria: 'Spending dedicated quality time without gaps on weekends', reward: '+10.00' },
  { sno: 9, task: 'Anniversary / Milestone Reminder', criteria: 'Remembering and wishing special date or anniversary in advance', reward: '+15.00' },
  { sno: 10, task: 'Apology without Ego', criteria: 'Promptly apologizing with love and zero ego after misunderstanding', reward: '+5.00' },
  { sno: 11, task: 'Surprise Cute Selfie', criteria: 'Sending a spontaneous smile or cute picture', reward: '+3.00' },
  { sno: 12, task: 'Patient Listening', criteria: 'Listening to full story/rant with empathy without interrupting', reward: '+5.00' },
  { sno: 13, task: 'Future Date Planning', criteria: 'Suggesting and planning a fun upcoming date idea together', reward: '+8.00' }
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

import React, { useState, useEffect } from 'react';
import { 
  X, RefreshCw, Trash2, Gift, Filter, ShieldCheck, Sparkles, Calendar, CheckSquare, Square 
} from 'lucide-react';
import { ROMANTIC_WISH_STORE, LOVE_EARNING_RULES, LOVE_DEDUCTION_RULES, SCRATCH_VOUCHERS_POOL } from '../constants';
import ScratchCardModal from './ScratchCardModal';

export default function PassbookModal({
  showLoveBalanceModal,
  setShowLoveBalanceModal,
  displayedLoveBalance,
  formatLoveBalance,
  isParentAdmin,
  activeLbTarget,
  setActiveLbTarget,
  activeDoraName,
  doraNetBalance,
  adminNetBalance,
  loveModalTab,
  setLoveModalTab,
  redeemedWishesList,
  handleManualSectionRefresh,
  refreshingSection,
  cutPointsTotal,
  payoutsTotal,
  redeemedWishesTotal,
  role,
  wishRequests,
  handleApproveWishRequest,
  handleDeclineWishRequest,
  visibleLoveLedger,
  handleOpenClearModal,
  loveSourceFilter,
  setLoveSourceFilter,
  loveStatusFilter,
  setLoveStatusFilter,
  loveDateFrom,
  setLoveDateFrom,
  loveDateTo,
  setLoveDateTo,
  handleDeleteTransaction,
  handleInitiateWishRequest,
  handleToggleWishFulfillment,
  handleLoveBalanceTransaction,
  socketRef
}) {
  const [showScratchModal, setShowScratchModal] = useState(false);
  const [selectedScratchVoucher, setSelectedScratchVoucher] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState([]);

  // Persistent tracking of unlocked scratch vouchers and revealed codes
  const [unlockedVouchers, setUnlockedVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_unlocked_scratch_vouchers');
      const list = saved ? JSON.parse(saved) : [];
      // Deduplicate by normalized title to prevent repeating previously unlocked items
      const seen = new Set();
      const deduped = [];
      for (const item of list) {
        const normKey = (item.title || item.code || '').trim().toLowerCase();
        if (normKey && !seen.has(normKey)) {
          seen.add(normKey);
          deduped.push(item);
        }
      }
      return deduped;
    } catch (e) {
      return [];
    }
  });

  const [revealedCodes, setRevealedCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_revealed_voucher_codes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const isDarsh = isParentAdmin ? (activeLbTarget === 'admin') : (role === 'parent');
  const openerName = isDarsh ? 'Darsh' : (activeDoraName || 'Dora');
  const openerRole = isDarsh ? 'admin' : 'user';
  const currentOpenerBalance = isDarsh ? adminNetBalance : doraNetBalance;

  // Parse entry timestamps and dates strictly into Indian Standard Time (IST / Asia/Kolkata)
  const parseEntryIstInfo = (entry) => {
    const todayIstStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (!entry) {
      return { dateKey: todayIstStr, hour: 12, displayTime: '—', fullKey: `${todayIstStr}_12`, entryMs: 0 };
    }

    // 1. Check if entry.id has a millisecond timestamp (e.g. lb_instant_1763877876123_user or 1763877876123)
    const idMatch = String(entry.id || '').match(/(\d{12,13})/);
    if (idMatch) {
      const ts = Number(idMatch[1]);
      if (!isNaN(ts) && ts > 1600000000000 && ts < 2500000000000) {
        const d = new Date(ts);
        const dateKey = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const hourStr = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', timeZone: 'Asia/Kolkata' });
        const displayTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toLowerCase();
        const hNum = parseInt(hourStr, 10) || 0;
        return { dateKey, hour: hNum, displayTime, fullKey: `${dateKey}_${String(hNum).padStart(2, '0')}`, entryMs: ts };
      }
    }

    const rawEarned = String(entry.earnedAt || '').trim();
    const remarks = String(entry.remarks || '').trim();
    const desc = String(entry.description || '').trim();

    // 2. Check if rawEarned is DD/MM/YYYY, HH:mm:ss (UTC toLocaleString('en-GB') from cloud server)
    const gbMatch = rawEarned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (gbMatch) {
      const [, day, month, year, h, m, s] = gbMatch;
      const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s || 0)));
      const dateKey = utcDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const hourStr = utcDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', timeZone: 'Asia/Kolkata' });
      const displayTime = utcDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toLowerCase();
      const hNum = parseInt(hourStr, 10) || 0;
      return { dateKey, hour: hNum, displayTime, fullKey: `${dateKey}_${String(hNum).padStart(2, '0')}`, entryMs: utcDate.getTime() };
    }

    // 3. Check if rawEarned has YYYY-MM-DD, h:mm am/pm (our IST helper getNowIstEarnedAt)
    const istMatch = rawEarned.match(/^(\d{4}-\d{2}-\d{2}),?\s+([0-9]{1,2}):([0-9]{2})(?::[0-9]{2})?\s*(am|pm)?/i);
    if (istMatch) {
      const dateKey = istMatch[1];
      let hNum = parseInt(istMatch[2], 10);
      const mNum = istMatch[3];
      const ampm = (istMatch[4] || '').toLowerCase();
      if (ampm === 'pm' && hNum < 12) hNum += 12;
      if (ampm === 'am' && hNum === 12) hNum = 0;
      const displayTime = `${istMatch[2]}:${mNum} ${ampm || (hNum >= 12 ? 'pm' : 'am')}`.trim();
      const approxMs = new Date(`${dateKey}T${String(hNum).padStart(2, '0')}:${mNum}:00+05:30`).getTime();
      return { dateKey, hour: hNum, displayTime, fullKey: `${dateKey}_${String(hNum).padStart(2, '0')}`, entryMs: isNaN(approxMs) ? 0 : approxMs };
    }

    // 4. Check if rawEarned is just "HH:mm:ss" (UTC string without date, e.g. "06:04:36")
    const timeUtcMatch = rawEarned.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (timeUtcMatch) {
      const [, h, m] = timeUtcMatch;
      // Add 5 hours 30 mins to convert UTC to IST
      let totalMins = parseInt(h, 10) * 60 + parseInt(m, 10) + 330;
      if (totalMins >= 1440) totalMins -= 1440;
      const istH = Math.floor(totalMins / 60);
      const istM = totalMins % 60;
      const ampm = istH >= 12 ? 'pm' : 'am';
      const h12 = istH % 12 === 0 ? 12 : istH % 12;
      const displayTime = `${h12}:${String(istM).padStart(2, '0')} ${ampm}`;
      const approxMs = new Date(`${todayIstStr}T${String(istH).padStart(2, '0')}:${String(istM).padStart(2, '0')}:00+05:30`).getTime();
      return { dateKey: todayIstStr, hour: istH, displayTime, fullKey: `${todayIstStr}_${String(istH).padStart(2, '0')}`, entryMs: isNaN(approxMs) ? 0 : approxMs };
    }

    // 5. Check if rawEarned is just "h:mm am/pm" (e.g. "11:32 am")
    const time12Match = rawEarned.match(/^([0-9]{1,2}):([0-9]{2})\s*(am|pm)?/i);
    if (time12Match) {
      let hNum = parseInt(time12Match[1], 10);
      const mNum = time12Match[2];
      const ampm = (time12Match[3] || '').toLowerCase();
      if (ampm === 'pm' && hNum < 12) hNum += 12;
      if (ampm === 'am' && hNum === 12) hNum = 0;
      const displayTime = `${time12Match[1]}:${mNum} ${ampm || (hNum >= 12 ? 'pm' : 'am')}`.trim();
      const approxMs = new Date(`${todayIstStr}T${String(hNum).padStart(2, '0')}:${mNum}:00+05:30`).getTime();
      return { dateKey: todayIstStr, hour: hNum, displayTime, fullKey: `${todayIstStr}_${String(hNum).padStart(2, '0')}`, entryMs: isNaN(approxMs) ? 0 : approxMs };
    }

    // 6. Check slot time range from remarks or description (e.g. "10:00 - 11:00" or "(10:00 am - 10:30 am)")
    const slotRangeMatch = (remarks + ' ' + rawEarned + ' ' + desc).match(/\b([0-9]{1,2}):([0-9]{2})\s*(?:-\s*([0-9]{1,2}):([0-9]{2}))?\b/);
    if (slotRangeMatch) {
      let hNum = parseInt(slotRangeMatch[1], 10);
      const slotTimeDisplay = slotRangeMatch[3] ? `${slotRangeMatch[1]}:${slotRangeMatch[2]} - ${slotRangeMatch[3]}:${slotRangeMatch[4]}` : `${slotRangeMatch[1]}:${slotRangeMatch[2]}`;
      const approxMs = new Date(`${todayIstStr}T${String(hNum).padStart(2, '0')}:${slotRangeMatch[2]}:00+05:30`).getTime();
      return { dateKey: todayIstStr, hour: hNum, displayTime: slotTimeDisplay, fullKey: `${todayIstStr}_${String(hNum).padStart(2, '0')}`, entryMs: isNaN(approxMs) ? 0 : approxMs };
    }

    // Fallback: standard date parsing
    const d = new Date(rawEarned);
    if (!isNaN(d.getTime())) {
      const dateKey = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const hourStr = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', timeZone: 'Asia/Kolkata' });
      const displayTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toLowerCase();
      const hNum = parseInt(hourStr, 10) || 0;
      return { dateKey, hour: hNum, displayTime, fullKey: `${dateKey}_${String(hNum).padStart(2, '0')}`, entryMs: d.getTime() };
    }

    return { dateKey: todayIstStr, hour: 12, displayTime: rawEarned || '—', fullKey: `${todayIstStr}_12`, entryMs: 0 };
  };

  const formatDayHeader = (dateKey) => {
    if (!dateKey || dateKey === 'Other') return '📅 Earlier Records';
    try {
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

      const parts = dateKey.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const formatted = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        if (dateKey === todayStr) return `📅 Today • ${formatted}`;
        if (dateKey === yestStr) return `📅 Yesterday • ${formatted}`;
        return `📅 ${formatted}`;
      }
      return `📅 ${dateKey}`;
    } catch (e) {
      return `📅 ${dateKey}`;
    }
  };

  const formatHourRange = (hour24) => {
    const h = Number(hour24) || 0;
    const nextH = (h + 1) % 24;
    const formatH = (val) => {
      const ampm = val >= 12 ? 'PM' : 'AM';
      const h12 = val % 12 === 0 ? 12 : val % 12;
      return `${h12}:00 ${ampm}`;
    };
    return `${formatH(h)} - ${formatH(nextH)}`;
  };

  const formatHourHeader = (fullHourKey) => {
    if (!fullHourKey || fullHourKey.startsWith('Other')) return '🕒 Earlier Records';
    try {
      const [dateKey, hourStr] = fullHourKey.split('_');
      const hourRange = formatHourRange(parseInt(hourStr, 10));

      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

      let dayLabel = dateKey;
      const parts = dateKey.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const formatted = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        if (dateKey === todayStr) dayLabel = 'Today';
        else if (dateKey === yestStr) dayLabel = 'Yesterday';
        else dayLabel = formatted;
      }
      return `🕒 ${dayLabel} • ${hourRange}`;
    } catch (e) {
      return `🕒 ${fullHourKey}`;
    }
  };

  const formatRowTimeOnly = (row) => {
    if (!row) return '—';

    // 1. Try to extract time range or deadline from remarks
    const remarks = String(row.remarks || '').trim();
    const desc = String(row.description || '').trim();

    // Pattern A: "(10:00 am - 10:30 am)" or "(09:00 am)" or "(Before 9:00 AM)"
    const parenTimeMatch = remarks.match(/\((?:(?:Before|After|Around)\s+)?([0-9]{1,2}:[0-9]{2}\s*(?:am|pm|AM|PM)(?:\s*-\s*[0-9]{1,2}:[0-9]{2}\s*(?:am|pm|AM|PM))?)\)/i);
    if (parenTimeMatch && parenTimeMatch[1]) {
      return parenTimeMatch[1].trim();
    }

    // Pattern B: "Before 9:00 AM" or "at 10:30 pm"
    const beforeTimeMatch = remarks.match(/(?:Before|at)\s+([0-9]{1,2}:[0-9]{2}\s*(?:am|pm|AM|PM))/i);
    if (beforeTimeMatch && beforeTimeMatch[1]) {
      return beforeTimeMatch[1].trim();
    }

    // Pattern C: Specific habits fallback
    const lower = (desc + ' ' + remarks).toLowerCase();
    if (lower.includes('morning greeting') || lower.includes('morning sweet text')) {
      return '09:00 am';
    }
    if (lower.includes('good night') || lower.includes('sleeping without')) {
      return '11:00 pm';
    }

    // 2. Extract clean IST time using parseEntryIstInfo
    const istInfo = parseEntryIstInfo(row);
    if (istInfo && istInfo.displayTime && istInfo.displayTime !== '—') {
      return istInfo.displayTime;
    }

    return '10:00 am';
  };

  const handleOpenScratchCard = () => {
    // 1. Minimum 6.00 points required to open
    if (currentOpenerBalance < 6.0) {
      alert(`❌ Insufficient Love Points!\n\nYou need at least 6.00 Love Points to open a Surprise Scratch Card.\nYour current balance: ₹ ${Number(currentOpenerBalance || 0).toFixed(2)}\n\nPlease complete routine habits or sweet care tasks to earn points!`);
      return;
    }

    // 2. Pick random non-repeating voucher from pool
    const pool = (SCRATCH_VOUCHERS_POOL || []);
    let availablePool = pool.filter(v => !revealedCodes.includes(v.code));
    if (availablePool.length === 0) {
      // If all vouchers have been revealed, restart cycle
      availablePool = [...pool];
    }
    const chosen = availablePool[Math.floor(Math.random() * availablePool.length)];

    // 3. Deduct 6.00 points from opener
    if (handleLoveBalanceTransaction) {
      handleLoveBalanceTransaction(
        6.0,
        'debit',
        `🎟️ Opened Surprise Scratch Card: ${chosen.title} (-6.00 pts)`,
        false,
        openerRole,
        {
          title: chosen.title,
          icon: chosen.icon,
          points: chosen.points,
          customId: 'sc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
        }
      );
    }

    // 4. Update revealed codes
    const nextCodes = Array.from(new Set([...revealedCodes, chosen.code]));
    setRevealedCodes(nextCodes);
    try { localStorage.setItem('stealth_revealed_voucher_codes', JSON.stringify(nextCodes)); } catch(e) {}

    // 5. Open Scratch Card Modal
    const cardData = {
      ...chosen,
      openerName: openerName,
      openedAt: new Date().toLocaleString('en-GB')
    };
    setSelectedScratchVoucher(cardData);
    setShowScratchModal(true);
  };

  const handleSaveVoucher = (voucher) => {
    if (!voucher) return;
    const item = {
      id: voucher.id || ('v_' + Date.now()),
      title: voucher.title,
      code: voucher.code,
      description: voucher.description,
      icon: voucher.icon || '🎁',
      points: voucher.points || voucher.value || 'Priceless',
      category: voucher.category || 'Surprise Voucher',
      unlockedBy: voucher.openerName || openerName,
      unlockedAt: voucher.openedAt || new Date().toLocaleString('en-GB'),
      status: 'Active'
    };
    setUnlockedVouchers(prev => {
      if (prev.some(x => (x.code === item.code) || (x.title && item.title && x.title.trim().toLowerCase() === item.title.trim().toLowerCase()))) return prev;
      const updated = [item, ...prev];
      try { localStorage.setItem('stealth_unlocked_scratch_vouchers', JSON.stringify(updated)); } catch(e) {}
      if (socketRef && socketRef.current) {
        socketRef.current.emit('love_balance_action', {
          room: 'global_stealth_chat_sync_channel_v1',
          action: 'SYNC_UNLOCKED_VOUCHERS',
          vouchers: updated,
          senderRole: role || 'admin',
          timestamp: Date.now()
        });
      }
      return updated;
    });
  };

  // Listen for real-time unlocked voucher sync from partner
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setUnlockedVouchers(e.detail);
      }
    };
    window.addEventListener('stealth_unlocked_vouchers_updated', handleSync);
    return () => window.removeEventListener('stealth_unlocked_vouchers_updated', handleSync);
  }, []);

  const handleDeleteSelectedVouchers = () => {
    if (selectedVoucherIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedVoucherIds.length} selected voucher(s) from Wish Store?`)) return;
    const remaining = unlockedVouchers.filter(v => !selectedVoucherIds.includes(v.code) && !selectedVoucherIds.includes(v.id));
    setUnlockedVouchers(remaining);
    setSelectedVoucherIds([]);
    try { localStorage.setItem('stealth_unlocked_scratch_vouchers', JSON.stringify(remaining)); } catch(e) {}
    if (socketRef && socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: 'global_stealth_chat_sync_channel_v1',
        action: 'SYNC_UNLOCKED_VOUCHERS',
        vouchers: remaining,
        senderRole: role || 'admin',
        timestamp: Date.now()
      });
    }
  };

  const handleDeleteSingleVoucher = (vKey) => {
    const remaining = unlockedVouchers.filter(v => v.id !== vKey && v.code !== vKey);
    setUnlockedVouchers(remaining);
    setSelectedVoucherIds(prev => prev.filter(k => k !== vKey));
    try { localStorage.setItem('stealth_unlocked_scratch_vouchers', JSON.stringify(remaining)); } catch(e) {}
    if (socketRef && socketRef.current) {
      socketRef.current.emit('love_balance_action', {
        room: 'global_stealth_chat_sync_channel_v1',
        action: 'SYNC_UNLOCKED_VOUCHERS',
        vouchers: remaining,
        senderRole: role || 'admin',
        timestamp: Date.now()
      });
    }
  };

  const toggleSelectVoucher = (vKey) => {
    setSelectedVoucherIds(prev => 
      prev.includes(vKey) ? prev.filter(k => k !== vKey) : [...prev, vKey]
    );
  };

  const toggleSelectAllVouchers = () => {
    if (selectedVoucherIds.length === unlockedVouchers.length) {
      setSelectedVoucherIds([]);
    } else {
      setSelectedVoucherIds(unlockedVouchers.map(v => v.code || v.id));
    }
  };

  if (!showLoveBalanceModal) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-left">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#222] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
              ₹
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Love Balance</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  displayedLoveBalance < 0 
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800' 
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                }`}>
                  {formatLoveBalance(displayedLoveBalance)}
                </span>
              </h2>
              {isParentAdmin ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setActiveLbTarget('user')}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      activeLbTarget === 'user'
                        ? 'bg-pink-600 text-white border-pink-400 shadow'
                        : 'bg-[#222] text-gray-400 border-[#333] hover:text-white'
                    }`}
                  >
                    💕 {activeDoraName} ({formatLoveBalance(doraNetBalance)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLbTarget('admin')}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      activeLbTarget === 'admin'
                        ? 'bg-blue-600 text-white border-blue-400 shadow'
                        : 'bg-[#222] text-gray-400 border-[#333] hover:text-white'
                    }`}
                  >
                    👑 Darsh ({formatLoveBalance(adminNetBalance)})
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-pink-300 mt-0.5">{activeDoraName}'s Romantic Passbook & Wish Store</p>
              )}
            </div>
          </div>

          {/* TAB BUTTONS & CLOSE */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-[#1f1f1f] border border-[#2e2e2e] p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                onClick={() => setLoveModalTab('passbook')}
                className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer ' + (
                  loveModalTab === 'passbook' ? 'bg-blue-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                )}
              >
                Passbook Ledger
              </button>
              <button
                onClick={() => setLoveModalTab('redeem')}
                className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer ' + (
                  loveModalTab === 'redeem' ? 'bg-pink-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                )}
              >
                Wish Store
              </button>
              <button
                onClick={() => setLoveModalTab('claimed')}
                className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ' + (
                  loveModalTab === 'claimed' ? 'bg-amber-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                )}
              >
                <span>Redeemed Wishes</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded font-mono font-bold">
                  {redeemedWishesList.length}
                </span>
              </button>
              <button
                onClick={() => setLoveModalTab('rules')}
                className={'px-3 py-1.5 rounded-lg transition-all cursor-pointer ' + (
                  loveModalTab === 'rules' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                )}
              >
                Love Policy
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleManualSectionRefresh('passbook_modal')}
              className="w-8 h-8 rounded-full bg-[#1e1e1e] hover:bg-emerald-600/30 border border-[#333] hover:border-emerald-500 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Force Refresh & Sync with Server"
            >
              <RefreshCw size={14} className={refreshingSection === 'passbook_modal' ? 'animate-spin text-emerald-400' : ''} />
            </button>

            <button
              onClick={() => setShowLoveBalanceModal(false)}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#222] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MOBILE TAB BAR */}
        <div className="sm:hidden grid grid-cols-4 bg-[#161616] border-b border-[#222] p-1.5 text-[11px] font-semibold gap-1 text-center">
          <button
            onClick={() => setLoveModalTab('passbook')}
            className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
              loveModalTab === 'passbook' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400'
            )}
          >
            Passbook
          </button>
          <button
            onClick={() => setLoveModalTab('redeem')}
            className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
              loveModalTab === 'redeem' ? 'bg-pink-600 text-white font-bold' : 'text-gray-400'
            )}
          >
            Wishes
          </button>
          <button
            onClick={() => setLoveModalTab('claimed')}
            className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
              loveModalTab === 'claimed' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400'
            )}
          >
            Redeemed ({redeemedWishesList.length})
          </button>
          <button
            onClick={() => setLoveModalTab('rules')}
            className={'py-1.5 rounded-lg transition-all cursor-pointer ' + (
              loveModalTab === 'rules' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400'
            )}
          >
            Policy
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          
          {/* TAB 1: PASSBOOK LEDGER */}
          {loveModalTab === 'passbook' && (
            <div className="space-y-4">
              
              {/* DARSH ADMIN SELECTOR */}
              {isParentAdmin && (
                <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#2d2d2d] text-xs font-bold gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveLbTarget('user')}
                    className={'flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ' + (
                      activeLbTarget === 'user' 
                        ? 'bg-pink-600 text-white shadow font-black' 
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    <span>💕 {activeDoraName}</span>
                    <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono">{formatLoveBalance(doraNetBalance)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLbTarget('admin')}
                    className={'flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ' + (
                      activeLbTarget === 'admin' 
                        ? 'bg-blue-600 text-white shadow font-black' 
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    <span>👑 Darsh</span>
                    <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono">{formatLoveBalance(adminNetBalance)}</span>
                  </button>
                </div>
              )}

              {/* 4 TOP SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-sans">
                
                {/* CARD 1: AVAILABLE BALANCE (BLUE) - NEVER NEGATIVE (FLOORED AT 0) */}
                <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-bold tracking-wide">
                      {isParentAdmin ? (activeLbTarget === 'admin' ? "Darsh's Available" : `${activeDoraName}'s Available`) : "Available Balance"}
                    </span>
                    <span className="text-sm">🤝</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono">
                    {formatLoveBalance(Math.max(0, displayedLoveBalance))}
                  </div>
                </div>

                {/* CARD 2: TOTAL CUT POINTS (RED) */}
                <div className="bg-rose-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-bold tracking-wide">Total Cut Points</span>
                    <span className="text-sm">⚖️</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono">
                    -₹ {cutPointsTotal.toFixed(2)}
                  </div>
                </div>

                {/* CARD 3: TOTAL LOVE PAYOUTS (GREEN) */}
                <div className="bg-emerald-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-bold tracking-wide">Total Love Payouts</span>
                    <span className="text-sm">💰</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono">
                    ₹ {payoutsTotal.toFixed(2)}
                  </div>
                </div>

                {/* CARD 4: REDEEMED WISHES (AMBER) */}
                <div className="bg-amber-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-between space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-bold tracking-wide">Redeemed Wishes</span>
                    <span className="text-sm">🎁</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono">
                    ₹ {redeemedWishesTotal.toFixed(2)}
                  </div>
                </div>

              </div>

              {/* PENDING APPROVAL REQUESTS BANNER */}
              {(() => {
                const myRole = role === 'parent' ? 'admin' : 'user';
                const incomingPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole !== myRole);
                const myPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole === myRole);
                if (incomingPendingReqs.length === 0 && myPendingReqs.length === 0) return null;
                return (
                  <div className="bg-[#181818] border border-amber-500/30 rounded-2xl p-3 sm:p-4 space-y-2">
                    {incomingPendingReqs.map(req => (
                      <div key={req.id} className="bg-pink-950/50 border border-pink-500/60 p-3 rounded-xl flex items-center justify-between gap-2 shadow-lg animate-pulse">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{req.wishIcon || '🎁'}</span>
                          <div>
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{req.requesterName} requested: {req.wishTitle}</span>
                              <span className="text-[10px] text-amber-300 font-mono font-bold bg-black/40 px-1.5 py-0.2 rounded">₹ {req.wishCost.toFixed(2)}</span>
                            </h5>
                            <p className="text-[10px] text-pink-300">Awaiting your approval to grant wish & deduct points</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApproveWishRequest(req)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer shadow active:scale-95"
                          >
                            Approve & Grant 💝
                          </button>
                        </div>
                      </div>
                    ))}

                    {myPendingReqs.map(req => (
                      <div key={req.id} className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{req.wishIcon || '🎁'}</span>
                          <span className="text-xs font-bold text-amber-200">
                            Requested: {req.wishTitle} (₹ {req.wishCost.toFixed(2)})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-900/60 border border-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                          ⏳ Awaiting {req.targetName}'s Approval
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ACTION ROW: PASSBOOK HEADER & COMPACT CALENDAR FILTER BUTTON */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#181818] border border-[#282828] p-3 rounded-2xl gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-white">Love Balance Passbook</span>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0">({visibleLoveLedger.length} Records)</span>

                  {/* COMPACT CALENDAR FILTER BUTTON (ZERO CLUTTER) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDateFilter(!showDateFilter)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        loveDateFrom 
                          ? 'bg-blue-600 text-white border-blue-400 shadow' 
                          : 'bg-[#222] hover:bg-[#2c2c2c] text-gray-300 border-[#383838]'
                      }`}
                      title="Filter passbook by specific day"
                    >
                      <Calendar size={13} className={loveDateFrom ? "text-white" : "text-blue-400"} />
                      <span className="font-mono text-[11px]">{loveDateFrom ? loveDateFrom : 'Calendar'}</span>
                    </button>

                    {showDateFilter && (
                      <div className="absolute left-0 sm:left-auto sm:right-0 top-9 z-50 bg-[#161616] border border-blue-500/50 p-3 rounded-2xl shadow-2xl space-y-2 w-64 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-300 pb-1 border-b border-[#262626]">
                          <span className="flex items-center gap-1"><Calendar size={13} className="text-blue-400" /> Filter Day</span>
                          {loveDateFrom && (
                            <button
                              type="button"
                              onClick={() => { setLoveDateFrom(''); setLoveDateTo(''); setShowDateFilter(false); }}
                              className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="date"
                          value={loveDateFrom}
                          onChange={(e) => {
                            setLoveDateFrom(e.target.value);
                            setLoveDateTo(e.target.value);
                          }}
                          className="w-full bg-[#0d0d0d] border border-[#333] text-white p-2 rounded-xl text-xs font-mono outline-none focus:border-blue-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setLoveDateFrom(today);
                              setLoveDateTo(today);
                              setShowDateFilter(false);
                            }}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-1 rounded-lg text-[10px] font-mono cursor-pointer border border-[#333]"
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const yest = new Date();
                              yest.setDate(yest.getDate() - 1);
                              const yestStr = yest.toISOString().split('T')[0];
                              setLoveDateFrom(yestStr);
                              setLoveDateTo(yestStr);
                              setShowDateFilter(false);
                            }}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-1 rounded-lg text-[10px] font-mono cursor-pointer border border-[#333]"
                          >
                            Yesterday
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleManualSectionRefresh('passbook_refresh')}
                    className="w-7 h-7 rounded-full bg-[#202020] hover:bg-blue-600/30 border border-[#333] hover:border-blue-500 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title="Refresh Passbook Real-Time Data"
                  >
                    <RefreshCw size={12} className={refreshingSection === 'passbook_refresh' ? 'animate-spin text-blue-400' : ''} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {role === 'parent' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenClearModal(activeLbTarget)}
                        className="bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5"
                        title={`Clear ${activeLbTarget === 'admin' ? 'Darsh' : 'Dora'}'s passbook ledger`}
                      >
                        <Trash2 size={13} />
                        <span>Clear {activeLbTarget === 'admin' ? 'Darsh' : 'Dora'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenClearModal('both')}
                        className="bg-red-950 hover:bg-red-900 border border-red-600 text-red-200 text-xs font-black px-3 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5"
                        title="Clear BOTH Dora and Darsh passbook ledgers at once"
                      >
                        <Trash2 size={13} className="text-red-400" />
                        <span>Clear Both</span>
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenScratchCard}
                    className={`text-xs font-black px-3.5 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5 ${
                      currentOpenerBalance < 6.0 
                        ? 'bg-zinc-800 text-amber-400/80 border border-amber-600/50 hover:bg-zinc-700' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black'
                    }`}
                    title={currentOpenerBalance < 6.0 ? `Locked: Need 6.00 Points (Current: ₹${currentOpenerBalance.toFixed(2)})` : "Scratch & reveal secret romantic voucher!"}
                  >
                    <Sparkles size={14} />
                    <span>{currentOpenerBalance < 6.0 ? '🔒 Scratch (Need 6 Pts)' : 'Scratch Card (6 Pts) ✨'}</span>
                  </button>
                </div>
              </div>

              {/* PASSBOOK LEDGER: GROUPED BY DAY / DATE */}
              {(() => {
                const filteredEntries = visibleLoveLedger.filter(e => {
                  if (!e) return false;
                  if (loveDateFrom || loveDateTo) {
                    const rawEarned = e.earnedAt || '';
                    let entryDateStr = '';
                    if (rawEarned.includes('/')) {
                      const parts = rawEarned.split(',')[0].split('/').map(p => p.trim());
                      if (parts.length === 3) {
                        entryDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                      }
                    } else if (rawEarned.includes('-')) {
                      entryDateStr = rawEarned.split('T')[0].split(',')[0].trim();
                    }
                    if (entryDateStr) {
                      if (loveDateFrom && entryDateStr < loveDateFrom) return false;
                      if (loveDateTo && entryDateStr > loveDateTo) return false;
                    }
                  }
                  return true;
                });

                if (filteredEntries.length === 0) {
                  return (
                    <div className="bg-[#181818] border border-[#282828] rounded-2xl p-8 text-center text-gray-400 space-y-2">
                      <p className="text-sm font-bold">No passbook records found.</p>
                      {loveDateFrom && (
                        <button
                          type="button"
                          onClick={() => { setLoveDateFrom(''); setLoveDateTo(''); }}
                          className="text-xs text-blue-400 hover:underline cursor-pointer font-mono"
                        >
                          Clear Date Filter ✕
                        </button>
                      )}
                    </div>
                  );
                }

                // Filter out rapid duplicate awards (e.g. repeated instant reply spam within minutes)
                const deduplicated = [];
                const instantReplySeen = {};
                for (const entry of filteredEntries) {
                  if (entry && entry.description && entry.description.includes('Instant Reply')) {
                    const ist = parseEntryIstInfo(entry);
                    const groupKey = `${entry.target || 'user'}_${ist.dateKey}`;
                    let entryMs = ist.entryMs || 0;
                    if (!entryMs && entry.id) {
                      const idMatch = String(entry.id).match(/(\d{12,13})/);
                      if (idMatch) entryMs = Number(idMatch[1]);
                    }
                    if (entryMs > 0) {
                      if (!instantReplySeen[groupKey]) {
                        instantReplySeen[groupKey] = [entryMs];
                        deduplicated.push(entry);
                      } else {
                        const isClose = instantReplySeen[groupKey].some(prevMs => Math.abs(prevMs - entryMs) < 60 * 60 * 1000);
                        if (!isClose) {
                          instantReplySeen[groupKey].push(entryMs);
                          deduplicated.push(entry);
                        }
                      }
                      continue;
                    }
                  }
                  deduplicated.push(entry);
                }

                // Bucket entries by Day first, and inside each Day by Hour
                const dayBuckets = {};
                deduplicated.forEach(entry => {
                  const istInfo = parseEntryIstInfo(entry);
                  const dKey = istInfo.dateKey || 'Other';
                  const hNum = istInfo.hour !== undefined ? istInfo.hour : 12;
                  const hKey = String(hNum).padStart(2, '0');

                  if (!dayBuckets[dKey]) {
                    dayBuckets[dKey] = {
                      dateKey: dKey,
                      entries: [],
                      hourGroups: {}
                    };
                  }
                  dayBuckets[dKey].entries.push(entry);

                  if (!dayBuckets[dKey].hourGroups[hKey]) {
                    dayBuckets[dKey].hourGroups[hKey] = {
                      hour: hNum,
                      hourKey: hKey,
                      entries: []
                    };
                  }
                  dayBuckets[dKey].hourGroups[hKey].entries.push(entry);
                });

                const sortedDayKeys = Object.keys(dayBuckets).sort((a, b) => b.localeCompare(a));

                return (
                  <div className="space-y-6">
                    {sortedDayKeys.map((dayKey) => {
                      const dayData = dayBuckets[dayKey];
                      const dayEntries = dayData.entries;
                      const dayNet = dayEntries.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
                      const sortedHourKeys = Object.keys(dayData.hourGroups).sort((a, b) => Number(b) - Number(a));

                      return (
                        <div key={dayKey} className="bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden shadow-lg">
                          {/* DAY MAIN HEADER */}
                          <div className="bg-[#141414] px-4 py-3 border-b border-[#252525] flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                              <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 whitespace-nowrap">
                                {formatDayHeader(dayKey)}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-[#222] text-gray-400 px-2.5 py-0.5 rounded-full border border-[#333] shrink-0">
                                {dayEntries.length} {dayEntries.length === 1 ? 'record' : 'records'}
                              </span>
                            </div>
                            <div className="shrink-0 ml-auto">
                              <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                                dayNet >= 0 
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                              }`}>
                                Day Net: {dayNet >= 0 ? `+${dayNet.toFixed(2)}` : dayNet.toFixed(2)} pts
                              </span>
                            </div>
                          </div>

                          {/* INSIDE DAY: HOURLY SECTIONS */}
                          <div className="p-2 sm:p-3 space-y-3">
                            {sortedHourKeys.map((hKey) => {
                              const hourGroup = dayData.hourGroups[hKey];
                              const hourEntries = hourGroup.entries;
                              const hourNet = hourEntries.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
                              const hourRange = formatHourRange(hourGroup.hour);

                              return (
                                <div key={hKey} className="bg-[#121212] border border-[#242424] rounded-xl overflow-hidden shadow-sm">
                                  {/* HOUR SUB-HEADER */}
                                  <div className="bg-[#191919] px-3.5 py-2 border-b border-[#252525] flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs font-bold text-amber-300/90 font-mono flex items-center gap-1.5">
                                        🕒 {hourRange}
                                      </span>
                                      <span className="text-[10px] font-mono text-gray-400 bg-[#222] px-2 py-0.2 rounded-full border border-[#333]">
                                        {hourEntries.length} {hourEntries.length === 1 ? 'item' : 'items'}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                                      hourNet >= 0 
                                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                                        : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                                    }`}>
                                      Hour Net: {hourNet >= 0 ? `+${hourNet.toFixed(2)}` : hourNet.toFixed(2)} pts
                                    </span>
                                  </div>

                                  {/* MOBILE VIEW FOR THIS HOUR (sm:hidden) */}
                                  <div className="sm:hidden divide-y divide-[#1e1e1e]">
                                    {hourEntries.map((row, rowIdx) => {
                                      const rawDesc = !isParentAdmin ? (row.description || '').replace(/^\[Dora\]\s*/i, '') : (row.description || '');
                                      const cleanDesc = rawDesc.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, '').replace(/Within 5 Mins?/gi, 'Within 1 Min').trim();

                                      let slotBadge = null;
                                      const matchTask = (row.description || '').match(/(?:Routine Task|Approved Task|Task):\s*([^(]+)/i);
                                      if (matchTask) {
                                        slotBadge = matchTask[1].trim();
                                      } else if ((row.description || '').toLowerCase().includes('morning greeting')) {
                                        slotBadge = 'Morning Sweet Text';
                                      } else if ((row.description || '').toLowerCase().includes('good night') || (row.description || '').toLowerCase().includes('night skin')) {
                                        slotBadge = 'Night Care / Good Night';
                                      } else if (row.remarks && row.remarks.includes('Deadline')) {
                                        slotBadge = 'Routine Habit';
                                      }

                                      const isDeduction = row.type === 'debit' || row.points < 0;

                                      return (
                                        <div key={row.id || rowIdx} className="p-3 space-y-1.5 hover:bg-[#1a1a1a] transition-colors">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 min-w-0">
                                              <span className="font-mono text-[10px] text-gray-400 font-bold bg-[#111] px-1.5 py-0.5 rounded border border-[#262626] shrink-0 mt-0.5">
                                                #{rowIdx + 1}
                                              </span>
                                              <div className="min-w-0">
                                                <h5 className="text-xs font-bold text-white leading-snug break-words">
                                                  {cleanDesc}
                                                </h5>
                                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                  <span className="text-[11px] font-mono text-gray-300 font-semibold">
                                                    🕒 {formatRowTimeOnly(row)}
                                                  </span>
                                                  {slotBadge && (
                                                    <span className="text-[10px] font-sans font-bold text-blue-400">
                                                      📍 {slotBadge}
                                                    </span>
                                                  )}
                                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                                    isDeduction 
                                                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' 
                                                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                                  }`}>
                                                    {isDeduction ? 'Cut' : 'Earned'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold inline-block ${
                                                row.points > 0 
                                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                  : (row.status === 'Redeemed'
                                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')
                                              }`}>
                                                {row.points > 0 ? '+' + Number(row.points).toFixed(2) : Number(row.points).toFixed(2)}
                                              </span>
                                            </div>
                                          </div>

                                          {row.remarks && row.remarks !== '—' && (
                                            <div className="text-[11px] text-gray-400 bg-[#141414] px-2.5 py-1.5 rounded-lg border border-[#222] break-words">
                                              <span className="text-gray-500 font-medium">Remarks: </span>
                                              {(row.remarks || '').replace(/Within 5 Mins?/gi, 'Within 1 Min')}
                                            </div>
                                          )}

                                          <div className="flex items-center justify-between pt-0.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                              row.status === 'Confirmed' 
                                                ? 'bg-emerald-600/90 text-white' 
                                                : (row.status === 'Redeemed' ? 'bg-amber-600/90 text-white' : 'bg-rose-600/90 text-white')
                                            }`}>
                                              {row.status}
                                            </span>
                                            {isParentAdmin && (
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteTransaction(row.id)}
                                                className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 cursor-pointer flex items-center gap-1 text-[11px]"
                                                title="Delete this record"
                                              >
                                                <Trash2 size={12} />
                                                <span>Delete</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* DESKTOP VIEW FOR THIS HOUR (hidden sm:block) */}
                                  <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-left text-xs font-sans min-w-[620px]">
                                      <thead className="bg-[#151515] text-gray-400 uppercase text-[10px] font-mono border-b border-[#222]">
                                        <tr>
                                          <th className="py-2 px-3 w-10">SL</th>
                                          <th className="py-2 px-3">Description</th>
                                          <th className="py-2 px-3">Earned At</th>
                                          <th className="py-2 px-3">Points</th>
                                          <th className="py-2 px-3">Remarks</th>
                                          <th className="py-2 px-3 text-right">Status</th>
                                          {isParentAdmin && <th className="py-2 px-3 text-center w-10">Action</th>}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#1e1e1e] text-gray-300">
                                        {hourEntries.map((row, rowIdx) => {
                                          const rawDesc = !isParentAdmin ? (row.description || '').replace(/^\[Dora\]\s*/i, '') : (row.description || '');
                                          const cleanDesc = rawDesc.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, '').replace(/Within 5 Mins?/gi, 'Within 1 Min').trim();

                                          let slotBadge = null;
                                          const matchTask = (row.description || '').match(/(?:Routine Task|Approved Task|Task):\s*([^(]+)/i);
                                          if (matchTask) {
                                            slotBadge = matchTask[1].trim();
                                          } else if ((row.description || '').toLowerCase().includes('morning greeting')) {
                                            slotBadge = 'Morning Sweet Text';
                                          } else if ((row.description || '').toLowerCase().includes('good night') || (row.description || '').toLowerCase().includes('night skin')) {
                                            slotBadge = 'Night Care / Good Night';
                                          } else if (row.remarks && row.remarks.includes('Deadline')) {
                                            slotBadge = 'Routine Habit';
                                          }

                                          const isDeduction = row.type === 'debit' || row.points < 0;

                                          return (
                                            <tr key={row.id || rowIdx} className="hover:bg-[#1c1c1c] transition-colors">
                                              <td className="py-2 px-3 font-mono text-gray-400 font-bold">{rowIdx + 1}</td>
                                              <td className="py-2 px-3 font-bold text-white max-w-[280px]">
                                                <div>{cleanDesc}</div>
                                              </td>
                                              <td className="py-2 px-3 font-mono text-[11px] text-gray-300">
                                                <div className="text-gray-200 font-semibold">{formatRowTimeOnly(row)}</div>
                                                {slotBadge && (
                                                  <div className="text-[10px] font-sans font-bold flex items-center gap-1 mt-0.5">
                                                    <span className="text-blue-400">📍 {slotBadge}</span>
                                                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                                      isDeduction ? 'bg-rose-950/70 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                                                    }`}>
                                                      {isDeduction ? 'Cut' : 'Earned'}
                                                    </span>
                                                  </div>
                                                )}
                                              </td>
                                              <td className="py-2 px-3 font-mono font-bold">
                                                <span className={'px-2 py-0.5 rounded-full text-[11px] ' + (
                                                  row.points > 0 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                    : (row.status === 'Redeemed'
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')
                                                )}>
                                                  {row.points > 0 ? '+' + Number(row.points).toFixed(2) : Number(row.points).toFixed(2)}
                                                </span>
                                              </td>
                                              <td className="py-2 px-3 text-gray-400 text-[11px] max-w-[220px] truncate" title={row.remarks}>
                                                {(row.remarks || '—').replace(/Within 5 Mins?/gi, 'Within 1 Min')}
                                              </td>
                                              <td className="py-2 px-3 text-right">
                                                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                                                  row.status === 'Confirmed' 
                                                    ? 'bg-emerald-600 text-white' 
                                                    : (row.status === 'Redeemed' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white')
                                                )}>
                                                  {row.status}
                                                </span>
                                              </td>
                                              {isParentAdmin && (
                                                <td className="py-2 px-3 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteTransaction(row.id)}
                                                    className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-all"
                                                    title="Delete this transaction permanently"
                                                  >
                                                    <Trash2 size={13} />
                                                  </button>
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: REDEEM WISH STORE */}
          {loveModalTab === 'redeem' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-pink-950/40 border border-pink-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>Romantic Wish Store</span>
                    <span className="text-xs bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full">INSTANT CLAIM</span>
                  </h3>
                  <p className="text-xs text-gray-300">Exchange your earned Love Balance for sweet promises and real dates!</p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400">Available to Spend</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">{formatLoveBalance(Math.max(0, displayedLoveBalance))}</div>
                </div>
              </div>

              {/* SPECIAL ROMANTIC SCRATCH CARD PRODUCT */}
              <div className="bg-gradient-to-r from-amber-950/50 via-purple-950/50 to-amber-950/50 border-2 border-amber-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
                    ✨
                  </div>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-amber-300">Surprise Scratch Voucher</h4>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full">COST: 6.00 PTS</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.2 rounded-full">NEVER REPEATS</span>
                    </div>
                    <p className="text-xs text-gray-300">Deduct 6 Love Points to reveal secret romantic promises, dates & cute surprises! Saved to your Wish Store history.</p>
                    <div className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-2">
                      <span>👤 {openerName}'s Balance: ₹{Number(currentOpenerBalance || 0).toFixed(2)}</span>
                      {currentOpenerBalance < 6.0 ? (
                        <span className="text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 text-[10px]">
                          ⚠️ Need ₹{(6.0 - Math.max(0, currentOpenerBalance)).toFixed(2)} more points to unlock
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                          ✓ Ready to Scratch
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenScratchCard}
                  className={`text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5 shrink-0 ${
                    currentOpenerBalance < 6.0
                      ? 'bg-zinc-800 text-amber-400/80 border border-amber-600/50 hover:bg-zinc-700'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black'
                  }`}
                  title={currentOpenerBalance < 6.0 ? `Locked: Need 6.00 Points (Current: ₹${currentOpenerBalance.toFixed(2)})` : "Scratch & reveal secret romantic voucher!"}
                >
                  <Sparkles size={14} />
                  <span>{currentOpenerBalance < 6.0 ? '🔒 Locked (Need 6 Pts)' : 'Scratch Card (6 Pts) ✨'}</span>
                </button>
              </div>

              {/* DEDICATED SECTION: UNLOCKED SURPRISE SCRATCH CARDS & VOUCHERS */}
              {unlockedVouchers && unlockedVouchers.length > 0 && (
                <div className="bg-[#181818] border border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2b2b2b] pb-2 gap-2">
                    <div>
                      <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                        <span>✨ Unlocked Scratch Cards & Romantic Coupons</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full font-mono font-bold">
                          {unlockedVouchers.length} UNLOCKED
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Surprise rewards revealed via Scratch Card — redeemable with Love Balance!</p>
                    </div>

                    {isParentAdmin && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={toggleSelectAllVouchers}
                          className="text-[11px] font-bold bg-[#262626] hover:bg-[#333] text-gray-300 px-2.5 py-1 rounded-lg border border-[#3d3d3d] cursor-pointer transition-all"
                        >
                          {selectedVoucherIds.length === unlockedVouchers.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedVoucherIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleDeleteSelectedVouchers}
                            className="text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg shadow cursor-pointer active:scale-95 flex items-center gap-1 transition-all"
                          >
                            <Trash2 size={12} />
                            <span>Delete Selected ({selectedVoucherIds.length})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unlockedVouchers.map((uv, idx) => {
                      const vKey = uv.code || uv.id || String(idx);
                      const isSelected = selectedVoucherIds.includes(vKey) || (uv.id && selectedVoucherIds.includes(uv.id)) || (uv.code && selectedVoucherIds.includes(uv.code));
                      const availablePts = Math.max(0, displayedLoveBalance);
                      const numericCost = parseFloat(String(uv.points || uv.value || '10').replace(/[^0-9.]/g, '')) || 10;
                      const canAffordUv = availablePts >= numericCost;
                      const requesterRole = isParentAdmin ? (activeLbTarget === 'admin' ? 'admin' : 'user') : 'user';
                      const isUvPending = wishRequests.some(r => (r.wishTitle === uv.title || r.wishId === uv.code) && r.status === 'PENDING' && r.requesterRole === requesterRole);

                      return (
                        <div key={uv.id || uv.code || idx} className={`bg-gradient-to-br from-[#1c1815] via-[#161616] to-[#1c1418] border ${isSelected ? 'border-amber-400 ring-2 ring-amber-500/50' : 'border-amber-500/40 hover:border-amber-400/70'} rounded-2xl p-3.5 flex flex-col justify-between space-y-3 shadow transition-colors relative`}>
                          {isParentAdmin && (
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectVoucher(vKey)}
                                className="w-4 h-4 rounded text-amber-500 bg-[#222] border-gray-600 cursor-pointer accent-amber-500"
                                title="Select voucher for bulk delete"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleVoucher(vKey)}
                                className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-all"
                                title="Delete this voucher from Wish Store"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          <div className="space-y-1.5 pr-14">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl p-1.5 bg-black/60 rounded-xl border border-amber-500/40 shrink-0">{uv.icon || '🎁'}</span>
                                <div className="text-left">
                                  <h5 className="text-xs font-black text-white">{uv.title}</h5>
                                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800 px-1.5 py-0.2 rounded">
                                    {uv.category || 'Surprise Voucher'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="inline-block text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/40 px-2 py-0.5 rounded-lg shrink-0 mt-1">
                              ₹ {numericCost.toFixed(2)}
                            </span>
                            <p className="text-[11px] text-gray-300 leading-snug">{uv.description}</p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-[#262626]">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/20">
                                👤 Unlocked by: {uv.unlockedBy || openerName}
                              </span>
                              <span className="text-gray-400">
                                CODE: <strong className="text-amber-400">{uv.code}</strong>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleInitiateWishRequest({
                                id: uv.code || uv.id || ('uv_' + idx),
                                title: uv.title,
                                cost: numericCost,
                                icon: uv.icon || '🎁',
                                description: uv.description || uv.title
                              })}
                              className={'w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow active:scale-95 ' + (
                                isUvPending
                                  ? 'bg-amber-600 text-white animate-pulse border border-amber-400'
                                  : (canAffordUv 
                                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white' 
                                      : 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-[#333]')
                              )}
                            >
                              {isUvPending 
                                ? '⏳ Awaiting Partner Approval' 
                                : (canAffordUv ? ('Redeem Voucher for ₹ ' + numericCost.toFixed(2) + ' 💝') : ('Need ₹ ' + (numericCost - availablePts).toFixed(2) + ' More'))}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ROMANTIC_WISH_STORE.map((wish) => {
                  const availablePts = Math.max(0, displayedLoveBalance);
                  const canAfford = availablePts >= wish.cost;
                  return (
                    <div key={wish.id} className="bg-[#181818] border border-[#2a2a2a] hover:border-pink-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{wish.icon}</span>
                          <span className="text-sm font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-xl">
                            ₹ {wish.cost.toFixed(2)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{wish.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">{wish.description}</p>
                      </div>

                      {(() => {
                        const requesterRole = isParentAdmin ? (activeLbTarget === 'admin' ? 'admin' : 'user') : 'user';
                        const isPending = wishRequests.some(r => r.wishId === wish.id && r.status === 'PENDING' && r.requesterRole === requesterRole);
                        return (
                          <button
                            type="button"
                            onClick={() => handleInitiateWishRequest(wish)}
                            className={'w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow active:scale-95 ' + (
                              isPending
                                ? 'bg-amber-600 text-white animate-pulse border border-amber-400'
                                : (canAfford 
                                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white' 
                                    : 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-[#333]')
                            )}
                          >
                            {isPending 
                              ? '⏳ Awaiting Partner Approval' 
                              : (canAfford ? ('Request Wish for ₹ ' + wish.cost.toFixed(2) + ' 💝') : ('Need ₹ ' + (wish.cost - availablePts).toFixed(2) + ' More'))}
                          </button>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REDEEMED WISHES VAULT & TIMELINE */}
          {loveModalTab === 'claimed' && (
            <div className="space-y-4">
              {(() => {
                const myRole = role === 'parent' ? 'admin' : 'user';
                const incomingPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole !== myRole);
                const myPendingReqs = wishRequests.filter(r => r.status === 'PENDING' && r.requesterRole === myRole);
                if (incomingPendingReqs.length === 0 && myPendingReqs.length === 0) return null;
                return (
                  <div className="space-y-2">
                    {incomingPendingReqs.map(req => (
                      <div key={req.id} className="bg-gradient-to-r from-pink-950/60 to-purple-950/60 border-2 border-pink-500/70 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-black/40 rounded-xl">{req.wishIcon || '🎁'}</span>
                          <div className="text-left space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">{req.requesterName} wants: {req.wishTitle}</h4>
                              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.2 rounded-lg">₹ {req.wishCost.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-300">{req.wishDesc}</p>
                            <p className="text-[10px] text-gray-500 font-mono">Requested: {req.requestedAt}</p>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleApproveWishRequest(req)}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all"
                          >
                            Approve & Grant 💝
                          </button>
                        </div>
                      </div>
                    ))}

                    {myPendingReqs.map(req => (
                      <div key={req.id} className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{req.wishIcon || '🎁'}</span>
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-white">Your Request: {req.wishTitle}</h5>
                            <span className="text-[10px] text-gray-400 font-mono">₹ {req.wishCost.toFixed(2)} • {req.requestedAt}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-600/60 px-3 py-1 rounded-full animate-pulse">
                          ⏳ Waiting for {req.targetName}'s Approval
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="bg-gradient-to-r from-amber-950/40 via-orange-950/40 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>Redeemed Wishes & Promises</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                      {redeemedWishesList.length} TOTAL
                    </span>
                  </h3>
                  <p className="text-xs text-gray-300">Track and fulfill all romantic wishes redeemed with Love Balance.</p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400">Total Spent</div>
                  <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">₹ {redeemedWishesTotal.toFixed(2)}</div>
                </div>
              </div>

              {redeemedWishesList.length === 0 ? (
                <div className="bg-[#181818] border border-[#282828] rounded-2xl p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto">
                    🎁
                  </div>
                  <h4 className="text-base font-bold text-white">No Wishes Redeemed Yet</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    You haven't claimed any romantic wishes yet. Save up your Love Balance and treat yourself in the Wish Store!
                  </p>
                  <button
                    type="button"
                    onClick={() => setLoveModalTab('redeem')}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    <Gift size={15} />
                    <span>Go to Wish Store</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {redeemedWishesList.map((rw, idx) => (
                    <div key={rw.id || idx} className="bg-[#181818] border border-[#2a2a2a] hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-[#222] rounded-2xl border border-[#333] shrink-0">{rw.wishIcon || '🎁'}</span>
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black text-white">
                              {rw.wishTitle || rw.description.replace(/^\[(Dora|Darsh)\]\s*Redeemed:\s*/i, '').replace(/^Redeemed:\s*/i, '')}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] font-mono">
                              <span className="text-pink-300 bg-pink-950/60 border border-pink-700/50 px-2 py-0.2 rounded">
                                👤 {rw.description && rw.description.includes('[Darsh]') ? 'Darsh' : 'Dora'} claimed
                              </span>
                              <span className="text-gray-400">Redeemed: {rw.earnedAt}</span>
                            </div>
                            <div className="text-[10px] text-gray-500">Remarks: {rw.remarks}</div>
                          </div>
                        </div>
                        <span className="text-sm font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl shrink-0">
                          ₹ {Math.abs(rw.points).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#252525]">
                        <span className={'text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ' + (
                          rw.fulfillmentStatus === 'Fulfilled'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        )}>
                          {rw.fulfillmentStatus === 'Fulfilled' ? '✅ Completed & Fulfilled 💝' : '⏳ Accepted & Pending Completion'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleWishFulfillment(rw.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                              rw.fulfillmentStatus === 'Fulfilled'
                                ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/50'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow'
                            }`}
                            title="Toggle fulfillment status manually"
                          >
                            {rw.fulfillmentStatus === 'Fulfilled' ? 'Mark Pending ⏳' : 'Mark Done ✅'}
                          </button>
                          {isParentAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(rw.id)}
                              className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl cursor-pointer transition-all border border-transparent hover:border-rose-800"
                              title="Delete this redeemed wish permanently"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RULES ENGINE GUIDE */}
          {loveModalTab === 'rules' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-blue-950/40 border border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Love Balance Policy</span>
                </h3>
              </div>

              {/* REWARD EARNING RULES */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                  <span>✨ Love Balance Earning Rules</span>
                </h4>
                <div className="bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans min-w-[550px]">
                      <thead className="bg-[#121212] text-gray-400 uppercase text-[10px] font-mono border-b border-[#262626]">
                        <tr>
                          <th className="py-2.5 px-3 w-12">S.NO</th>
                          <th className="py-2.5 px-3">GESTURE / TASK TYPE</th>
                          <th className="py-2.5 px-3">CRITERIA</th>
                          <th className="py-2.5 px-3 text-right">REWARD POINTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#242424] text-gray-300">
                        {LOVE_EARNING_RULES.map((rule) => (
                          <tr key={rule.sno} className="hover:bg-[#202020] transition-colors">
                            <td className="py-2.5 px-3 font-mono text-gray-400">{rule.sno}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{rule.task}</td>
                            <td className="py-2.5 px-3 text-gray-400 text-xs">{rule.criteria}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="bg-blue-600 text-white font-mono font-bold px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                                {rule.reward}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DEDUCTION RULES */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
                  <span>💔 Love Balance Deductions</span>
                </h4>
                <div className="bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans min-w-[550px]">
                      <thead className="bg-[#121212] text-gray-400 uppercase text-[10px] font-mono border-b border-[#262626]">
                        <tr>
                          <th className="py-2.5 px-3 w-12">S.NO</th>
                          <th className="py-2.5 px-3">DEDUCTION TYPE</th>
                          <th className="py-2.5 px-3">CRITERIA</th>
                          <th className="py-2.5 px-3 text-right">DEDUCTION POINTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#242424] text-gray-300">
                        {LOVE_DEDUCTION_RULES.map((rule) => (
                          <tr key={rule.sno} className="hover:bg-[#202020] transition-colors">
                            <td className="py-2.5 px-3 font-mono text-gray-400">{rule.sno}</td>
                            <td className="py-2.5 px-3 font-bold text-rose-200">{rule.infraction}</td>
                            <td className="py-2.5 px-3 text-gray-400 text-xs">{rule.criteria}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="bg-rose-600 text-white font-mono font-bold px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                                {rule.penalty}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ROMANTIC SCRATCH CARD MODAL */}
      <ScratchCardModal
        isOpen={showScratchModal}
        onClose={() => setShowScratchModal(false)}
        voucher={selectedScratchVoucher}
        openerName={selectedScratchVoucher?.openerName || openerName}
        onSaveVoucher={handleSaveVoucher}
      />
    </div>
  );
}

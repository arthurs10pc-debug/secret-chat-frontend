import React, { useState } from 'react';
import { 
  X, RefreshCw, Trash2, Gift, Filter, ShieldCheck, Sparkles 
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
  handleLoveBalanceTransaction
}) {
  const [showScratchModal, setShowScratchModal] = useState(false);
  const [selectedScratchVoucher, setSelectedScratchVoucher] = useState(null);

  // Persistent tracking of unlocked scratch vouchers and revealed codes
  const [unlockedVouchers, setUnlockedVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem('stealth_unlocked_scratch_vouchers');
      return saved ? JSON.parse(saved) : [];
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
      if (prev.some(x => x.code === item.code)) return prev;
      const updated = [item, ...prev];
      try { localStorage.setItem('stealth_unlocked_scratch_vouchers', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });
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
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow active:scale-95"
                          >
                            Approve & Grant 💝
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineWishRequest(req)}
                            className="bg-[#242424] hover:bg-[#333] text-gray-300 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer border border-[#3a3a3a]"
                          >
                            Decline
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

              {/* ACTION ROW: PASSBOOK HEADER & BUTTONS */}
              <div className="flex items-center justify-between bg-[#181818] border border-[#282828] p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold text-white">Love Balance Passbook</span>
                  <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">({visibleLoveLedger.length} Records)</span>
                </div>

                <div className="flex items-center gap-2">
                  {role === 'parent' && (
                    <button
                      type="button"
                      onClick={() => handleOpenClearModal(activeLbTarget)}
                      className="bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5"
                      title="Clear passbook ledger history"
                    >
                      <Trash2 size={13} />
                      <span>Clear All</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedScratchVoucher(null);
                      setShowScratchModal(true);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black px-3.5 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5"
                    title="Scratch & reveal secret romantic voucher!"
                  >
                    <Sparkles size={14} />
                    <span>Scratch Card ✨</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoveModalTab('claimed')}
                    className="bg-[#242424] hover:bg-[#2e2e2e] text-amber-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5 border border-amber-500/30"
                  >
                    <span>🎁 Redeemed ({redeemedWishesList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoveModalTab('redeem')}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Gift size={14} />
                    <span>Redeem Wish</span>
                  </button>
                </div>
              </div>

              {/* FILTER TOOLBAR */}
              <div className="bg-[#181818] border border-[#282828] p-3 sm:p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#262626]">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <Filter size={13} className="text-blue-400" />
                    <span>Passbook Filters & Search</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {(loveSourceFilter !== 'All' || loveStatusFilter !== 'All' || loveDateFrom || loveDateTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLoveSourceFilter('All');
                          setLoveStatusFilter('All');
                          setLoveDateFrom('');
                          setLoveDateTo('');
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline transition-all"
                      >
                        Reset Filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleManualSectionRefresh('passbook_refresh')}
                      className="w-7 h-7 rounded-full bg-[#202020] hover:bg-blue-600/30 border border-[#333] hover:border-blue-500 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Refresh Passbook Real-Time Data"
                    >
                      <RefreshCw size={12} className={refreshingSection === 'passbook_refresh' ? 'animate-spin text-blue-400' : ''} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Source Category</label>
                    <select
                      value={loveSourceFilter}
                      onChange={(e) => setLoveSourceFilter(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333] hover:border-gray-500 rounded-xl px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="All">All Sources</option>
                      <option value="routine">Hourly Routine Tasks</option>
                      <option value="morning">Morning Sweet Text / Greeting</option>
                      <option value="night">Good Night Wish</option>
                      <option value="sweet">Sweet Reactions / Gestures</option>
                      <option value="adjustment">Admin Manual Adjustment</option>
                      <option value="redeem">Redeemed Wishes</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Date From</label>
                    <input
                      type="date"
                      value={loveDateFrom}
                      onChange={(e) => setLoveDateFrom(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333] hover:border-gray-500 rounded-xl px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Date To</label>
                    <input
                      type="date"
                      value={loveDateTo}
                      onChange={(e) => setLoveDateTo(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333] hover:border-gray-500 rounded-xl px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Status</label>
                    <select
                      value={loveStatusFilter}
                      onChange={(e) => setLoveStatusFilter(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333] hover:border-gray-500 rounded-xl px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Confirmed">Confirmed (Credit)</option>
                      <option value="Deducted">Deducted (Debit)</option>
                      <option value="Redeemed">Redeemed (Wish)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PASSBOOK TABLE */}
              <div className="bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans min-w-[650px]">
                    <thead className="bg-[#121212] text-gray-400 uppercase text-[10px] font-mono border-b border-[#262626]">
                      <tr>
                        <th className="py-2.5 px-3">SL</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Earned At</th>
                        <th className="py-2.5 px-3">Points</th>
                        <th className="py-2.5 px-3">Remarks</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                        {isParentAdmin && <th className="py-2.5 px-3 text-center w-10">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242424] text-gray-300">
                      {visibleLoveLedger
                        .filter(e => {
                          if (!e) return false;
                          if (loveSourceFilter !== 'All') {
                            const desc = (e.description || '').toLowerCase();
                            if (loveSourceFilter === 'routine' && !desc.includes('routine') && !desc.includes('approved task')) return false;
                            if (loveSourceFilter === 'morning' && !desc.includes('morning')) return false;
                            if (loveSourceFilter === 'night' && !desc.includes('good night') && !desc.includes('night')) return false;
                            if (loveSourceFilter === 'sweet' && !desc.includes('gesture') && !desc.includes('compliment') && !desc.includes('heart') && !desc.includes('reply') && !desc.includes('reaction')) return false;
                            if (loveSourceFilter === 'adjustment' && !desc.includes('adjustment')) return false;
                            if (loveSourceFilter === 'redeem' && e.type !== 'redeem' && e.status !== 'Redeemed') return false;
                          }
                          if (loveStatusFilter !== 'All' && e.status !== loveStatusFilter) return false;
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
                        })
                        .map((row, idx) => {
                          const rawDesc = !isParentAdmin ? (row.description || '').replace(/^\[Dora\]\s*/i, '') : (row.description || '');
                          // Clean description without trailing date (e.g. "(2026-11-21)")
                          const cleanDesc = rawDesc.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, '').trim();

                          // Extract slot info if present
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
                            <tr key={row.id || idx} className="hover:bg-[#202020] transition-colors">
                              <td className="py-2.5 px-3 font-mono text-gray-400">{row.sl || idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-white max-w-[280px]">
                                <div>{cleanDesc}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-gray-300">
                                <div className="text-gray-200 font-semibold">{row.earnedAt}</div>
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
                              <td className="py-2.5 px-3 font-mono font-bold">
                                <span className={'px-2 py-0.5 rounded-full text-[11px] ' + (
                                  row.points > 0 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : (row.status === 'Redeemed'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')
                                )}>
                                  {row.points > 0 ? '+' + row.points.toFixed(2) : row.points.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-400 text-[11px] max-w-[220px] truncate" title={row.remarks}>
                                {row.remarks || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                                  row.status === 'Confirmed' 
                                    ? 'bg-emerald-600 text-white' 
                                    : (row.status === 'Redeemed' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white')
                                )}>
                                  {row.status}
                                </span>
                              </td>
                              {isParentAdmin && (
                                <td className="py-2.5 px-3 text-center">
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
                  <div className="text-left space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-amber-300">Surprise Scratch Voucher</h4>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full">6.00 PTS</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.2 rounded-full">NEVER REPEATS</span>
                    </div>
                    <p className="text-xs text-gray-300">Deduct 6 Love Points to reveal romantic promises, dates & cute surprises! Saved to your Wish Store history.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenScratchCard}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles size={14} />
                  <span>Scratch Card (6 Pts) ✨</span>
                </button>
              </div>

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
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleApproveWishRequest(req)}
                            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow active:scale-95 transition-all"
                          >
                            Approve & Grant 💝
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineWishRequest(req)}
                            className="bg-[#242424] hover:bg-[#333] text-gray-300 text-xs px-3 py-2 rounded-xl cursor-pointer border border-[#3a3a3a]"
                          >
                            Decline
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

              {/* UNLOCKED SURPRISE SCRATCH CARDS & VOUCHERS VAULT */}
              {unlockedVouchers && unlockedVouchers.length > 0 && (
                <div className="bg-[#181818] border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                    <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                      <span>✨ Unlocked Scratch Cards & Vouchers</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full font-mono font-bold">
                        {unlockedVouchers.length} REVEALED
                      </span>
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">6 pts each • Kept in Wish Store</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unlockedVouchers.map((uv, idx) => (
                      <div key={uv.id || idx} className="bg-gradient-to-br from-[#1c1815] via-[#161616] to-[#1c1418] border border-amber-500/30 rounded-xl p-3 space-y-2 shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1.5 bg-black/50 rounded-xl border border-amber-500/30 shrink-0">{uv.icon || '🎁'}</span>
                            <div className="text-left">
                              <h5 className="text-xs font-black text-white">{uv.title}</h5>
                              <p className="text-[10px] text-pink-200 leading-tight mt-0.5">{uv.description}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
                            {uv.points || uv.value || 'Priceless'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono border-t border-[#262626] pt-1.5">
                          <span className="text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/20">
                            👤 Unlocked by: {uv.unlockedBy || 'Partner'}
                          </span>
                          <span className="text-gray-400">
                            CODE: <strong className="text-amber-400">{uv.code}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                            <div className="text-[11px] text-gray-400 font-mono">Redeemed: {rw.earnedAt}</div>
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
                          {rw.fulfillmentStatus === 'Fulfilled' ? '✅ Granted & Fulfilled' : '⏳ Date / Reward Pending'}
                        </span>

                        {isParentAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleWishFulfillment(rw.id)}
                            className="text-xs font-bold bg-[#262626] hover:bg-[#333] text-white px-3 py-1.5 rounded-xl border border-[#3d3d3d] cursor-pointer transition-all active:scale-95"
                            title="Toggle fulfillment status"
                          >
                            {rw.fulfillmentStatus === 'Fulfilled' ? 'Mark Pending ⏳' : 'Mark Fulfilled ✅'}
                          </button>
                        )}
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

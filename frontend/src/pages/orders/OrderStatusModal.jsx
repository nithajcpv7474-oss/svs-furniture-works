import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, IndianRupee, AlertCircle, Loader2, ArrowRight, AlertTriangle, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Status configuration ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending:          { label: 'Pending',           color: '#F97316', bg: 'rgba(249,115,22,0.15)', border: '#F97316' },
  Confirmed:        { label: 'Confirmed',          color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  border: '#3B82F6' },
  InProduction:     { label: 'In Production',      color: '#A855F7', bg: 'rgba(168,85,247,0.15)',  border: '#A855F7' },
  QualityCheck:     { label: 'Quality Check',      color: '#EAB308', bg: 'rgba(234,179,8,0.15)',   border: '#EAB308' },
  ReadyForDelivery: { label: 'Ready for Delivery', color: '#14B8A6', bg: 'rgba(20,184,166,0.15)',  border: '#14B8A6' },
  Delivered:        { label: 'Delivered',           color: '#22C55E', bg: 'rgba(34,197,94,0.15)',   border: '#22C55E' },
  Completed:        { label: 'Completed',           color: '#10B981', bg: 'rgba(16,185,129,0.15)',  border: '#10B981' },
  OnHold:           { label: 'On Hold',             color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: '#6B7280' },
  Cancelled:        { label: 'Cancelled',           color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   border: '#EF4444' },
};

// ─── Valid forward transitions (main progress steps only) ───────────────────
const VALID_NEXT = {
  Pending:          ['Confirmed'],
  Confirmed:        ['InProduction'],
  InProduction:     ['QualityCheck'],
  QualityCheck:     ['ReadyForDelivery'],
  ReadyForDelivery: ['Delivered'],
  Delivered:        ['Completed'],
  Completed:        [],
  OnHold:           ['Pending', 'Confirmed', 'InProduction', 'QualityCheck', 'ReadyForDelivery'],
  Cancelled:        [],
};

// ─── Role permissions ────────────────────────────────────────────────────────
const ROLE_TARGETS = {
  Admin:            Object.keys(STATUS_CONFIG),
  Management:       [],
  Manager:          [],
  'Sales Staff':    ['Confirmed', 'OnHold', 'Cancelled'],
  Staff:            ['Confirmed', 'OnHold', 'Cancelled'],
  'Production Staff': ['InProduction', 'QualityCheck', 'ReadyForDelivery', 'OnHold'],
  'Delivery Staff': ['Delivered'],
};

// ─── Error message map ───────────────────────────────────────────────────────
const API_ERROR_MAP = {
  'not permitted':        "You don't have permission to change status",
  'Invalid status':       'This status change is not allowed',
  'Reason is required':   null, // handled inline
  'not found':            'Order not found. Please refresh and try again.',
};

const mapApiError = (message = '') => {
  for (const [key, val] of Object.entries(API_ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return val || message;
  }
  return message || 'Failed to update. Please try again.';
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatusPill = ({ statusKey }) => {
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Pending;
  return (
    <span
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border"
    >
      <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
};

const NextStatusButton = ({ statusKey, isSelected, onClick, disabled }) => {
  const cfg = STATUS_CONFIG[statusKey] || {};
  const isDanger = statusKey === 'Cancelled';
  const isWarn   = statusKey === 'OnHold';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => !disabled && onClick(statusKey)}
      disabled={disabled}
      style={isSelected ? { background: cfg.color, borderColor: cfg.color } : { borderColor: cfg.border }}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${isSelected ? 'text-white shadow-lg' : 'text-white/80 hover:text-white'}
        ${!isSelected && !disabled ? 'hover:bg-white/10' : ''}
      `}
      style={isSelected
        ? { background: cfg.color, borderColor: cfg.color }
        : { borderColor: cfg.border, background: 'rgba(255,255,255,0.04)' }
      }
    >
      <ArrowRight size={14} />
      {cfg.label || statusKey}
    </motion.button>
  );
};

const SpecialActionButton = ({ statusKey, isSelected, onClick, disabled }) => {
  const cfg = STATUS_CONFIG[statusKey] || {};
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => !disabled && onClick(statusKey)}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={isSelected
        ? { background: cfg.color, borderColor: cfg.color, color: '#fff' }
        : { borderColor: cfg.border, background: 'rgba(255,255,255,0.04)', color: cfg.color }
      }
    >
      {statusKey === 'OnHold' ? <AlertTriangle size={14} /> : <Ban size={14} />}
      {statusKey === 'OnHold' ? 'Put On Hold' : 'Cancel Order'}
    </motion.button>
  );
};

// ─── Main Modal ──────────────────────────────────────────────────────────────
export const OrderStatusModal = ({ isOpen, onClose, order, userRole, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes]                   = useState('');
  const [reason, setReason]                 = useState('');
  const [paymentAmount, setPaymentAmount]   = useState('');
  const [paymentMode, setPaymentMode]       = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  // Reset all form state whenever a new order is opened
  useEffect(() => {
    if (isOpen && order) {
      setSelectedStatus(null);
      setNotes('');
      setReason('');
      setPaymentAmount('');
      setPaymentMode('');
      setPaymentReference('');
      setError('');
      setLoading(false);
    }
  }, [isOpen, order?.id]);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  if (!isOpen || !order) return null;

  const currentStatus   = order.orderStatus;
  const isTerminal      = ['Completed', 'Cancelled'].includes(currentStatus);
  const roleTargets     = ROLE_TARGETS[userRole] || [];
  const isAdmin         = userRole === 'Admin';

  // Forward progress steps allowed for this role
  const forwardStatuses = (VALID_NEXT[currentStatus] || []).filter(
    s => isAdmin || roleTargets.includes(s)
  );

  // Special actions (OnHold / Cancelled) shown separately
  const specialStatuses = ['OnHold', 'Cancelled'].filter(s => {
    if (isTerminal) return false;
    if (currentStatus === 'OnHold' && s === 'OnHold') return false; // already on hold
    return isAdmin || roleTargets.includes(s);
  });

  const hasAnyAction = forwardStatuses.length > 0 || specialStatuses.length > 0;
  const isReasonRequired = selectedStatus === 'Cancelled' || selectedStatus === 'OnHold';
  const reasonValid  = !isReasonRequired || reason.trim().length >= 10;
  const canSubmit    = !loading && selectedStatus && reasonValid && (!paymentAmount || paymentMode);

  const handleSelectStatus = (s) => {
    setSelectedStatus(s);
    setError('');
    // Clear reason when switching away from hold/cancel
    if (s !== 'OnHold' && s !== 'Cancelled') setReason('');
  };

  const handleUpdate = async () => {
    setError('');

    // Client-side validation
    if (!selectedStatus) {
      setError('Please select a status to move to'); return;
    }
    if (selectedStatus === 'OnHold' && reason.trim().length < 10) {
      setError('Please enter a reason for putting on hold (min 10 characters)'); return;
    }
    if (selectedStatus === 'Cancelled' && reason.trim().length < 10) {
      setError('Please enter a reason for cancelling (min 10 characters)'); return;
    }
    if (paymentAmount && !paymentMode) {
      setError('Please select a payment mode'); return;
    }

    setLoading(true);
    try {
      await onUpdate(order.id, {
        status:           selectedStatus,
        notes:            notes.trim() || null,
        reason:           reason.trim() || null,
        paymentAmount:    paymentAmount ? Number(paymentAmount) : null,
        paymentMode:      paymentMode || null,
        paymentReference: paymentReference.trim() || null,
      });
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '';
      setError(mapApiError(msg));
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  const dueDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBD';

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      >
        {/* Card — stop propagation so clicking inside doesn't close */}
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full flex flex-col"
          style={{
            maxWidth: 540,
            maxHeight: '90vh',
            background: 'rgba(13,17,28,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            boxShadow: '0 25px 50px rgba(0,0,0,0.55)',
            overflow: 'hidden',
          }}
        >
          {/* ── Header ── */}
          <div className="flex-none px-6 py-4 border-b border-white/10 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Update Order Status</h2>
              <p className="text-sm text-white/60 mt-0.5">
                <span className="text-white/90 font-semibold">{order.orderNumber}</span>
                {order.furnitureName ? ` — ${order.furnitureName}` : ''}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                Customer: {order.customer?.fullName || '—'} &nbsp;|&nbsp; Due: {dueDate}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Current Status */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Current Status</p>
              <StatusPill statusKey={currentStatus} />
            </div>

            {/* Terminal states */}
            {isTerminal && (
              <div
                className="rounded-xl p-4 border flex items-start gap-3"
                style={
                  currentStatus === 'Completed'
                    ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }
                    : { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }
                }
              >
                {currentStatus === 'Completed'
                  ? <CheckCircle size={20} className="text-emerald-400 flex-none mt-0.5" />
                  : <Ban size={20} className="text-red-400 flex-none mt-0.5" />
                }
                <div>
                  {currentStatus === 'Completed' ? (
                    <>
                      <p className="text-emerald-300 font-semibold text-sm">✅ Order Completed & Closed</p>
                      <p className="text-emerald-400/70 text-xs mt-1">No further status changes are allowed.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-300 font-semibold text-sm">❌ Order Cancelled</p>
                      {order.cancelReason && (
                        <p className="text-red-400/70 text-xs mt-1">Reason: {order.cancelReason}</p>
                      )}
                      <p className="text-red-400/70 text-xs mt-1">No further status changes are allowed.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* No permission */}
            {!isTerminal && !hasAnyAction && (
              <div className="rounded-xl p-4 border border-white/10 bg-white/5 flex items-center gap-3">
                <AlertCircle size={20} className="text-amber-400 flex-none" />
                <p className="text-amber-300 text-sm">You don't have permission to change this order's status.</p>
              </div>
            )}

            {/* Forward progress actions */}
            {!isTerminal && forwardStatuses.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Move To</p>
                <div className="flex flex-wrap gap-2">
                  {forwardStatuses.map(s => (
                    <NextStatusButton
                      key={s}
                      statusKey={s}
                      isSelected={selectedStatus === s}
                      onClick={handleSelectStatus}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Special actions */}
            {!isTerminal && specialStatuses.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/30">Special Actions</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {specialStatuses.map(s => (
                    <SpecialActionButton
                      key={s}
                      statusKey={s}
                      isSelected={selectedStatus === s}
                      onClick={handleSelectStatus}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reason field — shown only for OnHold / Cancelled */}
            <AnimatePresence>
              {isReasonRequired && (
                <motion.div
                  key="reason"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-white/70 mb-1.5">
                    Reason <span className="text-red-400">*</span>
                    <span className="text-white/30 font-normal ml-2">(min 10 characters)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => { setReason(e.target.value); setError(''); }}
                    placeholder="Enter reason for holding / cancelling this order..."
                    disabled={loading}
                    rows={3}
                    className="w-full rounded-xl text-sm text-white placeholder-white/30 resize-none focus:outline-none transition-colors disabled:opacity-50"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${reason.trim().length >= 10 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      padding: '10px 14px',
                    }}
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: reason.trim().length >= 10 ? '#22C55E' : '#EF4444' }}>
                    {reason.trim().length}/10 min
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes (always visible when there's an action) */}
            {hasAnyAction && !isTerminal && (
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1.5">
                  Notes <span className="text-white/30 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add an internal note about this status change..."
                  disabled={loading}
                  rows={2}
                  className="w-full rounded-xl text-sm text-white placeholder-white/30 resize-none focus:outline-none transition-colors disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '10px 14px',
                  }}
                />
              </div>
            )}

            {/* Payment section */}
            {hasAnyAction && !isTerminal && order.balanceAmount > 0 && (
              <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <IndianRupee size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-white/80">
                    Payment Update <span className="text-white/30 font-normal">(optional)</span>
                  </h4>
                </div>

                {/* Financial summary */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                  <div className="rounded-lg p-2.5 border border-white/10 bg-white/5 text-center">
                    <p className="text-white/40 mb-1">Total Bill</p>
                    <p className="text-white font-bold">₹{(order.estimatedPrice || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-lg p-2.5 border border-emerald-500/20 bg-emerald-500/10 text-center">
                    <p className="text-emerald-400/70 mb-1">Paid So Far</p>
                    <p className="text-emerald-300 font-bold">₹{(order.advanceAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-lg p-2.5 border border-orange-500/20 bg-orange-500/10 text-center">
                    <p className="text-orange-400/70 mb-1">Balance Due</p>
                    <p className="text-orange-300 font-bold">₹{(order.balanceAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1">Add Payment Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      max={order.balanceAmount}
                      value={paymentAmount}
                      onChange={e => { setPaymentAmount(e.target.value); setError(''); }}
                      placeholder="0"
                      disabled={loading}
                      className="w-full rounded-xl text-sm text-white placeholder-white/30 focus:outline-none disabled:opacity-50"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '10px 14px',
                      }}
                      onFocus={e => e.target.style.borderColor = '#3B82F6'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  {paymentAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-white/50 mb-1.5">
                          Payment Mode <span className="text-red-400">*</span>
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {['Cash', 'UPI', 'Cheque', 'Bank Transfer'].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => { setPaymentMode(m); setError(''); }}
                              disabled={loading}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                              style={paymentMode === m
                                ? { background: '#3B82F6', borderColor: '#3B82F6', color: '#fff' }
                                : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }
                              }
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/50 mb-1">Reference No. (Txn ID / Cheque No.)</label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={e => setPaymentReference(e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                          className="w-full rounded-xl text-sm text-white placeholder-white/30 focus:outline-none disabled:opacity-50"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '10px 14px',
                          }}
                          onFocus={e => e.target.style.borderColor = '#3B82F6'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Inline error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl p-3 border"
                  style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  <AlertCircle size={16} className="text-red-400 flex-none" />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex-none px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>

            {(hasAnyAction && !isTerminal) && (
              <motion.button
                whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                onClick={handleUpdate}
                disabled={!canSubmit}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canSubmit ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : 'rgba(255,255,255,0.1)',
                  boxShadow: canSubmit ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Updating...</>
                ) : (
                  <><CheckCircle size={16} /> Update Status</>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

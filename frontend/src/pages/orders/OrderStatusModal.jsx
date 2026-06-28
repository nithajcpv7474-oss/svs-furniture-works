import React, { useState } from 'react';
import { X, CheckCircle, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_TRANSITIONS = {
  'Pending':        ['Confirmed', 'OnHold', 'Cancelled'],
  'Confirmed':      ['InProduction', 'OnHold', 'Cancelled'],
  'InProduction':   ['QualityCheck', 'OnHold', 'Cancelled'],
  'QualityCheck':   ['ReadyForDelivery', 'InProduction', 'OnHold', 'Cancelled'],
  'ReadyForDelivery': ['Delivered', 'OnHold', 'Cancelled'],
  'Delivered':      ['Completed'],
  'Completed':      [], 
  'OnHold':         ['Pending', 'Confirmed', 'InProduction', 'QualityCheck', 'ReadyForDelivery', 'Cancelled'],
  'Cancelled':      []
};

const ROLE_TARGETS = {
  'Admin': Object.keys(STATUS_TRANSITIONS),
  'Management': [], // Management can't change status directly
  'Sales Staff': ['Confirmed', 'OnHold', 'Cancelled'],
  'Production Staff': ['InProduction', 'QualityCheck', 'ReadyForDelivery'],
  'Delivery Staff': ['Delivered']
};

const getStatusLabel = (s) => s.replace(/([A-Z])/g, ' $1').trim();

export const OrderStatusModal = ({ isOpen, onClose, order, userRole, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(order?.orderStatus);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const currentStatus = order.orderStatus;
  const isTerminal = ['Completed', 'Cancelled'].includes(currentStatus);
  
  let validNextStatuses = userRole === 'Admin' 
    ? Object.keys(STATUS_TRANSITIONS).filter(s => s !== currentStatus)
    : (STATUS_TRANSITIONS[currentStatus] || []).filter(s => (ROLE_TARGETS[userRole] || []).includes(s));

  const handleUpdate = async () => {
    if ((selectedStatus === 'Cancelled' || selectedStatus === 'OnHold') && !reason.trim()) {
      alert(`Reason is required when moving to ${getStatusLabel(selectedStatus)}.`);
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        status: selectedStatus,
        notes: notes.trim(),
        reason: reason.trim(),
        paymentAmount: paymentAmount ? Number(paymentAmount) : undefined,
        paymentMode: paymentAmount ? paymentMode : undefined,
        paymentReference: paymentAmount ? paymentReference.trim() : undefined
      };
      
      await onUpdate(order.id, payload);
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const isReasonRequired = selectedStatus === 'Cancelled' || selectedStatus === 'OnHold';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Update Status</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Current Status: <span className="text-blue-600 dark:text-blue-400">{getStatusLabel(currentStatus)}</span>
              </label>
              
              {isTerminal && userRole !== 'Admin' ? (
                <div className="p-4 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-lg text-sm border border-orange-200 dark:border-orange-500/20">
                  This order is in a terminal state ({getStatusLabel(currentStatus)}) and cannot be modified further.
                </div>
              ) : validNextStatuses.length === 0 ? (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-500/20">
                  You do not have permission to transition this order from its current state.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {validNextStatuses.map(s => {
                    const isDanger = s === 'Cancelled' || s === 'OnHold';
                    const isSelected = selectedStatus === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSelected 
                            ? (isDanger ? 'bg-red-500 text-white shadow-md' : 'bg-primary text-white shadow-md')
                            : (isDanger ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20' 
                                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700')
                        }`}
                      >
                        {getStatusLabel(s)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes & Reason */}
            {validNextStatuses.length > 0 && (!isTerminal || userRole === 'Admin') && (
              <div className="space-y-4">
                {isReasonRequired && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      value={reason} onChange={e => setReason(e.target.value)}
                      placeholder={`Why is this order being ${getStatusLabel(selectedStatus)}?`}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#15120F] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes (Optional)</label>
                  <textarea 
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Add an internal note about this status change..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#15120F] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {/* Payment Section (Optional) */}
            {validNextStatuses.length > 0 && (!isTerminal || userRole === 'Admin') && order.balanceAmount > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <IndianRupee size={18} className="text-emerald-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Payment Update <span className="text-sm font-normal text-slate-500">(Optional)</span></h3>
                </div>
                
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 block mb-1">Total Bill</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">₹{order.estimatedPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800/50">
                    <span className="text-emerald-600 block mb-1">Paid So Far</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{order.advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-100 dark:border-orange-800/50">
                    <span className="text-orange-600 block mb-1">Balance Due</span>
                    <span className="font-bold text-orange-700 dark:text-orange-400">₹{order.balanceAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Add Payment Amount (₹)</label>
                    <input 
                      type="number" max={order.balanceAmount}
                      value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#15120F] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Payment Mode</label>
                    <select 
                      value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#15120F] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reference No. (Txn ID, Cheque No.)</label>
                    <input 
                      type="text" 
                      value={paymentReference} onChange={e => setPaymentReference(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#15120F] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-md px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} disabled={loading} className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleUpdate} 
              disabled={loading || selectedStatus === currentStatus || validNextStatuses.length === 0}
              className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Updating...' : <><CheckCircle size={16} /> Save Update</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

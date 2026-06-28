import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle } from 'lucide-react';

const STAGES = [
  { id: 'Pending', label: 'Pending', color: 'orange' },
  { id: 'Confirmed', label: 'Confirmed', color: 'blue' },
  { id: 'InProduction', label: 'Production', color: 'purple' },
  { id: 'QualityCheck', label: 'Quality', color: 'yellow' },
  { id: 'ReadyForDelivery', label: 'Ready', color: 'teal' },
  { id: 'Delivered', label: 'Delivered', color: 'green' },
  { id: 'Completed', label: 'Completed', color: 'emerald' }
];

export const OrderProgressTracker = ({ currentStatus, history = [], onEditClick, permission }) => {
  const isCancelled = currentStatus === 'Cancelled';
  const isOnHold = currentStatus === 'OnHold';

  const getStageIndex = (status) => STAGES.findIndex(s => s.id === status);
  const currentIndex = getStageIndex(currentStatus);

  if (isCancelled || isOnHold) {
    return (
      <div className={`p-4 rounded-xl border mb-6 flex justify-between items-center ${
        isCancelled ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <AlertCircle className={isCancelled ? 'text-red-500' : 'text-slate-500'} size={24} />
          <div>
            <h3 className={`font-bold ${isCancelled ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
              Order {isCancelled ? 'Cancelled' : 'On Hold'}
            </h3>
            <p className={`text-sm ${isCancelled ? 'text-red-600 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'}`}>
              Please see status history below for details and reason.
            </p>
          </div>
        </div>
        {permission === 'full' && (
          <button onClick={onEditClick} className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg text-sm font-semibold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
            Edit Status
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card-premium p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Order Progress</h3>
        {permission === 'full' && (
          <button onClick={onEditClick} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-sm font-semibold hover:bg-blue-100 transition-colors">
            Update Status
          </button>
        )}
      </div>

      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-4 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>

        {/* Progress Line */}
        <div 
          className="absolute top-4 left-0 h-1 bg-emerald-500 rounded-full transition-all duration-500" 
          style={{ width: `${currentIndex > 0 ? (currentIndex / (STAGES.length - 1)) * 100 : 0}%` }}
        ></div>

        <div className="relative flex justify-between">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex || (idx === currentIndex && currentStatus === 'Completed');
            const isCurrent = idx === currentIndex && currentStatus !== 'Completed';
            
            // Find when this stage was reached from history
            const historyEntry = history.find(h => h.toStatus === stage.id);
            const dateStr = historyEntry ? new Date(historyEntry.changedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

            return (
              <div key={stage.id} className="flex flex-col items-center z-10 w-24">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 transition-colors duration-300 ${
                  isCompleted ? 'border-emerald-500 bg-emerald-500 dark:bg-emerald-500 text-white' : 
                  isCurrent ? 'border-blue-500 text-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' : 
                  'border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600'
                }`}>
                  {isCompleted ? <Check size={16} /> : isCurrent ? <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />}
                </div>
                
                <div className="mt-2 text-center">
                  <p className={`text-xs font-bold ${
                    isCompleted || isCurrent ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {stage.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {isCompleted ? `✓ ${dateStr}` : isCurrent ? 'Current' : 'Pending'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

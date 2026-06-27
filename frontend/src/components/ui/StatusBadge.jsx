import React from 'react';

const statusStyles = {
  // Common / Orders
  'Pending': 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)] border-transparent',
  'Confirmed': 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] border-transparent',
  'InProduction': 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] border-transparent',
  'ReadyForDelivery': 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] border-transparent',
  'Delivered': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] border-transparent',
  'Cancelled': 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] border-transparent',

  // Other Statuses (Mapping to new styles)
  'Scheduled': 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] border-transparent',
  'InProgress': 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] border-transparent',
  'QualityCheck': 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] border-transparent',
  'NeedsRework': 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)] border-transparent',
  'OnHold': 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-[0_0_10px_rgba(100,116,139,0.4)] border-transparent',
  'Rescheduled': 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)] border-transparent',

  // Success
  'Active': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] border-transparent',
  'Completed': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] border-transparent',
  'Passed': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] border-transparent',

  // Danger
  'Failed': 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] border-transparent',
  'Returned': 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] border-transparent',

  // Info
  'OutForDelivery': 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] border-transparent',
  'Dispatched': 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] border-transparent',
  'InTransit': 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] border-transparent',
  'InstallationPending': 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] border-transparent',

  // Neutral
  'Inactive': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  'NotStarted': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',

  // Priority
  'Low': 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  'Medium': 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
  'High': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',
  'Urgent': 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)] border-transparent animate-pulse',
};

export const StatusBadge = ({ status, className = '' }) => {
  const style = statusStyles[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
  
  // Split camelCase for better readability (e.g. InProduction -> In Production)
  const displayLabel = status ? status.replace(/([A-Z])/g, ' $1').trim() : 'Unknown';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${style} ${className}`}>
      {displayLabel}
    </span>
  );
};

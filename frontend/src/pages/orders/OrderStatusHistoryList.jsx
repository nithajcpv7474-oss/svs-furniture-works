import React from 'react';
import { History, User as UserIcon } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const OrderStatusHistoryList = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-orange-500';
      case 'Confirmed': return 'bg-blue-500';
      case 'InProduction': return 'bg-purple-500';
      case 'QualityCheck': return 'bg-yellow-500';
      case 'ReadyForDelivery': return 'bg-teal-500';
      case 'Delivered': return 'bg-green-500';
      case 'Completed': return 'bg-emerald-500';
      case 'Cancelled': return 'bg-red-500';
      case 'OnHold': return 'bg-slate-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="card-premium p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <History size={18} className="text-primary" /> Status History
      </h3>
      
      <div className="space-y-6">
        {history.map((entry, index) => {
          const isLast = index === history.length - 1;
          const isCancelled = entry.toStatus === 'Cancelled';
          const isOnHold = entry.toStatus === 'OnHold';
          
          return (
            <div key={entry.id} className="relative flex gap-4">
              {/* Timeline Line */}
              {!isLast && (
                <div className="absolute top-8 left-[11px] bottom-[-24px] w-0.5 bg-slate-200 dark:bg-slate-700" />
              )}
              
              {/* Timeline Dot */}
              <div className="relative z-10 mt-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-4 border-white dark:border-[#15120F] ${getStatusColor(entry.toStatus)}`} />
              </div>
              
              {/* Content */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={entry.toStatus} />
                    {entry.fromStatus && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        (was {entry.fromStatus.replace(/([A-Z])/g, ' $1').trim()})
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {new Date(entry.changedAt).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', year: 'numeric', 
                      hour: 'numeric', minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-2 font-medium">
                  <UserIcon size={12} className="text-slate-400" />
                  {entry.user?.fullName || 'System User'} 
                  <span className="text-slate-400 font-normal">({entry.user?.role || 'User'})</span>
                </div>

                {(isCancelled || isOnHold) && entry.reason && (
                  <div className={`mt-2 p-2.5 rounded-lg text-sm border ${
                    isCancelled ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20' 
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                  }`}>
                    <span className="font-bold">Reason:</span> {entry.reason}
                  </div>
                )}

                {entry.notes && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line italic">
                    "{entry.notes}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

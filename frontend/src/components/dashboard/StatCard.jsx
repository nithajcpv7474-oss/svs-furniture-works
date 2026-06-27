import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass }) => {
  // Extract color for background tints
  // e.g. bg-blue-600 -> text-blue-600, bg-blue-50
  const colorName = colorClass ? colorClass.split('-')[1] : 'primary';
  const textClass = `text-${colorName}-600`;
  const bgSoftClass = `bg-${colorName}-50`;
  const borderClass = `border-${colorName}-100`;

  return (
    <div className={`card-premium p-6 border-l-4 ${colorClass.replace('bg-', 'border-')} group overflow-hidden relative`}>
      {/* Decorative background blob */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${colorClass}`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bgSoftClass} ${textClass} border ${borderClass} shadow-sm group-hover:-translate-y-1 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-4 relative z-10">
          <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
            trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend > 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-xs font-medium text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;

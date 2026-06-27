import React from 'react';

export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-3 w-full">
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
      </div>
      <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
    </div>
    <div className="mt-6 h-4 bg-slate-200 rounded w-1/4"></div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse h-80 flex flex-col">
    <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
  </div>
);

export const WidgetSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse h-96 flex flex-col">
    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
      ))}
    </div>
  </div>
);

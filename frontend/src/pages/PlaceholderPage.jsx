import React from 'react';
import { Hammer } from 'lucide-react';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-6">
        <Hammer size={40} />
      </div>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">{description}</p>
      <div className="inline-flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-sm font-medium">
        Module Under Development
      </div>
    </div>
  );
};

export default PlaceholderPage;

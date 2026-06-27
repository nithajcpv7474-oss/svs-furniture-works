import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';

export const FormAlert = ({ error, type = 'error', onClose }) => {
  if (!error) return null;
  
  const isError = type === 'error';
  const containerClass = isError 
    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
    : 'bg-warning-light text-warning-dark dark:bg-warning/10 dark:text-warning border border-warning/20';

  return (
    <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium mb-4 ${containerClass}`}>
      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1">{error}</div>
      {onClose && (
         <button onClick={onClose} className="hover:opacity-70 transition-opacity">
           <XCircle size={16}/>
         </button>
      )}
    </div>
  );
};

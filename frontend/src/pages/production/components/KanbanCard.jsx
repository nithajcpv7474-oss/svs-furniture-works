import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const KanbanCard = ({ job, isUpdating, onTitleClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  // 3. Due date logic
  let dateColor = 'text-slate-500 dark:text-slate-400';
  let DateIcon = Clock;
  let dateText = 'TBD';

  if (job.expectedCompletionDate) {
    const dueDate = new Date(job.expectedCompletionDate);
    const today = new Date();
    // Reset time for accurate day difference
    dueDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const daysDiff = differenceInDays(dueDate, today);
    dateText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (job.productionStage !== 'ReadyForDelivery') {
      if (daysDiff < 0) {
        dateColor = 'text-red-600 font-bold';
        DateIcon = AlertTriangle;
      } else if (daysDiff <= 2) {
        dateColor = 'text-amber-500 font-bold';
        DateIcon = Clock;
      }
    }
  }

  // Priority Colors
  const priorityColors = {
    Urgent: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  };

  const leftBorderColors = {
    Urgent: 'border-l-red-500',
    High: 'border-l-orange-500',
    Medium: 'border-l-amber-500',
    Low: 'border-l-slate-400'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing border-l-4 ${leftBorderColors[job.priority] || 'border-l-transparent'}`}
    >
      {/* 4. Disable drag interaction while saving */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl rounded-l-none">
          <Loader2 className="animate-spin text-primary w-6 h-6" />
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
          {job.productionNumber}
        </span>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${priorityColors[job.priority] || priorityColors.Low}`}>
          {job.priority}
        </span>
      </div>

      <h4 
        onClick={() => onTitleClick(job.id)}
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag on title click
        className="font-semibold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1 hover:text-primary transition-colors cursor-pointer"
      >
        {job.order?.furnitureName || 'Unknown Item'}
      </h4>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">
        {job.assignedEmployee || 'Unassigned'} • {job.order?.orderNumber}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className={`flex items-center gap-1.5 text-xs ${dateColor}`}>
          <DateIcon size={14} />
          <span>{dateText}</span>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { ArchiveX } from 'lucide-react';

const KanbanColumn = ({ stage, label, jobs, updatingJobIds, onTitleClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div className={`flex-shrink-0 w-80 flex flex-col bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl border transition-colors ${isOver ? 'border-primary shadow-lg bg-primary/5 dark:bg-primary/5' : 'border-slate-200 dark:border-slate-700'}`}>
      {/* 2. Fix empty column styling (All columns use identical header/background/border treatment) */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-100 dark:bg-slate-800 rounded-t-2xl">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{label}</h3>
        <span className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
          {jobs.length}
        </span>
      </div>

      <div 
        ref={setNodeRef}
        className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]"
      >
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.length === 0 ? (
            <div className="h-full min-h-[100px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
              <ArchiveX className="w-8 h-8 opacity-20" />
              <span className="text-sm font-medium">No jobs in this stage</span>
            </div>
          ) : (
            jobs.map(job => (
              <KanbanCard 
                key={job.id} 
                job={job} 
                isUpdating={updatingJobIds.has(job.id)} 
                onTitleClick={onTitleClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;

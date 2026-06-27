import React, { useMemo, useState, useEffect } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getProductionJobs, updateProductionJob } from '../../services/production.service';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  TouchSensor,
  DragOverlay
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './components/KanbanColumn';
import KanbanCard from './components/KanbanCard';

const STAGES = [
  'MaterialAllocation',
  'WoodCutting',
  'Assembly',
  'Finishing',
  'Painting',
  'Upholstery',
  'QualityInspection',
  'Packing',
  'ReadyForDelivery'
];

const STAGE_LABELS = {
  MaterialAllocation: 'Material Allocation',
  WoodCutting: 'Wood Cutting',
  Assembly: 'Assembly',
  Finishing: 'Finishing',
  Painting: 'Painting / Polish',
  Upholstery: 'Upholstery',
  QualityInspection: 'Quality Inspection',
  Packing: 'Packing',
  ReadyForDelivery: 'Ready For Delivery'
};

const ProductionKanban = () => {
  const permission = usePermission('production');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track jobs currently making an API request to prevent double-moves
  const [updatingJobIds, setUpdatingJobIds] = useState(new Set());
  
  // Track active drag item for overlay
  const [activeJob, setActiveJob] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before drag starts, helpful to avoid accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Require 250ms press on touch devices before drag starts
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getProductionJobs({ limit: 1000, status: 'InProgress' });
      setJobs(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load production jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const job = jobs.find(j => j.id === active.id);
    setActiveJob(job);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const jobId = active.id;
    const targetStage = over.id; // The id of the Droppable is the stage name
    const job = jobs.find(j => j.id === jobId);

    if (!job || job.productionStage === targetStage) return;
    
    if (updatingJobIds.has(jobId)) {
      toast.error('This job is already being updated.');
      return;
    }

    const previousStage = job.productionStage;

    // 1. Optimistic UI Update
    setJobs(currentJobs => 
      currentJobs.map(j => j.id === jobId ? { ...j, productionStage: targetStage } : j)
    );

    setUpdatingJobIds(prev => new Set(prev).add(jobId));

    try {
      // 2. Perform Backend Request with conflict detection
      let newStatus = 'InProgress';
      if (targetStage === 'ReadyForDelivery') newStatus = 'Completed';
      
      await updateProductionJob(jobId, { 
        productionStage: targetStage, 
        status: newStatus,
        updatedAt: job.updatedAt // Pass current version timestamp for conflict detection
      });

      toast.success(`${job.order?.furnitureName || 'Job'} moved to ${STAGE_LABELS[targetStage]}`);
      
      // Refresh to get new timestamps and sync with List view
      await fetchJobs(); 
    } catch (error) {
      console.error(error);
      
      // 3. Rollback on Failure
      setJobs(currentJobs => 
        currentJobs.map(j => j.id === jobId ? { ...j, productionStage: previousStage } : j)
      );
      
      const isConflict = error.response?.data?.message?.includes('CONFLICT');
      toast.error(
        isConflict 
          ? "This job was just updated by someone else. Please refresh to see latest." 
          : "Couldn't update — please try again"
      );
      
      if (isConflict) fetchJobs(); // Auto-refresh on conflict
    } finally {
      setUpdatingJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group jobs by stage
  const groupedJobs = STAGES.reduce((acc, stage) => {
    acc[stage] = jobs.filter(j => j.productionStage === stage);
    return acc;
  }, {});

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Production Kanban</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Drag jobs between stages to update progress.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/production/list')} className="btn-secondary shadow-sm text-primary border-primary">
            List View
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 custom-scrollbar min-h-[600px]">
          {STAGES.map((stage) => (
            <KanbanColumn 
              key={stage}
              stage={stage}
              label={STAGE_LABELS[stage]}
              jobs={groupedJobs[stage] || []}
              updatingJobIds={updatingJobIds}
              onTitleClick={(id) => navigate(`/production/${id}`)}
            />
          ))}
        </div>
        
        {/* Drag Overlay for smooth visual feedback while dragging */}
        <DragOverlay>
          {activeJob ? (
            <div className="rotate-2 scale-105 opacity-90 shadow-2xl cursor-grabbing">
               <KanbanCard job={activeJob} isUpdating={false} onTitleClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default ProductionKanban;

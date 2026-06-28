import { usePermission } from '../../hooks/usePermission';
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductionJobById, updateProductionJob, advanceProductionStage, createProductionTask, updateProductionTask, createQualityInspection } from '../../services/production.service';
import { AuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Clock, Save, User, Package, Hammer, ListChecks,
  ShieldCheck, Loader2, ArrowRight, Zap, AlertTriangle, Box, Scissors,
  Layers, Paintbrush, Star, Truck, BarChart2, ChevronRight, Play, Pause,
  Download, Printer, ClipboardList, Activity, TrendingUp, Calendar, Tag,
  Users, Award, Wrench, FlaskConical, Archive, CheckSquare
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

/* ── Stage configuration ── */
const STAGES = [
  'MaterialAllocation', 'WoodCutting', 'Assembly', 'Finishing',
  'Painting', 'Upholstery', 'QualityInspection', 'Packing', 'ReadyForDelivery'
];

const STAGE_META = {
  MaterialAllocation: { label: 'Material Allocation', icon: Archive,     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  glow: 'rgba(59,130,246,0.3)' },
  WoodCutting:        { label: 'Wood Cutting',         icon: Scissors,   color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',   glow: 'rgba(6,182,212,0.3)' },
  Assembly:           { label: 'Assembly',             icon: Wrench,     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  glow: 'rgba(245,158,11,0.3)' },
  Finishing:          { label: 'Finishing',            icon: Layers,     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  glow: 'rgba(139,92,246,0.3)' },
  Painting:           { label: 'Painting',             icon: Paintbrush, color: '#EC4899', bg: 'rgba(236,72,153,0.12)',  glow: 'rgba(236,72,153,0.3)' },
  Upholstery:         { label: 'Upholstery',           icon: Layers,     color: '#10B981', bg: 'rgba(16,185,129,0.12)',  glow: 'rgba(16,185,129,0.3)' },
  QualityInspection:  { label: 'Quality Inspection',  icon: ShieldCheck, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)', glow: 'rgba(20,184,166,0.3)' },
  Packing:            { label: 'Packing',              icon: Box,        color: '#6366F1', bg: 'rgba(99,102,241,0.12)',  glow: 'rgba(99,102,241,0.3)' },
  ReadyForDelivery:   { label: 'Ready for Delivery',   icon: Truck,      color: '#10B981', bg: 'rgba(16,185,129,0.12)',  glow: 'rgba(16,185,129,0.3)' },
};

const STATUS_META = {
  NotStarted:  { label: 'Not Started', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
  InProgress:  { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)'  },
  OnHold:      { label: 'On Hold',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  Completed:   { label: 'Completed',   color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  Cancelled:   { label: 'Cancelled',   color: '#6B7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
};

/* ── Circular Progress ── */
const CircularProgress = ({ pct, color, size = 96, stroke = 8 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
};

/* ── KPI Card ── */
const KPICard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -4, boxShadow: `0 16px 40px ${color}25` }}
    className="relative overflow-hidden rounded-2xl p-5 cursor-default"
    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}
  >
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80,
      borderRadius: '50%', background: `radial-gradient(circle, ${color}30, transparent 70%)` }} />
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-xl" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-black text-white mb-1">{value}</p>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </motion.div>
);

/* ── Info Row ── */
const InfoRow = ({ icon: Icon, label, value, color = '#94A3B8' }) => (
  <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div className="mt-0.5 p-1.5 rounded-lg flex-shrink-0" style={{ background: `${color}18` }}>
      <Icon size={13} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#64748B' }}>{label}</p>
      <p className="text-sm font-semibold text-white truncate">{value || '—'}</p>
    </div>
  </div>
);

/* ── Spec Card ── */
const SpecCard = ({ icon: Icon, label, value, color = '#6366F1' }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="rounded-xl p-4 transition-all"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>{label}</span>
    </div>
    <p className="text-sm font-semibold text-white">{value || '—'}</p>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const ProductionDetails = () => {
  const permission = usePermission('production');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('specs');
  const [advancing, setAdvancing] = useState(false);

  /* ── Task State (unchanged) ── */
  const [newTaskName, setNewTaskName] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newEstHours, setNewEstHours] = useState('');

  /* ── Inspection State (unchanged) ── */
  const [inspectionStatus, setInspectionStatus] = useState('Passed');
  const [inspectionRemarks, setInspectionRemarks] = useState('');

  useEffect(() => { fetchJob(); }, [id]);

  /* ── All API calls UNCHANGED ── */
  const fetchJob = async () => {
    try {
      const data = await getProductionJobById(id);
      setJob(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStage = async () => {
    if (!job) return;
    const currentIndex = STAGES.indexOf(job.productionStage);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      if (window.confirm(`Advance job to ${nextStage.replace(/([A-Z])/g, ' $1').trim()}?`)) {
        setAdvancing(true);
        try {
          await advanceProductionStage(id, nextStage);
          fetchJob();
        } catch (error) {
          alert(error.response?.data?.message || 'Error advancing stage');
        } finally {
          setAdvancing(false);
        }
      }
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await updateProductionJob(id, { status: newStatus });
      fetchJob();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await createProductionTask(id, {
        taskName: newTaskName,
        assignedTo: newAssignedTo,
        estimatedHours: newEstHours
      });
      setNewTaskName(''); setNewAssignedTo(''); setNewEstHours('');
      fetchJob();
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      await updateProductionTask(taskId, { status });
      fetchJob();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddInspection = async (e) => {
    e.preventDefault();
    try {
      await createQualityInspection(id, {
        inspectionStatus,
        remarks: inspectionRemarks,
        inspectorName: user?.fullName || 'Inspector'
      });
      setInspectionRemarks('');
      fetchJob();
    } catch (error) {
      console.error(error);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Loading production job…</p>
      </div>
    );
  }

  if (!job) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
      <AlertTriangle size={40} className="text-rose-500 opacity-70" />
      <p className="font-semibold">Production job not found.</p>
    </div>
  );

  /* ── Derived values ── */
  const currentStageIndex = STAGES.indexOf(job.productionStage);
  const canAdvance = currentStageIndex < STAGES.length - 1 && job.status !== 'Completed';
  const progress = Math.round(((currentStageIndex) / (STAGES.length - 1)) * 100);
  const stageMeta = STAGE_META[job.productionStage] || STAGE_META.MaterialAllocation;
  const StageIcon = stageMeta.icon;
  const statusMeta = STATUS_META[job.status] || STATUS_META.NotStarted;
  const daysLeft = job.expectedCompletionDate
    ? differenceInDays(new Date(job.expectedCompletionDate), new Date())
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && job.status !== 'Completed';
  const tabs = [
    { key: 'specs',     label: 'Spec Sheet',        icon: ClipboardList },
    { key: 'materials', label: 'Materials',          icon: Layers },
    { key: 'timeline',  label: 'Stage History',      icon: Activity },
    { key: 'qa',        label: 'Quality Assurance',  icon: ShieldCheck },
  ];

  return (
    <div className="max-w-screen-xl mx-auto space-y-6 pb-24">

      {/* ══════════════════════════════════════════
          PREMIUM GRADIENT HEADER BANNER
      ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, #0F1729 0%, #111827 40%, ${stageMeta.color}18 100%)`,
          border: `1px solid ${stageMeta.color}25`,
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 300, height: 300,
          borderRadius: '50%', background: `radial-gradient(circle, ${stageMeta.color}20, transparent 70%)`,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="relative p-6 lg:p-8">
          {/* Back button + breadcrumb */}
          <div className="flex items-center gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/production/list')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={15} /> Back
            </motion.button>
            <span style={{ color: '#334155' }}>/</span>
            <span className="text-sm text-slate-500">Production</span>
            <span style={{ color: '#334155' }}>/</span>
            <span className="text-sm text-slate-400 font-medium">{job.productionNumber}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Job info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {job.productionNumber}
                </h1>
                {/* Status badge */}
                <motion.span
                  animate={{ boxShadow: [`0 0 0 0 ${statusMeta.border}`, `0 0 0 6px transparent`] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}
                >
                  {statusMeta.label}
                </motion.span>
                {/* Priority badge */}
                {job.priority === 'Urgent' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <Zap size={11} /> Urgent
                  </span>
                )}
                {isOverdue && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <AlertTriangle size={11} /> Overdue
                  </span>
                )}
              </div>

              <p className="text-lg font-semibold text-slate-300 mb-1">
                {job.order?.furnitureName}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Order: <span className="text-slate-400 font-medium">{job.order?.orderNumber}</span>
                {job.order?.customer?.fullName && (
                  <> &nbsp;·&nbsp; Customer: <span className="text-slate-400 font-medium">{job.order.customer.fullName}</span></>
                )}
              </p>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2">
                {job.assignedEmployee && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <User size={12} style={{ color: '#6366F1' }} />
                    {job.assignedEmployee}
                  </div>
                )}
                {job.expectedCompletionDate && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: isOverdue ? '#F87171' : '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Calendar size={12} style={{ color: isOverdue ? '#EF4444' : '#10B981' }} />
                    {format(new Date(job.expectedCompletionDate), 'MMM dd, yyyy')}
                    {daysLeft !== null && (
                      <span className={`ml-1 font-bold ${isOverdue ? 'text-red-400' : 'text-emerald-400'}`}>
                        ({isOverdue ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d left`})
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <BarChart2 size={12} style={{ color: stageMeta.color }} />
                  Stage {currentStageIndex + 1} of {STAGES.length}
                </div>
              </div>
            </div>

            {/* Right: Progress ring + actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <CircularProgress pct={progress} color={stageMeta.color} size={110} stroke={9} />
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{progress}%</span>
                  <span className="text-[10px] text-slate-400 font-medium">complete</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 w-full min-w-[200px]">
                {canAdvance && (
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: `0 8px 25px ${stageMeta.color}40` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdvanceStage}
                    disabled={advancing}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                    style={{ background: `linear-gradient(135deg, ${stageMeta.color}, ${stageMeta.color}cc)` }}
                  >
                    {advancing ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
                    Advance Stage
                  </motion.button>
                )}

                {permission === 'full' && (
                  <select
                    value={job.status}
                    onChange={handleStatusChange}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold outline-none cursor-pointer transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: statusMeta.color,
                    }}
                  >
                    <option value="NotStarted">Not Started</option>
                    <option value="InProgress">In Progress</option>
                    <option value="OnHold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          PRODUCTION WORKFLOW PIPELINE
      ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl p-5 overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Production Pipeline</p>
        <div className="flex items-center gap-0 min-w-max">
          {STAGES.map((stage, idx) => {
            const meta = STAGE_META[stage];
            const SIcon = meta.icon;
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isFuture = idx > currentStageIndex;
            return (
              <React.Fragment key={stage}>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="flex flex-col items-center gap-2 relative cursor-default"
                  style={{ minWidth: 80 }}
                >
                  {/* Stage dot */}
                  <motion.div
                    animate={isCurrent ? {
                      boxShadow: [`0 0 0 0 ${meta.glow}`, `0 0 0 10px transparent`]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isDone ? 'rgba(16,185,129,0.2)' : isCurrent ? meta.bg : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${isDone ? '#10B981' : isCurrent ? meta.color : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    {isDone
                      ? <CheckCircle size={16} style={{ color: '#10B981' }} />
                      : <SIcon size={16} style={{ color: isCurrent ? meta.color : '#475569' }} />
                    }
                  </motion.div>
                  <span className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color: isDone ? '#10B981' : isCurrent ? meta.color : '#475569', maxWidth: 72 }}>
                    {meta.label}
                  </span>
                </motion.div>

                {/* Connector line */}
                {idx < STAGES.length - 1 && (
                  <div className="relative flex-1" style={{ minWidth: 24, height: 2 }}>
                    <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    {idx < currentStageIndex && (
                      <motion.div
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                        transition={{ delay: idx * 0.08, duration: 0.4 }}
                        className="absolute inset-0 rounded-full origin-left"
                        style={{ background: 'linear-gradient(90deg, #10B981, #10B981aa)' }}
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          KPI CARDS ROW
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={TrendingUp} label="Overall Progress" value={`${progress}%`}
          sub={`Stage ${currentStageIndex + 1} / ${STAGES.length}`} color="#6366F1" delay={0.1} />
        <KPICard icon={Activity} label="Current Stage" value={stageMeta.label}
          sub="Active phase" color={stageMeta.color} delay={0.15} />
        <KPICard icon={Calendar} label={isOverdue ? 'Days Overdue' : 'Days Remaining'}
          value={daysLeft !== null ? `${Math.abs(daysLeft)}d` : '—'}
          sub={job.expectedCompletionDate ? format(new Date(job.expectedCompletionDate), 'MMM dd, yyyy') : ''}
          color={isOverdue ? '#EF4444' : '#10B981'} delay={0.2} />
        <KPICard icon={ShieldCheck} label="QA Inspections"
          value={job.inspections?.length ?? 0}
          sub={job.inspections?.find(i => i.inspectionStatus === 'Passed') ? 'Latest: Passed' : 'Pending'}
          color="#14B8A6" delay={0.25} />
      </div>

      {/* ══════════════════════════════════════════
          MAIN GRID: Left panel + Right tabs
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT PANEL ── */}
        <div className="space-y-4">

          {/* Current Stage Hero Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${stageMeta.bg}, rgba(255,255,255,0.02))`,
              border: `1px solid ${stageMeta.color}30`,
            }}
          >
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 120, height: 120,
              borderRadius: '50%', background: `radial-gradient(circle, ${stageMeta.color}20, transparent 70%)`
            }} />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Active Stage</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl" style={{ background: stageMeta.bg, border: `1px solid ${stageMeta.color}40`, boxShadow: `0 0 20px ${stageMeta.glow}` }}>
                  <StageIcon size={22} style={{ color: stageMeta.color }} />
                </div>
                <div>
                  <p className="text-lg font-black text-white">{stageMeta.label}</p>
                  <p className="text-xs" style={{ color: stageMeta.color }}>Step {currentStageIndex + 1} of {STAGES.length}</p>
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="h-2 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-2 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${stageMeta.color}, ${stageMeta.color}aa)`, boxShadow: `0 0 8px ${stageMeta.glow}` }}
                />
              </div>
              <p className="text-xs text-right font-bold" style={{ color: stageMeta.color }}>{progress}% complete</p>
            </div>
          </motion.div>

          {/* Quick Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748B' }}>Job Details</p>
            <InfoRow icon={Package}   label="Furniture"       value={`${job.order?.furnitureCategory} — ${job.order?.furnitureName}`} color="#6366F1" />
            <InfoRow icon={Tag}       label="Quantity"        value={job.order?.quantity ? `${job.order.quantity} units` : null} color="#F59E0B" />
            <InfoRow icon={User}      label="Assigned To"     value={job.assignedEmployee} color="#10B981" />
            <InfoRow icon={Calendar}  label="Target Date"     value={job.expectedCompletionDate ? format(new Date(job.expectedCompletionDate), 'MMM dd, yyyy') : null} color={isOverdue ? '#EF4444' : '#14B8A6'} />
            {job.priority && (
              <InfoRow icon={Zap} label="Priority" value={job.priority} color={job.priority === 'Urgent' ? '#EF4444' : '#94A3B8'} />
            )}
            {job.remarks && (
              <InfoRow icon={ClipboardList} label="Remarks" value={job.remarks} color="#8B5CF6" />
            )}
          </motion.div>

          {/* Materials summary */}
          {job.order?.orderMaterials?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Materials Overview</p>
              {job.order.orderMaterials.slice(0, 4).map(om => {
                const isCustom = !om.material;
                const isDeducted = currentStageIndex > 0;
                const hasEnough = isCustom || isDeducted || om.material.availableStock >= om.quantityRequired;
                const pct = isCustom ? 100 : (isDeducted ? 100 : Math.min(100, Math.round((om.material.availableStock / om.quantityRequired) * 100)));
                const barColor = isCustom ? '#A78BFA' : (isDeducted ? '#10B981' : hasEnough ? '#3B82F6' : '#EF4444');
                return (
                  <div key={om.id} className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-400 truncate">{isCustom ? om.customMaterialName : om.material.materialName}</span>
                      <span className="text-xs font-bold ml-2" style={{ color: barColor }}>
                        {isCustom ? 'Custom' : (isDeducted ? 'Allocated' : hasEnough ? 'OK' : 'Low')}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ── RIGHT PANEL: Tabs ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Premium pill tab nav */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar"
          >
            {tabs.map(tab => {
              const TIcon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                      : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#fff' : '#64748B',
                    border: isActive ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isActive ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  <TIcon size={15} />
                  {tab.label}
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── TAB: Spec Sheet ── */}
          <AnimatePresence mode="wait">
            {activeTab === 'specs' && (
              <motion.div key="specs"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <ClipboardList size={16} style={{ color: '#6366F1' }} />
                  </div>
                  <h3 className="text-lg font-black text-white">Manufacturing Specifications</h3>
                </div>

                {/* Dimensions */}
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Dimensions</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <SpecCard icon={ArrowRight} label="Length" value={job.order?.length ? `${job.order.length} ${job.order.measurementUnit}` : null} color="#3B82F6" />
                  <SpecCard icon={ArrowRight} label="Width" value={job.order?.width ? `${job.order.width} ${job.order.measurementUnit}` : null} color="#06B6D4" />
                  <SpecCard icon={ArrowRight} label="Height" value={job.order?.height ? `${job.order.height} ${job.order.measurementUnit}` : null} color="#8B5CF6" />
                </div>

                {/* Materials & Finish */}
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Materials & Finish</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <SpecCard icon={Archive} label="Wood Type" value={job.order?.woodMaterial} color="#F59E0B" />
                  <SpecCard icon={Paintbrush} label="Finish Type" value={job.order?.finishType} color="#EC4899" />
                  <SpecCard icon={Star} label="Polish Color" value={job.order?.polishColor} color="#8B5CF6" />
                  <SpecCard icon={Wrench} label="Hardware" value={job.order?.hardwareDetails} color="#14B8A6" />
                </div>

                {/* Upholstery */}
                {job.order?.upholsteryRequired && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Upholstery</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <SpecCard icon={Layers} label="Material" value={job.order?.upholsteryMaterial} color="#10B981" />
                      <SpecCard icon={Tag} label="Color" value={job.order?.upholsteryColor} color="#F59E0B" />
                    </div>
                  </>
                )}

                {/* Glass */}
                {job.order?.glassRequired && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Glass</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <SpecCard icon={Box} label="Glass Type" value={job.order?.glassType} color="#06B6D4" />
                    </div>
                  </>
                )}

                {/* Special instructions */}
                {(job.order?.specialInstructions || job.remarks) && (
                  <div className="rounded-xl p-4 mt-2"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F59E0B' }}>Special Instructions</p>
                    </div>
                    {job.order?.specialInstructions && <p className="text-sm text-amber-200 mb-1 whitespace-pre-wrap">{job.order.specialInstructions}</p>}
                    {job.remarks && <p className="text-sm text-amber-200 whitespace-pre-wrap">{job.remarks}</p>}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: Materials ── */}
            {activeTab === 'materials' && (
              <motion.div key="materials"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Layers size={16} style={{ color: '#10B981' }} />
                  </div>
                  <h3 className="text-lg font-black text-white">Bill of Materials</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6">Raw materials required. Stock is reserved when job advances to Wood Cutting.</p>

                {job.order?.orderMaterials?.length > 0 ? (
                  <div className="space-y-3">
                    {job.order.orderMaterials.map(om => {
                      const isCustom = !om.material;
                      const isDeducted = currentStageIndex > 0;
                      const hasEnough = isCustom || isDeducted || om.material.availableStock >= om.quantityRequired;
                      const pct = isCustom ? 100 : (isDeducted ? 100 : Math.min(100, Math.round((om.material.availableStock / om.quantityRequired) * 100)));
                      const { color, label } = isCustom 
                        ? { color: '#A78BFA', label: 'Custom' }
                        : isDeducted
                        ? { color: '#10B981', label: 'Allocated' }
                        : hasEnough
                          ? { color: '#3B82F6', label: 'Available' }
                          : { color: '#EF4444', label: 'Shortage' };
                      return (
                        <motion.div key={om.id} whileHover={{ x: 4 }}
                          className="flex items-center gap-4 rounded-xl p-4 transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${color}15` }}>
                            <Archive size={16} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-semibold text-white text-sm">
                                {isCustom ? om.customMaterialName : om.material.materialName}
                              </p>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                {label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                              <span>Required: <strong className="text-slate-300">{om.quantityRequired} {isCustom ? 'Units' : om.material.unit}</strong></span>
                              <span>In Stock: <strong className="text-slate-300">{isCustom ? 'N/A' : `${om.material.availableStock} ${om.material.unit}`}</strong></span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-1.5 rounded-full"
                                style={{ background: color }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-14 text-slate-500 flex flex-col items-center gap-3">
                    <Archive size={36} className="opacity-30" />
                    <p className="font-medium">No materials linked to this job.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: Stage History ── */}
            {activeTab === 'timeline' && (
              <motion.div key="timeline"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <Activity size={16} style={{ color: '#F59E0B' }} />
                  </div>
                  <h3 className="text-lg font-black text-white">Stage History</h3>
                </div>

                {job.history?.length > 0 ? (
                  <div className="relative">
                    {/* Timeline spine */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    <div className="space-y-5">
                      {job.history.map((log, idx) => {
                        const stageMatch = log.newValue?.productionStage;
                        const meta = stageMatch ? STAGE_META[stageMatch] : null;
                        const evColor = meta?.color || '#6366F1';
                        const EvIcon = meta?.icon || CheckCircle;
                        return (
                          <motion.div key={log.id}
                            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            className="relative flex items-start gap-4 pl-14"
                          >
                            {/* Dot */}
                            <div className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                              style={{ background: `${evColor}15`, border: `2px solid ${evColor}40`, boxShadow: `0 0 12px ${evColor}25` }}>
                              <EvIcon size={14} style={{ color: evColor }} />
                            </div>

                            <motion.div whileHover={{ x: 4 }}
                              className="flex-1 rounded-xl p-4"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <p className="font-bold text-white text-sm">
                                  {log.action === 'StageAdvance'
                                    ? `Advanced to ${log.newValue.productionStage.replace(/([A-Z])/g, ' $1').trim()}`
                                    : log.action === 'AssignWorker'
                                      ? `Assigned to ${log.newValue.assignedEmployee}`
                                      : log.action === 'Create'
                                        ? 'Production Job Created'
                                        : log.action}
                                </p>
                                <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                                  style={{ background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
                                  {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-2">
                                <User size={12} style={{ color: '#6366F1' }} />
                                <span className="text-xs text-slate-400">{log.user?.fullName || 'System'}</span>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-14 text-slate-500 flex flex-col items-center gap-3">
                    <Activity size={36} className="opacity-30" />
                    <p className="font-medium">No history recorded yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: Quality Assurance ── */}
            {activeTab === 'qa' && (
              <motion.div key="qa"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Log inspection */}
                <div className="rounded-2xl p-6"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 rounded-xl" style={{ background: 'rgba(20,184,166,0.15)' }}>
                      <FlaskConical size={16} style={{ color: '#14B8A6' }} />
                    </div>
                    <h3 className="text-lg font-black text-white">Log Inspection Result</h3>
                  </div>

                  <form onSubmit={handleAddInspection} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {['Passed', 'NeedsRework', 'Failed'].map(status => {
                        const cfg = {
                          Passed:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: '✓ Pass',        border: 'rgba(16,185,129,0.3)' },
                          NeedsRework: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: '⟳ Needs Rework', border: 'rgba(245,158,11,0.3)' },
                          Failed:      { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: '✕ Fail',        border: 'rgba(239,68,68,0.3)' },
                        }[status];
                        const isActive = inspectionStatus === status;
                        return (
                          <motion.label key={status} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer font-bold text-sm transition-all"
                            style={{
                              background: isActive ? cfg.bg : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isActive ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                              color: isActive ? cfg.color : '#64748B',
                              boxShadow: isActive ? `0 4px 16px ${cfg.bg}` : 'none',
                            }}>
                            <input type="radio" className="hidden" checked={isActive} onChange={() => setInspectionStatus(status)} />
                            {cfg.label}
                          </motion.label>
                        );
                      })}
                    </div>

                    <textarea
                      required
                      placeholder="Inspection remarks, defects found, or QA notes…"
                      value={inspectionRemarks}
                      onChange={e => setInspectionRemarks(e.target.value)}
                      rows={3}
                      className="w-full text-sm rounded-xl px-4 py-3 outline-none resize-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#E2E8F0',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e => { e.currentTarget.style.border = '1px solid rgba(20,184,166,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />

                    <motion.button type="submit"
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(20,184,166,0.35)' }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}
                    >
                      <Save size={15} /> Save Inspection Record
                    </motion.button>
                  </form>
                </div>

                {/* Inspection history */}
                {job.inspections?.length > 0 && (
                  <div className="rounded-2xl p-6"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748B' }}>Inspection History</p>
                    <div className="space-y-3">
                      {job.inspections.map(ins => {
                        const cfg = {
                          Passed:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'PASSED' },
                          NeedsRework: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'REWORK' },
                          Failed:      { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  label: 'FAILED' },
                        }[ins.inspectionStatus] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', label: ins.inspectionStatus };

                        return (
                          <motion.div key={ins.id} whileHover={{ x: 4 }}
                            className="flex gap-4 items-start p-4 rounded-xl transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            <div className="p-2 rounded-xl flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                              <ShieldCheck size={16} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider"
                                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                  {cfg.label}
                                </span>
                                <span className="text-xs text-slate-500">{format(new Date(ins.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                              </div>
                              <p className="text-sm text-slate-300 mt-1">{ins.remarks}</p>
                              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                <Award size={11} style={{ color: '#6366F1' }} /> Inspector: {ins.inspectorName}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProductionDetails;

import React, { useMemo, useState, useEffect } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getProductionJobs, deleteProductionJob } from '../../services/production.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye, Trash2, Kanban, Loader2, Calendar, AlertTriangle, Users } from 'lucide-react';
import api from '../../services/api';

const ProductionList = () => {
  const permission = usePermission('production');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState({ data: [], meta: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignedWorker, setAssignedWorker] = useState('');
  const [workers, setWorkers] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchWorkers();
  }, [search, assignedWorker]);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/users?role=ProductionStaff');
      setWorkers(res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch workers', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getProductionJobs({ search });
      let data = res.data ? res.data : res;
      
      if (assignedWorker) {
        data = data.filter(job => job.assignedEmployee === assignedWorker);
      }
      
      // Sort: Urgent Priority first
      data.sort((a, b) => {
        if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
        if (b.priority === 'Urgent' && a.priority !== 'Urgent') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setJobs({ data, meta: { total: data.length } });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteProductionJob(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job.', error);
    }
  };

  const columns = [
    {
      header: 'Job Info',
      accessor: 'productionNumber',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.productionNumber}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Order: {row.order.orderNumber}</p>
          <p className="text-xs text-slate-400 mt-1">{row.order.furnitureName} ({row.order.quantity})</p>
        </div>
      )
    },
    {
      header: 'Current Stage',
      accessor: 'productionStage',
      render: (row) => (
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm bg-indigo-50 text-indigo-700 border-indigo-200">
            {row.productionStage.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          {row.assignedEmployee && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {row.assignedEmployee}</p>}
        </div>
      )
    },
    {
      header: 'Timeline',
      accessor: 'startDate',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Calendar size={12} className="text-slate-400" /> Start: {row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Calendar size={12} className="text-slate-400" /> Due: {row.expectedCompletionDate ? new Date(row.expectedCompletionDate).toLocaleDateString() : '-'}
          </div>
        </div>
      )
    },
    {
      header: 'Status & Priority',
      accessor: 'status',
      render: (row) => (
        <div className="space-y-2 flex flex-col items-start">
          <StatusBadge status={row.status} />
          <StatusBadge status={row.priority} />
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => navigate(`/production/${row.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
            <Eye size={18} />
          </button>
          <button onClick={() => setDeleteConfirmId(row.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Production Jobs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Track manufacturing stages and timelines.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/production')}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:bg-slate-950 transition-colors font-medium text-sm shadow-sm"
          >
            <Kanban size={18} /> Kanban Board
          </button>
        </div>
      </div>

      <div className="card-premium p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Job ID or Order ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={assignedWorker}
              onChange={(e) => setAssignedWorker(e.target.value)}
              className="input-field pl-10"
            >
              <option value="">All Workers</option>
              {workers.map(w => (
                <option key={w.id} value={w.fullName}>{w.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <span>Total Jobs:</span>
            <span className="bg-slate-200 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold">{jobs.meta.total}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card-premium p-8 flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading production jobs...</p>
          </div>
        </div>
      ) : (
        <DataTable 
          columns={columns}
          data={jobs.data}
          rowClassName={(row) => row.priority === 'Urgent' ? 'border-l-4 border-l-amber-500' : ''}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Production Job"
        footer={
          <>
            <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn-danger">Delete</button>
          </>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Production Job?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this production job? This action cannot be undone.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default ProductionList;

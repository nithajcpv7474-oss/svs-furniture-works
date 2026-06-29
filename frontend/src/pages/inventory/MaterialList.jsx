import React, { useMemo, useState, useEffect } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getMaterials, deleteMaterial } from '../../services/material.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit, Trash2, Package, ArrowRightLeft, AlertTriangle } from 'lucide-react';

const MaterialList = () => {
  const permission = usePermission('inventory');
  const navigate = useNavigate();
  const [materials, setMaterials] = useState({ data: [], meta: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, [search]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await getMaterials({ search });
      setMaterials(res.data ? res : { data: res, count: res.length, meta: { total: res.length } });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMaterial(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to delete material.', error);
    }
  };

  const columns = [
    {
      header: 'Item Details',
      accessor: 'materialName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <Package size={20} className="text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{row.materialName}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{row.materialCode}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <div>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
            {row.category}
          </span>
          {row.brand && <p className="text-xs text-slate-400 mt-1">{row.brand}</p>}
        </div>
      )
    },
    {
      header: 'Stock Level',
      accessor: 'availableStock',
      render: (row) => {
        const isLowStock = row.availableStock <= row.reorderLevel;
        return (
          <div>
            <p className={`font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
              {row.availableStock} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{row.unit}</span>
            </p>
            {isLowStock && (
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-500 mt-0.5">Low Stock</p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <StatusBadge status={row.status} />
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => navigate(`/inventory/materials/${row.id}/edit`)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
            <Edit size={18} />
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Raw Materials</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your factory stock and reorder levels.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/inventory/stock-log')}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
          >
            <ArrowRightLeft size={18} /> Stock Movement Log
          </button>
          {permission === 'full' && (<button 
            onClick={() => navigate('/inventory/materials/new')}
            className="btn-primary"
          >
            <Plus size={18} /> Add Material
          </button>)}
        </div>
      </div>

      <div className="card-premium p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by code or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <span>Total Items:</span>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold">{materials.meta?.total ?? materials.count ?? 0}</span>
        </div>
      </div>

      {loading ? (
        <div className="card-premium p-8 flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading materials...</p>
          </div>
        </div>
      ) : (
        <DataTable 
          columns={columns}
          data={materials.data}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Material"
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Material?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this material? This action cannot be undone.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default MaterialList;

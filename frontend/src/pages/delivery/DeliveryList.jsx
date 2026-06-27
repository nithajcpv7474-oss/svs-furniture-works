import React, { useMemo, useState, useEffect } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getDeliveries, deleteDelivery } from '../../services/delivery.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye, Trash2, Truck, Loader2, MapPin, AlertTriangle } from 'lucide-react';

const DeliveryList = () => {
  const permission = usePermission('delivery');
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState({ data: [], meta: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchDeliveries();
  }, [search]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await getDeliveries({ search });
      setDeliveries(res.data ? res : { data: res, meta: { total: res.length } });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDelivery(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchDeliveries();
    } catch (error) {
      console.error('Failed to delete delivery.', error);
    }
  };

  const columns = [
    {
      header: 'Delivery Info',
      accessor: 'deliveryNumber',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.deliveryNumber}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Order: {row.order.orderNumber}</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">Date: {row.dispatchDate ? new Date(row.dispatchDate).toLocaleDateString() : 'TBD'}</p>
        </div>
      )
    },
    {
      header: 'Destination',
      accessor: 'receiverName',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">{row.receiverName}</p>
          <div className="flex items-start gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
            <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" /> 
            <span className="truncate">{row.deliveryAddress}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Vehicle Details',
      accessor: 'vehicle',
      render: (row) => (
        row.vehicle ? (
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
              <Truck size={14} className="text-slate-400"/> {row.vehicle.vehicleNumber}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-5">{row.vehicle.driverName}</p>
          </div>
        ) : (
          <span className="text-xs font-medium italic text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">Unassigned</span>
        )
      )
    },
    {
      header: 'Status',
      accessor: 'deliveryStatus',
      render: (row) => (
        <StatusBadge status={row.deliveryStatus} />
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => navigate(`/delivery/${row.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View/Update Details">
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Delivery & Dispatch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage fleet, routing, and proof of deliveries.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/delivery/vehicles')}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:bg-slate-950 transition-colors font-medium text-sm shadow-sm"
          >
            <Truck size={18} /> Manage Vehicles
          </button>
          {permission === 'full' && (<button 
            onClick={() => navigate('/delivery/new')}
            className="btn-primary"
          >
            <Plus size={18} /> Schedule Delivery
          </button>)}
        </div>
      </div>

      <div className="card-premium p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search deliveries by ID or customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <span>Total Deliveries:</span>
          <span className="bg-slate-200 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold">{deliveries.meta.total}</span>
        </div>
      </div>

      {loading ? (
        <div className="card-premium p-8 flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading deliveries...</p>
          </div>
        </div>
      ) : (
        <DataTable 
          columns={columns}
          data={deliveries.data}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Delivery Record"
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Delivery Record?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this delivery record? This action cannot be undone.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default DeliveryList;

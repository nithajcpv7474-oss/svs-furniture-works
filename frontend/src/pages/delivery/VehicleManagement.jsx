import { usePermission } from '../../hooks/usePermission';
import React, { useMemo, useState, useEffect } from 'react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../services/delivery.service';
import { getUsers } from '../../services/user.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Search, Plus, Edit2, Trash2, Truck, Loader2, AlertTriangle } from 'lucide-react';

const VehicleManagement = () => {
  const permission = usePermission('delivery');
  const [vehicles, setVehicles] = useState({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, vehicleNumber: '', vehicleType: '', driverName: '', driverPhone: '', capacity: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [deliveryStaff, setDeliveryStaff] = useState([]);

  useEffect(() => {
    fetchVehicles();
    fetchStaff();
  }, [search]);

  const fetchStaff = async () => {
    try {
      const users = await getUsers({ role: 'DeliveryStaff' });
      setDeliveryStaff(users.data || users);
    } catch (err) {
      console.error('Failed to fetch delivery staff', err);
    }
  };

  const fetchVehicles = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getVehicles({ page, limit: 10, search });
      setVehicles(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateVehicle(formData.id, formData);
      } else {
        await createVehicle(formData);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving vehicle');
    }
  };

  const handleEdit = (v) => {
    setFormData(v);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteVehicle(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert('Cannot delete vehicle. It may be linked to deliveries.');
      setDeleteConfirmId(null);
    }
  };

  const columns = [
    {
      header: 'Vehicle',
      accessor: 'vehicleNumber',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300"><Truck size={16} /></div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{row.vehicleNumber}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.vehicleType}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Driver',
      accessor: 'driverName',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">{row.driverName || 'Unassigned'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.driverPhone}</p>
        </div>
      )
    },
    {
      header: 'Capacity',
      accessor: 'capacity',
      render: (row) => <span className="text-slate-600 dark:text-slate-300">{row.capacity || 'N/A'}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          row.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 
          row.status === 'InUse' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Edit2 size={18}/></button>
          <button onClick={() => setDeleteConfirmId(row.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors ml-2"><Trash2 size={18}/></button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Fleet Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage delivery vehicles and drivers.</p>
        </div>
        <button 
          onClick={() => { setFormData({ id: null, vehicleNumber: '', vehicleType: '', driverName: '', driverPhone: '', capacity: '' }); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      <div className="card-premium p-4">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by vehicle number or driver..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !pl-10"
          />
        </div>

        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Loading vehicles...</p>
            </div>
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={vehicles.data}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? 'Edit Vehicle' : 'Add Vehicle'}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">Save Vehicle</button>
          </>
        }
      >
        <form id="vehicleForm" onSubmit={handleSave} className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Vehicle Number *</label>
            <input required value={formData.vehicleNumber} onChange={e=>setFormData({...formData, vehicleNumber: e.target.value})} className="input-field" placeholder="e.g. MH-12-AB-1234"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Vehicle Type</label>
            <input value={formData.vehicleType} onChange={e=>setFormData({...formData, vehicleType: e.target.value})} className="input-field" placeholder="e.g. Tata Ace, Bolero Pickup"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Driver Name</label>
              <select 
                value={formData.driverName} 
                onChange={e => {
                  const staff = deliveryStaff.find(s => s.fullName === e.target.value);
                  setFormData({ ...formData, driverName: e.target.value, driverPhone: staff ? staff.phone : '' });
                }} 
                className="input-field bg-white dark:bg-slate-900"
              >
                <option value="">-- Unassigned --</option>
                {deliveryStaff.map(staff => (
                  <option key={staff.id} value={staff.fullName}>{staff.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Driver Phone</label>
              <input value={formData.driverPhone} onChange={e=>setFormData({...formData, driverPhone: e.target.value})} className="input-field" readOnly={!!formData.driverName && deliveryStaff.some(s => s.fullName === formData.driverName)}/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Capacity</label>
            <input value={formData.capacity} onChange={e=>setFormData({...formData, capacity: e.target.value})} className="input-field" placeholder="e.g. 1 Ton"/>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Vehicle"
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Vehicle?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this vehicle? This action cannot be undone.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default VehicleManagement;

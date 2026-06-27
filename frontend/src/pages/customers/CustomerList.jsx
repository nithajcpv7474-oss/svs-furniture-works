import React, { useMemo, useState, useEffect } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '../../services/customer.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit2, Trash2, Eye, Filter, AlertTriangle, Users, UserCheck, Store, Briefcase 
} from 'lucide-react';

const CustomerList = () => {
  const permission = usePermission('customers');
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  // KPI Stats
  const [kpiStats, setKpiStats] = useState({
    total: 0,
    active: 0,
    retail: 0,
    business: 0
  });

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getCustomers({ page, limit: 10, search, status: statusFilter, customerType: typeFilter });
      setData(res);
      
      // If no filters are applied, this represents the total correctly.
      // We will only do the parallel fetch if search is empty to show actual global stats, 
      // or we just show filtered stats. Let's do global stats on first load.
    } catch (error) {
      showToast('Failed to fetch customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const [totalRes, activeRes, retailRes, dealerRes, exportRes, interiorRes] = await Promise.all([
        getCustomers({ limit: 1 }), // Total
        getCustomers({ status: 'Active', limit: 1 }),
        getCustomers({ customerType: 'Retail', limit: 1 }),
        getCustomers({ customerType: 'Dealer', limit: 1 }),
        getCustomers({ customerType: 'Export', limit: 1 }),
        getCustomers({ customerType: 'InteriorDesigner', limit: 1 }),
      ]);
      setKpiStats({
        total: totalRes.meta?.total || 0,
        active: activeRes.meta?.total || 0,
        retail: retailRes.meta?.total || 0,
        business: (dealerRes.meta?.total || 0) + (exportRes.meta?.total || 0) + (interiorRes.meta?.total || 0)
      });
    } catch (err) {
      console.error('Failed to fetch KPI stats', err);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []); // Only fetch global stats once on mount

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, typeFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteCustomer(deleteConfirmId);
      showToast('Customer deleted successfully!');
      setDeleteConfirmId(null);
      fetchCustomers(data.meta.page);
      fetchGlobalStats(); // Update stats
    } catch (error) {
      showToast('Failed to delete customer.', 'error');
    }
  };

  // Avatar Gradient Hash
  const getAvatarGradient = (name) => {
    const gradients = [
      'from-blue-500 to-cyan-400',
      'from-purple-500 to-pink-500',
      'from-emerald-500 to-teal-400',
      'from-orange-500 to-amber-400',
      'from-rose-500 to-red-400'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const columns = [
    {
      header: 'Customer Details',
      accessor: 'fullName',
      render: (row) => (
        <div className="flex items-center gap-4 py-1">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(row.fullName)} text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white dark:ring-slate-800`}>
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{row.fullName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {row.customerCode}
              </span>
              {row.companyName && (
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={row.companyName}>
                  • {row.companyName}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessor: 'phone',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{row.phone}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{row.email || 'No email provided'}</p>
        </div>
      )
    },
    {
      header: 'Customer Type',
      accessor: 'customerType',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm backdrop-blur-md
          ${row.customerType === 'Retail' ? 'bg-orange-50/80 text-orange-700 border-orange-200/50' : 
            row.customerType === 'Dealer' ? 'bg-purple-50/80 text-purple-700 border-purple-200/50' : 
            'bg-blue-50/80 text-blue-700 border-blue-200/50'}
        `}>
          {row.customerType}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-[0_0_10px_rgba(0,0,0,0.05)]
          ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-500/20' : 
            'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-500/20'}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
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
        <div className="flex items-center justify-end gap-1">
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/customers/${row.id}`)} 
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all shadow-sm" 
            title="View Details"
          >
            <Eye size={18} />
          </motion.button>
          {permission === 'full' && (<motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/customers/${row.id}/edit`)} 
            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all shadow-sm" 
            title="Edit Customer"
          >
            <Edit2 size={18} />
          </motion.button>)}
          {permission === 'full' && (<motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setDeleteConfirmId(row.id)} 
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all shadow-sm" 
            title="Delete Customer"
          >
            <Trash2 size={18} />
          </motion.button>)}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold border flex items-center gap-3 backdrop-blur-md
            ${toast.type === 'error' ? 'bg-rose-50/90 text-rose-800 border-rose-200' : 'bg-emerald-50/90 text-emerald-800 border-emerald-200'}`}
          >
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-8 shadow-2xl shadow-blue-500/20"
      >
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.7,-18.1,95.3,-3.3C93.9,11.5,85.2,25.6,75.4,38.1C65.5,50.6,54.5,61.4,41.4,70.1C28.2,78.8,12.9,85.3,-2.2,88.9C-17.3,92.5,-32.4,93.2,-45.5,86.2C-58.6,79.2,-69.8,64.6,-77.3,50.3C-84.8,36,-88.6,22,-89.6,8C-90.6,-6,-88.8,-20,-83.4,-33C-78,-46,-69.1,-58,-56.9,-65.7C-44.7,-73.4,-29.3,-76.8,-14.2,-77.4C0.9,-77.9,16,-75.6,30.6,-80.6L44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">Customer Management</h1>
            <p className="text-blue-100 font-medium mt-2 text-sm md:text-base max-w-xl">
              Build and manage your business relationships. Track retail clients, dealers, and exports all in one beautifully organized workspace.
            </p>
          </div>
          {permission === 'full' && (<motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(236,72,153,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/customers/new')}
            className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg flex items-center gap-2 whitespace-nowrap border border-white/20 backdrop-blur-sm transition-all"
          >
            <Plus size={20} /> Add New Customer
          </motion.button>)}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {[
          { title: 'Total Customers', count: kpiStats.total, icon: Users, gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
          { title: 'Active Accounts', count: kpiStats.active, icon: UserCheck, gradient: 'from-emerald-400 to-emerald-500', shadow: 'shadow-emerald-500/20' },
          { title: 'Retail Clients', count: kpiStats.retail, icon: Store, gradient: 'from-orange-400 to-orange-500', shadow: 'shadow-orange-500/20' },
          { title: 'Business Partners', count: kpiStats.business, icon: Briefcase, gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' }
        ].map((kpi, index) => (
          <motion.div 
            key={index}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl ${kpi.shadow} relative overflow-hidden group`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${kpi.gradient} opacity-10 rounded-bl-full transition-transform duration-500 group-hover:scale-150`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide uppercase">{kpi.title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{kpi.count.toLocaleString()}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.gradient} text-white flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-12 transition-transform duration-300`}>
                <kpi.icon size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters & Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-4 items-center"
      >
        <div className="flex-1 w-full relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search customers by name, code, or contact info..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500/30 hover:border-slate-200 dark:hover:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="text-slate-400" size={16} />
            </div>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-purple-500/30 hover:border-slate-200 dark:hover:border-slate-700 rounded-xl py-3 pl-10 pr-8 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 appearance-none cursor-pointer transition-all"
            >
              <option value="">All Customer Types</option>
              <option value="Retail">Retail</option>
              <option value="Dealer">Dealer</option>
              <option value="InteriorDesigner">Interior Designer</option>
              <option value="Export">Export</option>
            </select>
          </div>
          <div className="relative flex-1 md:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-emerald-500/30 hover:border-slate-200 dark:hover:border-slate-700 rounded-xl py-3 pl-9 pr-8 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none cursor-pointer transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* DataTable */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/20 border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        {loading ? (
          <div className="p-20 flex flex-col justify-center items-center">
            <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg animate-pulse">Syncing Customer Records...</p>
          </div>
        ) : (
          <div className="customer-table-wrapper">
            <DataTable 
              columns={columns}
              data={data.data}
              pagination={{
                currentPage: data.meta.page,
                limit: data.meta.limit,
                total: data.meta.total
              }}
              onPageChange={fetchCustomers}
            />
          </div>
        )}
      </motion.div>

      {/* Delete Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Customer"
        footer={
          <div className="flex items-center gap-3 w-full justify-end">
            <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <button onClick={handleDelete} className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 transition-colors">Confirm Delete</button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-rose-50 border-[6px] border-rose-100 flex items-center justify-center mb-6">
            <AlertTriangle className="text-rose-600 w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete this record?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400 font-medium max-w-xs">
            This action is permanent and will remove all associated contact and business data.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default CustomerList;

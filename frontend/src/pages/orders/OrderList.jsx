import React, { useMemo, useState, useEffect } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getOrders, deleteOrder, updateOrderStatus } from '../../services/order.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { 
  Plus, Search, Edit, Trash2, Eye, IndianRupee, AlertTriangle, 
  TrendingUp, Clock, PackageCheck, ShoppingCart, Activity 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OrderStatusModal } from './OrderStatusModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const OrderList = () => {
  const permission = usePermission('orders');
  const navigate = useNavigate();
  const [orders, setOrders] = useState({ data: [], meta: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user } = useAuth();
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    production: 0,
    delivered: 0
  });

  const FILTERS = ['All Orders', 'Pending', 'Confirmed', 'InProduction', 'QualityCheck', 'ReadyForDelivery', 'Delivered', 'Completed', 'OnHold', 'Cancelled'];
  const FILTER_LABELS = {
    'All Orders': 'All',
    'Pending': 'Pending',
    'Confirmed': 'Confirmed',
    'InProduction': 'Production',
    'QualityCheck': 'Quality Check',
    'ReadyForDelivery': 'Ready',
    'Delivered': 'Delivered',
    'Completed': 'Completed',
    'OnHold': 'On Hold',
    'Cancelled': 'Cancelled'
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [search, activeFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const statusParam = activeFilter === 'All Orders' ? undefined : activeFilter;
      const res = await getOrders({ search, status: statusParam });
      setOrders(res.data ? res : { data: res, meta: { total: res.length } });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all to calculate stats accurately since we can't change the API to return stats
  const fetchStats = async () => {
    try {
      const res = await getOrders({ limit: 5000 });
      const allData = res.data || res;
      
      let pending = 0;
      let production = 0;
      let delivered = 0;

      allData.forEach(o => {
        if (o.orderStatus === 'Pending' || o.orderStatus === 'OnHold') pending++;
        if (o.orderStatus === 'InProduction' || o.orderStatus === 'QualityCheck') production++;
        if (o.orderStatus === 'Delivered' || o.orderStatus === 'Completed') delivered++;
      });

      setStats({
        total: res.meta?.total || allData.length,
        pending,
        production,
        delivered
      });
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteOrder(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete order.', error);
    }
  };

  const columns = [
    {
      header: 'Order Info',
      accessor: 'orderNumber',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.orderNumber}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{row.furnitureName} ({row.quantity})</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock size={12}/> Due: {row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : 'TBD'}
          </p>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{row.customer.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.customer.phone}</p>
        </div>
      )
    },
    {
      header: 'Financials',
      accessor: 'estimatedPrice',
      render: (row) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-500/20 w-max">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Total</span>
            <div className="flex items-center font-bold text-emerald-700 dark:text-emerald-300 text-sm">
              <IndianRupee size={12} className="mr-0.5"/> {row.estimatedPrice.toLocaleString('en-IN')}
            </div>
          </div>
          {row.balanceAmount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-100 dark:border-orange-500/20 w-max">
              <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400">Bal</span>
              <div className="flex items-center font-bold text-orange-700 dark:text-orange-300 text-xs">
                <IndianRupee size={10} className="mr-0.5"/> {row.balanceAmount.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status & Priority',
      accessor: 'orderStatus',
      render: (row) => (
        <div className="space-y-2 flex flex-col items-start">
          <StatusBadge status={row.orderStatus} />
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
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/orders/${row.id}`)} 
            className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] rounded-xl transition-all group relative" 
            title="View Details"
          >
            <Eye size={18} />
          </motion.button>
          
          {permission === 'full' && (<motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedOrder(row)} 
            className="p-2 text-purple-500 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-500 dark:hover:text-white hover:shadow-[0_0_12px_rgba(168,85,247,0.5)] rounded-xl transition-all" 
            title="Update Status"
          >
            <Edit size={18} />
          </motion.button>)}
          
          {permission === 'full' && (<motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setDeleteConfirmId(row.id)} 
            className="p-2 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white hover:shadow-[0_0_12px_rgba(239,68,68,0.5)] rounded-xl transition-all" 
            title="Delete"
          >
            <Trash2 size={18} />
          </motion.button>)}
        </div>
      )
    }
  ];

  const calcPercent = (val) => stats.total ? Math.round((val / stats.total) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12 max-w-[1600px] mx-auto"
    >
      {/* 1. Premium Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 pointer-events-none">
          <Activity size={300} className="text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md flex items-center gap-3">
              <ShoppingCart size={32} />
              Orders Management
            </h1>
            <p className="text-blue-100 mt-2 max-w-xl font-medium drop-shadow-sm text-sm md:text-base">
              Manage custom furniture orders, track production progress, handle payments, and oversee deliveries in one enterprise command center.
            </p>
          </div>
          
          {permission === 'full' && (<motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/orders/new')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold py-3 px-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} />
            New Custom Order
          </motion.button>)}
        </div>
      </div>

      {/* 2. Colorful KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Total Orders</p>
              <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
              <ShoppingCart size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
            <span className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md mr-2">100%</span> Volume
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-orange-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Pending Orders</p>
              <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.pending}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
            <span className="text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md mr-2">{calcPercent(stats.pending)}%</span> Of Total
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-purple-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">In Production</p>
              <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.production}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/40">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
            <span className="text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md mr-2">{calcPercent(stats.production)}%</span> Of Total
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-green-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Delivered</p>
              <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.delivered}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/40">
              <PackageCheck size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
            <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md mr-2">{calcPercent(stats.delivered)}%</span> Of Total
          </div>
        </motion.div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeFilter === filter 
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md transform scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search orders, customers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:ring-4 focus:ring-primary/20 dark:focus:ring-primary/30 focus:border-primary transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm font-medium shadow-inner"
          />
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-12 flex justify-center items-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Fetching orders...</p>
            </div>
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={orders.data}
            // Passing a wrapper class to the table if DataTable supports it, otherwise it relies on index.css
          />
        )}
      </div>

      {/* Delete Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Order"
        footer={
          <>
            <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn-danger">Delete</button>
          </>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 border-4 border-red-100 dark:border-red-500/20">
            <AlertTriangle className="text-red-500 w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Order?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this order? This action cannot be undone.
          </p>
        </div>
      </Modal>

      <OrderStatusModal 
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        userRole={user?.role}
        onUpdate={async (id, payload) => {
          await updateOrderStatus(id, payload);
          toast.success(`Order moved to ${payload.status}`);
          fetchOrders();
          fetchStats();
        }}
      />
    </motion.div>
  );
};

export default OrderList;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, deleteOrder } from '../../services/order.service';
import { Plus, Search, Edit, Trash2, Eye, Loader2, IndianRupee } from 'lucide-react';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders({ search });
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel and delete this order?')) {
      try {
        await deleteOrder(id);
        fetchOrders();
      } catch (error) {
        alert('Failed to delete order.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'InProduction': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'QualityCheck': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ReadyForDelivery': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage custom furniture specifications and sales.</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="px-4 py-2.5 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary-dark transition-colors font-medium text-sm shadow-sm"
        >
          <Plus size={18} /> New Custom Order
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer Name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span>Total Orders:</span>
            <span className="bg-slate-200 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold">{orders.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Order Info</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4">Status & Priority</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="animate-spin mx-auto w-8 h-8 text-primary mb-2" />
                    <p>Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{order.orderNumber}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{order.furnitureName} ({order.quantity})</p>
                      <p className="text-xs text-slate-400 mt-1">Due: {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'TBD'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{order.customer.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{order.customer.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100">
                        <IndianRupee size={14} className="text-slate-400"/> {order.estimatedPrice.toLocaleString('en-IN')}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bal: ₹{order.balanceAmount.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${getStatusBadge(order.orderStatus)}`}>
                          {order.orderStatus.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                          ${order.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 
                            order.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          {order.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button onClick={() => navigate(`/orders/${order.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => navigate(`/orders/${order.id}/edit`)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(order.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderList;

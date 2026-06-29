import React, { useState, useEffect, useContext } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getDeliveries } from '../../services/delivery.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AuthContext } from '../../context/AuthContext';
import { Truck, Search, Calendar as CalendarIcon, MapPin, Eye, Edit3, Printer, CheckCircle, Package } from 'lucide-react';
import { DeliveryStatusModal } from '../../components/delivery/DeliveryStatusModal';

const DeliveryDashboard = () => {
  const permission = usePermission('delivery');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [showPastCalendar, setShowPastCalendar] = useState(false);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await getDeliveries({ limit: 500 });
      setDeliveries(res.data || res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = 
      (d.order?.orderNumber?.toLowerCase().includes(search.toLowerCase())) ||
      (d.customer?.fullName?.toLowerCase().includes(search.toLowerCase())) ||
      (d.transporterName?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter ? d.deliveryStatus === statusFilter : true;
    const matchesType = typeFilter ? d.deliveryType === typeFilter : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getDaysCountdown = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const expected = new Date(dateString);
    expected.setHours(0,0,0,0);
    const diffTime = expected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const getKpiData = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    let scheduledThisWeek = 0;
    let dispatchedToday = 0;
    let inTransit = 0;
    let deliveredThisMonth = 0;

    deliveries.forEach(d => {
      const expDate = d.expectedDeliveryDate ? new Date(d.expectedDeliveryDate) : null;
      if (d.deliveryStatus === 'Scheduled' && expDate && expDate >= startOfWeek && expDate <= endOfWeek) scheduledThisWeek++;
      if (d.deliveryStatus === 'Dispatched' && d.dispatchDate && new Date(d.dispatchDate).toDateString() === today.toDateString()) dispatchedToday++;
      if (d.deliveryStatus === 'InTransit') inTransit++;
      if (d.deliveryStatus === 'Delivered' && d.actualDeliveryDate) {
         const actDate = new Date(d.actualDeliveryDate);
         if (actDate.getMonth() === today.getMonth() && actDate.getFullYear() === today.getFullYear()) deliveredThisMonth++;
      }
    });
    
    return { scheduledThisWeek, dispatchedToday, inTransit, deliveredThisMonth };
  };

  const kpi = getKpiData();

  const handleEditStatus = (delivery) => {
    setSelectedDelivery(delivery);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'Order Details',
      accessor: 'orderId',
      render: (row) => (
        <div>
          <button 
            onClick={() => navigate(`/delivery/${row.id}`)}
            className="font-bold text-primary hover:underline text-base"
          >
            {row.order?.orderNumber || row.deliveryNumber}
          </button>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{row.customer?.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.order?.furnitureName || 'Multiple Items'}</p>
        </div>
      )
    },
    {
      header: 'Type & Schedule',
      accessor: 'deliveryType',
      render: (row) => (
        <div>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
            {row.deliveryType || 'HomeDelivery'}
          </span>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="block font-medium flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-slate-400" />
              {row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : 'Unscheduled'}
            </span>
            {row.scheduledTimeSlot && (
              <span className="block text-xs text-slate-500 mt-0.5 ml-5">{row.scheduledTimeSlot}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'deliveryStatus',
      render: (row) => {
         const countdown = getDaysCountdown(row.expectedDeliveryDate);
         const isLate = countdown?.includes('ago') || countdown === 'Yesterday';
         return (
           <div className="flex flex-col items-start gap-1">
             <StatusBadge status={row.deliveryStatus} />
             {!['Delivered', 'Completed', 'Cancelled'].includes(row.deliveryStatus) && countdown && (
               <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                 {countdown}
               </span>
             )}
           </div>
         );
      }
    },
    {
      header: 'Assigned Transporter',
      accessor: 'vehicle',
      render: (row) => (
        row.transporterName || row.vehicle ? (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Truck size={14} className="text-primary"/> {row.transporterName || row.vehicle?.driverName}
            </div>
            {(row.transporterContact || row.vehicle?.vehicleNumber) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-5">{row.transporterContact || row.vehicle?.vehicleNumber}</p>
            )}
          </div>
        ) : (
          <button onClick={() => handleEditStatus(row)} className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            + Assign
          </button>
        )
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button 
            onClick={() => navigate(`/delivery/${row.id}`)} 
            className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" 
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => handleEditStatus(row)} 
            className="p-2 text-slate-400 hover:text-purple-500 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" 
            title="Edit Status"
          >
            <Edit3 size={18} />
          </button>
          <button 
            onClick={() => navigate(`/delivery/${row.id}/receipt`)} 
            className="p-2 text-slate-400 hover:text-green-500 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" 
            title="Print Receipt"
          >
            <Printer size={18} />
          </button>
        </div>
      )
    }
  ];

  const groupDeliveriesByDate = () => {
    const grouped = {};
    const today = new Date();
    today.setHours(0,0,0,0);

    deliveries.forEach(d => {
      if (d.deliveryStatus === 'Delivered' || d.deliveryStatus === 'Completed') return;
      
      const dateStr = d.expectedDeliveryDate ? new Date(d.expectedDeliveryDate).toDateString() : 'Unscheduled';
      const itemDate = d.expectedDeliveryDate ? new Date(d.expectedDeliveryDate) : null;
      if (itemDate) itemDate.setHours(0,0,0,0);

      if (!showPastCalendar && itemDate && itemDate < today) return;

      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(d);
    });
    
    return Object.keys(grouped).sort((a, b) => {
      if (a === 'Unscheduled') return 1;
      if (b === 'Unscheduled') return -1;
      return new Date(a) - new Date(b);
    }).map(date => ({ date, items: grouped[date] }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-premium p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Delivery Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage outbound logistics, installations, and proof of delivery.</p>
        </div>
        <div className="flex items-center gap-4">
          {(user?.role === 'Admin' || user?.role === 'SalesStaff') && (
            <button onClick={() => navigate('/delivery/vehicles')} className="btn-secondary hidden sm:flex">
              Manage Fleet
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled</p>
          <div className="flex items-end gap-3 mt-2">
            <h3 className="text-3xl font-bold text-white">{kpi.scheduledThisWeek}</h3>
            <p className="text-sm text-slate-400 mb-1">This Week</p>
          </div>
          <CalendarIcon className="absolute bottom-5 right-5 text-blue-500/50" size={28} />
        </div>
        <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispatched</p>
          <div className="flex items-end gap-3 mt-2">
            <h3 className="text-3xl font-bold text-white">{kpi.dispatchedToday}</h3>
            <p className="text-sm text-slate-400 mb-1">Today</p>
          </div>
          <Package className="absolute bottom-5 right-5 text-orange-500/50" size={28} />
        </div>
        <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Transit</p>
          <div className="flex items-end gap-3 mt-2">
            <h3 className="text-3xl font-bold text-white">{kpi.inTransit}</h3>
            <p className="text-sm text-slate-400 mb-1">Active</p>
          </div>
          <Truck className="absolute bottom-5 right-5 text-purple-500/50" size={28} />
        </div>
        <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivered</p>
          <div className="flex items-end gap-3 mt-2">
            <h3 className="text-3xl font-bold text-white">{kpi.deliveredThisMonth}</h3>
            <p className="text-sm text-slate-400 mb-1">This Month</p>
          </div>
          <CheckCircle className="absolute bottom-5 right-5 text-green-500/50" size={28} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          List View
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          Calendar Schedule
        </button>
        {activeTab === 'calendar' && (
          <div className="ml-auto flex items-center gap-2">
            <input 
              type="checkbox" 
              id="showPast" 
              checked={showPastCalendar} 
              onChange={e => setShowPastCalendar(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="showPast" className="text-sm text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
              Include Past Dates
            </label>
          </div>
        )}
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Order ID, Transporter..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-10"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[180px] bg-white dark:bg-slate-900">
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Dispatched">Dispatched</option>
              <option value="InTransit">In Transit</option>
              <option value="OutForDelivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field max-w-[150px] bg-white dark:bg-slate-900">
              <option value="">All Types</option>
              <option value="HomeDelivery">Home Delivery</option>
              <option value="Local">Local</option>
              <option value="Dealer">Dealer</option>
              <option value="Export">Export</option>
            </select>
          </div>

          <div className="card-premium overflow-hidden border-none shadow-sm">
            <DataTable 
              columns={columns}
              data={filteredDeliveries}
              isLoading={loading}
              keyField="id"
              emptyMessage="No deliveries found."
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groupDeliveriesByDate().map((group) => (
            <div key={group.date} className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[450px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-2xl">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CalendarIcon size={16} className="text-primary" />
                  {group.date}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{group.items.length} deliveries scheduled</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {group.items.map(del => (
                  <div 
                    key={del.id} 
                    className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-2 relative group transition-colors hover:border-blue-500/50"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{del.order?.orderNumber}</span>
                      <StatusBadge status={del.deliveryStatus} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{del.customer?.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{del.customer?.city || del.deliveryAddress}</p>
                    </div>
                    {(del.transporterName || del.vehicle) && (
                       <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                         <Truck size={12} className="text-primary" />
                         {del.transporterName || del.vehicle?.driverName}
                       </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => navigate(`/delivery/${del.id}`)} className="p-2 bg-slate-800 hover:bg-blue-600 text-white rounded-full transition-colors" title="View">
                         <Eye size={16} />
                      </button>
                      <button onClick={() => handleEditStatus(del)} className="p-2 bg-slate-800 hover:bg-purple-600 text-white rounded-full transition-colors" title="Update Status">
                         <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {groupDeliveriesByDate().length === 0 && !loading && (
             <div className="col-span-full py-12 text-center text-slate-500">
                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-lg font-medium">No deliveries scheduled</p>
             </div>
          )}
        </div>
      )}

      <DeliveryStatusModal 
        delivery={selectedDelivery}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdated={fetchDeliveries}
      />
    </div>
  );
};

export default DeliveryDashboard;

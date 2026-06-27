import React, { useMemo, useState, useEffect, useContext } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getDeliveries } from '../../services/delivery.service';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AuthContext } from '../../context/AuthContext';
import { Truck, Search, Calendar as CalendarIcon, Package, MapPin, Eye } from 'lucide-react';

const DeliveryDashboard = () => {
  const permission = usePermission('delivery');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'calendar'
  const [showPastCalendar, setShowPastCalendar] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await getDeliveries({ limit: 500 }); // fetch more for calendar view
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
      (d.customer?.fullName?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter ? d.deliveryStatus === statusFilter : true;
    const matchesType = typeFilter ? d.deliveryType === typeFilter : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = deliveries.filter(d => ['Pending', 'Scheduled'].includes(d.deliveryStatus)).length;

  const columns = [
    {
      header: 'Order Details',
      accessor: 'orderId',
      render: (row) => (
        <div>
          <button 
            onClick={() => navigate(`/delivery/${row.id}`)}
            className="font-bold text-primary hover:underline"
          >
            {row.order?.orderNumber || row.deliveryNumber}
          </button>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{row.customer?.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.order?.furnitureName}</p>
        </div>
      )
    },
    {
      header: 'Type & Schedule',
      accessor: 'deliveryType',
      render: (row) => (
        <div>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
            {row.deliveryType || 'Local'}
          </span>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1.5 flex items-center gap-1">
            <CalendarIcon size={12} className="text-slate-400" />
            {row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : 'TBD'}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'deliveryStatus',
      render: (row) => <StatusBadge status={row.deliveryStatus} />
    },
    {
      header: 'Assigned Transporter',
      accessor: 'vehicle',
      render: (row) => (
        row.vehicle ? (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Truck size={14} className="text-slate-400"/> {row.vehicle.vehicleNumber}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 ml-5">{row.vehicle.driverName}</p>
          </div>
        ) : (
          <span className="text-xs font-medium italic text-slate-400">Unassigned</span>
        )
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button 
          onClick={() => navigate(`/delivery/${row.id}`)} 
          className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" 
          title="View Details"
        >
          <Eye size={18} />
        </button>
      )
    }
  ];

  // Calendar grouping helper
  const groupDeliveriesByDate = () => {
    const grouped = {};
    const today = new Date();
    today.setHours(0,0,0,0);

    deliveries.forEach(d => {
      if (d.deliveryStatus === 'Delivered' || d.deliveryStatus === 'Completed') return; // Hide completed items from calendar by default to declutter, or just rely on date filter
      
      const dateStr = d.expectedDeliveryDate ? new Date(d.expectedDeliveryDate).toDateString() : 'Unscheduled';
      const itemDate = d.expectedDeliveryDate ? new Date(d.expectedDeliveryDate) : null;
      if (itemDate) itemDate.setHours(0,0,0,0);

      // Default view: Hide past dates unless toggle is on
      if (!showPastCalendar && itemDate && itemDate < today) return;

      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(d);
    });
    
    // Sort dates (Chronological)
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Delivery Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage outbound logistics, installations, and proof of delivery.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase">Pending / Scheduled</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{pendingCount}</p>
          </div>
          {(user?.role === 'Admin' || user?.role === 'SalesStaff') && (
            <button onClick={() => navigate('/delivery/vehicles')} className="btn-secondary">
              Manage Fleet
            </button>
          )}
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
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Order ID or Customer..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-10"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[200px] bg-white dark:bg-slate-900">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Scheduled">Scheduled</option>
              <option value="OutForDelivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="InstallationPending">Installation Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field max-w-[150px] bg-white dark:bg-slate-900">
              <option value="">All Types</option>
              <option value="Local">Local</option>
              <option value="Dealer">Dealer</option>
              <option value="Export">Export</option>
            </select>
          </div>

          <div className="card-premium overflow-hidden border-none shadow-none">
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
        /* Calendar View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groupDeliveriesByDate().map((group) => (
            <div key={group.date} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 rounded-t-2xl sticky top-0 backdrop-blur-sm z-10">
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
                    onClick={() => navigate(`/delivery/${del.id}`)}
                    className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{del.order?.orderNumber}</span>
                      <StatusBadge status={del.deliveryStatus} />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{del.customer?.fullName}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                      <MapPin size={12}/> {del.customer?.city || 'No Location'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;

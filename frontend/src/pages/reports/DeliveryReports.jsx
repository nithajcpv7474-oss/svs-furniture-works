import React, { useState, useEffect } from 'react';
import { getDeliveryReports } from '../../services/report.service';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, Printer, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { exportToExcel, exportToPDF, printReport } from '../../utils/exportUtils';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '../../components/ui/DatePicker';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const DeliveryReports = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDeliveryReports(dateRange.startDate && dateRange.endDate ? dateRange : {});
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(data.deliveries, [
      { header: 'Delivery No', accessor: 'deliveryNumber' },
      { header: 'Order No', accessor: 'order.orderNumber' },
      { header: 'Customer', accessor: 'customer.fullName' },
      { header: 'Status', accessor: 'deliveryStatus' },
      { header: 'Vehicle', accessor: 'vehicle.vehicleNumber' }
    ], 'Delivery_Report');
  };

  const handleExportPDF = () => {
    exportToPDF(data.deliveries, [
      { header: 'Delivery No', accessor: 'deliveryNumber' },
      { header: 'Order No', accessor: 'order.orderNumber' },
      { header: 'Status', accessor: 'deliveryStatus' },
      { header: 'Vehicle', accessor: 'vehicle.vehicleNumber' }
    ], 'Delivery Report', 'Delivery_Report');
  };

  if (loading && !data) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Calculate On-Time Delivery Percentage
  let totalDelivered = 0;
  let onTime = 0;
  data?.deliveries?.forEach(d => {
    if (d.deliveryStatus === 'Delivered') {
      totalDelivered++;
      if (d.expectedDeliveryDate && d.actualDeliveryDate) {
        if (new Date(d.actualDeliveryDate) <= new Date(d.expectedDeliveryDate)) {
          onTime++;
        }
      } else {
        // If no expected date, assume it was on time
        onTime++;
      }
    }
  });
  const onTimePercentage = totalDelivered === 0 ? 0 : Math.round((onTime / totalDelivered) * 100);

  // Group vehicle utilization for Pie Chart
  const vStats = {};
  data?.vehicleUtilization?.forEach(v => {
    vStats[v.status] = (vStats[v.status] || 0) + 1;
  });
  const vehicleStatusData = Object.keys(vStats).map(k => ({ name: k, value: vStats[k] }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Delivery & Dispatch</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fleet utilization and delivery performance.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="px-4 py-2 bg-info/10 dark:bg-info/20 text-indigo-800 font-bold rounded-lg border border-info/20 shadow-sm whitespace-nowrap">
            On-Time: {onTimePercentage}%
          </div>
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-950">
            <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
            <DatePicker 
              selected={dateRange.startDate ? new Date(dateRange.startDate + 'T00:00:00') : null}
              onChange={(date) => setDateRange({ ...dateRange, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}
              className="bg-transparent text-sm w-28 !pl-0"
              wrapperClassName="w-auto"
            />
            <span className="text-slate-400">-</span>
            <DatePicker 
              selected={dateRange.endDate ? new Date(dateRange.endDate + 'T00:00:00') : null}
              onChange={(date) => setDateRange({ ...dateRange, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}
              className="bg-transparent text-sm w-28 !pl-0"
              wrapperClassName="w-auto"
            />
          </div>
          <button onClick={handleExportPDF} title="Export PDF" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-danger/10 dark:bg-danger/20 hover:text-danger hover:border-danger/20 rounded-lg transition-colors"><Download size={18} /></button>
          <button onClick={handleExportExcel} title="Export Excel" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-success/10 dark:bg-success/20 hover:text-success hover:border-success/20 rounded-lg transition-colors"><Download size={18} /></button>
          <button onClick={printReport} title="Print" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:bg-primary/20 hover:text-primary hover:border-primary/20 rounded-lg transition-colors"><Printer size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Delivery Status Distribution</h3>
            <span className="text-sm font-bold text-danger bg-danger/10 dark:bg-danger/20 px-2 py-1 rounded">Delayed: {data?.delayedCount}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.statusDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Fleet Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeliveryReports;

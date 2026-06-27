import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../../services/api';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download,
  Printer,
  ArrowLeft,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportUtils';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '../../components/ui/DatePicker';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const RevenueReports = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!startDate && !endDate) return true;
      const orderDate = new Date(order.orderDate);
      if (startDate && orderDate < new Date(startDate)) return false;
      if (endDate && orderDate > new Date(endDate)) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  // KPI calculations
  const nonCancelledOrders = useMemo(
    () => filteredOrders.filter((o) => o.orderStatus !== 'Cancelled'),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => nonCancelledOrders.reduce((sum, o) => sum + (o.estimatedPrice || 0), 0),
    [nonCancelledOrders]
  );

  const averageOrderValue = useMemo(
    () => (nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0),
    [totalRevenue, nonCancelledOrders]
  );

  const completedRevenue = useMemo(
    () =>
      filteredOrders
        .filter((o) => o.orderStatus === 'Completed' || o.orderStatus === 'Delivered')
        .reduce((sum, o) => sum + (o.estimatedPrice || 0), 0),
    [filteredOrders]
  );

  const pendingRevenue = useMemo(
    () =>
      filteredOrders
        .filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'InProgress')
        .reduce((sum, o) => sum + (o.estimatedPrice || 0), 0),
    [filteredOrders]
  );

  // Monthly Revenue Trend (last 12 months)
  const monthlyRevenue = useMemo(() => {
    const monthMap = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap[key] = { month: label, revenue: 0 };
    }
    nonCancelledOrders.forEach((order) => {
      const d = new Date(order.orderDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        monthMap[key].revenue += order.estimatedPrice || 0;
      }
    });
    return Object.values(monthMap);
  }, [nonCancelledOrders]);

  // Revenue by Category
  const revenueByCategory = useMemo(() => {
    const catMap = {};
    nonCancelledOrders.forEach((order) => {
      const cat = order.furnitureCategory || 'Other';
      catMap[cat] = (catMap[cat] || 0) + (order.estimatedPrice || 0);
    });
    return Object.entries(catMap).map(([name, revenue]) => ({ name, revenue }));
  }, [nonCancelledOrders]);

  // Revenue by Status
  const revenueByStatus = useMemo(() => {
    const statusMap = {};
    filteredOrders.forEach((order) => {
      const status = order.orderStatus || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + (order.estimatedPrice || 0);
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Table data
  const tableData = useMemo(
    () =>
      filteredOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer?.fullName || '-',
        furnitureCategory: o.furnitureCategory || '-',
        furnitureName: o.furnitureName || '-',
        orderStatus: o.orderStatus,
        estimatedPrice: o.estimatedPrice || 0,
      })),
    [filteredOrders]
  );

  const exportColumns = [
    { header: 'Order No', accessor: 'orderNumber' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Category', accessor: 'furnitureCategory' },
    { header: 'Item', accessor: 'furnitureName' },
    { header: 'Status', accessor: 'orderStatus' },
    { header: 'Revenue', accessor: 'estimatedPrice' },
  ];

  const handleExportPDF = () => {
    exportToPDF(tableData, exportColumns, 'Revenue_Report', 'Revenue Analytics', user);
  };

  const handleExportExcel = () => {
    exportToExcel(tableData, exportColumns, 'Revenue_Report', 'Revenue Analytics', user);
  };

  const handleExportCSV = () => {
    exportToCSV(tableData, exportColumns, 'Revenue_Report');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Revenue Analytics</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analyze revenue trends and order distributions.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-950">
            <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
            <DatePicker 
              selected={startDate ? new Date(startDate + 'T00:00:00') : null}
              onChange={(date) => setStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
              className="bg-transparent text-sm w-28 !pl-0"
              wrapperClassName="w-auto"
            />
            <span className="text-slate-400">-</span>
            <DatePicker 
              selected={endDate ? new Date(endDate + 'T00:00:00') : null}
              onChange={(date) => setEndDate(date ? format(date, 'yyyy-MM-dd') : '')}
              className="bg-transparent text-sm w-28 !pl-0"
              wrapperClassName="w-auto"
            />
          </div>
          <button
            onClick={handleExportPDF}
            title="Export PDF"
            className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-danger/10 dark:bg-danger/20 hover:text-danger hover:border-danger/20 rounded-lg transition-colors"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={handleExportExcel}
            title="Export Excel"
            className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-success/10 dark:bg-success/20 hover:text-success hover:border-success/20 rounded-lg transition-colors"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-warning/10 dark:bg-warning/20 hover:text-warning hover:border-warning/20 rounded-lg transition-colors"
          >
            <Download size={18} />
          </button>
          <button
            onClick={printReport}
            title="Print"
            className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:bg-primary/20 hover:text-primary hover:border-primary/20 rounded-lg transition-colors"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                ₹{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Order Value</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                ₹{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Revenue</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                ₹{completedRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info/10 dark:bg-info/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-info" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Revenue</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                ₹{pendingRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend (AreaChart) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Monthly Revenue Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <RechartsTooltip
                cursor={{ fill: '#f8fafc' }}
                formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category (BarChart) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revenueByCategory.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Status (PieChart) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Revenue by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueByStatus.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Revenue Data</h3>
        </div>
        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order No</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:bg-slate-950">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{row.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.customerName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.furnitureCategory}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.furnitureName}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold">
                      {row.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">
                    ₹{row.estimatedPrice.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueReports;

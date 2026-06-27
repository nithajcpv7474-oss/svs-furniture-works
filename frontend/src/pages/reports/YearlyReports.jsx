import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, Download, Printer,
  ArrowLeft, Loader2, FileText, FileSpreadsheet, File, ChevronLeft, ChevronRight
} from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportUtils';
import { useNavigate } from 'react-router-dom';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

const YearlyReports = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const yearlyOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.orderDate || o.createdAt);
      return d.getFullYear() === selectedYear;
    });
  }, [orders, selectedYear]);

  const yearlyStats = useMemo(() => {
    const active = yearlyOrders.filter(o => o.orderStatus !== 'Cancelled');
    const completed = yearlyOrders.filter(o => ['Completed', 'Delivered'].includes(o.orderStatus));
    return {
      totalOrders: yearlyOrders.length,
      totalRevenue: active.reduce((s, o) => s + (o.estimatedPrice || 0), 0),
      completedOrders: completed.length,
      completedRevenue: completed.reduce((s, o) => s + (o.estimatedPrice || 0), 0),
      cancelledOrders: yearlyOrders.filter(o => o.orderStatus === 'Cancelled').length,
      avgOrderValue: active.length > 0 ? Math.round(active.reduce((s, o) => s + (o.estimatedPrice || 0), 0) / active.length) : 0
    };
  }, [yearlyOrders]);

  // Previous year comparison
  const prevYearStats = useMemo(() => {
    const prevOrders = orders.filter(o => {
      const d = new Date(o.orderDate || o.createdAt);
      return d.getFullYear() === selectedYear - 1;
    });
    const active = prevOrders.filter(o => o.orderStatus !== 'Cancelled');
    return {
      totalRevenue: active.reduce((s, o) => s + (o.estimatedPrice || 0), 0),
      totalOrders: prevOrders.length
    };
  }, [orders, selectedYear]);

  const revenueTrend = prevYearStats.totalRevenue > 0 
    ? Math.round(((yearlyStats.totalRevenue - prevYearStats.totalRevenue) / prevYearStats.totalRevenue) * 100) 
    : 0;

  // Monthly breakdown for the year
  const monthlyData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthOrders = yearlyOrders.filter(o => {
        const d = new Date(o.orderDate || o.createdAt);
        return d.getMonth() === idx;
      });
      const active = monthOrders.filter(o => o.orderStatus !== 'Cancelled');
      return {
        month,
        orders: monthOrders.length,
        revenue: active.reduce((s, o) => s + (o.estimatedPrice || 0), 0),
        completed: monthOrders.filter(o => ['Completed', 'Delivered'].includes(o.orderStatus)).length
      };
    });
  }, [yearlyOrders]);

  // Quarterly summary
  const quarterlyData = useMemo(() => {
    const quarters = [
      { name: 'Q1', months: [0, 1, 2] },
      { name: 'Q2', months: [3, 4, 5] },
      { name: 'Q3', months: [6, 7, 8] },
      { name: 'Q4', months: [9, 10, 11] }
    ];
    return quarters.map(q => {
      const qOrders = yearlyOrders.filter(o => {
        const d = new Date(o.orderDate || o.createdAt);
        return q.months.includes(d.getMonth());
      });
      const active = qOrders.filter(o => o.orderStatus !== 'Cancelled');
      return {
        quarter: q.name,
        orders: qOrders.length,
        revenue: active.reduce((s, o) => s + (o.estimatedPrice || 0), 0)
      };
    });
  }, [yearlyOrders]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const cats = {};
    yearlyOrders.filter(o => o.orderStatus !== 'Cancelled').forEach(o => {
      const cat = o.furnitureCategory || 'Other';
      cats[cat] = (cats[cat] || 0) + (o.estimatedPrice || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [yearlyOrders]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set();
    orders.forEach(o => {
      const d = new Date(o.orderDate || o.createdAt);
      years.add(d.getFullYear());
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [orders]);

  const handleExport = (type) => {
    const exportData = monthlyData.map(m => ({
      month: m.month,
      orders: m.orders,
      revenue: m.revenue,
      completed: m.completed
    }));
    const cols = [
      { header: 'Month', accessor: 'month' },
      { header: 'Orders', accessor: 'orders' },
      { header: 'Revenue', accessor: 'revenue' },
      { header: 'Completed', accessor: 'completed' }
    ];
    const title = `Annual Report ${selectedYear}`;
    if (type === 'excel') exportToExcel(exportData, cols, `Yearly_Report_${selectedYear}`, title, user);
    if (type === 'pdf') exportToPDF(exportData, cols, `Yearly_Report_${selectedYear}`, title, user);
    if (type === 'csv') exportToCSV(exportData, cols, `Yearly_Report_${selectedYear}`);
    setShowExportDropdown(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Annual Report</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Yearly business performance and growth analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <button onClick={() => setSelectedYear(y => y - 1)} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none cursor-pointer min-w-[60px] text-center">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => setSelectedYear(y => y + 1)} className="p-1 hover:bg-slate-200 rounded"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <button onClick={() => setShowExportDropdown(!showExportDropdown)} className="btn-secondary py-2 px-3 text-sm"><Download className="w-4 h-4" /> Export</button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-30">
                <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-success"/> Excel</button>
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><FileText className="w-4 h-4 text-red-500"/> PDF</button>
                <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><File className="w-4 h-4 text-slate-500 dark:text-slate-400"/> CSV</button>
              </div>
            )}
          </div>
          <button onClick={printReport} className="btn-secondary py-2 px-3 text-sm"><Printer className="w-4 h-4" /></button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Annual Revenue</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">₹{yearlyStats.totalRevenue.toLocaleString()}</p>
              {revenueTrend !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${revenueTrend >= 0 ? 'text-success' : 'text-danger'}`}>
                  {revenueTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(revenueTrend)}% vs {selectedYear - 1}
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{yearlyStats.totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">₹{yearlyStats.completedRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Order Value</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">₹{yearlyStats.avgOrderValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Monthly Revenue – {selectedYear}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <RechartsTooltip formatter={(v, n) => [n === 'revenue' ? `₹${v.toLocaleString()}` : v, n === 'revenue' ? 'Revenue' : 'Orders']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="orders" name="Orders" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} yAxisId={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quarterly + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Quarterly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Monthly Summary – {selectedYear}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Month</th>
                <th className="px-5 py-3 font-medium text-right">Orders</th>
                <th className="px-5 py-3 font-medium text-right">Revenue</th>
                <th className="px-5 py-3 font-medium text-right">Completed</th>
                <th className="px-5 py-3 font-medium text-right">Avg Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyData.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:bg-slate-950">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{m.month}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{m.orders}</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700">₹{m.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{m.completed}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">₹{m.orders > 0 ? Math.round(m.revenue / m.orders).toLocaleString() : '0'}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-950 font-bold">
                <td className="px-5 py-3 text-slate-800 dark:text-slate-100">Total</td>
                <td className="px-5 py-3 text-right text-slate-800 dark:text-slate-100">{yearlyStats.totalOrders}</td>
                <td className="px-5 py-3 text-right text-emerald-700">₹{yearlyStats.totalRevenue.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-slate-800 dark:text-slate-100">{yearlyStats.completedOrders}</td>
                <td className="px-5 py-3 text-right text-slate-800 dark:text-slate-100">₹{yearlyStats.avgOrderValue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YearlyReports;

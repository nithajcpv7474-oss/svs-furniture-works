import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import {
  TrendingUp, DollarSign, ShoppingCart, Calendar, Download, Printer,
  ArrowLeft, Loader2, FileText, FileSpreadsheet, File, ChevronLeft, ChevronRight
} from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportUtils';
import { useNavigate } from 'react-router-dom';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyReports = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
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

  // Filter orders for selected month
  const monthlyOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.orderDate || o.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [orders, selectedMonth, selectedYear]);

  const monthlyStats = useMemo(() => {
    const active = monthlyOrders.filter(o => o.orderStatus !== 'Cancelled');
    return {
      totalOrders: monthlyOrders.length,
      totalRevenue: active.reduce((s, o) => s + (o.estimatedPrice || 0), 0),
      completedOrders: monthlyOrders.filter(o => ['Completed', 'Delivered'].includes(o.orderStatus)).length,
      cancelledOrders: monthlyOrders.filter(o => o.orderStatus === 'Cancelled').length,
      avgOrderValue: active.length > 0 ? Math.round(active.reduce((s, o) => s + (o.estimatedPrice || 0), 0) / active.length) : 0
    };
  }, [monthlyOrders]);

  // Daily breakdown for the selected month
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOrders = monthlyOrders.filter(o => {
        const od = new Date(o.orderDate || o.createdAt);
        return od.getDate() === d;
      });
      days.push({
        day: d,
        orders: dayOrders.length,
        revenue: dayOrders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) => s + (o.estimatedPrice || 0), 0)
      });
    }
    return days;
  }, [monthlyOrders, selectedMonth, selectedYear]);

  // Category breakdown for the month
  const categoryData = useMemo(() => {
    const cats = {};
    monthlyOrders.filter(o => o.orderStatus !== 'Cancelled').forEach(o => {
      const cat = o.furnitureCategory || 'Other';
      cats[cat] = (cats[cat] || 0) + (o.estimatedPrice || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthlyOrders]);

  const navigateMonth = (dir) => {
    let nm = selectedMonth + dir;
    let ny = selectedYear;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setSelectedMonth(nm);
    setSelectedYear(ny);
  };

  const handleExport = (type) => {
    const exportData = monthlyOrders.map(o => ({
      orderNumber: o.orderNumber,
      customer: o.customer?.fullName,
      category: o.furnitureCategory,
      item: o.furnitureName,
      status: o.orderStatus,
      revenue: o.estimatedPrice,
      date: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : ''
    }));
    const cols = [
      { header: 'Order No', accessor: 'orderNumber' },
      { header: 'Customer', accessor: 'customer' },
      { header: 'Category', accessor: 'category' },
      { header: 'Item', accessor: 'item' },
      { header: 'Status', accessor: 'status' },
      { header: 'Revenue', accessor: 'revenue' },
      { header: 'Date', accessor: 'date' }
    ];
    const title = `${MONTHS[selectedMonth]} ${selectedYear} Report`;
    if (type === 'excel') exportToExcel(exportData, cols, `Monthly_Report_${SHORT_MONTHS[selectedMonth]}_${selectedYear}`, title, user);
    if (type === 'pdf') exportToPDF(exportData, cols, `Monthly_Report_${SHORT_MONTHS[selectedMonth]}_${selectedYear}`, title, user);
    if (type === 'csv') exportToCSV(exportData, cols, `Monthly_Report_${SHORT_MONTHS[selectedMonth]}_${selectedYear}`);
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
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Monthly Report</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Detailed monthly performance breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Month Navigator */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[140px] text-center">{MONTHS[selectedMonth]} {selectedYear}</span>
            <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-slate-200 rounded"><ChevronRight className="w-4 h-4" /></button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{monthlyStats.totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">₹{monthlyStats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{monthlyStats.completedOrders}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancelled</p>
          <p className="text-2xl font-bold text-danger mt-1">{monthlyStats.cancelledOrders}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Order Value</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">₹{monthlyStats.avgOrderValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Daily Revenue – {MONTHS[selectedMonth]}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Revenue by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Orders in {MONTHS[selectedMonth]} {selectedYear}</h3>
        </div>
        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Order No</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Revenue</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No orders found for this month.</td></tr>
              ) : monthlyOrders.map((o, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:bg-slate-950">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{o.orderNumber}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{o.customer?.fullName}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{o.furnitureCategory}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{o.furnitureName}</td>
                  <td className="px-5 py-3"><span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded text-xs font-bold">{o.orderStatus}</span></td>
                  <td className="px-5 py-3 text-right font-bold text-slate-700 dark:text-slate-200">₹{(o.estimatedPrice || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReports;

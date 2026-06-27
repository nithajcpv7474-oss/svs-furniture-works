import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package, Truck,
  Hammer, Download, Printer, Calendar, FileText, FileSpreadsheet, File,
  ArrowLeft, Loader2, BarChart2, Activity
} from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportUtils';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

const KPICard = ({ label, value, icon: Icon, color, bgColor, trend, trendLabel }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}% {trendLabel || 'vs last month'}
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl ${bgColor || 'bg-primary/10 dark:bg-primary/20'} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color || 'text-primary'}`} />
      </div>
    </div>
  </div>
);

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [productions, setProductions] = useState([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, materialsRes, usersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/customers'),
        api.get('/materials'),
        api.get('/users')
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : customersRes.data?.data || []);
      setMaterials(Array.isArray(materialsRes.data) ? materialsRes.data : materialsRes.data?.data || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || []);

      // Attempt deliveries and productions — silently handle if endpoints don't exist
      try {
        const deliveriesRes = await api.get('/deliveries');
        setDeliveries(Array.isArray(deliveriesRes.data) ? deliveriesRes.data : deliveriesRes.data?.data || []);
      } catch (e) { /* silently ignore */ }
      try {
        const productionsRes = await api.get('/productions');
        setProductions(Array.isArray(productionsRes.data) ? productionsRes.data : productionsRes.data?.data || []);
      } catch (e) { /* silently ignore */ }
    } catch (error) {
      console.error('Failed to fetch executive data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computed KPIs
  const kpis = useMemo(() => {
    const activeOrders = orders.filter(o => o.orderStatus !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.estimatedPrice || 0), 0);
    const completedRevenue = orders.filter(o => ['Completed', 'Delivered'].includes(o.orderStatus))
      .reduce((sum, o) => sum + (o.estimatedPrice || 0), 0);
    const pendingOrders = orders.filter(o => ['Pending', 'InProgress'].includes(o.orderStatus)).length;
    const inventoryValue = materials.reduce((sum, m) => sum + ((m.availableStock || 0) * (m.purchasePrice || 0)), 0);

    // This month calculations
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const ordersThisMonth = orders.filter(o => {
      const d = new Date(o.orderDate || o.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const revenueThisMonth = ordersThisMonth.filter(o => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (o.estimatedPrice || 0), 0);

    // Last month
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const ordersLastMonth = orders.filter(o => {
      const d = new Date(o.orderDate || o.createdAt);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });
    const revenueLastMonth = ordersLastMonth.filter(o => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (o.estimatedPrice || 0), 0);

    const revenueTrend = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0;
    const ordersTrend = ordersLastMonth.length > 0 ? Math.round(((ordersThisMonth.length - ordersLastMonth.length) / ordersLastMonth.length) * 100) : 0;

    return {
      totalRevenue, completedRevenue, pendingOrders, inventoryValue,
      revenueThisMonth, revenueTrend, ordersThisMonth: ordersThisMonth.length, ordersTrend,
      totalOrders: orders.length, totalCustomers: customers.length,
      activeUsers: users.filter(u => u.isActive).length
    };
  }, [orders, customers, materials, users]);

  // Monthly Revenue Trend
  const monthlyRevenueData = useMemo(() => {
    const monthMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthMap[key] = { month: key, revenue: 0, orders: 0 };
    }
    orders.forEach(o => {
      if (o.orderStatus === 'Cancelled') return;
      const d = new Date(o.orderDate || o.createdAt);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (monthMap[key]) {
        monthMap[key].revenue += o.estimatedPrice || 0;
        monthMap[key].orders += 1;
      }
    });
    return Object.values(monthMap);
  }, [orders]);

  // Order Status Distribution
  const statusDistribution = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Revenue by Category
  const categoryRevenue = useMemo(() => {
    const cats = {};
    orders.filter(o => o.orderStatus !== 'Cancelled').forEach(o => {
      const cat = o.furnitureCategory || 'Other';
      cats[cat] = (cats[cat] || 0) + (o.estimatedPrice || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders]);

  // Top Customers
  const topCustomers = useMemo(() => {
    const custMap = {};
    orders.filter(o => o.orderStatus !== 'Cancelled').forEach(o => {
      const name = o.customer?.fullName || 'Unknown';
      custMap[name] = (custMap[name] || 0) + (o.estimatedPrice || 0);
    });
    return Object.entries(custMap).map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  const handleExport = (type) => {
    const exportData = orders.map(o => ({
      orderNumber: o.orderNumber,
      customer: o.customer?.fullName,
      category: o.furnitureCategory,
      item: o.furnitureName,
      status: o.orderStatus,
      revenue: o.estimatedPrice,
      date: o.orderDate
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
    if (type === 'excel') exportToExcel(exportData, cols, 'Executive_Dashboard', 'Executive Dashboard Report', user);
    if (type === 'pdf') exportToPDF(exportData, cols, 'Executive_Dashboard', 'Executive Dashboard Report', user);
    if (type === 'csv') exportToCSV(exportData, cols, 'Executive_Dashboard');
    setShowExportDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Executive Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Comprehensive business overview and key performance indicators</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <button onClick={() => setShowExportDropdown(!showExportDropdown)} className="btn-secondary py-2 px-3 text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-30">
                <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-success"/> Excel</button>
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><FileText className="w-4 h-4 text-red-500"/> PDF</button>
                <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><File className="w-4 h-4 text-slate-500 dark:text-slate-400"/> CSV</button>
              </div>
            )}
          </div>
          <button onClick={printReport} className="btn-secondary py-2 px-3 text-sm"><Printer className="w-4 h-4" /> Print</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Revenue" value={`₹${kpis.totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-success" bgColor="bg-success/10 dark:bg-success/20" trend={kpis.revenueTrend} />
        <KPICard label="Total Orders" value={kpis.totalOrders} icon={ShoppingCart} color="text-primary" bgColor="bg-primary/10 dark:bg-primary/20" trend={kpis.ordersTrend} />
        <KPICard label="Total Customers" value={kpis.totalCustomers} icon={Users} color="text-info" bgColor="bg-info/10 dark:bg-info/20" />
        <KPICard label="Inventory Value" value={`₹${kpis.inventoryValue.toLocaleString()}`} icon={Package} color="text-warning" bgColor="bg-warning/10 dark:bg-warning/20" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Revenue This Month" value={`₹${kpis.revenueThisMonth.toLocaleString()}`} icon={Activity} color="text-primary" bgColor="bg-primary/10 dark:bg-primary/20" />
        <KPICard label="Orders This Month" value={kpis.ordersThisMonth} icon={BarChart2} color="text-info" bgColor="bg-info/10 dark:bg-info/20" />
        <KPICard label="Completed Revenue" value={`₹${kpis.completedRevenue.toLocaleString()}`} icon={TrendingUp} color="text-success" bgColor="bg-success/10 dark:bg-success/20" />
        <KPICard label="Pending Orders" value={kpis.pendingOrders} icon={Hammer} color="text-orange-600" bgColor="bg-orange-50" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Monthly Revenue Trend (Last 12 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Order Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Revenue by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Top Customers by Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Orders & Revenue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Monthly Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Month</th>
                <th className="px-5 py-3 font-medium text-right">Revenue</th>
                <th className="px-5 py-3 font-medium text-right">Orders</th>
                <th className="px-5 py-3 font-medium text-right">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyRevenueData.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:bg-slate-950">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{m.month}</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700">₹{m.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{m.orders}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">₹{m.orders > 0 ? Math.round(m.revenue / m.orders).toLocaleString() : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;

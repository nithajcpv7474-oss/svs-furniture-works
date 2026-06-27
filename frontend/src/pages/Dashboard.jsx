import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import { 
  Users, ShoppingBag, Hammer, Truck, Activity, ArrowRight, 
  TrendingUp, TrendingDown, Package, Box, Award, PlusCircle,
  FileText, BarChart2, UserCog, Calendar, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { 
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-slate-400">
        <AlertTriangle size={48} className="text-rose-500 mb-4 opacity-80" />
        <h2 className="text-xl font-bold text-white mb-2">Failed to Load Dashboard</h2>
        <p>We couldn't retrieve your dashboard metrics. Please check your network or try again later.</p>
      </div>
    );
  }

  const { kpis, trends, performance, topMetrics, activities } = data;
  const formatRupee = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Reusable KPI Component
  const KPICard = ({ title, value, icon: Icon, trend, trendLabel, gradient, shadow }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className="relative overflow-hidden rounded-2xl bg-[#0F172A] border border-white/[0.04] p-6 shadow-lg group"
    >
      <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br ${gradient} opacity-20 rounded-full blur-3xl group-hover:opacity-40 transition-opacity duration-500`}></div>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-[#94A3B8] text-xs font-black tracking-widest uppercase mb-2">{title}</p>
          <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
          {trend !== undefined && trend !== 0 && (
            <div className="flex items-center gap-1.5 mt-4 text-sm font-bold">
              {trend > 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-rose-400" />}
              <span className={`px-2 py-0.5 rounded-full text-xs ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-slate-500 text-xs ml-1 font-medium">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] shadow-[${shadow}] group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} className="text-white drop-shadow-md" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-8 pb-12">
      
      {/* 1. Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#020617] border border-white/[0.05] p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <ShieldCheck size={14} /> Enterprise Operations Active
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.fullName === 'System Admin' ? 'Admin' : user?.fullName?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 mt-4 font-medium max-w-2xl text-lg leading-relaxed">
              Here is your command center. Monitor production health, analyze revenue streams, and manage enterprise inventory in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <button onClick={() => navigate('/orders/new')} className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all">
              <PlusCircle size={18} /> New Order
            </button>
            <button onClick={() => navigate('/reports')} className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-2 backdrop-blur-md transition-all">
              <BarChart2 size={18} /> Analytics
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Quick Actions Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="text-sm font-black text-[#94A3B8] tracking-widest uppercase mb-4 px-2">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Add Customer', icon: Users, path: '/customers/new', color: 'from-blue-500 to-cyan-500' },
            { label: 'Add Material', icon: Box, path: '/inventory', color: 'from-emerald-500 to-teal-500' },
            { label: 'Production Job', icon: Hammer, path: '/production', color: 'from-orange-500 to-amber-500' },
            { label: 'Dispatch', icon: Truck, path: '/delivery', color: 'from-purple-500 to-pink-500' },
            { label: 'Generate Report', icon: FileText, path: '/reports', color: 'from-indigo-500 to-blue-500' },
            { label: 'Manage Users', icon: UserCog, path: '/users', color: 'from-rose-500 to-red-500' },
          ].map((action, i) => (
            <motion.div 
              key={i} whileHover={{ y: -5, scale: 1.02 }} onClick={() => navigate(action.path)}
              className="cursor-pointer bg-[#0F172A] border border-white/[0.04] p-4 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg hover:border-white/10 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} p-[1px]`}>
                <div className="w-full h-full bg-[#0F172A] rounded-full flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
                  <action.icon size={20} className="text-white drop-shadow-md" />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white text-center transition-colors">{action.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 3. Premium KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value={formatRupee(kpis.monthlyRevenue)} icon={TrendingUp} trend={kpis.revenueGrowth} trendLabel="vs last month" gradient="from-blue-500 to-purple-500" shadow="0_0_20px_rgba(59,130,246,0.3)" />
        <KPICard title="Total Orders" value={kpis.totalOrders} icon={ShoppingBag} trend={kpis.orderGrowth} trendLabel="vs last month" gradient="from-emerald-500 to-teal-500" shadow="0_0_20px_rgba(16,185,129,0.3)" />
        <KPICard title="Active Production" value={kpis.activeJobs} icon={Hammer} gradient="from-orange-500 to-amber-500" shadow="0_0_20px_rgba(245,158,11,0.3)" />
        <KPICard title="Pending Deliveries" value={kpis.pendingDeliveries} icon={Truck} gradient="from-cyan-500 to-blue-500" shadow="0_0_20px_rgba(6,182,212,0.3)" />
      </motion.div>

      {/* 4. Main Charts Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Forecast (Composed Chart) */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-black text-white">Revenue & Forecast</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Historical performance & projections</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300">This Year</div>
          </div>
          <div className="h-80 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends.revenueForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} tickFormatter={(value) => value === 0 ? '₹0' : value >= 100000 ? `₹${value/100000}L` : `₹${value/1000}k`} dx={-10} />
                <Tooltip 
                  formatter={(value, name) => [formatRupee(value), name === 'actual' ? 'Actual Revenue' : 'Forecast']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#020617', color: '#fff', padding: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#94A3B8' }} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#3B82F6" strokeWidth={4} fill="url(#colorActual)" />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="6 6" dot={{r: 5, fill: '#0F172A', strokeWidth: 2}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Efficiency (Gauges) */}
        <div className="bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-white">System Health</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider mb-8">Efficiency & Targets</p>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-8">
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400"><Hammer size={16}/></div> Production Yield
                </span>
                <span className="text-sm font-black text-orange-400">{performance.production.onTimeRate}%</span>
              </div>
              <div className="w-full bg-[#020617] rounded-full h-3 border border-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${performance.production.onTimeRate}%` }} transition={{ duration: 1.5, delay: 0.5 }} className="bg-gradient-to-r from-orange-600 to-amber-400 h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></motion.div>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-2 text-right">{performance.production.totalCompleted} operations completed</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400"><Truck size={16}/></div> Delivery SLA
                </span>
                <span className="text-sm font-black text-emerald-400">{performance.delivery.onTimeRate}%</span>
              </div>
              <div className="w-full bg-[#020617] rounded-full h-3 border border-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${performance.delivery.onTimeRate}%` }} transition={{ duration: 1.5, delay: 0.7 }} className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></motion.div>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-2 text-right">{performance.delivery.totalCompleted} dispatches completed</p>
            </div>

          </div>
        </div>
      </motion.div>

      {/* 5. Drill-down & New Sections */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory Value by Category */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white">Inventory Breakdown</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Value distribution by category</p>
            </div>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors">
                Clear Selection
              </button>
            )}
          </div>
          <div className="h-[300px] flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={trends.categoryDistribution} cx="50%" cy="50%" 
                  innerRadius={selectedCategory ? 80 : 90} outerRadius={selectedCategory ? 120 : 110} 
                  paddingAngle={6} dataKey="value" stroke="rgba(0,0,0,0)"
                  onClick={(data) => setSelectedCategory(data.name)} style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {trends.categoryDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      opacity={selectedCategory ? (selectedCategory === entry.name ? 1 : 0.2) : 1}
                      className="hover:opacity-80 transition-opacity duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatRupee(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#020617', color: '#fff', padding: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers Widget */}
        <div className="bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award size={20} className="text-amber-400" /> Top Customers
            </h3>
            <span className="text-xs font-bold text-slate-500">This Month</span>
          </div>
          <div className="flex-1 space-y-3">
            {topMetrics.topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' : i === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' : 'bg-[#020617] text-slate-500 border border-white/5'}`}>
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{c.name}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{c.orderCount} orders</p>
                  </div>
                </div>
                <div className="text-sm font-black text-emerald-400 drop-shadow-sm">
                  {formatRupee(c.revenue)}
                </div>
              </div>
            ))}
            {topMetrics.topCustomers.length === 0 && <p className="text-sm font-semibold text-slate-500 text-center py-4">No data available.</p>}
          </div>
        </div>

      </motion.div>

      {/* 6. Deep Insights Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Materials widget */}
        <div className="bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Box size={20} className="text-blue-400" /> Material Consumption
            </h3>
            <span className="text-xs font-bold text-slate-500">30 Days</span>
          </div>
          <div className="space-y-5">
            {topMetrics.topMaterials.map((m, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">{m.name}</span>
                  <span className="text-xs font-black bg-white/5 px-2.5 py-1 rounded-md text-slate-300 border border-white/10">
                    {m.quantity} units
                  </span>
                </div>
                <div className="w-full bg-[#020617] rounded-full h-2 border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (m.quantity / topMetrics.topMaterials[0].quantity) * 100)}%` }} transition={{ duration: 1 }} className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></motion.div>
                </div>
              </div>
            ))}
             {topMetrics.topMaterials.length === 0 && <p className="text-sm text-slate-500 text-center font-semibold">No material data.</p>}
          </div>
        </div>

        {/* Live Enterprise Activity Feed */}
        <div className="bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Activity size={20} className="text-purple-400" /> Live Feed
            </h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="relative pl-6 border-l border-white/10 space-y-8 pb-4">
              {activities.map((activity, idx) => {
                let dotColor = 'bg-slate-400';
                let icon = <CheckCircle2 size={12} className="text-white"/>;
                if (activity.type === 'Order') { dotColor = 'bg-blue-500'; icon = <ShoppingBag size={10} className="text-white"/>; }
                if (activity.type === 'Production') { dotColor = 'bg-orange-500'; icon = <Hammer size={10} className="text-white"/>; }
                if (activity.type === 'Inventory') { dotColor = 'bg-emerald-500'; icon = <Package size={10} className="text-white"/>; }

                return (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }} key={activity.id} className="relative group">
                    <div className={`absolute -left-[33px] w-6 h-6 ${dotColor} rounded-full ring-4 ring-[#0F172A] shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center`}>
                      {icon}
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl group-hover:bg-white/[0.04] transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-white">{activity.title}</p>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-[#020617] px-2 py-0.5 rounded-full border border-white/5">
                          {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed">{activity.description}</p>
                    </div>
                  </motion.div>
                );
              })}
              {activities.length === 0 && <p className="text-sm font-semibold text-slate-500 text-center">System is currently idle.</p>}
            </div>
          </div>
        </div>

      </motion.div>

    </div>
  );
};

export default Dashboard;

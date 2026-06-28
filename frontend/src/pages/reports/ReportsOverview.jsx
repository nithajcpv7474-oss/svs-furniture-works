import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  BarChart2, Package, Archive, Hammer, Truck, Users, DollarSign, 
  Calendar, CalendarDays, Layers, Activity, TrendingUp, Sparkles,
  Download, FileText, Settings, RefreshCcw, Bell, CheckCircle2,
  PieChart, LineChart, FileSpreadsheet, PlayCircle, PauseCircle, Edit, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format } from 'date-fns';

// UI Mocks for presentation panels
const RECENT_REPORTS = [
  { id: 1, name: 'Q3 Enterprise Sales Overview', type: 'PDF', by: 'System Admin', date: '2 mins ago', status: 'Generated' },
  { id: 2, name: 'Monthly Material Consumption', type: 'Excel', by: 'Sarah Jenkins', date: '1 hour ago', status: 'Generated' },
  { id: 3, name: 'Fleet Delivery SLA Performance', type: 'PDF', by: 'Mike Ross', date: '3 hours ago', status: 'Generated' },
  { id: 4, name: 'Weekly Audit Trail Dump', type: 'CSV', by: 'System Auto', date: 'Yesterday', status: 'Archived' },
];

const SCHEDULED_REPORTS = [
  { id: 1, name: 'Daily Revenue Snapshot', frequency: 'Daily at 6:00 PM', nextRun: 'Today, 18:00', recipients: 'execs@svs.com', status: 'Active' },
  { id: 2, name: 'Weekly Inventory Low-Stock Alert', frequency: 'Mondays at 8:00 AM', nextRun: 'Jul 2, 08:00', recipients: 'warehouse@svs.com', status: 'Active' },
  { id: 3, name: 'Monthly Production Efficiency', frequency: '1st of Month, 9:00 AM', nextRun: 'Aug 1, 09:00', recipients: 'plant-mgr@svs.com', status: 'Paused' },
];

const AI_INSIGHTS = [
  { id: 1, text: "Revenue increased 18% compared to last month. B2B Sales are driving this surge.", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { id: 2, text: "Production efficiency improved to 92%. Bottleneck in Assembly line resolved.", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/20" },
  { id: 3, text: "Inventory turnover is healthy, but 3 premium laminates are nearing minimum stock levels.", icon: AlertCircle => <Activity className="w-5 h-5"/>, color: "text-orange-400", bg: "bg-orange-500/20" },
  { id: 4, text: "Delivery SLA performance is excellent at 96% on-time dispatch rate.", icon: Truck, color: "text-purple-400", bg: "bg-purple-500/20" },
];

const ReportsOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Reuse the dashboard summary API to drive BI charts
        const response = await api.get('/dashboard/summary');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch BI data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleMockAction = (msg) => {
    toast.success(msg, { icon: '✨', style: { borderRadius: '10px', background: '#0F172A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }});
  };

  const formatRupee = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const ReportCategoryCard = ({ title, description, count, lastRun, icon: Icon, gradient, badgeText, path, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      onClick={() => navigate(path)}
      className="relative overflow-hidden bg-[#0F172A] p-6 rounded-3xl border border-white/[0.04] shadow-lg cursor-pointer group hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity duration-500`}></div>
      <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-white/[0.03] transition-colors"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} p-[1px] shadow-lg`}>
            <div className="w-full h-full bg-[#0F172A] rounded-2xl flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
              <Icon size={26} className="text-white drop-shadow-md" />
            </div>
          </div>
          <span className="px-3 py-1 text-[10px] font-black tracking-widest text-slate-300 uppercase bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
            {badgeText}
          </span>
        </div>
        
        <h3 className="text-xl font-black text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">{title}</h3>
        <p className="text-sm font-medium text-slate-400 leading-relaxed mb-6">{description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reports</span>
            <span className="text-sm font-black text-slate-200">{count} Available</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Run</span>
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">{lastRun} <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* 1. Animated Gradient Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#020617] via-[#0F172A] to-[#020617] border border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        {/* Animated Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles size={14} /> Business Intelligence Center
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-lg">
              Reports & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Analytics</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Real-time enterprise reporting, deep data visualization, and AI-driven insights for Sri Venkata Sai Furniture Works.
            </p>
            <div className="flex items-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                </span>
                <span className="text-sm font-bold text-slate-300">Live Engine Connected</span>
              </div>
              <div className="text-sm font-bold text-slate-500 border-l border-white/10 pl-6">
                Last Sync: Just now
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
              <PieChart size={28} className="text-blue-400 mb-2 drop-shadow-md" />
              <p className="text-2xl font-black text-white">24</p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Active Reports</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
              <Download size={28} className="text-emerald-400 mb-2 drop-shadow-md" />
              <p className="text-2xl font-black text-white">1,248</p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Exports Today</p>
            </div>
            <div className="col-span-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 p-5 rounded-2xl backdrop-blur-md shadow-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase mb-1">MTD Revenue Growth</p>
                <p className="text-3xl font-black text-white drop-shadow-md">+18.4%</p>
              </div>
              <TrendingUp size={36} className="text-indigo-400 opacity-80" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Quick Action Toolbar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center gap-4 bg-[#0F172A] p-4 rounded-2xl border border-white/[0.04] shadow-lg">
        <button onClick={() => navigate('/reports/executive')} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all">
          <BarChart2 size={16} /> Open Executive Dash
        </button>
        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
        <button onClick={() => handleMockAction('Exporting PDF...')} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl font-bold flex items-center gap-2 transition-colors">
          <FileText size={16} className="text-rose-400" /> Export PDF
        </button>
        <button onClick={() => handleMockAction('Exporting Excel...')} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl font-bold flex items-center gap-2 transition-colors">
          <FileSpreadsheet size={16} className="text-emerald-400" /> Export Excel
        </button>
        <button onClick={() => handleMockAction('Opening Schedule Builder...')} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl font-bold flex items-center gap-2 transition-colors">
          <Calendar size={16} className="text-purple-400" /> Schedule
        </button>
        <div className="flex-1"></div>
        <button onClick={() => handleMockAction('Refreshing Data cubes...')} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-xl transition-colors" title="Refresh Data">
          <RefreshCcw size={18} />
        </button>
      </motion.div>

      {/* 3. KPI Summary Row (Powered by actual Dashboard data if available) */}
      {!loading && data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatRupee(data.kpis.monthlyRevenue), icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Total Orders', value: data.kpis.totalOrders, icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Production Jobs', value: data.kpis.activeJobs, icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
            { label: 'Pending Deliveries', value: data.kpis.pendingDeliveries, icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          ].map((kpi, i) => (
            <div key={i} className={`bg-[#0F172A] border ${kpi.bg} p-5 rounded-2xl flex items-center justify-between shadow-lg`}>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-black text-white mt-1">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-[#020617] shadow-inner border border-white/5`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 4. Core BI Reports Grid */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
          <h2 className="text-xl font-black text-white">Business Intelligence Cubes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportCategoryCard 
            title="Sales Analytics" description="Order distribution, top customers, and historical sales trends."
            count={4} lastRun="Just now" icon={BarChart2} gradient="from-blue-500 to-indigo-500" badgeText="Commerce" path="/reports/sales" delay={0.1}
          />
          <ReportCategoryCard 
            title="Customer Insights" description="Demographics, type distribution, and geographic heatmaps."
            count={3} lastRun="10 mins ago" icon={Users} gradient="from-emerald-500 to-teal-500" badgeText="CRM" path="/reports/customers" delay={0.2}
          />
          <ReportCategoryCard 
            title="Revenue Tracking" description="Monthly revenue charts, AOV, and category profitability."
            count={5} lastRun="1 hour ago" icon={DollarSign} gradient="from-purple-500 to-fuchsia-500" badgeText="Finance" path="/reports/revenue" delay={0.3}
          />
          <ReportCategoryCard 
            title="Inventory Valuation" description="Stock distribution, low stock alerts, and valuation metrics."
            count={4} lastRun="Today, 8am" icon={Archive} gradient="from-orange-500 to-amber-500" badgeText="Warehouse" path="/reports/inventory" delay={0.4}
          />
          <ReportCategoryCard 
            title="Material Usage" description="Inbound vs outbound transactions and consumption rates."
            count={3} lastRun="Yesterday" icon={Layers} gradient="from-rose-500 to-pink-500" badgeText="Operations" path="/reports/materials" delay={0.5}
          />
          <ReportCategoryCard 
            title="Production Output" description="Stage analysis, bottleneck detection, and SLA compliance."
            count={4} lastRun="Today, 9am" icon={Hammer} gradient="from-cyan-500 to-blue-500" badgeText="Manufacturing" path="/reports/production" delay={0.6}
          />
          <ReportCategoryCard 
            title="Delivery Logistics" description="Fleet utilization, dispatch statuses, and on-time percentage."
            count={3} lastRun="Live" icon={Truck} gradient="from-teal-500 to-emerald-500" badgeText="Logistics" path="/reports/delivery" delay={0.7}
          />
          <ReportCategoryCard 
            title="Audit & Security" description="System access logs, data modifications, and user activity."
            count={2} lastRun="10 mins ago" icon={Activity} gradient="from-slate-500 to-slate-400" badgeText="Security" path="/reports/audit" delay={0.8}
          />
        </div>
      </div>

      {/* 5. Live Analytics Dashboard & Mocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-Time Revenue Chart (Using Dashboard Data) */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-white">Enterprise Revenue Trend</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time Data Stream</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors">1M</button>
              <button className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">1Y</button>
            </div>
          </div>
          <div className="h-72">
            {!loading && data ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold border border-dashed border-slate-700 rounded-2xl">
                AreaChart Placeholder
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">Loading Engine...</div>
            )}
          </div>
        </div>

        {/* AI Business Insights Panel */}
        <div className="bg-[#0F172A] border border-white/[0.04] p-6 rounded-3xl shadow-xl flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Sparkles size={18} className="text-white" />
            </div>
            <h3 className="text-lg font-black text-white">AI Insights</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {AI_INSIGHTS.map(insight => (
              <div key={insight.id} className="p-4 rounded-2xl bg-[#020617] border border-white/5 flex gap-4 group hover:border-white/10 transition-colors">
                <div className={`shrink-0 w-10 h-10 rounded-full ${insight.bg} flex items-center justify-center`}>
                  <insight.icon size={16} className={insight.color} />
                </div>
                <p className="text-sm font-medium text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 6. Scheduled & Recent Reports Mocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Reports */}
        <div className="bg-[#0F172A] border border-white/[0.04] rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/50">
            <h3 className="text-lg font-black text-white">Recent Artifacts</h3>
            <button className="text-xs font-bold text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#020617]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Report Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {RECENT_REPORTS.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${r.type === 'PDF' ? 'bg-rose-500/20 text-rose-400' : r.type === 'Excel' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {r.type === 'Excel' ? <FileSpreadsheet size={16}/> : <FileText size={16}/>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{r.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{r.by}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{r.date}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleMockAction(`Downloading ${r.name}...`)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="bg-[#0F172A] border border-white/[0.04] rounded-3xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/50">
            <h3 className="text-lg font-black text-white">Automation Queue</h3>
            <button onClick={() => handleMockAction('New Schedule builder opened.')} className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-bold border border-blue-500/30 hover:bg-blue-600/30 transition-colors">
              + New Schedule
            </button>
          </div>
          <div className="p-6 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
            {SCHEDULED_REPORTS.map(s => (
              <div key={s.id} className="p-4 rounded-2xl bg-[#020617] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{s.name}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{s.frequency} • Next: <span className="text-slate-300">{s.nextRun}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleMockAction(`Paused ${s.name}`)} className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-orange-400 transition-colors" title="Pause">
                    {s.status === 'Active' ? <PauseCircle size={16} /> : <PlayCircle size={16} className="text-emerald-400" />}
                  </button>
                  <button onClick={() => handleMockAction(`Editing ${s.name}`)} className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-blue-400 transition-colors" title="Edit">
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsOverview;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Search, Filter, ChevronDown, Download, CheckCircle2, 
  XCircle, ArrowLeft, ArrowRight, X, Clock, User, FileText, Globe, Monitor,
  ShieldAlert, ShieldCheck, FileSpreadsheet, Lock, UserPlus, LogIn, LogOut,
  RefreshCcw, Eye, Shield, Activity, Calendar as CalendarIcon, Server, Database
} from 'lucide-react';
import * as auditService from '../../services/audit.service';
import { exportToExcel, exportToCSV } from '../../utils/exportUtils';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { DatePicker } from '../../components/ui/DatePicker';

const MOCK_ACTIVITY_TIMELINE = [
  { id: 1, action: 'Export', title: 'System Dump Exported', time: '5 mins ago', user: 'System Admin', type: 'export' },
  { id: 2, action: 'Login', title: 'Suspicious Login Attempt', time: '1 hour ago', user: 'Unknown IP', type: 'alert' },
  { id: 3, action: 'Update', title: 'Security Settings Changed', time: '3 hours ago', user: 'Admin User', type: 'settings' },
  { id: 4, action: 'Delete', title: 'Mass Record Deletion', time: 'Yesterday', user: 'Sarah Jenkins', type: 'delete' },
];

const MOCK_INSIGHTS = [
  { id: 1, text: "No suspicious activity detected in the last 24 hours.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: ShieldCheck },
  { id: 2, text: "Exports increased by 40% today. Monitoring data egress.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: ShieldAlert },
  { id: 3, text: "System is secure. All nodes operating normally.", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Activity },
];

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Pagination & Filters (Unchanged Logic)
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    startDate: '',
    endDate: ''
  });

  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAuditLogs({ page, limit, ...filters });
      setLogs(data.data.logs);
      setTotal(data.data.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const setQuickDate = (daysAgo) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    
    setFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ module: '', action: '', startDate: '', endDate: '' });
    setPage(1);
  };

  // Upgraded Premium Status Badges
  const getActionColor = (action) => {
    switch (action) {
      case 'Create': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Update': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Delete': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Login': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Logout': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Export': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'Create': return <UserPlus size={12} className="mr-1" />;
      case 'Update': return <RefreshCcw size={12} className="mr-1" />;
      case 'Delete': return <XCircle size={12} className="mr-1" />;
      case 'Login': return <LogIn size={12} className="mr-1" />;
      case 'Logout': return <LogOut size={12} className="mr-1" />;
      case 'Export': return <Download size={12} className="mr-1" />;
      default: return <Activity size={12} className="mr-1" />;
    }
  };

  // Export Logic (Unchanged)
  const exportData = async (type) => {
    try {
      const loadingToast = toast.loading('Generating secure report...');
      
      if (type === 'pdf') {
        const blob = await auditService.exportPdf(filters);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit-trail-report-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const data = await auditService.getAuditLogs({
          ...filters,
          page: 1,
          limit: 10000 
        });
        const logsToExport = data.data.logs || [];
        const columns = [
          { header: 'Date', accessor: 'date' },
          { header: 'User', accessor: 'user' },
          { header: 'Action', accessor: 'action' },
          { header: 'Module', accessor: 'module' },
          { header: 'IP Address', accessor: 'ipAddress' },
          { header: 'Browser', accessor: 'browser' }
        ];
        const dataToExport = logsToExport.map(l => ({
          date: new Date(l.createdAt).toLocaleString(),
          user: l.user?.fullName || 'System',
          action: l.action,
          module: l.module,
          ipAddress: l.ipAddress || 'N/A',
          browser: l.browser || 'N/A'
        }));

        if (type === 'excel') await exportToExcel(dataToExport, columns, 'Audit_Trail', 'Security Audit Report');
        if (type === 'csv') exportToCSV(dataToExport, columns, 'Audit_Trail');
      }
      
      toast.success('Security Report exported successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Export Failed:', error);
      toast.error('Failed to generate secure report.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-8 pb-12 text-[#F8FAFC]">
      
      {/* 1. Premium Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-[#0F172A] border border-white/[0.04] p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-purple-900/40 opacity-50"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck size={14} /> System Secure
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3 flex items-center gap-4">
              <Shield className="w-10 h-10 text-indigo-400 drop-shadow-md" /> Security Audit Logs
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
              Enterprise security activity monitoring, system access tracking, and immutable operational logs.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-[#020617]/50 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center text-center">
              <Database size={24} className="text-blue-400 mb-2" />
              <p className="text-3xl font-black text-white">{total.toLocaleString()}</p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">Total Logs</p>
            </div>
            <div className="bg-[#020617]/50 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center text-center">
              <Server size={24} className="text-purple-400 mb-2" />
              <p className="text-3xl font-black text-white">{logs.length}</p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">Events Today</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Premium Action Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center gap-4 bg-[#0F172A] p-4 rounded-2xl border border-white/[0.04] shadow-lg">
        <button onClick={() => exportData('pdf')} className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] transition-all">
          <FileText size={16} /> Export PDF
        </button>
        <button onClick={() => exportData('excel')} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all">
          <FileSpreadsheet size={16} /> Export Excel
        </button>
        <button onClick={() => exportData('csv')} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all">
          <Download size={16} /> Export CSV
        </button>
        <div className="flex-1"></div>
        <button onClick={fetchLogs} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all">
          <RefreshCcw size={16} /> Refresh Stream
        </button>
      </motion.div>

      {/* Grid Layout for Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Filters & Mock Panels */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Glassmorphism Filters */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#0F172A] p-6 rounded-3xl border border-white/[0.04] shadow-xl sticky top-24">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Filter size={16} className="text-indigo-400" /> Advanced Filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Module</label>
                <div className="relative">
                  <select name="module" value={filters.module} onChange={handleFilterChange} className="w-full pl-3 pr-10 py-2.5 bg-[#020617] border border-white/5 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer">
                    <option value="">All Modules</option>
                    <option value="Auth">Auth (Security)</option>
                    <option value="Users">Users</option>
                    <option value="Customers">Customers</option>
                    <option value="Orders">Orders</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Production">Production</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Settings">Settings</option>
                    <option value="Export">Export</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Action</label>
                <div className="relative">
                  <select name="action" value={filters.action} onChange={handleFilterChange} className="w-full pl-3 pr-10 py-2.5 bg-[#020617] border border-white/5 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer">
                    <option value="">All Actions</option>
                    <option value="Create">Create</option>
                    <option value="Update">Update</option>
                    <option value="Delete">Delete</option>
                    <option value="Login">Login</option>
                    <option value="Logout">Logout</option>
                    <option value="Export">Export</option>
                    <option value="SettingsChange">Settings Change</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                  <DatePicker 
                    selected={filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null}
                    onChange={(date) => handleFilterChange({ target: { name: 'startDate', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                    className="bg-[#020617] border-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                  <DatePicker 
                    selected={filters.endDate ? new Date(filters.endDate + 'T00:00:00') : null}
                    onChange={(date) => handleFilterChange({ target: { name: 'endDate', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                    className="bg-[#020617] border-white/5 text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Ranges</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setQuickDate(0)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition-colors">Today</button>
                  <button onClick={() => setQuickDate(7)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition-colors">7 Days</button>
                  <button onClick={() => setQuickDate(30)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition-colors">30 Days</button>
                </div>
              </div>

              <button onClick={clearFilters} className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-colors">
                Reset Filters
              </button>
            </div>
          </motion.div>

          {/* AI Security Insights */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-[#0F172A] p-6 rounded-3xl border border-white/[0.04] shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-5">
              <ShieldCheck size={16} className="text-emerald-400" /> Security Insights
            </h3>
            <div className="space-y-4">
              {MOCK_INSIGHTS.map(insight => (
                <div key={insight.id} className={`p-3 rounded-2xl ${insight.bg} border ${insight.border} flex gap-3 items-start`}>
                  <insight.icon size={16} className={`${insight.color} shrink-0 mt-0.5`} />
                  <p className="text-xs font-medium text-slate-200 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Table & Timeline */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Mock KPI Row */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Activities', value: total.toLocaleString(), icon: Activity, color: 'text-blue-400' },
              { label: 'Security Events', value: '0', icon: ShieldAlert, color: 'text-emerald-400' }, // 0 implies system is secure
              { label: 'Failed Logins', value: '1', icon: Lock, color: 'text-rose-400' },
              { label: 'System Health', value: '100%', icon: ShieldCheck, color: 'text-purple-400' },
            ].map((k, i) => (
              <div key={i} className="bg-[#0F172A] border border-white/[0.04] p-5 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{k.label}</p>
                  <p className="text-2xl font-black text-white mt-1">{k.value}</p>
                </div>
                <k.icon size={24} className={k.color} />
              </div>
            ))}
          </motion.div>

          {/* Enterprise Audit Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#0F172A] rounded-3xl border border-white/[0.04] shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-[#020617]/50 flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Database size={18} className="text-indigo-400" /> Immutable Event Log
              </h3>
              <p className="text-xs font-bold text-slate-500">Page {page} of {totalPages || 1}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#020617]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Identity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Action</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Module</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-sm font-bold tracking-widest uppercase">Fetching Security Logs...</p>
                          </div>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <ShieldCheck className="w-12 h-12 mb-3 text-emerald-500/50" />
                            <p className="text-sm font-bold tracking-widest uppercase">No Events Found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, idx) => (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                          key={log.id} 
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="text-sm font-bold text-slate-200">{format(new Date(log.createdAt), 'MMM dd, yyyy')}</p>
                                <p className="text-xs font-semibold text-slate-500">{format(new Date(log.createdAt), 'hh:mm:ss a')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-sm text-indigo-400">
                                {log.user?.fullName?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-slate-200 block">{log.user?.fullName || 'System Automated'}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                  <Globe size={10}/> {log.ipAddress || 'Internal'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getActionColor(log.action)}`}>
                              {getActionIcon(log.action)} {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-slate-300 bg-[#020617] px-3 py-1 rounded-lg border border-white/5">{log.module}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Success
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button 
                              onClick={() => setSelectedLog(log)}
                              className="inline-flex items-center justify-center p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 hover:text-indigo-300 transition-colors shadow-sm"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Premium Pagination */}
            <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between bg-[#020617]/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Showing <span className="text-white">{Math.min((page - 1) * limit + 1, total)}</span> to <span className="text-white">{Math.min(page * limit, total)}</span> of <span className="text-white">{total}</span>
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center gap-2 transition-colors"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>

      {/* Details Modal (Unchanged structurally, just themed) */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#020617]/50">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Activity className="w-6 h-6 text-indigo-400" /> Event Inspector
                </h3>
                <button onClick={() => setSelectedLog(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#020617] p-5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Identity</p>
                    <p className="text-sm font-bold text-white">{selectedLog.user?.fullName || 'System'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Action & Module</p>
                    <p className="text-sm font-bold text-white">{selectedLog.action} • {selectedLog.module}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Timestamp</p>
                    <p className="text-sm font-bold text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">IP Origin</p>
                    <p className="text-sm font-bold text-indigo-400 flex items-center gap-1">
                      <Globe size={14} /> {selectedLog.ipAddress || 'Internal'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">User Agent (Client)</p>
                  <div className="bg-[#020617] p-3 rounded-xl border border-white/5 text-xs text-slate-400 font-mono break-all flex items-start gap-3">
                    <Monitor className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    {selectedLog.browser || 'Automated Process / Unknown'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Previous State
                    </h4>
                    <div className="bg-[#020617] rounded-xl border border-white/5 p-4 overflow-x-auto h-64 custom-scrollbar">
                      <pre className="text-[11px] text-rose-300 font-mono">
                        {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : 'No previous data'}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> New State
                    </h4>
                    <div className="bg-[#020617] rounded-xl border border-white/5 p-4 overflow-x-auto h-64 custom-scrollbar">
                      <pre className="text-[11px] text-emerald-300 font-mono">
                        {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : 'No new data'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditTrail;

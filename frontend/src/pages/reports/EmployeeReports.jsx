import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { Download, Printer, ArrowLeft, Loader2, Users, UserCheck, ShieldCheck, UserCog, FileText, FileSpreadsheet } from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportUtils';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const EmployeeReports = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load employee data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // KPI calculations
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive === true).length;
  const adminCount = users.filter((u) => u.role === 'Admin').length;
  const staffCount = users.filter((u) => u.role === 'Staff').length;

  // Pie chart data — Role Distribution
  const roleMap = {};
  users.forEach((u) => {
    const role = u.role || 'Unknown';
    roleMap[role] = (roleMap[role] || 0) + 1;
  });
  const roleDistribution = Object.entries(roleMap)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  // Pie chart data — Active vs Inactive
  const inactiveUsers = totalUsers - activeUsers;
  const statusDistribution = [
    { name: 'Active', value: activeUsers },
    { name: 'Inactive', value: inactiveUsers },
  ].filter((d) => d.value > 0);

  // Export columns
  const exportColumns = [
    { header: 'Name', accessor: 'fullName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Status', accessor: 'isActive' },
    { header: 'Joined Date', accessor: 'createdAt' },
  ];

  const handleExportPDF = () => {
    const exportData = users.map((u) => ({ ...u, isActive: u.isActive ? 'Active' : 'Inactive' }));
    exportToPDF(exportData, exportColumns, 'Employee_Report', 'Employee Report', user);
  };

  const handleExportExcel = () => {
    const exportData = users.map((u) => ({ ...u, isActive: u.isActive ? 'Active' : 'Inactive' }));
    exportToExcel(exportData, exportColumns, 'Employee_Report', 'Employee Report', user);
  };

  const handleExportCSV = () => {
    const exportData = users.map((u) => ({ ...u, isActive: u.isActive ? 'Active' : 'Inactive' }));
    exportToCSV(exportData, exportColumns, 'Employee_Report');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-danger/10 dark:bg-danger/20 border border-danger/20 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={fetchUsers} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Employee Reports</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overview of team roles and activity status.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handleExportPDF} title="Export PDF" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-danger/10 dark:bg-danger/20 hover:text-danger hover:border-danger/20 rounded-lg transition-colors">
            <FileText size={18} />
          </button>
          <button onClick={handleExportExcel} title="Export Excel" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-success/10 dark:bg-success/20 hover:text-success hover:border-success/20 rounded-lg transition-colors">
            <FileSpreadsheet size={18} />
          </button>
          <button onClick={handleExportCSV} title="Export CSV" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:bg-primary/20 hover:text-primary hover:border-primary/20 rounded-lg transition-colors">
            <Download size={18} />
          </button>
          <button onClick={printReport} title="Print" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:bg-primary/20 hover:text-primary hover:border-primary/20 rounded-lg transition-colors">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Users</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{activeUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Admin Count</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{adminCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Staff Count</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{staffCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <UserCog className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Role Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Role Distribution</h3>
          <div className="h-64">
            {roleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-role-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Active vs Inactive */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Active vs Inactive</h3>
          <div className="h-64">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Employee Data</h3>
        </div>
        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length > 0 ? (
                users.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:bg-slate-950">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{emp.fullName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded text-xs font-bold">{emp.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${emp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(emp.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default EmployeeReports;

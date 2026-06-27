import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { Download, Printer, ArrowLeft, Loader2, Users, Briefcase, User, CalendarPlus, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportUtils';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '../../components/ui/DatePicker';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const CustomerReports = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Failed to load customer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter customers by date range
  const filteredCustomers = customers.filter((c) => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    const created = new Date(c.createdAt);
    if (dateRange.startDate && created < new Date(dateRange.startDate)) return false;
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      if (created > end) return false;
    }
    return true;
  });

  // KPI calculations
  const totalCustomers = filteredCustomers.length;
  const businessCustomers = filteredCustomers.filter((c) => c.customerType === 'Business').length;
  const individualCustomers = filteredCustomers.filter((c) => c.customerType === 'Individual').length;
  const now = new Date();
  const newThisMonth = filteredCustomers.filter((c) => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Pie chart data — Customer Type Distribution
  const typeDistribution = [
    { name: 'Business', value: businessCustomers },
    { name: 'Individual', value: individualCustomers },
  ].filter((d) => d.value > 0);

  // Bar chart data — Customers by City (top 10)
  const cityMap = {};
  filteredCustomers.forEach((c) => {
    const city = c.city || 'Unknown';
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const customersByCity = Object.entries(cityMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Export columns
  const exportColumns = [
    { header: 'Name', accessor: 'fullName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'City', accessor: 'city' },
    { header: 'Type', accessor: 'customerType' },
    { header: 'Created At', accessor: 'createdAt' },
  ];

  const handleExportPDF = () => {
    exportToPDF(filteredCustomers, exportColumns, 'Customer_Report', 'Customer Report', user);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredCustomers, exportColumns, 'Customer_Report', 'Customer Report', user);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredCustomers, exportColumns, 'Customer_Report');
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
          <button onClick={fetchCustomers} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
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
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Customer Reports</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analyze customer distribution and growth.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
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
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Customers</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalCustomers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Business Customers</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{businessCustomers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Individual Customers</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{individualCustomers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
              <User className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New This Month</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{newThisMonth}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <CalendarPlus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Customer Type Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Customer Type Distribution</h3>
          <div className="h-64">
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Customers by City */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Customers by City (Top 10)</h3>
          <div className="h-64">
            {customersByCity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customersByCity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
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
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Customer Data</h3>
        </div>
        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:bg-slate-950">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{customer.fullName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{customer.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{customer.phone}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{customer.city || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${customer.customerType === 'Business' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CustomerReports;

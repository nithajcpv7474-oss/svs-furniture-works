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
  Package,
  Warehouse,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
} from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printReport } from '../../utils/exportUtils';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const MaterialConsumptionReports = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [materials, setMaterials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [materialsRes, inventoryRes] = await Promise.all([
        api.get('/materials'),
        api.get('/inventory'),
      ]);
      setMaterials(materialsRes.data);
      setTransactions(inventoryRes.data);
    } catch (error) {
      console.error('Failed to fetch material data:', error);
    } finally {
      setLoading(false);
    }
  };

  // KPI: Total Materials
  const totalMaterials = materials.length;

  // KPI: Total Stock Value
  const totalStockValue = useMemo(
    () =>
      materials.reduce(
        (sum, m) => sum + (m.availableStock || 0) * (m.purchasePrice || 0),
        0
      ),
    [materials]
  );

  // KPI: Inbound Transactions
  const inboundCount = useMemo(
    () => transactions.filter((t) => t.transactionType === 'IN').length,
    [transactions]
  );

  // KPI: Outbound Transactions
  const outboundCount = useMemo(
    () => transactions.filter((t) => t.transactionType === 'OUT').length,
    [transactions]
  );

  // Stock by Category (BarChart)
  const stockByCategory = useMemo(() => {
    const catMap = {};
    materials.forEach((m) => {
      const cat = m.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + (m.availableStock || 0);
    });
    return Object.entries(catMap).map(([name, stock]) => ({ name, stock }));
  }, [materials]);

  // Monthly Consumption Trend (OUT transactions grouped by month)
  const monthlyConsumption = useMemo(() => {
    const monthMap = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap[key] = { month: label, quantity: 0 };
    }
    transactions
      .filter((t) => t.transactionType === 'OUT')
      .forEach((t) => {
        const d = new Date(t.transactionDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap[key]) {
          monthMap[key].quantity += t.quantity || 0;
        }
      });
    return Object.values(monthMap);
  }, [transactions]);

  // Table data
  const tableData = useMemo(
    () =>
      materials.map((m) => ({
        id: m.id,
        materialName: m.materialName || '-',
        category: m.category || '-',
        availableStock: m.availableStock || 0,
        unit: m.unit || '-',
        purchasePrice: m.purchasePrice || 0,
        totalValue: (m.availableStock || 0) * (m.purchasePrice || 0),
      })),
    [materials]
  );

  const exportColumns = [
    { header: 'Material', accessor: 'materialName' },
    { header: 'Category', accessor: 'category' },
    { header: 'Available Stock', accessor: 'availableStock' },
    { header: 'Unit', accessor: 'unit' },
    { header: 'Purchase Price', accessor: 'purchasePrice' },
    { header: 'Total Value', accessor: 'totalValue' },
  ];

  const handleExportPDF = () => {
    exportToPDF(tableData, exportColumns, 'Material_Consumption_Report', 'Material Consumption', user);
  };

  const handleExportExcel = () => {
    exportToExcel(tableData, exportColumns, 'Material_Consumption_Report', 'Material Consumption', user);
  };

  const handleExportCSV = () => {
    exportToCSV(tableData, exportColumns, 'Material_Consumption_Report');
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
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Material Consumption</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Stock levels, consumption trends, and material usage.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
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
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Materials</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalMaterials}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Stock Value</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                ₹{totalStockValue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inbound Transactions</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{inboundCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info/10 dark:bg-info/20 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-info" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Outbound Transactions</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{outboundCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category (BarChart) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Stock by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                  {stockByCategory.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Consumption Trend (LineChart) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Monthly Consumption Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyConsumption}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Material Usage</h3>
        </div>
        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Available Stock</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right">Purchase Price</th>
                <th className="px-4 py-3 font-medium text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:bg-slate-950">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{row.materialName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.category}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">{row.availableStock.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{row.purchasePrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">₹{row.totalValue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialConsumptionReports;

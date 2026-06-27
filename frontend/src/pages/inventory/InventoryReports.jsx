import React, { useState, useEffect } from 'react';
import { getInventoryReport } from '../../services/inventory.service';
import { 
  BarChart3, AlertTriangle, PackageX, IndianRupee, PieChart 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const InventoryReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const data = await getInventoryReport();
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading Report...</div>;
  }

  if (!report) return null;

  // Chart data: Top 10 items by valuation
  const topValuedItems = [...report.data]
    .sort((a, b) => b.valuation - a.valuation)
    .slice(0, 10)
    .map(m => ({
      name: m.materialName.length > 15 ? m.materialName.substring(0, 15) + '...' : m.materialName,
      valuation: m.valuation
    }));

  const lowStockItems = report.data.filter(m => m.availableStock > 0 && m.availableStock <= m.minimumStock);
  const outOfStockItems = report.data.filter(m => m.availableStock === 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Inventory Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Stock valuation, low stock alerts, and analytics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><BarChart3 size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Material Types</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{report.summary.totalItems}</p>
          </div>
        </div>

        <div className="card-premium p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><IndianRupee size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Valuation</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">₹{report.summary.totalValuation.toLocaleString()}</p>
          </div>
        </div>

        <div className="card-premium p-6 border-amber-100 bg-amber-50/20 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-amber-700">Low Stock Items</p>
            <p className="text-2xl font-bold text-amber-800">{report.summary.lowStockCount}</p>
          </div>
        </div>

        <div className="card-premium p-6 border-red-100 bg-red-50/20 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-red-100 p-3 rounded-xl text-red-600"><PackageX size={24} /></div>
          <div>
            <p className="text-sm font-medium text-red-700">Out of Stock</p>
            <p className="text-2xl font-bold text-red-800">{report.summary.outOfStockCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-primary" /> Top 10 Materials by Value
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topValuedItems} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="valuation" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card-premium p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" /> Action Required (Low/Out of Stock)
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {[...outOfStockItems, ...lowStockItems].length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3">
                  <AlertTriangle className="text-emerald-500" />
                </div>
                <p>All stock levels are healthy.</p>
              </div>
            ) : (
              [...outOfStockItems, ...lowStockItems].map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between ${item.availableStock === 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div>
                    <h4 className={`font-semibold ${item.availableStock === 0 ? 'text-red-900' : 'text-amber-900'}`}>{item.materialName}</h4>
                    <p className={`text-sm ${item.availableStock === 0 ? 'text-red-700' : 'text-amber-700'}`}>Code: {item.materialCode} • Min: {item.minimumStock}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${item.availableStock === 0 ? 'text-red-700' : 'text-amber-700'}`}>{item.availableStock}</p>
                    <p className={`text-xs ${item.availableStock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{item.unit}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default InventoryReports;

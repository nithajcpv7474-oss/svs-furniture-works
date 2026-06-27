import React, { useState, useEffect } from 'react';
import { getInventoryReports } from '../../services/report.service';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Printer, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { exportToExcel, exportToPDF, printReport } from '../../utils/exportUtils';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const InventoryReports = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getInventoryReports();
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(data.materials, [
      { header: 'Material Code', accessor: 'materialCode' },
      { header: 'Material Name', accessor: 'materialName' },
      { header: 'Category', accessor: 'category' },
      { header: 'Available Stock', accessor: 'availableStock' },
      { header: 'Unit Price', accessor: 'purchasePrice' },
      { header: 'Total Value', accessor: (m) => m.availableStock * m.purchasePrice }
    ], 'Inventory_Valuation_Report');
  };

  const handleExportPDF = () => {
    exportToPDF(data.materials, [
      { header: 'Code', accessor: 'materialCode' },
      { header: 'Name', accessor: 'materialName' },
      { header: 'Category', accessor: 'category' },
      { header: 'Stock', accessor: 'availableStock' },
      { header: 'Total Val', accessor: (m) => m.availableStock * m.purchasePrice }
    ], 'Inventory Valuation Report', 'Inventory_Report');
  };

  if (loading && !data) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Inventory Analytics</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Valuation, categories, and stock warnings.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="px-4 py-2 bg-success/10 dark:bg-success/20 text-emerald-800 font-bold rounded-lg border border-success/20 shadow-sm whitespace-nowrap">
            Total Value: ₹{data?.totalValue?.toLocaleString()}
          </div>
          <button onClick={handleExportPDF} title="Export PDF" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-danger/10 dark:bg-danger/20 hover:text-danger hover:border-danger/20 rounded-lg transition-colors"><Download size={18} /></button>
          <button onClick={handleExportExcel} title="Export Excel" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-success/10 dark:bg-success/20 hover:text-success hover:border-success/20 rounded-lg transition-colors"><Download size={18} /></button>
          <button onClick={printReport} title="Print" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:bg-primary/20 hover:text-primary hover:border-primary/20 rounded-lg transition-colors"><Printer size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Valuation by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categoryDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  dataKey="value"
                >
                  {data?.categoryDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Box */}
        <div className="space-y-6">
          <div className="bg-warning/10 dark:bg-warning/20 p-6 rounded-2xl border border-warning/20 shadow-sm">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Low Stock Alerts ({data?.lowStockMaterials?.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {data?.lowStockMaterials?.map(m => (
                <div key={m.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-100 flex justify-between items-center text-sm">
                  <span className="font-medium text-amber-900">{m.materialName}</span>
                  <span className="text-amber-700 font-bold">{m.availableStock} / {m.minimumStock}</span>
                </div>
              ))}
              {data?.lowStockMaterials?.length === 0 && <p className="text-amber-700 text-sm">All items are sufficiently stocked.</p>}
            </div>
          </div>

          <div className="bg-danger/10 dark:bg-danger/20 p-6 rounded-2xl border border-danger/20 shadow-sm">
            <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Out of Stock ({data?.outOfStockMaterials?.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {data?.outOfStockMaterials?.map(m => (
                <div key={m.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-red-100 flex justify-between items-center text-sm">
                  <span className="font-medium text-red-900">{m.materialName}</span>
                  <span className="text-red-700 font-bold">0 {m.unit}</span>
                </div>
              ))}
              {data?.outOfStockMaterials?.length === 0 && <p className="text-red-700 text-sm">No items are currently out of stock.</p>}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default InventoryReports;

import React, { useState, useEffect } from 'react';
import { getProductionReports } from '../../services/report.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Printer, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { exportToExcel, exportToPDF, printReport } from '../../utils/exportUtils';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '../../components/ui/DatePicker';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const ProductionReports = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProductionReports(dateRange.startDate && dateRange.endDate ? dateRange : {});
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(data.jobs, [
      { header: 'Job No', accessor: 'productionNumber' },
      { header: 'Item', accessor: 'order.furnitureName' },
      { header: 'Stage', accessor: 'productionStage' },
      { header: 'Status', accessor: 'status' },
      { header: 'Start Date', accessor: (j) => j.startDate ? new Date(j.startDate).toLocaleDateString() : 'N/A' },
      { header: 'Deadline', accessor: (j) => j.expectedCompletionDate ? new Date(j.expectedCompletionDate).toLocaleDateString() : 'N/A' }
    ], 'Production_Report');
  };

  const handleExportPDF = () => {
    exportToPDF(data.jobs, [
      { header: 'Job No', accessor: 'productionNumber' },
      { header: 'Item', accessor: 'order.furnitureName' },
      { header: 'Stage', accessor: 'productionStage' },
      { header: 'Status', accessor: 'status' },
      { header: 'Deadline', accessor: (j) => j.expectedCompletionDate ? new Date(j.expectedCompletionDate).toLocaleDateString() : 'N/A' }
    ], 'Production Report', 'Production_Report');
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
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Production Performance</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analyze stage bottlenecks and completion rates.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
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
          <button onClick={handleExportPDF} title="Export PDF" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-danger/10 dark:bg-danger/20 hover:text-danger hover:border-danger/20 rounded-lg transition-colors"><Download size={18} /></button>
          <button onClick={handleExportExcel} title="Export Excel" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-success/10 dark:bg-success/20 hover:text-success hover:border-success/20 rounded-lg transition-colors"><Download size={18} /></button>
          <button onClick={printReport} title="Print" className="p-2 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:bg-primary/20 hover:text-primary hover:border-primary/20 rounded-lg transition-colors"><Printer size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stage Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Jobs by Production Stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stageDistribution || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{fontSize: 11}} tickLine={false} axisLine={false} width={100} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Status Distribution</h3>
            <span className="text-sm font-bold text-danger bg-danger/10 dark:bg-danger/20 px-2 py-1 rounded">Delayed: {data?.delayedCount}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.statusDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProductionReports;

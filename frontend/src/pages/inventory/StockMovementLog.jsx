import React, { useState, useEffect } from 'react';
import { getTransactions, createTransaction } from '../../services/inventory.service';
import { getMaterials } from '../../services/material.service';
import { Plus, ArrowDownRight, ArrowUpRight, Search, Loader2, ArrowLeft, RefreshCw, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const StockMovementLog = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } });
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [page, setPage] = useState(1);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    materialId: '',
    transactionType: 'StockIn',
    quantity: '',
    reference: '',
    remarks: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    fetchTransactions(page);
  }, [search, typeFilter, materialFilter, page]);

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials({ limit: 1000 });
      setMaterials(res.data);
    } catch (err) {
      console.error('Failed to load materials:', err);
    }
  };

  const fetchTransactions = async (pageNumber = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTransactions({ page: pageNumber, limit: 20, type: typeFilter, materialId: materialFilter, search });
      setTransactions(res);
    } catch (err) {
      console.error(err);
      setError('Failed to load stock movements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTransaction({
        ...formData,
        quantity: parseFloat(formData.quantity)
      });
      setShowModal(false);
      setFormData({ materialId: '', transactionType: 'StockIn', quantity: '', reference: '', remarks: '' });
      fetchTransactions(1);
      setPage(1);
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= transactions.meta.totalPages) {
      setPage(newPage);
    }
  };

  // Safe rendering of filtered items if backend doesn't support generic 'search' param natively yet
  const filteredData = transactions.data.filter(tx => {
    if (!search) return true;
    const term = search.toLowerCase();
    const matName = tx.material?.materialName?.toLowerCase() || '';
    const matCode = tx.material?.materialCode?.toLowerCase() || '';
    const ref = tx.reference?.toLowerCase() || '';
    const rem = tx.remarks?.toLowerCase() || '';
    return matName.includes(term) || matCode.includes(term) || ref.includes(term) || rem.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Back to Inventory
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Stock Movement Log</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Audit trail for all raw material movements</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={20} /> Record Stock In
        </button>
      </div>

      {/* Filters Area */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by reference, remarks, or material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-sm"
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">All Movement Types</option>
            <option value="StockIn">Stock In (+)</option>
            <option value="StockOut">Stock Out (-)</option>
            <option value="Adjustment">Adjustment</option>
          </select>

          <select 
            value={materialFilter}
            onChange={(e) => { setMaterialFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">All Materials</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.materialName} ({m.materialCode})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4">Movement Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Reference / Reason</th>
                <th className="px-6 py-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    Loading stock movements...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-red-500">
                    <p className="mb-2">{error}</p>
                    <button onClick={() => fetchTransactions(page)} className="btn-secondary mx-auto">
                      <RefreshCw size={16} /> Retry
                    </button>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                    <Filter className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No stock movements recorded yet</p>
                    <p className="text-sm mt-1">Adjust filters or record a new stock-in entry to see data here.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(tx => (
                  <tr key={tx.id} className="table-row-hover bg-white dark:bg-slate-900/40">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      {tx.material ? (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{tx.material.materialName}</div>
                          <div className="text-xs text-slate-500">{tx.material.materialCode}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown Material</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.transactionType === 'StockIn' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <ArrowDownRight size={14} /> Stock In
                        </span>
                      )}
                      {tx.transactionType === 'StockOut' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          <ArrowUpRight size={14} /> Stock Out
                        </span>
                      )}
                      {tx.transactionType === 'Adjustment' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <RefreshCw size={14} /> Adjustment
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${tx.transactionType === 'StockOut' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {tx.transactionType === 'StockOut' ? '-' : '+'}{tx.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{tx.reference || '—'}</div>
                      <div className="text-xs text-slate-500 max-w-xs truncate" title={tx.remarks}>{tx.remarks || 'No remarks'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {tx.createdBy ? (tx.user?.fullName || 'Staff') : 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && transactions.meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm text-slate-500">
              Showing page {transactions.meta.page} of {transactions.meta.totalPages} ({transactions.meta.total} entries)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === transactions.meta.totalPages}
                className="btn-secondary py-1.5 px-3 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Stock In Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Record Stock In</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="label-field">Material *</label>
                  <select 
                    required
                    value={formData.materialId}
                    onChange={(e) => setFormData({...formData, materialId: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Material...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.materialName} ({m.materialCode})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label-field">Quantity *</label>
                  <input 
                    type="number" 
                    required 
                    min="0.01" 
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="input-field"
                    placeholder="Enter received quantity"
                  />
                </div>
                
                <div>
                  <label className="label-field">Reference / Invoice Number *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="input-field"
                    placeholder="e.g. INV-2023-089"
                  />
                </div>
                
                <div>
                  <label className="label-field">Remarks (Optional)</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="input-field min-h-[100px] resize-y"
                    placeholder="Any additional notes about this stock delivery..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={18} />}
                    Record Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StockMovementLog;

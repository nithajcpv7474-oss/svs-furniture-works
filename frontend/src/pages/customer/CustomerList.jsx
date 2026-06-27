import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '../../services/customer.service';
import { Plus, Search, MoreVertical, Edit, Trash2, Mail, Phone, Loader2 } from 'lucide-react';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers(search);
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        alert('Failed to delete customer.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your retail and corporate clients.</p>
        </div>
        <button 
          onClick={() => navigate('/customers/new')}
          className="px-4 py-2.5 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary-dark transition-colors font-medium text-sm shadow-sm"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, code, phone or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span>Total:</span>
            <span className="bg-slate-200 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold">{customers.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="animate-spin mx-auto w-8 h-8 text-primary mb-2" />
                    <p>Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{customer.fullName}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{customer.customerCode}</p>
                      {customer.companyName && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {customer.companyName}</p>}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                        <Phone size={14} className="text-slate-400"/> {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                          <Mail size={14} className="text-slate-400"/> {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                        ${customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${customer.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => navigate(`/customers/${customer.id}/edit`)} className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;

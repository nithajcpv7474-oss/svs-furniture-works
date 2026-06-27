import { usePermission } from '../../hooks/usePermission';
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerById } from '../../services/customer.service';
import { ArrowLeft, Edit2, User, Building, MapPin, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

const CustomerDetails = () => {
  const permission = usePermission('customers');
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await getCustomerById(id);
        setCustomer(data);
      } catch (error) {
        console.error('Failed to fetch customer details');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Customer Not Found</h2>
        <button onClick={() => navigate('/customers')} className="mt-4 text-primary hover:underline">Return to Customer List</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/customers')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{customer.fullName}</h1>
              <StatusBadge status={customer.status} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{customer.customerCode}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/customers/${customer.id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Edit2 size={16} /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contact Info Card */}
        <div className="card-premium p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <User size={20} className="text-primary" /> Contact Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{customer.phone}</p>
                {customer.alternatePhone && <p className="text-sm text-slate-500 dark:text-slate-400">Alt: {customer.alternatePhone}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-100">{customer.email || 'No email provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer Since</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Info Card */}
        <div className="card-premium p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Building size={20} className="text-emerald-500" /> Business Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Customer Type</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100"><StatusBadge status={customer.customerType} /></p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Company Name</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{customer.companyName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">GST Number</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 uppercase">{customer.gstNumber || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="card-premium p-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <MapPin size={20} className="text-amber-500" /> Location & Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Billing / Shipping Address</p>
              {customer.address || customer.city ? (
                <div className="text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p>{customer.address}</p>
                  <p>{customer.city}{customer.state ? `, ${customer.state}` : ''}</p>
                  <p>{customer.pincode}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No address provided</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Additional Notes</p>
              {customer.notes ? (
                <div className="text-sm text-slate-800 dark:text-slate-100 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                  <p className="whitespace-pre-wrap">{customer.notes}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No notes added</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerDetails;

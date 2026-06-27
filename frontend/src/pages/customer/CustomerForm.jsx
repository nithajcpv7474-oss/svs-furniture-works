import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerById, createCustomer, updateCustomer } from '../../services/customer.service';
import { Loader2, ArrowLeft, Save, User, Building2, MapPin } from 'lucide-react';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    fullName: '', phone: '', alternatePhone: '', email: '', companyName: '',
    gstNumber: '', address: '', city: '', state: '', pincode: '',
    customerType: 'Retail', status: 'Active', notes: ''
  });
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const data = await getCustomerById(id);
      if (data) setFormData(data);
    } catch (error) {
      alert('Failed to load customer details');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditMode) {
        await updateCustomer(id, formData);
      } else {
        await createCustomer(formData);
      }
      navigate('/customers');
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{isEditMode ? 'Edit Customer' : 'New Customer'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Please fill in the client's information below.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/customers')} className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:bg-slate-950 shadow-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditMode ? 'Update Profile' : 'Save Customer'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info Section */}
        <div className="card-premium overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <User size={18} className="text-primary" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Basic Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Enter full name"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Primary Phone <span className="text-red-500">*</span></label>
              <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Mobile number"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Email Address</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Email address"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Alternate Phone</label>
              <input name="alternatePhone" value={formData.alternatePhone || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Secondary number"/>
            </div>
          </div>
        </div>

        {/* Company & Billing Section */}
        <div className="card-premium overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Building2 size={18} className="text-emerald-600" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Company & Classification</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Company Name</label>
              <input name="companyName" value={formData.companyName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="If applicable"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">GST Number</label>
              <input name="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="GSTIN"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Customer Type</label>
              <select name="customerType" value={formData.customerType} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-slate-900">
                <option value="Retail">Retail</option>
                <option value="Dealer">Dealer</option>
                <option value="InteriorDesigner">Interior Designer</option>
                <option value="Export">Export</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Account Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-slate-900">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="card-premium overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <MapPin size={18} className="text-purple-600" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Address & Notes</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Billing Address</label>
              <textarea name="address" rows="2" value={formData.address || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Street address"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">City</label>
                <input name="city" value={formData.city || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">State</label>
                <input name="state" value={formData.state || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Pincode</label>
                <input name="pincode" value={formData.pincode || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Internal Notes</label>
              <textarea name="notes" rows="3" value={formData.notes || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Any special requirements or history..."></textarea>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default CustomerForm;

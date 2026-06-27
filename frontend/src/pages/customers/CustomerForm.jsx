import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, User, Building, MapPin, FileText, 
  Store, Briefcase, Globe, AlertCircle, Phone, Mail, CheckCircle2,
  Hash, Factory
} from 'lucide-react';
import { useFormErrors } from '../../hooks/useFormErrors';
import { FormAlert } from '../../components/ui/FormAlert';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    companyName: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    customerType: 'Retail',
    status: 'Active',
    notes: ''
  });

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const { globalError, fieldErrors, handleError, clearErrors, setFieldErrors } = useFormErrors();
  const [toast, setToast] = useState(null);

  // Active step state for the "Multi-step" UI feel
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (isEdit) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const data = await getCustomerById(id);
      setFormData({
        fullName: data.fullName || '',
        phone: data.phone || '',
        alternatePhone: data.alternatePhone || '',
        email: data.email || '',
        companyName: data.companyName || '',
        gstNumber: data.gstNumber || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        customerType: data.customerType || 'Retail',
        status: data.status || 'Active',
        notes: data.notes || ''
      });
    } catch (err) {
      handleError({ message: 'Failed to fetch customer details.' });
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'phone' || e.target.name === 'alternatePhone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const setCustomerType = (type) => {
    setFormData({ ...formData, customerType: type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    clearErrors();

    if (formData.phone.length !== 10) {
      setFieldErrors({ phone: 'Phone number must contain exactly 10 digits.' });
      setSubmitting(false);
      return;
    }

    try {
      if (isEdit) {
        await updateCustomer(id, formData);
        showToast('Customer updated successfully!');
      } else {
        await createCustomer(formData);
        showToast('Customer created successfully!');
      }
      setTimeout(() => navigate('/customers'), 1500);
    } catch (err) {
      handleError(err);
      setSubmitting(false);
    }
  };

  const customerTypes = [
    { id: 'Retail', label: 'Retail Customer', desc: 'Direct consumer purchasing for personal use', icon: User, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-500' },
    { id: 'Dealer', label: 'Dealer / Retailer', desc: 'Business purchasing for resale', icon: Store, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-500' },
    { id: 'InteriorDesigner', label: 'Interior Designer', desc: 'Professional design or architecture firm', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-500' },
    { id: 'Export', label: 'Export Customer', desc: 'International client or overseas distributor', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-500' }
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold border flex items-center gap-3 backdrop-blur-md
            ${toast.type === 'error' ? 'bg-rose-50/90 text-rose-800 border-rose-200' : 'bg-emerald-50/90 text-emerald-800 border-emerald-200'}`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-8 shadow-xl shadow-blue-900/20"
      >
        <div className="absolute top-0 right-0 opacity-20 pointer-events-none">
          <svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M48.7,-64.5C62.1,-52.1,71.2,-34.5,75.2,-15.8C79.2,2.9,78,22.7,68.9,38.6C59.8,54.5,42.8,66.5,24.4,72.6C6,78.7,-13.7,78.9,-30.8,72C-47.9,65.1,-62.4,51.1,-71.4,34.4C-80.4,17.7,-83.9,-1.7,-78.9,-19C-73.9,-36.3,-60.4,-51.5,-45,-63.5C-29.6,-75.5,-14.8,-84.3,1.9,-86.6C18.6,-88.9,35.3,-76.9,48.7,-64.5Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex items-center gap-6">
          <button 
            onClick={() => navigate('/customers')}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
              {isEdit ? 'Edit Customer Profile' : 'Create New Customer'}
            </h1>
            <p className="text-blue-100 font-medium mt-1">
              {isEdit ? 'Update the details for this business relationship.' : 'Add customer information and business details to expand your network.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Progress Cards / Multi-step UI */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { id: 1, label: 'Personal Info', icon: User, color: 'text-blue-600', bg: 'bg-blue-100' },
          { id: 2, label: 'Business Details', icon: Building, color: 'text-purple-600', bg: 'bg-purple-100' },
          { id: 3, label: 'Address Info', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { id: 4, label: 'Notes', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100' }
        ].map(step => (
          <div 
            key={step.id} 
            onClick={() => setActiveStep(step.id)}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 shadow-sm
            ${activeStep === step.id ? 'border-blue-500 bg-blue-50/50 shadow-blue-500/20 scale-[1.02]' : 'border-transparent bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50'}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeStep === step.id ? step.bg : 'bg-slate-100 dark:bg-slate-800'} transition-colors`}>
              <step.icon size={24} className={activeStep === step.id ? step.color : 'text-slate-400'} />
            </div>
            <p className={`text-sm font-bold ${activeStep === step.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{step.label}</p>
          </div>
        ))}
      </motion.div>

      <FormAlert error={globalError} onClose={clearErrors} />

      <form onSubmit={handleSubmit} className="space-y-8 relative">
        
        {/* Step 1: Personal Info */}
        <motion.div 
          className={`card-premium p-8 border-t-4 border-t-blue-500 shadow-xl ${activeStep === 1 ? 'ring-4 ring-blue-500/10' : ''}`}
          onClick={() => setActiveStep(1)}
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg"><User size={20} /></div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">1. Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Full Name <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required name="fullName" value={formData.fullName} onChange={handleChange} type="text" 
                  className={`w-full bg-slate-50 dark:bg-slate-900 border-2 focus:border-blue-500 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${fieldErrors.fullName ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700'}`} 
                  placeholder="John Doe" />
              </div>
              {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Phone Number <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" maxLength={10} inputMode="numeric"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border-2 focus:border-blue-500 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700'}`} 
                  placeholder="9876543210" />
              </div>
              {fieldErrors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="email" value={formData.email} onChange={handleChange} type="email"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border-2 focus:border-blue-500 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${fieldErrors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700'}`} 
                  placeholder="john@example.com" />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.email}</p>}
            </div>
          </div>
        </motion.div>

        {/* Step 2: Business Details */}
        <motion.div 
          className={`card-premium p-8 border-t-4 border-t-purple-500 shadow-xl ${activeStep === 2 ? 'ring-4 ring-purple-500/10' : ''}`}
          onClick={() => setActiveStep(2)}
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg"><Building size={20} /></div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">2. Business Details</h3>
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Select Customer Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {customerTypes.map(type => (
                <div 
                  key={type.id} 
                  onClick={() => setCustomerType(type.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group
                    ${formData.customerType === type.id ? `border-transparent shadow-lg scale-[1.02] ${type.bg}` : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  {formData.customerType === type.id && (
                    <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${type.border}`}></div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <type.icon size={20} className={formData.customerType === type.id ? type.color : 'text-slate-400'} />
                    <p className={`font-bold ${formData.customerType === type.id ? 'text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}>{type.label}</p>
                  </div>
                  <p className={`text-xs ${formData.customerType === type.id ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{type.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Company / Business Name</label>
              <div className="relative">
                <Factory size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="companyName" value={formData.companyName} onChange={handleChange} type="text"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all" 
                  placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">GST Number</label>
              <div className="relative">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} type="text"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/20 uppercase transition-all" 
                  placeholder="22AAAAA0000A1Z5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 3: Address Info */}
        <motion.div 
          className={`card-premium p-8 border-t-4 border-t-emerald-500 shadow-xl ${activeStep === 3 ? 'ring-4 ring-emerald-500/10' : ''}`}
          onClick={() => setActiveStep(3)}
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg"><MapPin size={20} /></div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">3. Address Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Full Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl p-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all resize-none" 
                placeholder="Street address, building, etc." />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">City</label>
              <input name="city" value={formData.city} onChange={handleChange} type="text"
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl py-3.5 px-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">State</label>
                <input name="state" value={formData.state} onChange={handleChange} type="text"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl py-3.5 px-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">PIN Code</label>
                <input name="pincode" value={formData.pincode} onChange={handleChange} type="text"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl py-3.5 px-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 4: Notes */}
        <motion.div 
          className={`card-premium p-8 border-t-4 border-t-orange-500 shadow-xl ${activeStep === 4 ? 'ring-4 ring-orange-500/10' : ''}`}
          onClick={() => setActiveStep(4)}
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg"><FileText size={20} /></div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">4. Additional Notes</h3>
          </div>
          <div>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={5}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 rounded-xl p-4 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all" 
              placeholder="Any special requirements, payment terms, or history about this customer..." />
            <div className="text-right mt-2 text-xs font-bold text-slate-400">{formData.notes.length} characters</div>
          </div>
        </motion.div>

        {/* Submit Button Sticky Footer */}
        <div className="sticky bottom-6 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-between items-center mt-12">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
            Double check all fields before saving.
          </p>
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(249,115,22,0.5)" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-10 py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            {submitting ? 'Saving Profile...' : 'Save Customer Profile'}
          </motion.button>
        </div>

      </form>
    </div>
  );
};

export default CustomerForm;

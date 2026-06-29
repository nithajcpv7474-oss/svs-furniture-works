import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Truck, User, Phone, Save } from 'lucide-react';
import { updateDeliveryStatus, assignTransporter } from '../../services/delivery.service';

const validTransitions = {
  'Pending': ['Scheduled'],
  'Scheduled': ['Dispatched'],
  'Dispatched': ['InTransit'],
  'InTransit': ['Delivered'],
  'Delivered': [],
  'Failed': ['Rescheduled'],
  'Rescheduled': ['Dispatched'],
  'Returned': [],
  'InstallationPending': ['Completed'],
  'Completed': []
};

const StatusOption = ({ status, currentStatus, onSelect, selected }) => {
  const isAvailable = validTransitions[currentStatus]?.includes(status);
  
  if (!isAvailable && status !== currentStatus) return null;
  
  return (
    <button
      type="button"
      onClick={() => onSelect(status)}
      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
        selected === status 
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
      }`}
      disabled={status === currentStatus}
    >
      {status}
    </button>
  );
};

export const DeliveryStatusModal = ({ delivery, isOpen, onClose, onUpdated }) => {
  if (!isOpen || !delivery) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    deliveryStatus: delivery.deliveryStatus,
    transporterName: delivery.transporterName || '',
    transporterContact: delivery.transporterContact || '',
    scheduledDate: delivery.expectedDeliveryDate ? new Date(delivery.expectedDeliveryDate).toISOString().split('T')[0] : '',
    scheduledTimeSlot: delivery.scheduledTimeSlot || 'Morning (9AM - 12PM)',
    deliveryNotes: delivery.deliveryNotes || delivery.deliveryRemarks || '',
    reason: ''
  });

  useEffect(() => {
    setFormData({
      deliveryStatus: delivery.deliveryStatus,
      transporterName: delivery.transporterName || '',
      transporterContact: delivery.transporterContact || '',
      scheduledDate: delivery.expectedDeliveryDate ? new Date(delivery.expectedDeliveryDate).toISOString().split('T')[0] : '',
      scheduledTimeSlot: delivery.scheduledTimeSlot || 'Morning (9AM - 12PM)',
      deliveryNotes: delivery.deliveryNotes || delivery.deliveryRemarks || '',
      reason: ''
    });
    setError('');
  }, [delivery, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStatusSelect = (status) => {
    setFormData({ ...formData, deliveryStatus: status });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (['Failed', 'Rescheduled', 'Returned'].includes(formData.deliveryStatus) && !formData.reason.trim()) {
        throw new Error(`Reason is required for ${formData.deliveryStatus}`);
      }

      if (formData.deliveryStatus !== delivery.deliveryStatus) {
        await updateDeliveryStatus(delivery.id, formData);
      } else {
        await assignTransporter(delivery.id, formData);
      }
      
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Update Delivery — {delivery.order?.orderNumber}</h2>
            <p className="text-sm text-slate-400 mt-1">{delivery.order?.furnitureName} | Customer: {delivery.customer?.fullName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Status Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-400">CURRENT STATUS</label>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                {delivery.deliveryStatus}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">MOVE TO NEXT STATUS</label>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusOption status="Scheduled" currentStatus={delivery.deliveryStatus} selected={formData.deliveryStatus} onSelect={handleStatusSelect} />
                <StatusOption status="Dispatched" currentStatus={delivery.deliveryStatus} selected={formData.deliveryStatus} onSelect={handleStatusSelect} />
                <StatusOption status="InTransit" currentStatus={delivery.deliveryStatus} selected={formData.deliveryStatus} onSelect={handleStatusSelect} />
                <StatusOption status="Delivered" currentStatus={delivery.deliveryStatus} selected={formData.deliveryStatus} onSelect={handleStatusSelect} />
                <StatusOption status="Completed" currentStatus={delivery.deliveryStatus} selected={formData.deliveryStatus} onSelect={handleStatusSelect} />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-slate-400">SPECIAL ACTIONS</label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => handleStatusSelect('Failed')} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.deliveryStatus === 'Failed' ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-red-500/50 hover:text-red-400'}`}>Failed</button>
                <button type="button" onClick={() => handleStatusSelect('Rescheduled')} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.deliveryStatus === 'Rescheduled' ? 'bg-orange-500/20 text-orange-400 border-orange-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-orange-500/50 hover:text-orange-400'}`}>Reschedule</button>
                <button type="button" onClick={() => handleStatusSelect('Returned')} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.deliveryStatus === 'Returned' ? 'bg-slate-700 text-slate-200 border-slate-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'}`}>Returned</button>
              </div>
            </div>
          </div>

          <hr className="border-slate-700" />

          {/* Transporter Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase">Assign / Update Transporter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Transporter Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                  <input type="text" name="transporterName" value={formData.transporterName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Ravi Kumar" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                  <input type="text" name="transporterContact" value={formData.transporterContact} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. 9876543210" />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Delivery Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                  <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Time Slot</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                  <select name="scheduledTimeSlot" value={formData.scheduledTimeSlot} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 appearance-none">
                    <option>Morning (9AM - 12PM)</option>
                    <option>Afternoon (12PM - 4PM)</option>
                    <option>Evening (4PM - 7PM)</option>
                    <option>Full Day</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <label className="block text-sm text-slate-400 mb-1">Delivery Notes</label>
             <input type="text" name="deliveryNotes" value={formData.deliveryNotes} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Call before arriving" />
          </div>

          {['Failed', 'Rescheduled', 'Returned'].includes(formData.deliveryStatus) && (
            <div className="space-y-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
               <label className="block text-sm text-red-400 font-medium mb-1">Reason (Required for {formData.deliveryStatus})</label>
               <input type="text" name="reason" value={formData.reason} onChange={handleChange} required className="w-full bg-slate-900 border border-red-500/50 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-red-500" placeholder="Please provide a reason..." />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 -mx-6 -mb-6 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              {formData.deliveryStatus !== delivery.deliveryStatus ? 'Update Status' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { usePermission } from '../../hooks/usePermission';
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeliveryById, updateDelivery, getVehicles } from '../../services/delivery.service';
import { AuthContext } from '../../context/AuthContext';
import { ArrowLeft, Truck, Package, MapPin, Calendar, Upload, CheckCircle, FileText, Loader2, Image as ImageIcon, Ship, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STAGES = ['Pending', 'Scheduled', 'Dispatched', 'InTransit', 'Delivered', 'InstallationPending', 'Completed'];
const EXCEPTION_STAGES = ['Failed', 'Rescheduled', 'Returned'];

const DeliveryDetails = () => {
  const permission = usePermission('delivery');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [vehicles, setVehicles] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Form State
  const [status, setStatus] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [podFile, setPodFile] = useState(null);
  const [sigFile, setSigFile] = useState(null);

  // Export fields (for SalesStaff/Admin to edit)
  const [shippingDocRef, setShippingDocRef] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [transitTime, setTransitTime] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryById(id);
      setDelivery(data);
      setStatus(data.deliveryStatus);
      setVehicleId(data.vehicleId || '');
      setShippingDocRef(data.shippingDocRef || '');
      setDestinationPort(data.destinationPort || '');
      setTransitTime(data.transitTime || '');

      // Set document title for breadcrumbs
      document.title = data.deliveryNumber || 'Delivery Details';

      const vRes = await getVehicles({ limit: 100 });
      setVehicles(vRes.data || vRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validation for Scheduled and beyond
    const isProgression = ['Scheduled', 'Dispatched', 'InTransit', 'OutForDelivery', 'Delivered', 'InstallationPending', 'Completed'].includes(status);
    if (isProgression) {
      if (!delivery.deliveryAddress && !delivery.customer?.address) {
        alert('Validation Error: Add a destination address before scheduling this delivery.');
        return;
      }
      if (!vehicleId) {
        alert('Validation Error: Assign a vehicle before scheduling this delivery.');
        return;
      }
      const selectedVehicle = vehicles.find(v => v.id === vehicleId);
      if (selectedVehicle && !selectedVehicle.driverName) {
        alert('Validation Error: The selected vehicle must have an assigned driver.');
        return;
      }
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('deliveryStatus', status);
      if (vehicleId) formData.append('vehicleId', vehicleId);
      
      if (delivery.deliveryType === 'Export') {
        formData.append('shippingDocRef', shippingDocRef);
        formData.append('destinationPort', destinationPort);
        formData.append('transitTime', transitTime);
      }

      if (podFile) formData.append('proofOfDeliveryImage', podFile);
      if (sigFile) formData.append('customerSignature', sigFile);

      await updateDelivery(id, null, formData);
      
      await fetchData();
      setPodFile(null);
      setSigFile(null);
      alert('Delivery updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update delivery');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!delivery) return <div>Delivery not found.</div>;

  const currentStageIndex = STATUS_STAGES.indexOf(delivery.deliveryStatus);
  const isException = EXCEPTION_STAGES.includes(delivery.deliveryStatus);
  const canEditSchedule = user?.role === 'Admin' || user?.role === 'SalesStaff';

  // Determine allowed next statuses
  let allowedStatuses = [];
  if (isException) {
    allowedStatuses = ['Pending', 'Scheduled', delivery.deliveryStatus];
  } else if (currentStageIndex >= 0) {
    allowedStatuses = [...STATUS_STAGES.slice(0, currentStageIndex + 2), ...EXCEPTION_STAGES];
  } else {
    allowedStatuses = STATUS_STAGES;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md z-20 py-4 mb-6 border-b border-slate-200 dark:border-slate-700 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{delivery.deliveryNumber}</h1>
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                delivery.deliveryStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                delivery.deliveryStatus === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}>
                {delivery.deliveryStatus.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              {delivery.deliveryType === 'Export' && (
                <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded text-xs font-bold uppercase flex items-center gap-1">
                  <Ship size={12}/> Export
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Order Ref: {delivery.order?.orderNumber}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => navigate(`/delivery/${id}/receipt`)} className="btn-secondary text-sm flex items-center gap-2 whitespace-nowrap">
            <FileText size={16} /> Print Delivery Note
          </button>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="card-premium overflow-x-auto">
        <div className="min-w-[800px] flex justify-between relative px-8 py-6">
          <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />
          {!isException && (
            <div className="absolute top-1/2 left-10 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${Math.max(0, currentStageIndex * (100 / (STATUS_STAGES.length - 1)))}%` }} />
          )}
          
          {STATUS_STAGES.map((stage, idx) => {
            const isCompleted = !isException && idx <= currentStageIndex;
            const isCurrent = !isException && idx === currentStageIndex;
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-colors ${
                  isCompleted ? 'bg-primary border-primary/20 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300'
                }`}>
                  {isCompleted ? <CheckCircle size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />}
                </div>
                <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : isCompleted ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                  {stage.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            );
          })}
        </div>
        {isException && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 flex justify-center items-center gap-2 text-red-600 dark:text-red-400 font-semibold border-t border-red-100 dark:border-red-900/30">
            <AlertCircle size={18}/> Delivery marked as {delivery.deliveryStatus}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="card-premium overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Package className="text-primary" size={18} /> 
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Item Summary</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{delivery.order?.furnitureName}</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">Category: {delivery.order?.furnitureCategory}</p>
                  <p className="text-slate-600 dark:text-slate-300">Quantity: {delivery.order?.quantity}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Customer Details</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{delivery.customer?.fullName}</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{delivery.customer?.phone}</p>
                </div>
              </div>
              
              {delivery.order?.specialInstructions && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase mb-1 flex items-center gap-1"><AlertCircle size={14}/> Special Handling Notes</p>
                  <p className="text-sm text-amber-900 dark:text-amber-400">{delivery.order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-premium overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <MapPin className="text-primary" size={18} /> 
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Delivery Address</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="sm:col-span-2">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Destination Address</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{delivery.deliveryAddress || delivery.customer?.address || 'No address provided'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Receiver Name</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{delivery.receiverName || delivery.customer?.fullName}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Receiver Phone</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{delivery.receiverPhone || delivery.customer?.phone}</p>
              </div>
            </div>
          </div>

          {delivery.deliveryType === 'Export' && (
            <div className="card-premium overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Ship className="text-primary" size={18} /> 
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Export Shipment Details</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Shipping Doc Ref</p>
                  {canEditSchedule ? (
                    <input type="text" value={shippingDocRef} onChange={e=>setShippingDocRef(e.target.value)} className="input-field py-1 px-2" placeholder="e.g. BOL-12345" />
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">{delivery.shippingDocRef || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Destination Port</p>
                  {canEditSchedule ? (
                    <input type="text" value={destinationPort} onChange={e=>setDestinationPort(e.target.value)} className="input-field py-1 px-2" placeholder="e.g. Port of Los Angeles" />
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">{delivery.destinationPort || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Expected Transit Time</p>
                  {canEditSchedule ? (
                    <input type="text" value={transitTime} onChange={e=>setTransitTime(e.target.value)} className="input-field py-1 px-2" placeholder="e.g. 14 Days" />
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">{delivery.transitTime || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Proof of Delivery Viewing */}
          {(delivery.proofOfDeliveryImage || delivery.customerSignature) && (
            <div className="card-premium overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={18} /> 
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Delivery Confirmation</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {delivery.proofOfDeliveryImage && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Proof of Delivery</p>
                    <img src={`http://localhost:5005/uploads/${delivery.proofOfDeliveryImage}`} alt="POD" className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                  </div>
                )}
                {delivery.customerSignature && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Customer Signature</p>
                    <img src={`http://localhost:5005/uploads/${delivery.customerSignature}`} alt="Signature" className="w-full h-48 object-contain bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700" />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Update Panel */}
        <div className="space-y-6">
          <form onSubmit={handleUpdate} className="card-premium p-6 space-y-5 sticky top-24">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Truck className="text-primary" size={18} /> Status Control
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="input-field bg-white dark:bg-slate-900 font-semibold"
              >
                {/* Enforce strict state machine by only showing allowed next statuses */}
                <option value={delivery.deliveryStatus}>{delivery.deliveryStatus.replace(/([A-Z])/g, ' $1').trim()} (Current)</option>
                {allowedStatuses.filter(s => s !== delivery.deliveryStatus).map(s => (
                  <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Assigned Vehicle</label>
              <select 
                value={vehicleId} 
                onChange={e => setVehicleId(e.target.value)}
                disabled={!canEditSchedule}
                className="input-field bg-white dark:bg-slate-900 disabled:opacity-50"
              >
                <option value="">-- Unassigned --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.driverName || 'No Driver'})</option>
                ))}
              </select>
            </div>

            {['Delivered', 'InstallationPending', 'Completed'].includes(status) && !delivery.proofOfDeliveryImage && (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Upload POD Image</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm cursor-pointer hover:bg-slate-50 dark:bg-slate-950 transition-colors">
                    <ImageIcon size={16} className="text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300 truncate">{podFile ? podFile.name : 'Choose Image...'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setPodFile(e.target.files[0])} />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Signature / OTP Capture</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm cursor-pointer hover:bg-slate-50 dark:bg-slate-950 transition-colors">
                    <Upload size={16} className="text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300 truncate">{sigFile ? sigFile.name : 'Upload Signature...'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setSigFile(e.target.files[0])} />
                  </label>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={updating}
              className="btn-primary w-full justify-center py-2.5"
            >
              {updating ? <Loader2 size={18} className="animate-spin" /> : 'Save Updates'}
            </button>
          </form>

          {/* Quick Stats Box */}
          <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-sm">
            <h4 className="font-semibold mb-3 flex items-center gap-2"><Calendar size={16}/> Schedule Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span>{format(new Date(delivery.createdAt), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected</span>
                <span>{delivery.expectedDeliveryDate ? format(new Date(delivery.expectedDeliveryDate), 'dd MMM yyyy') : 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actual Delivery</span>
                <span className="font-bold text-emerald-400">{delivery.actualDeliveryDate ? format(new Date(delivery.actualDeliveryDate), 'dd MMM yyyy') : 'Pending'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DeliveryDetails;

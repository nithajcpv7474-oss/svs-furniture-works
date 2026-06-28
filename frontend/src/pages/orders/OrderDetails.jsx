import { usePermission } from '../../hooks/usePermission';
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../../services/order.service';
import { createProductionJob } from '../../services/production.service';
import { ArrowLeft, Edit2, Printer, CheckCircle, Package, User, MapPin, IndianRupee, Loader2, Image as ImageIcon, Hammer } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { OrderProgressTracker } from './OrderProgressTracker';
import { OrderStatusHistoryList } from './OrderStatusHistoryList';
import { OrderStatusModal } from './OrderStatusModal';
import { updateOrderStatus } from '../../services/order.service';

const OrderDetails = () => {
  const permission = usePermission('orders');
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingProduction, setStartingProduction] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(id);
        setOrder(data);
      } catch (error) {
        console.error('Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleStartProduction = async () => {
    if (!window.confirm("Are you sure you want to push this order to production?")) return;
    setStartingProduction(true);
    try {
      await createProductionJob({ orderId: order.id, priority: 'Medium' });
      alert('Production job created successfully! The order is now in production.');
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start production. Check if stock is sufficient.');
    } finally {
      setStartingProduction(false);
    }
  };

  const handleUpdateStatus = async (id, payload) => {
    const updated = await updateOrderStatus(id, payload);
    const refreshedOrder = await getOrderById(id);
    setOrder(refreshedOrder);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Order Not Found</h2>
        <button onClick={() => navigate('/orders')} className="mt-4 text-primary hover:underline">Return to Orders</button>
      </div>
    );
  }

  const UPLOADS_URL = 'http://localhost:5005/uploads/';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 print:max-w-none print:m-0 print:space-y-4">
      
      {/* Header - Hidden in Print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{order.orderNumber}</h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{order.furnitureCategory} - {order.furnitureName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.orderStatus !== 'InProduction' && order.orderStatus !== 'Completed' && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
            <button onClick={handleStartProduction} disabled={startingProduction} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
              <Hammer size={16} /> {startingProduction ? 'Starting...' : 'Start Production'}
            </button>
          )}
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium text-sm shadow-sm">
            <Printer size={16} /> Print Spec
          </button>
          <button onClick={() => navigate(`/orders/${order.id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium text-sm shadow-sm">
            <Edit2 size={16} /> Edit
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sri Venkata Sai Furniture Works</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1">Order Specification Sheet</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{order.orderNumber}</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <OrderProgressTracker 
        currentStatus={order.orderStatus} 
        history={order.statusHistory} 
        onEditClick={() => setIsStatusModalOpen(true)}
        permission={permission}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 mb-6">
        
        {/* Customer & Delivery */}
        <div className="card-premium p-6 print:shadow-none print:border-slate-300">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <User size={18} className="text-primary" /> Customer Details
          </h3>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <p><span className="font-medium">Name:</span> {order.customer?.fullName}</p>
            <p><span className="font-medium">Phone:</span> {order.customer?.phone}</p>
            <p><span className="font-medium">Delivery Date:</span> {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'TBD'}</p>
            <p><span className="font-medium">Delivery Address:</span> {order.deliveryAddress || order.customer?.address || 'Pickup'}</p>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="card-premium p-6 print:shadow-none print:border-slate-300">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <IndianRupee size={18} className="text-emerald-600" /> Payment Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Estimated Total</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">₹{order.estimatedPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Advance Paid</span>
              <span className="font-medium text-emerald-600">₹{order.advanceAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Balance Pending</span>
              <span className="font-bold text-red-600">₹{order.balanceAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="card-premium p-6 md:col-span-2 print:shadow-none print:border-slate-300">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <Package size={18} className="text-indigo-600" /> Furniture Specifications
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Item</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">{order.furnitureName}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Category</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">{order.furnitureCategory}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Quantity</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">{order.quantity}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Dimensions</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">
                {order.length} L x {order.width} W x {order.height} H {order.measurementUnit}
              </p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Wood / Base</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">{order.woodMaterial || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Finish</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">{order.finishType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Polish Color</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">{order.polishColor || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">Hardware</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 mt-1">{order.hardwareDetails || 'N/A'}</p>
            </div>
          </div>

          {(order.upholsteryRequired || order.glassRequired) && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {order.upholsteryRequired && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium mb-1">Upholstery</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{order.upholsteryMaterial} - {order.upholsteryColor}</p>
                </div>
              )}
              {order.glassRequired && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium mb-1">Glass Details</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{order.glassType}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Required Materials */}
        {order.orderMaterials && order.orderMaterials.length > 0 && (
          <div className="card-premium p-6 md:col-span-2 print:shadow-none print:border-slate-300">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Package size={18} className="text-emerald-600" /> Required Materials
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-2">Material Code</th>
                    <th className="px-4 py-2">Material Name</th>
                    <th className="px-4 py-2 text-right">Qty Required</th>
                    <th className="px-4 py-2 text-right">Available Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.orderMaterials.map((om, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{om.material ? om.material.materialCode : 'CUSTOM'}</td>
                      <td className="px-4 py-2 font-medium">
                        {om.material ? om.material.materialName : om.customMaterialName}
                        {!om.material && <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">Custom</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-bold">{om.quantityRequired} {om.material ? om.material.unit : 'Units'}</td>
                      <td className={`px-4 py-2 text-right font-medium ${!om.material || om.material.availableStock >= om.quantityRequired ? 'text-emerald-600' : 'text-red-600'}`}>
                        {om.material ? `${om.material.availableStock} ${om.material.unit}` : 'N/A'}
                        {om.material && om.material.availableStock < om.quantityRequired && (
                          <span className="block text-xs font-bold text-red-500">Insufficient</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="card-premium p-6 md:col-span-2 print:shadow-none print:border-slate-300">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              Special Instructions
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{order.specialInstructions}</p>
          </div>
        )}

        {/* Images */}
        {(order.designImage || order.referenceDrawing) && (
          <div className="card-premium p-6 md:col-span-2 print:shadow-none print:border-slate-300">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <ImageIcon size={18} className="text-blue-500" /> Attached Designs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.designImage && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Design Image</p>
                  <img src={`${UPLOADS_URL}${order.designImage}`} alt="Design" className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-64 object-contain w-full bg-slate-50 dark:bg-slate-950" />
                </div>
              )}
              {order.referenceDrawing && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Reference Drawing</p>
                  <img src={`${UPLOADS_URL}${order.referenceDrawing}`} alt="Drawing" className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-64 object-contain w-full bg-slate-50 dark:bg-slate-950" />
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-12 pt-8 border-t border-slate-300">
        <div className="flex justify-between">
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2 h-12"></div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Customer Signature</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2 h-12"></div>
            <p className="mt-8 text-center text-slate-400">Authorized Signatory</p>
          </div>
        </div>
      </div>
      
      {/* Status History Timeline */}
      <div className="mt-6">
        <OrderStatusHistoryList history={order.statusHistory} />
      </div>

      <OrderStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        order={order}
        userRole={user?.role}
        onUpdate={handleUpdateStatus}
      />
    </div>
  );
};

export default OrderDetails;

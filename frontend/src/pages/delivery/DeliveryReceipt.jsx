import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeliveryById } from '../../services/delivery.service';
import { Printer, ArrowLeft } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';

const DeliveryReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  usePermission('delivery');

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const data = await getDeliveryById(id);
        setDelivery(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDelivery();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Receipt...</div>;
  if (!delivery) return <div className="p-10 text-center">Delivery not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-20 print:bg-white print:pb-0">
      
      {/* Non-Printable Header */}
      <div className="max-w-4xl mx-auto p-4 flex justify-between items-center print:hidden">
         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft size={20} /> Back
         </button>
         <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm">
            <Printer size={18} /> Print Receipt
         </button>
      </div>

      {/* Printable Receipt Paper */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-10 mt-4 border border-slate-200">
         
         <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">DELIVERY CHALLAN</h1>
               <p className="text-sm font-medium text-slate-500 mt-1">SVS FURNITURE WORKS</p>
               <p className="text-xs text-slate-500 mt-1">123 Industrial Estate, Hyderabad, 500001<br/>Phone: +91 9876543210</p>
            </div>
            <div className="text-right">
               <p className="text-sm font-bold text-slate-500 uppercase">Challan No.</p>
               <p className="text-xl font-bold text-slate-900">{delivery.deliveryNumber}</p>
               <p className="text-xs font-medium text-slate-500 mt-2">Date: {new Date().toLocaleDateString()}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-12 mb-10">
            <div>
               <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 border-b pb-1">Customer Details</h3>
               <p className="font-bold text-slate-800">{delivery.customer?.fullName}</p>
               <p className="text-sm text-slate-600 mt-1">{delivery.deliveryAddress || delivery.customer?.address}</p>
               <p className="text-sm text-slate-600 mt-1">Phone: {delivery.receiverPhone || delivery.customer?.phone}</p>
            </div>
            <div>
               <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 border-b pb-1">Order & Delivery Details</h3>
               <table className="w-full text-sm">
                  <tbody>
                     <tr>
                        <td className="py-1 font-medium text-slate-500">Order Ref:</td>
                        <td className="py-1 font-bold text-slate-800">{delivery.order?.orderNumber}</td>
                     </tr>
                     <tr>
                        <td className="py-1 font-medium text-slate-500">Delivery Type:</td>
                        <td className="py-1 font-bold text-slate-800">{delivery.deliveryType}</td>
                     </tr>
                     <tr>
                        <td className="py-1 font-medium text-slate-500">Transporter:</td>
                        <td className="py-1 font-bold text-slate-800">{delivery.transporterName || delivery.vehicle?.driverName || 'N/A'}</td>
                     </tr>
                     <tr>
                        <td className="py-1 font-medium text-slate-500">Contact:</td>
                        <td className="py-1 font-bold text-slate-800">{delivery.transporterContact || delivery.vehicle?.vehicleNumber || 'N/A'}</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>

         <div className="mb-12">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Item Description</h3>
            <table className="w-full border-collapse border border-slate-300">
               <thead>
                  <tr className="bg-slate-100">
                     <th className="border border-slate-300 px-4 py-2 text-left text-sm font-bold text-slate-700">S.No</th>
                     <th className="border border-slate-300 px-4 py-2 text-left text-sm font-bold text-slate-700">Description of Goods</th>
                     <th className="border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-700">Quantity</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800">1</td>
                     <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800 font-medium">
                        {delivery.order?.furnitureName || 'Custom Furniture'}
                        {delivery.order?.furnitureCategory && <span className="block text-xs text-slate-500 font-normal mt-0.5">{delivery.order.furnitureCategory}</span>}
                     </td>
                     <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800 text-center font-bold">
                        {delivery.order?.quantity || 1}
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>

         {/* Signatures */}
         <div className="grid grid-cols-3 gap-8 mt-24 pt-8 border-t border-slate-200 text-center">
            <div>
               <div className="border-b border-slate-400 w-full mb-2"></div>
               <p className="text-xs font-bold text-slate-500 uppercase">Authorized Signatory</p>
            </div>
            <div>
               <div className="border-b border-slate-400 w-full mb-2"></div>
               <p className="text-xs font-bold text-slate-500 uppercase">Transporter Signature</p>
            </div>
            <div>
               <div className="border-b border-slate-400 w-full mb-2"></div>
               <p className="text-xs font-bold text-slate-500 uppercase">Receiver Signature</p>
               <p className="text-[10px] text-slate-400 mt-1">(Goods received in good condition)</p>
            </div>
         </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .max-w-4xl {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .max-w-4xl * {
            visibility: visible;
          }
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}} />
    </div>
  );
};

export default DeliveryReceipt;

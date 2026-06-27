import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMaterialById, createMaterial, updateMaterial } from '../../services/material.service';
import { ArrowLeft, Save, Loader2, Package, MapPin, IndianRupee, Image as ImageIcon } from 'lucide-react';
import { useFormErrors } from '../../hooks/useFormErrors';
import { FormAlert } from '../../components/ui/FormAlert';

const MaterialForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const { globalError, fieldErrors, handleError, clearErrors, setFieldErrors } = useFormErrors();
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    materialName: '',
    category: '',
    brand: '',
    unit: 'Pieces',
    availableStock: '0',
    minimumStock: '0',
    reorderLevel: '0',
    purchasePrice: '0',
    sellingPrice: '',
    supplierName: '',
    warehouseLocation: '',
    description: '',
    status: 'Active'
  });

  const [file, setFile] = useState(null);

  useEffect(() => {
    if (isEdit) {
      fetchMaterial();
    }
  }, [id]);

  const fetchMaterial = async () => {
    try {
      const data = await getMaterialById(id);
      setFormData({
        ...data,
        availableStock: data.availableStock.toString(),
        minimumStock: data.minimumStock.toString(),
        reorderLevel: data.reorderLevel.toString(),
        purchasePrice: data.purchasePrice.toString(),
        sellingPrice: data.sellingPrice?.toString() || '',
      });
    } catch (err) {
      showToast('Failed to fetch material.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    clearErrors();

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        submissionData.append(key, formData[key]);
      }
    });

    if (file) {
      submissionData.append('image', file);
    }

    try {
      if (isEdit) {
        await updateMaterial(id, submissionData);
        showToast('Material updated successfully!');
      } else {
        await createMaterial(submissionData);
        showToast('Material created successfully!');
      }
      setTimeout(() => navigate('/inventory'), 1500);
    } catch (err) {
      handleError(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border flex items-center gap-2 transition-all duration-300
          ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}
        `}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inventory')} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {isEdit ? 'Edit Material' : 'Add New Material'}
            </h1>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Material
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <FormAlert error={globalError} onClose={clearErrors} />

        {/* Basic Info */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Package className="text-primary" size={18} /> Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Material Name *</label>
              <input required name="materialName" value={formData.materialName} onChange={handleChange} className={`input-field ${fieldErrors.materialName ? 'border-red-500 focus:ring-red-500/20' : ''}`} />
              {fieldErrors.materialName && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.materialName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Category *</label>
              <select required name="category" value={formData.category} onChange={handleChange} className={`input-field bg-white dark:bg-slate-900 ${fieldErrors.category ? 'border-red-500 focus:ring-red-500/20' : ''}`}>
                <option value="">-- Select Category --</option>
                <option value="Wood">Wood</option>
                <option value="Hardware">Hardware</option>
                <option value="Upholstery">Upholstery</option>
                <option value="Glass">Glass</option>
                <option value="Polish">Polish</option>
                <option value="Consumables">Consumables</option>
              </select>
              {fieldErrors.category && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Brand / Manufacturer</label>
              <input name="brand" value={formData.brand} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Unit of Measurement *</label>
              <select required name="unit" value={formData.unit} onChange={handleChange} className={`input-field bg-white dark:bg-slate-900 ${fieldErrors.unit ? 'border-red-500 focus:ring-red-500/20' : ''}`}>
                <option value="Pieces">Pieces</option>
                <option value="Meters">Meters</option>
                <option value="SqFt">Sq. Ft</option>
                <option value="Liters">Liters</option>
                <option value="Kg">Kg</option>
                <option value="Sheets">Sheets</option>
              </select>
              {fieldErrors.unit && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.unit}</p>}
            </div>
          </div>
        </div>

        {/* Inventory Levels */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Package className="text-amber-500" size={18} /> Stock Levels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Opening / Available Stock *</label>
              <input required type="number" step="0.01" name="availableStock" value={formData.availableStock} onChange={handleChange} className="input-field" />
              {!isEdit && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This sets your initial stock level.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Minimum Stock Alert *</label>
              <input required type="number" step="0.01" name="minimumStock" value={formData.minimumStock} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Reorder Level *</label>
              <input required type="number" step="0.01" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <IndianRupee className="text-emerald-600" size={18} /> Pricing Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Purchase Price (₹) *</label>
              <input required type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Selling Price (₹) (Optional)</label>
              <input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Supplier & Warehouse */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <MapPin className="text-blue-500" size={18} /> Supplier & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Supplier Name</label>
              <input name="supplierName" value={formData.supplierName} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Warehouse Location (Rack/Bin)</label>
              <input name="warehouseLocation" value={formData.warehouseLocation} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Extra */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ImageIcon className="text-purple-500" size={18} /> Description & Image
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Description / Notes</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="input-field" />
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col items-center justify-center">
              <ImageIcon className="text-slate-400 mb-2" size={32} />
              <label className="block text-sm font-medium text-primary cursor-pointer">
                Upload Material Image
                <input type="file" name="image" onChange={handleFileChange} accept="image/*" className="hidden" />
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{file?.name || 'No file chosen'}</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default MaterialForm;

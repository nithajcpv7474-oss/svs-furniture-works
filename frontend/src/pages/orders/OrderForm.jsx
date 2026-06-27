import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrderById, createOrder, updateOrder } from '../../services/order.service';
import { getCustomers } from '../../services/customer.service';
import { getMaterials } from '../../services/material.service';
import { 
  ArrowLeft, Save, Loader2, User, Package, Ruler, Hammer, 
  Settings, Scissors, IndianRupee, Truck, Paperclip, FileText,
  ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { DatePicker } from '../../components/ui/DatePicker';
import { useFormErrors } from '../../hooks/useFormErrors';
import { FormAlert } from '../../components/ui/FormAlert';

const CATEGORIES = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Storage', 'Kitchen', 'Outdoor'];
const ITEM_MAP = {
  'Living Room': ['Sofa', 'TV Unit', 'Coffee Table', 'Recliner', 'Lounge Chair'],
  'Bedroom': ['Bed', 'Wardrobe', 'Dresser', 'Nightstand', 'Mirror'],
  'Dining': ['Dining Table', 'Dining Chair', 'Sideboard', 'Bar Cabinet'],
  'Office': ['Office Desk', 'Filing Cabinet', 'Bookshelf', 'Office Chair'],
  'Storage': ['Shoe Rack', 'Cabinet', 'Console Table', 'Shelving Unit'],
  'Kitchen': ['Kitchen Cabinet', 'Island Counter', 'Pantry Unit'],
  'Outdoor': ['Patio Table', 'Outdoor Chair', 'Bench']
};

const HARDWARE_OPTIONS = ['Hettich Soft-Close Hinges', 'Standard Hinges', 'Telescopic Channels', 'Soft-Close Channels', 'Drawer Slides', 'Handles', 'Knobs', 'Locks'];
const ACCESSORY_OPTIONS = ['LED Lights', 'Mirror', 'Locks', 'Cabinet Liners', 'Glass Shelves', 'Pull-Out Baskets', 'Coat Hooks'];

const UPHOLSTERY_FABRICS = ['Velvet', 'Pure Leather', 'PU Leather (Rexine)', 'Cotton Fabric', 'Linen', 'Suede', 'Jacquard', 'Chenille'];
const UPHOLSTERY_COLORS = ['Navy Blue', 'Black', 'Beige', 'Grey', 'Brown', 'Maroon', 'White', 'Mustard Yellow'];

const MultiSelectField = ({ options, selectedValues, onChange, label, placeholder, customLabel }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (showDropdown) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown]);

  const hasOther = selectedValues.some(v => !options.includes(v));
  const otherValue = selectedValues.find(v => !options.includes(v)) || '';

  const toggleOption = (opt) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(v => v !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
  };

  const toggleOther = () => {
    if (hasOther) {
      onChange(selectedValues.filter(v => options.includes(v)));
      setCustomInput('');
    } else {
      // Just select it virtually, the actual value will be typed in the text input
      onChange([...selectedValues, 'Other (please specify)']);
    }
  };

  const handleCustomInputChange = (e) => {
    const val = e.target.value;
    setCustomInput(val);
    const newVals = selectedValues.filter(v => options.includes(v));
    if (val.trim()) {
      newVals.push(val);
    } else {
      newVals.push('Other (please specify)'); // keep the 'Other' state active but empty
    }
    onChange(newVals);
  };

  return (
    <div className="relative w-full" ref={triggerRef}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{label}</label>
      <div 
        onClick={() => setShowDropdown(!showDropdown)}
        className="min-h-[46px] w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer flex flex-wrap gap-2 items-center hover:border-primary transition-colors"
      >
        {selectedValues.length === 0 ? (
          <span className="text-slate-400 text-sm ml-1">{placeholder}</span>
        ) : (
          selectedValues.map((val, idx) => {
            const isCustom = !options.includes(val) && val !== 'Other (please specify)';
            const displayVal = val === 'Other (please specify)' ? 'Other' : val;
            return (
              <span key={idx} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
                {displayVal}
                <button type="button" onClick={(e) => { e.stopPropagation(); if(val==='Other (please specify)' || isCustom) toggleOther(); else toggleOption(val); }} className="hover:text-blue-600 dark:hover:text-blue-200 transition-colors">
                  <X size={14} />
                </button>
              </span>
            );
          })
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {showDropdown && (
            <div 
              ref={dropdownRef} 
              className="absolute z-[9999]" 
              style={{ top: dropdownCoords.top + 8, left: dropdownCoords.left, width: dropdownCoords.width }}
            >
              <motion.div 
                initial={{ opacity: 0, y: -8, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-2xl ring-1 ring-black/5 max-h-64 overflow-y-auto"
                style={{ scrollbarWidth: 'thin' }}
              >
                {options.map(opt => (
                  <div 
                    key={opt} 
                    onClick={() => toggleOption(opt)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <input type="checkbox" checked={selectedValues.includes(opt)} readOnly className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary/20" />
                    <span className={selectedValues.includes(opt) ? 'text-primary dark:text-primary-light font-semibold' : ''}>{opt}</span>
                  </div>
                ))}
                <div 
                  onClick={toggleOther}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 transition-colors"
                >
                  <input type="checkbox" checked={hasOther} readOnly className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary/20" />
                  <span className={hasOther ? 'text-primary dark:text-primary-light font-semibold' : ''}>Other (please specify)</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {hasOther && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">{customLabel} *</label>
          <input 
            required 
            autoFocus 
            value={otherValue === 'Other (please specify)' ? '' : otherValue} 
            onChange={handleCustomInputChange} 
            placeholder="Enter custom items (comma-separated)" 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
          />
        </div>
      )}
    </div>
  );
};

const AccordionSection = ({ title, icon: Icon, expanded, onToggle, children, sectionRef }) => (
  <motion.div 
    ref={sectionRef}
    initial={false}
    animate={{ backgroundColor: expanded ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0)' }}
    className="card-premium relative mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl"
  >
    <button 
      type="button"
      onClick={onToggle} 
      className={`w-full flex items-center justify-between p-5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${expanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl text-white shadow-md bg-gradient-to-br transition-all duration-300 ${expanded ? 'from-blue-500 to-indigo-600' : 'from-slate-400 to-slate-500 dark:from-slate-700 dark:to-slate-800'}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
      </div>
      <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
        <ChevronDown className="text-slate-400" />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={{
            open: { opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } },
            collapsed: { opacity: 0, height: 0, overflow: "hidden" }
          }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
        >
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const WorkflowCards = ({ refs, activeStep }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => refs.specificationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') refs.specificationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg ${activeStep === 1 ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10' : 'border-slate-200 dark:border-slate-800'}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30 transition-transform ${activeStep === 1 ? 'scale-110' : ''}`}>
        <FileText size={20} />
      </div>
      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">1. Specification</h4>
      <p className="text-xs text-slate-500 font-medium">Define structure & dimensions</p>
    </motion.div>
    
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => refs.materialsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') refs.materialsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg ${activeStep === 2 ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30 transition-transform ${activeStep === 2 ? 'scale-110' : ''}`}>
        <Package size={20} />
      </div>
      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">2. Materials</h4>
      <p className="text-xs text-slate-500 font-medium">Allocate BOM from inventory</p>
    </motion.div>
    
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => refs.productionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') refs.productionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg ${activeStep === 3 ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-orange-500/10' : 'border-slate-200 dark:border-slate-800'}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-colors"></div>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-orange-500/30 transition-transform ${activeStep === 3 ? 'scale-110' : ''}`}>
        <Hammer size={20} />
      </div>
      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">3. Production</h4>
      <p className="text-xs text-slate-500 font-medium">Assembly & finishing stages</p>
    </motion.div>
    
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => refs.deliveryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') refs.deliveryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg ${activeStep === 4 ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10' : 'border-slate-200 dark:border-slate-800'}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors"></div>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30 transition-transform ${activeStep === 4 ? 'scale-110' : ''}`}>
        <Truck size={20} />
      </div>
      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">4. Delivery</h4>
      <p className="text-xs text-slate-500 font-medium">Logistics & installation</p>
    </motion.div>
  </div>
);

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    furniture: true,
    dimensions: false,
    materials: false,
    hardware: false,
    upholstery: false,
    pricing: false,
    delivery: false,
    attachments: false,
    notes: false,
    orderMaterials: true
  });

  const [customers, setCustomers] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [orderMaterials, setOrderMaterials] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const { globalError, fieldErrors, handleError, clearErrors, setFieldErrors } = useFormErrors();
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    customerId: '',
    furnitureCategory: '',
    furnitureName: '',
    quantity: 1,
    length: '',
    width: '',
    height: '',
    measurementUnit: 'Inches',
    woodMaterial: '',
    finishType: '',
    hardwareDetails: [],
    upholsteryRequired: false,
    upholsteryMaterial: '',
    upholsteryColor: '',
    polishColor: '',
    glassRequired: false,
    glassType: '',
    accessories: [],
    estimatedPrice: '',
    advanceAmount: '',
    balanceAmount: '',
    expectedDeliveryDate: '',
    deliveryAddress: '',
    specialInstructions: '',
    orderStatus: 'Pending',
    priority: 'Medium'
  });

  const [files, setFiles] = useState({
    designImage: null,
    referenceDrawing: null
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomItem, setIsCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState('');

  const [isCustomFabric, setIsCustomFabric] = useState(false);
  const [customFabric, setCustomFabric] = useState('');
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState('');

  const specificationRef = useRef(null);
  const materialsRef = useRef(null);
  const productionRef = useRef(null);
  const deliveryRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === specificationRef.current) setActiveStep(1);
            if (entry.target === materialsRef.current) setActiveStep(2);
            if (entry.target === productionRef.current) setActiveStep(3);
            if (entry.target === deliveryRef.current) setActiveStep(4);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-100px 0px -20% 0px" }
    );

    if (specificationRef.current) observer.observe(specificationRef.current);
    if (materialsRef.current) observer.observe(materialsRef.current);
    if (productionRef.current) observer.observe(productionRef.current);
    if (deliveryRef.current) observer.observe(deliveryRef.current);

    return () => observer.disconnect();
  }, []);

  const fetchInitialData = async () => {
    try {
      const custRes = await getCustomers({ limit: 100, status: 'Active' });
      setCustomers(custRes.data || []);
      const matRes = await getMaterials({ limit: 1000 });
      setMaterialsList(matRes.data || []);

      if (isEdit) {
        const data = await getOrderById(id);
        const dateStr = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString().split('T')[0] : '';
        
        // Handle custom category
        let isCatCustom = false;
        let finalCat = data.furnitureCategory || '';
        if (finalCat && !CATEGORIES.includes(finalCat)) {
          isCatCustom = true;
          setCustomCategory(finalCat);
          finalCat = 'Other';
        }

        // Handle custom item
        let isItemCustom = false;
        let finalItem = data.furnitureName || '';
        const possibleItems = isCatCustom ? [] : (ITEM_MAP[finalCat] || []);
        if (finalItem && !possibleItems.includes(finalItem)) {
          isItemCustom = true;
          setCustomItem(finalItem);
          finalItem = 'Other';
        }

        // Handle custom upholstery
        let isFabricCustom = false;
        let finalFabric = data.upholsteryMaterial || '';
        if (finalFabric && !UPHOLSTERY_FABRICS.includes(finalFabric)) {
          isFabricCustom = true;
          setCustomFabric(finalFabric);
          finalFabric = 'Other';
        }

        let isColorCustom = false;
        let finalColor = data.upholsteryColor || '';
        if (finalColor && !UPHOLSTERY_COLORS.includes(finalColor)) {
          isColorCustom = true;
          setCustomColor(finalColor);
          finalColor = 'Other';
        }

        setIsCustomCategory(isCatCustom);
        setIsCustomItem(isItemCustom);
        setIsCustomFabric(isFabricCustom);
        setIsCustomColor(isColorCustom);

        setFormData({
          ...data,
          furnitureCategory: finalCat,
          furnitureName: finalItem,
          upholsteryMaterial: finalFabric,
          upholsteryColor: finalColor,
          expectedDeliveryDate: dateStr,
          length: data.length || '',
          width: data.width || '',
          height: data.height || '',
          estimatedPrice: data.estimatedPrice || '',
          advanceAmount: data.advanceAmount || '',
          balanceAmount: data.balanceAmount || '',
        });
        if (data.orderMaterials) {
          setOrderMaterials(data.orderMaterials.map(om => ({
            materialId: om.materialId,
            quantityRequired: om.quantityRequired
          })));
        }
      }
    } catch (err) {
      showToast('Failed to fetch data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles({ ...files, [name]: selectedFiles[0] });
    }
  };

  const calculateBalance = () => {
    const est = parseFloat(formData.estimatedPrice) || 0;
    const adv = parseFloat(formData.advanceAmount) || 0;
    setFormData(prev => ({ ...prev, balanceAmount: est - adv }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    
    // Validation for "Other" text fields
    if (isCustomCategory && !customCategory.trim()) {
      showToast('Please specify the custom category.', 'error');
      return;
    }
    if (isCustomItem && !customItem.trim()) {
      showToast('Please specify the custom item name.', 'error');
      return;
    }

    const hasOtherHardware = formData.hardwareDetails.some(v => !HARDWARE_OPTIONS.includes(v));
    const otherHardwareValue = formData.hardwareDetails.find(v => !HARDWARE_OPTIONS.includes(v)) || '';
    if (hasOtherHardware && !otherHardwareValue.trim() && otherHardwareValue !== 'Other (please specify)') {
      showToast('Please specify the custom hardware details.', 'error');
      return;
    }

    const hasOtherAccessory = formData.accessories.some(v => !ACCESSORY_OPTIONS.includes(v));
    const otherAccessoryValue = formData.accessories.find(v => !ACCESSORY_OPTIONS.includes(v)) || '';
    if (hasOtherAccessory && !otherAccessoryValue.trim() && otherAccessoryValue !== 'Other (please specify)') {
      showToast('Please specify the custom accessories.', 'error');
      return;
    }

    if (formData.upholsteryRequired) {
      if (isCustomFabric && !customFabric.trim()) {
        showToast('Please specify the fabric/leather material.', 'error');
        return;
      }
      if (isCustomColor && !customColor.trim()) {
        showToast('Please specify the upholstery color/shade.', 'error');
        return;
      }
    }

    setSubmitting(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        // Map custom values if "Other" is selected
        let finalValue = formData[key];
        if (key === 'furnitureCategory' && isCustomCategory) finalValue = customCategory.trim();
        if (key === 'furnitureName' && isCustomItem) finalValue = customItem.trim();
        if (key === 'upholsteryMaterial' && isCustomFabric) finalValue = customFabric.trim();
        if (key === 'upholsteryColor' && isCustomColor) finalValue = customColor.trim();
        
        // Remove empty 'Other (please specify)' placeholders
        if (key === 'hardwareDetails') {
          finalValue = finalValue.filter(v => v !== 'Other (please specify)' && v.trim() !== '');
          submissionData.append(key, JSON.stringify(finalValue));
        } else if (key === 'accessories') {
          finalValue = finalValue.filter(v => v !== 'Other (please specify)' && v.trim() !== '');
          submissionData.append(key, JSON.stringify(finalValue));
        } else {
          submissionData.append(key, finalValue);
        }
      }
    });
    submissionData.append('orderMaterials', JSON.stringify(orderMaterials));

    if (files.designImage) submissionData.append('designImage', files.designImage);
    if (files.referenceDrawing) submissionData.append('referenceDrawing', files.referenceDrawing);

    try {
      if (isEdit) {
        await updateOrder(id, submissionData);
        showToast('Order updated successfully!');
      } else {
        await createOrder(submissionData);
        showToast('Order created successfully!');
      }
      setTimeout(() => navigate('/orders'), 1500);
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto space-y-6 relative pb-20"
    >
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold border flex items-center gap-2 transition-all duration-300
          ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}
        `}>
          {toast.type === 'error' && <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 p-8 sm:p-10 text-white shadow-2xl shadow-indigo-500/20 mb-8 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5 md:gap-6">
            <button onClick={() => navigate('/orders')} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all mt-1 border border-white/10 shrink-0">
              <ArrowLeft size={22} className="text-white" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 drop-shadow-md">
                {isEdit ? 'Edit Order Specification' : 'New Order Specification'}
              </h1>
              <p className="text-indigo-100 text-base md:text-lg font-medium max-w-xl leading-relaxed">
                Define the requirements, materials, and production timeline for this custom furniture order.
              </p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 font-extrabold rounded-2xl shadow-xl hover:shadow-2xl transition-all shrink-0 text-lg md:text-xl md:w-auto w-full group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="group-hover:scale-110 transition-transform" />}
            {isEdit ? 'Save Changes' : 'Create Order'}
          </motion.button>
        </div>
      </div>
      
      <WorkflowCards refs={{ specificationRef, materialsRef, productionRef, deliveryRef }} activeStep={activeStep} />

      <form onSubmit={handleSubmit} className="space-y-2">
        
        <FormAlert error={globalError} onClose={clearErrors} />

        {/* 1. Customer Info */}
        <AccordionSection title="Customer Information" icon={User} expanded={expandedSections.customer} onToggle={() => toggleSection('customer')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Select Customer *</label>
              <select required name="customerId" value={formData.customerId} onChange={handleChange} className={`input-field bg-white dark:bg-slate-900 ${fieldErrors.customerId ? 'border-red-500 focus:ring-red-500/20' : ''}`}>
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.phone}) - {c.customerCode}</option>
                ))}
              </select>
              {fieldErrors.customerId && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.customerId}</p>}
            </div>
          </div>
        </AccordionSection>

        {/* 2. Furniture Info */}
        <AccordionSection sectionRef={specificationRef} title="Furniture Information" icon={Package} expanded={expandedSections.furniture} onToggle={() => toggleSection('furniture')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Category *</label>
              <select required name="furnitureCategory" value={formData.furnitureCategory} onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, furnitureCategory: val, furnitureName: '' }));
                if (val === 'Other') {
                  setIsCustomCategory(true);
                  setCustomCategory('');
                } else {
                  setIsCustomCategory(false);
                  setCustomCategory('');
                }
                setIsCustomItem(false);
                setCustomItem('');
              }} className="input-field bg-white dark:bg-slate-900">
                <option value="">-- Select Category --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other (please specify)</option>
              </select>
              {isCustomCategory && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Specify Category *</label>
                  <input required autoFocus value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter custom category" className="input-field" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Item Name *</label>
              <select required name="furnitureName" value={formData.furnitureName} onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({...prev, furnitureName: val}));
                if (val === 'Other') {
                  setIsCustomItem(true);
                  setCustomItem('');
                } else {
                  setIsCustomItem(false);
                  setCustomItem('');
                }
              }} disabled={!formData.furnitureCategory} className="input-field bg-white dark:bg-slate-900 disabled:opacity-50">
                <option value="">{formData.furnitureCategory ? '-- Select Item --' : 'Select a category first'}</option>
                {(isCustomCategory ? [] : (ITEM_MAP[formData.furnitureCategory] || [])).map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
                {formData.furnitureCategory && <option value="Other">Other (please specify)</option>}
              </select>
              {isCustomItem && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Specify Item Name *</label>
                  <input required autoFocus value={customItem} onChange={(e) => setCustomItem(e.target.value)} placeholder="Enter custom item name" className="input-field" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Quantity *</label>
              <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="input-field bg-white dark:bg-slate-900">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        {/* 3. Dimensions */}
        <AccordionSection title="Dimensions" icon={Ruler} expanded={expandedSections.dimensions} onToggle={() => toggleSection('dimensions')}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Length</label>
              <input type="number" step="0.01" name="length" value={formData.length} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Width / Depth</label>
              <input type="number" step="0.01" name="width" value={formData.width} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Height</label>
              <input type="number" step="0.01" name="height" value={formData.height} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Unit</label>
              <select name="measurementUnit" value={formData.measurementUnit} onChange={handleChange} className="input-field bg-white dark:bg-slate-900">
                <option value="Inches">Inches</option>
                <option value="Feet">Feet</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        {/* 4. Required Materials (Inventory Integration) */}
        <AccordionSection sectionRef={materialsRef} title="Required Materials (BOM)" icon={Package} expanded={expandedSections.orderMaterials} onToggle={() => toggleSection('orderMaterials')}>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Add materials required to produce this order. Stock availability will be checked.</p>
              <button type="button" onClick={() => setOrderMaterials([...orderMaterials, { materialId: '', quantityRequired: '' }])} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                <Plus size={16} /> Add Material
              </button>
            </div>
            {orderMaterials.map((om, index) => {
              const selectedMat = materialsList.find(m => m.id === om.materialId);
              const isLowStock = selectedMat && parseFloat(om.quantityRequired || 0) > selectedMat.availableStock;
              return (
                <div key={index} className="flex gap-4 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Material</label>
                    <select
                      required
                      value={om.materialId}
                      onChange={(e) => {
                        const newOm = [...orderMaterials];
                        newOm[index].materialId = e.target.value;
                        setOrderMaterials(newOm);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary sm:text-sm"
                    >
                      <option value="">-- Select --</option>
                      {materialsList.map(m => (
                        <option key={m.id} value={m.id}>{m.materialCode} - {m.materialName} (Stock: {m.availableStock} {m.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Qty Required</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={om.quantityRequired}
                      onChange={(e) => {
                        const newOm = [...orderMaterials];
                        newOm[index].quantityRequired = e.target.value;
                        setOrderMaterials(newOm);
                      }}
                      className="input-field"
                    />
                  </div>
                  <div className="pt-6">
                    <button type="button" onClick={() => {
                      const newOm = [...orderMaterials];
                      newOm.splice(index, 1);
                      setOrderMaterials(newOm);
                    }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {isLowStock && (
                    <div className="w-full flex items-center gap-1 text-xs text-red-600 font-medium col-span-3 mt-1">
                      <AlertTriangle size={14} /> Insufficient stock. Only {selectedMat.availableStock} {selectedMat.unit} available.
                    </div>
                  )}
                </div>
              );
            })}
            {orderMaterials.length === 0 && (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                No materials added. Click "Add Material" to list required materials.
              </div>
            )}
          </div>
        </AccordionSection>

        {/* 5. Materials & Finish */}
        <AccordionSection title="Material Details & Finish" icon={Hammer} expanded={expandedSections.materials} onToggle={() => toggleSection('materials')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Wood / Base Material</label>
              <input name="woodMaterial" value={formData.woodMaterial} onChange={handleChange} placeholder="e.g. Teak Wood, Plywood" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Finish Type & Polish Color</label>
              <div className="flex gap-2">
                <input name="finishType" value={formData.finishType} onChange={handleChange} placeholder="e.g. PU, Melamine" className="input-field" />
                <input name="polishColor" value={formData.polishColor} onChange={handleChange} placeholder="e.g. Walnut" className="input-field" />
              </div>
            </div>
            <div className="flex items-center gap-4 border p-4 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="glassRequired" checked={formData.glassRequired} onChange={handleChange} className="w-4 h-4 text-primary rounded focus:ring-primary" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Glass Work Required</span>
              </label>
              {formData.glassRequired && (
                <input name="glassType" value={formData.glassType} onChange={handleChange} placeholder="Glass Type (e.g. 12mm Toughened)" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary sm:text-sm" />
              )}
            </div>
          </div>
        </AccordionSection>

        {/* 5. Hardware */}
        <AccordionSection sectionRef={productionRef} title="Hardware & Accessories" icon={Settings} expanded={expandedSections.hardware} onToggle={() => toggleSection('hardware')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <MultiSelectField 
                label="Hardware Details"
                placeholder="Select hardware..."
                customLabel="Specify Other Hardware"
                options={HARDWARE_OPTIONS}
                selectedValues={formData.hardwareDetails}
                onChange={(vals) => setFormData(prev => ({...prev, hardwareDetails: vals}))}
              />
            </div>
            <div>
              <MultiSelectField 
                label="Other Accessories"
                placeholder="Select accessories..."
                customLabel="Specify Other Accessories"
                options={ACCESSORY_OPTIONS}
                selectedValues={formData.accessories}
                onChange={(vals) => setFormData(prev => ({...prev, accessories: vals}))}
              />
            </div>
          </div>
        </AccordionSection>

        {/* 6. Upholstery */}
        <AccordionSection title="Upholstery Details" icon={Scissors} expanded={expandedSections.upholstery} onToggle={() => toggleSection('upholstery')}>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" name="upholsteryRequired" checked={formData.upholsteryRequired} onChange={handleChange} className="w-4 h-4 text-primary rounded focus:ring-primary" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Requires Upholstery</span>
            </label>
            {formData.upholsteryRequired && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Material Fabric/Leather</label>
                  <select 
                    required 
                    name="upholsteryMaterial" 
                    value={formData.upholsteryMaterial} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, upholsteryMaterial: val }));
                      if (val === 'Other') {
                        setIsCustomFabric(true);
                        setCustomFabric('');
                      } else {
                        setIsCustomFabric(false);
                        setCustomFabric('');
                      }
                    }} 
                    className="input-field bg-white dark:bg-slate-900"
                  >
                    <option value="">-- Select Material --</option>
                    {UPHOLSTERY_FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
                    <option value="Other">Other (please specify)</option>
                  </select>
                  {isCustomFabric && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Specify Fabric/Leather *</label>
                      <input required autoFocus value={customFabric} onChange={(e) => setCustomFabric(e.target.value)} placeholder="e.g. Canvas" className="input-field" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Color / Shade Code</label>
                  <select 
                    required 
                    name="upholsteryColor" 
                    value={formData.upholsteryColor} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, upholsteryColor: val }));
                      if (val === 'Other') {
                        setIsCustomColor(true);
                        setCustomColor('');
                      } else {
                        setIsCustomColor(false);
                        setCustomColor('');
                      }
                    }} 
                    className="input-field bg-white dark:bg-slate-900"
                  >
                    <option value="">-- Select Color --</option>
                    {UPHOLSTERY_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Other">Other (please specify)</option>
                  </select>
                  {isCustomColor && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Specify Color/Shade Code *</label>
                      <input required autoFocus value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="e.g. Navy Blue (#34)" className="input-field" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* 7. Pricing */}
        <AccordionSection title="Pricing & Payment" icon={IndianRupee} expanded={expandedSections.pricing} onToggle={() => toggleSection('pricing')}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Estimated Total Price</label>
              <input type="number" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleChange} onBlur={calculateBalance} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Advance Received</label>
              <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} onBlur={calculateBalance} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Balance Pending</label>
              <input readOnly type="number" name="balanceAmount" value={formData.balanceAmount} className="input-field bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold" />
            </div>
          </div>
        </AccordionSection>

        {/* 8. Delivery */}
        <AccordionSection sectionRef={deliveryRef} title="Delivery Information" icon={Truck} expanded={expandedSections.delivery} onToggle={() => toggleSection('delivery')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Expected Delivery Date</label>
              <DatePicker 
                selected={formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate + 'T00:00:00') : null}
                onChange={(date) => handleChange({ target: { name: 'expectedDeliveryDate', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Delivery Address (If different from Customer)</label>
              <textarea name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} rows={2} className="input-field" />
            </div>
          </div>
        </AccordionSection>

        {/* 9. Attachments */}
        <AccordionSection title="Design & Reference Images" icon={Paperclip} expanded={expandedSections.attachments} onToggle={() => toggleSection('attachments')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 dark:bg-slate-950 transition-colors">
              <Paperclip className="mx-auto text-slate-400 mb-2" />
              <label className="block text-sm font-medium text-primary cursor-pointer">
                Upload Design Image
                <input type="file" name="designImage" onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{files.designImage?.name || 'No file chosen'}</p>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 dark:bg-slate-950 transition-colors">
              <Paperclip className="mx-auto text-slate-400 mb-2" />
              <label className="block text-sm font-medium text-primary cursor-pointer">
                Upload Reference Drawing
                <input type="file" name="referenceDrawing" onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{files.referenceDrawing?.name || 'No file chosen'}</p>
            </div>
          </div>
        </AccordionSection>

        {/* 10. Notes */}
        <AccordionSection title="Special Instructions" icon={FileText} expanded={expandedSections.notes} onToggle={() => toggleSection('notes')}>
          <textarea name="specialInstructions" value={formData.specialInstructions} onChange={handleChange} rows={4} placeholder="Any specific requirements, site restrictions, or customizations..." className="input-field" />
        </AccordionSection>

        <div className="flex justify-end pt-4 pb-8">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-2xl shadow-xl hover:shadow-2xl transition-all text-lg min-w-[250px] group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="group-hover:scale-110 transition-transform" />}
            {isEdit ? 'Save Changes' : 'Save'}
          </motion.button>
        </div>

      </form>
    </motion.div>
  );
};

export default OrderForm;

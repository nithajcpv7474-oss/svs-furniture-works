import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getHomeRoute } from '../utils/roleUtils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, Loader2, Lock, Mail, Shield, BarChart3, Users, 
  PackageSearch, Truck, PieChart, BellRing, CheckCircle2, ChevronRight,
  ClipboardList
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Forgot-password modal
───────────────────────────────────────────────────────────── */
const ForgotPasswordModal = ({ onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm rounded-3xl p-8"
        style={{ 
          background: '#081222', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
            <Lock size={22} className="text-blue-400" />
          </div>
          <h2 className="text-white font-bold text-xl">Password Reset</h2>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Password resets are securely managed by your <span className="text-slate-200 font-medium">System Administrator</span>. Please contact them directly to request a reset link.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all bg-slate-800 text-white hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          >
            Understood
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main Login Page
───────────────────────────────────────────────────────────── */
const ROLES = [
  { id: 'Admin', icon: Shield, label: 'Admin', desc: 'Full System Access', color: '#3B82F6' },
  { id: 'Manager', icon: BarChart3, label: 'Management', desc: 'Business Monitoring', color: '#8B5CF6' },
  { id: 'Staff', icon: Users, label: 'Staff', desc: 'Daily Operations', color: '#F97316' }
];

const FEATURES = [
  { icon: ClipboardList, label: 'Order Management', color: '#3B82F6' },
  { icon: PackageSearch, label: 'Inventory Control', color: '#8B5CF6' },
  { icon: CheckCircle2, label: 'Production Tracking', color: '#10B981' },
  { icon: Truck, label: 'Delivery Management', color: '#F97316' },
  { icon: PieChart, label: 'Reports & Analytics', color: '#EC4899' },
  { icon: BellRing, label: 'Alerts & Notifications', color: '#06B6D4' }
];

const STATS = [
  { value: '500+', label: 'Happy Clients' },
  { value: '2000+', label: 'Orders Completed' },
  { value: '1500+', label: 'Products Delivered' },
  { value: '98%', label: 'Customer Satisfaction' }
];

const Login = () => {
  const { login, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const emailRef = useRef(null);

  const [selectedRole, setSelectedRole] = useState('Admin');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [errors, setErrors] = useState({
    email: '', password: '', role: '', general: ''
  });

  // Redirect if logged in
  useEffect(() => {
    if (user) navigate(getHomeRoute(user.role), { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'SVS ERP | Enterprise Login';
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '', general: '' }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', role: '', general: '' });
    
    let hasError = false;
    let newErrors = {};

    if (!formData.email) { newErrors.email = 'Please enter your email address.'; hasError = true; }
    else if (!validateEmail(formData.email)) { newErrors.email = 'Please enter a valid email address.'; hasError = true; }
    if (!formData.password) { newErrors.password = 'Please enter your password.'; hasError = true; }

    if (hasError) return setErrors(prev => ({ ...prev, ...newErrors }));

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      const actualRole = result?.role;

      let isRoleValid = false;
      if (selectedRole === 'Admin' && actualRole === 'Admin') isRoleValid = true;
      else if (selectedRole === 'Manager' && ['Management', 'Manager'].includes(actualRole)) isRoleValid = true;
      else if (selectedRole === 'Staff' && ['Sales Staff', 'Production Staff', 'Delivery Staff', 'Staff'].includes(actualRole)) isRoleValid = true;

      if (!isRoleValid) {
        await logout();
        setFormData(prev => ({ ...prev, password: '' }));
        setErrors(prev => ({ ...prev, role: `This account does not have ${ROLES.find(r=>r.id===selectedRole).label} access. Select correct role.` }));
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${result.fullName.split(' ')[0]}! Redirecting...`, {
        style: { background: '#081222', color: '#fff', border: '1px solid #3B82F6' },
        iconTheme: { primary: '#3B82F6', secondary: '#fff' }
      });
      navigate(getHomeRoute(actualRole), { replace: true });
      
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setErrors(prev => ({ ...prev, password: 'Incorrect password. Please try again.' }));
      else if (status === 404) setErrors(prev => ({ ...prev, email: 'No account found with this email address.' }));
      else if (status === 403) setErrors(prev => ({ ...prev, role: 'Your account has been deactivated. Contact the Admin.' }));
      else if (!err.response) setErrors(prev => ({ ...prev, general: 'Cannot connect to server. Check your connection.' }));
      else setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again in a moment.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const getSubtitle = () => {
    if (selectedRole === 'Admin') return "Sign in to manage the entire SVS Furniture system";
    if (selectedRole === 'Manager') return "Sign in to view reports and oversee operations";
    return "Sign in to manage your tasks and assignments";
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-[#030712] flex flex-col md:flex-row text-white font-sans selection:bg-blue-500/30">
      
      {/* LEFT SECTION (55%) */}
      <div className="hidden md:flex w-[55%] relative flex-col justify-between p-12 lg:p-16 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618220179428-22790b46a011?q=80&w=2000&auto=format&fit=crop" 
            alt="Luxury Furniture" 
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-[#030712]/80 to-blue-900/40 z-10"></div>
        </div>

        {/* Top Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-[18px] bg-transparent shadow-[0_0_25px_rgba(59,130,246,0.3)] flex items-center justify-center border border-white/10">
              <img src="/logo.png" alt="SVS Furniture Works Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-slate-200">SVS Furniture Works</h1>
          </div>
          
          <h2 className="text-sm font-semibold tracking-[0.2em] text-slate-400 uppercase mb-4">
            Order Specification Sheet System
          </h2>
          
          <h3 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400">
              Smart Furniture.<br/>Seamless Operations.
            </span>
          </h3>
          
          <p className="text-lg text-slate-300 max-w-xl leading-relaxed mb-12">
            Complete ERP solution for custom furniture manufacturing, order management, production tracking, inventory, delivery, and business analytics.
          </p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div 
                  key={feat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                  whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  className="bg-[#081222]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex flex-col gap-3 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ background: `${feat.color}15`, border: `1px solid ${feat.color}30`, boxShadow: `0 0 15px ${feat.color}20` }}>
                    <Icon size={20} color={feat.color} />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">{feat.label}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <div className="relative z-20 grid grid-cols-2 xl:grid-cols-4 gap-4 mt-12">
          {STATS.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + (i * 0.1) }}
              className="bg-[#081222]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl"
            >
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 + (i * 0.1), type: 'spring' }}
                className="text-3xl font-bold text-white mb-1"
              >
                {stat.value}
              </motion.div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT SECTION (45% on desktop, 100% on mobile) */}
      <div className="w-full md:w-[45%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[#030712]">
        
        {/* Subtle background glows for the right side */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"></div>

        {/* Login Container */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-[#081222]/80 backdrop-blur-[25px] border border-white/10 rounded-[28px] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(59,130,246,0.1)] relative z-10"
        >
          {/* Logo Mobile Only */}
          <div className="md:hidden flex items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-[18px] bg-transparent shadow-[0_0_25px_rgba(59,130,246,0.3)] flex items-center justify-center border border-white/10">
              <img src="/logo.png" alt="SVS Furniture Works Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
            <AnimatePresence mode="wait">
              <motion.p 
                key={selectedRole}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-[#94A3B8]"
              >
                {getSubtitle()}
              </motion.p>
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* ROLE SELECTION */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">Sign in as</p>
              <div className="flex gap-3 justify-center">
                {ROLES.map(role => {
                  const isSelected = selectedRole === role.id;
                  const Icon = role.icon;
                  return (
                    <motion.button
                      key={role.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => { setSelectedRole(role.id); setErrors(p => ({...p, role: ''})); }}
                      whileHover={!isLoading && !isSelected ? { scale: 1.02 } : {}}
                      whileTap={!isLoading ? { scale: 0.98 } : {}}
                      className="relative flex-1 flex flex-col items-center justify-center py-4 rounded-2xl overflow-hidden transition-all duration-300"
                      style={{
                        background: isSelected ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? `1px solid ${role.color}` : '1px solid rgba(255,255,255,0.05)',
                        opacity: isLoading ? 0.5 : 1
                      }}
                    >
                      {isSelected && (
                        <motion.div 
                          layoutId="roleGlow"
                          className="absolute inset-0 opacity-20"
                          style={{ background: `radial-gradient(circle at 50% 0%, ${role.color}, transparent 70%)` }}
                        />
                      )}
                      <Icon size={24} className="mb-2 relative z-10" style={{ color: isSelected ? role.color : '#64748B' }} />
                      <span className="text-xs font-bold relative z-10" style={{ color: isSelected ? '#fff' : '#94A3B8' }}>{role.label}</span>
                      {isSelected && <span className="text-[9px] text-slate-300 mt-1 absolute bottom-1.5 opacity-80">{role.desc}</span>}
                    </motion.button>
                  )
                })}
              </div>
              <AnimatePresence>
                {errors.role && (
                  <motion.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="text-red-400 text-xs text-center font-medium mt-2">
                    {errors.role}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* EMAIL FIELD */}
            <div className="space-y-1 relative group">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 ml-1 transition-colors group-focus-within:text-blue-400">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  disabled={isLoading}
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  placeholder="Enter your email address"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-red-400 text-xs font-medium ml-1">
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-1 relative group">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 ml-1 transition-colors group-focus-within:text-purple-400">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-red-400 text-xs font-medium ml-1">
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* OPTIONS */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isLoading}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 focus:ring-blue-500/30 focus:ring-offset-0 text-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Remember Me</span>
              </label>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowForgot(true)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* GENERAL ERROR */}
            <AnimatePresence>
              {errors.general && (
                <motion.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="text-red-400 text-xs text-center font-medium">
                  {errors.general}
                </motion.p>
              )}
            </AnimatePresence>

            {/* SUBMIT BUTTON */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.01 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              className="w-full relative group overflow-hidden rounded-xl py-3.5 mt-4"
              style={{
                background: isLoading ? 'rgba(59,130,246,0.3)' : 'linear-gradient(to right, #3B82F6, #8B5CF6, #06B6D4)',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {!isLoading && (
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              )}
              <div className="relative z-10 flex items-center justify-center gap-2 text-white font-bold text-sm tracking-wide">
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                  `Sign in as ${ROLES.find(r=>r.id===selectedRole).label}`
                )}
              </div>
            </motion.button>
          </form>

          {/* SECURITY FOOTER */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Shield size={14} className="text-teal-400" />
              <span className="text-xs font-semibold tracking-widest uppercase">Secure • Reliable • Enterprise</span>
            </div>
            <p className="text-[10px] text-slate-500 max-w-xs">
              Your data is protected using enterprise-grade authentication and encrypted communication.
            </p>
          </div>

        </motion.div>
      </div>

      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Login;

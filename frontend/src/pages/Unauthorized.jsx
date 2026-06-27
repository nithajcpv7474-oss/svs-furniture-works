import React, { useContext } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { getHomeRoute } from '../utils/roleUtils';

const Unauthorized = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine home route based on role (uses the same logic as post-login redirect)
  const homeRoute = getHomeRoute(user.role);

  const attemptedModule = location.state?.module || 'this module';
  const reason = location.state?.reason === 'view-only' 
    ? 'You only have view access for this resource. Write operations are restricted.' 
    : 'Your current role does not have permission to view this page.';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-teal-900/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 overflow-hidden text-center"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
        
        <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Access Denied</h1>
        <p className="text-slate-400 mb-6">
          {reason}
        </p>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-8 text-left space-y-3">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
            <span className="text-slate-400 text-sm font-medium">Your Role</span>
            <span className="text-white font-medium bg-slate-800 px-3 py-1 rounded-md text-sm border border-slate-700">
              {user.role}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm font-medium">Attempted Resource</span>
            <span className="text-slate-300 font-mono text-sm capitalize">
              {attemptedModule}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate(homeRoute)}
          className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 overflow-hidden"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Go to my Dashboard</span>
        </button>
      </motion.div>
    </div>
  );
};

export default Unauthorized;

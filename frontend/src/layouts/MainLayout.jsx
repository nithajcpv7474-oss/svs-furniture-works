import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Package, Archive, Hammer, Truck,
  BarChart2, Settings, LogOut, Menu, X, ChevronDown, UserCog,
  Search, Calendar, History, Sun, Moon, Key, Bell
} from 'lucide-react';
import NotificationBell from '../components/ui/NotificationBell';
import { ChangePasswordModal } from '../components/ui/ChangePasswordModal';
import { PERMISSIONS } from '../config/permissions';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const rawNavGroups = [
    {
      title: 'CORE',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
        { name: 'Customers', path: '/customers', icon: Users, module: 'customers' },
        { name: 'Orders', path: '/orders', icon: Package, module: 'orders' },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Inventory', path: '/inventory', icon: Archive, module: 'inventory' },
        { name: 'Production', path: '/production', icon: Hammer, module: 'production' },
        { name: 'Delivery', path: '/delivery', icon: Truck, module: 'delivery' },
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { name: 'Reports', path: '/reports', icon: BarChart2, module: 'reports' },
        { name: 'Audit Trail', path: '/reports/audit', icon: History, module: 'reports' }
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { name: 'User Management', path: '/users', icon: UserCog, module: 'userManagement' },
      ]
    }
  ];

  const userPermissions = user?.role ? (PERMISSIONS[user.role] || {}) : {};

  const navGroups = rawNavGroups.map(group => ({
    ...group,
    items: group.items.filter(item => userPermissions[item.module] && userPermissions[item.module] !== 'none')
  })).filter(group => group.items.length > 0);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  const getBreadcrumbs = () => {
    if (location.pathname === '/reports/audit') return 'Security Audit Logs';
    const paths = location.pathname.split('/').filter(p => p);
    if (paths.length === 0) return 'Dashboard Overview';
    return paths.map(p => {
      if (p.length === 36 && p.split('-').length === 5) {
        return document.title && document.title !== 'Vite + React' && document.title !== 'SVS Furniture ERP'
          ? document.title : 'Details';
      }
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' / ');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] font-sans overflow-hidden text-slate-800 dark:text-[#F8FAFC]">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-40 md:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Premium Glassmorphism Navy */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 80,
          x: mobileMenuOpen ? 0 : (window.innerWidth < 768 ? -280 : 0)
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed md:static inset-y-0 left-0 z-50 bg-gradient-to-b from-[#0B1120] to-[#020617]
          border-r border-white/[0.04] flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)] md:shadow-none
          ${mobileMenuOpen ? 'w-[280px]' : ''}
        `}
      >
        {/* Logo Area */}
        <div className={`flex flex-col items-center justify-center relative transition-all duration-300 border-b border-white/[0.04] ${sidebarOpen ? 'py-8 px-4 min-h-[160px]' : 'py-6 px-2 min-h-[100px]'}`}>
          <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
          <div className="relative z-10 flex items-center justify-center cursor-pointer w-full" onClick={() => navigate('/')}>
            {sidebarOpen ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)] group hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all">
                  <img src="/logo.png?v=2" alt="SVS" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-center">
                  <h1 className="text-[15px] font-black tracking-wider text-white drop-shadow-md">SVS FURNITURE WORKS</h1>
                  <p className="text-[9px] font-bold text-blue-400/80 tracking-widest uppercase mt-0.5">Order Specification Sheet System</p>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <img src="/logo.png?v=2" alt="SVS" className="w-8 h-8 object-contain" />
              </div>
            )}
          </div>
          <button className="md:hidden absolute top-4 right-4 bg-white/5 p-2 rounded-full text-slate-400 hover:text-white transition-colors z-20" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto px-4 custom-scrollbar space-y-8">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {sidebarOpen && (
                <p className="px-3 mb-3 text-[11px] font-black tracking-[0.2em] text-slate-500/80 uppercase">
                  {group.title}
                </p>
              )}
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const allPaths = navGroups.flatMap(g => g.items.map(i => i.path));
                  const bestMatch = allPaths.filter(p => location.pathname === p || location.pathname.startsWith(p + '/')).sort((a, b) => b.length - a.length)[0] || '/';
                  const isActive = item.path === bestMatch || (item.path === '/' && location.pathname === '/');
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className="relative block"
                      title={!sidebarOpen ? item.name : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      <motion.div
                        whileHover={!isActive ? { x: 4, backgroundColor: 'rgba(255,255,255,0.03)' } : {}}
                        className={`
                          flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_4px_20px_rgba(59,130,246,0.4)]' 
                            : 'text-slate-400 hover:text-slate-100 font-medium'}
                          ${!sidebarOpen && 'justify-center px-0'}
                        `}
                      >
                        <item.icon size={20} className={`shrink-0 ${isActive ? 'drop-shadow-md text-white' : 'text-slate-400'}`} />
                        {sidebarOpen && (
                          <span className="whitespace-nowrap flex-1 text-sm tracking-wide">
                            {item.name}
                          </span>
                        )}
                      </motion.div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 bg-gradient-to-t from-[#020617] to-transparent border-t border-white/[0.04]">
          <div 
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className={`
              flex items-center gap-3 p-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] 
              hover:bg-white/[0.06] cursor-pointer transition-all duration-300 group
              ${!sidebarOpen && 'justify-center'}
            `}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-[#F8FAFC] truncate group-hover:text-blue-400 transition-colors">{user?.fullName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate">{user?.role}</p>
                </div>
              </div>
            )}
            {sidebarOpen && (
              <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#020617] relative">
        
        {/* Top Navbar - Glassmorphism */}
        <header className="h-[76px] bg-white/60 dark:bg-[#0F172A]/60 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/[0.04] sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/10 md:hidden transition-colors"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/10 hidden md:block transition-colors"
            >
              <Menu size={20} />
            </button>
            
            {/* Breadcrumb / Title */}
            <div className="hidden sm:flex flex-col">
              <h2 className="text-xl font-black text-slate-800 dark:text-[#F8FAFC] tracking-tight">{getBreadcrumbs()}</h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-semibold mt-0.5 tracking-wide flex items-center gap-1.5">
                <Calendar size={12} className="text-blue-500" /> {currentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Premium Search */}
            <div className="hidden lg:flex items-center relative group">
              <Search className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-[#020617] border border-transparent dark:border-white/[0.04] focus:bg-white dark:focus:bg-[#0F172A] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-full text-sm font-medium text-slate-800 dark:text-slate-100 transition-all outline-none w-48 focus:w-80 shadow-inner"
              />
            </div>
            
            <button className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-white/10 lg:hidden transition-colors">
              <Search size={20} />
            </button>

            {/* Notification Bell (Animated) */}
            <div className="relative group cursor-pointer">
              <div className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
                <NotificationBell />
              </div>
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full animate-ping opacity-75"></span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></span>
            </div>

            {/* Settings */}
            <button 
              onClick={() => navigate('/settings')}
              className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Dropdown Positioning */}
            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-6 top-[70px] w-64 bg-white dark:bg-[#0F172A] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/10 z-50 py-2 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#020617]/50">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user?.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button onClick={() => { setProfileDropdownOpen(false); navigate('/settings'); }} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-500 flex items-center gap-3 transition-colors">
                      <Settings size={18} /> Account Settings
                    </button>
                    <button onClick={() => { setProfileDropdownOpen(false); setPasswordModalOpen(true); }} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-500 flex items-center gap-3 transition-colors">
                      <Key size={18} /> Change Password
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-white/5 my-2"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 transition-colors">
                      <LogOut size={18} /> Sign Out Securely
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-screen-2xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      
      <ChangePasswordModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;

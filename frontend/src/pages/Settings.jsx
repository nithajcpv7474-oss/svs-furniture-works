import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { getSettings, updateSettings } from '../services/setting.service';
import api from '../services/api';
import { Loader2, Save, Building2, Bell, AlertTriangle, Monitor, Download } from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  const [settings, setSettings] = useState(null);
  const [preferences, setPreferences] = useState({
    themePreference: 'light',
    autoClearAlerts: true,
    autoClearDays: 7,
    notificationPreferences: {
      LOW_STOCK: true,
      DELAYED_PRODUCTION: true,
      LATE_DELIVERY: true,
      NEW_ORDER: true,
      COMPLETED_ORDER: true,
      SYSTEM: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const sysSettings = await getSettings();
        setSettings(sysSettings);
      }
      
      // Fetch user preferences
      const meRes = await api.get('/auth/me');
      const meData = meRes.data.data || meRes.data;
      if (meData) {
        setPreferences({
          themePreference: meData.themePreference || 'light',
          autoClearAlerts: meData.autoClearAlerts ?? true,
          autoClearDays: meData.autoClearDays ?? 7,
          notificationPreferences: meData.notificationPreferences || {
            LOW_STOCK: true,
            DELAYED_PRODUCTION: true,
            LATE_DELIVERY: true,
            NEW_ORDER: true,
            COMPLETED_ORDER: true,
            SYSTEM: true
          }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (settings.logoFile) {
        const formData = new FormData();
        Object.keys(settings).forEach(key => {
          if (key !== 'logoFile') formData.append(key, settings[key]);
        });
        formData.append('companyLogo', settings.logoFile);
        await api.put('/settings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await updateSettings(settings);
      }
      showToast('System settings updated successfully.');
      fetchData(); // reload to get the new image URL
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/me/preferences', preferences);
      showToast('Personal preferences updated successfully.');
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Define tabs based on role
  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Monitor, adminOnly: false },
    { id: 'notifications', label: 'Notification Preferences', icon: Bell, adminOnly: false },
    { id: 'company', label: 'Company Profile', icon: Building2, adminOnly: true },
    { id: 'alerts', label: 'Alert Thresholds', icon: AlertTriangle, adminOnly: true },
    { id: 'export', label: 'Data & Export', icon: Download, adminOnly: true },
  ].filter(t => !t.adminOnly || isAdmin);

  // If current tab isn't allowed, switch to a valid one
  if (isAdmin && !tabs.find(t => t.id === activeTab)) setActiveTab('company');
  if (!isAdmin && tabs.find(t => t.id === activeTab)?.adminOnly) setActiveTab('appearance');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage global application configurations and personal preferences.</p>
      </div>

      {successMsg && (
        <div className="bg-success/10 border border-success/30 text-success-dark dark:text-success px-4 py-3 rounded-xl text-sm font-bold flex items-center animate-in fade-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

      <div className="card-premium overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-200 dark:border-slate-800">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-72 bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-1">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'opacity-70'} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 bg-white dark:bg-slate-950">
          
          {/* ================= APPEARANCE (ALL ROLES) ================= */}
          {activeTab === 'appearance' && (
            <form onSubmit={handleSavePreferences} className="space-y-6 animate-in fade-in h-full flex flex-col">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">Appearance</h2>
                
                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Theme Preference</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPreferences({...preferences, themePreference: 'light'});
                          if (theme !== 'light') toggleTheme();
                        }}
                        className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${preferences.themePreference === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                      >
                        Light Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreferences({...preferences, themePreference: 'dark'});
                          if (theme !== 'dark') toggleTheme();
                        }}
                        className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${preferences.themePreference === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                      >
                        Dark Mode
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">This preference overrides the global setting and syncs across your devices. The accent color is tied to the Walnut & Amber brand theme.</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Appearance
                </button>
              </div>
            </form>
          )}

          {/* ================= NOTIFICATION PREFERENCES (ALL ROLES) ================= */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSavePreferences} className="space-y-6 animate-in fade-in h-full flex flex-col">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Alert Categories</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Choose which alerts appear in your notification bell.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(preferences.notificationPreferences || {}).map(key => (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                            checked={preferences.notificationPreferences[key]}
                            onChange={(e) => setPreferences({
                              ...preferences, 
                              notificationPreferences: {
                                ...preferences.notificationPreferences,
                                [key]: e.target.checked
                              }
                            })}
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {key.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Inbox Maintenance</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                          checked={preferences.autoClearAlerts}
                          onChange={(e) => setPreferences({...preferences, autoClearAlerts: e.target.checked})}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-clear resolved/read alerts</span>
                      </label>
                      
                      {preferences.autoClearAlerts && (
                        <div className="pl-7 flex items-center gap-3">
                          <span className="text-sm text-slate-500">After</span>
                          <input 
                            type="number" 
                            min="1" 
                            max="30" 
                            className="input-field w-20 py-1" 
                            value={preferences.autoClearDays}
                            onChange={(e) => setPreferences({...preferences, autoClearDays: parseInt(e.target.value) || 7})}
                          />
                          <span className="text-sm text-slate-500">days</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Notifications
                </button>
              </div>
            </form>
          )}

          {/* ================= COMPANY PROFILE (ADMIN) ================= */}
          {activeTab === 'company' && isAdmin && (
            <form onSubmit={handleSaveSystemSettings} className="space-y-6 animate-in fade-in h-full flex flex-col">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">Company Profile</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                      {settings?.companyLogo ? (
                        <img src={`http://localhost:5000/uploads/${settings.companyLogo}`} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-white" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                          <Building2 size={24} />
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSettings({ ...settings, logoFile: file });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Company Name</label>
                    <input value={settings?.companyName || ''} onChange={e => setSettings({...settings, companyName: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">GSTIN / Tax ID</label>
                    <input value={settings?.gstin || ''} onChange={e => setSettings({...settings, gstin: e.target.value})} className="input-field" placeholder="27XXXXX1234X1Z5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Official Email</label>
                    <input type="email" value={settings?.companyEmail || ''} onChange={e => setSettings({...settings, companyEmail: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Contact Phone</label>
                    <input value={settings?.companyPhone || ''} onChange={e => setSettings({...settings, companyPhone: e.target.value})} className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Registered Address</label>
                    <textarea rows="3" value={settings?.companyAddress || ''} onChange={e => setSettings({...settings, companyAddress: e.target.value})} className="input-field"></textarea>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center">These details appear on exported reports and invoices.</p>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Company Profile
                </button>
              </div>
            </form>
          )}

          {/* ================= ALERT THRESHOLDS (ADMIN) ================= */}
          {activeTab === 'alerts' && isAdmin && (
            <form onSubmit={handleSaveSystemSettings} className="space-y-6 animate-in fade-in h-full flex flex-col">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">Alert Thresholds</h2>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-4">
                        <label className="font-bold text-slate-800 dark:text-slate-200">Low Stock Alert</label>
                        <input type="checkbox" className="toggle-checkbox" checked={settings?.enableLowStockAlerts ?? true} onChange={e => setSettings({...settings, enableLowStockAlerts: e.target.checked})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 uppercase font-bold">Global Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={settings?.lowStockThreshold || 10} onChange={e => setSettings({...settings, lowStockThreshold: parseInt(e.target.value)})} className="input-field w-24" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">units</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-4">
                        <label className="font-bold text-slate-800 dark:text-slate-200">Delivery Overdue</label>
                        <input type="checkbox" className="toggle-checkbox" checked={settings?.enableDeliveryAlerts ?? true} onChange={e => setSettings({...settings, enableDeliveryAlerts: e.target.checked})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 uppercase font-bold">Grace Period</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={settings?.deliveryOverdueGraceHours || 24} onChange={e => setSettings({...settings, deliveryOverdueGraceHours: parseInt(e.target.value)})} className="input-field w-24" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">hours</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-4">
                        <label className="font-bold text-slate-800 dark:text-slate-200">Production Delay</label>
                        <input type="checkbox" className="toggle-checkbox" checked={settings?.enableProductionAlerts ?? true} onChange={e => setSettings({...settings, enableProductionAlerts: e.target.checked})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 uppercase font-bold">Grace Period</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={settings?.productionDelayGraceHours || 24} onChange={e => setSettings({...settings, productionDelayGraceHours: parseInt(e.target.value)})} className="input-field w-24" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">hours</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200">Specification Incomplete</label>
                          <p className="text-xs text-slate-500 mt-1">Alert when order is confirmed without specs</p>
                        </div>
                        <input type="checkbox" className="toggle-checkbox" checked={settings?.enableSpecificationAlerts ?? true} onChange={e => setSettings({...settings, enableSpecificationAlerts: e.target.checked})} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Thresholds
                </button>
              </div>
            </form>
          )}

          {/* ================= DATA & EXPORT (ADMIN) ================= */}
          {activeTab === 'export' && isAdmin && (
            <form onSubmit={handleSaveSystemSettings} className="space-y-6 animate-in fade-in h-full flex flex-col">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">Data & Export Preferences</h2>
                
                <div className="max-w-md space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Default Export Format</label>
                    <select value={settings?.defaultExportFormat || 'PDF'} onChange={e => setSettings({...settings, defaultExportFormat: e.target.value})} className="input-field">
                      <option value="PDF">PDF (.pdf)</option>
                      <option value="EXCEL">Excel (.xlsx)</option>
                      <option value="CSV">CSV (.csv)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Date Format</label>
                    <select value={settings?.dateFormat || 'DD/MM/YYYY'} onChange={e => setSettings({...settings, dateFormat: e.target.value})} className="input-field">
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Currency Display</label>
                    <select value={settings?.currency || 'INR'} onChange={e => setSettings({...settings, currency: e.target.value})} className="input-field">
                      <option value="INR">INR (₹)</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-2">The system is configured for single-currency operations. Changing this only affects the display label.</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Export Settings
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;

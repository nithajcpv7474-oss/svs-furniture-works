import React, { useState, useEffect, useContext } from 'react';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../services/user.service';
import { AuthContext } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { FormAlert } from '../components/ui/FormAlert';
import { useFormErrors } from '../hooks/useFormErrors';
import { UserPlus, Edit2, ShieldOff, Loader2, CheckCircle, XCircle, AlertTriangle, Key, Shield } from 'lucide-react';
import { PERMISSIONS } from '../config/permissions';

const ROLES = [
  { id: 'Admin', label: 'Admin', color: 'bg-slate-700 text-slate-100' },
  { id: 'Management', label: 'Management', color: 'bg-slate-600 text-slate-100' },
  { id: 'Sales Staff', label: 'Sales Staff', color: 'bg-slate-500 text-slate-100' },
  { id: 'Production Staff', label: 'Production Staff', color: 'bg-slate-400 text-slate-900' },
  { id: 'Delivery Staff', label: 'Delivery Staff', color: 'bg-slate-300 text-slate-800' }
];

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'customers', label: 'Customers' },
  { key: 'orders', label: 'Orders' },
  { key: 'specificationSheets', label: 'Specification Sheets' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'production', label: 'Production' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'reports', label: 'Reports' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'userManagement', label: 'User Management' }
];

  const getRoleBadge = (roleId) => {
  const role = ROLES.find(r => r.id === roleId);
  return role ? (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${role.color}`}>
      {role.label}
    </span>
  ) : <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-200 text-slate-700">{roleId}</span>;
};

const getPermissionBadge = (access) => {
  if (access === 'full') return <span className="flex justify-center"><CheckCircle size={16} className="text-emerald-500" title="Full Access"/></span>;
  if (access === 'view') return <span className="flex justify-center"><Shield size={16} className="text-blue-400" title="View Only"/></span>;
  return <span className="flex justify-center"><XCircle size={16} className="text-slate-300" title="No Access"/></span>;
};

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'permissions'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, fullName: '', email: '', phone: '', role: 'SalesStaff', department: '', isActive: true, forcePasswordChange: true 
  });
  const [saving, setSaving] = useState(false);
  const { globalError, fieldErrors, handleError, clearErrors, setFieldErrors } = useFormErrors();
  
  const [disableConfirmId, setDisableConfirmId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.phone || formData.phone.length !== 10) {
      setFieldErrors({ phone: "Phone number must contain exactly 10 digits." });
      return;
    }
    clearErrors();

    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.id) {
        // Generate random temp password
        payload.password = Math.random().toString(36).slice(-8) + 'A1!';
      }
      
      if (payload.id) {
        await updateUser(payload.id, payload);
      } else {
        await createUser(payload);
        alert(`User created! Temporary Password: ${payload.password}\nPlease share this securely with the user.`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setFormData({ 
      id: user.id, 
      fullName: user.fullName, 
      email: user.email, 
      phone: user.phone || '', 
      role: user.role, 
      department: user.department || '', 
      isActive: user.isActive,
      forcePasswordChange: user.forcePasswordChange !== false
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const handleResetPassword = async (user) => {
    const confirmReset = window.confirm(`Generate a new temporary password for ${user.fullName}?`);
    if (!confirmReset) return;
    
    try {
      const response = await resetUserPassword(user.id);
      alert(`Password reset! New Temporary Password: ${response.tempPassword}`);
      fetchUsers();
    } catch(err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDisable = async () => {
    if (!disableConfirmId) return;
    try {
      await deleteUser(disableConfirmId);
      setDisableConfirmId(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert('Failed to disable user.');
      setDisableConfirmId(null);
    }
  };

  const openNewUserModal = () => {
    setFormData({ id: null, fullName: '', email: '', phone: '', role: 'SalesStaff', department: '', isActive: true, forcePasswordChange: true });
    clearErrors();
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesStatus = statusFilter === '' ? true : statusFilter === 'active' ? u.isActive : !u.isActive;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns = [
    {
      header: 'User',
      accessor: 'fullName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700 shrink-0">
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{row.fullName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role & Dept',
      accessor: 'role',
      render: (row) => (
        <div>
          <div className="mb-1">{getRoleBadge(row.role)}</div>
          {row.department && <p className="text-[10px] text-slate-400 uppercase tracking-wider">{row.department}</p>}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        row.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#e3f2ed] text-[#2e7d62] font-medium text-xs border border-[#bce3d6]"><CheckCircle size={12}/> Active</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-500 font-medium text-xs border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"><XCircle size={12}/> Inactive</span>
        )
      )
    },
    {
      header: 'Activity',
      accessor: 'lastLogin',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-400">Last Login:</span> {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Added: {new Date(row.createdAt).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => {
        const canResetPassword = !(currentUser?.role === 'Management' && ['Admin', 'Management'].includes(row.role));
        
        return (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Edit User"><Edit2 size={16}/></button>
            
            {canResetPassword ? (
              <button onClick={() => handleResetPassword(row)} className="p-1.5 text-slate-400 hover:text-warning transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Reset Password"><Key size={16}/></button>
            ) : (
              <button disabled className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed rounded-lg" title="Only an Admin can reset another Admin or Management user's password"><Key size={16}/></button>
            )}

            {row.isActive && row.role !== 'Admin' && (
              <button onClick={() => setDisableConfirmId(row.id)} className="p-1.5 text-slate-400 hover:text-danger transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 ml-1" title="Deactivate User"><ShieldOff size={16}/></button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-premium p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage employee access, roles, and system permissions.</p>
        </div>
        <button onClick={openNewUserModal} className="btn-primary flex items-center gap-2 px-5">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          System Users
        </button>
        <button 
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'permissions' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          Permissions Matrix
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field max-w-sm"
            />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field max-w-[200px] bg-white dark:bg-slate-900">
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[150px] bg-white dark:bg-slate-900">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="card-premium overflow-hidden border-none shadow-none">
            <DataTable 
              columns={columns}
              data={filteredUsers}
              isLoading={loading}
              keyField="id"
              emptyMessage="No users found matching your filters."
            />
          </div>
        </div>
      ) : (
        <div className="card-premium overflow-x-auto">
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Role Access Matrix</h3>
            <p className="text-sm text-slate-500 mt-1">Read-only overview of system permissions mapped by role.</p>
            <div className="flex items-center gap-6 mt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500"/> Full Access</span>
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-400"/> View Only</span>
              <span className="flex items-center gap-1.5"><XCircle size={14} className="text-slate-300"/> No Access</span>
            </div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold w-48">Role</th>
                {MODULES.map(m => <th key={m.key} className="px-4 py-4 font-semibold text-center whitespace-nowrap">{m.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ROLES.map(role => (
                <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(role.id)}</td>
                  {MODULES.map(m => (
                    <td key={m.key} className="px-4 py-4 text-center">
                      {getPermissionBadge(PERMISSIONS[role.id]?.[m.key] || 'none')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? 'Edit User Details' : 'Add New User'}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {formData.id ? 'Save Changes' : 'Create User'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5 py-2">
          
          <FormAlert error={globalError} onClose={clearErrors} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input required value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className={`input-field ${fieldErrors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} placeholder="John Doe"/>
              {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className={`input-field ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} placeholder="john@svs.com"/>
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Phone Number <span className="text-red-500">*</span></label>
              <input 
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                value={formData.phone} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({...formData, phone: value});
                }} 
                className={`input-field ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500/30' : ''}`} 
                placeholder="9876543210"
              />
              {fieldErrors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Department</label>
              <input value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="input-field" placeholder="e.g. B2B Sales"/>
            </div>
          </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">System Role <span className="text-red-500">*</span></label>
              <select required value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className={`input-field bg-white dark:bg-slate-900 ${fieldErrors.role ? 'border-red-500' : ''}`}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              {fieldErrors.role && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.role}</p>}
            </div>

          {!formData.id && (
            <div className="p-4 bg-warning-light dark:bg-warning/10 border border-warning/20 rounded-xl mt-4">
              <p className="text-sm font-medium text-warning-dark dark:text-warning flex items-start gap-2">
                <Key size={18} className="shrink-0 mt-0.5" />
                A secure temporary password will be automatically generated and displayed upon creation.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 mt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.isActive ? 'bg-success' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
              <input type="checkbox" className="hidden" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">Account is Active</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Can log into the system</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.forcePasswordChange ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${formData.forcePasswordChange ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
              <input type="checkbox" className="hidden" checked={formData.forcePasswordChange} onChange={e => setFormData({...formData, forcePasswordChange: e.target.checked})} />
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">Force Password Change</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">User must change password on next login</p>
              </div>
            </label>
          </div>

        </form>
      </Modal>

      {/* Disable Confirmation Modal */}
      <Modal 
        isOpen={!!disableConfirmId} 
        onClose={() => setDisableConfirmId(null)}
        title="Deactivate User Account"
        footer={
          <>
            <button onClick={() => setDisableConfirmId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDisable} className="btn-danger shadow-md shadow-red-500/20">Deactivate User</button>
          </>
        }
      >
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full bg-danger-light dark:bg-danger/10 flex items-center justify-center mb-6 border border-danger/20">
            <AlertTriangle className="text-danger w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Deactivate Account?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400 max-w-sm">
            This will immediately revoke system access for this user. Their history and audit trail will remain intact.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default UserManagement;

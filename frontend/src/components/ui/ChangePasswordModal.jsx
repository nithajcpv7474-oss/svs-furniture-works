import React, { useState } from 'react';
import { Modal } from './Modal';
import { Loader2, Key } from 'lucide-react';
import api from '../../services/api';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.post('/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess('Password updated successfully');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      footer={
        <>
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className="btn-primary flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Update Password
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <Key size={16} />
            {success}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
            Current Password
          </label>
          <input
            type="password"
            required
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            className="input-field"
            placeholder="••••••••"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
            New Password
          </label>
          <input
            type="password"
            required
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="input-field"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="input-field"
            placeholder="••••••••"
          />
        </div>
      </form>
    </Modal>
  );
};

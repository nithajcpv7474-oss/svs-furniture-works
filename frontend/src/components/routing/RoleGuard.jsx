import React, { useEffect, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const RoleGuard = ({ module, requireAccess = 'view', children }) => {
  const { user, loading } = useContext(AuthContext);
  const permission = usePermission(module);
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (permission === 'none') {
        toast.error(`You do not have permission to access the ${module} module.`);
      } else if (requireAccess === 'full' && permission === 'view') {
        toast.error(`You have view-only access. Full access to ${module} is required.`);
      }
    }
  }, [permission, requireAccess, module, loading, user]);

  if (loading) {
    return null; // Or a spinner if preferred
  }

  // If not authenticated, let ProtectedRoute handle it, but if it leaks here, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Deny completely if no access
  if (permission === 'none') {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname, module }} />;
  }

  // Deny if full access is required but user only has view access
  if (requireAccess === 'full' && permission !== 'full') {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname, module, reason: 'view-only' }} />;
  }

  return children;
};

export default RoleGuard;

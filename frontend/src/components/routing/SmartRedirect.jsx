import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHomeRoute } from '../../utils/roleUtils';

/**
 * SmartRedirect — placed on the "/" route.
 * Reads the authenticated user's role and redirects to
 * the first module they have access to, per the permissions matrix.
 * This prevents Production/Delivery Staff from hitting the
 * Dashboard RoleGuard and bouncing to /unauthorized on first load.
 */
const SmartRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const target = getHomeRoute(user.role);

  // If the target IS the dashboard, render normally via Navigate
  // (Dashboard is handled by its own RoleGuard on that route)
  return <Navigate to={target} replace />;
};

export default SmartRedirect;

import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        themePreference: true,
        notificationPreferences: true,
        autoClearAlerts: true,
        autoClearDays: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found or deleted' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact an administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    // Pass to global error handler for standardized TokenExpiredError/JsonWebTokenError
    next(error);
  }
};

import { PERMISSIONS } from '../config/permissions.js';

const resolveModuleFromPath = (path) => {
  if (path.includes('/customers')) return 'customers';
  if (path.includes('/orders')) return 'orders';
  if (path.includes('/specifications')) return 'specificationSheets';
  if (path.includes('/inventory')) return 'inventory';
  if (path.includes('/production')) return 'production';
  if (path.includes('/delivery')) return 'delivery';
  if (path.includes('/reports')) return 'reports';
  if (path.includes('/alerts')) return 'alerts';
  if (path.includes('/users') || path.includes('/auth/register')) return 'userManagement';
  return null;
};

export const requireRole = (allowedRoles) => (req, res, next) => {
  const role = req.user?.role; // from verified JWT only
  const roleAlias = role === 'Manager' ? 'Management' : (role === 'Staff' ? 'Sales Staff' : role);

  if (!role || (!allowedRoles.includes(role) && !allowedRoles.includes(roleAlias))) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource.'
    });
  }

  // Block write operations for view-only roles
  const moduleKey = resolveModuleFromPath(req.originalUrl);
  if (moduleKey) {
    const permission = PERMISSIONS[roleAlias]?.[moduleKey];
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && permission !== 'full') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You have view-only access. Write operations are not permitted.'
      });
    }
  }

  next();
};

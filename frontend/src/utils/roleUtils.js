import { PERMISSIONS } from '../config/permissions';

/**
 * Returns the first permitted route for a given role.
 * Used for post-login redirect and "Go Home" buttons.
 */
export const getHomeRoute = (role) => {
  if (!role) return '/login';

  const perms = PERMISSIONS[role];
  if (!perms) return '/login';

  // Priority-ordered list of modules → routes
  const candidates = [
    { module: 'dashboard',           path: '/dashboard' },
    { module: 'customers',           path: '/customers' },
    { module: 'orders',              path: '/orders' },
    { module: 'specificationSheets', path: '/orders' },   // no dedicated spec-sheet list page
    { module: 'production',          path: '/production' },
    { module: 'delivery',            path: '/delivery' },
    { module: 'inventory',           path: '/inventory' },
    { module: 'reports',             path: '/reports' },
    { module: 'alerts',              path: '/settings' },
  ];

  for (const { module, path } of candidates) {
    if (perms[module] && perms[module] !== 'none') {
      return path;
    }
  }

  return '/unauthorized';
};

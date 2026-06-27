import fs from 'fs';
import path from 'path';

const layoutPath = 'frontend/src/layouts/MainLayout.jsx';
let content = fs.readFileSync(layoutPath, 'utf8');

if (!content.includes('import { PERMISSIONS }')) {
  content = content.replace(
    "import { ChangePasswordModal } from '../components/ui/ChangePasswordModal';",
    "import { ChangePasswordModal } from '../components/ui/ChangePasswordModal';\nimport { PERMISSIONS } from '../config/permissions';"
  );
}

const newNavGroups = `  const rawNavGroups = [
    {
      title: 'CORE',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard' },
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

  const userPermissions = user?.role ? PERMISSIONS[user.role] : {};

  const navGroups = rawNavGroups.map(group => ({
    ...group,
    items: group.items.filter(item => userPermissions[item.module] && userPermissions[item.module] !== 'none')
  })).filter(group => group.items.length > 0);`;

const startIdx = content.indexOf('  const navGroups = [');
const endIdx = content.indexOf('  const currentDate = new Date()');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newNavGroups + '\n\n' + content.substring(endIdx);
  fs.writeFileSync(layoutPath, content);
  console.log('MainLayout updated successfully');
} else {
  console.error('Could not find navGroups boundaries');
}

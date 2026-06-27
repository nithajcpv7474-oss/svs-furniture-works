import fs from 'fs';
import path from 'path';

const filePath = 'frontend/src/pages/UserManagement.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for PERMISSIONS
if (!content.includes('import { PERMISSIONS }')) {
  content = content.replace(
    "import { Loader2, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Shield, Key } from 'lucide-react';",
    "import { Loader2, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Shield, Key } from 'lucide-react';\nimport { PERMISSIONS } from '../config/permissions';"
  );
}

// 2. Remove the hardcoded PERMISSIONS and update MODULES
const modulesCode = `const MODULES = [
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
];`;

const startMod = content.indexOf('const MODULES = [');
const endPerms = content.indexOf('const getRoleBadge = (roleId) => {');

if (startMod !== -1 && endPerms !== -1) {
  content = content.substring(0, startMod) + modulesCode + '\n\n  ' + content.substring(endPerms);
}

// 3. Update getPermissionBadge lowercase
content = content.replace(/value === 'Full'/g, "value === 'full'");
content = content.replace(/value === 'View'/g, "value === 'view'");
content = content.replace(/value === 'None'/g, "value === 'none'");
content = content.replace(/{value}/g, "{value.charAt(0).toUpperCase() + value.slice(1)}");

// 4. Update ROLES to match new IDs
content = content.replace(/id: 'SalesStaff'/g, "id: 'Sales Staff'");
content = content.replace(/id: 'ProductionStaff'/g, "id: 'Production Staff'");
content = content.replace(/id: 'DeliveryStaff'/g, "id: 'Delivery Staff'");

// 5. Update table rendering
content = content.replace(/\{MODULES\.map\(m => <th key=\{m\} className="px-4 py-4 font-semibold text-center whitespace-nowrap">\{m\}<\/th>\)\}/g,
"{MODULES.map(m => <th key={m.key} className=\"px-4 py-4 font-semibold text-center whitespace-nowrap\">{m.label}</th>)}");

content = content.replace(/\{MODULES\.map\(m => \(/g, "{MODULES.map(m => (");
content = content.replace(/<td key=\{m\}/g, "<td key={m.key}");
content = content.replace(/PERMISSIONS\[role\.id\]\?\.\[m\] \|\| 'None'/g, "PERMISSIONS[role.id]?.[m.key] || 'none'");

fs.writeFileSync(filePath, content);
console.log('UserManagement updated successfully');

import fs from 'fs';
import path from 'path';

const routesDir = 'src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') && f !== 'auth.routes.js');

const map = {
  'customer.routes.js': ['Admin', 'Management', 'Sales Staff'],
  'order.routes.js': ['Admin', 'Management', 'Sales Staff', 'Production Staff', 'Delivery Staff'],
  'material.routes.js': ['Admin', 'Management', 'Production Staff'],
  'inventory.routes.js': ['Admin', 'Management'],
  'production.routes.js': ['Admin', 'Management', 'Production Staff'],
  'delivery.routes.js': ['Admin', 'Management', 'Delivery Staff'],
  'report.routes.js': ['Admin', 'Management'],
  'notification.routes.js': ['Admin', 'Management', 'Sales Staff', 'Production Staff', 'Delivery Staff'],
  'user.routes.js': ['Admin'],
  'dashboard.routes.js': ['Admin', 'Management', 'Sales Staff'],
  'setting.routes.js': ['Admin'],
  'audit.routes.js': ['Admin']
};

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Change import
  content = content.replace(/authorizeRoles/g, 'requireRole');

  // Define allowed roles based on map
  const roles = map[file] || ['Admin'];
  const rolesString = roles.map(r => `'${r}'`).join(', ');

  // Remove individual requireRole calls on routes
  content = content.replace(/,\s*requireRole\([^)]+\)/g, '');

  // Add router.use(requireRole) after router is defined, unless it's already there
  if (!content.includes('router.use(requireRole')) {
    content = content.replace(
      'const router = express.Router();',
      `const router = express.Router();\n\n// Apply RBAC middleware to all routes in this module\nrouter.use(requireRole([${rolesString}]));`
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}

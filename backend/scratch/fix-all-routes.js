import fs from 'fs';

// Map of route file -> which roles are allowed (from permissions matrix)
// 'view' roles can GET, but not POST/PUT/PATCH/DELETE (enforced by requireRole middleware logic)
const routeRoles = {
  'customer.routes.js':    ['Admin', 'Management', 'Sales Staff'],         // customers: full/view
  'order.routes.js':       ['Admin', 'Management', 'Sales Staff', 'Production Staff', 'Delivery Staff'], // orders: full/view
  'material.routes.js':    ['Admin', 'Management'],                         // inventory: full/view
  'inventory.routes.js':   ['Admin', 'Management'],                         // inventory: full/view
  'production.routes.js':  ['Admin', 'Management', 'Production Staff'],     // production
  'delivery.routes.js':    ['Admin', 'Management', 'Delivery Staff'],       // delivery
  'report.routes.js':      ['Admin', 'Management'],                         // reports: full
  'notification.routes.js':['Admin', 'Management', 'Sales Staff', 'Production Staff', 'Delivery Staff'], // alerts
  'audit.routes.js':       ['Admin'],
  'user.routes.js':        ['Admin'],
  'setting.routes.js':     ['Admin', 'Management'],
  'dashboard.routes.js':   ['Admin', 'Management', 'Sales Staff'],
};

const routesDir = 'backend/src/routes';

for (const [filename, allowedRoles] of Object.entries(routeRoles)) {
  const filePath = `${routesDir}/${filename}`;
  if (!fs.existsSync(filePath)) { console.log(`SKIP (not found): ${filename}`); continue; }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure both verifyToken and requireRole are imported
  if (!content.includes('verifyToken, requireRole')) {
    content = content.replace(
      /import \{ verifyToken \} from '\.\.\/middlewares\/auth\.middleware\.js';/,
      "import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';"
    );
    content = content.replace(
      /import \{ requireRole \} from '\.\.\/middlewares\/auth\.middleware\.js';/,
      "import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';"
    );
  }

  // 2. Remove ALL existing router.use(verifyToken/requireRole) lines to start clean
  content = content.replace(/router\.use\(verifyToken\);?\n?/g, '');
  content = content.replace(/router\.use\(requireRole\([^)]*\)\);?\n?/g, '');

  // 3. Inject clean middleware block after 'const router = express.Router();'
  const rolesStr = JSON.stringify(allowedRoles);
  const middlewareBlock = `\n// Auth + RBAC — applied to ALL routes in this module\nrouter.use(verifyToken);\nrouter.use(requireRole(${rolesStr}));\n`;

  content = content.replace(
    'const router = express.Router();',
    `const router = express.Router();\n${middlewareBlock}`
  );

  fs.writeFileSync(filePath, content);
  console.log(`✓ Fixed: ${filename} → roles: ${allowedRoles.join(', ')}`);
}

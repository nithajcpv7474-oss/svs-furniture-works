import fs from 'fs';
import path from 'path';

const routesDir = 'backend/src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') && f !== 'auth.routes.js');

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix imports
  if (content.includes("import { requireRole } from '../middlewares/auth.middleware.js';")) {
    content = content.replace(
      "import { requireRole } from '../middlewares/auth.middleware.js';",
      "import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';"
    );
  }
  
  if (content.includes("import { verifyToken } from '../middlewares/auth.middleware.js';")) {
    content = content.replace(
      "import { verifyToken } from '../middlewares/auth.middleware.js';",
      "import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';"
    );
  }

  // Ensure it's not duplicated like import { verifyToken, verifyToken, requireRole } 
  content = content.replace(/verifyToken,\s*verifyToken/g, 'verifyToken');
  content = content.replace(/requireRole,\s*requireRole/g, 'requireRole');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed imports in ${file}`);
}

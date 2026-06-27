import fs from 'fs';
import path from 'path';

const routesDir = 'backend/src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') && f !== 'auth.routes.js');

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // If the file uses requireRole but doesn't import it
  if (content.includes('requireRole') && !content.includes('requireRole } from')) {
    // We need to either add it to an existing auth.middleware import, or add a new import
    if (content.includes("from '../middlewares/auth.middleware.js'")) {
      content = content.replace(
        "verifyToken } from '../middlewares/auth.middleware.js'",
        "verifyToken, requireRole } from '../middlewares/auth.middleware.js'"
      );
    } else {
      content = `import { requireRole } from '../middlewares/auth.middleware.js';\n${content}`;
    }
    fs.writeFileSync(filePath, content);
    console.log(`Added requireRole import to ${file}`);
  }
}

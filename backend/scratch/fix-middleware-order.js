import fs from 'fs';
import path from 'path';

const routesDir = 'backend/src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') && f !== 'auth.routes.js');

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove individual verifyToken usages from routes
  content = content.replace(/verifyToken,\s*/g, '');

  // Remove any existing router.use(verifyToken); to prevent duplicates
  content = content.replace(/router\.use\(verifyToken\);\n?/g, '');

  // Add router.use(verifyToken); right after const router = express.Router();
  content = content.replace(
    'const router = express.Router();',
    'const router = express.Router();\n\n// Authenticate all routes\nrouter.use(verifyToken);'
  );

  fs.writeFileSync(filePath, content);
  console.log(`Fixed middleware order in ${file}`);
}

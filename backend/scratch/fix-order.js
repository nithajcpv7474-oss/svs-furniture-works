import fs from 'fs';
import path from 'path';

const routesDir = 'src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') && f !== 'auth.routes.js');

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // If requireRole is before verifyToken, swap them.
  if (content.includes('router.use(requireRole') && content.includes('router.use(verifyToken)')) {
    const requireRoleMatch = content.match(/router\.use\(requireRole\([^)]+\)\);/);
    if (requireRoleMatch) {
      const requireRoleStr = requireRoleMatch[0];
      // Remove it from current place
      content = content.replace(requireRoleStr, '');
      // Insert it after router.use(verifyToken);
      content = content.replace(
        'router.use(verifyToken);',
        `router.use(verifyToken);\n${requireRoleStr}`
      );
    }
  }

  fs.writeFileSync(filePath, content);
  console.log(`Fixed order in ${file}`);
}

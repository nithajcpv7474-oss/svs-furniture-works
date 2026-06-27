import fs from 'fs';
import path from 'path';

const pages = [
  'frontend/src/pages/customers/CustomerForm.jsx',
  'frontend/src/pages/customers/CustomerList.jsx',
  'frontend/src/pages/inventory/StockMovementLog.jsx',
  'frontend/src/pages/orders/OrderForm.jsx',
  'frontend/src/pages/reports/AuditTrail.jsx',
  'frontend/src/pages/reports/ReportsOverview.jsx',
  'frontend/src/pages/UserManagement.jsx'
];

for (const p of pages) {
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf8');

  // If AnimatePresence is used but not imported
  if (content.includes('AnimatePresence') && !content.includes('AnimatePresence } from')) {
    if (content.includes("from 'framer-motion'")) {
      content = content.replace(
        "import { motion } from 'framer-motion';",
        "import { motion, AnimatePresence } from 'framer-motion';"
      );
    } else {
      content = `import { motion, AnimatePresence } from 'framer-motion';\n${content}`;
    }
    fs.writeFileSync(p, content);
    console.log(`Fixed AnimatePresence import in ${p}`);
  }
}

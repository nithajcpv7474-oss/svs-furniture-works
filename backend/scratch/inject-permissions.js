import fs from 'fs';
import path from 'path';

const pages = [
  { file: 'frontend/src/pages/customers/CustomerList.jsx', module: 'customers' },
  { file: 'frontend/src/pages/customers/CustomerDetails.jsx', module: 'customers' },
  { file: 'frontend/src/pages/orders/OrderList.jsx', module: 'orders' },
  { file: 'frontend/src/pages/orders/OrderDetails.jsx', module: 'orders' },
  { file: 'frontend/src/pages/inventory/MaterialList.jsx', module: 'inventory' },
  { file: 'frontend/src/pages/production/ProductionList.jsx', module: 'production' },
  { file: 'frontend/src/pages/production/ProductionKanban.jsx', module: 'production' },
  { file: 'frontend/src/pages/production/ProductionDetails.jsx', module: 'production' },
  { file: 'frontend/src/pages/delivery/DeliveryList.jsx', module: 'delivery' },
  { file: 'frontend/src/pages/delivery/DeliveryDashboard.jsx', module: 'delivery' },
  { file: 'frontend/src/pages/delivery/DeliveryDetails.jsx', module: 'delivery' },
  { file: 'frontend/src/pages/delivery/VehicleManagement.jsx', module: 'delivery' }
];

for (const p of pages) {
  if (!fs.existsSync(p.file)) continue;
  let content = fs.readFileSync(p.file, 'utf8');

  // 1. Import usePermission
  if (!content.includes("import { usePermission }")) {
    content = content.replace(
      "import React,",
      "import React, { useMemo, " // just in case
    );
    content = content.replace(
      "import { useNavigate",
      "import { usePermission } from '../../hooks/usePermission';\nimport { useNavigate"
    );
    // If not found in previous replace
    if (!content.includes("usePermission")) {
      content = `import { usePermission } from '../../hooks/usePermission';\n${content}`;
    }
  }

  // 2. Inject permission hook inside the component
  const componentName = path.basename(p.file, '.jsx');
  const componentDecl = `const ${componentName} = () => {`;
  if (content.includes(componentDecl) && !content.includes(`const permission = usePermission('${p.module}');`)) {
    content = content.replace(
      componentDecl,
      `${componentDecl}\n  const permission = usePermission('${p.module}');`
    );
  }

  // 3. Hide 'Edit' buttons
  // Match standard motion.button for Edit
  content = content.replace(
    /(<motion\.button[^>]*onClick=\{\(\) => navigate\(`[^`]+edit`\)\}[^>]*>[\s\S]*?<\/motion\.button>)/g,
    `{permission === 'full' && ($1)}`
  );

  // Hide 'Delete' buttons
  content = content.replace(
    /(<motion\.button[^>]*onClick=\{\(\) => setDeleteConfirmId[^}]*\}[^>]*>[\s\S]*?<\/motion\.button>)/g,
    `{permission === 'full' && ($1)}`
  );
  
  content = content.replace(
    /(<motion\.button[^>]*onClick=\{handleDelete\}[^>]*>[\s\S]*?<\/motion\.button>)/g,
    `{permission === 'full' && ($1)}`
  );

  // Hide 'Add New' or 'Create' buttons (usually navigating to /new or opening modal)
  content = content.replace(
    /(<button[^>]*onClick=\{\(\) => navigate\([^)]+new[^)]*\)\}[^>]*>[\s\S]*?<\/button>)/g,
    `{permission === 'full' && ($1)}`
  );
  
  content = content.replace(
    /(<button[^>]*onClick=\{\(\) => setIsModalOpen\(true\)\}[^>]*>[\s\S]*?<\/button>)/g,
    `{permission === 'full' && ($1)}`
  );
  
  content = content.replace(
    /(<button[^>]*onClick=\{\(\) => setShowModal\(true\)\}[^>]*>[\s\S]*?<\/button>)/g,
    `{permission === 'full' && ($1)}`
  );

  fs.writeFileSync(p.file, content);
  console.log(`Processed ${p.file}`);
}

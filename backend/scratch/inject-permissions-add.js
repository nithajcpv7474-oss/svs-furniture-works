import fs from 'fs';

const pages = [
  'frontend/src/pages/customers/CustomerList.jsx',
  'frontend/src/pages/orders/OrderList.jsx',
  'frontend/src/pages/inventory/MaterialList.jsx',
  'frontend/src/pages/production/ProductionList.jsx',
  'frontend/src/pages/delivery/DeliveryList.jsx',
  'frontend/src/pages/delivery/DeliveryDashboard.jsx',
  'frontend/src/pages/delivery/VehicleManagement.jsx'
];

for (const file of pages) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Match motion.button for Add New
  content = content.replace(
    /(<motion\.button[^>]*onClick=\{\(\) => navigate\([^)]+new[^)]*\)\}[^>]*>[\s\S]*?<\/motion\.button>)/g,
    `{permission === 'full' && ($1)}`
  );
  
  content = content.replace(
    /(<motion\.button[^>]*onClick=\{\(\) => setIsModalOpen\(true\)\}[^>]*>[\s\S]*?<\/motion\.button>)/g,
    `{permission === 'full' && ($1)}`
  );
  
  content = content.replace(
    /(<motion\.button[^>]*onClick=\{\(\) => setShowModal\(true\)\}[^>]*>[\s\S]*?<\/motion\.button>)/g,
    `{permission === 'full' && ($1)}`
  );

  fs.writeFileSync(file, content);
  console.log(`Processed ${file} for motion.button Add New`);
}

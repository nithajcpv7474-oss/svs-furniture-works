import fs from 'fs';

const pages = [
  'frontend/src/pages/customers/CustomerList.jsx',
  'frontend/src/pages/customers/CustomerDetails.jsx',
  'frontend/src/pages/orders/OrderList.jsx',
  'frontend/src/pages/orders/OrderDetails.jsx',
  'frontend/src/pages/inventory/MaterialList.jsx',
  'frontend/src/pages/production/ProductionList.jsx',
  'frontend/src/pages/production/ProductionKanban.jsx',
  'frontend/src/pages/production/ProductionDetails.jsx',
  'frontend/src/pages/delivery/DeliveryList.jsx',
  'frontend/src/pages/delivery/DeliveryDashboard.jsx',
  'frontend/src/pages/delivery/DeliveryDetails.jsx',
  'frontend/src/pages/delivery/VehicleManagement.jsx'
];

for (const p of pages) {
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf8');

  // Fix syntax error introduced by the naive replacement
  if (content.includes("import React, { useMemo,  { ")) {
    content = content.replace("import React, { useMemo,  { ", "import React, { useMemo, ");
    fs.writeFileSync(p, content);
    console.log(`Fixed syntax error in ${p}`);
  }
}

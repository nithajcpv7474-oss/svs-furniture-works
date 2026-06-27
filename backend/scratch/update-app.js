import fs from 'fs';
import path from 'path';

const appPath = 'frontend/src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

const replacement = `
          {/* Protected Routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<RoleGuard module="dashboard"><Dashboard /></RoleGuard>} />
            <Route path="/customers" element={<RoleGuard module="customers"><CustomerList /></RoleGuard>} />
            <Route path="/customers/new" element={<RoleGuard module="customers" requireAccess="full"><CustomerForm /></RoleGuard>} />
            <Route path="/customers/:id" element={<RoleGuard module="customers"><CustomerDetails /></RoleGuard>} />
            <Route path="/customers/:id/edit" element={<RoleGuard module="customers" requireAccess="full"><CustomerForm /></RoleGuard>} />
            <Route path="/orders" element={<RoleGuard module="orders"><OrderList /></RoleGuard>} />
            <Route path="/orders/new" element={<RoleGuard module="orders" requireAccess="full"><OrderForm /></RoleGuard>} />
            <Route path="/orders/:id" element={<RoleGuard module="orders"><OrderDetails /></RoleGuard>} />
            <Route path="/orders/:id/edit" element={<RoleGuard module="orders" requireAccess="full"><OrderForm /></RoleGuard>} />
            <Route path="/inventory" element={<RoleGuard module="inventory"><MaterialList /></RoleGuard>} />
            <Route path="/inventory/materials/new" element={<RoleGuard module="inventory" requireAccess="full"><MaterialForm /></RoleGuard>} />
            <Route path="/inventory/materials/:id/edit" element={<RoleGuard module="inventory" requireAccess="full"><MaterialForm /></RoleGuard>} />
            <Route path="/inventory/stock-log" element={<RoleGuard module="inventory"><StockMovementLog /></RoleGuard>} />
            <Route path="/production" element={<RoleGuard module="production"><ProductionKanban /></RoleGuard>} />
            <Route path="/production/list" element={<RoleGuard module="production"><ProductionList /></RoleGuard>} />
            <Route path="/production/:id" element={<RoleGuard module="production"><ProductionDetails /></RoleGuard>} />
            <Route path="/delivery" element={<RoleGuard module="delivery"><DeliveryDashboard /></RoleGuard>} />
            <Route path="/delivery/list" element={<RoleGuard module="delivery"><DeliveryList /></RoleGuard>} />
            <Route path="/delivery/vehicles" element={<RoleGuard module="delivery"><VehicleManagement /></RoleGuard>} />
            <Route path="/delivery/:id" element={<RoleGuard module="delivery"><DeliveryDetails /></RoleGuard>} />
            
            <Route path="/reports" element={<RoleGuard module="reports"><ReportsOverview /></RoleGuard>} />
            <Route path="/reports/executive" element={<RoleGuard module="reports"><ExecutiveDashboard /></RoleGuard>} />
            <Route path="/reports/sales" element={<RoleGuard module="reports"><SalesReports /></RoleGuard>} />
            <Route path="/reports/customers" element={<RoleGuard module="reports"><CustomerReports /></RoleGuard>} />
            <Route path="/reports/revenue" element={<RoleGuard module="reports"><RevenueReports /></RoleGuard>} />
            <Route path="/reports/inventory" element={<RoleGuard module="reports"><InventoryReports /></RoleGuard>} />
            <Route path="/reports/materials" element={<RoleGuard module="reports"><MaterialConsumptionReports /></RoleGuard>} />
            <Route path="/reports/production" element={<RoleGuard module="reports"><ProductionReports /></RoleGuard>} />
            <Route path="/reports/delivery" element={<RoleGuard module="reports"><DeliveryReports /></RoleGuard>} />
            <Route path="/reports/audit" element={<RoleGuard module="reports"><AuditTrail /></RoleGuard>} />
            <Route path="/reports/employees" element={<RoleGuard module="reports"><EmployeeReports /></RoleGuard>} />
            <Route path="/reports/monthly" element={<RoleGuard module="reports"><MonthlyReports /></RoleGuard>} />
            <Route path="/reports/yearly" element={<RoleGuard module="reports"><YearlyReports /></RoleGuard>} />
            
            <Route path="/users" element={<RoleGuard module="userManagement" requireAccess="full"><UserManagement /></RoleGuard>} />
            <Route path="/settings" element={<RoleGuard module="alerts"><Settings /></RoleGuard>} />
            
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>
`;

const startIndex = content.indexOf('{/* Protected Routes */}');
const endIndex = content.indexOf('{/* Fallback */}');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement.trim() + '\n\n          ' + content.substring(endIndex);
  fs.writeFileSync(appPath, content);
  console.log('App.jsx updated successfully.');
} else {
  console.error('Could not find markers in App.jsx');
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/routing/ProtectedRoute';
import PublicRoute from './components/routing/PublicRoute';
import RoleGuard from './components/routing/RoleGuard';
import SmartRedirect from './components/routing/SmartRedirect';
import Unauthorized from './pages/Unauthorized';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
// Dashboard & Modules
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetails from './pages/customers/CustomerDetails';
import OrderList from './pages/orders/OrderList';
import OrderForm from './pages/orders/OrderForm';
import OrderDetails from './pages/orders/OrderDetails';
import MaterialList from './pages/inventory/MaterialList';
import MaterialForm from './pages/inventory/MaterialForm';
import StockMovementLog from './pages/inventory/StockMovementLog';
import ProductionKanban from './pages/production/ProductionKanban';
import ProductionList from './pages/production/ProductionList';
import ProductionDetails from './pages/production/ProductionDetails';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryList from './pages/delivery/DeliveryList';
import DeliveryDetails from './pages/delivery/DeliveryDetails';
import VehicleManagement from './pages/delivery/VehicleManagement';

import ReportsOverview from './pages/reports/ReportsOverview';
import ExecutiveDashboard from './pages/reports/ExecutiveDashboard';
import SalesReports from './pages/reports/SalesReports';
import CustomerReports from './pages/reports/CustomerReports';
import RevenueReports from './pages/reports/RevenueReports';
import InventoryReports from './pages/reports/InventoryReports';
import MaterialConsumptionReports from './pages/reports/MaterialConsumptionReports';
import ProductionReports from './pages/reports/ProductionReports';
import DeliveryReports from './pages/reports/DeliveryReports';
import AuditTrail from './pages/reports/AuditTrail';
import EmployeeReports from './pages/reports/EmployeeReports';
import MonthlyReports from './pages/reports/MonthlyReports';
import YearlyReports from './pages/reports/YearlyReports';

// Placeholder Pages
import { 
  Reports
} from './pages/Placeholders';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            {/* Root: smart redirect to first permitted module */}
            <Route path="/" element={<SmartRedirect />} />
            {/* Dashboard: only roles with dashboard access */}
            <Route path="/dashboard" element={<RoleGuard module="dashboard"><Dashboard /></RoleGuard>} />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

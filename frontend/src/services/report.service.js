import api from './api';

export const getDashboardCharts = async () => {
  const response = await api.get('/reports/dashboard-charts');
  return response.data;
};

export const getSalesReports = async (params) => {
  const response = await api.get('/reports/sales', { params });
  return response.data;
};

export const getInventoryReports = async () => {
  const response = await api.get('/reports/inventory');
  return response.data;
};

export const getProductionReports = async (params) => {
  const response = await api.get('/reports/production', { params });
  return response.data;
};

export const getDeliveryReports = async (params) => {
  const response = await api.get('/reports/delivery', { params });
  return response.data;
};

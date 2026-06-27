import api from './api';

export const getTransactions = async (params) => {
  const response = await api.get('/inventory/transactions', { params });
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await api.post('/inventory/transactions', data);
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await api.get('/reports/inventory');
  return response.data;
};

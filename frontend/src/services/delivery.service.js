import api from './api';

// Vehicles
export const getVehicles = async (params) => {
  const response = await api.get('/delivery/vehicles', { params });
  return response.data;
};

export const getVehicleById = async (id) => {
  const response = await api.get(`/delivery/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (data) => {
  const response = await api.post('/delivery/vehicles', data);
  return response.data;
};

export const updateVehicle = async (id, data) => {
  const response = await api.put(`/delivery/vehicles/${id}`, data);
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/delivery/vehicles/${id}`);
  return response.data;
};

// Deliveries
export const getDeliveries = async (params) => {
  const response = await api.get('/delivery', { params });
  return response.data;
};

export const getDeliveryById = async (id) => {
  const response = await api.get(`/delivery/${id}`);
  return response.data;
};

export const createDelivery = async (data) => {
  const response = await api.post('/delivery', data);
  return response.data;
};

export const updateDelivery = async (id, data, formData = null) => {
  if (formData) {
    const response = await api.put(`/delivery/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } else {
    const response = await api.put(`/delivery/${id}`, data);
    return response.data;
  }
};

export const deleteDelivery = async (id) => {
  const response = await api.delete(`/delivery/${id}`);
  return response.data;
};

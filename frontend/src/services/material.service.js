import api from './api';

export const getMaterials = async (params) => {
  const response = await api.get('/materials', { params });
  return response.data;
};

export const getMaterialById = async (id) => {
  const response = await api.get(`/materials/${id}`);
  return response.data;
};

export const createMaterial = async (formData) => {
  const response = await api.post('/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateMaterial = async (id, formData) => {
  const response = await api.put(`/materials/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteMaterial = async (id) => {
  const response = await api.delete(`/materials/${id}`);
  return response.data;
};

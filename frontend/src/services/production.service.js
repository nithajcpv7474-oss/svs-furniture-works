import api from './api';

// Jobs
export const getProductionJobs = async (params) => {
  const response = await api.get('/production', { params });
  return response.data;
};

export const getProductionJobById = async (id) => {
  const response = await api.get(`/production/${id}`);
  return response.data;
};

export const createProductionJob = async (data) => {
  const response = await api.post('/production', data);
  return response.data;
};

export const updateProductionJob = async (id, data) => {
  const response = await api.put(`/production/${id}`, data);
  return response.data;
};

export const advanceProductionStage = async (id, stage) => {
  const response = await api.put(`/production/${id}/stage`, { stage });
  return response.data;
};

export const assignProductionWorker = async (id, workerId) => {
  const response = await api.put(`/production/${id}/assign`, { workerId });
  return response.data;
};

export const deleteProductionJob = async (id) => {
  const response = await api.delete(`/production/${id}`);
  return response.data;
};

// Tasks
export const createProductionTask = async (jobId, data) => {
  const response = await api.post(`/production/${jobId}/tasks`, data);
  return response.data;
};

export const updateProductionTask = async (taskId, data) => {
  const response = await api.put(`/production/tasks/${taskId}`, data);
  return response.data;
};

export const deleteProductionTask = async (taskId) => {
  const response = await api.delete(`/production/tasks/${taskId}`);
  return response.data;
};

// Inspections
export const createQualityInspection = async (jobId, data) => {
  const response = await api.post(`/production/${jobId}/inspections`, data);
  return response.data;
};

import axios from 'axios';

const API_URL = 'http://localhost:5005/api/production';

// Helpers to get token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Jobs
export const getProductionJobs = async (params) => {
  const response = await axios.get(API_URL, { params, ...getAuthHeaders() });
  return response.data;
};

export const getProductionJobById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
  return response.data;
};

export const createProductionJob = async (data) => {
  const response = await axios.post(API_URL, data, getAuthHeaders());
  return response.data;
};

export const updateProductionJob = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
  return response.data;
};

export const advanceProductionStage = async (id, stage) => {
  const response = await axios.put(`${API_URL}/${id}/stage`, { stage }, getAuthHeaders());
  return response.data;
};

export const deleteProductionJob = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  return response.data;
};

// Tasks
export const createProductionTask = async (jobId, data) => {
  const response = await axios.post(`${API_URL}/${jobId}/tasks`, data, getAuthHeaders());
  return response.data;
};

export const updateProductionTask = async (taskId, data) => {
  const response = await axios.put(`${API_URL}/tasks/${taskId}`, data, getAuthHeaders());
  return response.data;
};

export const deleteProductionTask = async (taskId) => {
  const response = await axios.delete(`${API_URL}/tasks/${taskId}`, getAuthHeaders());
  return response.data;
};

// Inspections
export const createQualityInspection = async (jobId, data) => {
  const response = await axios.post(`${API_URL}/${jobId}/inspections`, data, getAuthHeaders());
  return response.data;
};

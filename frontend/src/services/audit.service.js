import api from './api';

export const getAuditLogs = async (params) => {
  const response = await api.get('/audit', { params });
  return response.data;
};

export const exportPdf = async (params) => {
  const response = await api.get('/audit/export/pdf', { 
    params, 
    responseType: 'blob' // Important to handle the binary stream
  });
  return response.data;
};

export const logClientExport = async (module, title) => {
  try {
    await api.post('/audit/log-export', { module, title });
  } catch (error) {
    // Non-blocking, ignore errors
    console.error('Failed to log export:', error);
  }
};

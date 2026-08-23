import api from '../utils/axiosInstance';

export const reportService = {
  createReport: async (reportData) => {
    const res = await api.post('/reports', reportData);
    return res.data;
  },
  getReports: async (params) => {
    const res = await api.get('/reports', { params });
    return res.data;
  },
  getReportById: async (id) => {
    const res = await api.get(`/reports/${id}`);
    return res.data;
  },
};

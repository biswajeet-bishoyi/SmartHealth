import api from '../utils/axiosInstance';

export const waterReportService = {
  createWaterReport: async (data) => {
    const res = await api.post('/water-reports', data);
    return res.data;
  },
  getWaterReports: async (params) => {
    const res = await api.get('/water-reports', { params });
    return res.data;
  },
};

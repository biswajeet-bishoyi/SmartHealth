import api from '../utils/axiosInstance';

export const riskService = {
  getRiskAssessments: async (params) => {
    const res = await api.get('/risk', { params });
    return res.data;
  },
  getHealthWorkerRisk: async () => {
    const res = await api.get('/health-worker/risk');
    return res.data;
  },
};

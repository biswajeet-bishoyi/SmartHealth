import api from '../utils/axiosInstance';

export const alertService = {
  getAlerts: async (params) => {
    const res = await api.get('/alerts', { params });
    return res.data;
  },
  getAlertById: async (id) => {
    const res = await api.get(`/alerts/${id}`);
    return res.data;
  },
  createAlert: async (data) => {
    const res = await api.post('/health-worker/alerts', data);
    return res.data;
  },
  verifyAlert: async (id) => {
    const res = await api.patch(`/health-worker/alerts/${id}/verify`);
    return res.data;
  },
  approveAlert: async (id) => {
    const res = await api.patch(`/admin/alerts/${id}/approve`);
    return res.data;
  },
  broadcastAlert: async (id) => {
    const res = await api.patch(`/admin/alerts/${id}/broadcast`);
    return res.data;
  },
  rejectAlert: async (id, reason) => {
    const res = await api.patch(`/admin/alerts/${id}/reject`, { reason });
    return res.data;
  },
  expireAlert: async (id) => {
    const res = await api.patch(`/admin/alerts/${id}/expire`);
    return res.data;
  },
};

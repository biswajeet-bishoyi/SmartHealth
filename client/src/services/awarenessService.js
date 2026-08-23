import api from '../utils/axiosInstance';

export const awarenessService = {
  getContent: async (params) => {
    const res = await api.get('/awareness', { params });
    return res.data;
  },
  createContent: async (data) => {
    const res = await api.post('/awareness', data);
    return res.data;
  },
  deleteContent: async (id) => {
    const res = await api.delete(`/awareness/${id}`);
    return res.data;
  },
};

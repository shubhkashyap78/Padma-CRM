import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://padma-crm-lhyf.vercel.app/api',
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('padmaCrmUser');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('padmaCrmUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

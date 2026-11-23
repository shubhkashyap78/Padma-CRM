import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
    // Expired/invalid session -> back to login. A wrong password on the login form is NOT a
    // session problem, so don't reload the page there (that used to wipe the error message).
    const isLoginCall = err.config?.url?.includes('/auth/login');
    if (err.response && err.response.status === 401 && !isLoginCall) {
      localStorage.removeItem('padmaCrmUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

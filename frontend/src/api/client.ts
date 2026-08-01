import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Inject Basic-Auth header from sessionStorage on every request */
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});

/** On 401 clear stored credentials so the login screen reappears */
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

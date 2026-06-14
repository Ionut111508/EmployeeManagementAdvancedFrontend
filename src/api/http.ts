import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use(config => {
  const token = sessionStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && !String(error?.config?.url ?? '').includes('/Auth/login')) {
      sessionStorage.removeItem('authSession');
      sessionStorage.removeItem('authToken');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const message = error?.response?.data ?? error?.message ?? 'Unexpected API error';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

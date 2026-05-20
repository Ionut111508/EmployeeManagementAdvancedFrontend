import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.response.use(
  response => response,
  error => {
    const message = error?.response?.data ?? error?.message ?? 'Unexpected API error';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

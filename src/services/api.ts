import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
// import { encryptPayload, decryptPayload } from '../utils/crypto';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adiciona JWT e ofusca payload
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Adiciona JWT token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ofusca payload em POST, PUT, PATCH
    // if (config.data && ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
    //   config.data = {
    //     payload: encryptPayload(config.data),
    //   };
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - desofusca response
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Desofusca resposta se necessário
    // if (response.data?.payload) {
    //   response.data = decryptPayload(response.data.payload);
    // }
    return response;
  },
  (error) => {
    // Trata erros de autenticação
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Let Auth0 handle this
    }
    return Promise.reject(error);
  }
);

export default api;

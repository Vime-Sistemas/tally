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

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Request interceptor - adiciona JWT e ofusca payload
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Adiciona JWT token
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
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
      authToken = null;
      // window.location.href = '/login'; // Let Auth0 handle this
    }
    return Promise.reject(error);
  }
);

export const updateUser = async (data: { name?: string; phone?: string; occupation?: string; picture?: string }) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

export default api;

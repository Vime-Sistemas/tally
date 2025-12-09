import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { Account, CreditCard } from '../types/account';
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

// ACCOUNTS API

export const getAccounts = async (): Promise<Account[]> => {
  const response = await api.get('/accounts');
  return response.data;
};

export const createAccount = async (data: Omit<Account, 'id'>): Promise<Account> => {
  const response = await api.post('/accounts', data);
  return response.data;
};

export const updateAccount = async (id: string, data: Partial<Omit<Account, 'id'>>): Promise<Account> => {
  const response = await api.put(`/accounts/${id}`, data);
  return response.data;
};

export const deleteAccount = async (id: string): Promise<void> => {
  await api.delete(`/accounts/${id}`);
};

// CARDS API

export const getCards = async (): Promise<CreditCard[]> => {
  const response = await api.get('/cards');
  return response.data;
};

export const createCard = async (data: Omit<CreditCard, 'id'>): Promise<CreditCard> => {
  const response = await api.post('/cards', data);
  return response.data;
};

export const updateCard = async (id: string, data: Partial<Omit<CreditCard, 'id'>>): Promise<CreditCard> => {
  const response = await api.put(`/cards/${id}`, data);
  return response.data;
};

export const deleteCard = async (id: string): Promise<void> => {
  await api.delete(`/cards/${id}`);
};

export default api;

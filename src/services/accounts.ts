import api from './api';
import type { Account } from '../types/account';

export const accountService = {
  getAll: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/accounts');
    return response.data;
  },

  create: async (data: Omit<Account, 'id'>): Promise<Account> => {
    const response = await api.post<Account>('/accounts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Account>): Promise<Account> => {
    const response = await api.put<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },
};

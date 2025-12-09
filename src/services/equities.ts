import api from './api';
import type { Equity, CreateEquityDTO, UpdateEquityDTO } from '../types/equity';

export const equityService = {
  // List all equities
  getAll: async (): Promise<Equity[]> => {
    const response = await api.get<Equity[]>('/equities');
    return response.data;
  },

  // Get equity by ID
  getById: async (id: string): Promise<Equity> => {
    const response = await api.get<Equity>(`/equities/${id}`);
    return response.data;
  },

  // Create new equity
  create: async (data: CreateEquityDTO): Promise<Equity> => {
    const response = await api.post<Equity>('/equities', data);
    return response.data;
  },

  // Update equity
  update: async (data: UpdateEquityDTO): Promise<Equity> => {
    const { id, ...updateData } = data;
    const response = await api.put<Equity>(`/equities/${id}`, updateData);
    return response.data;
  },

  // Delete equity
  delete: async (id: string): Promise<void> => {
    await api.delete(`/equities/${id}`);
  },
};

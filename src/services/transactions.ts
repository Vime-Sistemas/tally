import api from './api';
import type { Transaction, CreateTransactionDTO, UpdateTransactionDTO } from '../types/transaction';

export const transactionService = {
  // Listar todas as transações
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
  },

  // Buscar transação por ID
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  // Criar nova transação
  create: async (data: CreateTransactionDTO): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
  },

  // Atualizar transação
  update: async (data: UpdateTransactionDTO): Promise<Transaction> => {
    const { id, ...updateData } = data;
    const response = await api.put<Transaction>(`/transactions/${id}`, updateData);
    return response.data;
  },

  // Deletar transação
  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  // Filtrar transações por período
  getByPeriod: async (startDate: string, endDate: string): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

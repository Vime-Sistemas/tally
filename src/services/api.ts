import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { Account, CreditCard } from '../types/account';
import type { Transaction } from '../types/transaction';
import type { CreateTransactionDTO } from '../types/transaction';
import type { Goal, CreateGoalDTO, UpdateGoalDTO } from '../types/goal';
import type { Budget, CreateBudgetDTO, BudgetComparison } from '../types/budget';

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  dueDate?: string;
  creditor?: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtDTO {
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  dueDate?: string;
  creditor?: string;
  description?: string;
  status?: string;
}

// import { encryptPayload, decryptPayload } from '../utils/crypto';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
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
      // Dispatch custom event for session expiration
      window.dispatchEvent(new Event('session-expired'));
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

// TRANSACTIONS API

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get('/transactions');
  return response.data;
};

export const createTransaction = async (data: CreateTransactionDTO): Promise<Transaction> => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const confirmTransaction = async (data: CreateTransactionDTO & { confirmNegativeBalance: boolean }): Promise<Transaction> => {
  const response = await api.post('/transactions/confirm', data);
  return response.data;
};

export const updateTransaction = async (id: string, data: Partial<CreateTransactionDTO>): Promise<Transaction> => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await api.delete(`/transactions/${id}`);
};

// GOALS API

export const getGoals = async (): Promise<Goal[]> => {
  const response = await api.get('/goals');
  return response.data;
};

export const createGoal = async (data: CreateGoalDTO): Promise<Goal> => {
  const response = await api.post('/goals', data);
  return response.data;
};

export const updateGoal = async (id: string, data: UpdateGoalDTO): Promise<Goal> => {
  const response = await api.put(`/goals/${id}`, data);
  return response.data;
};

export const deleteGoal = async (id: string): Promise<void> => {
  await api.delete(`/goals/${id}`);
};

// RECURRING TRANSACTIONS API

export interface CreateRecurringTransactionDTO {
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  amount: number;
  description: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  accountId?: string | null;
  cardId?: string | null;
  destinationAccountId?: string | null;
  costCenterId?: string;
}

export const createRecurringTransaction = async (data: CreateRecurringTransactionDTO): Promise<any> => {
  const response = await api.post('/recurring-transactions', data);
  return response.data;
};

export const getRecurringTransactions = async (): Promise<any[]> => {
  const response = await api.get('/recurring-transactions');
  return response.data;
};

export const updateRecurringTransaction = async (id: string, data: Partial<CreateRecurringTransactionDTO>): Promise<any> => {
  const response = await api.put(`/recurring-transactions/${id}`, data);
  return response.data;
};

export const deleteRecurringTransaction = async (id: string): Promise<void> => {
  await api.delete(`/recurring-transactions/${id}`);
};

// BUDGETS API

export const getBudgets = async (year?: number, month?: number): Promise<Budget[]> => {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());
  
  const response = await api.get(`/budgets?${params.toString()}`);
  return response.data;
};

export const createBudget = async (data: CreateBudgetDTO): Promise<Budget> => {
  const response = await api.post('/budgets', data);
  return response.data;
};

export const updateBudget = async (id: string, data: Partial<CreateBudgetDTO>): Promise<Budget> => {
  const response = await api.put(`/budgets/${id}`, data);
  return response.data;
};

export const deleteBudget = async (id: string): Promise<void> => {
  await api.delete(`/budgets/${id}`);
};

export const getBudgetComparison = async (id: string): Promise<BudgetComparison> => {
  const response = await api.get(`/budgets/${id}/comparison`);
  return response.data;
};

// DEBTS API

export const getDebts = async (): Promise<Debt[]> => {
  const response = await api.get('/debts');
  return response.data;
};

export const createDebt = async (data: CreateDebtDTO): Promise<Debt> => {
  const response = await api.post('/debts', data);
  return response.data;
};

export const updateDebt = async (id: string, data: Partial<CreateDebtDTO>): Promise<Debt> => {
  const response = await api.put(`/debts/${id}`, data);
  return response.data;
};

export const deleteDebt = async (id: string): Promise<void> => {
  await api.delete(`/debts/${id}`);
};

export default api;

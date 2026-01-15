import api from './api';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudgetInsight {
  id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface CategoryInsight {
  categoryId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  parentId?: string | null;
  currentMonth: {
    total: number;
    transactions: number;
    lastTransactionDate: string | null;
  };
  previousMonth: {
    total: number;
  };
  variationPercentage: number | null;
  budget: CategoryBudgetInsight | null;
}

export interface CategoryInsightResponse {
  month: number;
  year: number;
  insights: CategoryInsight[];
}

export class CategoryService {
  static async getCategories(userId?: string): Promise<Category[]> {
    const response = await api.get('/categories', { params: { userId } });
    return response.data;
  }

  static async getCategoryInsights(params?: { userId?: string; month?: number; year?: number }): Promise<CategoryInsightResponse> {
    const response = await api.get('/categories/insights', { params });
    return response.data;
  }

  static async createCategory(data: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color?: string;
    icon?: string;
    parentId?: string | null;
  }): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data;
  }

  static async updateCategory(id: string, data: {
    name?: string;
    type?: 'INCOME' | 'EXPENSE';
    color?: string;
    icon?: string;
    parentId?: string | null;
  }): Promise<any> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  }

  static async deleteCategory(id: string): Promise<any> {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
}
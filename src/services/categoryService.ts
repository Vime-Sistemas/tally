import api from './api';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export class CategoryService {
  static async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  }

  static async createCategory(data: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color?: string;
    icon?: string;
  }): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data;
  }

  static async updateCategory(id: string, data: {
    name?: string;
    type?: 'INCOME' | 'EXPENSE';
    color?: string;
    icon?: string;
  }): Promise<any> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  }

  static async deleteCategory(id: string): Promise<any> {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
}
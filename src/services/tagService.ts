import api from './api';

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export class TagService {
  static async getTags(userId?: string): Promise<Tag[]> {
    const response = await api.get('/tags', { params: { userId } });
    return response.data;
  }

  static async createTag(data: {
    name: string;
    color?: string;
  }): Promise<Tag> {
    const response = await api.post('/tags', data);
    return response.data;
  }

  static async updateTag(id: string, data: {
    name?: string;
    color?: string;
  }): Promise<any> {
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  }

  static async deleteTag(id: string): Promise<any> {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  }
}
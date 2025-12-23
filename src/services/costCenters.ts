import api from './api'

export interface CostCenter {
  id: string
  userId: string
  name: string
  description?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export const costCenterService = {
  async getCostCenters(): Promise<CostCenter[]> {
    const response = await api.get('/cost-centers')
    return response.data
  },

  async createCostCenter(name: string, description?: string): Promise<CostCenter> {
    const response = await api.post('/cost-centers', {
      name,
      description
    })
    return response.data
  },

  async updateCostCenter(id: string, name: string, description?: string): Promise<CostCenter> {
    const response = await api.put(`/cost-centers/${id}`, {
      name,
      description
    })
    return response.data
  },

  async deleteCostCenter(id: string): Promise<void> {
    await api.delete(`/cost-centers/${id}`)
  }
}

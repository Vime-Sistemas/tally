import api from "./api";
import type { InvestmentWorkspaceSnapshot } from "../types/investments";

export const investmentService = {
  getWorkspaceSnapshot: async (): Promise<InvestmentWorkspaceSnapshot> => {
    const response = await api.get<InvestmentWorkspaceSnapshot>("/investments/workspace");
    return response.data;
  },
};

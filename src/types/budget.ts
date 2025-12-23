export const BudgetType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  INVESTMENT: 'INVESTMENT',
} as const;

export type BudgetType = typeof BudgetType[keyof typeof BudgetType];

export const BudgetPeriod = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type BudgetPeriod = typeof BudgetPeriod[keyof typeof BudgetPeriod];

export interface Budget {
  id: string;
  userId: string;
  name: string;
  type: BudgetType;
  category?: string | null;
  amount: number;
  period: BudgetPeriod;
  year: number;
  month?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDTO {
  name: string;
  type: BudgetType;
  category?: string;
  amount: number;
  period: BudgetPeriod;
  year: number;
  month?: number;
}

export interface UpdateBudgetDTO extends Partial<CreateBudgetDTO> {
  id: string;
}

export interface BudgetComparison {
  budget: Budget;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  transactions: number;
}

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER',
  INVOICE_PAYMENT: 'INVOICE_PAYMENT',
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionCategory = {
  // Receitas
  SALARY: 'SALARY',
  FREELANCE: 'FREELANCE',
  INVESTMENT: 'INVESTMENT',
  OTHER_INCOME: 'OTHER_INCOME',
  
  // Despesas
  FOOD: 'FOOD',
  TRANSPORT: 'TRANSPORT',
  HOUSING: 'HOUSING',
  UTILITIES: 'UTILITIES',
  HEALTHCARE: 'HEALTHCARE',
  ENTERTAINMENT: 'ENTERTAINMENT',
  EDUCATION: 'EDUCATION',
  SHOPPING: 'SHOPPING',
  OTHER_EXPENSE: 'OTHER_EXPENSE',
  
  // Transferência
  TRANSFER: 'TRANSFER',
} as const;

export type TransactionCategory = typeof TransactionCategory[keyof typeof TransactionCategory];

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  accountId?: string;
  cardId?: string;
  destinationAccountId?: string; // For transfers
  equityId?: string;
  goalId?: string;
  installments?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  recurringTransactionId?: string; // Reference to recurring transaction
  isPaid: boolean;
  paidDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionDTO {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  accountId?: string;
  cardId?: string;
  destinationAccountId?: string;
  equityId?: string;
  goalId?: string;
  installments?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  isPaid?: boolean;
  paidDate?: string;
}

export interface UpdateTransactionDTO extends Partial<CreateTransactionDTO> {
  id: string;
}

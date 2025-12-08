export const AccountType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  WALLET: 'WALLET',
  INVESTMENT: 'INVESTMENT',
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  accountId: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

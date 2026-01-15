import type { Account, CreditCard } from './account';
import type { TransactionType } from './transaction';

export interface CashflowForecastParams {
  userId?: string;
  months?: number;
  includePending?: boolean;
  topCategories?: number;
}

export interface CashflowForecastTotals {
  paid: number;
  pending: number;
  total: number;
}

export interface CashflowForecastEntry {
  month: number;
  year: number;
  label: string;
  income: CashflowForecastTotals;
  expense: CashflowForecastTotals;
  net: number;
  pendingNet: number;
  appliedPending: boolean;
  effectiveIncome: number;
  effectiveExpense: number;
  effectiveNet: number;
  categories: CashflowForecastCategory[];
  topExpenses: CashflowForecastCategory[];
}

export interface CashflowForecastCategory {
  categoryId: string | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  paid: number;
  pending: number;
  total: number;
  effectiveTotal: number;
}

export interface CashflowForecastResponse {
  generatedAt: string;
  months: CashflowForecastEntry[];
}

export type UpcomingTransactionStatus = 'pending' | 'paid' | 'all';

export interface UpcomingTransactionsParams {
  userId?: string;
  from?: string;
  to?: string;
  status?: UpcomingTransactionStatus;
}

export interface TransactionCategoryModel {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string | null;
  icon?: string | null;
}

export interface UpcomingTransactionRelation {
  categoryModel?: TransactionCategoryModel | null;
  account?: Account | null;
  card?: CreditCard | null;
}

export interface UpcomingTransaction extends UpcomingTransactionRelation {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  accountId?: string | null;
  cardId?: string | null;
  destinationAccountId?: string | null;
  goalId?: string | null;
  isPaid: boolean;
  paidDate?: string | null;
  daysUntil: number;
}

export interface UpcomingSummaryBucket {
  income: number;
  expense: number;
  net: number;
  count: number;
  pendingCount?: number;
}

export interface UpcomingTransactionsResponse {
  generatedAt: string;
  range: {
    from: string;
    to: string;
  };
  summary: {
    upcoming: UpcomingSummaryBucket & { pendingCount: number };
    overdue: UpcomingSummaryBucket;
  };
  transactions: UpcomingTransaction[];
}

export interface ForecastSummaryLine {
  title: string;
  total: number;
  pending: number;
  paid: number;
  count: number;
}

export interface ForecastSummary {
  receivable: ForecastSummaryLine;
  payable: ForecastSummaryLine;
  overdueNet?: number;
}

export interface WeeklyForecastPoint {
  label: string;
  start: string;
  end: string;
  income: number;
  expense: number;
  netPositive: number;
  netNegative: number;
}

export interface TimelineGroup {
  key: string;
  weekLabel: string;
  periodLabel: string;
  income: number;
  expense: number;
  net: number;
  transactions: UpcomingTransaction[];
}

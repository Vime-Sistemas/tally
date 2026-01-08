import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionType } from '../types/transaction';
import type {
  ForecastSummary,
  TimelineGroup,
  UpcomingTransaction,
  WeeklyForecastPoint,
} from '../types/cashflow';

const DEFAULT_WEEKS = 8;

export function buildWeeklySeries(
  transactions: UpcomingTransaction[],
  weeks: number = DEFAULT_WEEKS
): WeeklyForecastPoint[] {
  const base = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: weeks }).map((_, index) => {
    const start = addWeeks(base, index);
    const end = endOfWeek(start, { weekStartsOn: 1 });

    const weekTransactions = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return date >= start && date <= end;
    });

    const income = sumByType(weekTransactions, TransactionType.INCOME);
    const expense = sumByType(weekTransactions, TransactionType.EXPENSE);
    const net = income - expense;

    return {
      label: format(start, "dd MMM", { locale: ptBR }),
      start: start.toISOString(),
      end: end.toISOString(),
      income,
      expense,
      netPositive: net > 0 ? net : 0,
      netNegative: net < 0 ? Math.abs(net) : 0,
    };
  });
}

export function buildTimelineGroups(
  transactions: UpcomingTransaction[],
  weeks: number = DEFAULT_WEEKS
): TimelineGroup[] {
  const base = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: weeks }).map((_, index) => {
    const start = addWeeks(base, index);
    const end = endOfWeek(start, { weekStartsOn: 1 });

    const weekTransactions = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return date >= start && date <= end;
    });

    const income = sumByType(weekTransactions, TransactionType.INCOME);
    const expense = sumByType(weekTransactions, TransactionType.EXPENSE);

    return {
      key: start.toISOString(),
      weekLabel: `Semana ${index + 1}`,
      periodLabel: `${format(start, "dd MMM", { locale: ptBR })} · ${format(end, "dd MMM", { locale: ptBR })}`,
      income,
      expense,
      net: income - expense,
      transactions: weekTransactions,
    };
  });
}

export function makeForecastSummary(
  transactions: UpcomingTransaction[],
  overdueNet?: number
): ForecastSummary {
  const receivable = transactions.filter((tx) => tx.type === TransactionType.INCOME);
  const payable = transactions.filter((tx) => tx.type === TransactionType.EXPENSE);

  return {
    receivable: {
      title: 'A Receber',
      total: receivable.reduce((sum, tx) => sum + tx.amount, 0),
      pending: receivable.filter((tx) => !tx.isPaid).reduce((sum, tx) => sum + tx.amount, 0),
      paid: receivable.filter((tx) => tx.isPaid).reduce((sum, tx) => sum + tx.amount, 0),
      count: receivable.length,
    },
    payable: {
      title: 'A Pagar',
      total: payable.reduce((sum, tx) => sum + tx.amount, 0),
      pending: payable.filter((tx) => !tx.isPaid).reduce((sum, tx) => sum + tx.amount, 0),
      paid: payable.filter((tx) => tx.isPaid).reduce((sum, tx) => sum + tx.amount, 0),
      count: payable.length,
    },
    overdueNet,
  };
}

function sumByType(transactions: UpcomingTransaction[], type: TransactionType) {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

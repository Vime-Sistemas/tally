import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { UpcomingTransaction } from '../../types/cashflow';
import { TransactionType } from '../../types/transaction';
import { format, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/formatters';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, Check } from 'lucide-react';

interface TimelineWeekCardProps {
  weekLabel: string;
  periodLabel: string;
  income: number;
  expense: number;
  net: number;
  transactions: UpcomingTransaction[];
  accent?: 'blue' | 'emerald';
  onMarkPaid: (transactionId: string) => void;
  onReschedule: (transaction: UpcomingTransaction) => void;
}

const accentPills = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

export function TimelineWeekCard({
  weekLabel,
  periodLabel,
  income,
  expense,
  net,
  transactions,
  accent = 'blue',
  onMarkPaid,
  onReschedule,
}: TimelineWeekCardProps) {
  const sorted = [...transactions].sort((a, b) => b.amount - a.amount).slice(0, 3);
  const isNegative = net < 0;

  return (
    <Card className="rounded-3xl border-zinc-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Semana</p>
            <CardTitle className="text-2xl text-zinc-900 tracking-tight">{weekLabel}</CardTitle>
            <p className="text-sm text-zinc-500">{periodLabel}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'rounded-full px-3 py-1 text-sm font-semibold border',
              isNegative ? 'bg-red-50 text-red-600 border-red-100' : accentPills[accent]
            )}
          >
            {formatCurrency(net)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-100 p-3 bg-white/40">
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-1">A Receber</p>
            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(income)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 p-3 bg-white/40">
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-1">A Pagar</p>
            <p className="text-lg font-semibold text-red-500">{formatCurrency(expense)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {sorted.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhuma movimentação para esta semana.</p>
          )}
          {sorted.map((tx) => {
            const isIncome = tx.type === TransactionType.INCOME;
            const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
            const dueLabel = formatDistanceStrict(new Date(tx.date), new Date(), { locale: ptBR });
            return (
              <div key={tx.id} className="rounded-2xl border border-zinc-100 p-3 bg-white/50">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center', isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{tx.description}</p>
                    <p className="text-xs text-zinc-400">
                      Vence em {dueLabel} · {format(new Date(tx.date), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <p className={cn('text-sm font-semibold tabular-nums', isIncome ? 'text-emerald-600' : 'text-red-500')}>
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                  </p>
                </div>
                {!tx.isPaid && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" className="rounded-full px-3 h-8" onClick={() => onMarkPaid(tx.id)}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Marcar pago
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full px-3 h-8 text-zinc-500 hover:text-zinc-900"
                      onClick={() => onReschedule(tx)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reagendar
                    </Button>
                  </div>
                )}
                {tx.isPaid && (
                  <Badge variant="outline" className="mt-3 border-emerald-100 text-emerald-600 bg-emerald-50">
                    Pago em {tx.paidDate ? format(new Date(tx.paidDate), "dd/MM", { locale: ptBR }) : '—'}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

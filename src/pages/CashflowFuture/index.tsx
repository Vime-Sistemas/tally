import { useCallback, useEffect, useMemo, useState } from 'react';
import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { ForecastCard } from '../../components/CashflowFuture/ForecastCard';
import { TimelineWeekCard } from '../../components/CashflowFuture/TimelineWeekCard';
import { getUpcomingTransactions, getAccounts, getCards, updateTransaction, getCashflowForecast } from '../../services/api';
import type {
  ForecastSummary,
  TimelineGroup,
  UpcomingTransaction,
  UpcomingTransactionsResponse,
  UpcomingTransactionStatus,
  WeeklyForecastPoint,
  CashflowForecastEntry,
} from '../../types/cashflow';
import type { Account, CreditCard } from '../../types/account';
import { CategoryService, type Category } from '../../services/categoryService';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import api from '../../services/api';
import { CalendarClock, Filter, RefreshCcw, Sparkles } from 'lucide-react';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '../../components/ui/chart';
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';
import { buildTimelineGroups, buildWeeklySeries, makeForecastSummary } from '../../utils/cashflow';

interface ClientOption {
  id: string;
  name: string;
}

type Accent = 'blue' | 'emerald';
type TimelineStatus = 'all' | 'pending' | 'paid' | 'overdue';

const WEEKS_AHEAD = 8;
const MONTHS_AHEAD = 12;
const TOP_EXPENSES = 5;

export function CashflowFuturePage() {
  const { user } = useUser();
  const accent: Accent = user?.type === 'PLANNER' ? 'emerald' : 'blue';

  const [upcoming, setUpcoming] = useState<UpcomingTransactionsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccountsList] = useState<Array<{ id: string; label: string }>>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TimelineStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('SELF');
  const [rescheduleTarget, setRescheduleTarget] = useState<UpcomingTransaction | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [forecastMonths, setForecastMonths] = useState<CashflowForecastEntry[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [includePending, setIncludePending] = useState(true);
  const [categoryView, setCategoryView] = useState<'overall' | 'top5'>('overall');

  useEffect(() => {
    const bootstrapFilters = async () => {
      try {
        setIsFiltersLoading(true);
        const [categoryData, accountData, cardData] = await Promise.all([
          CategoryService.getCategories(),
          getAccounts(),
          getCards(),
        ]);

        const accountOptions: Array<{ id: string; label: string }> = [
          ...accountData.map((acc: Account) => ({ id: acc.id, label: acc.name })),
          ...cardData.map((card: CreditCard) => ({ id: card.id, label: card.name })),
        ];

        setCategories(categoryData);
        setAccountsList(accountOptions);

        if (user?.type === 'PLANNER') {
          const response = await api.get('/planner/clients');
          const plannerClients = (response.data as ClientOption[]).map((client) => ({ id: client.id, name: client.name }));
          setClients(plannerClients);
        }
      } catch (error) {
        console.error('Erro ao carregar filtros', error);
        toast.error('Não conseguimos carregar filtros agora.');
      } finally {
        setIsFiltersLoading(false);
      }
    };

    bootstrapFilters();
  }, [user?.type]);

  const loadTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const toDate = addWeeks(now, WEEKS_AHEAD);
      const params = {
        from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        to: endOfWeek(toDate, { weekStartsOn: 1 }).toISOString(),
        status: 'all' as UpcomingTransactionStatus,
        userId: clientFilter !== 'SELF' ? clientFilter : undefined,
      };

      const upcomingRes = await getUpcomingTransactions(params);
      setUpcoming(upcomingRes);
    } catch (error) {
      console.error('Erro ao carregar fluxo futuro', error);
      toast.error('Falha ao carregar fluxo futuro.');
    } finally {
      setIsLoading(false);
    }
  }, [clientFilter]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const loadForecast = useCallback(async () => {
    try {
      setForecastLoading(true);
      const res = await getCashflowForecast({
        months: MONTHS_AHEAD,
        includePending,
        topCategories: TOP_EXPENSES,
        userId: clientFilter !== 'SELF' ? clientFilter : undefined,
      });
      setForecastMonths(res.months || []);
    } catch (error) {
      console.error('Erro ao carregar projeção mensal', error);
      toast.error('Falha ao carregar projeção mensal.');
    } finally {
      setForecastLoading(false);
    }
  }, [clientFilter, includePending]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const filteredTransactions = useMemo(() => {
    if (!upcoming) return [] as UpcomingTransaction[];

    const now = new Date();

    return upcoming.transactions.filter((tx) => {
      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return !tx.isPaid;
        if (statusFilter === 'paid') return tx.isPaid;
        if (statusFilter === 'overdue') return !tx.isPaid && new Date(tx.date) < now;
        return true;
      })();

      const matchesCategory =
        categoryFilter === 'ALL' || tx.category === categoryFilter || tx.categoryModel?.name === categoryFilter;

      const matchesAccount =
        accountFilter === 'ALL' || tx.accountId === accountFilter || tx.cardId === accountFilter;

      return matchesStatus && matchesCategory && matchesAccount;
    });
  }, [upcoming, statusFilter, categoryFilter, accountFilter]);

  const weeklyData = useMemo<WeeklyForecastPoint[]>(
    () => buildWeeklySeries(filteredTransactions, WEEKS_AHEAD),
    [filteredTransactions]
  );

  const forecastOverallSeries = useMemo(() => {
    return forecastMonths.map((m) => ({
      label: m.label,
      income: m.effectiveIncome,
      expense: m.effectiveExpense,
      net: m.effectiveNet,
      filledByAverage: Boolean(m.filledByAverage),
    }));
  }, [forecastMonths]);

  const forecastTopExpenseSeries = useMemo(() => {
    return forecastMonths.map((m) => ({
      label: m.label,
      top: m.topExpenses,
      filledByAverage: Boolean(m.filledByAverage),
    }));
  }, [forecastMonths]);

  const timelineGroups = useMemo<TimelineGroup[]>(
    () => buildTimelineGroups(filteredTransactions, WEEKS_AHEAD),
    [filteredTransactions]
  );

  const summary: ForecastSummary = useMemo(
    () => makeForecastSummary(filteredTransactions, upcoming?.summary.overdue.net),
    [filteredTransactions, upcoming?.summary.overdue.net]
  );

  const handleMarkPaid = async (transactionId: string) => {
    try {
      await updateTransaction(transactionId, {
        isPaid: true,
        paidDate: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success('Transação marcada como paga');
      await loadTimeline();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível atualizar a transação');
    }
  };

  const openReschedule = (transaction: UpcomingTransaction) => {
    setRescheduleTarget(transaction);
    setRescheduleDate(transaction.date.slice(0, 10));
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate) return;
    try {
      setIsSubmitting(true);
      await updateTransaction(rescheduleTarget.id, { date: rescheduleDate });
      toast.success('Data atualizada com sucesso');
      await loadTimeline();
      setRescheduleTarget(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao reagendar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('ALL');
    setAccountFilter('ALL');
  };

  return (
    <div className="w-full min-h-screen pb-32">
      <div className="mx-auto max-w-6xl space-y-8 py-8">
        <header className="space-y-2">
          <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-xs', accent === 'emerald' ? 'text-emerald-600 border-emerald-200' : 'text-blue-600 border-blue-200')}>
            Fluxo Futuro
          </Badge>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-900">Superfície de Fluxo Futuro</h1>
              <p className="text-zinc-500">Timeline viva das próximas semanas com projeções e ações rápidas.</p>
            </div>
            <Button variant="ghost" className="rounded-full" onClick={resetFilters}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Limpar filtros
            </Button>
          </div>
        </header>

        <section className="rounded-3xl border border-zinc-100 bg-white/60 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em]">Filtros</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'paid', 'overdue'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  className={cn(
                    'rounded-full h-8 px-4 text-xs',
                    statusFilter === status
                      ? accent === 'emerald'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                      : 'border-zinc-200 text-zinc-500'
                  )}
                  onClick={() => setStatusFilter(status as TimelineStatus)}
                >
                  {status === 'all' && 'Tudo'}
                  {status === 'pending' && 'Pendentes'}
                  {status === 'paid' && 'Pagos'}
                  {status === 'overdue' && 'Vencidos'}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={isFiltersLoading}>
              <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white">
                <SelectValue placeholder="Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={accountFilter} onValueChange={setAccountFilter} disabled={isFiltersLoading}>
              <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white">
                <SelectValue placeholder="Contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas contas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-12 rounded-2xl border-zinc-200 bg-white flex items-center justify-between"
              onClick={() => setIncludePending((prev) => !prev)}
            >
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Sparkles className="h-4 w-4" />
                {includePending ? 'Incluindo pendentes' : 'Somente pagos'}
              </div>
            </Button>

            {user?.type === 'PLANNER' && (
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white">
                  <SelectValue placeholder="Clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELF">Minha conta</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </section>

        {isLoading ? (
          <Card className="rounded-3xl border-zinc-100 p-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </Card>
        ) : (
          <ForecastCard data={weeklyData} summary={summary} accent={accent} />
        )}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-zinc-500">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-zinc-900">Saldo esperado (12 meses)</h2>
            <Badge variant="outline" className="rounded-full border-zinc-100 text-zinc-500">
              {includePending ? 'Pagos + pendentes' : 'Apenas pagos'}
            </Badge>
            <Badge variant="secondary" className="rounded-full bg-zinc-100 text-zinc-600">Estimado = média 6 meses</Badge>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant={categoryView === 'overall' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setCategoryView('overall')}
              >
                Geral
              </Button>
              <Button
                size="sm"
                variant={categoryView === 'top5' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setCategoryView('top5')}
              >
                Top 5 categorias
              </Button>
            </div>
          </div>

          <Card className="rounded-3xl border-zinc-100 p-4">
            {forecastLoading ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : categoryView === 'overall' ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500">Entradas, saídas e saldo projetados mês a mês.</p>
                <ChartContainer
                  config={{
                    income: { label: 'Entradas', color: 'var(--blue-400, #60a5fa)' },
                    expense: { label: 'Saídas', color: 'var(--zinc-400, #a1a1aa)' },
                    net: { label: 'Saldo', color: 'var(--emerald-500, #10b981)' },
                  }}
                  className="h-72"
                >
                  <AreaChart data={forecastOverallSeries} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} interval={forecastOverallSeries.length > 6 ? 1 : 0} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#71717a' }} width={80} />
                    <ChartTooltip
                      content={<ChartTooltipContent
                        formatter={(value, name) => [formatCurrency(Number(value)), name]}
                        labelFormatter={(label, payload) => {
                          const filled = payload?.[0]?.payload?.filledByAverage
                          return filled ? `${label} (estimado)` : label
                        }}
                      />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="var(--color-income)" fillOpacity={0.08} strokeWidth={2} />
                    <Area type="monotone" dataKey="expense" stroke="var(--color-expense)" fill="var(--color-expense)" fillOpacity={0.08} strokeWidth={2} />
                    <Line type="monotone" dataKey="net" stroke="var(--color-net)" strokeWidth={2.4} dot={false} />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500">Maiores categorias de despesa previstas por mês.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {forecastTopExpenseSeries.map((m) => (
                    <Card key={m.label} className="border-zinc-100 p-3">
                      <div className="flex justify-between text-sm font-semibold text-zinc-800 mb-2">
                        <span>{m.label}</span>
                        <span className="text-xs text-zinc-500">{m.filledByAverage ? 'Estimado (média 6m)' : 'Top 5'}</span>
                      </div>
                      <div className="space-y-2">
                        {m.top.length === 0 && (
                          <p className="text-xs text-zinc-500">Sem dados.</p>
                        )}
                        {m.top.map((cat) => (
                          <div key={`${m.label}-${cat.categoryId || cat.name}`} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-700">{cat.name}</span>
                            <span className="font-mono text-zinc-900">{formatCurrency(cat.effectiveTotal)}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <CalendarClock className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-zinc-900">Próximas semanas</h2>
            <Badge variant="outline" className="rounded-full border-zinc-100 text-zinc-500">
              {filteredTransactions.length} movimentações mapeadas
            </Badge>
          </div>

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          )}

          {!isLoading && timelineGroups.length === 0 && (
            <Card className="flex flex-col items-center justify-center rounded-3xl border-dashed border-zinc-200 py-16 text-center text-zinc-400">
              <Sparkles className="mb-4 h-8 w-8" />
              <p>Nenhuma movimentação futura com os filtros atuais.</p>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {timelineGroups.map((group) => (
              <TimelineWeekCard
                key={group.key}
                weekLabel={group.weekLabel}
                periodLabel={group.periodLabel}
                income={group.income}
                expense={group.expense}
                net={group.net}
                transactions={group.transactions}
                accent={accent}
                onMarkPaid={handleMarkPaid}
                onReschedule={openReschedule}
              />
            ))}
          </div>
        </section>
      </div>

      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Reagendar transação</DialogTitle>
            <DialogDescription>Escolha uma nova data para {rescheduleTarget?.description}.</DialogDescription>
          </DialogHeader>
          <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="h-11" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRescheduleTarget(null)}>Cancelar</Button>
            <Button onClick={handleReschedule} disabled={isSubmitting || !rescheduleDate}>
              {isSubmitting ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

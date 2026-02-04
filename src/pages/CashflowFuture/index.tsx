import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  addWeeks, 
  endOfWeek, 
  format, 
  startOfWeek, 
  isBefore,
  startOfDay,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarClock, 
  RefreshCcw, 
  Wallet, 
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
} from 'lucide-react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

import { getUpcomingTransactions, getCashflowForecast, updateTransaction } from '../../services/api';
import type { UpcomingTransactionsResponse, CashflowForecastEntry } from '../../types/cashflow';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';

// --- Theme Configuration (Client Brand) ---
const THEME = {
  primary: 'text-blue-600',
  bgPrimary: 'bg-blue-600',
  bgLight: 'bg-blue-50',
  border: 'border-blue-100',
  chartIncome: '#60a5fa', // Blue-400
  chartExpense: '#e2e8f0', // Slate-200 (mais suave para não assustar)
  chartNet: '#2563eb', // Blue-600
  chartNetNegative: '#ef4444', // Red-500
};

const MONTHS_AHEAD = 12;
const TOP_EXPENSES = 5;

export function CashflowFuturePage() {
  // State
  const [upcoming, setUpcoming] = useState<UpcomingTransactionsResponse | null>(null);
  const [forecastMonths, setForecastMonths] = useState<CashflowForecastEntry[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [includePending, setIncludePending] = useState(true);

  const formatYAxis = useCallback((v: number) => {
    const abs = Math.abs(v);
    if (abs < 1000) return `R$ ${v.toFixed(0)}`;
    if (abs < 10000) return `R$ ${(v / 1000).toFixed(1)}k`;
    return `R$ ${(v / 1000).toFixed(0)}k`;
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const toDate = addWeeks(now, 8); 

      // Paralelizando as chamadas
      const [upcomingRes, forecastRes] = await Promise.all([
        getUpcomingTransactions({
          from: startOfWeek(now).toISOString(),
          to: endOfWeek(toDate).toISOString(),
        }),
        getCashflowForecast({
          months: MONTHS_AHEAD,
          includePending: includePending,
          topCategories: TOP_EXPENSES,
        })
      ]);

      setUpcoming(upcomingRes);
      setForecastMonths(forecastRes.months || []);

    } catch (error) {
      console.error('Erro ao carregar dados', error);
      toast.error('Não foi possível atualizar suas projeções.');
    } finally {
      setIsLoading(false);
    }
  }, [includePending]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Chart Data Preparation (Cumulative Balance) ---
  const chartData = useMemo(() => {
    return forecastMonths.map(m => ({
      name: m.label.split(' ')[0], // "jan.", "fev."
      fullLabel: m.label,
      Entradas: m.effectiveIncome ?? 0,
      Saídas: m.effectiveExpense ?? 0,
      'Saldo Mensal': m.effectiveNet ?? 0,
      'Saldo Acumulado': m.endingBalance ?? 0,
      startingBalance: m.startingBalance ?? 0,
      hasRealData: m.hasRealData ?? false,
    }));
  }, [forecastMonths]);

  const currentMonthForecast = forecastMonths[0];
  
  // Starting balance (from accounts)
  const startingBalance = useMemo(() => {
    return currentMonthForecast?.startingBalance ?? 0;
  }, [currentMonthForecast]);

  // Final projected balance (end of 12 months)
  const finalProjectedBalance = useMemo(() => {
    const lastMonth = forecastMonths[forecastMonths.length - 1];
    return lastMonth?.endingBalance ?? 0;
  }, [forecastMonths]);

  // Balance trend (positive or negative over period)
  const balanceTrend = useMemo(() => {
    if (forecastMonths.length < 2) return 0;
    const first = forecastMonths[0]?.startingBalance ?? 0;
    const last = forecastMonths[forecastMonths.length - 1]?.endingBalance ?? 0;
    return last - first;
  }, [forecastMonths]);

  // Months with negative balance
  const negativeMonths = useMemo(() => {
    return forecastMonths.filter(m => (m.endingBalance ?? 0) < 0);
  }, [forecastMonths]);
  const isPositiveMonth = currentMonthForecast?.effectiveNet >= 0;

  // --- Handlers ---
  const handleMarkPaid = async (transactionId: string) => {
    try {
      await updateTransaction(transactionId, {
        isPaid: true,
        paidDate: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success('Pago! Menos uma conta na lista.');
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white pb-24 font-sans text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 md:px-8 py-8 space-y-8">
        
        {/* Header Amigável */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Futuro Financeiro
            </h1>
            <p className="text-zinc-500 mt-2 text-lg">
              Veja o que vem por aí e prepare seu bolso.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex items-center space-x-2 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                <Switch 
                  id="pending-mode" 
                  checked={includePending}
                  onCheckedChange={setIncludePending}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="pending-mode" className="text-sm text-zinc-600 cursor-pointer">
                  Considerar pendentes
                </Label>
             </div>
             <Button variant="ghost" size="icon" onClick={loadData} className="text-zinc-400 hover:text-blue-600">
               <RefreshCcw className={cn("h-5 w-5", isLoading && "animate-spin")} />
             </Button>
          </div>
        </header>

        {/* --- Hero Insight Card (Cumulative Balance) --- */}
        {!isLoading && currentMonthForecast && (
          <div className="space-y-4">
            {/* Main Balance Card */}
            <div className={cn(
              "rounded-3xl p-6 md:p-8 transition-all",
              balanceTrend >= 0 ? "bg-blue-50 border border-blue-100" : "bg-orange-50 border border-orange-100"
            )}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <PiggyBank className={cn("h-5 w-5", balanceTrend >= 0 ? "text-blue-600" : "text-orange-600")} />
                    <span className="text-sm text-zinc-500 font-medium">Saldo Atual</span>
                  </div>
                  <h2 className={cn("text-4xl md:text-5xl font-bold tracking-tight", balanceTrend >= 0 ? "text-blue-900" : "text-orange-900")}>
                    {formatCurrency(startingBalance)}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                    {balanceTrend >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={balanceTrend >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {balanceTrend >= 0 ? '+' : ''}{formatCurrency(balanceTrend)} em 12 meses
                    </span>
                  </div>
                </div>

                {/* Arrow and Final Balance */}
                <div className="flex items-center gap-4">
                  <ArrowRight className="h-6 w-6 text-zinc-300 hidden md:block" />
                  <div className="bg-white/80 rounded-2xl p-4 md:p-6 border border-white/50 backdrop-blur-sm text-center">
                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Em 12 meses</p>
                    <p className={cn("text-2xl md:text-3xl font-bold", finalProjectedBalance >= 0 ? "text-blue-600" : "text-red-600")}>
                      {formatCurrency(finalProjectedBalance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {negativeMonths.length > 0 && (
                <div className="mt-4 p-3 bg-orange-100/50 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Atenção: {negativeMonths.length} {negativeMonths.length === 1 ? 'mês' : 'meses'} com saldo negativo projetado
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      {negativeMonths.map(m => m.label.split(' ')[0]).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Current Month Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-zinc-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">{currentMonthForecast.label}</p>
                  <p className={cn("text-xl font-bold", isPositiveMonth ? "text-blue-600" : "text-orange-600")}>
                    {formatCurrency(currentMonthForecast.effectiveNet ?? 0)}
                  </p>
                  <p className="text-xs text-zinc-400">resultado do mês</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Entradas</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(currentMonthForecast.effectiveIncome)}</p>
                  <p className="text-xs text-zinc-400">previsto este mês</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Saídas</p>
                  <p className="text-xl font-bold text-zinc-700">{formatCurrency(currentMonthForecast.effectiveExpense)}</p>
                  <p className="text-xs text-zinc-400">previsto este mês</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Recorrentes</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency((currentMonthForecast.projectedRecurringIncome ?? 0) - (currentMonthForecast.projectedRecurringExpense ?? 0))}
                  </p>
                  <p className="text-xs text-zinc-400">saldo recorrente</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* --- Main Projection Chart --- */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Projeção Anual</h3>
              <Select defaultValue="12">
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-full border-zinc-200">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
           </div>

           <Card className="border-zinc-200 shadow-sm overflow-hidden">
             <CardContent className="p-0">
               {isLoading ? (
                 <Skeleton className="h-[380px] w-full" />
               ) : (
                 <div className="space-y-6">
                   {/* Cumulative Balance Chart */}
                   <div className="pt-4 px-4">
                     <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">Evolução do Patrimônio</p>
                   </div>
                   <div className="h-[180px] w-full pr-6">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                         <defs>
                           <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                         <XAxis 
                           dataKey="name" 
                           tick={{ fontSize: 11, fill: '#a1a1aa' }} 
                           axisLine={false} 
                           tickLine={false}
                         />
                         <YAxis 
                           tick={{ fontSize: 11, fill: '#a1a1aa' }} 
                           axisLine={false} 
                           tickLine={false}
                           tickFormatter={formatYAxis}
                         />
                         <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                           formatter={(value: number, name: string) => {
                             if (name === 'Saldo Acumulado') {
                               return [formatCurrency(value), 'Saldo Projetado'];
                             }
                             return [formatCurrency(value), name];
                           }}
                         />
                         <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                         <Area 
                           type="monotone" 
                           dataKey="Saldo Acumulado" 
                           stroke={THEME.chartNet}
                           strokeWidth={2}
                           fillOpacity={1}
                           fill="url(#balanceGradient)"
                           dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                           activeDot={{ r: 5, stroke: THEME.chartNet }}
                         />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>

                   {/* Monthly Breakdown Chart */}
                   <div className="px-4">
                     <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">Entradas e Saídas por Mês</p>
                   </div>
                   <div className="h-[180px] w-full pr-6 pb-4">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                         <XAxis 
                           dataKey="name" 
                           tick={{ fontSize: 11, fill: '#a1a1aa' }} 
                           axisLine={false} 
                           tickLine={false}
                         />
                         <YAxis 
                           tick={{ fontSize: 11, fill: '#a1a1aa' }} 
                           axisLine={false} 
                           tickLine={false}
                           tickFormatter={formatYAxis}
                         />
                         <Tooltip 
                           cursor={{ fill: '#f4f4f5', opacity: 0.5 }}
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                           formatter={(value: number) => [formatCurrency(value), '']}
                         />
                         <Legend verticalAlign="top" height={36} iconType="circle"/>
                         <Bar name="Receitas" dataKey="Entradas" fill={THEME.chartIncome} radius={[4, 4, 0, 0]} barSize={16} />
                         <Bar name="Despesas" dataKey="Saídas" fill={THEME.chartExpense} radius={[4, 4, 0, 0]} barSize={16} />
                         <Line 
                           name="Saldo Mensal"
                           type="monotone" 
                           dataKey="Saldo Mensal" 
                           stroke="#10b981"
                           strokeWidth={2} 
                           dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                         />
                         <ReferenceLine y={0} stroke="#e4e4e7" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>
        </section>

        {/* --- Upcoming Timeline --- */}
        <section className="space-y-4 pt-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <CalendarClock className="h-5 w-5 text-blue-500" />
                 <h3 className="text-lg font-bold text-zinc-900">Próximos Vencimentos</h3>
              </div>
              {upcoming?.summary && (
                 <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-normal">
                    {upcoming.summary.upcoming.count} lançamentos
                 </Badge>
              )}
           </div>

           <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
              <ScrollArea className="h-[500px]">
                 <div className="divide-y divide-zinc-100">
                    {isLoading ? (
                       <div className="p-6 space-y-4">
                          <Skeleton className="h-14 w-full rounded-xl" />
                          <Skeleton className="h-14 w-full rounded-xl" />
                       </div>
                    ) : upcoming?.transactions.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                             <CheckCircle2 className="w-8 h-8 text-blue-400" />
                          </div>
                          <h4 className="text-zinc-900 font-medium">Tudo em dia!</h4>
                          <p className="text-zinc-500 text-sm mt-1">Nenhuma conta pendente para os próximos dias.</p>
                       </div>
                    ) : (
                       upcoming?.transactions.map((t) => {
                          const isOverdue = !t.isPaid && isBefore(parseISO(t.date), startOfDay(new Date()));
                          const isExpense = t.type === 'EXPENSE';
                          const dateObj = parseISO(t.date);

                          return (
                             <div key={t.id} className="group flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                                <div className="flex items-center gap-4">
                                   {/* Date Box */}
                                   <div className={cn(
                                      "flex flex-col items-center justify-center w-12 h-12 rounded-xl border shrink-0",
                                      isOverdue 
                                        ? "bg-red-50 border-red-100 text-red-600" 
                                        : "bg-white border-zinc-100 text-zinc-600"
                                   )}>
                                      <span className="text-[10px] uppercase font-bold tracking-wider">{format(dateObj, 'MMM', { locale: ptBR })}</span>
                                      <span className="text-xl font-bold leading-none">{format(dateObj, 'dd')}</span>
                                   </div>

                                   <div className="space-y-1">
                                      <p className={cn("font-semibold text-zinc-900", t.isPaid && "line-through text-zinc-400")}>
                                         {t.description}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                                         {isOverdue && (
                                            <span className="text-red-600 font-medium flex items-center gap-1">
                                               <AlertTriangle className="w-3 h-3" /> Vencido
                                            </span>
                                         )}
                                         <span className="flex items-center gap-1">
                                            <Wallet className="w-3 h-3 text-zinc-400" />
                                            {t.account?.name || t.card?.name || 'Conta'}
                                         </span>
                                         {t.currentInstallment && (
                                            <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                                               {t.currentInstallment}/{t.totalInstallments}
                                            </span>
                                         )}
                                      </div>
                                   </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-6">
                                   <span className={cn(
                                      "text-base font-semibold tabular-nums",
                                      isExpense ? "text-zinc-900" : "text-blue-600",
                                      t.isPaid && "text-zinc-400"
                                   )}>
                                      {formatCurrency(t.amount)}
                                   </span>
                                   
                                   <div className="w-8">
                                      {!t.isPaid && (
                                         <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleMarkPaid(t.id)}
                                            title="Marcar como pago"
                                         >
                                            <CheckCircle2 className="w-5 h-5" />
                                         </Button>
                                      )}
                                   </div>
                                </div>
                             </div>
                          );
                       })
                    )}
                 </div>
              </ScrollArea>
           </Card>
        </section>

      </div>
    </div>
  );
}
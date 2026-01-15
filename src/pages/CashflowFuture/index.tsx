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
  ReferenceLine
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

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    return forecastMonths.map(m => ({
      name: m.label.split(' ')[0], // "jan.", "fev."
      fullLabel: m.label,
         Entradas: m.effectiveIncome ?? 0,
         Saídas: m.effectiveExpense ?? 0,
         Saldo: m.effectiveNet ?? 0,
    }));
  }, [forecastMonths]);

  const currentMonthForecast = forecastMonths[0];
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

        {/* --- Hero Insight Card --- */}
        {!isLoading && currentMonthForecast && (
          <div className={cn(
            "rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all",
            isPositiveMonth ? "bg-blue-50 border border-blue-100" : "bg-orange-50 border border-orange-100"
          )}>
             <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                   <Badge className={cn("rounded-full px-3", isPositiveMonth ? "bg-blue-200 text-blue-800 hover:bg-blue-200" : "bg-orange-200 text-orange-800 hover:bg-orange-200")}>
                      {currentMonthForecast.label}
                   </Badge>
                   <span className="text-sm text-zinc-500 font-medium">Previsão de Fechamento</span>
                </div>
                <h2 className={cn("text-4xl md:text-5xl font-bold tracking-tight", isPositiveMonth ? "text-blue-900" : "text-orange-900")}>
                  {formatCurrency(currentMonthForecast.effectiveNet ?? 0)}
                </h2>
                <p className={cn("text-base md:text-lg max-w-md", isPositiveMonth ? "text-blue-700" : "text-orange-800")}>
                   {isPositiveMonth 
                     ? "Ótimo! Você deve fechar o mês no azul. Que tal separar uma parte para investir?" 
                     : "Atenção! As despesas previstas superam as receitas. Revise seus gastos variáveis."}
                </p>
             </div>

             {/* Mini Stats Grid */}
             <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/60 rounded-2xl p-4 border border-white/50 backdrop-blur-sm">
                   <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Entradas</p>
                   <p className="text-xl font-bold text-blue-600">{formatCurrency(currentMonthForecast.effectiveIncome)}</p>
                </div>
                <div className="bg-white/60 rounded-2xl p-4 border border-white/50 backdrop-blur-sm">
                   <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Saídas</p>
                   <p className="text-xl font-bold text-zinc-700">{formatCurrency(currentMonthForecast.effectiveExpense)}</p>
                </div>
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
                 <Skeleton className="h-[320px] w-full" />
               ) : (
                 <div className="h-[320px] w-full pt-6 pr-6">
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                       <XAxis 
                         dataKey="name" 
                         tick={{ fontSize: 12, fill: '#a1a1aa' }} 
                         axisLine={false} 
                         tickLine={false} 
                         dy={10}
                       />
                       <YAxis 
                         tick={{ fontSize: 11, fill: '#a1a1aa' }} 
                         axisLine={false} 
                         tickLine={false}
                         tickFormatter={formatYAxis}
                         domain={[(dataMin: number) => Math.min(0, dataMin * 1.1), (dataMax: number) => (dataMax || 0) * 1.1 + 50]}
                       />
                       <Tooltip 
                         cursor={{ fill: '#f4f4f5', opacity: 0.5 }}
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                         labelStyle={{ color: '#71717a', marginBottom: '0.5rem' }}
                         formatter={(value: number) => [formatCurrency(value), '']}
                       />
                       <Legend verticalAlign="top" height={36} iconType="circle"/>
                       
                       {/* Income Bar */}
                       <Bar name="Receitas" dataKey="Entradas" fill={THEME.chartIncome} radius={[4, 4, 0, 0]} barSize={12} />
                       
                       {/* Expense Bar */}
                       <Bar name="Despesas" dataKey="Saídas" fill={THEME.chartExpense} radius={[4, 4, 0, 0]} barSize={12} />
                       
                       {/* Net Line */}
                       <Line 
                         name="Saldo Previsto"
                         type="monotone" 
                         dataKey="Saldo" 
                         stroke={THEME.chartNet} 
                         strokeWidth={3} 
                         dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                         activeDot={{ r: 6, stroke: THEME.chartNet }}
                       />
                       <ReferenceLine y={0} stroke="#e4e4e7" />
                     </ComposedChart>
                   </ResponsiveContainer>
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
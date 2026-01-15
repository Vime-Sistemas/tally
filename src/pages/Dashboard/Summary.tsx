import { useEffect, useMemo, useState } from "react";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  Cell, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Landmark,
  MoreHorizontal,
  CalendarClock,
  PieChart as PieChartIcon,
} from "lucide-react";
import { format, subMonths, endOfMonth, isSameMonth, isBefore, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";

import { accountService } from "../../services/accounts";
import { CategoryService, type Category } from "../../services/categoryService";
import { transactionService } from "../../services/transactions";
import { equityService } from "../../services/equities";
import { getCards, getBudgets, getBudgetComparison } from "../../services/api";
import { useUser } from "../../contexts/UserContext";
import { cn } from "../../lib/utils";
import { formatCurrency } from "../../utils/formatters";

// Types
import { type Account, type CreditCard as CreditCardType } from "../../types/account";
import { type Transaction } from "../../types/transaction";
import type { Equity } from "../../types/equity";
import type { Budget, BudgetComparison } from "../../types/budget";
import type { Page } from "../../types/navigation";

// --- Helpers & Constants ---
const BLUE_PALETTE = [
  "#3b82f6", // Blue 500
  "#60a5fa", // Blue 400
  "#93c5fd", // Blue 300
  "#2563eb", // Blue 600
  "#bfdbfe", // Blue 200
  "#1d4ed8", // Blue 700
  "#dbeafe", // Blue 100
  "#1e40af", // Blue 800
];

const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export function Summary({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [, setCards] = useState<CreditCardType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetComparisons, setBudgetComparisons] = useState<Record<string, BudgetComparison>>({});
  const [loading, setLoading] = useState(true);
  
  const { costCenters } = useUser();

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const [accData, txData, eqData, cardsData, budgetsData, cats] = await Promise.all([
          accountService.getAll(),
          transactionService.getAll(),
          equityService.getAll(),
          getCards(),
          getBudgets(currentYear, currentMonth),
          CategoryService.getCategories()
        ]);
        
        setAccounts(accData);
        setTransactions(txData);
        setEquities(eqData);
        setCards(cardsData);
        setBudgets(budgetsData);
        setCategories(cats);
        
        // Load Budget Comparisons
        const comparisons: Record<string, BudgetComparison> = {};
        await Promise.all(
          budgetsData.map(async (b: Budget) => {
            try {
              comparisons[b.id] = await getBudgetComparison(b.id);
            } catch (e) { console.error(e); }
          })
        );
        setBudgetComparisons(comparisons);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Erro ao atualizar dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Calculations ---
  const currentDate = new Date();
  
  // 1. Financial Snapshot
  const totalAccountBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalEquityValue = equities.reduce((sum, eq) => sum + eq.value, 0);
  const netWorth = totalAccountBalance + totalEquityValue; // Simplificado

  // 2. Monthly Flow
  const currentMonthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), currentDate));
  const income = currentMonthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = currentMonthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  // 3. Charts Data
  // A. Evolution (Net Worth over 6 months)
  const evolutionData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(currentDate, i);
      const monthEnd = endOfMonth(date);
      // Mock logic: In a real app, you'd need historical snapshots. 
      // Here we approximate based on acquisition dates for equities + static balance assumption or similar.
      // For better UX, we'll just show the Equity growth as the "Curve"
      const equityVal = equities
        .filter(e => isBefore(parseUTCDate(e.acquisitionDate), monthEnd))
        .reduce((sum, e) => sum + e.value, 0);
      
      return { 
        name: format(date, 'MMM', { locale: ptBR }), 
        value: equityVal + totalAccountBalance // Adding current balance as baseline for visual scale
      };
    }).reverse();
  }, [equities, totalAccountBalance]);

  // B. Spending Breakdown (Category & Cost Center)
  const getPieData = (type: 'CATEGORY' | 'COST_CENTER') => {
    const map: Record<string, number> = {};
    
    currentMonthTxs
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        let label = 'Outros';
        if (type === 'CATEGORY') {
           const catName = categories.find(c => c.id === t.category || c.name === t.category)?.name || t.category;
           label = catName || 'Sem Categoria';
        } else {
           const ccName = costCenters.find(c => c.id === t.costCenterId)?.name;
           label = ccName || 'Sem Centro de Custo';
        }
        map[label] = (map[label] || 0) + t.amount;
      });

    return Object.entries(map)
      .map(([name, value], i) => ({ 
        name, 
        value, 
        fill: BLUE_PALETTE[i % BLUE_PALETTE.length] 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 only to avoid pollution
  };

  const categoryData = useMemo(() => getPieData('CATEGORY'), [currentMonthTxs, categories]);
  const costCenterData = useMemo(() => getPieData('COST_CENTER'), [currentMonthTxs, costCenters]);

  // 4. Upcoming Bills (Next 7 days)
  const upcomingBills = useMemo(() => {
    const nextWeek = addWeeks(currentDate, 1);
    return transactions
      .filter(t => {
        const d = parseUTCDate(t.date);
        return t.type === 'EXPENSE' && !t.isPaid && d >= currentDate && d <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-zinc-100 rounded mb-4" />
          <div className="h-4 w-48 bg-zinc-50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50/50 pb-20 font-sans text-zinc-900 selection:bg-blue-100">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 space-y-8">
        
        {/* --- Header --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Visão Geral</h1>
            <p className="text-zinc-500 mt-1">Bem-vindo ao seu painel de controle financeiro.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="bg-white" onClick={() => onNavigate?.('transactions-new')}>
               + Transação
             </Button>
          </div>
        </header>

        {/* --- KPI Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Net Worth Card (Featured) */}
          <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Landmark className="w-24 h-24 text-blue-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Patrimônio Líquido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-zinc-900 tracking-tight">
                {formatCurrency(netWorth)}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Income */}
          <Card className="border-zinc-200 shadow-sm bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Receitas (Mês)</CardTitle>
              <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(income)}
              </div>
              <p className="text-xs text-zinc-400 mt-1">Entradas confirmadas</p>
            </CardContent>
          </Card>

          {/* Monthly Expense */}
          <Card className="border-zinc-200 shadow-sm bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Despesas (Mês)</CardTitle>
              <ArrowDownCircle className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(expense)}
              </div>
              <p className="text-xs text-zinc-400 mt-1">Gastos realizados</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Main Dashboard Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Charts) - Takes 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Evolution Chart */}
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Evolução Patrimonial</CardTitle>
                <CardDescription>Crescimento do seu patrimônio nos últimos 6 meses.</CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                        tickMargin={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                        tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorVal)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown Tabs (Category vs Cost Center) */}
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Gastos do Mês</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="category" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="category">Por Categoria</TabsTrigger>
                    <TabsTrigger value="center">Por Centro de Custo</TabsTrigger>
                  </TabsList>
                  
                  {/* Common Chart Rendering Logic */}
                  {['category', 'center'].map((tab) => {
                    const data = tab === 'category' ? categoryData : costCenterData;
                    return (
                      <TabsContent key={tab} value={tab} className="mt-0">
                        {data.length > 0 ? (
                          <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="h-[220px] w-[220px] shrink-0 relative">
                               <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                   <Pie
                                     data={data}
                                     innerRadius={60}
                                     outerRadius={80}
                                     paddingAngle={2}
                                     dataKey="value"
                                     cornerRadius={4}
                                     stroke="none"
                                   >
                                     {data.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.fill} />
                                     ))}
                                   </Pie>
                                   <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                 </PieChart>
                               </ResponsiveContainer>
                               {/* Center Text */}
                               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <PieChartIcon className="w-8 h-8 text-zinc-300" />
                               </div>
                            </div>
                            
                            {/* Custom Legend List */}
                            <div className="flex-1 w-full space-y-3">
                               {data.map((item) => (
                                 <div key={item.name} className="flex items-center justify-between text-sm group">
                                    <div className="flex items-center gap-3">
                                       <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                       <span className="text-zinc-600 font-medium truncate max-w-[120px]">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <span className="text-zinc-900 font-semibold">{formatCurrency(item.value)}</span>
                                       <span className="text-zinc-400 text-xs w-8 text-right">
                                          {((item.value / expense) * 100).toFixed(0)}%
                                       </span>
                                    </div>
                                 </div>
                               ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-[200px] flex items-center justify-center text-zinc-400 text-sm border-2 border-dashed border-zinc-100 rounded-xl">
                            Sem dados para exibir.
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Side Lists) - Takes 1 col */}
          <div className="space-y-8">
            
            {/* Accounts List (Compact) */}
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-zinc-50">
                <CardTitle className="text-base font-semibold">Minhas Contas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[240px]">
                  <div className="divide-y divide-zinc-50">
                    {accounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{acc.name}</p>
                            <p className="text-xs text-zinc-500 capitalize">{acc.type.toLowerCase()}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(acc.balance)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Upcoming Bills (Next 7 Days) */}
            <Card className="border-zinc-200 shadow-sm bg-blue-50/30">
              <CardHeader className="pb-3 border-b border-blue-100/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-blue-500" />
                    A Vencer (7d)
                  </CardTitle>
                  {upcomingBills.length > 0 && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{upcomingBills.length}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingBills.length > 0 ? (
                  <div className="divide-y divide-blue-100/50">
                    {upcomingBills.map(bill => (
                      <div key={bill.id} className="p-4 hover:bg-blue-50/50 transition-colors">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-zinc-800">{bill.description}</span>
                          <span className="text-sm font-bold text-red-600">{formatCurrency(bill.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                          <span>{bill.category || 'Geral'}</span>
                          <span className="text-blue-600 font-medium">
                            {format(parseUTCDate(bill.date), "dd 'de' MMM")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-zinc-500">
                    <p>Tudo pago! Nenhuma conta para os próximos dias.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Progress (Mini) */}
            {budgets.length > 0 && (
              <Card className="border-zinc-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-zinc-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Orçamentos</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onNavigate?.('budgets')}>
                      <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {budgets.slice(0, 3).map(b => {
                    const comp = budgetComparisons[b.id];
                    const percent = comp ? (comp.spent / b.amount) * 100 : 0;
                    return (
                      <div key={b.id} className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-zinc-700">{b.name}</span>
                          <span className={cn(percent > 100 ? "text-red-500" : "text-zinc-500")}>
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={percent} className="h-1.5" indicatorClassName={cn(percent > 100 ? "bg-red-500" : "bg-blue-500")} />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
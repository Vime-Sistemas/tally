import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../../components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  CheckCircle2,
  Landmark,
  Target,
  PieChart as PieChartIcon
} from "lucide-react";
import { accountService } from "../../services/accounts";
import { transactionService } from "../../services/transactions";
import { equityService } from "../../services/equities";
import { getCards, getBudgets, getBudgetComparison } from "../../services/api"; // Certifique-se que getBudgets/Comparison estão exportados aqui
import { type Account, type CreditCard } from "../../types/account";
import { TransactionCategory, type Transaction } from "../../types/transaction";
import type { Equity } from "../../types/equity";
import type { Budget, BudgetComparison } from "../../types/budget";
import type { Page } from "../../types/navigation";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

// --- Helpers ---
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

// --- Configs & Palettes ---
const chartConfig = {
  income: { label: "Entradas", color: "#60a5fa" },
  expense: { label: "Saídas", color: "#18181b" },
};

const equityConfig: Record<string, { label: string; color: string }> = {
  value: { label: "Patrimônio", color: "#60a5fa" },
  'Imóveis': { label: "Imóveis", color: "#60a5fa" },
  'Veículos': { label: "Veículos", color: "#93c5fd" },
  'Investimentos': { label: "Investimentos", color: "#3b82f6" },
  'Liquidez': { label: "Liquidez", color: "#2563eb" },
  'Bens Pessoais': { label: "Bens Pessoais", color: "#bfdbfe" },
  'Participações': { label: "Participações", color: "#1d4ed8" },
  'Outros': { label: "Outros", color: "#dbeafe" },
};

// Labels para tradução das categorias (mapa base) — labels adicionais serão geradas dinamicamente
const CATEGORY_LABELS: Record<string, string> = {
  'HOUSING': 'Moradia',
  'TRANSPORT': 'Transporte',
  'FOOD': 'Alimentação',
  'UTILITIES': 'Utilidades',
  'HEALTHCARE': 'Saúde',
  'ENTERTAINMENT': 'Lazer',
  'EDUCATION': 'Educação',
  'SHOPPING': 'Compras',
  'FINANCIAL': 'Serviços Financeiros',
  'TRAVEL': 'Viagem',
  'OTHER_EXPENSE': 'Outros',
  'INVESTMENT': 'Investimentos',
  'SALARY': 'Salário',
  'OTHER_INCOME': 'Outras Receitas',
  'GROCERIES': 'Mercearia',
  'RENT': 'Aluguel',
  'MORTGAGE': 'Hipoteca',
  'INSURANCE': 'Seguros',
  'SUBSCRIPTIONS': 'Assinaturas',
  'TAXES': 'Impostos',
  'SAVINGS': 'Poupança'
};

// Gera um rótulo humano para categorias não mapeadas explicitamente
const humanizeCategory = (key: string) => {
  if (!key) return '—';
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return key
    .split(/[_\s-]+/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
};

const BLUE_GRADIENT = ["#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff", "#2563eb", "#1d4ed8"];

export function Summary({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  
  // Novos estados para Orçamentos
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetComparisons, setBudgetComparisons] = useState<Record<string, BudgetComparison>>({});
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const [accData, txData, eqData, cardsData, budgetsData] = await Promise.all([
          accountService.getAll(),
          transactionService.getAll(),
          equityService.getAll(),
          getCards(),
          getBudgets(currentYear, currentMonth) // Assumindo que aceita ano/mês
        ]);
        
        setAccounts(accData);
        setTransactions(txData);
        setEquities(eqData);
        setCards(cardsData);
        setBudgets(budgetsData);
        
        // Carregar comparações de cada orçamento
        const comparisons: Record<string, BudgetComparison> = {};
        await Promise.all(
          budgetsData.map(async (b: Budget) => {
            try {
              const comp = await getBudgetComparison(b.id);
              comparisons[b.id] = comp;
            } catch (e) {
              console.error(`Erro ao carregar comparação do orçamento ${b.name}`, e);
            }
          })
        );
        setBudgetComparisons(comparisons);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-blue-400 animate-pulse">Carregando...</div>;
  }

  // --- Calculations ---
  const currentDate = new Date();
  const prevMonthStart = startOfMonth(subMonths(currentDate, 1));

  // 1. Totals
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  // 2. Transactions Analysis
  const currentMonthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), currentDate));
  const prevMonthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), prevMonthStart));

  const currentIncome = currentMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  // Incluir investimentos nas despesas para refletir o histórico completo
  const currentExpense = currentMonthTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = prevMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevMonthTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

  // 3. Category Expenses (Pie Chart Data)
  const expensesByCategoryMap = currentMonthTxs
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const key = t.category || 'OTHER_EXPENSE';
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expensesByCategoryData = Object.entries(expensesByCategoryMap)
    .map(([key, value], idx) => ({ 
      name: key, 
      label: humanizeCategory(key),
      value,
      fill: BLUE_GRADIENT[idx % BLUE_GRADIENT.length] 
    }))
    .sort((a, b) => b.value - a.value); // Order by highest expense

  // Config dinâmica para o gráfico de categorias
  const categoryConfig = expensesByCategoryData.reduce((acc, item) => {
    acc[item.name] = { label: item.label, color: item.fill };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);


  // 4. Charts Data (Cash Flow & Equity)
  const cashFlowData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentDate, i);
    const monthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), date));
    return {
      month: format(date, 'MMM', { locale: ptBR }),
      income: monthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0),
      date
    };
  }).reverse();

  const equityEvolutionData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentDate, i);
    const monthEnd = endOfMonth(date);
    const value = equities
      .filter(e => isBefore(parseUTCDate(e.acquisitionDate), monthEnd))
      .reduce((sum, e) => sum + e.value, 0);
    return { month: format(date, 'MMM', { locale: ptBR }), value, date };
  }).reverse();

  // 5. Utilities
  const upcomingBills = transactions
    .filter(t => {
      const date = parseUTCDate(t.date);
      const diffTime = date.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return t.type === 'EXPENSE' && diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // --- Onboarding Logic ---
  const onboardingSteps = [
    { id: 1, title: "Contas & Cartões", desc: "Conecte suas fontes.", done: accounts.length > 0 || cards.length > 0, action: () => onNavigate?.('accounts-new'), icon: Wallet },
    { id: 2, title: "Transações", desc: "Registre gastos.", done: transactions.length > 0, action: () => onNavigate?.('transactions-new'), icon: ArrowUpCircle },
    { id: 3, title: "Orçamentos", desc: "Defina limites.", done: budgets.length > 0, action: () => onNavigate?.('budgets'), icon: Target },
    { id: 4, title: "Patrimônio", desc: "Cadastre bens.", done: equities.length > 0, icon: Landmark }
  ];
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const progressPercent = (completedSteps / onboardingSteps.length) * 100;

  return (
    <div className="w-full p-4 md:p-8 space-y-8 max-w-7xl mx-auto bg-white min-h-screen text-zinc-900 font-sans selection:bg-blue-100">
      
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Visão Geral</h2>
        <p className="text-zinc-500">Seu painel de controle financeiro.</p>
      </div>

      {/* --- ONBOARDING SECTION --- */}
      {completedSteps < onboardingSteps.length && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Configuração Inicial</h3>
            <span className="text-2xl font-bold text-blue-400">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {onboardingSteps.map((step) => (
              <div 
                key={step.id}
                className={cn("relative group p-5 rounded-2xl border transition-all duration-300", step.done ? "bg-zinc-50 border-zinc-100 opacity-60" : "bg-white border-zinc-200 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer")}
                onClick={() => !step.done && step.action?.()}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={cn("p-2 rounded-xl", step.done ? "bg-zinc-200 text-zinc-500" : "bg-blue-50 text-blue-400")}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  {step.done ? <CheckCircle2 className="w-5 h-5 text-blue-400" /> : <div className="w-5 h-5 rounded-full border-2 border-zinc-200 group-hover:border-blue-300" />}
                </div>
                <h4 className="font-semibold mb-1 text-zinc-900">{step.title}</h4>
                <p className="text-sm text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- KPI Cards & Upcoming Bills --- */}
      <div className="space-y-6">
        {upcomingBills.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingBills.map(bill => (
              <div key={bill.id} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-blue-50 text-blue-400 rounded-xl"><ArrowDownCircle className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{bill.description}</p>
                  <p className="text-xs text-zinc-500">Vence em {format(parseUTCDate(bill.date), "dd/MM")}</p>
                </div>
                <div className="ml-auto font-semibold text-zinc-900">R$ {bill.amount.toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl border-zinc-100 shadow-sm hover:shadow-lg transition-shadow duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Saldo Total</CardTitle>
              <Wallet className="h-4 w-4 text-zinc-300" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-zinc-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-zinc-100 shadow-sm hover:shadow-lg transition-shadow duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Receitas (Mês)</CardTitle>
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-blue-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentIncome)}
              </div>
              <p className="text-xs text-zinc-400 mt-1">{incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% vs mês anterior</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-zinc-100 shadow-sm hover:shadow-lg transition-shadow duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Despesas (Mês)</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-zinc-300" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-zinc-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentExpense)}
              </div>
              <p className="text-xs text-zinc-400 mt-1">{expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% vs mês anterior</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- ROW 1: Charts (Fluxo de Caixa & Categorias) --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Fluxo de Caixa */}
        <Card className="col-span-4 rounded-3xl border-zinc-100 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-zinc-900">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e4e4e7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#e4e4e7" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tick={{fill: '#a1a1aa', fontSize: 12}} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area dataKey="expense" type="monotone" fill="url(#fillExpense)" stroke="#a1a1aa" strokeWidth={2} stackId="a" />
                <Area dataKey="income" type="monotone" fill="url(#fillIncome)" stroke="#60a5fa" strokeWidth={2} stackId="b" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Despesas por Categoria (NOVO) */}
        <Card className="col-span-3 rounded-3xl border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-400" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategoryData.length > 0 ? (
              <ChartContainer config={categoryConfig} className="aspect-square h-[250px] mx-auto">
                <PieChart>
                  <Pie
                    data={expensesByCategoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    cornerRadius={4}
                  >
                    {expensesByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-2 text-zinc-500 mt-4" />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-zinc-400 text-sm">
                Sem despesas este mês
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- ROW 2: Orçamentos (NOVO) --- */}
      {budgets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" />
            Orçamentos do Mês
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
              const comp = budgetComparisons[budget.id];
              // Evitar divisão por zero e garantir porcentagem visual
              const spent = comp?.spent || 0;
              const total = budget.amount;
              const percent = total > 0 ? (spent / total) * 100 : 0;
              
              return (
                <Card key={budget.id} className="rounded-3xl border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-zinc-900">{budget.name}</h4>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">
                          {budget.category ? (CATEGORY_LABELS[budget.category] || budget.category) : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium bg-blue-50 text-blue-500 px-2 py-1 rounded-full">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Gasto: <span className="text-zinc-900 font-medium">R$ {spent.toFixed(0)}</span></span>
                        <span className="text-zinc-400">de R$ {total.toFixed(0)}</span>
                      </div>
                      
                      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", percent > 100 ? "bg-zinc-800" : "bg-blue-400")}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      
                      <p className="text-xs text-right text-zinc-400">
                        Restante: <span className={cn("font-medium", (comp?.remaining || 0) < 0 ? "text-red-400" : "text-blue-400")}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comp?.remaining || 0)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* --- ROW 3: Evolução Patrimonial --- */}
      <Card className="rounded-3xl border-zinc-100 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-zinc-900">Evolução Patrimonial</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <ChartContainer config={equityConfig} className="h-[250px] w-full">
            <AreaChart data={equityEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tick={{fill: '#a1a1aa', fontSize: 12}} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area dataKey="value" type="monotone" fill="url(#fillVal)" stroke="#60a5fa" strokeWidth={3} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
    </div>
  );
}
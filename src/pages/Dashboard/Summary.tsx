import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../../components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell, YAxis } from "recharts";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CreditCard as CreditCardIcon,
  BarChart3,
  CheckCircle2,
  Circle,
  Plus
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { accountService } from "../../services/accounts";
import { transactionService } from "../../services/transactions";
import { equityService } from "../../services/equities";
import { getCards, getBudgets, getBudgetComparison } from "../../services/api";
import { AccountType, type Account, type CreditCard } from "../../types/account";
import { TransactionCategory, type Transaction } from "../../types/transaction";
import { EQUITY_TYPES } from "../../types/equity";
import type { Equity } from "../../types/equity";
import type { Budget, BudgetComparison } from "../../types/budget";
import type { Page } from "../../types/navigation";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

// Helper to parse UTC date string as local date (ignoring time)
// This prevents timezone shifts (e.g. 2025-12-01T00:00:00Z becoming 2025-11-30 in UTC-3)
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const chartConfig = {
  income: {
    label: "Receitas",
    color: "#009FE3", // brand blue
  },
  expense: {
    label: "Despesas",
    color: "#ef4444", // red-500
  },
};

// Config keys must match the data keys (which are the group names)
// We normalize them to be safe, but here we will use the exact group strings as keys
// or we can map them. Let's use the exact strings from EQUITY_TYPES groups.
const equityConfig: Record<string, { label: string; color: string }> = {
  value: {
    label: "Patrimônio",
    color: "#009FE3",
  },
  'Imóveis': {
    label: "Imóveis",
    color: "#009FE3",
  },
  'Veículos': {
    label: "Veículos",
    color: "#007bb3",
  },
  'Investimentos': {
    label: "Investimentos",
    color: "#33b2e9",
  },
  'Liquidez': {
    label: "Liquidez",
    color: "#005f9e",
  },
  'Bens Pessoais': {
    label: "Bens Pessoais",
    color: "#66c5ee",
  },
  'Participações': {
    label: "Participações",
    color: "#008b9e",
  },
  'Outros': {
    label: "Outros",
    color: "#99d9f4",
  }
};

const investmentConfig = {
  value: {
    label: "Saldo Atual",
    color: "#009FE3",
  },
  cost: {
    label: "Total Investido",
    color: "#3b82f6",
  },
};

const GROUP_COLORS: Record<string, string> = {
  'Imóveis': "#009FE3", // Base
  'Veículos': "#007bb3", // Darker
  'Investimentos': "#33b2e9", // Lighter
  'Liquidez': "#005f9e", // Indigo-ish
  'Bens Pessoais': "#66c5ee", // Even lighter
  'Participações': "#008b9e", // Teal-ish
  'Outros': "#99d9f4", // Very light
};

export function Summary({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
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
          getBudgets(currentYear, currentMonth)
        ]);
        
        setAccounts(accData);
        setTransactions(txData);
        setEquities(eqData);
        setCards(cardsData);
        setBudgets(budgetsData);
        
        // Carregar comparações de orçamentos
        const comparisonsData: Record<string, BudgetComparison> = {};
        for (const budget of budgetsData) {
          try {
            const comparison = await getBudgetComparison(budget.id);
            comparisonsData[budget.id] = comparison;
          } catch (error) {
            console.error(`Erro ao carregar comparação do orçamento ${budget.id}:`, error);
          }
        }
        setBudgetComparisons(comparisonsData);
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
    return <div className="p-8 text-center">Carregando dashboard...</div>;
  }

  // --- Calculations ---

  const currentDate = new Date();
  const prevMonthStart = startOfMonth(subMonths(currentDate, 1));

  // 1. Cards Data
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const walletBalance = accounts.filter(a => a.type === AccountType.WALLET).reduce((sum, acc) => sum + acc.balance, 0);
  const bankBalance = totalBalance - walletBalance;

  const currentMonthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), currentDate));
  const prevMonthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), prevMonthStart));

  const currentIncome = currentMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = currentMonthTxs.filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT).reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = prevMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevMonthTxs.filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT).reduce((sum, t) => sum + t.amount, 0);

  const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

  // 2. Cash Flow Chart (Last 6 months)
  const cashFlowData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentDate, i);
    const monthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), date));
    return {
      month: format(date, 'MMM', { locale: ptBR }),
      income: monthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTxs.filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT).reduce((sum, t) => sum + t.amount, 0),
      date: date // for sorting
    };
  }).reverse();

  // 3. Equity Evolution (Last 6 months)
  const equityEvolutionData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentDate, i);
    const monthEnd = endOfMonth(date);
    
    const value = equities
      .filter(e => isBefore(parseUTCDate(e.acquisitionDate), monthEnd))
      .reduce((sum, e) => sum + e.value, 0);

    return {
      month: format(date, 'MMM', { locale: ptBR }),
      value,
      date: date
    };
  }).reverse();

  // 4. Equity Composition
  const equityCompositionMap = equities.reduce((acc, item) => {
    const typeInfo = EQUITY_TYPES.find(t => t.value === item.type);
    const group = typeInfo?.group || 'Outros';
    acc[group] = (acc[group] || 0) + item.value;
    return acc;
  }, {} as Record<string, number>);

  const equityCompositionData = Object.entries(equityCompositionMap).map(([name, value]) => ({
    name, // This matches the keys in equityConfig (e.g., 'Imóveis')
    value,
    fill: GROUP_COLORS[name] || GROUP_COLORS['Outros']
  }));

  // 5. Investment Allocation
  const investmentEquities = equities.filter(e => {
    const typeInfo = EQUITY_TYPES.find(t => t.value === e.type);
    return typeInfo?.group === 'Investimentos';
  });

  const totalInvestedCost = investmentEquities.reduce((sum, e) => sum + (e.cost || e.value), 0);
  const totalInvestedValue = investmentEquities.reduce((sum, e) => sum + e.value, 0);

  const investmentAllocationMap = investmentEquities.reduce((acc, item) => {
    const typeInfo = EQUITY_TYPES.find(t => t.value === item.type);
    const label = typeInfo?.label || item.type;
    acc[label] = (acc[label] || 0) + item.value;
    return acc;
  }, {} as Record<string, number>);

  // Generate colors for investments
  const investmentColors = ["#009FE3", "#007bb3", "#33b2e9", "#005f9e", "#66c5ee", "#008b9e"];
  
  const investmentAllocationData = Object.entries(investmentAllocationMap).map(([name, value], index) => ({
    name,
    value,
    fill: investmentColors[index % investmentColors.length]
  }));

  // Create dynamic config for investments to ensure legends work
  const dynamicInvestmentConfig: Record<string, { label: string; color: string }> = {};
  investmentAllocationData.forEach((item) => {
    dynamicInvestmentConfig[item.name] = {
      label: item.name,
      color: item.fill
    };
  });

  // 6. Invested Balance Evolution
  const investedBalanceData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentDate, i);
    const monthEnd = endOfMonth(date);
    
    const value = equities
      .filter(e => {
        const typeInfo = EQUITY_TYPES.find(t => t.value === e.type);
        return typeInfo?.group === 'Investimentos' && isBefore(parseUTCDate(e.acquisitionDate), monthEnd);
      })
      .reduce((sum, e) => sum + e.value, 0);

    return {
      month: format(date, 'MMM', { locale: ptBR }),
      value,
      date: date
    };
  }).reverse();


  // 7. Upcoming Bills (Next 7 days)
  const upcomingBills = transactions
    .filter(t => {
      const date = parseUTCDate(t.date);
      const diffTime = date.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return t.type === 'EXPENSE' && diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // 8. Credit Card Usage
  const cardUsageData = cards.map(card => ({
    name: card.name,
    used: card.limitUsed || 0,
    available: card.limit - (card.limitUsed || 0),
    limit: card.limit
  }));

  // 9. Expenses by Category (Current Month)
  const expensesByCategoryMap = currentMonthTxs
    .filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT)
    .reduce((acc, t) => {
      const category = t.category;
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const CATEGORY_COLORS: Record<string, string> = {
    'HOUSING': "#009FE3", // Base Blue
    'TRANSPORT': "#007bb3", // Darker Blue
    'FOOD': "#33b2e9", // Lighter Blue
    'UTILITIES': "#005f9e", // Indigo Blue
    'HEALTHCARE': "#66c5ee", // Even Lighter Blue
    'ENTERTAINMENT': "#008b9e", // Teal Blue
    'EDUCATION': "#99d9f4", // Very Light Blue
    'SHOPPING': "#5f8a9e", // Greyish Blue
    'OTHER_EXPENSE': "#ccecf9", // Pale Blue
  };

  const CATEGORY_LABELS: Record<string, string> = {
    'HOUSING': 'Moradia',
    'TRANSPORT': 'Transporte',
    'FOOD': 'Alimentação',
    'UTILITIES': 'Utilidades',
    'HEALTHCARE': 'Saúde',
    'ENTERTAINMENT': 'Lazer',
    'EDUCATION': 'Educação',
    'SHOPPING': 'Compras',
    'OTHER_EXPENSE': 'Outros',
    'INVESTMENT': 'Investimento'
  };

  const expensesByCategoryData = Object.entries(expensesByCategoryMap)
    .map(([name, value]) => ({ 
      name, 
      label: CATEGORY_LABELS[name] || name,
      value,
      fill: CATEGORY_COLORS[name] || CATEGORY_COLORS['OTHER_EXPENSE'] || "#71717a"
    }))
    .sort((a, b) => b.value - a.value);
    
  const categoryConfig: Record<string, { label: string; color: string }> = {};
  expensesByCategoryData.forEach(item => {
      categoryConfig[item.name] = { label: item.label, color: item.fill };
  });

  // 10. Recent Transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="w-full p-3 md:p-8 space-y-4 md:space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-1 md:space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Resumo Financeiro</h2>
        <p className="text-sm md:text-base text-muted-foreground">Acompanhe o fluxo do seu patrimônio.</p>
      </div>

      {/* First Steps Onboarding */}
      {(accounts.length === 0 || cards.length === 0) && transactions.length === 0 ? (
        <div className="space-y-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Bem-vindo ao Cérebro das Finanças! 👋
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-700">
                Vamos começar com os primeiros passos para você controlar melhor suas finanças.
              </p>

              <div className="space-y-4">
                {/* Passo 1: Criar Conta/Cartão */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    {accounts.length > 0 || cards.length > 0 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">1. Criar uma Conta ou Cartão</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Comece adicionando uma conta bancária ou cartão de crédito para controlar seus recursos.
                    </p>
                    {accounts.length === 0 && cards.length === 0 && (
                      <Button onClick={() => onNavigate?.('accounts-new')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1">
                        <Plus className="h-3 w-3" />
                        Adicionar Conta/Cartão
                      </Button>
                    )}
                  </div>
                </div>

                {/* Passo 2: Registrar Transações */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    {transactions.length > 0 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">2. Registrar Suas Transações</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Adicione suas receitas e despesas para começar a acompanhar seu fluxo de caixa.
                    </p>
                    {(accounts.length > 0 || cards.length > 0) && transactions.length === 0 && (
                      <Button onClick={() => onNavigate?.('transactions-new')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1">
                        <Plus className="h-3 w-3" />
                        Nova Transação
                      </Button>
                    )}
                  </div>
                </div>

                {/* Passo 3: Adicionar Patrimônio (Opcional) */}
                <div className="flex gap-4 items-start opacity-60">
                  <div className="flex-shrink-0">
                    {equities.length > 0 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">3. Adicionar Patrimônio (Opcional)</h4>
                    <p className="text-sm text-gray-600">
                      Registre seus imóveis, investimentos e outros bens para visualizar sua riqueza total.
                    </p>
                  </div>
                </div>

                {/* Passo 4: Definir Metas (Opcional) */}
                <div className="flex gap-4 items-start opacity-60">
                  <div className="flex-shrink-0">
                    <Circle className="h-6 w-6 text-gray-400 mt-1" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">4. Definir Metas de Economia (Opcional)</h4>
                    <p className="text-sm text-gray-600">
                      Crie objetivos de poupança e acompanhe seu progresso ao longo do tempo.
                    </p>
                  </div>
                </div>

                {/* Passo 5: Criar Orçamentos (Opcional) */}
                <div className="flex gap-4 items-start opacity-60">
                  <div className="flex-shrink-0">
                    {budgets.length > 0 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">5. Criar Orçamentos (Opcional)</h4>
                    <p className="text-sm text-gray-600">
                      Defina limites de gastos por categoria para controlar melhor seu dinheiro.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
      {/* Alerts Section */}
      {upcomingBills.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {upcomingBills.map(bill => (
            <Alert key={bill.id} className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Conta a vencer</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {bill.description} - R$ {bill.amount.toFixed(2)} <br/>
                Vence em {format(parseUTCDate(bill.date), "dd/MM")}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-[#009FE3]" />
                Saldo atual disponível
              </p>
              {walletBalance > 0 && (
                 <p className="text-xs text-muted-foreground">
                   (Em conta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bankBalance)} | 
                   Dinheiro: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(walletBalance)})
                 </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-[#009FE3]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentIncome)}
            </div>
            <p className={`text-xs mt-1 ${incomeChange >= 0 ? 'text-[#009FE3]' : 'text-red-600'}`}>
              {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentExpense)}
            </div>
            <p className={`text-xs mt-1 ${expenseChange <= 0 ? 'text-[#009FE3]' : 'text-red-600'}`}>
              {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Fluxo de Caixa (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[250px] md:h-[350px] w-full">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="expense"
                  type="natural"
                  fill="url(#fillExpense)"
                  fillOpacity={0.4}
                  stroke="var(--color-expense)"
                  stackId="a"
                />
                <Area
                  dataKey="income"
                  type="natural"
                  fill="url(#fillIncome)"
                  fillOpacity={0.4}
                  stroke="var(--color-income)"
                  stackId="b"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Uso de Cartões de Crédito</CardTitle>
          </CardHeader>
          <CardContent>
             {cardUsageData.length > 0 ? (
               <div className="space-y-6">
                 {cardUsageData.map((card) => (
                   <div key={card.name} className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-2">
                         <CreditCardIcon className="h-4 w-4 text-gray-500" />
                         <span className="font-medium">{card.name}</span>
                       </div>
                       <span className="text-muted-foreground">
                         {Math.round((card.used / card.limit) * 100)}% usado
                       </span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-[#009FE3] transition-all duration-500"
                         style={{ width: `${Math.min((card.used / card.limit) * 100, 100)}%` }}
                       />
                     </div>
                     <div className="flex justify-between text-xs text-muted-foreground">
                       <span>R$ {card.used.toFixed(2)}</span>
                       <span>Limite: R$ {card.limit.toFixed(2)}</span>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                 Nenhum cartão cadastrado
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-[#009FE3]/10 text-[#009FE3]' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'INCOME' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{format(parseUTCDate(t.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className={`font-medium ${t.type === 'INCOME' ? 'text-[#009FE3]' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategoryData.length > 0 ? (
              <ChartContainer config={categoryConfig} className="mx-auto aspect-square max-h-[250px] md:max-h-[300px]">
                <PieChart>
                  <Pie
                    data={expensesByCategoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {expensesByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma despesa este mês
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Evolução Patrimonial</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={equityConfig} className="h-[250px] md:h-[300px] w-full">
              <AreaChart data={equityEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area
                  dataKey="value"
                  type="monotone"
                  fill="url(#fillEquity)"
                  fillOpacity={0.4}
                  stroke="var(--color-value)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Composição do Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            {equityCompositionData.length > 0 ? (
              <ChartContainer config={equityConfig} className="mx-auto aspect-square max-h-[250px] md:max-h-[300px]">
                <PieChart>
                  <Pie
                    data={equityCompositionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {equityCompositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum patrimônio cadastrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budgets Section */}
      {budgets.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Orçamentos do Mês
          </h3>

          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {budgets.slice(0, 4).map((budget) => {
              const comparison = budgetComparisons[budget.id];
              const percentage = comparison ? (comparison.spent / budget.amount) * 100 : 0;
              const isOverBudget = comparison && comparison.spent > budget.amount;
              
              return (
                <Card key={budget.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{budget.name}</CardTitle>
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        isOverBudget ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      )}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>R$ {comparison?.spent.toFixed(2) || '0.00'}</span>
                      <span>R$ {budget.amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          percentage <= 50 ? 'bg-green-500' :
                          percentage <= 75 ? 'bg-yellow-500' :
                          percentage <= 100 ? 'bg-orange-500' :
                          'bg-red-500'
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <p className={cn(
                      'text-xs text-right',
                      comparison?.remaining || 0 >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {comparison?.remaining && comparison.remaining >= 0 ? '+' : ''}R$ {comparison?.remaining.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-4">Investimentos</h3>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
           <Card className="shadow-sm">
             <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Investido</CardTitle></CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvestedCost)}</div>
               <p className="text-xs text-muted-foreground">Custo de aquisição</p>
             </CardContent>
           </Card>
           <Card className="shadow-sm">
             <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saldo Atual</CardTitle></CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvestedValue)}</div>
               <p className="text-xs text-muted-foreground">Valor de mercado</p>
             </CardContent>
           </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Alocação por Classe</CardTitle>
            </CardHeader>
            <CardContent>
              {investmentAllocationData.length > 0 ? (
                <ChartContainer config={dynamicInvestmentConfig} className="mx-auto aspect-square max-h-[250px] md:max-h-[300px]">
                  <PieChart>
                    <Pie
                      data={investmentAllocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {investmentAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum investimento cadastrado
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Evolução do Saldo Investido</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={investmentConfig} className="min-h-[250px] md:min-h-[300px] w-full">
                <AreaChart data={investedBalanceData}>
                  <defs>
                    <linearGradient id="fillInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${value/1000}k`}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area
                    dataKey="value"
                    type="monotone"
                    fill="url(#fillInvested)"
                    fillOpacity={0.4}
                    stroke="var(--color-value)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../../components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell, YAxis } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp } from "lucide-react";
import { accountService } from "../../services/accounts";
import { transactionService } from "../../services/transactions";
import { equityService } from "../../services/equities";
import type { Account } from "../../types/account";
import { TransactionCategory, type Transaction } from "../../types/transaction";
import { EQUITY_TYPES } from "../../types/equity";
import type { Equity } from "../../types/equity";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const chartConfig = {
  income: {
    label: "Receitas",
    color: "#10b981", // emerald-500
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
    color: "#4f46e5",
  },
  'Imóveis': {
    label: "Imóveis",
    color: "#4f46e5",
  },
  'Veículos': {
    label: "Veículos",
    color: "#2563eb",
  },
  'Investimentos': {
    label: "Investimentos",
    color: "#10b981",
  },
  'Liquidez': {
    label: "Liquidez",
    color: "#f59e0b",
  },
  'Bens Pessoais': {
    label: "Bens Pessoais",
    color: "#8b5cf6",
  },
  'Participações': {
    label: "Participações",
    color: "#db2777",
  },
  'Outros': {
    label: "Outros",
    color: "#71717a",
  }
};

const investmentConfig = {
  value: {
    label: "Saldo Atual",
    color: "#10b981",
  },
  cost: {
    label: "Total Investido",
    color: "#3b82f6",
  },
};

const GROUP_COLORS: Record<string, string> = {
  'Imóveis': "#4f46e5",
  'Veículos': "#2563eb",
  'Investimentos': "#10b981",
  'Liquidez': "#f59e0b",
  'Bens Pessoais': "#8b5cf6",
  'Participações': "#db2777",
  'Outros': "#71717a",
};

export function Summary() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accData, txData, eqData] = await Promise.all([
          accountService.getAll(),
          transactionService.getAll(),
          equityService.getAll()
        ]);
        setAccounts(accData);
        setTransactions(txData);
        setEquities(eqData);
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

  const currentMonthTxs = transactions.filter(t => isSameMonth(parseISO(t.date), currentDate));
  const prevMonthTxs = transactions.filter(t => isSameMonth(parseISO(t.date), prevMonthStart));

  const currentIncome = currentMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = currentMonthTxs.filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT).reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = prevMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevMonthTxs.filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT).reduce((sum, t) => sum + t.amount, 0);

  const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

  // 2. Cash Flow Chart (Last 6 months)
  const cashFlowData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentDate, i);
    const monthTxs = transactions.filter(t => isSameMonth(parseISO(t.date), date));
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
      .filter(e => isBefore(parseISO(e.acquisitionDate), monthEnd))
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
  const investmentColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6366f1", "#ec4899"];
  
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
        return typeInfo?.group === 'Investimentos' && isBefore(parseISO(e.acquisitionDate), monthEnd);
      })
      .reduce((sum, e) => sum + e.value, 0);

    return {
      month: format(date, 'MMM', { locale: ptBR }),
      value,
      date: date
    };
  }).reverse();


  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Resumo Financeiro</h2>
        <p className="text-muted-foreground">Acompanhe o fluxo do seu patrimônio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Contas</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              Saldo atual disponível
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentIncome)}
            </div>
            <p className={`text-xs mt-1 ${incomeChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
            <p className={`text-xs mt-1 ${expenseChange <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4 shadow-sm">
        <CardHeader>
          <CardTitle>Fluxo de Caixa (Últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Evolução Patrimonial</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={equityConfig} className="h-[300px] w-full">
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

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Composição do Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            {equityCompositionData.length > 0 ? (
              <ChartContainer config={equityConfig} className="mx-auto aspect-square max-h-[300px]">
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
                <ChartContainer config={dynamicInvestmentConfig} className="mx-auto aspect-square max-h-[300px]">
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
              <ChartContainer config={investmentConfig} className="min-h-[300px] w-full">
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
    </div>
  );
}

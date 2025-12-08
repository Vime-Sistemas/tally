import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../../components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell, YAxis } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp } from "lucide-react";

const chartData = [
  { month: "Jan", income: 5000, expense: 3200 },
  { month: "Fev", income: 4800, expense: 4100 },
  { month: "Mar", income: 6000, expense: 3500 },
  { month: "Abr", income: 5500, expense: 2900 },
  { month: "Mai", income: 7000, expense: 4500 },
  { month: "Jun", income: 6200, expense: 3800 },
  { month: "Jul", income: 7500, expense: 4200 },
];

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

const equityEvolutionData = [
  { month: "Jan", value: 680000 },
  { month: "Fev", value: 695000 },
  { month: "Mar", value: 710000 },
  { month: "Abr", value: 705000 },
  { month: "Mai", value: 725000 },
  { month: "Jun", value: 740000 },
  { month: "Jul", value: 750000 },
];

const equityCompositionData = [
  { name: "imoveis", value: 450000, color: "#4f46e5" }, // indigo-600
  { name: "veiculos", value: 180000, color: "#2563eb" }, // blue-600
  { name: "investimentos", value: 70000, color: "#10b981" }, // emerald-500
  { name: "liquidez", value: 50000, color: "#f59e0b" }, // amber-500
];

const equityConfig = {
  value: {
    label: "Patrimônio",
    color: "#4f46e5",
  },
  imoveis: {
    label: "Imóveis",
    color: "#4f46e5",
  },
  veiculos: {
    label: "Veículos",
    color: "#2563eb",
  },
  investimentos: {
    label: "Investimentos",
    color: "#10b981",
  },
  liquidez: {
    label: "Liquidez",
    color: "#f59e0b",
  },
};

const investmentAllocationData = [
  { name: "Renda Fixa", value: 45, color: "#3b82f6" }, // blue-500
  { name: "Ações BR", value: 25, color: "#10b981" }, // emerald-500
  { name: "FIIs", value: 15, color: "#f59e0b" }, // amber-500
  { name: "Stocks", value: 10, color: "#8b5cf6" }, // violet-500
  { name: "Cripto", value: 5, color: "#6366f1" }, // indigo-500
];

const investedBalanceData = [
  { month: "Jan", value: 15000 },
  { month: "Fev", value: 16200 },
  { month: "Mar", value: 17500 },
  { month: "Abr", value: 17100 },
  { month: "Mai", value: 18500 },
  { month: "Jun", value: 19800 },
];

const investmentConfig = {
  value: {
    label: "Saldo Investido",
    color: "#10b981",
  },
};

export function Summary() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Resumo Financeiro</h2>
        <p className="text-muted-foreground">Acompanhe o fluxo do seu patrimônio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.450,00</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              +20.1% este mês
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 6.200,00</div>
            <p className="text-xs text-muted-foreground mt-1">+12% vs mês anterior</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 3.800,00</div>
            <p className="text-xs text-muted-foreground mt-1">-4% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4 shadow-sm">
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                tickFormatter={(value) => value.slice(0, 3)}
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
                  tickFormatter={(value) => value.slice(0, 3)}
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-4">Investimentos</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Alocação por Classe</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="mx-auto aspect-square max-h-[300px]">
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
                </PieChart>
              </ChartContainer>
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

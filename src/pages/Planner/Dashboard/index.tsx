import { useState, useEffect } from "react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target,
  CreditCard,
  Landmark
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardStats {
  totalClients: number;
  pendingRequests: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalInvestments: number;
  goals: {
    total: number;
    completed: number;
  };
}

interface RecentActivity {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  user: {
    name: string;
    picture?: string;
  };
  categoryModel?: {
    name: string;
    color: string;
  };
}

interface AllocationData {
  name: string;
  value: number;
}

interface CashFlowData {
  date: string;
  income: number;
  expense: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function PlannerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [allocation, setAllocation] = useState<AllocationData[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, activityRes, allocationRes, cashFlowRes] = await Promise.all([
          api.get('/planner/dashboard/stats'),
          api.get('/planner/dashboard/recent-activity'),
          api.get('/planner/dashboard/allocation'),
          api.get('/planner/dashboard/cashflow')
        ]);
        setStats(statsRes.data);
        setRecentActivity(activityRes.data);
        setAllocation(allocationRes.data);
        setCashFlow(cashFlowRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Visão Geral</h1>
        <p className="text-zinc-500 mt-1">Acompanhe o desempenho consolidado da sua carteira de clientes.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Patrimônio Líquido</CardTitle>
            <Landmark className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {stats?.netWorth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Ativos - Passivos
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Investimentos (AUM)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {stats?.totalInvestments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Equity + Contas de Investimento
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Passivo Total</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {stats?.totalLiabilities.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Dívidas + Faturas de Cartão
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Metas dos Clientes</CardTitle>
            <Target className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {stats?.goals.completed} <span className="text-sm font-normal text-zinc-400">/ {stats?.goals.total}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Metas concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Cash Flow Chart */}
        <Card className="col-span-4 border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>Fluxo de Caixa Global</CardTitle>
            <CardDescription>Entradas e saídas consolidadas dos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value + '-01'), 'MMM', { locale: ptBR })}
                    stroke="#a1a1aa"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#a1a1aa"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Allocation Chart */}
        <Card className="col-span-3 border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>Alocação de Ativos</CardTitle>
            <CardDescription>Distribuição do patrimônio por tipo.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              {allocation.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocation.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                  Sem dados suficientes para exibir o gráfico.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas movimentações dos clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">Nenhuma atividade recente.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg bg-zinc-50/50 border border-zinc-100">
                    <Avatar className="h-10 w-10 border border-zinc-200">
                      <AvatarImage src={activity.user.picture} alt={activity.user.name} />
                      <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{activity.user.name}</p>
                        <span className={cn(
                          "text-xs font-medium",
                          activity.type === 'EXPENSE' ? "text-red-600" : "text-emerald-600"
                        )}>
                          {activity.type === 'EXPENSE' ? '-' : '+'} {activity.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1">{activity.description}</p>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="text-[10px] h-5 font-normal bg-white border-zinc-200">
                          {activity.categoryModel?.name || 'Sem categoria'}
                        </Badge>
                        <span className="text-[10px] text-zinc-400">
                          {format(new Date(activity.date), "d MMM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

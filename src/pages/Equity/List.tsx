import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { EquityCardMenu } from "../../components/EquityCardMenu";
import { EditEquityDialog } from "../../components/EditEquityDialog";
import { cn } from "../../lib/utils";
import { equityService } from "../../services/equities";
import { transactionService } from "../../services/transactions";
import type { Page } from "../../types/navigation";
import { type Equity, type EquityType, EQUITY_TYPES } from "../../types/equity";
import type { Transaction } from "../../types/transaction";
import { useUser } from "../../contexts/UserContext";
import { formatCurrency } from "../../utils/formatters";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpCircle,
  Landmark,
  Layers,
  LineChart,
  Plus,
  TrendingUp,
  Wallet,
  CalendarDays,
} from "lucide-react";

const accentTokens = {
  blue: {
    badge: "bg-blue-50 text-blue-500",
    chip: "bg-blue-100 text-blue-600",
    stroke: "#2563eb",
    fill: "rgba(37, 99, 235, 0.08)",
    pie: ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6"],
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-500",
    chip: "bg-emerald-100 text-emerald-600",
    stroke: "#059669",
    fill: "rgba(5, 150, 105, 0.08)",
    pie: ["#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981"],
  },
} as const;

const getEquityGroup = (type: EquityType) => {
  const match = EQUITY_TYPES.find((item) => item.value === type);
  return match?.group || "Outros";
};

interface EquityListProps {
  onNavigate: (page: Page) => void;
}

export function EquityList({ onNavigate }: EquityListProps) {
  const { user } = useUser();
  const accent: "blue" | "emerald" = user?.type === "PLANNER" ? "emerald" : "blue";
  const palette = accentTokens[accent];

  const [equities, setEquities] = useState<Equity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEquity, setEditingEquity] = useState<Equity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Equity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEquities();
  }, []);

  const loadEquities = async () => {
    try {
      const [equityData, transactionData] = await Promise.all([
        equityService.getAll(),
        transactionService.getAll(),
      ]);
      setEquities(equityData);
      setTransactions(transactionData);
    } catch (error) {
      console.error("Failed to load equities:", error);
      toast.error("Erro ao carregar patrimônio");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await equityService.delete(deleteConfirm.id);
      toast.success("Item removido com sucesso!");
      setEquities((prev) => prev.filter((item) => item.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Erro ao remover item");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalValue = useMemo(() => equities.reduce((sum, item) => sum + item.value, 0), [equities]);
  const investedCapital = useMemo(
    () => equities.reduce((sum, item) => sum + (item.cost || 0), 0),
    [equities]
  );
  const netGain = totalValue - investedCapital;
  const netGainPct = investedCapital > 0 ? (netGain / investedCapital) * 100 : 0;
  const avgTicket = equities.length > 0 ? totalValue / equities.length : 0;

  const investmentTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.category === "INVESTMENT" || Boolean(tx.equityId)
      ),
    [transactions]
  );

  const monthlyFlows = useMemo(() => {
    const base = startOfMonth(new Date());
    return Array.from({ length: 6 }).map((_, index) => {
      const monthDate = subMonths(base, 5 - index);
      const rangeStart = startOfMonth(monthDate);
      const rangeEnd = endOfMonth(monthDate);
      const monthTxs = investmentTransactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= rangeStart && txDate <= rangeEnd;
      });
      const contributions = monthTxs
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const withdrawals = monthTxs
        .filter((tx) => tx.type === "INCOME")
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        month: format(monthDate, "MMM", { locale: ptBR }).toUpperCase(),
        contributions,
        withdrawals,
        net: contributions - withdrawals,
      };
    });
  }, [investmentTransactions]);

  const avgContribution = monthlyFlows.length
    ? monthlyFlows.reduce((sum, item) => sum + item.contributions, 0) /
      monthlyFlows.length
    : 0;

  const allocationChartData = useMemo(() => {
    const groupMap: Record<string, number> = {};
    equities.forEach((eq) => {
      const group = getEquityGroup(eq.type);
      groupMap[group] = (groupMap[group] || 0) + eq.value;
    });
    return Object.entries(groupMap)
      .map(([label, value], index) => ({
        name: label,
        value,
        fill: palette.pie[index % palette.pie.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [equities, palette.pie]);

  const allocationConfig = useMemo(
    () =>
      allocationChartData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
      }, {} as Record<string, { label: string; color: string }>),
    [allocationChartData]
  );

  const holdings = useMemo(
    () => equities.slice().sort((a, b) => b.value - a.value),
    [equities]
  );

  const recentMovements = useMemo(
    () =>
      investmentTransactions
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [investmentTransactions]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Carregando patrimônio...</div>
      </div>
    );
  }

  const flowConfig = {
    contributions: { label: "Aportes", color: palette.stroke },
    withdrawals: { label: "Resgates", color: "#d4d4d8" },
  } as const;

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Investimentos & Patrimônio</h1>
            <p className="text-zinc-500">Consolide aportes, resgates e performance sem sair do Tally.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn("px-3 py-1.5 rounded-full", palette.badge)}>
              Carteira ativa · {equities.length} itens
            </Badge>
            <Button
              className="rounded-2xl bg-blue-400 text-white hover:bg-blue-500"
              onClick={() => onNavigate("equity-new")}
            >
              <Plus className="h-4 w-4" />
              Novo ativo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-zinc-500">Valor Atual</CardTitle>
              <Landmark className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-900">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-zinc-400 mt-1">Baseado em avaliações mais recentes</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-zinc-500">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-zinc-900">{formatCurrency(netGain)}</p>
                <span className={cn("text-sm font-medium", netGain >= 0 ? palette.chip : "text-zinc-400")}>{netGainPct.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">Comparado ao capital investido</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-zinc-500">Ticket Médio</CardTitle>
              <Layers className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-900">{formatCurrency(avgTicket)}</p>
              <p className="text-sm text-zinc-400 mt-1">Distribuição entre {equities.length || 0} posições</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-zinc-500">Aporte Médio (6M)</CardTitle>
              <Wallet className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-900">{formatCurrency(avgContribution)}</p>
              <p className="text-sm text-zinc-400 mt-1">Somente aportes categorizados como investimento</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="col-span-4 rounded-3xl border-zinc-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Fluxo de Aportes</p>
                <CardTitle className="text-lg text-zinc-900">Últimos 6 meses</CardTitle>
              </div>
              <LineChart className="h-5 w-5 text-zinc-300" />
            </CardHeader>
            <CardContent className="pl-0">
              <ChartContainer config={flowConfig} className="h-[260px]">
                <AreaChart data={monthlyFlows} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`investmentFill-${accent}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.stroke} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={palette.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area type="monotone" dataKey="contributions" stroke={palette.stroke} strokeWidth={2} fill={`url(#investmentFill-${accent})`} />
                  <Area type="monotone" dataKey="withdrawals" stroke="#d4d4d8" strokeWidth={2} fill="rgba(212,212,216,0.2)" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3 rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Alocação</p>
                <CardTitle className="text-lg text-zinc-900">Por Classe</CardTitle>
              </div>
              <ArrowUpCircle className="h-5 w-5 text-zinc-300" />
            </CardHeader>
            <CardContent>
              {allocationChartData.length > 0 ? (
                <ChartContainer config={allocationConfig} className="h-[240px]">
                  <PieChart>
                    <Pie
                      data={allocationChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {allocationChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} stroke="white" strokeWidth={1} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend
                      content={<ChartLegendContent />}
                      className="flex-wrap gap-2 text-zinc-500 justify-center"
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-zinc-400 text-sm">
                  Cadastre um ativo para ver a distribuição
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="col-span-4 rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Holdings</p>
                <CardTitle className="text-lg text-zinc-900">Detalhes da Carteira</CardTitle>
              </div>
              <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900" onClick={() => onNavigate("equity-new")}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs uppercase tracking-widest text-zinc-400">
                    <TableHead>Ativo</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Investido</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.length > 0 ? (
                    holdings.map((item) => {
                      const gain = item.value - (item.cost || 0);
                      const gainPct = item.cost ? (gain / item.cost) * 100 : 0;
                      return (
                        <TableRow key={item.id} className="text-sm">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-900">{item.name}</span>
                              <span className="text-xs text-zinc-400">{format(new Date(item.acquisitionDate), "dd MMM yyyy", { locale: ptBR })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs bg-zinc-50 text-zinc-500">
                              {getEquityGroup(item.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-zinc-900">{formatCurrency(item.value)}</TableCell>
                          <TableCell>{formatCurrency(item.cost || 0)}</TableCell>
                          <TableCell>
                            <span className={cn("font-semibold", gain >= 0 ? "text-zinc-900" : "text-zinc-400")}>{formatCurrency(gain)}</span>
                            <span className="text-xs text-zinc-400 ml-2">{gainPct.toFixed(1)}%</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <EquityCardMenu
                              onEdit={() => setEditingEquity(item)}
                              onDelete={() => setDeleteConfirm(item)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                        Nenhum ativo cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="col-span-3 rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Movimentações</p>
                <CardTitle className="text-lg text-zinc-900">Últimos registros</CardTitle>
              </div>
              <CalendarDays className="h-5 w-5 text-zinc-300" />
            </CardHeader>
            <CardContent className="space-y-4">
              {recentMovements.length > 0 ? (
                recentMovements.map((movement) => {
                  const isContribution = movement.type === "EXPENSE";
                  return (
                    <div key={movement.id} className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {movement.description || "Movimentação"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {format(new Date(movement.date), "dd MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-semibold", isContribution ? palette.chip : "text-zinc-400")}> 
                          {isContribution ? "aplicação" : "resgate"}
                        </p>
                        <p className="text-base font-bold text-zinc-900">
                          {isContribution ? "+" : "-"} {formatCurrency(movement.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-zinc-400">Nenhuma movimentação recente</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingEquity && (
        <EditEquityDialog
          open={!!editingEquity}
          equity={editingEquity}
          onOpenChange={(open) => !open && setEditingEquity(null)}
          onSuccess={() => {
            loadEquities();
            setEditingEquity(null);
          }}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-3xl border-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação remove {deleteConfirm?.name} da sua carteira e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm text-zinc-500">Valor estimado</span>
            <span className="text-lg font-semibold text-zinc-900">{formatCurrency(deleteConfirm?.value || 0)}</span>
          </div>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel className="rounded-xl border-zinc-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
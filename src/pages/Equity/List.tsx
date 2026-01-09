import { useCallback, useEffect, useMemo, useState } from "react";
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
import { investmentService } from "../../services/investments";
import type { Page } from "../../types/navigation";
import { type Equity, type EquityType, EQUITY_TYPES } from "../../types/equity";
import type { InvestmentWorkspaceSnapshot } from "../../types/investments";
import { useUser } from "../../contexts/UserContext";
import { formatCurrency } from "../../utils/formatters";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
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

  const [snapshot, setSnapshot] = useState<InvestmentWorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingEquity, setEditingEquity] = useState<Equity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Equity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const data = await investmentService.getWorkspaceSnapshot();
      setSnapshot(data);
    } catch (error) {
      console.error("Failed to load investments workspace:", error);
      toast.error("Erro ao carregar dados de investimento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await equityService.delete(deleteConfirm.id);
      toast.success("Item removido com sucesso!");
      await loadWorkspace();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Erro ao remover item");
    } finally {
      setIsDeleting(false);
    }
  };
  const equities = snapshot?.equities ?? [];
  const holdings = snapshot?.holdings ?? [];
  const flows = snapshot?.flows ?? [];
  const allocationSlices = snapshot?.allocation ?? [];
  const totals = snapshot?.totals;
  const recentMovements = snapshot?.recentMovements ?? [];
  const equityMap = useMemo(() => new Map(equities.map((item) => [item.id, item])), [equities]);

  const totalValue = totals?.currentValue ?? 0;
  const investedCapital = totals?.investedCapital ?? 0;
  const netGain = totals?.netGain ?? 0;
  const netGainPct = totals?.netGainPct ?? 0;
  const avgTicket = totals?.averageTicket ?? 0;
  const coverageMultiple = investedCapital ? totalValue / investedCapital : 0;

  const monthlyFlows = flows;
  const allocationHighlights = allocationSlices.slice(0, 3);
  const lastFlow = monthlyFlows[monthlyFlows.length - 1];
  const previousFlow = monthlyFlows[monthlyFlows.length - 2];
  const netDelta = lastFlow && previousFlow ? lastFlow.net - previousFlow.net : 0;
  const netDeltaPct =
    lastFlow && previousFlow && previousFlow.net !== 0
      ? ((lastFlow.net - previousFlow.net) / Math.abs(previousFlow.net)) * 100
      : 0;
  const contributionDeltaPct =
    lastFlow && previousFlow && previousFlow.contributions !== 0
      ? ((lastFlow.contributions - previousFlow.contributions) / previousFlow.contributions) * 100
      : 0;

  const stackedFlowData = useMemo(
    () =>
      monthlyFlows.map((flow) => ({
        month: flow.month,
        aportes: flow.contributions,
        resgates: -flow.withdrawals,
      })),
    [monthlyFlows]
  );

  const netTrendData = useMemo(
    () =>
      monthlyFlows.map((flow) => ({
        month: flow.month,
        net: flow.net,
      })),
    [monthlyFlows]
  );

  const formatAxisValue = (value: number) =>
    Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;

  const formatSignedCurrency = (value: number) => {
    if (!value) return formatCurrency(0);
    const prefix = value > 0 ? "+" : "-";
    return `${prefix}${formatCurrency(Math.abs(value))}`;
  };

  const formatSignedPercent = (value: number) =>
    value === 0 ? "0%" : `${value > 0 ? "+" : "-"}${Math.abs(value).toFixed(1)}%`;

  const allocationChartData = useMemo(
    () =>
      allocationSlices.map((slice, index) => ({
        name: slice.label,
        value: slice.value,
        fill: palette.pie[index % palette.pie.length],
      })),
    [allocationSlices, palette.pie]
  );

  const allocationConfig = useMemo(
    () =>
      allocationChartData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
      }, {} as Record<string, { label: string; color: string }>),
    [allocationChartData]
  );

  const flowConfig = {
    contributions: { label: "Aportes", color: palette.stroke },
    withdrawals: { label: "Resgates", color: "#d4d4d8" },
  } as const;

  const stackedFlowConfig = {
    aportes: { label: "Aportes", color: palette.stroke },
    resgates: { label: "Resgates", color: "#a1a1aa" },
  } as const;

  const netTrendConfig = {
    net: { label: "Resultado", color: palette.stroke },
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Carregando patrimônio...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Investimentos & Patrimônio</h1>
            {allocationHighlights.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {allocationHighlights.map((slice) => {
                  const slicePct = totalValue ? (slice.value / totalValue) * 100 : 0;
                  return (
                    <Badge
                      key={slice.label}
                      className="rounded-full border border-zinc-100 bg-white text-xs font-semibold text-zinc-500"
                    >
                      {slice.label} · {slicePct.toFixed(1)}%
                    </Badge>
                  );
                })}
              </div>
            )}
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
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-2">
                <CardTitle className="text-sm text-zinc-500">Valor Atual</CardTitle>
                <Badge className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", netGain >= 0 ? palette.badge : "bg-zinc-100 text-zinc-500")}>
                  {formatSignedCurrency(netGain)} vs investido
                </Badge>
              </div>
              <Landmark className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-900">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-zinc-400 mt-1">Carteira viva com {equities.length || 0} posições</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-2">
                <CardTitle className="text-sm text-zinc-500">Capital Investido</CardTitle>
                <Badge className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-50 text-zinc-500">
                  Ticket médio {formatCurrency(avgTicket)}
                </Badge>
              </div>
              <Layers className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-900">{formatCurrency(investedCapital)}</p>
              <p className="text-sm text-zinc-400 mt-1">Cobertura de {coverageMultiple.toFixed(1)}x vs valor atual</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-2">
                <CardTitle className="text-sm text-zinc-500">Lucro Líquido</CardTitle>
                <Badge className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", netGainPct >= 0 ? palette.chip : "bg-zinc-100 text-zinc-500")}>
                  {formatSignedPercent(netGainPct)}
                </Badge>
              </div>
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-900">{formatCurrency(netGain)}</p>
              <p className="text-sm text-zinc-400 mt-1">Comparado ao capital aportado</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-2">
                <CardTitle className="text-sm text-zinc-500">Pulso do mês</CardTitle>
                <Badge className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-50 text-zinc-500">
                  {lastFlow ? `Mês ${lastFlow.month}` : "Sem histórico"}
                </Badge>
              </div>
              <Wallet className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Aportes</p>
                  <p className="text-lg font-semibold text-zinc-900">{formatCurrency(lastFlow?.contributions || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Resgates</p>
                  <p className="text-lg font-semibold text-zinc-900">{formatCurrency(lastFlow?.withdrawals || 0)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
                <p className="text-sm text-zinc-500">Variação mensal</p>
                <Badge className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", contributionDeltaPct >= 0 ? palette.badge : "bg-zinc-100 text-zinc-500")}>
                  {formatSignedPercent(contributionDeltaPct)} vs mês anterior
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-7">
          <Card className="col-span-3 rounded-3xl border-zinc-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Resultado líquido</p>
                <CardTitle className="text-lg text-zinc-900">Tendência</CardTitle>
              </div>
              <Badge className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", netDelta >= 0 ? palette.badge : "bg-zinc-100 text-zinc-500")}>
                {formatSignedCurrency(netDelta)} vs mês anterior
              </Badge>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="flex items-baseline gap-2 px-6 pb-4">
                <p className="text-3xl font-bold text-zinc-900">{formatCurrency(lastFlow?.net || 0)}</p>
                <Badge className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", netDeltaPct >= 0 ? palette.chip : "bg-zinc-100 text-zinc-500")}>
                  {formatSignedPercent(netDeltaPct)}
                </Badge>
              </div>
              <ChartContainer config={netTrendConfig} className="h-[200px]">
                <AreaChart data={netTrendData} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`netTrendFill-${accent}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.stroke} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={palette.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatAxisValue(Number(value))}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <ReferenceLine y={0} stroke="#e4e4e7" strokeDasharray="4 2" />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area type="monotone" dataKey="net" stroke={palette.stroke} strokeWidth={2} fill={`url(#netTrendFill-${accent})`} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="col-span-4 rounded-3xl border-zinc-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Fluxo empilhado</p>
                <CardTitle className="text-lg text-zinc-900">Aportes vs Resgates</CardTitle>
              </div>
              <Badge className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-50 text-zinc-500">Histórico 6M</Badge>
            </CardHeader>
            <CardContent className="pl-0">
              <ChartContainer config={stackedFlowConfig} className="h-[220px]">
                <BarChart data={stackedFlowData} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatAxisValue(Number(value))}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <ReferenceLine y={0} stroke="#e4e4e7" />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="aportes" stackId="flows" fill={palette.stroke} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="resgates" stackId="flows" fill="#a1a1aa" radius={[0, 0, 6, 6]} />
                </BarChart>
              </ChartContainer>
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
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatAxisValue(Number(value))}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
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
                    <TableHead>Peso</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.length > 0 ? (
                    holdings.map((item) => {
                      const equityRecord = equityMap.get(item.id);
                      const acquisitionDate = item.acquisitionDate
                        ? format(new Date(item.acquisitionDate), "dd MMM yyyy", { locale: ptBR })
                        : "";
                      const weight = totalValue ? (item.currentValue / totalValue) * 100 : 0;
                      return (
                        <TableRow key={item.id} className="text-sm">
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-900">{item.name}</span>
                                <Badge
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                    item.netGain >= 0 ? palette.chip : "bg-zinc-100 text-zinc-500"
                                  )}
                                >
                                  {item.netGain >= 0 ? "Em alta" : "Em ajuste"}
                                </Badge>
                              </div>
                              {acquisitionDate && (
                                <span className="text-xs text-zinc-400">{acquisitionDate}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs bg-zinc-50 text-zinc-500">
                              {getEquityGroup(item.type as EquityType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-zinc-900">{formatCurrency(item.currentValue)}</TableCell>
                          <TableCell>{formatCurrency(item.invested)}</TableCell>
                          <TableCell>
                            <Badge className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-50 text-zinc-500">
                              {weight.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={cn("font-semibold", item.netGain >= 0 ? "text-zinc-900" : "text-zinc-400")}>
                              {formatCurrency(item.netGain)}
                            </span>
                            <span className="text-xs text-zinc-400 ml-2">{item.netGainPct.toFixed(1)}%</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {equityRecord ? (
                              <EquityCardMenu
                                onEdit={() => setEditingEquity(equityRecord)}
                                onDelete={() => setDeleteConfirm(equityRecord)}
                              />
                            ) : (
                              <span className="text-xs text-zinc-400">Sem ações</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-zinc-400">
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
                  const linkedEquity = movement.equityId ? equityMap.get(movement.equityId) : null;
                  return (
                    <div key={movement.id} className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-900">
                            {movement.description || "Movimentação"}
                          </p>
                          <Badge className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", isContribution ? palette.badge : "bg-zinc-100 text-zinc-500")}>
                            {isContribution ? "Aporte" : "Resgate"}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {format(new Date(movement.date), "dd MMMM", { locale: ptBR })}
                          {linkedEquity && (
                            <span className="text-zinc-300"> · {linkedEquity.name}</span>
                          )}
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
            loadWorkspace();
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
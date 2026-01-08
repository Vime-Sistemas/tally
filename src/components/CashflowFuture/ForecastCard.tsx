import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/formatters';
import type { ForecastSummary, ForecastSummaryLine, WeeklyForecastPoint } from '../../types/cashflow';

interface ForecastCardProps {
  data: WeeklyForecastPoint[];
  summary: ForecastSummary;
  loading?: boolean;
  accent?: 'blue' | 'emerald';
}

const accentTokens = {
  blue: {
    text: 'text-blue-500',
    pill: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
    accent: '#2563eb',
  },
  emerald: {
    text: 'text-emerald-500',
    pill: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
    accent: '#059669',
  },
};

function SummaryRow({ line, accent }: { line: ForecastSummaryLine; accent: 'blue' | 'emerald' }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white/40 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-1">{line.title}</p>
        <p className={cn('text-2xl font-semibold text-zinc-900', accentTokens[accent].text)}>
          {formatCurrency(line.total)}
        </p>
      </div>
      <div className="flex flex-col gap-1 text-[11px] text-zinc-500">
        <Badge variant="outline" className="border-zinc-200 text-zinc-600">
          Pendentes · {formatCurrency(line.pending)}
        </Badge>
        <Badge variant="outline" className="border-zinc-200 text-zinc-600">
          Confirmados · {formatCurrency(line.paid)}
        </Badge>
      </div>
    </div>
  );
}

export function ForecastCard({ data, summary, loading = false, accent = 'blue' }: ForecastCardProps) {
  if (loading) {
    return (
      <Card className="rounded-3xl border-zinc-100">
        <CardHeader>
          <CardTitle>Fluxo Futuro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const palette = accentTokens[accent];
  const chartConfig = {
    netPositive: { label: 'Semanas positivas', color: palette.accent },
    netNegative: { label: 'Semanas negativas', color: '#ef4444' },
  } as const;

  return (
    <Card className="rounded-3xl border-zinc-100 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-zinc-900">Fluxo Futuro</CardTitle>
          {typeof summary.overdueNet === 'number' && summary.overdueNet !== 0 && (
            <Badge
              variant="outline"
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-semibold',
                summary.overdueNet > 0 ? palette.pill : 'bg-red-50 text-red-600 border-red-100'
              )}
            >
              {summary.overdueNet > 0 ? 'A receber vencido' : 'A pagar vencido'} · {formatCurrency(Math.abs(summary.overdueNet))}
            </Badge>
          )}
        </div>
        <p className="text-sm text-zinc-500">Projeção das próximas semanas com destaque para períodos negativos.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={chartConfig} className="h-[240px]">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="netPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette.accent} stopOpacity={0.25} />
                <stop offset="95%" stopColor={palette.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="netNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-100" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} className="text-xs fill-zinc-400" />
            <ChartTooltip content={<ChartTooltipContent labelKey="label" />} />
            <Area
              type="monotone"
              dataKey="netPositive"
              stroke={palette.accent}
              strokeWidth={2}
              fill="url(#netPositive)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="netNegative"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#netNegative)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryRow line={summary.receivable} accent={accent} />
          <SummaryRow line={summary.payable} accent={accent} />
        </div>
      </CardContent>
    </Card>
  );
}

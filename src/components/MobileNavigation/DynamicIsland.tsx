import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  Target,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Page } from '../../types/navigation';

// ============================================================================
// Types
// ============================================================================

interface DynamicIslandProps {
  currentPage: Page;
  data?: DynamicIslandData;
  isPlanner?: boolean;
}

interface DynamicIslandData {
  // Dashboard data
  monthBalance?: number;
  trend?: 'up' | 'down' | 'neutral';
  
  // Cashflow data
  upcomingCount?: number;
  upcomingTotal?: number;
  
  // Goals data
  activeGoals?: number;
  nearestGoalProgress?: number;
  
  // Alerts
  hasAlerts?: boolean;
  alertCount?: number;
}

interface IslandContent {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  secondaryIcon?: LucideIcon;
  secondaryValue?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getContentForPage(page: Page, data?: DynamicIslandData, isPlanner?: boolean): IslandContent | null {
  const accentColor = isPlanner ? 'text-emerald-500' : 'text-blue-500';
  
  switch (page) {
    case 'dashboard-summary':
    case 'planner-dashboard':
      if (data?.monthBalance !== undefined) {
        const isPositive = data.monthBalance >= 0;
        return {
          icon: isPositive ? TrendingUp : TrendingDown,
          label: 'Saldo do mês',
          value: formatCurrency(data.monthBalance),
          color: isPositive ? 'text-emerald-500' : 'text-rose-500',
        };
      }
      return {
        icon: Wallet,
        label: 'Dashboard',
        value: 'Visão geral',
        color: accentColor,
      };

    case 'cashflow-future':
      if (data?.upcomingCount !== undefined) {
        return {
          icon: Calendar,
          label: 'Próximos',
          value: `${data.upcomingCount} lançamentos`,
          color: accentColor,
          secondaryIcon: Wallet,
          secondaryValue: data.upcomingTotal ? formatCurrency(data.upcomingTotal) : undefined,
        };
      }
      return {
        icon: Calendar,
        label: 'Fluxo Futuro',
        value: 'Planejamento',
        color: accentColor,
      };

    case 'dashboard-goals':
      if (data?.activeGoals !== undefined) {
        return {
          icon: Target,
          label: 'Metas ativas',
          value: `${data.activeGoals} metas`,
          color: accentColor,
          secondaryValue: data.nearestGoalProgress 
            ? `${Math.round(data.nearestGoalProgress)}% próxima` 
            : undefined,
        };
      }
      return {
        icon: Target,
        label: 'Metas',
        value: 'Objetivos',
        color: accentColor,
      };

    default:
      return null;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function DynamicIsland({ currentPage, data, isPlanner }: DynamicIslandProps) {
  const content = useMemo(() => 
    getContentForPage(currentPage, data, isPlanner), 
    [currentPage, data, isPlanner]
  );

  // Don't render if no content for this page
  if (!content) return null;

  const hasAlert = data?.hasAlerts && (data.alertCount ?? 0) > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe md:hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="mt-2"
        >
          <div className={cn(
            "relative flex items-center gap-3 px-4 py-2.5",
            "bg-zinc-900/95 backdrop-blur-xl rounded-full",
            "shadow-lg shadow-zinc-900/20",
            "min-w-[180px]"
          )}>
            {/* Icon */}
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              "bg-white/10"
            )}>
              <content.icon className={cn("w-4 h-4", content.color)} />
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                {content.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {content.value}
                </span>
                {content.secondaryValue && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-400">
                      {content.secondaryValue}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Alert Badge */}
            {hasAlert && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-rose-500 rounded-full"
              >
                <span className="text-[10px] font-bold text-white">
                  {data?.alertCount}
                </span>
              </motion.div>
            )}

            {/* Subtle breathing animation */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={cn(
                "absolute inset-0 rounded-full -z-10",
                "bg-gradient-to-r from-transparent via-white/5 to-transparent"
              )}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Compact Variant (for pages without data)
// ============================================================================

export function DynamicIslandCompact({ 
  title, 
  isPlanner 
}: { 
  title: string; 
  isPlanner?: boolean;
}) {
  const bgColor = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe md:hidden">
      <motion.div
        initial={{ opacity: 0, y: -20, width: 100 }}
        animate={{ opacity: 1, y: 0, width: 'auto' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="mt-2"
      >
        <div className={cn(
          "px-4 py-2 rounded-full",
          "bg-zinc-900/95 backdrop-blur-xl",
          "shadow-lg shadow-zinc-900/20"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", bgColor)} />
            <span className="text-xs font-medium text-white">{title}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

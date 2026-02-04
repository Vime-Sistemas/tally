import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { formatCurrency } from "../../utils/formatters";
import { BudgetType, type Budget, type BudgetComparison } from "../../types/budget";

// ============================================================================
// Types
// ============================================================================

interface BudgetProgressProps {
  budgets: Budget[];
  comparisons: Record<string, BudgetComparison>;
  loading?: boolean;
}

interface CategoryProgress {
  budget: Budget;
  comparison: BudgetComparison;
  percentage: number;
  status: "safe" | "warning" | "critical" | "exceeded";
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatus(percentage: number): CategoryProgress["status"] {
  if (percentage >= 100) return "exceeded";
  if (percentage >= 95) return "critical";
  if (percentage >= 90) return "warning";
  return "safe";
}

// ============================================================================
// Main Component
// ============================================================================

export function BudgetProgress({ budgets, comparisons, loading }: BudgetProgressProps) {
  const categorizedProgress = useMemo(() => {
    const expenseProgress: CategoryProgress[] = [];
    const incomeProgress: CategoryProgress[] = [];
    const investmentProgress: CategoryProgress[] = [];

    budgets.forEach((budget) => {
      const comparison = comparisons[budget.id];
      if (!comparison) return;

      const percentage = comparison.percentage;
      const progress: CategoryProgress = {
        budget,
        comparison,
        percentage,
        status: getStatus(percentage),
      };

      switch (budget.type) {
        case BudgetType.EXPENSE:
          expenseProgress.push(progress);
          break;
        case BudgetType.INCOME:
          incomeProgress.push(progress);
          break;
        case BudgetType.INVESTMENT:
          investmentProgress.push(progress);
          break;
      }
    });

    // Sort by percentage descending (most critical first)
    expenseProgress.sort((a, b) => b.percentage - a.percentage);
    incomeProgress.sort((a, b) => b.percentage - a.percentage);
    investmentProgress.sort((a, b) => b.percentage - a.percentage);

    return { expenseProgress, incomeProgress, investmentProgress };
  }, [budgets, comparisons]);

  const totals = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    let totalIncome = 0;
    let totalIncomeActual = 0;

    budgets.forEach((budget) => {
      const comparison = comparisons[budget.id];
      if (!comparison) return;

      if (budget.type === BudgetType.EXPENSE) {
        totalBudgeted += budget.amount;
        totalSpent += comparison.spent;
      } else if (budget.type === BudgetType.INCOME) {
        totalIncome += budget.amount;
        totalIncomeActual += comparison.spent;
      }
    });

    return {
      totalBudgeted,
      totalSpent,
      totalIncome,
      totalIncomeActual,
      spentPercentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      incomePercentage: totalIncome > 0 ? (totalIncomeActual / totalIncome) * 100 : 0,
    };
  }, [budgets, comparisons]);

  if (loading) {
    return (
      <Card className="border-zinc-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-zinc-200 rounded w-1/3" />
            <div className="h-8 bg-zinc-200 rounded" />
            <div className="h-4 bg-zinc-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card className="border-zinc-200">
        <CardContent className="p-6 text-center">
          <PiggyBank className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
          <p className="text-sm text-zinc-500">
            Nenhum orçamento definido para este período
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expense Overview */}
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-50">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm font-medium text-zinc-700">Despesas</span>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  totals.spentPercentage >= 90
                    ? "bg-red-100 text-red-700"
                    : "bg-zinc-100 text-zinc-600"
                )}
              >
                {totals.spentPercentage.toFixed(0)}%
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress
                value={Math.min(totals.spentPercentage, 100)}
                className={cn(
                  "h-2",
                  totals.spentPercentage >= 100
                    ? "[&>div]:bg-red-500"
                    : totals.spentPercentage >= 90
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-emerald-500"
                )}
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formatCurrency(totals.totalSpent)}</span>
                <span>{formatCurrency(totals.totalBudgeted)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Overview */}
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-zinc-700">Receitas</span>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  totals.incomePercentage >= 100
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-600"
                )}
              >
                {totals.incomePercentage.toFixed(0)}%
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress
                value={Math.min(totals.incomePercentage, 100)}
                className="h-2 [&>div]:bg-emerald-500"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formatCurrency(totals.totalIncomeActual)}</span>
                <span>{formatCurrency(totals.totalIncome)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <PiggyBank className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-zinc-700">Balanço</span>
              </div>
            </div>
            <div className="space-y-1">
              <p
                className={cn(
                  "text-2xl font-bold",
                  totals.totalIncomeActual - totals.totalSpent >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                )}
              >
                {formatCurrency(totals.totalIncomeActual - totals.totalSpent)}
              </p>
              <p className="text-xs text-zinc-500">
                {totals.totalIncomeActual - totals.totalSpent >= 0
                  ? "Receitas superam despesas"
                  : "Despesas superam receitas"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress by Category */}
      {categorizedProgress.expenseProgress.length > 0 && (
        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Progresso de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorizedProgress.expenseProgress.map((item) => (
                <ProgressItem key={item.budget.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Progress */}
      {categorizedProgress.incomeProgress.length > 0 && (
        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Progresso de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorizedProgress.incomeProgress.map((item) => (
                <ProgressItem key={item.budget.id} item={item} isIncome />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Progress Item Component
// ============================================================================

interface ProgressItemProps {
  item: CategoryProgress;
  isIncome?: boolean;
}

function ProgressItem({ item, isIncome = false }: ProgressItemProps) {
  const statusConfig = isIncome
    ? {
        icon: item.percentage >= 100 ? CheckCircle2 : ArrowRight,
        color: item.percentage >= 100 ? "text-emerald-500" : "text-zinc-400",
        bgColor: item.percentage >= 100 ? "bg-emerald-50" : "bg-zinc-50",
      }
    : {
        icon:
          item.status === "exceeded"
            ? AlertTriangle
            : item.status === "safe"
            ? CheckCircle2
            : AlertTriangle,
        color:
          item.status === "exceeded"
            ? "text-red-500"
            : item.status === "critical"
            ? "text-orange-500"
            : item.status === "warning"
            ? "text-yellow-500"
            : "text-emerald-500",
        bgColor:
          item.status === "exceeded"
            ? "bg-red-50"
            : item.status === "critical"
            ? "bg-orange-50"
            : item.status === "warning"
            ? "bg-yellow-50"
            : "bg-emerald-50",
      };

  const Icon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", statusConfig.bgColor)}>
          <Icon className={cn("w-4 h-4", statusConfig.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {item.budget.name}
            </p>
            <span
              className={cn(
                "text-sm font-semibold",
                isIncome
                  ? item.percentage >= 100
                    ? "text-emerald-600"
                    : "text-zinc-600"
                  : item.status === "exceeded"
                  ? "text-red-600"
                  : item.status === "critical"
                  ? "text-orange-600"
                  : item.status === "warning"
                  ? "text-yellow-600"
                  : "text-emerald-600"
              )}
            >
              {item.percentage.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(item.percentage, 100)}
            className={cn(
              "h-2",
              isIncome
                ? "[&>div]:bg-emerald-500"
                : item.status === "exceeded"
                ? "[&>div]:bg-red-500"
                : item.status === "critical"
                ? "[&>div]:bg-orange-500"
                : item.status === "warning"
                ? "[&>div]:bg-yellow-500"
                : "[&>div]:bg-emerald-500"
            )}
          />
          <div className="flex justify-between mt-1 text-xs text-zinc-500">
            <span>
              {isIncome ? "Recebido:" : "Gasto:"}{" "}
              {formatCurrency(item.comparison.spent)}
            </span>
            <span>
              {isIncome ? "Meta:" : "Limite:"}{" "}
              {formatCurrency(item.budget.amount)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default BudgetProgress;

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  Bell,
  BellOff,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";
import { formatCurrency } from "../../utils/formatters";
import { getBudgets, getBudgetComparison } from "../../services/api";
import { BudgetType, type Budget, type BudgetComparison } from "../../types/budget";

// ============================================================================
// Types
// ============================================================================

export interface BudgetAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  category: string;
  type: BudgetType;
  budgeted: number;
  spent: number;
  percentage: number;
  severity: "warning" | "critical" | "exceeded";
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

interface BudgetAlertsProviderProps {
  children: React.ReactNode;
}

interface BudgetAlertsContextValue {
  alerts: BudgetAlert[];
  activeAlerts: BudgetAlert[];
  dismissAlert: (id: string) => void;
  dismissAll: () => void;
  refreshAlerts: () => Promise<void>;
  isLoading: boolean;
  alertsEnabled: boolean;
  setAlertsEnabled: (enabled: boolean) => void;
}

// ============================================================================
// Constants
// ============================================================================

const ALERT_THRESHOLD = 90; // 90% threshold for alerts
const STORAGE_KEY = "budget-alerts-dismissed";
const ALERTS_ENABLED_KEY = "budget-alerts-enabled";

// ============================================================================
// Context
// ============================================================================

import { createContext, useContext } from "react";

const BudgetAlertsContext = createContext<BudgetAlertsContextValue | null>(null);

export function useBudgetAlerts() {
  const context = useContext(BudgetAlertsContext);
  if (!context) {
    throw new Error("useBudgetAlerts must be used within BudgetAlertsProvider");
  }
  return context;
}

// ============================================================================
// Provider Component
// ============================================================================

export function BudgetAlertsProvider({ children }: BudgetAlertsProviderProps) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    const stored = localStorage.getItem(ALERTS_ENABLED_KEY);
    return stored !== "false";
  });

  const generateAlerts = useCallback(
    (budgets: Budget[], comparisons: Record<string, BudgetComparison>): BudgetAlert[] => {
      const newAlerts: BudgetAlert[] = [];

      budgets.forEach((budget) => {
        const comparison = comparisons[budget.id];
        if (!comparison) return;

        const percentage = comparison.percentage;

        // Only alert for expense budgets approaching or exceeding threshold
        if (budget.type !== BudgetType.EXPENSE) return;

        if (percentage >= 100) {
          newAlerts.push({
            id: `${budget.id}-exceeded`,
            budgetId: budget.id,
            budgetName: budget.name,
            category: budget.category || "",
            type: budget.type as BudgetType,
            budgeted: budget.amount,
            spent: comparison.spent,
            percentage,
            severity: "exceeded",
            message: `Orçamento de ${budget.name} foi excedido em ${formatCurrency(comparison.spent - budget.amount)}`,
            timestamp: new Date(),
            dismissed: dismissedIds.has(`${budget.id}-exceeded`),
          });
        } else if (percentage >= ALERT_THRESHOLD) {
          newAlerts.push({
            id: `${budget.id}-warning`,
            budgetId: budget.id,
            budgetName: budget.name,
            category: budget.category || "",
            type: budget.type as BudgetType,
            budgeted: budget.amount,
            spent: comparison.spent,
            percentage,
            severity: percentage >= 95 ? "critical" : "warning",
            message: `${budget.name} está em ${percentage.toFixed(0)}% do limite`,
            timestamp: new Date(),
            dismissed: dismissedIds.has(`${budget.id}-warning`),
          });
        }
      });

      // Sort by severity and percentage
      return newAlerts.sort((a, b) => {
        const severityOrder = { exceeded: 0, critical: 1, warning: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.percentage - a.percentage;
      });
    },
    [dismissedIds]
  );

  const refreshAlerts = useCallback(async () => {
    if (!alertsEnabled) return;

    setIsLoading(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const budgets = await getBudgets(currentYear, currentMonth);
      const comparisons: Record<string, BudgetComparison> = {};

      await Promise.all(
        budgets.map(async (budget) => {
          try {
            const comparison = await getBudgetComparison(budget.id);
            comparisons[budget.id] = comparison;
          } catch (error) {
            console.error(`Error loading comparison for ${budget.id}:`, error);
          }
        })
      );

      const newAlerts = generateAlerts(budgets, comparisons);
      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error refreshing budget alerts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [alertsEnabled, generateAlerts]);

  const dismissAlert = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, dismissed: true } : alert
      )
    );
  }, []);

  const dismissAll = useCallback(() => {
    const allIds = alerts.map((a) => a.id);
    setDismissedIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
    setAlerts((prev) => prev.map((alert) => ({ ...alert, dismissed: true })));
  }, [alerts]);

  const handleSetAlertsEnabled = useCallback((enabled: boolean) => {
    setAlertsEnabled(enabled);
    localStorage.setItem(ALERTS_ENABLED_KEY, String(enabled));
  }, []);

  // Load alerts on mount and periodically
  useEffect(() => {
    refreshAlerts();

    // Refresh every 5 minutes
    const interval = setInterval(refreshAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  return (
    <BudgetAlertsContext.Provider
      value={{
        alerts,
        activeAlerts,
        dismissAlert,
        dismissAll,
        refreshAlerts,
        isLoading,
        alertsEnabled,
        setAlertsEnabled: handleSetAlertsEnabled,
      }}
    >
      {children}
    </BudgetAlertsContext.Provider>
  );
}

// ============================================================================
// Alert Banner Component
// ============================================================================

interface BudgetAlertBannerProps {
  onNavigateToBudgets?: () => void;
}

export function BudgetAlertBanner({ onNavigateToBudgets }: BudgetAlertBannerProps) {
  const { activeAlerts, dismissAlert, alertsEnabled } = useBudgetAlerts();

  if (!alertsEnabled || activeAlerts.length === 0) return null;

  const topAlert = activeAlerts[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "rounded-xl border p-4 mb-4",
          topAlert.severity === "exceeded" && "bg-red-50 border-red-200",
          topAlert.severity === "critical" && "bg-orange-50 border-orange-200",
          topAlert.severity === "warning" && "bg-yellow-50 border-yellow-200"
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={cn(
              "w-5 h-5 mt-0.5",
              topAlert.severity === "exceeded" && "text-red-500",
              topAlert.severity === "critical" && "text-orange-500",
              topAlert.severity === "warning" && "text-yellow-500"
            )}
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium",
                topAlert.severity === "exceeded" && "text-red-800",
                topAlert.severity === "critical" && "text-orange-800",
                topAlert.severity === "warning" && "text-yellow-800"
              )}
            >
              {topAlert.message}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={Math.min(topAlert.percentage, 100)}
                className={cn(
                  "h-1.5 w-24",
                  topAlert.severity === "exceeded" && "bg-red-100",
                  topAlert.severity === "critical" && "bg-orange-100",
                  topAlert.severity === "warning" && "bg-yellow-100"
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  topAlert.severity === "exceeded" && "text-red-600",
                  topAlert.severity === "critical" && "text-orange-600",
                  topAlert.severity === "warning" && "text-yellow-600"
                )}
              >
                {formatCurrency(topAlert.spent)} / {formatCurrency(topAlert.budgeted)}
              </span>
            </div>
            {activeAlerts.length > 1 && (
              <p
                className={cn(
                  "text-xs mt-1",
                  topAlert.severity === "exceeded" && "text-red-600",
                  topAlert.severity === "critical" && "text-orange-600",
                  topAlert.severity === "warning" && "text-yellow-600"
                )}
              >
                +{activeAlerts.length - 1} outros alertas
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToBudgets && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToBudgets}
                className={cn(
                  "h-8 text-xs",
                  topAlert.severity === "exceeded" && "text-red-700 hover:bg-red-100",
                  topAlert.severity === "critical" && "text-orange-700 hover:bg-orange-100",
                  topAlert.severity === "warning" && "text-yellow-700 hover:bg-yellow-100"
                )}
              >
                Ver orçamentos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dismissAlert(topAlert.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Alert List Component
// ============================================================================

interface BudgetAlertListProps {
  maxItems?: number;
  showDismissed?: boolean;
  onViewBudget?: (budgetId: string) => void;
}

export function BudgetAlertList({
  maxItems = 5,
  showDismissed = false,
  onViewBudget,
}: BudgetAlertListProps) {
  const { alerts, activeAlerts, dismissAlert, dismissAll, alertsEnabled, setAlertsEnabled } =
    useBudgetAlerts();

  const displayAlerts = showDismissed ? alerts : activeAlerts;
  const limitedAlerts = displayAlerts.slice(0, maxItems);

  return (
    <Card className="border-zinc-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-medium text-zinc-900">Alertas de Orçamento</h3>
            {activeAlerts.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-700 text-xs"
              >
                {activeAlerts.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
            >
              {alertsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4 text-zinc-400" />
              )}
            </Button>
            {activeAlerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-zinc-500"
                onClick={dismissAll}
              >
                Dispensar todos
              </Button>
            )}
          </div>
        </div>

        {!alertsEnabled ? (
          <div className="text-center py-6">
            <BellOff className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-500">Alertas desativados</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setAlertsEnabled(true)}
            >
              Ativar alertas
            </Button>
          </div>
        ) : limitedAlerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 mx-auto mb-3 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-zinc-900">Tudo sob controle!</p>
            <p className="text-xs text-zinc-500 mt-1">
              Nenhum orçamento próximo do limite
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {limitedAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg p-3 transition-colors",
                    alert.dismissed && "opacity-50",
                    alert.severity === "exceeded" && "bg-red-50 hover:bg-red-100",
                    alert.severity === "critical" && "bg-orange-50 hover:bg-orange-100",
                    alert.severity === "warning" && "bg-yellow-50 hover:bg-yellow-100"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg",
                      alert.severity === "exceeded" && "bg-red-100",
                      alert.severity === "critical" && "bg-orange-100",
                      alert.severity === "warning" && "bg-yellow-100"
                    )}
                  >
                    {alert.severity === "exceeded" ? (
                      <TrendingUp
                        className={cn(
                          "w-4 h-4",
                          alert.severity === "exceeded" && "text-red-500"
                        )}
                      />
                    ) : (
                      <AlertTriangle
                        className={cn(
                          "w-4 h-4",
                          alert.severity === "critical" && "text-orange-500",
                          alert.severity === "warning" && "text-yellow-500"
                        )}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        alert.severity === "exceeded" && "text-red-800",
                        alert.severity === "critical" && "text-orange-800",
                        alert.severity === "warning" && "text-yellow-800"
                      )}
                    >
                      {alert.budgetName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={Math.min(alert.percentage, 100)}
                        className={cn(
                          "h-1 w-16",
                          alert.severity === "exceeded" && "bg-red-200",
                          alert.severity === "critical" && "bg-orange-200",
                          alert.severity === "warning" && "bg-yellow-200"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          alert.severity === "exceeded" && "text-red-600",
                          alert.severity === "critical" && "text-orange-600",
                          alert.severity === "warning" && "text-yellow-600"
                        )}
                      >
                        {alert.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onViewBudget && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onViewBudget(alert.budgetId)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                    {!alert.dismissed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {displayAlerts.length > maxItems && (
              <p className="text-xs text-zinc-500 text-center pt-2">
                +{displayAlerts.length - maxItems} outros alertas
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Alert Indicator (for navbar/header)
// ============================================================================

interface BudgetAlertIndicatorProps {
  onClick?: () => void;
}

export function BudgetAlertIndicator({ onClick }: BudgetAlertIndicatorProps) {
  const { activeAlerts, alertsEnabled } = useBudgetAlerts();

  if (!alertsEnabled || activeAlerts.length === 0) return null;

  const hasCritical = activeAlerts.some(
    (a) => a.severity === "exceeded" || a.severity === "critical"
  );

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
        hasCritical ? "bg-red-100 hover:bg-red-200" : "bg-yellow-100 hover:bg-yellow-200"
      )}
    >
      <Bell className={cn("w-4 h-4", hasCritical ? "text-red-600" : "text-yellow-600")} />
      <span
        className={cn(
          "absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white",
          hasCritical ? "bg-red-500" : "bg-yellow-500"
        )}
      >
        {activeAlerts.length > 9 ? "9+" : activeAlerts.length}
      </span>
    </button>
  );
}

export default BudgetAlertsProvider;

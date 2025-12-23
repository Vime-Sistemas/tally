import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getBudgets, getBudgetComparison } from '../../services/api';
import { BudgetType } from '../../types/budget';
import type { Budget, BudgetComparison } from '../../types/budget';

import { cn } from '../../lib/utils';

export function BudgetOverview() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [comparisons, setComparisons] = useState<Record<string, BudgetComparison>>({});
  const [loading, setLoading] = useState(true);
  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const data = await getBudgets(currentYear, currentMonth);
      setBudgets(data);

      // Load comparisons for each budget
      let totalBudgeted = 0;
      let totalSpent = 0;

      for (const budget of data) {
        try {
          const comparison = await getBudgetComparison(budget.id);
          setComparisons(prev => ({ ...prev, [budget.id]: comparison }));
          totalBudgeted += budget.amount;
          totalSpent += comparison.spent;
        } catch (error) {
          console.error('Erro ao carregar comparação do orçamento:', error);
        }
      }

      setTotalBudgeted(totalBudgeted);
      setTotalSpent(totalSpent);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBudgetTypeColor = (type: string) => {
    switch (type) {
      case BudgetType.INCOME:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case BudgetType.EXPENSE:
        return 'bg-red-50 text-red-700 border-red-200';
      case BudgetType.INVESTMENT:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getBudgetTypeLabel = (type: string) => {
    switch (type) {
      case BudgetType.INCOME:
        return 'Receita';
      case BudgetType.EXPENSE:
        return 'Despesa';
      case BudgetType.INVESTMENT:
        return 'Investimento';
      default:
        return type;
    }
  };

  const getProgressPercentage = (budgetId: string) => {
    const comparison = comparisons[budgetId];
    if (!comparison) return 0;
    return Math.min((comparison.spent / comparison.budgeted) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return 'bg-green-500';
    if (percentage <= 75) return 'bg-yellow-500';
    if (percentage <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const topBudgets = budgets.slice(0, 3);
  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Carregando orçamentos...</div>
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Nenhum orçamento para este mês</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamentos do Mês</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo total */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Orçado</span>
            <span className="font-semibold text-gray-900">R$ {totalBudgeted.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Gasto</span>
            <span className="font-semibold text-red-600">R$ {totalSpent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Restante</span>
            <span className={cn(
              'font-semibold',
              totalBudgeted - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              R$ {(totalBudgeted - totalSpent).toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={cn('h-2 rounded-full transition-all', getProgressColor(spentPercentage))}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-600">
            {Math.round(spentPercentage)}% do orçado
          </div>
        </div>

        {/* Top 3 Orçamentos */}
        {topBudgets.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900">Principais Orçamentos</h4>
            <div className="space-y-3">
              {topBudgets.map((budget) => {
                const comparison = comparisons[budget.id];
                const percentage = getProgressPercentage(budget.id);
                
                return (
                  <div key={budget.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                          getBudgetTypeColor(budget.type)
                        )}>
                          {getBudgetTypeLabel(budget.type)}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {budget.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap ml-2">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={cn('h-1.5 rounded-full transition-all', getProgressColor(percentage))}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>R$ {comparison?.spent.toFixed(2) || '0.00'}</span>
                      <span>R$ {budget.amount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

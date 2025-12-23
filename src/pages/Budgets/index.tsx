import { useState, useEffect } from 'react';
import { getBudgets, deleteBudget, getBudgetComparison } from '../../services/api';
import { BudgetForm } from '../../components/BudgetForm';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { toast } from 'sonner';
import type { Budget, BudgetComparison } from '../../types/budget';
import { BudgetType } from '../../types/budget';
import { Edit, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<Record<string, BudgetComparison>>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, [selectedYear, selectedMonth]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await getBudgets(selectedYear ?? undefined, selectedMonth ?? undefined);
      setBudgets(data);
      setComparisons({});
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async (budgetId: string) => {
    if (comparisons[budgetId]) return;

    try {
      const comparison = await getBudgetComparison(budgetId);
      setComparisons(prev => ({ ...prev, [budgetId]: comparison }));
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
      toast.error('Erro ao carregar comparação');
    }
  };

  const handleExpandBudget = async (budgetId: string) => {
    if (expandedBudget === budgetId) {
      setExpandedBudget(null);
    } else {
      setExpandedBudget(budgetId);
      await loadComparison(budgetId);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Tem certeza que deseja deletar este orçamento?')) return;

    try {
      setIsDeleting(true);
      await deleteBudget(budgetId);
      setBudgets(budgets.filter(b => b.id !== budgetId));
      toast.success('Orçamento deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar orçamento:', error);
      toast.error('Erro ao deletar orçamento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowForm(true);
  };

  const handleCreateBudget = () => {
    setSelectedBudget(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedBudget(null);
    loadBudgets();
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
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

  const getBudgetTypeColor = (type: string) => {
    switch (type) {
      case BudgetType.INCOME:
        return 'bg-blue-100 text-blue-700';
      case BudgetType.EXPENSE:
        return 'bg-red-100 text-red-700';
      case BudgetType.INVESTMENT:
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return 'bg-green-500';
    if (percentage <= 75) return 'bg-yellow-500';
    if (percentage <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black">Orçamentos</h1>
          <p className="text-gray-600 mt-1">Planeje e acompanhe seus orçamentos</p>
        </div>
        <Button
          onClick={handleCreateBudget}
          className="w-full sm:w-auto bg-blue-400 hover:bg-blue-500 text-white flex items-center gap-2 h-11"
        >
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="relative">
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowForm(false)}
          />
          <div className="relative z-50 max-h-[90vh] overflow-y-auto">
            <BudgetForm
              initialData={selectedBudget || undefined}
              onSuccess={handleFormSuccess}
            />
            <Button
              variant="outline"
              className="w-full mt-4 border-gray-200"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Ano</label>
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(e.target.value === '' ? null : parseInt(e.target.value))}
            className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">Todos</option>
            {[2024, 2025, 2026, 2027, 2028].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Mês</label>
          <select
            value={selectedMonth ?? ''}
            onChange={(e) => setSelectedMonth(e.target.value === '' ? null : parseInt(e.target.value))}
            className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">Todos</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <option key={month} value={month}>{getMonthName(month)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Orçamentos */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando orçamentos...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum orçamento encontrado para este período</p>
          <Button
            onClick={handleCreateBudget}
            className="bg-blue-400 hover:bg-blue-500 text-white"
          >
            Criar Primeiro Orçamento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const comparison = comparisons[budget.id];
            const percentage = comparison?.percentage || 0;

            return (
              <Card key={budget.id} className="border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-black truncate">{budget.name}</h3>
                        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getBudgetTypeColor(budget.type))}>
                          {getBudgetTypeLabel(budget.type)}
                        </span>
                        {budget.category && budget.category !== 'ALL' && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                            {budget.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Orçado: <span className="font-semibold text-gray-900">R$ {budget.amount.toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditBudget(budget)}
                        className="h-9 w-9 p-0"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="h-9 w-9 p-0"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExpandBudget(budget.id)}
                        className="h-9 w-9 p-0"
                      >
                        {expandedBudget === budget.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedBudget === budget.id && comparison && (
                  <CardContent className="pt-4 border-t border-gray-100">
                    <div className="space-y-4">
                      {/* Barra de progresso */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Gasto</span>
                          <span className="font-semibold">
                            R$ {comparison.spent.toFixed(2)} de R$ {comparison.budgeted.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={cn('h-2.5 rounded-full transition-all', getProgressColor(percentage))}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{Math.round(percentage)}%</span>
                          <span>
                            {comparison.remaining >= 0 ? '+' : ''}R$ {comparison.remaining.toFixed(2)} restante
                          </span>
                        </div>
                      </div>

                      {/* Estatísticas */}
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Orçado</p>
                          <p className="font-semibold text-black">R$ {comparison.budgeted.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Gasto</p>
                          <p className="font-semibold text-red-600">R$ {comparison.spent.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Transações</p>
                          <p className="font-semibold text-black">{comparison.transactions}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

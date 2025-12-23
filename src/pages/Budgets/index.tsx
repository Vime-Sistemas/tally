import { useState, useEffect } from 'react';
import { getBudgets, deleteBudget, getBudgetComparison } from '../../services/api';
import { BudgetForm } from '../../components/BudgetForm';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import type { Budget, BudgetComparison } from '../../types/budget';
import { BudgetType } from '../../types/budget';
import { Edit, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<Record<string, BudgetComparison>>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    loadBudgets();
  }, [selectedYear, selectedMonth]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await getBudgets(selectedYear ?? undefined, selectedMonth ?? undefined);
      setBudgets(data);
      setComparisons({});
      
      // Carregar comparações para todos os budgets
      const comparisonsData: Record<string, BudgetComparison> = {};
      for (const budget of data) {
        try {
          const comparison = await getBudgetComparison(budget.id);
          comparisonsData[budget.id] = comparison;
        } catch (error) {
          console.error(`Erro ao carregar comparação para ${budget.id}:`, error);
        }
      }
      setComparisons(comparisonsData);
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
    setActiveTab('form');
  };

  const handleCreateBudget = () => {
    setSelectedBudget(null);
    setActiveTab('form');
  };

  const handleFormSuccess = () => {
    setActiveTab('list');
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
      <div>
        <h1 className="text-3xl font-bold text-black">Orçamentos</h1>
        <p className="text-gray-600 mt-1">Planeje e acompanhe seus orçamentos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Meus Orçamentos
          </TabsTrigger>
          <TabsTrigger 
            value="form"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            {selectedBudget ? 'Editar' : 'Novo'} Orçamento
          </TabsTrigger>
        </TabsList>

        {/* Aba de Lista */}
        <TabsContent value="list" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Ano</label>
              <select
                value={selectedYear ?? ''}
                onChange={(e) => setSelectedYear(e.target.value === '' ? null : parseInt(e.target.value))}
                className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-white text-black"
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
                className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-white text-black"
              >
                <option value="">Todos</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreateBudget}
                className="bg-blue-400 hover:bg-blue-500 text-white flex items-center gap-2 h-10"
              >
                <Plus className="h-4 w-4" />
                Novo Orçamento
              </Button>
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

                return (
                  <Card key={budget.id} className="border-gray-100 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-black">{budget.name}</h3>
                            <span className={cn('text-xs font-medium px-2 py-1 rounded-full', getBudgetTypeColor(budget.type))}>
                              {getBudgetTypeLabel(budget.type)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {budget.category && budget.category !== 'ALL' && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-200">
                                {budget.category}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {budget.month ? `${getMonthName(budget.month)}/` : ''}{budget.year}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Orçado</p>
                              <p className="font-semibold text-gray-900">R$ {budget.amount.toFixed(2)}</p>
                            </div>
                            {comparison && (
                              <div>
                                <p className="text-gray-600">Gasto</p>
                                <p className={cn('font-semibold', comparison.spent > budget.amount ? 'text-red-600' : 'text-green-600')}>
                                  R$ {comparison.spent.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
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

                      {comparison && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={cn('h-2 rounded-full transition-all', getProgressColor(comparison.percentage))}
                              style={{ width: `${Math.min(comparison.percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                            <span>{Math.round(comparison.percentage)}% utilizado</span>
                            <span className={cn(comparison.remaining >= 0 ? 'text-green-600' : 'text-red-600')}>
                              {comparison.remaining >= 0 ? '+' : ''}R$ {comparison.remaining.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    {expandedBudget === budget.id && comparison && (
                      <CardContent className="border-t border-gray-100">
                        <div className="space-y-4">
                          {/* Estatísticas */}
                          <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Orçado</p>
                              <p className="font-semibold text-black text-lg">R$ {comparison.budgeted.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Gasto</p>
                              <p className={cn('font-semibold text-lg', comparison.spent > comparison.budgeted ? 'text-red-600' : 'text-green-600')}>
                                R$ {comparison.spent.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Transações</p>
                              <p className="font-semibold text-black text-lg">{comparison.transactions}</p>
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
        </TabsContent>

        {/* Aba de Formulário */}
        <TabsContent value="form" className="mt-6">
          <Card className="border-gray-100">
            <CardHeader>
              <h2 className="text-xl font-semibold text-black">
                {selectedBudget ? 'Editar Orçamento' : 'Criar Novo Orçamento'}
              </h2>
            </CardHeader>
            <CardContent>
              <BudgetForm
                initialData={selectedBudget || undefined}
                onSuccess={handleFormSuccess}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

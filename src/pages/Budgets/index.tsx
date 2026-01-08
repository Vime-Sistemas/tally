import { useState, useEffect } from 'react';
import { getBudgets, deleteBudget, getBudgetComparison, createBudget } from '../../services/api';
import { BudgetForm } from '../../components/BudgetForm';
import { CategoryService, type Category } from '../../services/categoryService';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import type { Budget, BudgetComparison } from '../../types/budget';
import { BudgetType } from '../../types/budget';
import { 
  Edit, Trash2, Plus, ChevronDown, ChevronUp, Copy, 
  BarChart3, Target, X 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../../components/ui/badge';

const expenseCategoriesLabels: Record<string, string> = {
  HOUSING: 'Moradia',
  UTILITIES: 'Contas Fixas',
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',
  HEALTHCARE: 'Saúde',
  INSURANCE: 'Seguros',
  EDUCATION: 'Educação',
  SHOPPING: 'Compras',
  CLOTHING: 'Vestuário',
  ENTERTAINMENT: 'Lazer',
  SUBSCRIPTIONS: 'Assinaturas',
  TAXES: 'Impostos',
  FEES: 'Taxas',
  PETS: 'Pets',
  DONATIONS: 'Doações',
  TRAVEL: 'Viagens',
  OTHER_EXPENSE: 'Outros'
};

const incomeCategoriesLabels: Record<string, string> = {
  SALARY: 'Salário',
  BONUS: 'Bônus',
  COMMISSION: 'Comissão',
  FREELANCE: 'Freelance',
  SELF_EMPLOYED: 'PJ',
  INVESTMENT_INCOME: 'Rendimentos',
  DIVIDENDS: 'Dividendos',
  INTEREST: 'Juros',
  RENT: 'Aluguel',
  PENSION_INCOME: 'Aposentadoria',
  BENEFITS: 'Benefícios',
  GIFTS: 'Presentes',
  REFUND: 'Reembolsos',
  OTHER_INCOME: 'Outros'
};

const investmentCategoriesLabels: Record<string, string> = {
  STOCKS: 'Ações',
  REAL_ESTATE: 'Imóveis',
  REAL_ESTATE_FUNDS: 'FIIs',
  CRYPTO: 'Cripto',
  BONDS: 'Tesouro',
  PRIVATE_BONDS: 'Renda Fixa',
  MUTUAL_FUND: 'Fundos',
  ETF: 'ETFs',
  PENSION: 'Previdência',
  SAVINGS: 'Poupança',
  FOREIGN_INVESTMENT: 'Exterior',
  CASH: 'Caixa',
  OTHER_INVESTMENT: 'Outros'
};

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<Record<string, BudgetComparison>>({});
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  
  // Filtros com valores padrão
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  
  // track id of budget being deleted (null = none)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBudgetType, setSelectedBudgetType] = useState<string>('ALL');

  useEffect(() => {
    loadBudgets();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await CategoryService.getCategories();
        setUserCategories(data);
      } catch (error) {
        console.error('Erro ao carregar categorias personalizadas:', error);
      }
    };

    loadCategories();
  }, []);

  // Navigate months across year boundaries
  const handlePrevMonth = () => {
    const m = parseInt(selectedMonth);
    if (m === 1) {
      setSelectedMonth('12');
      setSelectedYear(String(parseInt(selectedYear) - 1));
    } else {
      setSelectedMonth(String(m - 1));
    }
  };

  const handleNextMonth = () => {
    const m = parseInt(selectedMonth);
    if (m === 12) {
      setSelectedMonth('1');
      setSelectedYear(String(parseInt(selectedYear) + 1));
    } else {
      setSelectedMonth(String(m + 1));
    }
  };

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await getBudgets(parseInt(selectedYear), parseInt(selectedMonth));
      setBudgets(data);
      setComparisons({});
      
      const comparisonsData: Record<string, BudgetComparison> = {};
      await Promise.all(data.map(async (budget) => {
        try {
          const comparison = await getBudgetComparison(budget.id);
          comparisonsData[budget.id] = comparison;
        } catch (error) {
          console.error(`Erro ao carregar comparação para ${budget.id}`, error);
        }
      }));
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
    } catch (error) { console.error(error); }
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
      setDeletingId(budgetId);
      await deleteBudget(budgetId);
      setBudgets(budgets.filter(b => b.id !== budgetId));
      toast.success('Orçamento deletado');
    } catch (error) {
      toast.error('Erro ao deletar');
    } finally {
      setDeletingId(null);
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

  const handleDuplicateBudget = async (budget: Budget) => {
    try {
      await createBudget({
        name: `${budget.name} (Cópia)`,
        type: budget.type,
        category: budget.category || '',
        amount: budget.amount,
        period: budget.period,
        year: budget.year,
        month: budget.month || undefined,
      });
      toast.success('Duplicado com sucesso!');
      loadBudgets();
    } catch (error) {
      toast.error('Erro ao duplicar');
    }
  };

  const getCategoryLabel = (category: string | null | undefined, type: BudgetType) => {
    if (!category) {
      if (type === BudgetType.INCOME) return 'Receitas';
      if (type === BudgetType.INVESTMENT) return 'Investimentos';
      return 'Despesas';
    }

    const userCategory = userCategories.find(cat => cat.id === category);
    if (userCategory) return userCategory.name;

    if (type === BudgetType.EXPENSE) return expenseCategoriesLabels[category] || category;
    if (type === BudgetType.INCOME) return incomeCategoriesLabels[category] || category;
    if (type === BudgetType.INVESTMENT) return investmentCategoriesLabels[category] || category;
    return category;
  };

  const getUniqueCategories = () => {
    const categories = new Set(budgets.map(b => b.category).filter(Boolean)) as Set<string>;
    return Array.from(categories).sort();
  };

  const filteredBudgets = budgets.filter(budget => {
    if (selectedCategory !== 'ALL' && budget.category !== selectedCategory) return false;
    if (selectedBudgetType !== 'ALL' && budget.type !== selectedBudgetType) return false;
    return true;
  });

  const getAggregatedData = () => {
    const aggregated = {
      [BudgetType.EXPENSE]: { budgeted: 0, spent: 0 },
      [BudgetType.INCOME]: { budgeted: 0, spent: 0 },
      [BudgetType.INVESTMENT]: { budgeted: 0, spent: 0 },
    };
    budgets.forEach(budget => {
      const comparison = comparisons[budget.id];
      if (comparison) {
        aggregated[budget.type as keyof typeof aggregated].budgeted += comparison.budgeted;
        aggregated[budget.type as keyof typeof aggregated].spent += comparison.spent;
      }
    });
    return aggregated;
  };

  const getMonthName = (month: string) => {
    const m = parseInt(month);
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[m - 1] || 'Mês';
  };

  // Cores semânticas
  const getProgressColor = (percent: number) => {
    if (percent > 100) return 'bg-red-500';
    if (percent > 85) return 'bg-orange-500';
    return 'bg-emerald-500'; // Verde mais elegante
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Orçamentos</h1>
            <p className="text-zinc-500">Planeje onde cada centavo deve ir.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
             <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 rounded-lg text-zinc-600 hover:text-zinc-900"
               onClick={handlePrevMonth}
             >
                <ChevronDown className="h-4 w-4 rotate-90" />
             </Button>
             <span className="text-sm font-semibold w-32 text-center">
                {getMonthName(selectedMonth)} {selectedYear}
             </span>
             <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 rounded-lg text-zinc-600 hover:text-zinc-900"
               onClick={handleNextMonth}
             >
                <ChevronDown className="h-4 w-4 -rotate-90" />
             </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          
          {/* Segmented Control Tabs */}
          <div className="flex justify-center">
            <TabsList className="bg-zinc-200/50 p-1 rounded-full h-auto">
              <TabsTrigger 
                value="list" 
                className="rounded-full px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 text-zinc-500 transition-all"
              >
                Meus Orçamentos
              </TabsTrigger>
              <TabsTrigger 
                value="aggregate"
                className="rounded-full px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 text-zinc-500 transition-all gap-2"
              >
                <BarChart3 className="h-4 w-4" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="form"
                className="rounded-full px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 text-zinc-500 transition-all gap-2"
              >
                {selectedBudget ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {selectedBudget ? 'Editar' : 'Novo'}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* LIST TAB */}
          <TabsContent value="list" className="space-y-6 focus-visible:outline-none">
            
            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
               <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <Select value={selectedBudgetType} onValueChange={setSelectedBudgetType}>
                    <SelectTrigger className="w-[140px] h-9 rounded-lg bg-zinc-50 border-zinc-200 text-xs font-medium">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos Tipos</SelectItem>
                      <SelectItem value={BudgetType.EXPENSE}>Despesas</SelectItem>
                      <SelectItem value={BudgetType.INCOME}>Receitas</SelectItem>
                      <SelectItem value={BudgetType.INVESTMENT}>Investimentos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[160px] h-9 rounded-lg bg-zinc-50 border-zinc-200 text-xs font-medium">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas Categorias</SelectItem>
                      {getUniqueCategories().map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryLabel(
                            cat,
                            (budgets.find((budget) => budget.category === cat)?.type as BudgetType) || BudgetType.EXPENSE
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(selectedCategory !== 'ALL' || selectedBudgetType !== 'ALL') && (
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCategory('ALL'); setSelectedBudgetType('ALL'); }} className="h-9 w-9">
                       <X className="h-4 w-4 text-zinc-400" />
                    </Button>
                  )}
               </div>

               <Button onClick={handleCreateBudget} className="bg-blue-400 hover:bg-blue-500 text-white rounded-lg h-9 text-xs font-medium">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Novo Orçamento
               </Button>
            </div>

            {loading ? (
               <div className="space-y-4 animate-pulse">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-200 rounded-2xl" />)}
               </div>
            ) : filteredBudgets.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                  <Target className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500">Nenhum orçamento encontrado.</p>
               </div>
            ) : (
               <div className="grid gap-4">
                 {filteredBudgets.map((budget) => {
                   const comparison = comparisons[budget.id];
                   const percent = comparison ? (comparison.spent / budget.amount) * 100 : 0;
                   const isOver = comparison && comparison.spent > budget.amount;

                   return (
                     <Card key={budget.id} className="border-zinc-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                       <CardContent className="p-0">
                         {/* Main Row */}
                         <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
                            
                            {/* Info Left */}
                            <div className="flex-1 w-full">
                               <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                     <h3 className="font-bold text-zinc-900">{budget.name}</h3>
                                     <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 font-normal text-[10px]">
                                         {getCategoryLabel(budget.category, budget.type as BudgetType)}
                                     </Badge>
                                  </div>
                                  <div className="md:hidden">
                                     {/* Mobile Actions could go here */}
                                  </div>
                               </div>

                               <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-medium">
                                     <span className={cn(isOver ? "text-red-500" : "text-zinc-500")}>
                                        {comparison ? formatCurrency(comparison.spent) : 'R$ 0,00'}
                                     </span>
                                     <span className="text-zinc-400">
                                        de {formatCurrency(budget.amount)}
                                     </span>
                                  </div>
                                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                     <div 
                                        className={cn("h-full rounded-full transition-all duration-700", getProgressColor(percent))} 
                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                     />
                                  </div>
                               </div>
                            </div>

                            {/* Actions Right (Desktop) */}
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0">
                               <div className="text-right mr-4 hidden md:block">
                                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Restante</p>
                                  <p className={cn("font-bold", (comparison?.remaining || 0) < 0 ? "text-red-500" : "text-emerald-600")}>
                                     {comparison ? formatCurrency(comparison.remaining) : '-'}
                                  </p>
                               </div>
                               
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-blue-500" onClick={() => handleEditBudget(budget)}>
                                  <Edit className="h-4 w-4" />
                               </Button>
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-purple-500" onClick={() => handleDuplicateBudget(budget)}>
                                  <Copy className="h-4 w-4" />
                               </Button>
                               <Button size="icon" variant="ghost" className={cn("h-8 w-8 text-zinc-400 hover:text-red-500", deletingId === budget.id && 'opacity-60 cursor-wait')} onClick={() => handleDeleteBudget(budget.id)} disabled={deletingId === budget.id}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400" onClick={() => handleExpandBudget(budget.id)}>
                                  {expandedBudget === budget.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                               </Button>
                            </div>
                         </div>

                         {/* Expanded Details */}
                         {expandedBudget === budget.id && comparison && (
                            <div className="bg-zinc-50/50 border-t border-zinc-100 p-5 grid grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                               <div className="text-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                                  <p className="text-xs text-zinc-400 uppercase">Planejado</p>
                                  <p className="font-bold text-zinc-900 mt-1">{formatCurrency(comparison.budgeted)}</p>
                               </div>
                               <div className="text-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                                  <p className="text-xs text-zinc-400 uppercase">Realizado</p>
                                  <p className={cn("font-bold mt-1", comparison.spent > comparison.budgeted ? "text-red-600" : "text-zinc-900")}>
                                     {formatCurrency(comparison.spent)}
                                  </p>
                               </div>
                               <div className="text-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                                  <p className="text-xs text-zinc-400 uppercase">Transações</p>
                                  <p className="font-bold text-zinc-900 mt-1">{comparison.transactions}</p>
                               </div>
                            </div>
                         )}
                       </CardContent>
                     </Card>
                   );
                 })}
               </div>
            )}
          </TabsContent>

          {/* AGGREGATE TAB */}
          <TabsContent value="aggregate" className="space-y-6 focus-visible:outline-none">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                   { type: BudgetType.EXPENSE, title: 'Despesas', color: 'text-red-600', bg: 'bg-red-50', border: 'border-zinc-100' },
                   { type: BudgetType.INCOME, title: 'Receitas', color: 'text-green-600', bg: 'bg-blue-50', border: 'border-zinc-100' },
                   { type: BudgetType.INVESTMENT, title: 'Investimentos', color: 'text-slate-600', bg: 'bg-purple-50', border: 'border-zinc-100' }
                ].map((item) => {
                   const data = getAggregatedData()[item.type];
                   const diff = data.budgeted - data.spent;
                   
                   return (
                      <Card key={item.type} className={cn("border-l-4 shadow-sm", item.border, `border-l-${item.color.split('-')[1]}-500`)}>
                         <CardHeader className="pb-2">
                            <CardTitle className={cn("text-lg", item.color)}>{item.title}</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-6">
                            <div>
                               <p className="text-xs text-zinc-400 uppercase font-semibold">Orçado</p>
                               <p className="text-3xl font-bold text-zinc-900 tracking-tight">{formatCurrency(data.budgeted)}</p>
                            </div>
                            
                            <div className="space-y-1">
                               <div className="flex justify-between text-sm font-medium">
                                  <span className="text-zinc-500">Realizado</span>
                                  <span className={cn(data.spent > data.budgeted ? "text-red-500" : "text-emerald-600")}>
                                     {formatCurrency(data.spent)}
                                  </span>
                               </div>
                               <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                  <div 
                                     className={cn("h-full rounded-full", data.spent > data.budgeted ? "bg-red-500" : "bg-emerald-500")} 
                                     style={{ width: `${Math.min((data.spent / (data.budgeted || 1)) * 100, 100)}%` }}
                                  />
                               </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                               <span className="text-xs text-zinc-400">Saldo</span>
                               <Badge variant="outline" className={cn("font-mono", diff >= 0 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-red-600 border-red-200 bg-red-50")}>
                                  {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                               </Badge>
                            </div>
                         </CardContent>
                      </Card>
                   );
                })}
             </div>
          </TabsContent>

          {/* FORM TAB */}
          <TabsContent value="form" className="focus-visible:outline-none">
             <Card className="border-zinc-200 shadow-lg max-w-2xl mx-auto">
                <CardHeader className="border-b border-zinc-100 bg-white">
                   <CardTitle className="text-xl">
                      {selectedBudget ? 'Editar Orçamento' : 'Criar Novo Orçamento'}
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <BudgetForm
                      initialData={selectedBudget || undefined}
                      onSuccess={handleFormSuccess}
                   />
                </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
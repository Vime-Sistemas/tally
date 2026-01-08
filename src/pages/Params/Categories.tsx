import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Badge } from "../../components/ui/badge";
import { Plus, Edit2, Trash2, Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  ShoppingBag,
  Shirt,
  Gamepad2,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  Repeat,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  MoreHorizontal,
  Shield,
  Percent,
  Key,
  MapPin,
  Users,
  Smartphone,
  Glasses,
  KeyRound,
  Ticket,
  Wifi
} from 'lucide-react';
import { toast } from "sonner";
import { CategoryService, type Category, type CategoryInsight } from "../../services/categoryService";
import { BudgetForm } from "../../components/BudgetForm";
import { Progress } from "../../components/ui/progress";
import { formatCurrency } from "../../utils/formatters";
import { BudgetType } from "../../types/budget";
import { cn } from "../../lib/utils";

// Modern color palette presets
const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef",
  "#f43f5e", "#64748b"
];

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsPeriod, setInsightsPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    color: '#3b82f6',
    icon: '' as string | undefined,
  });

  useEffect(() => {
    loadCategories();
    loadCategoryInsights();
  }, []);

  useEffect(() => {
    let result = categories;
    
    if (search) {
      result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (typeFilter !== "ALL") {
      result = result.filter(c => c.type === typeFilter);
    }

    setFilteredCategories(result);
  }, [categories, search, typeFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryInsights = async () => {
    try {
      setInsightsLoading(true);
      const data = await CategoryService.getCategoryInsights();
      setInsights(data.insights || []);
      setInsightsPeriod({ month: data.month, year: data.year });
    } catch (error) {
      toast.error('Erro ao carregar resumo financeiro das categorias');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleOpenBudgetDialog = (category: Category) => {
    setBudgetCategory(category);
    setBudgetDialogOpen(true);
  };

  const handleBudgetDialogToggle = (open: boolean) => {
    if (!open) {
      setBudgetCategory(null);
    }
    setBudgetDialogOpen(open);
  };

  const handleBudgetSuccess = () => {
    setBudgetDialogOpen(false);
    setBudgetCategory(null);
    loadCategoryInsights();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Nome é obrigatório');

    try {
      if (editingCategory) {
        await CategoryService.updateCategory(editingCategory.id, formData);
        toast.success('Categoria atualizada');
      } else {
        const created = await CategoryService.createCategory(formData);
        toast.success('Categoria criada');
        handleOpenBudgetDialog(created);
      }
      setIsDialogOpen(false);
      resetForm();
      loadCategories();
      loadCategoryInsights();
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await CategoryService.deleteCategory(categoryToDelete);
      toast.success('Categoria removida');
      loadCategories();
      loadCategoryInsights();
    } catch (error) {
      toast.error('Erro ao remover categoria');
    } finally {
      setCategoryToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', type: 'EXPENSE', color: '#3b82f6', icon: undefined });
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || '#3b82f6',
      icon: category.icon || undefined,
    });
    setIsDialogOpen(true);
  };

  const ICON_OPTIONS = [
    'Coffee','Car','Home','Zap','Heart','ShoppingBag','Shirt','Gamepad2','GraduationCap','Briefcase',
    'DollarSign','TrendingUp','ArrowRightLeft','PiggyBank','Coins','Banknote','Wallet','Building2','Globe',
    'Repeat','Landmark','Receipt','PawPrint','Gift','Plane','MoreHorizontal',
    'Shield','Percent','Key','MapPin','Users', 'Smartphone', 'Glasses', 'KeyRound', 'Ticket', 'Wifi'
  ];

  const ICON_COMPONENTS: Record<string, any> = {
    Coffee,Car,Home,Zap,Heart,ShoppingBag,Shirt,Gamepad2,GraduationCap,Briefcase,
    DollarSign,TrendingUp,ArrowRightLeft,PiggyBank,Coins,Banknote,Wallet,Building2,Globe,
    Repeat,Landmark,Receipt,PawPrint,Gift,Plane,MoreHorizontal,Shield,Percent,Key,MapPin,Users,Smartphone, Glasses, KeyRound, Ticket, Wifi
  };

  const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const insightsById = useMemo(() => {
    const map = new Map<string, CategoryInsight>();
    insights.forEach(item => map.set(item.categoryId, item));
    return map;
  }, [insights]);

  const maxCurrentValue = useMemo(() => {
    if (insights.length === 0) return 0;
    return insights.reduce((max, item) => Math.max(max, item.currentMonth.total), 0);
  }, [insights]);

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return 'Sem lançamentos';
    try {
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(dateString));
    } catch (error) {
      return 'Sem lançamentos';
    }
  };

  const summaryLabel = `${MONTH_LABELS[insightsPeriod.month - 1] || ''} ${insightsPeriod.year}`;

  const renderCategoryInsight = (category: Category) => {
    if (insightsLoading) {
      return <div className="h-20 w-full animate-pulse rounded-2xl bg-zinc-100" />;
    }

    const insight = insightsById.get(category.id);

    if (!insight) {
      return (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 space-y-2">
          <p>Nenhuma movimentação registrada neste mês.</p>
          <Button
            variant="ghost"
            size="sm"
            className="px-0 h-6 text-blue-500 justify-start"
            onClick={() => handleOpenBudgetDialog(category)}
          >
            Configurar meta deste mês
          </Button>
        </div>
      );
    }

    const isNewFlow = insight.previousMonth.total === 0 && insight.currentMonth.total > 0;
    const variation = insight.variationPercentage;
    const variationText = isNewFlow
      ? 'Novo no mês'
      : variation === null
        ? 'Sem histórico'
        : `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%`;
    const trendClass = (() => {
      if (isNewFlow || variation === null) return 'text-zinc-500';
      if (variation > 0) {
        return category.type === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-600';
      }
      if (variation < 0) {
        return category.type === 'EXPENSE' ? 'text-emerald-600' : 'text-rose-500';
      }
      return 'text-zinc-500';
    })();

    const hasBudget = Boolean(insight.budget);
    const rawProgress = hasBudget
      ? insight.budget!.percentage
      : maxCurrentValue > 0
        ? (insight.currentMonth.total / maxCurrentValue) * 100
        : 0;
    const progressIndicatorClass = hasBudget && insight.budget!.remaining < 0 ? 'bg-rose-500' : 'bg-blue-400';

    return (
      <div className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Mês atual</span>
          <span className="font-semibold text-zinc-900">{formatCurrency(insight.currentMonth.total)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">vs mês anterior</span>
          <span className={cn('font-medium', trendClass)}>{variationText}</span>
        </div>
        <Progress
          value={Math.min(rawProgress, 100)}
          className="h-1.5 bg-zinc-200"
          indicatorClassName={progressIndicatorClass}
        />
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>{insight.currentMonth.transactions} movimentações</span>
          <span>{formatShortDate(insight.currentMonth.lastTransactionDate)}</span>
        </div>
        {hasBudget ? (
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Meta deste mês</span>
            <span className="font-semibold text-zinc-900">
              {formatCurrency(insight.budget!.spent)} de {formatCurrency(insight.budget!.amount)}
            </span>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 h-6 text-blue-500 justify-start"
            onClick={() => handleOpenBudgetDialog(category)}
          >
            Configurar meta deste mês
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Categorias</h1>
          <p className="text-sm text-zinc-500">Organize suas transações por tipo</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Buscar categorias..." 
            className="pl-9 bg-zinc-50/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant={typeFilter === "ALL" ? "secondary" : "ghost"} 
            onClick={() => setTypeFilter("ALL")}
            size="sm"
          >
            Todas
          </Button>
          <Button 
            variant={typeFilter === "INCOME" ? "secondary" : "ghost"} 
            onClick={() => setTypeFilter("INCOME")}
            size="sm"
            className="text-emerald-600"
          >
            Receitas
          </Button>
          <Button 
            variant={typeFilter === "EXPENSE" ? "secondary" : "ghost"} 
            onClick={() => setTypeFilter("EXPENSE")}
            size="sm"
            className="text-rose-600"
          >
            Despesas
          </Button>
        </div>
      </div>

      <div className="text-xs text-zinc-500 px-1">
        {insightsLoading ? 'Calculando resumo das categorias...' : `Resumo de ${summaryLabel}`}
      </div>

      {/* List */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[150px]">Tipo</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => {
                const CategoryIcon = category.icon ? ICON_COMPONENTS[category.icon] : null;
                const insight = insightsById.get(category.id);

                return (
                  <TableRow key={category.id} className="group align-top">
                    <TableCell className="align-top">
                      <div 
                        className="w-6 h-6 rounded-full border border-zinc-100 shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 text-zinc-900 font-semibold">
                            {CategoryIcon ? <CategoryIcon className="h-4 w-4 text-zinc-500" /> : null}
                            <span>{category.name}</span>
                          </div>
                          {insight && (
                            <span className="text-xs text-zinc-500">
                              {formatCurrency(insight.currentMonth.total)}
                            </span>
                          )}
                        </div>
                        {renderCategoryInsight(category)}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {category.type === 'INCOME' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                          <ArrowUpCircle className="h-3 w-3" /> Receita
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
                          <ArrowDownCircle className="h-3 w-3" /> Despesa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                          <Edit2 className="h-4 w-4 text-zinc-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setCategoryToDelete(category.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Alimentação"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded-full transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: formData.color }}
                    aria-hidden
                  >
                    +
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-6 gap-2">
                <button
                  type="button"
                  className={`p-2 rounded-lg border ${!formData.icon ? 'ring-2 ring-offset-2 ring-black' : 'hover:border-zinc-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, icon: undefined }))}
                >
                  -
                </button>
                {ICON_OPTIONS.map(name => {
                  const Icon = ICON_COMPONENTS[name];
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                      className={`p-2 rounded-lg border flex items-center justify-center gap-2 ${formData.icon === name ? 'ring-2 ring-offset-2 ring-black' : 'hover:border-zinc-300'}`}
                      title={name}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={budgetDialogOpen} onOpenChange={handleBudgetDialogToggle}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Meta para {budgetCategory?.name}</DialogTitle>
          </DialogHeader>
          {budgetCategory ? (
            <BudgetForm
              key={budgetCategory.id}
              presetCategoryId={budgetCategory.id}
              presetCategoryName={budgetCategory.name}
              presetType={budgetCategory.type === 'INCOME' ? BudgetType.INCOME : BudgetType.EXPENSE}
              presetMonth={insightsPeriod.month}
              presetYear={insightsPeriod.year}
              lockCategory
              onSuccess={handleBudgetSuccess}
            />
          ) : (
            <div className="py-6 text-center text-sm text-zinc-500">Selecione uma categoria para configurar a meta.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Transações ligadas a esta categoria podem ficar sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
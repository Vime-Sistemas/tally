import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { Progress } from "../../ui/progress";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { ScrollArea } from "../../ui/scroll-area";
import { cn } from "../../../lib/utils";
import { formatCurrency } from "../../../utils/formatters";
import { BudgetPeriod, BudgetType, type Budget } from "../../../types/budget";
import { createBudget, getBudgets } from "../../../services/api";
import { CategoryService, type Category, type CategoryInsight } from "../../../services/categoryService";

// ============================================================================
// Types
// ============================================================================

interface BudgetWizardDesktopProps {
  month: number;
  year: number;
  onCreated?: () => void;
  onCancel?: () => void;
}

interface BudgetAllocation {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  amount: number;
  type: BudgetType;
  isCustom?: boolean;
  insight?: {
    avgSpent: number;
    lastMonthSpent: number;
  };
}

interface DuplicateWarning {
  allocation: BudgetAllocation;
  existingBudget: Budget;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  // Despesas
  HOUSING: "Moradia",
  UTILITIES: "Contas Fixas",
  FOOD: "Alimentação",
  TRANSPORT: "Transporte",
  HEALTHCARE: "Saúde",
  INSURANCE: "Seguros",
  EDUCATION: "Educação",
  SHOPPING: "Compras",
  CLOTHING: "Vestuário",
  ENTERTAINMENT: "Lazer",
  SUBSCRIPTIONS: "Assinaturas",
  TAXES: "Impostos",
  FEES: "Taxas",
  PETS: "Pets",
  DONATIONS: "Doações",
  TRAVEL: "Viagens",
  OTHER_EXPENSE: "Outros",
  // Receitas
  SALARY: "Salário",
  BONUS: "Bônus",
  COMMISSION: "Comissão",
  FREELANCE: "Freelance",
  SELF_EMPLOYED: "PJ",
  INVESTMENT_INCOME: "Rendimentos",
  DIVIDENDS: "Dividendos",
  INTEREST: "Juros",
  RENT: "Aluguel",
  PENSION_INCOME: "Aposentadoria",
  BENEFITS: "Benefícios",
  GIFTS: "Presentes",
  REFUND: "Reembolsos",
  OTHER_INCOME: "Outros",
  // Investimentos
  STOCKS: "Ações",
  REAL_ESTATE: "Imóveis",
  REAL_ESTATE_FUNDS: "FIIs",
  CRYPTO: "Cripto",
  BONDS: "Tesouro",
  PRIVATE_BONDS: "Renda Fixa",
  MUTUAL_FUND: "Fundos",
  ETF: "ETFs",
  PENSION: "Previdência",
  SAVINGS: "Poupança",
  FOREIGN_INVESTMENT: "Exterior",
  CASH: "Caixa",
  OTHER_INVESTMENT: "Outros",
};

const ESSENTIAL_CATEGORIES = ["HOUSING", "UTILITIES", "FOOD", "TRANSPORT", "HEALTHCARE"];
const LIFESTYLE_CATEGORIES = ["ENTERTAINMENT", "SHOPPING", "CLOTHING", "SUBSCRIPTIONS", "TRAVEL"];

const MONTH_LABELS: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};

// ============================================================================
// Main Component
// ============================================================================

export function BudgetWizardDesktop({
  month,
  year,
  onCreated,
  onCancel,
}: BudgetWizardDesktopProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [existingBudgets, setExistingBudgets] = useState<Budget[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  
  // Income configuration
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [savingsRate, setSavingsRate] = useState(20);
  const [includeIncomeBudget, setIncludeIncomeBudget] = useState(false);
  
  // Allocations
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  
  // Custom allocation form
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customAmount, setCustomAmount] = useState(0);
  const [customType, setCustomType] = useState<BudgetType>(BudgetType.EXPENSE);

  // Computed values
  const savingsAmount = useMemo(
    () => Math.max(monthlyIncome * (savingsRate / 100), 0),
    [monthlyIncome, savingsRate]
  );

  const availablePool = useMemo(
    () => Math.max(monthlyIncome - savingsAmount, 0),
    [monthlyIncome, savingsAmount]
  );

  const totalAllocated = useMemo(
    () => allocations.reduce((sum, a) => sum + a.amount, 0),
    [allocations]
  );

  const remainingPool = useMemo(
    () => availablePool - totalAllocated,
    [availablePool, totalAllocated]
  );

  const allocationPercentage = useMemo(
    () => (availablePool > 0 ? (totalAllocated / availablePool) * 100 : 0),
    [totalAllocated, availablePool]
  );

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [budgets, categories, insightsData] = await Promise.all([
          getBudgets(year, month),
          CategoryService.getCategories(),
          CategoryService.getCategoryInsights({ month, year }).catch(() => ({ insights: [] })),
        ]);
        
        setExistingBudgets(budgets);
        setUserCategories(categories);
        setInsights(insightsData.insights || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados do orçamento");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [month, year]);

  // Generate suggested allocations based on income and insights
  useEffect(() => {
    if (monthlyIncome <= 0 || loading) return;

    const pool = monthlyIncome - savingsAmount;
    const newAllocations: BudgetAllocation[] = [];

    // Essential allocations (50% of pool)
    const essentialPool = pool * 0.5;
    const essentialShare = essentialPool / ESSENTIAL_CATEGORIES.length;

    ESSENTIAL_CATEGORIES.forEach((category) => {
      const insight = insights.find((i) => i.categoryId === category || i.name?.toUpperCase() === category);
      const suggestedAmount = insight?.currentMonth?.total || essentialShare;
      
      // Check if already exists
      const exists = existingBudgets.some(
        (b) => b.category === category && b.type === BudgetType.EXPENSE
      );
      
      if (!exists) {
        newAllocations.push({
          id: `essential-${category}`,
          name: CATEGORY_LABELS[category] || category,
          category,
          amount: Math.round(suggestedAmount),
          type: BudgetType.EXPENSE,
          insight: insight
            ? {
                avgSpent: insight.currentMonth?.total || 0,
                lastMonthSpent: insight.previousMonth?.total || 0,
              }
            : undefined,
        });
      }
    });

    // Lifestyle allocations (30% of pool)
    const lifestylePool = pool * 0.3;
    const lifestyleShare = lifestylePool / LIFESTYLE_CATEGORIES.length;

    LIFESTYLE_CATEGORIES.forEach((category) => {
      const insight = insights.find((i) => i.categoryId === category || i.name?.toUpperCase() === category);
      const suggestedAmount = insight?.currentMonth?.total || lifestyleShare;
      
      const exists = existingBudgets.some(
        (b) => b.category === category && b.type === BudgetType.EXPENSE
      );
      
      if (!exists) {
        newAllocations.push({
          id: `lifestyle-${category}`,
          name: CATEGORY_LABELS[category] || category,
          category,
          amount: Math.round(suggestedAmount),
          type: BudgetType.EXPENSE,
          insight: insight
            ? {
                avgSpent: insight.currentMonth?.total || 0,
                lastMonthSpent: insight.previousMonth?.total || 0,
              }
            : undefined,
        });
      }
    });

    setAllocations(newAllocations);
  }, [monthlyIncome, savingsAmount, insights, existingBudgets, loading]);

  // Check for duplicates
  const checkDuplicates = useCallback((): DuplicateWarning[] => {
    const warnings: DuplicateWarning[] = [];
    
    allocations.forEach((allocation) => {
      const existing = existingBudgets.find(
        (b) =>
          b.category === allocation.category &&
          b.type === allocation.type &&
          b.month === month &&
          b.year === year
      );
      
      if (existing) {
        warnings.push({ allocation, existingBudget: existing });
      }
    });
    
    return warnings;
  }, [allocations, existingBudgets, month, year]);

  // Handlers
  const handleAllocationChange = (id: string, amount: number) => {
    setAllocations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, amount: Math.max(0, amount) } : a))
    );
  };

  const handleRemoveAllocation = (id: string) => {
    setAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddCustomAllocation = () => {
    if (!customName.trim() || !customCategory || customAmount <= 0) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Check for duplicate
    const exists = existingBudgets.some(
      (b) =>
        b.category === customCategory &&
        b.type === customType &&
        b.month === month &&
        b.year === year
    );

    if (exists) {
      toast.error("Já existe um orçamento para esta categoria neste período");
      return;
    }

    const newAllocation: BudgetAllocation = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      amount: customAmount,
      type: customType,
      isCustom: true,
    };

    setAllocations((prev) => [...prev, newAllocation]);
    setCustomName("");
    setCustomCategory("");
    setCustomAmount(0);
    setShowAddCustom(false);
  };

  const handleCreate = async () => {
    if (allocations.length === 0) {
      toast.error("Adicione pelo menos uma alocação");
      return;
    }

    // Check for duplicates before creating
    const warnings = checkDuplicates();
    if (warnings.length > 0) {
      setDuplicateWarnings(warnings);
      setShowDuplicateDialog(true);
      return;
    }

    await createBudgets();
  };

  const createBudgets = async () => {
    setCreating(true);
    try {
      const budgetsToCreate = allocations.map((a) => ({
        name: a.name,
        type: a.type,
        category: a.categoryId || a.category,
        amount: a.amount,
        period: BudgetPeriod.MONTHLY,
        year,
        month,
      }));

      // Add income budget if enabled
      if (includeIncomeBudget && monthlyIncome > 0) {
        budgetsToCreate.push({
          name: "Renda mensal",
          type: BudgetType.INCOME,
          category: "SALARY",
          amount: monthlyIncome,
          period: BudgetPeriod.MONTHLY,
          year,
          month,
        });
      }

      await Promise.all(budgetsToCreate.map((b) => createBudget(b)));
      
      toast.success(`${budgetsToCreate.length} orçamentos criados com sucesso!`);
      onCreated?.();
    } catch (error) {
      console.error("Erro ao criar orçamentos:", error);
      toast.error("Erro ao criar orçamentos");
    } finally {
      setCreating(false);
      setShowDuplicateDialog(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const userCat = userCategories.find((c) => c.id === category);
    if (userCat) return userCat.name;
    return CATEGORY_LABELS[category] || category;
  };

  const getAvailableCategories = () => {
    const usedCategories = new Set(allocations.map((a) => a.category));
    const existingCategories = new Set(
      existingBudgets
        .filter((b) => b.month === month && b.year === year)
        .map((b) => b.category)
    );
    
    const allCategories = [
      ...Object.keys(CATEGORY_LABELS),
      ...userCategories.map((c) => c.id),
    ];
    
    return allCategories.filter(
      (c) => !usedCategories.has(c) && !existingCategories.has(c)
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          <p className="text-sm text-zinc-500">Carregando dados do orçamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Assistente de Orçamento
          </h2>
          <p className="text-sm text-zinc-500">
            {MONTH_LABELS[month]} de {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {existingBudgets.length > 0 && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600">
              {existingBudgets.length} orçamentos existentes
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Income Section */}
          <Card className="border-zinc-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                Renda e Economia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Renda mensal estimada</Label>
                  <Input
                    type="number"
                    min={0}
                    value={monthlyIncome || ""}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    placeholder="Ex: 10000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Meta de economia</Label>
                    <span className="text-sm font-medium text-blue-600">
                      {savingsRate}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    min={0}
                    max={50}
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(Number(e.target.value))}
                    className="h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>0%</span>
                    <span className="font-medium text-zinc-700">
                      {formatCurrency(savingsAmount)}
                    </span>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <PiggyBank className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      Criar orçamento de renda
                    </p>
                    <p className="text-xs text-zinc-500">
                      Acompanhe se a renda planejada está sendo atingida
                    </p>
                  </div>
                </div>
                <Switch
                  checked={includeIncomeBudget}
                  onCheckedChange={setIncludeIncomeBudget}
                />
              </div>
            </CardContent>
          </Card>

          {/* Allocations Section */}
          <Card className="border-zinc-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Alocações
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCustom(true)}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allocations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                  <p className="text-sm text-zinc-500">
                    Informe sua renda para gerar sugestões de alocação
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {allocations.map((allocation) => (
                        <AllocationItem
                          key={allocation.id}
                          allocation={allocation}
                          onChange={handleAllocationChange}
                          onRemove={handleRemoveAllocation}
                          getCategoryLabel={getCategoryLabel}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-zinc-200 sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Alocado</span>
                  <span className="font-medium">
                    {allocationPercentage.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(allocationPercentage, 100)}
                  className={cn(
                    "h-2",
                    allocationPercentage > 100 && "bg-red-100"
                  )}
                />
              </div>

              <Separator />

              {/* Values */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Renda</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(monthlyIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Economia</span>
                  <span className="text-sm font-medium text-blue-600">
                    -{formatCurrency(savingsAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Disponível</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(availablePool)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Total alocado</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-zinc-700">
                    Restante
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      remainingPool < 0 ? "text-red-600" : "text-emerald-600"
                    )}
                  >
                    {formatCurrency(remainingPool)}
                  </span>
                </div>
              </div>

              {/* Warning for over-allocation */}
              {remainingPool < 0 && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Alocação excede disponível
                      </p>
                      <p className="text-xs text-red-600">
                        Reduza algumas alocações para equilibrar o orçamento
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Allocations count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Orçamentos a criar</span>
                <Badge variant="secondary">
                  {allocations.length + (includeIncomeBudget ? 1 : 0)}
                </Badge>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full bg-blue-400 hover:bg-blue-500"
                  onClick={handleCreate}
                  disabled={creating || allocations.length === 0}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Criar Orçamentos
                </Button>
                {onCancel && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={onCancel}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-blue-100 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Dica</p>
                  <p className="text-xs text-blue-600">
                    As sugestões são baseadas no histórico de gastos. Ajuste conforme
                    suas necessidades reais.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Custom Allocation Dialog */}
      <Dialog open={showAddCustom} onOpenChange={setShowAddCustom}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Alocação</DialogTitle>
            <DialogDescription>
              Crie uma nova linha de orçamento personalizada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Viagem de férias"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={customType}
                onValueChange={(v) => setCustomType(v as BudgetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BudgetType.EXPENSE}>Despesa</SelectItem>
                  <SelectItem value={BudgetType.INCOME}>Receita</SelectItem>
                  <SelectItem value={BudgetType.INVESTMENT}>
                    Investimento
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={customCategory} onValueChange={setCustomCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCategories().map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                min={0}
                value={customAmount || ""}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddCustom(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCustomAllocation}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Orçamentos Duplicados
            </DialogTitle>
            <DialogDescription>
              Os seguintes orçamentos já existem para este período e não serão
              criados novamente:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {duplicateWarnings.map((warning) => (
              <div
                key={warning.allocation.id}
                className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {warning.allocation.name}
                  </p>
                  <p className="text-xs text-red-600">
                    Existente: {formatCurrency(warning.existingBudget.amount)}
                  </p>
                </div>
                <Badge variant="destructive">Duplicado</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDuplicateDialog(false)}
            >
              Revisar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Remove duplicates and create remaining
                const duplicateIds = new Set(
                  duplicateWarnings.map((w) => w.allocation.id)
                );
                setAllocations((prev) =>
                  prev.filter((a) => !duplicateIds.has(a.id))
                );
                setShowDuplicateDialog(false);
              }}
            >
              Remover Duplicados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Allocation Item Component
// ============================================================================

interface AllocationItemProps {
  allocation: BudgetAllocation;
  onChange: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  getCategoryLabel: (category: string) => string;
}

function AllocationItem({
  allocation,
  onChange,
  onRemove,
  getCategoryLabel,
}: AllocationItemProps) {
  const TypeIcon =
    allocation.type === BudgetType.INCOME
      ? TrendingUp
      : allocation.type === BudgetType.INVESTMENT
      ? PiggyBank
      : TrendingDown;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 hover:border-zinc-300 transition-colors"
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg",
          allocation.type === BudgetType.INCOME && "bg-emerald-50",
          allocation.type === BudgetType.EXPENSE && "bg-red-50",
          allocation.type === BudgetType.INVESTMENT && "bg-purple-50"
        )}
      >
        <TypeIcon
          className={cn(
            "w-5 h-5",
            allocation.type === BudgetType.INCOME && "text-emerald-500",
            allocation.type === BudgetType.EXPENSE && "text-red-500",
            allocation.type === BudgetType.INVESTMENT && "text-purple-500"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">
          {allocation.name}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-zinc-500">
            {getCategoryLabel(allocation.category)}
          </p>
          {allocation.insight && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-blue-500 cursor-help">
                    <Info className="w-3 h-3" />
                    <span>Baseado no histórico</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Média: {formatCurrency(allocation.insight.avgSpent)}</p>
                  <p>
                    Último mês: {formatCurrency(allocation.insight.lastMonthSpent)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="w-32">
        <Input
          type="number"
          min={0}
          value={allocation.amount || ""}
          onChange={(e) => onChange(allocation.id, Number(e.target.value))}
          className="h-9 text-right"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(allocation.id)}
      >
        <X className="w-4 h-4 text-zinc-400" />
      </Button>
    </motion.div>
  );
}

export default BudgetWizardDesktop;

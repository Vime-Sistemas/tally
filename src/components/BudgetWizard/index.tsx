import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BudgetPeriod, BudgetType } from '../../types/budget';
import { createBudget } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { CategoryService, type Category } from '../../services/categoryService';

interface BudgetWizardProps {
  month: number;
  year: number;
  onCreated?: () => void;
  onNavigateList?: () => void;
}

interface Allocation {
  id: string;
  label: string;
  category: string;
  amount: number;
  type: BudgetType;
  included: boolean;
  suggested?: boolean;
}

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
  OTHER_EXPENSE: 'Outros',
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
  OTHER_INCOME: 'Outros',
};

const flexTemplates = [
  { category: 'ENTERTAINMENT', label: 'Lazer', weight: 0.32 },
  { category: 'SUBSCRIPTIONS', label: 'Assinaturas e apps', weight: 0.18 },
  { category: 'EDUCATION', label: 'Cursos e desenvolvimento', weight: 0.2 },
  { category: 'SHOPPING', label: 'Compras', weight: 0.15 },
  { category: 'TRAVEL', label: 'Viagens', weight: 0.15 },
];

const fixedTemplates = [
  { category: 'HOUSING', label: 'Moradia', weight: 0.3 },
  { category: 'UTILITIES', label: 'Contas fixas', weight: 0.12 },
  { category: 'FOOD', label: 'Alimentação básica', weight: 0.16 },
  { category: 'TRANSPORT', label: 'Transporte', weight: 0.09 },
  { category: 'HEALTHCARE', label: 'Saúde', weight: 0.06 },
  { category: 'INSURANCE', label: 'Seguros', weight: 0.04 },
];

const makeId = () => Math.random().toString(36).slice(2, 9);

export function BudgetWizard({ month, year, onCreated, onNavigateList }: BudgetWizardProps) {
  const [step, setStep] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [savingsRate, setSavingsRate] = useState<number>(20);
  const [includeIncomeBudget, setIncludeIncomeBudget] = useState<boolean>(false);
  const [fixedAllocations, setFixedAllocations] = useState<Allocation[]>([]);
  const [flexAllocations, setFlexAllocations] = useState<Allocation[]>([]);
  const [customAllocations, setCustomAllocations] = useState<Allocation[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [creating, setCreating] = useState(false);

  const savingsAmount = useMemo(() => Math.max(monthlyIncome * (savingsRate / 100), 0), [monthlyIncome, savingsRate]);

  const availablePool = useMemo(() => Math.max(monthlyIncome - savingsAmount, 0), [monthlyIncome, savingsAmount]);

  const suggestedTotals = useMemo(() => {
    const fixedTotal = fixedAllocations.filter((a) => a.included).reduce((sum, a) => sum + a.amount, 0);
    const flexTotal = flexAllocations.filter((a) => a.included).reduce((sum, a) => sum + a.amount, 0);
    const customTotal = customAllocations.filter((a) => a.included).reduce((sum, a) => sum + a.amount, 0);
    const planned = fixedTotal + flexTotal + customTotal;
    return { fixedTotal, flexTotal, customTotal, planned, gap: availablePool - planned };
  }, [availablePool, fixedAllocations, flexAllocations, customAllocations]);

  const baseIncomeBudget = useMemo<Allocation | null>(() => {
    if (!includeIncomeBudget || monthlyIncome <= 0) return null;
    return {
      id: 'income-budget',
      label: 'Renda mensal',
      category: incomeCategoriesLabels.SALARY ? 'SALARY' : 'INCOME',
      amount: monthlyIncome,
      type: BudgetType.INCOME,
      included: true,
    };
  }, [includeIncomeBudget, monthlyIncome]);

  const allocationsToCreate = useMemo(() => {
    const base = [...fixedAllocations, ...flexAllocations, ...customAllocations].filter((a) => a.included && a.amount > 0);
    if (baseIncomeBudget) base.unshift(baseIncomeBudget);
    return base;
  }, [baseIncomeBudget, customAllocations, fixedAllocations, flexAllocations]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await CategoryService.getCategories();
        setUserCategories(data);
      } catch (error) {
        console.error('Erro ao carregar categorias personalizadas:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    applySuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyIncome, savingsAmount]);

  const applySuggestions = () => {
    const poolAfterSavings = Math.max(monthlyIncome - savingsAmount, 0);
    const fixed = fixedTemplates.map((template) => ({
      id: `fixed-${template.category}`,
      label: template.label,
      category: template.category,
      amount: Number((poolAfterSavings * template.weight).toFixed(2)),
      type: BudgetType.EXPENSE,
      included: true,
      suggested: true,
    }));

    const fixedTotal = fixed.reduce((sum, item) => sum + item.amount, 0);
    const remaining = Math.max(poolAfterSavings - fixedTotal, 0);

    const flex = flexTemplates.map((template) => ({
      id: `flex-${template.category}`,
      label: template.label,
      category: template.category,
      amount: Number((remaining * template.weight).toFixed(2)),
      type: BudgetType.EXPENSE,
      included: true,
      suggested: true,
    }));

    setFixedAllocations(fixed);
    setFlexAllocations(flex);
    setCustomAllocations([]);
  };

  const updateAllocationAmount = (listSetter: (value: Allocation[]) => void, list: Allocation[], id: string, amount: number) => {
    listSetter(list.map((item) => (item.id === id ? { ...item, amount: Math.max(amount, 0), suggested: false } : item)));
  };

  const toggleAllocation = (listSetter: (value: Allocation[]) => void, list: Allocation[], id: string, included: boolean) => {
    listSetter(list.map((item) => (item.id === id ? { ...item, included } : item)));
  };

  const addCustomAllocation = () => {
    if (!selectedCustomCategory && !customLabel) {
      toast.error('Selecione ou nomeie uma categoria');
      return;
    }
    if (!customAmount || customAmount <= 0) {
      toast.error('Defina um valor para a categoria');
      return;
    }

    const categoryKey = selectedCustomCategory || `CUSTOM-${makeId()}`;
    const label = customLabel || resolveCategoryLabel(categoryKey, BudgetType.EXPENSE);

    const newAllocation: Allocation = {
      id: `custom-${makeId()}`,
      label,
      category: categoryKey,
      amount: customAmount,
      type: BudgetType.EXPENSE,
      included: true,
      suggested: false,
    };

    setCustomAllocations((prev) => [...prev, newAllocation]);
    setSelectedCustomCategory('');
    setCustomLabel('');
    setCustomAmount(0);
  };

  const resolveCategoryLabel = (category: string, type: BudgetType) => {
    if (type === BudgetType.INCOME) return incomeCategoriesLabels[category] || category;
    return expenseCategoriesLabels[category] || category;
  };

  const handleCreateBudgets = async () => {
    if (allocationsToCreate.length === 0) {
      toast.error('Selecione ao menos uma linha para criar');
      return;
    }

    setCreating(true);
    try {
      const payloads = allocationsToCreate.map((item) => ({
        name: item.label,
        type: item.type,
        category: item.category,
        amount: item.amount,
        period: BudgetPeriod.MONTHLY,
        year,
        month,
      }));

      await Promise.all(payloads.map((data) => createBudget(data)));
      toast.success('Orçamentos criados com sucesso');
      onCreated?.();
      onNavigateList?.();
      setStep(0);
    } catch (error) {
      console.error('Erro ao criar orçamentos via assistente:', error);
      toast.error('Não foi possível criar os orçamentos');
    } finally {
      setCreating(false);
    }
  };

  const monthLabels: Record<number, string> = {
    1: 'Janeiro',
    2: 'Fevereiro',
    3: 'Março',
    4: 'Abril',
    5: 'Maio',
    6: 'Junho',
    7: 'Julho',
    8: 'Agosto',
    9: 'Setembro',
    10: 'Outubro',
    11: 'Novembro',
    12: 'Dezembro',
  };

  const steps = [
    {
      title: 'Renda do período',
      description: 'Informe quanto entra neste mês para calibrar o orçamento.',
      content: (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Período</Label>
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                {monthLabels[month]} / {year}
              </div>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Renda mensal estimada</Label>
              <Input
                type="number"
                min={0}
                value={monthlyIncome || ''}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                placeholder="Ex: 12000"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-zinc-700">
            <div>
              <p className="font-semibold text-blue-700">Ponto de partida</p>
              <p className="text-zinc-600">Usaremos essa renda para sugerir alocações sem salvar nada automaticamente.</p>
            </div>
            <Badge className="bg-blue-400 text-white">Assistente</Badge>
          </div>
        </div>
      ),
    },
    {
      title: 'Meta de economia',
      description: 'Reserve primeiro o quanto deseja guardar. Podemos lidar com poupança separadamente.',
      content: (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Percentual para economizar (%)</Label>
              <Input
                type="number"
                min={0}
                max={80}
                value={savingsRate}
                onChange={(e) => setSavingsRate(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor reservado</Label>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800">
                {formatCurrency(savingsAmount)}
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500">A economia geral não cria orçamento; cuidaremos disso no fluxo de poupança.</p>
        </div>
      ),
    },
    {
      title: 'Essenciais e fixas',
      description: 'Ajuste o núcleo do orçamento. Essas linhas costumam ser previsíveis.',
      content: (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-zinc-600">
              Sugerimos valores com base na renda menos a economia. Você pode ligar/desligar ou editar valores.
            </div>
            <Button variant="outline" size="sm" onClick={applySuggestions}>
              Recalcular sugestões
            </Button>
          </div>
          <div className="grid gap-3">
            {fixedAllocations.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                <Checkbox
                  checked={item.included}
                  onCheckedChange={(checked) => toggleAllocation(setFixedAllocations, fixedAllocations, item.id, Boolean(checked))}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                  <p className="text-xs text-zinc-500">Categoria: {resolveCategoryLabel(item.category, item.type)}</p>
                </div>
                <div className="w-40">
                  <Input
                    type="number"
                    min={0}
                    value={item.amount}
                    onChange={(e) => updateAllocationAmount(setFixedAllocations, fixedAllocations, item.id, Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Variáveis e ajustes',
      description: 'Distribua o que sobra para estilos de vida e novas categorias.',
      content: (
        <div className="grid gap-4">
          <div className="grid gap-3">
            {flexAllocations.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                <Checkbox
                  checked={item.included}
                  onCheckedChange={(checked) => toggleAllocation(setFlexAllocations, flexAllocations, item.id, Boolean(checked))}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                  <p className="text-xs text-zinc-500">Categoria: {resolveCategoryLabel(item.category, item.type)}</p>
                </div>
                <div className="w-40">
                  <Input
                    type="number"
                    min={0}
                    value={item.amount}
                    onChange={(e) => updateAllocationAmount(setFlexAllocations, flexAllocations, item.id, Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Adicionar categoria personalizada</p>
              <p className="text-xs text-zinc-500">Use suas categorias ou uma etiqueta rápida.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs text-zinc-500">Minhas categorias</Label>
                <div className="rounded-lg border border-zinc-200 bg-white">
                  <select
                    className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
                    value={selectedCustomCategory}
                    onChange={(e) => setSelectedCustomCategory(e.target.value)}
                    disabled={loadingCategories}
                  >
                    <option value="">Selecione</option>
                    {userCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                    ))}
                    {Object.entries(expenseCategoriesLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Nome manual</Label>
                <Input
                  placeholder="Ex: Pets premium"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Valor</Label>
                <Input
                  type="number"
                  min={0}
                  value={customAmount || ''}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={addCustomAllocation}>
                Adicionar linha
              </Button>
            </div>

            {customAllocations.length > 0 && (
              <div className="grid gap-2">
                {customAllocations.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                    <Checkbox
                      checked={item.included}
                      onCheckedChange={(checked) => toggleAllocation(setCustomAllocations, customAllocations, item.id, Boolean(checked))}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                      <p className="text-xs text-zinc-500">Categoria: {resolveCategoryLabel(item.category, item.type)}</p>
                    </div>
                    <div className="w-40">
                      <Input
                        type="number"
                        min={0}
                        value={item.amount}
                        onChange={(e) => updateAllocationAmount(setCustomAllocations, customAllocations, item.id, Number(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  const summaryCard = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs uppercase text-zinc-400">Renda</p>
          <p className="text-xl font-bold text-zinc-900">{formatCurrency(monthlyIncome)}</p>
        </CardContent>
      </Card>
      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs uppercase text-zinc-400">Para economizar</p>
          <p className="text-xl font-bold text-zinc-900">{formatCurrency(savingsAmount)}</p>
          <p className="text-[11px] text-zinc-500">{savingsRate}% reservado</p>
        </CardContent>
      </Card>
      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs uppercase text-zinc-400">Planejado</p>
          <p className="text-xl font-bold text-zinc-900">{formatCurrency(suggestedTotals.planned)}</p>
          <p className="text-[11px] text-zinc-500">Incluindo fixos e variáveis</p>
        </CardContent>
      </Card>
      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs uppercase text-zinc-400">Saldo livre</p>
          <p className={`text-xl font-bold ${suggestedTotals.gap >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(suggestedTotals.gap)}
          </p>
          <p className="text-[11px] text-zinc-500">Renda - economia - planejado</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-zinc-900">Assistente de orçamento</h2>
        <p className="text-sm text-zinc-600">
          Um fluxo rápido para definir renda, guardar primeiro e distribuir o restante por categoria. Nada é salvo até você confirmar.
        </p>
      </div>

      {summaryCard}

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg text-zinc-900">{steps[step].title}</CardTitle>
          <p className="text-sm text-zinc-600">{steps[step].description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps[step].content}

          <Separator />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Passo {step + 1} de {steps.length}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((prev) => Math.max(prev - 1, 0))}>
                Voltar
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))} className="bg-blue-400 hover:bg-blue-500 text-white">
                  Continuar
                </Button>
              ) : (
                <Button
                  onClick={handleCreateBudgets}
                  className="bg-blue-400 hover:bg-blue-500 text-white"
                  disabled={creating}
                >
                  {creating ? 'Criando...' : 'Criar orçamentos'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Switch checked={includeIncomeBudget} onCheckedChange={(checked) => setIncludeIncomeBudget(Boolean(checked))} />
            <span>Criar também um orçamento para a renda total do mês</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">Resumo das linhas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allocationsToCreate.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-500">
                    {item.type === BudgetType.EXPENSE ? 'Despesa' : 'Renda'}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-500">{resolveCategoryLabel(item.category, item.type)}</p>
                <p className="text-lg font-bold text-zinc-900">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
          {allocationsToCreate.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhuma linha selecionada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { createBudget, updateBudget } from '../../services/api';
import { BudgetType, BudgetPeriod, type Budget } from '../../types/budget';
import { toast } from 'sonner';
import { CurrencyInput } from '../ui/currency-input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CategoryService, type Category } from '../../services/categoryService';

const budgetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum([BudgetType.INCOME, BudgetType.EXPENSE, BudgetType.INVESTMENT]),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  period: z.enum([BudgetPeriod.MONTHLY, BudgetPeriod.YEARLY]),
  year: z.number().min(2020, 'Ano deve ser 2020 ou posterior'),
  month: z.number().min(1).max(12).optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const expenseCategoriesLabels: Record<string, string> = {
  HOUSING: 'Moradia',
  UTILITIES: 'Contas Fixas (Água, Luz, Internet, Gás)',
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
  FEES: 'Taxas e Tarifas',

  PETS: 'Pets',
  DONATIONS: 'Doações',

  TRAVEL: 'Viagens',

  OTHER_EXPENSE: 'Outros'
};


const incomeCategoriesLabels: Record<string, string> = {
  SALARY: 'Salário',
  BONUS: 'Bônus / PLR',
  COMMISSION: 'Comissão',

  FREELANCE: 'Freelance',
  SELF_EMPLOYED: 'Autônomo / PJ',

  INVESTMENT_INCOME: 'Rendimentos de Investimentos',
  DIVIDENDS: 'Dividendos',
  INTEREST: 'Juros',
  RENT: 'Aluguel',

  PENSION_INCOME: 'Previdência / Aposentadoria',

  BENEFITS: 'Benefícios',
  GIFTS: 'Presentes',
  REFUND: 'Reembolsos',

  OTHER_INCOME: 'Outros'
};


const investmentCategoriesLabels: Record<string, string> = {
  STOCKS: 'Ações',
  REAL_ESTATE: 'Imóveis',
  REAL_ESTATE_FUNDS: 'Fundos Imobiliários (FIIs)',
  CRYPTO: 'Criptomoedas',

  BONDS: 'Títulos Públicos',
  PRIVATE_BONDS: 'Títulos Privados (CDB, LCI, LCA, Debêntures)',

  MUTUAL_FUND: 'Fundos de Investimento',
  ETF: 'ETFs',

  PENSION: 'Previdência Privada',
  SAVINGS: 'Poupança',

  FOREIGN_INVESTMENT: 'Investimentos no Exterior',
  CASH: 'Caixa / Reserva de Emergência',

  OTHER_INVESTMENT: 'Outros'
};


interface BudgetFormProps {
  onSuccess?: () => void;
  initialData?: Budget;
  presetCategoryId?: string;
  presetCategoryName?: string;
  presetType?: BudgetType;
  presetMonth?: number;
  presetYear?: number;
  presetPeriod?: BudgetPeriod;
  lockCategory?: boolean;
}

export function BudgetForm({
  onSuccess,
  initialData,
  presetCategoryId,
  presetCategoryName,
  presetType,
  presetMonth,
  presetYear,
  presetPeriod,
  lockCategory,
}: BudgetFormProps) {
  const now = new Date();
  const fallbackYear = now.getFullYear();
  const fallbackMonth = now.getMonth() + 1;

  const resolvedType = initialData?.type || presetType || BudgetType.EXPENSE;
  const resolvedPeriod = initialData?.period || presetPeriod || BudgetPeriod.MONTHLY;
  const resolvedYear = initialData?.year || presetYear || fallbackYear;
  const resolvedMonth = initialData?.month || presetMonth || fallbackMonth;
  const defaultCategoryValue = initialData?.category || presetCategoryId || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<BudgetType>(resolvedType);
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>(resolvedPeriod);
  const [openCategory, setOpenCategory] = useState(false);
  const [currentYear] = useState(fallbackYear);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [useUserCategories, setUseUserCategories] = useState<boolean>(Boolean(presetCategoryId));

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: resolvedType,
      category: initialData?.category || presetCategoryId || '',
      amount: initialData?.amount || 0,
      period: resolvedPeriod,
      year: resolvedYear,
      month: resolvedPeriod === BudgetPeriod.MONTHLY ? resolvedMonth : undefined,
    },
  });

  const selectedCategoryValue = watch('category');

  const getCategoryLabels = (type: BudgetType) => {
    switch (type) {
      case BudgetType.INCOME:
        return incomeCategoriesLabels;
      case BudgetType.INVESTMENT:
        return investmentCategoriesLabels;
      default:
        return expenseCategoriesLabels;
    }
  };

  interface CategoryOption {
    key: string;
    label: string;
    color?: string;
  }

  const getCategoryOptions = (): CategoryOption[] => {
    if (useUserCategories && selectedType !== BudgetType.INVESTMENT) {
      const allowedType = selectedType === BudgetType.INCOME ? 'INCOME' : 'EXPENSE';
      return userCategories
        .filter(cat => cat.type === allowedType)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .map(cat => ({ key: cat.id, label: cat.name, color: cat.color }));
    }

    const labels = getCategoryLabels(selectedType);
    return Object.entries(labels)
      .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB, 'pt-BR'))
      .map(([key, label]) => ({ key, label }));
  };

  const categoryOptions = getCategoryOptions();

  const resolveCategoryLabel = () => {
    if (!selectedCategoryValue) return 'Selecione uma categoria...';
    const option = categoryOptions.find(option => option.key === selectedCategoryValue);
    if (option) return option.label;

    if (useUserCategories) {
      const fallbackUser = userCategories.find(cat => cat.id === selectedCategoryValue);
      if (fallbackUser) return fallbackUser.name;
    }

    const labels = getCategoryLabels(selectedType);
    if (labels[selectedCategoryValue]) {
      return labels[selectedCategoryValue];
    }

    return presetCategoryName || selectedCategoryValue;
  };

  const selectedCategoryColor = () => {
    if (!useUserCategories) return undefined;
    const option = categoryOptions.find(option => option.key === selectedCategoryValue);
    return option?.color;
  };

  const isCategoryLocked = Boolean(lockCategory && (presetCategoryId || initialData?.category));

  const handleReset = () => {
    reset();
    setSelectedType(resolvedType);
    setSelectedPeriod(resolvedPeriod);
    setValue('type', resolvedType);
    setValue('period', resolvedPeriod);
    setValue('year', resolvedYear);
    setValue('month', resolvedPeriod === BudgetPeriod.MONTHLY ? resolvedMonth : undefined);

    const matchesUserCategory = userCategories.some(cat => cat.id === defaultCategoryValue);
    const shouldUseUserCategory = Boolean(presetCategoryId || matchesUserCategory);
    setUseUserCategories(shouldUseUserCategory && resolvedType !== BudgetType.INVESTMENT);
    setValue('category', defaultCategoryValue);
  };

  const onSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedPeriod === BudgetPeriod.YEARLY) {
        data.month = undefined;
      }

      if (initialData) {
        await updateBudget(initialData.id, data);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        await createBudget(data);
        toast.success('Orçamento criado com sucesso!');
        reset();
      }
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setIsSubmitting(false);
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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await CategoryService.getCategories();
        setUserCategories(data);

        const editingCategoryId = initialData?.category;
        if (!presetCategoryId && editingCategoryId) {
          const matchesUserCategory = data.some(cat => cat.id === editingCategoryId);
          if (matchesUserCategory) {
            setUseUserCategories(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar categorias personalizadas:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [initialData?.category, presetCategoryId]);

  useEffect(() => {
    if (!presetCategoryId) return;
    setValue('category', presetCategoryId);
    setUseUserCategories(true);
  }, [presetCategoryId, setValue]);

  useEffect(() => {
    if (!presetCategoryId || userCategories.length === 0) return;
    const matchedCategory = userCategories.find(cat => cat.id === presetCategoryId);
    if (!matchedCategory) return;

    const mappedType = matchedCategory.type === 'INCOME' ? BudgetType.INCOME : BudgetType.EXPENSE;
    setSelectedType(mappedType);
    setValue('type', mappedType);
  }, [presetCategoryId, setValue, userCategories]);

  useEffect(() => {
    if (lockCategory && presetCategoryId) {
      setUseUserCategories(true);
    }
  }, [lockCategory, presetCategoryId]);

  useEffect(() => {
    if (selectedType === BudgetType.INVESTMENT && useUserCategories) {
      setUseUserCategories(false);
      setValue('category', '');
    }
  }, [selectedType, setValue, useUserCategories]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4">
        {/* Nome */}
        <div className="grid gap-2">
          <Label htmlFor="name">Nome do Orçamento</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="name"
                placeholder="Ex: Alimentação Junho"
              />
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Tipo e Categoria em uma linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={isCategoryLocked}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value as BudgetType);
                    setValue('category', '');
                    if (value === BudgetType.INVESTMENT) {
                      setUseUserCategories(false);
                    }
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BudgetType.EXPENSE}>Despesa</SelectItem>
                    <SelectItem value={BudgetType.INCOME}>Renda</SelectItem>
                    <SelectItem value={BudgetType.INVESTMENT}>Investimento</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Categoria</Label>
              {selectedType !== BudgetType.INVESTMENT && !isCategoryLocked && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>Minhas</span>
                  <Switch
                    checked={useUserCategories}
                    onCheckedChange={(checked) => {
                      setUseUserCategories(checked);
                      setValue('category', '');
                    }}
                    disabled={userCategories.length === 0}
                    aria-label="Alternar entre categorias personalizadas e padrão"
                  />
                </div>
              )}
            </div>
            {isCategoryLocked && (
              <p className="text-xs text-zinc-500">Esta meta está vinculada à categoria selecionada.</p>
            )}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                isCategoryLocked ? (
                  <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    {resolveCategoryLabel()}
                  </div>
                ) : (
                  <Popover open={openCategory} onOpenChange={setOpenCategory}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCategory}
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2 truncate">
                          {selectedCategoryColor() && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: selectedCategoryColor() }}
                            />
                          )}
                          <span className="truncate">{resolveCategoryLabel()}</span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command
                        filter={(value, search) => {
                          const option = categoryOptions.find(c => c.key === value);
                          if (!option) return 0;
                          const normalizedSearch = search.toLowerCase();
                          return option.label.toLowerCase().includes(normalizedSearch) ||
                            option.key.toLowerCase().includes(normalizedSearch)
                            ? 1
                            : 0;
                        }}
                      >
                        <CommandInput placeholder="Pesquisar categoria..." />
                        <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {categoryOptions.map((category) => (
                              <CommandItem
                                key={category.key}
                                value={category.key}
                                onSelect={(currentValue) => {
                                  field.onChange(currentValue === field.value ? '' : currentValue);
                                  setOpenCategory(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === category.key ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <span className="flex items-center gap-2">
                                  {category.color && (
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: category.color }}
                                    />
                                  )}
                                  {category.label}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )
              )}
            />
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
            {useUserCategories && (
              loadingCategories ? (
                <p className="text-xs text-zinc-500">Carregando categorias...</p>
              ) : userCategories.length === 0 ? (
                <p className="text-xs text-zinc-500">Crie categorias personalizadas para usá-las aqui.</p>
              ) : null
            )}
          </div>
        </div>

        {/* Valor e Período em uma linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor Orçado (R$)</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="amount"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="0,00"
                />
              )}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="period">Período</Label>
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedPeriod(value as BudgetPeriod);
                    if (value === BudgetPeriod.YEARLY) {
                      setValue('month', undefined);
                    } else {
                      setValue('month', resolvedMonth);
                    }
                  }}
                >
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Selecione um período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BudgetPeriod.MONTHLY}>Mensal</SelectItem>
                    <SelectItem value={BudgetPeriod.YEARLY}>Anual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.period && (
              <p className="text-sm text-red-500">{errors.period.message}</p>
            )}
          </div>
        </div>

        {/* Ano e Mês (condicional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="year">Ano</Label>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Selecione um ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(
                      (year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.year && (
              <p className="text-sm text-red-500">{errors.year.message}</p>
            )}
          </div>

          {selectedPeriod === BudgetPeriod.MONTHLY && (
            <div className="grid gap-2">
              <Label htmlFor="month">Mês</Label>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ''}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Selecione um mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(monthLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.month && (
                <p className="text-sm text-red-500">{errors.month.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-4 pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleReset}
        >
          Limpar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-400 hover:bg-blue-500 text-white"
        >
          {isSubmitting
            ? 'Salvando...'
            : initialData
              ? 'Atualizar'
              : 'Criar'}
        </Button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '../ui/select';
import { Button } from '../ui/button';
import { createBudget, updateBudget } from '../../services/api';
import { BudgetType, BudgetPeriod, type Budget } from '../../types/budget';
import { toast } from 'sonner';
import { CurrencyInput } from '../ui/currency-input';

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
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',
  HOUSING: 'Moradia',
  UTILITIES: 'Contas',
  HEALTHCARE: 'Saúde',
  ENTERTAINMENT: 'Lazer',
  EDUCATION: 'Educação',
  SHOPPING: 'Compras',
  INVESTMENT: 'Investimento',
  OTHER_EXPENSE: 'Outros',
};

const incomeCategoriesLabels: Record<string, string> = {
  SALARY: 'Salário',
  FREELANCE: 'Freelance',
  INVESTMENT: 'Investimento',
  OTHER_INCOME: 'Outros',
};

const investmentCategoriesLabels: Record<string, string> = {
  STOCKS: 'Ações',
  REAL_ESTATE: 'Imóvel',
  CRYPTO: 'Criptomoedas',
  BONDS: 'Títulos',
  MUTUAL_FUND: 'Fundos',
  OTHER_INVESTMENT: 'Outros',
};

interface BudgetFormProps {
  onSuccess?: () => void;
  initialData?: Budget;
}

export function BudgetForm({ onSuccess, initialData }: BudgetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<BudgetType>(
    initialData?.type || BudgetType.EXPENSE
  );
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>(
    initialData?.period || BudgetPeriod.MONTHLY
  );
  const [currentYear] = useState(new Date().getFullYear());

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || BudgetType.EXPENSE,
      category: initialData?.category || '',
      amount: initialData?.amount || undefined,
      period: initialData?.period || BudgetPeriod.MONTHLY,
      year: initialData?.year || currentYear,
      month: initialData?.month || undefined,
    },
  });

  const amount = watch('amount');

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

  const onSubmit: SubmitHandler<BudgetFormData> = async (data) => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Orçamento' : 'Novo Orçamento'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Orçamento</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    placeholder="Ex: Alimentação Junho"
                    className="bg-white text-black"
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedType(value as BudgetType);
                    }}
                  >
                    <SelectTrigger id="type" className="bg-white text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tipo de Orçamento</SelectLabel>
                        <SelectItem value={BudgetType.EXPENSE}>Despesa</SelectItem>
                        <SelectItem value={BudgetType.INCOME}>Renda</SelectItem>
                        <SelectItem value={BudgetType.INVESTMENT}>Investimento</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category" className="bg-white text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categorias</SelectLabel>
                        {Object.entries(getCategoryLabels(selectedType)).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Orçado</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    {...field}
                    id="amount"
                    value={amount ?? 0}
                    onValueChange={(value) => field.onChange(value)}
                    placeholder="R$ 0,00"
                  />
                )}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Período */}
            <div className="space-y-2">
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
                    }}
                  >
                    <SelectTrigger id="period" className="bg-white text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Período</SelectLabel>
                        <SelectItem value={BudgetPeriod.MONTHLY}>Mensal</SelectItem>
                        <SelectItem value={BudgetPeriod.YEARLY}>Anual</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.period && (
                <p className="text-sm text-red-500">{errors.period.message}</p>
              )}
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger id="year" className="bg-white text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Ano</SelectLabel>
                        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(
                          (year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.year && (
                <p className="text-sm text-red-500">{errors.year.message}</p>
              )}
            </div>

            {/* Mês (condicional) */}
            {selectedPeriod === BudgetPeriod.MONTHLY && (
              <div className="space-y-2">
                <Label htmlFor="month">Mês</Label>
                <Controller
                  name="month"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger id="month" className="bg-white text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Mês</SelectLabel>
                          {Object.entries(monthLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.month && (
                  <p className="text-sm text-red-500">{errors.month.message}</p>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting
                  ? 'Salvando...'
                  : initialData
                    ? 'Atualizar'
                    : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

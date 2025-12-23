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
} from '../ui/select';
import { Button } from '../ui/button';
import { createBudget, updateBudget } from '../../services/api';
import { BudgetType, BudgetPeriod, type Budget, type CreateBudgetDTO } from '../../types/budget';
import { toast } from 'sonner';
import { CurrencyInput } from '../ui/currency-input';

const budgetSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum([BudgetType.INCOME, BudgetType.EXPENSE, BudgetType.INVESTMENT]),
  category: z.string().optional(),
  amount: z.number().positive('O valor deve ser positivo'),
  period: z.enum([BudgetPeriod.MONTHLY, BudgetPeriod.YEARLY]),
  year: z.number().min(2020, 'Ano inválido'),
  month: z.number().min(1).max(12).optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const expenseCategoriesLabels: Record<string, string> = {
  ALL: 'Geral (Todas as despesas)',
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',
  HOUSING: 'Moradia',
  UTILITIES: 'Contas',
  HEALTHCARE: 'Saúde',
  ENTERTAINMENT: 'Lazer',
  EDUCATION: 'Educação',
  SHOPPING: 'Compras',
  INVESTMENT: 'Investimento / Aplicação',
  OTHER_EXPENSE: 'Outros',
};

const incomeCategoriesLabels: Record<string, string> = {
  ALL: 'Geral (Todas as receitas)',
  SALARY: 'Salário',
  FREELANCE: 'Freelance',
  INVESTMENT: 'Investimento',
  OTHER_INCOME: 'Outros',
};

const investmentCategoriesLabels: Record<string, string> = {
  ALL: 'Geral (Todos os investimentos)',
};

interface BudgetFormProps {
  onSuccess?: () => void;
  initialData?: Budget;
}

export function BudgetForm({ onSuccess, initialData }: BudgetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(initialData?.type || BudgetType.EXPENSE);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialData?.period || BudgetPeriod.MONTHLY);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: (initialData?.type as any) || BudgetType.EXPENSE,
      category: initialData?.category || 'ALL',
      amount: initialData?.amount || undefined,
      period: (initialData?.period as any) || BudgetPeriod.MONTHLY,
      year: initialData?.year || currentYear,
      month: initialData?.month || currentMonth,
    },
  });

  const onSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    try {
      setIsSubmitting(true);

      const payload: CreateBudgetDTO = {
        name: data.name,
        type: data.type,
        category: data.category !== 'ALL' ? data.category : undefined,
        amount: data.amount,
        period: data.period,
        year: data.year,
        month: data.period === 'MONTHLY' ? data.month : undefined,
      };

      if (initialData) {
        await updateBudget(initialData.id, payload);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        await createBudget(payload);
        reset();
        toast.success('Orçamento criado com sucesso!');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoriesForType = () => {
    switch (selectedType) {
      case BudgetType.INCOME:
        return Object.entries(incomeCategoriesLabels);
      case BudgetType.INVESTMENT:
        return Object.entries(investmentCategoriesLabels);
      case BudgetType.EXPENSE:
      default:
        return Object.entries(expenseCategoriesLabels);
    }
  };

  return (
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-center text-black">
          {initialData ? 'Editar Orçamento' : 'Novo Orçamento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-600">Nome do Orçamento</Label>
            <Input
              id="name"
              placeholder="Ex: Alimentação - Janeiro 2026"
              className="h-10 border-gray-200 focus:border-black focus:ring-black"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Valor em destaque */}
          <div className="flex flex-col items-center space-y-3 w-full">
            <Label className="text-gray-500 font-medium">Valor Orçado</Label>
            <div className="w-full flex justify-center">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value || 0}
                    onValueChange={field.onChange}
                    placeholder="0,00"
                    className="text-3xl font-semibold"
                    symbolClassName="text-3xl font-semibold text-gray-400"
                    autoResize
                  />
                )}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 text-center">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-600">Tipo</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value);
                  }}>
                    <SelectTrigger id="type" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BudgetType.EXPENSE}>Despesa</SelectItem>
                      <SelectItem value={BudgetType.INCOME}>Receita</SelectItem>
                      <SelectItem value={BudgetType.INVESTMENT}>Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-600">Categoria</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoriesForType().map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Período */}
            <div className="space-y-2">
              <Label htmlFor="period" className="text-gray-600">Período</Label>
              <Controller
                name="period"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedPeriod(value);
                  }}>
                    <SelectTrigger id="period" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BudgetPeriod.MONTHLY}>Mensal</SelectItem>
                      <SelectItem value={BudgetPeriod.YEARLY}>Anual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-gray-600">Ano</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                className="h-10 border-gray-200 focus:border-black focus:ring-black"
                {...register('year', { valueAsNumber: true })}
              />
              {errors.year && (
                <p className="text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>
          </div>

          {/* Mês - Apenas se for MONTHLY */}
          {selectedPeriod === BudgetPeriod.MONTHLY && (
            <div className="space-y-2">
              <Label htmlFor="month" className="text-gray-600">Mês</Label>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                    <SelectTrigger id="month" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-400 hover:bg-blue-500 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Orçamento' : 'Criar Orçamento')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

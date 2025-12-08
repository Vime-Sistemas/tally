import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
import { transactionService } from '../../services/transactions';
import { TransactionType, type TransactionCategory } from '../../types/transaction';

const transactionSchema = z.object({
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  date: z.string().min(1, 'Data é obrigatória'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const incomeCategoriesLabels: Record<string, string> = {
  SALARY: 'Salário',
  FREELANCE: 'Freelance',
  INVESTMENT: 'Investimento',
  OTHER_INCOME: 'Outros',
};

const expenseCategoriesLabels: Record<string, string> = {
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',
  HOUSING: 'Moradia',
  UTILITIES: 'Contas',
  HEALTHCARE: 'Saúde',
  ENTERTAINMENT: 'Lazer',
  EDUCATION: 'Educação',
  SHOPPING: 'Compras',
  OTHER_EXPENSE: 'Outros',
};

export function TransactionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.EXPENSE);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: TransactionType.EXPENSE,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      await transactionService.create({
        ...data,
        category: data.category as TransactionCategory,
      });
      reset();
      alert('Movimentação registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      alert('Erro ao registrar movimentação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (value: string) => {
    const type = value as TransactionType;
    setSelectedType(type);
  };

  const getCategoriesForType = () => {
    if (selectedType === TransactionType.INCOME) {
      return Object.entries(incomeCategoriesLabels);
    }
    return Object.entries(expenseCategoriesLabels);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Nova Movimentação</CardTitle>
        <CardDescription>Registre uma receita ou despesa</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => {
                    field.onChange(value);
                    handleTypeChange(value);
                  }}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.EXPENSE}>
                        Despesa
                      </SelectItem>
                      <SelectItem value={TransactionType.INCOME}>
                        Receita
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
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
                    <SelectTrigger id="category">
                      <SelectValue />
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
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Compras no mercado"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Movimentação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

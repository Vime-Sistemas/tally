import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-center text-black">Nova Transação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Valor em destaque */}
          <div className="flex flex-col items-center space-y-3">
            <Label htmlFor="amount" className="text-gray-500 font-medium">Valor</Label>
            <div className="relative w-full max-w-[240px]">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                  R$
               </div>
               <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="text-center text-3xl h-16 pl-10 font-semibold border-gray-200 focus:border-black focus:ring-black rounded-xl shadow-sm"
                {...register('amount', { valueAsNumber: true })}
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
                    handleTypeChange(value);
                  }}>
                    <SelectTrigger id="type" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
                      <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
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
          {errors.category && (
            <p className="text-sm text-red-600 -mt-2">{errors.category.message}</p>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-600">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Compras do mês"
              className="h-10 border-gray-200 focus:border-black focus:ring-black"
              {...register('description')}
            />
             {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-600">Data</Label>
            <Input
              id="date"
              type="date"
              className="h-10 border-gray-200 focus:border-black focus:ring-black"
              {...register('date')}
            />
             {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

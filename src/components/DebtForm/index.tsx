import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { CurrencyInput } from '../ui/currency-input';
import { Receipt, Calendar, Percent } from 'lucide-react';
import { toast } from 'sonner';import { createDebt } from '../../services/api';
const debtSchema = z.object({
  name: z.string().min(1, 'Nome da dívida é obrigatório'),
  totalAmount: z.number().min(0, 'Valor total deve ser positivo'),
  remainingAmount: z.number().min(0, 'Valor restante deve ser positivo'),
  interestRate: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  creditor: z.string().optional(),
  description: z.string().optional(),
});

type DebtFormData = z.infer<typeof debtSchema>;

export function DebtForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      totalAmount: 0,
      remainingAmount: 0,
      interestRate: 0,
    },
  });

  const onSubmit = async (data: DebtFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        interestRate: data.interestRate && data.interestRate > 0 ? data.interestRate : undefined,
        creditor: data.creditor || undefined,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
      };
      await createDebt(submitData);
      toast.success('Dívida criada com sucesso!');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao criar dívida');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-zinc-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-900">
          <Receipt className="h-5 w-5" />
          Nova Dívida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-700">
                Nome da Dívida *
              </Label>
              <Input
                id="name"
                placeholder="Ex: Empréstimo Banco X"
                className="border-zinc-300 focus:border-black"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditor" className="text-zinc-700">
                Credor
              </Label>
              <Input
                id="creditor"
                placeholder="Ex: Banco do Brasil"
                className="border-zinc-300 focus:border-black"
                {...register('creditor')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount" className="text-zinc-700">
                Valor Total *
              </Label>
              <Controller
                name="totalAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="R$ 0,00"
                    className="border-zinc-300 focus:border-black"
                  />
                )}
              />
              {errors.totalAmount && (
                <p className="text-sm text-red-600">{errors.totalAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="remainingAmount" className="text-zinc-700">
                Valor Restante *
              </Label>
              <Controller
                name="remainingAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="R$ 0,00"
                    className="border-zinc-300 focus:border-black"
                  />
                )}
              />
              {errors.remainingAmount && (
                <p className="text-sm text-red-600">{errors.remainingAmount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate" className="text-zinc-700 flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Taxa de Juros (% ao ano)
              </Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="border-zinc-300 focus:border-black"
                {...register('interestRate', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-zinc-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data de Vencimento
              </Label>
              <Input
                id="dueDate"
                type="date"
                className="border-zinc-300 focus:border-black"
                {...register('dueDate')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-700">
              Descrição
            </Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre a dívida..."
              className="border-zinc-300 focus:border-black resize-none"
              rows={3}
              {...register('description')}
            />
          </div>
          <div className="flex justify-center">
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-45 bg-blue-400 text-white hover:bg-blue-500"
            >
                {isSubmitting ? 'Criando...' : 'Criar Dívida'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
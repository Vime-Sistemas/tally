import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { CurrencyInput } from '../ui/currency-input';
import { Receipt, Calendar, Percent, User, AlertCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { createDebt } from '../../services/api';
import { Kbd } from '../ui/kbd';

const debtSchema = z.object({
  name: z.string().min(1, 'Nome da dívida é obrigatório'),
  totalAmount: z.number().min(0.01, 'Valor total deve ser maior que zero'),
  remainingAmount: z.number().min(0, 'Valor restante não pode ser negativo'),
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
    watch,
    setValue,
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      totalAmount: 0,
      remainingAmount: 0,
      interestRate: 0,
    },
  });

  // Sincronizar o valor restante com o total inicialmente
  const totalAmount = watch('totalAmount');
  useEffect(() => {
    const remaining = watch('remainingAmount');
    // Se o restante for 0 e o total mudar, assume que é uma dívida nova (total = restante)
    if (remaining === 0 && totalAmount > 0) {
      setValue('remainingAmount', totalAmount);
    }
  }, [totalAmount, setValue, watch]);

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
      toast.success('Dívida registrada com sucesso!');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao registrar dívida');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border border-zinc-100 rounded-3xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* 1. Header Visual */}
          <div className="flex flex-col items-center space-y-2 mb-4">
            <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4" />
              Nova Dívida
            </div>
            <p className="text-zinc-500 text-sm">Registre um compromisso financeiro.</p>
          </div>

          {/* 2. Seção de Valores (Lado a Lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100">
            {/* Valor Original */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" /> Valor Original
              </Label>
              <div className="relative">
                <Controller
                  name="totalAmount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                      className="h-12 text-xl font-bold bg-white border-zinc-200 focus:ring-red-100 focus:border-red-300 rounded-xl pl-4"
                      symbolClassName="text-zinc-400 text-sm font-normal mr-2"
                    />
                  )}
                />
              </div>
              {errors.totalAmount && <p className="text-xs text-red-500 ml-1">{errors.totalAmount.message}</p>}
            </div>

            {/* Valor Atual/Restante */}
            <div className="space-y-2">
              <Label htmlFor="remainingAmount" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Valor Atual (Restante)
              </Label>
              <div className="relative">
                <Controller
                  name="remainingAmount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                      className="h-12 text-xl font-bold bg-white border-zinc-200 focus:ring-red-100 focus:border-red-300 rounded-xl pl-4 text-red-600"
                      symbolClassName="text-zinc-400 text-sm font-normal mr-2"
                    />
                  )}
                />
              </div>
              {errors.remainingAmount && <p className="text-xs text-red-500 ml-1">{errors.remainingAmount.message}</p>}
            </div>
          </div>

          {/* 3. Detalhes Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Nome da Dívida</Label>
              <Input
                id="name"
                placeholder="Ex: Financiamento Carro"
                className="h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditor" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Credor / Instituição</Label>
              <div className="relative">
                <Input
                  id="creditor"
                  placeholder="Ex: Banco Itaú"
                  className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                  {...register('creditor')}
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
              </div>
            </div>
          </div>

          {/* 4. Detalhes Técnicos (Datas e Juros) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Vencimento</Label>
              <div className="relative">
                <Input
                  id="dueDate"
                  type="date"
                  className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                  {...register('dueDate')}
                />
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Juros (% a.a.)</Label>
              <div className="relative">
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                  {...register('interestRate', { valueAsNumber: true })}
                />
                <Percent className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
              </div>
            </div>
          </div>

          {/* 5. Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Observações</Label>
            <Textarea
              id="description"
              placeholder="Detalhes adicionais sobre o pagamento..."
              className="min-h-[80px] rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 resize-none"
              {...register('description')}
            />
          </div>
          <div className='flex justify-center'>
            <Button
                type="submit"
                className="w-55 h-12 bg-blue-400 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Salvando...' : 'Registrar Dívida'}
                {!isSubmitting && (
                <Kbd className="hidden md:inline-flex bg-white/20 text-white border-white/20 text-xs ml-2">Enter</Kbd>
                )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
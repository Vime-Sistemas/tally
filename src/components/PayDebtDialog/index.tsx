import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerClose } from '../ui/drawer';
import { X, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { createTransaction, updateDebt, getAccounts } from '../../services/api';
import type { Debt } from '../../services/api';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { CurrencyInput } from '../ui/currency-input';
import type { Account } from '../../types/account';

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PayDebtDialogProps {
  debt: Debt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PayDebtDialog({ debt, open, onOpenChange, onSuccess }: PayDebtDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open]);

  const loadAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
      // Set default account if available
      if (data.length > 0) {
        setValue('accountId', data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!debt) return;

    setIsSubmitting(true);
    try {
      // Create transaction
      await createTransaction({
        type: 'EXPENSE',
        category: 'DEBT_PAYMENT',
        amount: data.amount,
        description: data.description || `Pagamento da dívida: ${debt.name}`,
        date: data.date,
        accountId: data.accountId,
      });

      // Update debt remaining amount
      const newRemainingAmount = Math.max(0, debt.remainingAmount - data.amount);
      await updateDebt(debt.id, {
        remainingAmount: newRemainingAmount,
        status: newRemainingAmount === 0 ? 'PAID' : 'ACTIVE',
      });

      toast.success('Pagamento registrado com sucesso!');
      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {debt && (
        <div className="p-4 bg-zinc-50 rounded-lg">
          <h3 className="font-medium text-zinc-900">{debt.name}</h3>
          <p className="text-sm text-zinc-600">
            Valor restante: {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(debt.remainingAmount)}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-zinc-700 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Valor do Pagamento *
            </Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value || 0}
                  onValueChange={field.onChange}
                  placeholder="R$ 0,00"
                  className="border-zinc-300 focus:border-black"
                />
              )}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-zinc-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Data do Pagamento *
            </Label>
            <Input
              id="date"
              type="date"
              className="border-zinc-300 focus:border-black"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountId" className="text-zinc-700 flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            Conta para Débito *
          </Label>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:border-black focus:outline-none"
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.accountId && (
            <p className="text-sm text-red-600">{errors.accountId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-zinc-700">
            Descrição (opcional)
          </Label>
          <Input
            id="description"
            placeholder="Ex: Pagamento parcial"
            className="border-zinc-300 focus:border-black"
            {...register('description')}
          />
        </div>
        <div className='flex justify-center'>
         <Button
          type="submit"
          disabled={isSubmitting}
          className="w-45 bg-blue-400 text-white hover:bg-blue-500"
          >
          {isSubmitting ? 'Registrando...' : 'Registrar Pagamento'}
        </Button>       
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b">
            <DrawerTitle className="flex items-center gap-2 text-zinc-900">
              <DollarSign className="h-5 w-5" />
              Pagar Dívida
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <div className="p-4 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900">
            <DollarSign className="h-5 w-5" />
            Pagar Dívida
          </DialogTitle>
          <DialogDescription>
            Registre um pagamento para esta dívida.
          </DialogDescription>
        </DialogHeader>
        <div className="px-1">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
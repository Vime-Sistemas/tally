import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { toast } from 'sonner';
import { createTransaction, getAccounts } from '../../services/api';
import type { CreditCard, Account } from '../../types/account';
import { TransactionType, TransactionCategory } from '../../types/transaction';

const payInvoiceSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  accountId: z.string().min(1, 'Conta de origem é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
});

type PayInvoiceFormData = z.infer<typeof payInvoiceSchema>;

interface PayInvoiceDialogProps {
  open: boolean;
  card: CreditCard;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PayInvoiceDialog({ open, card, onOpenChange, onSuccess }: PayInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PayInvoiceFormData>({
    resolver: zodResolver(payInvoiceSchema),
    defaultValues: {
      amount: card.currentInvoice,
      date: new Date().toISOString().split('T')[0],
      description: `Pagamento Fatura ${card.name}`,
    },
  });

  useEffect(() => {
    if (open) {
      setValue('amount', card.currentInvoice);
      setValue('description', `Pagamento Fatura ${card.name}`);
      loadAccounts();
    }
  }, [open, card, setValue]);

  const loadAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const onSubmit = async (data: PayInvoiceFormData) => {
    try {
      setIsSubmitting(true);
      
      await createTransaction({
        type: TransactionType.INVOICE_PAYMENT,
        category: 'OTHER_EXPENSE' as TransactionCategory, // Or a specific category for invoice payment
        amount: data.amount,
        description: data.description || `Pagamento Fatura ${card.name}`,
        date: data.date,
        accountId: data.accountId,
        cardId: card.id,
      });

      toast.success('Pagamento registrado com sucesso!');
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagar Fatura - {card.name}</DialogTitle>
          <DialogDescription>
            Registre o pagamento ou antecipação da fatura do seu cartão.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <Input
                id="amount"
                type="number"
                step="0.01"
                className="pl-10"
                {...register('amount', { valueAsNumber: true })}
                />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
            <p className="text-xs text-gray-500">
                Fatura atual: R$ {card.currentInvoice.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Pagar com</Label>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAccounts ? "Carregando..." : "Selecione a conta"} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} (R$ {account.balance.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data do Pagamento</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Pagamento antecipado"
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

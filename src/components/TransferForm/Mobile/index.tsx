import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Button } from '../../ui/button';
import { toast } from 'sonner';
import { getAccounts, createTransaction, confirmTransaction } from '../../../services/api';
import type { Account } from '../../../types/account';
import { InsufficientBalanceDialog } from '../../InsufficientBalanceDialog';
import { Loader2, ArrowRightLeft } from 'lucide-react';

const transferSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  sourceAccount: z.string().min(1, 'Conta de origem é obrigatória'),
  destinationAccount: z.string().min(1, 'Conta de destino é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
}).refine((data) => data.sourceAccount !== data.destinationAccount, {
  message: "A conta de destino deve ser diferente da conta de origem",
  path: ["destinationAccount"],
});

type TransferFormData = z.infer<typeof transferSchema>;

export function MobileTransferForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingData, setPendingData] = useState<TransferFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
        toast.error('Erro ao carregar contas');
      }
    };
    loadAccounts();
  }, []);

  const onSubmit = async (data: TransferFormData) => {
    try {
      setIsSubmitting(true);
      await createTransaction({
        type: 'TRANSFER',
        category: 'TRANSFER',
        amount: data.amount,
        description: data.description || 'Transferência entre contas',
        date: data.date,
        accountId: data.sourceAccount,
        destinationAccountId: data.destinationAccount,
      });
      reset();
      toast.success('Transferência realizada com sucesso!');
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        const info = error.response.data;
        setBalanceInfo({
          currentBalance: info.currentBalance,
          transactionAmount: info.transactionAmount,
          accountName: accounts.find(a => a.id === info.accountId)?.name || 'Conta'
        });
        setPendingData(data);
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao realizar transferência:', error);
        toast.error('Erro ao realizar transferência');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!pendingData) return;
    try {
      setIsSubmitting(true);
      await confirmTransaction({
        type: 'TRANSFER',
        category: 'TRANSFER',
        amount: pendingData.amount,
        description: pendingData.description || 'Transferência entre contas',
        date: pendingData.date,
        accountId: pendingData.sourceAccount,
        destinationAccountId: pendingData.destinationAccount,
        confirmNegativeBalance: true,
      });
      reset();
      toast.success('Transferência realizada com sucesso!');
      setShowBalanceDialog(false);
      setPendingData(null);
      setBalanceInfo(null);
    } catch (error) {
      console.error('Erro ao confirmar transferência:', error);
      toast.error('Erro ao confirmar transferência');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 mb-6 text-gray-500">
        <ArrowRightLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Nova Transferência</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                className="pl-10 h-12 text-lg"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <span className="text-sm text-red-500">{errors.amount.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Conta de Origem</Label>
            <Controller
              name="sourceAccount"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sourceAccount && (
              <span className="text-sm text-red-500">{errors.sourceAccount.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Conta de Destino</Label>
            <Controller
              name="destinationAccount"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.destinationAccount && (
              <span className="text-sm text-red-500">{errors.destinationAccount.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input 
              type="date" 
              className="h-12"
              {...register('date')} 
            />
            {errors.date && (
              <span className="text-sm text-red-500">{errors.date.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Input 
              placeholder="Ex: Pagamento de aluguel" 
              className="h-12"
              {...register('description')} 
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium rounded-xl" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Transferindo...
            </>
          ) : (
            'Realizar Transferência'
          )}
        </Button>
      </form>

      <InsufficientBalanceDialog 
        open={showBalanceDialog} 
        currentBalance={balanceInfo?.currentBalance || 0}
        requiredAmount={balanceInfo?.transactionAmount || 0}
        finalBalance={(balanceInfo?.currentBalance || 0) - (balanceInfo?.transactionAmount || 0)}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setShowBalanceDialog(false)}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Kbd } from '../ui/kbd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { getAccounts, createTransaction, confirmTransaction } from '../../services/api';
import type { Account } from '../../types/account';
import { InsufficientBalanceDialog } from '../InsufficientBalanceDialog';

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

export function TransferForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  useEffect(() => {
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
      // Check if it's an insufficient balance error
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        const info = error.response.data;
        setBalanceInfo(info);
        setPendingData(data);
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao realizar transferência:', error);
        toast.error('Erro ao realizar transferência. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNegativeBalance = async () => {
    if (!pendingData || !balanceInfo) return;

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
        confirmNegativeBalance: true
      });

      reset();
      setShowBalanceDialog(false);
      setPendingData(null);
      setBalanceInfo(null);
      toast.success('Transferência realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      toast.error('Erro ao realizar transferência');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-center text-black">Nova Transferência</CardTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conta de Origem */}
            <div className="space-y-2">
              <Label htmlFor="sourceAccount" className="text-gray-600">Conta de Origem</Label>
              <Controller
                name="sourceAccount"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                    <SelectTrigger id="sourceAccount" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione" />
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
                <p className="text-sm text-red-600">{errors.sourceAccount.message}</p>
              )}
            </div>

            {/* Conta de Destino */}
            <div className="space-y-2">
              <Label htmlFor="destinationAccount" className="text-gray-600">Conta de Destino</Label>
              <Controller
                name="destinationAccount"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                    <SelectTrigger id="destinationAccount" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione" />
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
                <p className="text-sm text-red-600">{errors.destinationAccount.message}</p>
              )}
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-600">Data</Label>
            <Input
              id="date"
              type="date"
              className="h-10 border-gray-200 focus:border-black focus:ring-black block w-full"
              {...register('date')}
            />
             {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-600">Descrição (Opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Transferência para poupança"
              className="h-10 border-gray-200 focus:border-black focus:ring-black"
              {...register('description')}
            />
             {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-400 hover:bg-blue-500 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Realizar Transferência'}
            {!isSubmitting && <Kbd className="bg-gray-700 text-white border-gray-600">Ctrl+Enter</Kbd>}
          </Button>
        </form>
      </CardContent>
    </Card>

    {balanceInfo && (
      <InsufficientBalanceDialog
        open={showBalanceDialog}
        currentBalance={balanceInfo.currentBalance}
        requiredAmount={balanceInfo.requiredAmount}
        finalBalance={balanceInfo.finalBalance}
        onConfirm={handleConfirmNegativeBalance}
        onCancel={() => {
          setShowBalanceDialog(false);
          setBalanceInfo(null);
          setPendingData(null);
        }}
        isLoading={isSubmitting}
      />
    )}
    </>
  );
}

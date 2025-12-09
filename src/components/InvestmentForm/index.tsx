import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { getAccounts, createTransaction } from '../../services/api';
import type { Account } from '../../types/account';
import { InsufficientBalanceDialog } from '../InsufficientBalanceDialog';

const investmentSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  investmentType: z.string().min(1, 'Tipo de aplicação é obrigatório'),
  sourceAccount: z.string().min(1, 'Conta de origem é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

const investmentTypeMap: Record<string, string> = {
  'CDB': 'CDB',
  'TREASURY': 'Tesouro Direto',
  'STOCKS': 'Ações',
  'FII': 'FIIs',
  'CRYPTO': 'Criptomoedas',
  'OTHER': 'Outros',
};

export function InvestmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingData, setPendingData] = useState<InvestmentFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
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
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, []);

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      setIsSubmitting(true);
      await createTransaction({
        type: 'EXPENSE',
        category: 'INVESTMENT',
        amount: data.amount,
        description: data.description || `Investimento em ${investmentTypeMap[data.investmentType] || data.investmentType}`,
        date: data.date,
        accountId: data.sourceAccount,
      });
      reset();
      toast.success('Aplicação registrada com sucesso!');
    } catch (error: any) {
      // Check if it's an insufficient balance error
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        const info = error.response.data;
        setBalanceInfo(info);
        setPendingData(data);
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao registrar aplicação:', error);
        toast.error('Erro ao registrar aplicação. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNegativeBalance = async () => {
    if (!pendingData || !balanceInfo) return;

    try {
      setIsSubmitting(true);
      // Retry with confirmation flag using the confirm endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/transactions/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            type: 'EXPENSE',
            category: 'INVESTMENT',
            amount: pendingData.amount,
            description: pendingData.description || `Investimento em ${investmentTypeMap[pendingData.investmentType] || pendingData.investmentType}`,
            date: pendingData.date,
            accountId: pendingData.sourceAccount,
            confirmNegativeBalance: true
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      reset();
      setShowBalanceDialog(false);
      setPendingData(null);
      setBalanceInfo(null);
      toast.success('Aplicação registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar aplicação:', error);
      toast.error('Erro ao registrar aplicação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-center text-black">Nova Aplicação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Valor em destaque */}
          <div className="flex flex-col items-center space-y-3">
            <Label htmlFor="amount" className="text-gray-500 font-medium">Valor da Aplicação</Label>
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
            {/* Tipo de Aplicação */}
            <div className="space-y-2">
              <Label htmlFor="investmentType" className="text-gray-600">Tipo de Aplicação</Label>
              <Controller
                name="investmentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="investmentType" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(investmentTypeMap).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.investmentType && (
                <p className="text-sm text-red-600">{errors.investmentType.message}</p>
              )}
            </div>

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
              placeholder="Ex: Aporte mensal CDB"
              className="h-10 border-gray-200 focus:border-black focus:ring-black"
              {...register('description')}
            />
             {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Registrar Aplicação'}
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

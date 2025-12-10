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
import { Loader2, TrendingUp } from 'lucide-react';

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
  'FOUNDS': 'Fundos',
  'CP': 'Crédito Privado',
  'PREVIDENCIA': 'Previdência',
  'CRYPTO': 'Criptomoedas',
  'OTHER': 'Outros',
};

export function MobileInvestmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
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
      toast.success('Investimento registrado com sucesso!');
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
        console.error('Erro ao registrar investimento:', error);
        toast.error('Erro ao registrar investimento');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmInvestment = async () => {
    if (!pendingData) return;
    try {
      setIsSubmitting(true);
      await confirmTransaction({
        type: 'EXPENSE',
        category: 'INVESTMENT',
        amount: pendingData.amount,
        description: pendingData.description || `Investimento em ${investmentTypeMap[pendingData.investmentType] || pendingData.investmentType}`,
        date: pendingData.date,
        accountId: pendingData.sourceAccount,
        confirmNegativeBalance: true,
      });
      reset();
      toast.success('Investimento registrado com sucesso!');
      setShowBalanceDialog(false);
      setPendingData(null);
      setBalanceInfo(null);
    } catch (error) {
      console.error('Erro ao confirmar investimento:', error);
      toast.error('Erro ao confirmar investimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 mb-6 text-gray-500">
        <TrendingUp className="h-5 w-5" />
        <span className="text-sm font-medium">Novo Investimento</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Aplicado</Label>
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
            <Label>Tipo de Aplicação</Label>
            <Controller
              name="investmentType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(investmentTypeMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.investmentType && (
              <span className="text-sm text-red-500">{errors.investmentType.message}</span>
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
            <Label>Data da Aplicação</Label>
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
              placeholder="Ex: Aporte mensal" 
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
              Registrando...
            </>
          ) : (
            'Registrar Investimento'
          )}
        </Button>
      </form>

      <InsufficientBalanceDialog 
        open={showBalanceDialog} 
        currentBalance={balanceInfo?.currentBalance || 0}
        requiredAmount={balanceInfo?.transactionAmount || 0}
        finalBalance={(balanceInfo?.currentBalance || 0) - (balanceInfo?.transactionAmount || 0)}
        onConfirm={handleConfirmInvestment}
        onCancel={() => setShowBalanceDialog(false)}
      />
    </div>
  );
}

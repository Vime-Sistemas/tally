import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { MobileInput, MobileDateInput } from '../../ui/mobile-input';
import { MobilePicker, MobilePickerTrigger, type PickerOption } from '../../ui/mobile-picker';
import { toast } from 'sonner';
import { getAccounts, createTransaction, confirmTransaction } from '../../../services/api';
import type { Account } from '../../../types/account';
import { InsufficientBalanceDialog } from '../../InsufficientBalanceDialog';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

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

  // Picker states
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedType = watch('investmentType');
  const selectedAccount = watch('sourceAccount');

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

  // Build investment type options
  const investmentTypeOptions: PickerOption[] = useMemo(() => {
    return Object.entries(investmentTypeMap).map(([value, label]) => ({
      value,
      label,
    }));
  }, []);

  // Build account options
  const accountOptions: PickerOption[] = useMemo(() => {
    return accounts.map(acc => ({
      value: acc.id,
      label: acc.name,
    }));
  }, [accounts]);

  // Get selected account info
  const sourceAccount = accounts.find(a => a.id === selectedAccount);

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
    <div className="pb-24 bg-[#F2F2F7] min-h-full -mx-4 -mt-4 px-4 pt-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Valor Aplicado</label>
                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-gray-400 transition-colors">
                  <span className="pl-4 text-gray-500 font-medium">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    className="flex-1 px-2 py-4 bg-transparent text-xl font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    enterKeyHint="done"
                  />
                </div>
                {errors.amount && (
                  <span className="text-sm text-red-500">{errors.amount.message}</span>
                )}
              </div>
            )}
          />
        </div>

        {/* Details Section */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {/* Investment Type */}
          <div className="p-4">
            <MobilePickerTrigger
              label="Tipo de Aplicação"
              value={selectedType}
              options={investmentTypeOptions}
              placeholder="Selecione o tipo"
              onClick={() => setTypePickerOpen(true)}
              error={errors.investmentType?.message}
            />
          </div>

          {/* Source Account */}
          <button
            type="button"
            onClick={() => setAccountPickerOpen(true)}
            className="w-full p-4 text-left active:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Conta de Origem</span>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {sourceAccount ? (
                  <>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold", sourceAccount.color || 'bg-gray-400')}>
                      {sourceAccount.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{sourceAccount.name}</p>
                      <p className="text-sm text-gray-500">R$ {sourceAccount.balance.toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">Selecione a conta</span>
                )}
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {errors.sourceAccount && (
              <span className="text-sm text-red-500 mt-1 block">{errors.sourceAccount.message}</span>
            )}
          </button>

          {/* Date */}
          <div className="p-4">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <MobileDateInput
                  label="Data da Aplicação"
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.date?.message}
                />
              )}
            />
          </div>

          {/* Description */}
          <div className="p-4">
            <MobileInput
              label="Descrição (Opcional)"
              placeholder="Ex: Aporte mensal"
              {...register('description')}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-14 text-base font-semibold rounded-2xl bg-black hover:bg-gray-800" 
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

      {/* Pickers */}
      <Controller
        name="investmentType"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={typePickerOpen}
            onOpenChange={setTypePickerOpen}
            value={field.value}
            onValueChange={field.onChange}
            options={investmentTypeOptions}
            title="Tipo de Aplicação"
          />
        )}
      />

      <Controller
        name="sourceAccount"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={accountPickerOpen}
            onOpenChange={setAccountPickerOpen}
            value={field.value}
            onValueChange={field.onChange}
            options={accountOptions}
            title="Conta de Origem"
          />
        )}
      />

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

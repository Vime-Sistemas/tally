import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { MobileInput, MobileDateInput } from '../../ui/mobile-input';
import { MobilePicker, type PickerOption } from '../../ui/mobile-picker';
import { toast } from 'sonner';
import { getAccounts, createTransaction, confirmTransaction } from '../../../services/api';
import type { Account } from '../../../types/account';
import { InsufficientBalanceDialog } from '../../InsufficientBalanceDialog';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

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

  // Picker states
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedSource = watch('sourceAccount');
  const selectedDestination = watch('destinationAccount');

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

  // Build account options
  const accountOptions: PickerOption[] = useMemo(() => {
    return accounts.map(acc => ({
      value: acc.id,
      label: acc.name,
    }));
  }, [accounts]);

  // Get selected account info
  const sourceAccount = accounts.find(a => a.id === selectedSource);
  const destinationAccount = accounts.find(a => a.id === selectedDestination);

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
    <div className="pb-24 bg-[#F2F2F7] min-h-full -mx-4 -mt-4 px-4 pt-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Valor da Transferência</label>
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

        {/* Accounts Section - Visual Transfer */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Source Account */}
          <button
            type="button"
            onClick={() => setSourcePickerOpen(true)}
            className="w-full p-4 text-left active:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">De</span>
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
                  <span className="text-gray-400">Selecione a conta de origem</span>
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

          {/* Arrow Divider */}
          <div className="flex justify-center -my-3 relative z-10">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white">
              <ArrowDown className="h-5 w-5 text-gray-600" />
            </div>
          </div>

          {/* Destination Account */}
          <button
            type="button"
            onClick={() => setDestinationPickerOpen(true)}
            className="w-full p-4 text-left active:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Para</span>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {destinationAccount ? (
                  <>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold", destinationAccount.color || 'bg-gray-400')}>
                      {destinationAccount.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{destinationAccount.name}</p>
                      <p className="text-sm text-gray-500">R$ {destinationAccount.balance.toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">Selecione a conta de destino</span>
                )}
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {errors.destinationAccount && (
              <span className="text-sm text-red-500 mt-1 block">{errors.destinationAccount.message}</span>
            )}
          </button>
        </div>

        {/* Additional Details */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {/* Date */}
          <div className="p-4">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <MobileDateInput
                  label="Data"
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
              placeholder="Ex: Pagamento de aluguel"
              {...register('description')}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-14 text-base font-semibold rounded-2xl bg-blue-400 hover:bg-gray-800" 
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

      {/* Pickers */}
      <Controller
        name="sourceAccount"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={sourcePickerOpen}
            onOpenChange={setSourcePickerOpen}
            value={field.value}
            onValueChange={field.onChange}
            options={accountOptions}
            title="Conta de Origem"
          />
        )}
      />

      <Controller
        name="destinationAccount"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={destinationPickerOpen}
            onOpenChange={setDestinationPickerOpen}
            value={field.value}
            onValueChange={field.onChange}
            options={accountOptions}
            title="Conta de Destino"
          />
        )}
      />

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

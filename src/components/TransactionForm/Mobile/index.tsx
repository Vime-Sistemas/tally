import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { MobileInput, MobileDateInput } from '../../ui/mobile-input';
import { MobilePicker, MobilePickerTrigger, type PickerOption } from '../../ui/mobile-picker';
import { createTransaction, confirmTransaction, getAccounts, getCards } from '../../../services/api';
import { equityService } from '../../../services/equities';
import { TransactionType, type TransactionCategory } from '../../../types/transaction';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../../types/account';
import type { Equity } from '../../../types/equity';
import { InsufficientBalanceDialog } from '../../InsufficientBalanceDialog';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

const transactionSchema = z.object({
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  date: z.string().min(1, 'Data é obrigatória'),
  paymentMethod: z.string().min(1, 'Selecione uma conta ou cartão'),
  equityId: z.string().optional(),
  installments: z.number().min(2, 'Mínimo de 2 parcelas').optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const incomeCategoriesLabels: Record<string, string> = {
  SALARY: 'Salário',
  FREELANCE: 'Freelance',
  INVESTMENT: 'Investimento',
  OTHER_INCOME: 'Outros',
};

const expenseCategoriesLabels: Record<string, string> = {
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',
  HOUSING: 'Moradia',
  UTILITIES: 'Contas',
  HEALTHCARE: 'Saúde',
  ENTERTAINMENT: 'Lazer',
  EDUCATION: 'Educação',
  SHOPPING: 'Compras',
  INVESTMENT: 'Investimento / Aplicação',
  OTHER_EXPENSE: 'Outros',
};

interface TransactionFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function MobileTransactionForm({ onSuccess, initialData }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    initialData?.type || TransactionType.EXPENSE
  );
  const [isInstallment, setIsInstallment] = useState(!!initialData?.installments);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  // Picker states
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [equityPickerOpen, setEquityPickerOpen] = useState(false);
  const [installmentsPickerOpen, setInstallmentsPickerOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accData, cardData, eqData] = await Promise.all([
          getAccounts(),
          getCards(),
          equityService.getAll()
        ]);
        setAccounts(accData);
        setCards(cardData);
        setEquities(eqData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      }
    };
    loadData();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialData?.type || TransactionType.EXPENSE,
      date: initialData?.date?.substring(0, 10) || new Date().toISOString().split('T')[0],
      description: initialData?.description || '',
      amount: initialData?.amount || undefined,
      category: initialData?.category || '',
      paymentMethod: initialData?.cardId 
        ? `card_${initialData.cardId}` 
        : initialData?.accountId || '',
      equityId: initialData?.equityId || '',
      installments: initialData?.installments || undefined,
    },
  });

  const selectedCategory = watch('category');
  const selectedPaymentMethod = watch('paymentMethod');
  const selectedEquity = watch('equityId');
  const watchedInstallments = watch('installments');

  // Build category options
  const categoryOptions: PickerOption[] = useMemo(() => {
    const labels = selectedType === TransactionType.INCOME 
      ? incomeCategoriesLabels 
      : expenseCategoriesLabels;
    return Object.entries(labels).map(([value, label]) => ({ value, label }));
  }, [selectedType]);

  // Build payment method options
  const paymentMethodOptions: PickerOption[] = useMemo(() => {
    const options: PickerOption[] = accounts.map(acc => ({
      value: acc.id,
      label: acc.name,
      group: 'Contas'
    }));

    if (selectedType === TransactionType.EXPENSE && cards.length > 0) {
      cards.forEach(card => {
        options.push({
          value: `card_${card.id}`,
          label: card.name,
          group: 'Cartões de Crédito'
        });
      });
    }

    return options;
  }, [accounts, cards, selectedType]);

  // Build equity options
  const equityOptions: PickerOption[] = useMemo(() => {
    return equities.map(eq => ({ value: eq.id, label: eq.name }));
  }, [equities]);

  // Build installments options
  const installmentsOptions: PickerOption[] = useMemo(() => {
    return Array.from({ length: 23 }, (_, i) => ({
      value: String(i + 2),
      label: `${i + 2}x`
    }));
  }, []);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      
      let accountId = undefined;
      let cardId = undefined;

      if (data.paymentMethod.startsWith('card_')) {
        cardId = data.paymentMethod.replace('card_', '');
      } else {
        accountId = data.paymentMethod;
      }

      const payload = {
        type: data.type,
        category: data.category as TransactionCategory,
        amount: data.amount,
        description: data.description,
        date: data.date,
        accountId,
        cardId,
        equityId: data.category === 'INVESTMENT' ? data.equityId : undefined,
        installments: isInstallment ? data.installments : undefined,
      };

      await createTransaction(payload);
      reset();
      setSelectedType(TransactionType.EXPENSE);
      setIsInstallment(false);
      toast.success('Transação registrada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        const info = error.response.data;
        setBalanceInfo({
          currentBalance: info.currentBalance,
          transactionAmount: info.transactionAmount,
          accountName: accounts.find(a => a.id === info.accountId)?.name || 'Conta'
        });
        
        let accountId = undefined;
        let cardId = undefined;
        if (data.paymentMethod.startsWith('card_')) {
          cardId = data.paymentMethod.replace('card_', '');
        } else {
          accountId = data.paymentMethod;
        }

        setPendingPayload({
          type: data.type,
          category: data.category as TransactionCategory,
          amount: data.amount,
          description: data.description,
          date: data.date,
          accountId,
          cardId,
          equityId: data.category === 'INVESTMENT' ? data.equityId : undefined,
          installments: isInstallment ? data.installments : undefined,
        });
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao criar transação:', error);
        toast.error('Erro ao registrar transação');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBalance = async () => {
    if (!pendingPayload) return;
    try {
      setIsSubmitting(true);
      await confirmTransaction({
        ...pendingPayload,
        confirmNegativeBalance: true
      });
      reset();
      setSelectedType(TransactionType.EXPENSE);
      setIsInstallment(false);
      toast.success('Transação registrada com sucesso!');
      setShowBalanceDialog(false);
      setPendingPayload(null);
      setBalanceInfo(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao confirmar transação:', error);
      toast.error('Erro ao confirmar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 bg-[#F2F2F7] min-h-full -mx-4 -mt-4 px-4 pt-4">
      {/* Type Selector - Segmented Control */}
      <div className="bg-gray-200/80 p-1 rounded-xl flex mb-6">
        <button
          type="button"
          onClick={() => {
            setSelectedType(TransactionType.EXPENSE);
            setValue('type', TransactionType.EXPENSE);
            setValue('category', '');
          }}
          className={cn(
            "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
            selectedType === TransactionType.EXPENSE
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          )}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType(TransactionType.INCOME);
            setValue('type', TransactionType.INCOME);
            setValue('category', '');
          }}
          className={cn(
            "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
            selectedType === TransactionType.INCOME
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          )}
        >
          Receita
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Valor</label>
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
          {/* Description */}
          <div className="p-4">
            <MobileInput
              label="Descrição"
              placeholder="Ex: Compras no mercado"
              {...register('description')}
              error={errors.description?.message}
            />
          </div>

          {/* Category */}
          <div className="p-4">
            <MobilePickerTrigger
              label="Categoria"
              value={selectedCategory}
              options={categoryOptions}
              placeholder="Selecione a categoria"
              onClick={() => setCategoryPickerOpen(true)}
              error={errors.category?.message}
            />
          </div>

          {/* Equity (if investment) */}
          {selectedCategory === 'INVESTMENT' && (
            <div className="p-4">
              <MobilePickerTrigger
                label="Ativo Relacionado (Opcional)"
                value={selectedEquity}
                options={equityOptions}
                placeholder="Selecione o ativo"
                onClick={() => setEquityPickerOpen(true)}
              />
            </div>
          )}

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

          {/* Payment Method */}
          <div className="p-4">
            <MobilePickerTrigger
              label="Conta / Cartão"
              value={selectedPaymentMethod}
              options={paymentMethodOptions}
              placeholder="Selecione onde debitar/creditar"
              onClick={() => setAccountPickerOpen(true)}
              error={errors.paymentMethod?.message}
            />
          </div>
        </div>

        {/* Installments Section (only for expenses) */}
        {selectedType === TransactionType.EXPENSE && (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <span className="text-base font-medium text-gray-900">Parcelado?</span>
                <p className="text-xs text-gray-500">
                  Habilite para compras parceladas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInstallment(!isInstallment)}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative",
                  isInstallment ? "bg-black" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform",
                    isInstallment ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {isInstallment && (
              <div className="px-4 pb-32 border-t border-gray-100 pt-4">
                <MobilePickerTrigger
                  label="Número de Parcelas"
                  value={watchedInstallments?.toString()}
                  options={installmentsOptions}
                  placeholder="Selecione as parcelas"
                  onClick={() => setInstallmentsPickerOpen(true)}
                  error={errors.installments?.message}
                />
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-14 text-base font-semibold rounded-2xl bg-black hover:bg-gray-800" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Transação'
          )}
        </Button>
      </form>

      {/* Pickers */}
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={categoryPickerOpen}
            onOpenChange={setCategoryPickerOpen}
            value={field.value}
            onValueChange={field.onChange}
            options={categoryOptions}
            title="Categoria"
          />
        )}
      />

      <Controller
        name="paymentMethod"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={accountPickerOpen}
            onOpenChange={setAccountPickerOpen}
            value={field.value}
            onValueChange={field.onChange}
            options={paymentMethodOptions}
            title="Conta / Cartão"
          />
        )}
      />

      <Controller
        name="equityId"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={equityPickerOpen}
            onOpenChange={setEquityPickerOpen}
            value={field.value || ''}
            onValueChange={field.onChange}
            options={equityOptions}
            title="Ativo"
          />
        )}
      />

      <Controller
        name="installments"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={installmentsPickerOpen}
            onOpenChange={setInstallmentsPickerOpen}
            value={field.value?.toString() || ''}
            onValueChange={(val) => field.onChange(parseInt(val))}
            options={installmentsOptions}
            title="Parcelas"
          />
        )}
      />

      <InsufficientBalanceDialog 
        open={showBalanceDialog} 
        currentBalance={balanceInfo?.currentBalance || 0}
        requiredAmount={balanceInfo?.transactionAmount || 0}
        finalBalance={(balanceInfo?.currentBalance || 0) - (balanceInfo?.transactionAmount || 0)}
        onConfirm={handleConfirmBalance}
        onCancel={() => setShowBalanceDialog(false)}
      />
    </div>
  );
}

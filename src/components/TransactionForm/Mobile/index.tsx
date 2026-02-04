import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';
import { MobileInput, MobileDateInput } from '../../ui/mobile-input';
import { MobilePicker, MobilePickerTrigger, type PickerOption } from '../../ui/mobile-picker';
import { createTransaction, confirmTransaction, getAccounts, getCards, createRecurringTransaction } from '../../../services/api';
import { equityService } from '../../../services/equities';
import { CategoryService, type Category } from '../../../services/categoryService';
import { TransactionType, type TransactionCategory } from '../../../types/transaction';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../../types/account';
import type { Equity } from '../../../types/equity';
import { InsufficientBalanceDialog } from '../../InsufficientBalanceDialog';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatCurrencyValue } from '../../../utils/formatters';

const transactionSchema = z.object({
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  date: z.string().min(1, 'Data é obrigatória'),
  paymentMethod: z.string().min(1, 'Selecione uma conta ou cartão'),
  equityId: z.string().optional(),
  installments: z.number().min(2, 'Mínimo de 2 parcelas').optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional(),
  endDate: z.string().optional(),
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

type IncomeExpenseType = typeof TransactionType.INCOME | typeof TransactionType.EXPENSE;

interface TransactionFormProps {
  onSuccess?: () => void;
  initialData?: any;
  defaultType?: IncomeExpenseType;
}

export function MobileTransactionForm({ onSuccess, initialData, defaultType }: TransactionFormProps) {
  const initialType: IncomeExpenseType =
    initialData?.type === TransactionType.INCOME || initialData?.type === TransactionType.EXPENSE
      ? initialData.type
      : defaultType || TransactionType.EXPENSE;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    initialType
  );
  const [isInstallment, setIsInstallment] = useState(!!initialData?.installments);
  const [isRecurring, setIsRecurring] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  // Picker states
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [equityPickerOpen, setEquityPickerOpen] = useState(false);
  const [installmentsPickerOpen, setInstallmentsPickerOpen] = useState(false);
  const [frequencyPickerOpen, setFrequencyPickerOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accData, cardData, eqData, catData] = await Promise.all([
          getAccounts(),
          getCards(),
          equityService.getAll(),
          CategoryService.getCategories()
        ]);
        setAccounts(accData);
        setCards(cardData);
        setEquities(eqData);
        setUserCategories(catData);
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
      type: initialType,
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
  const watchedFrequency = watch('frequency');

  useEffect(() => {
    if (!initialData && defaultType && defaultType !== selectedType) {
      setSelectedType(defaultType);
      setValue('type', defaultType);
    }
  }, [defaultType, initialData, selectedType, setValue]);

  // Build category options
  const categoryOptions: PickerOption[] = useMemo(() => {
    const defaultLabels = selectedType === TransactionType.INCOME 
      ? incomeCategoriesLabels 
      : expenseCategoriesLabels;
    
    const defaultOptions = Object.entries(defaultLabels).map(([value, label]) => ({ 
      value, 
      label,
      group: 'Padrão'
    }));

    const userOptions = userCategories
      .filter(c => c.type === selectedType)
      .map(c => ({
        value: c.name,
        label: c.name,
        group: 'Minhas Categorias'
      }));

    return [...defaultOptions, ...userOptions];
  }, [selectedType, userCategories]);

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

  // Build frequency options
  const frequencyOptions: PickerOption[] = [
    { value: 'DAILY', label: 'Diário' },
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'MONTHLY', label: 'Mensal' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'SEMI_ANNUAL', label: 'Semestral' },
    { value: 'ANNUAL', label: 'Anual' },
  ];

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

      if (isRecurring && data.frequency) {
        // Create recurring transaction
        const result = await createRecurringTransaction({
          type: data.type === TransactionType.INCOME ? 'INCOME' : 'EXPENSE',
          category: data.category,
          amount: data.amount,
          description: data.description,
          frequency: data.frequency,
          startDate: data.date,
          endDate: data.endDate || null,
          accountId: accountId || null,
          cardId: cardId || null,
        });

        reset();
        setSelectedType(TransactionType.EXPENSE);
        setIsInstallment(false);
        setIsRecurring(false);
        
        const count = result.transactionsGenerated || 1;
        const invoices = result.invoicesCreated || 0;
        const errors = result.invoiceErrors || 0;
        
        if (cardId && invoices > 0) {
          if (errors === 0) {
            toast.success(
              `✅ ${count} transação${count > 1 ? 'ões' : ''} recorrente${count > 1 ? 's' : ''} criada${count > 1 ? 's' : ''}!\n` +
              `🗂️ ${invoices} fatura${invoices > 1 ? 's' : ''} criada${invoices > 1 ? 's' : ''} automaticamente.`,
              { duration: 5000 }
            );
          } else {
            toast.warning(
              `⚠️ ${count} transação${count > 1 ? 'ões' : ''} criada${count > 1 ? 's' : ''}, mas ${errors} fatura${errors > 1 ? 's' : ''} com erro.\n` +
              `✅ ${invoices} fatura${invoices > 1 ? 's' : ''} criada${invoices > 1 ? 's' : ''} com sucesso.`,
              { duration: 7000 }
            );
          }
        } else {
          toast.success(
            `✅ ${count} transação${count > 1 ? 'ões' : ''} recorrente${count > 1 ? 's' : ''} criada${count > 1 ? 's' : ''}!`,
            { duration: 4000 }
          );
        }
      } else {
        // Create single transaction
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
      }

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: number) => void) => {
    const val = e.target.value;
    const numbersOnly = val.replace(/\D/g, '');
    const numValue = parseInt(numbersOnly, 10) || 0;
    onChange(numValue / 100);
  };

  return (
    <div className="pb-24 bg-white min-h-full -mx-4 -mt-4 px-4 pt-4">
      {/* Type Selector - Segmented Control */}
      <div className="bg-zinc-100 p-1 rounded-xl flex mb-6">
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
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
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
              ? "bg-white text-blue-500 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          Receita
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 flex flex-col items-center justify-center gap-4">
          <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Valor</span>
          <div className="flex items-baseline justify-center gap-1 w-full">
             <span className="text-3xl font-medium text-zinc-300">R$</span>
             <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <input 
                    type="text"
                    inputMode="numeric"
                    className={cn(
                      "text-3xl font-bold bg-transparent border-none focus:ring-0 p-0 text-center w-full max-w-[300px] placeholder:text-zinc-200 outline-none",
                      selectedType === TransactionType.INCOME ? "text-blue-500" : "text-zinc-900"
                    )}
                    placeholder="0,00"
                    value={field.value ? formatCurrencyValue(field.value) : ''}
                    onChange={(e) => handleAmountChange(e, field.onChange)}
                  />
                )}
              />
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 divide-y divide-zinc-50">
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

        {/* Recurring Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="space-y-0.5">
              <span className="text-base font-medium text-zinc-900">Recorrente?</span>
              <p className="text-xs text-zinc-500">
                Habilite para transações recorrentes
              </p>
            </div>
            <Switch
                checked={isRecurring}
                onCheckedChange={(v) => setIsRecurring(!!v)}
                disabled={isInstallment}
              />
          </div>

          {isRecurring && (
            <div className="px-4 pb-4 border-t border-zinc-50 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <MobilePickerTrigger
                label="Frequência"
                value={watchedFrequency}
                options={frequencyOptions}
                placeholder="Selecione a frequência"
                onClick={() => setFrequencyPickerOpen(true)}
                error={errors.frequency?.message}
              />
              
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <MobileDateInput
                    label="Data Final (Opcional)"
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    error={errors.endDate?.message}
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Installments Section (only for expenses) */}
        {selectedType === TransactionType.EXPENSE && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <span className="text-base font-medium text-zinc-900">Parcelado?</span>
                <p className="text-xs text-zinc-500">
                  Habilite para compras parceladas
                </p>
              </div>
              <Switch
                checked={isInstallment}
                onCheckedChange={(v) => setIsInstallment(!!v)}
                disabled={isRecurring}
              />
            </div>

            {isInstallment && (
              <div className="px-4 pb-4 border-t border-zinc-50 pt-4 animate-in slide-in-from-top-2 duration-200">
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
          className="w-full h-14 text-base font-semibold rounded-2xl bg-blue-400 hover:bg-blue-500 text-white shadow-lg shadow-zinc-900/10" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {isRecurring ? 'Criando transações e faturas...' : 'Salvando...'}
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

      <Controller
        name="frequency"
        control={control}
        render={({ field }) => (
          <MobilePicker
            open={frequencyPickerOpen}
            onOpenChange={setFrequencyPickerOpen}
            value={field.value || ''}
            onValueChange={field.onChange}
            options={frequencyOptions}
            title="Frequência"
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

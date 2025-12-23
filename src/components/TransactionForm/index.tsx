import { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
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
  SelectGroup,
  SelectLabel,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { createTransaction, confirmTransaction, getAccounts, getCards, createRecurringTransaction } from '../../services/api';
import { transactionService } from '../../services/transactions';
import { equityService } from '../../services/equities';
import { TransactionType, type TransactionCategory, type Transaction } from '../../types/transaction';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../types/account';
import type { Equity } from '../../types/equity';
import { InsufficientBalanceDialog } from '../InsufficientBalanceDialog';
import { CurrencyInput } from '../ui/currency-input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  isPaid: z.boolean().optional(),
  paidDate: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const incomeCategoriesLabels: Record<string, string> = {
  SALARY: 'Salário',
  BONUS: 'Bônus / PLR',
  COMMISSION: 'Comissão',

  FREELANCE: 'Freelance',
  SELF_EMPLOYED: 'Autônomo / PJ',

  INVESTMENT_INCOME: 'Rendimentos de Investimentos',
  DIVIDENDS: 'Dividendos',
  INTEREST: 'Juros',
  RENT: 'Aluguel',

  PENSION_INCOME: 'Previdência / Aposentadoria',

  BENEFITS: 'Benefícios',
  GIFTS: 'Presentes',
  REFUND: 'Reembolsos',

  OTHER_INCOME: 'Outros',
};

const expenseCategoriesLabels: Record<string, string> = {
  HOUSING: 'Moradia',
  UTILITIES: 'Contas Fixas (Água, Luz, Internet, Gás)',
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',

  HEALTHCARE: 'Saúde',
  INSURANCE: 'Seguros',
  EDUCATION: 'Educação',

  SHOPPING: 'Compras',
  CLOTHING: 'Vestuário',

  ENTERTAINMENT: 'Lazer',
  SUBSCRIPTIONS: 'Assinaturas',

  TAXES: 'Impostos',
  FEES: 'Taxas e Tarifas',

  PETS: 'Pets',
  DONATIONS: 'Doações',

  TRAVEL: 'Viagens',

  OTHER_EXPENSE: 'Outros',
};

interface TransactionFormProps {
  onSuccess?: () => void;
  initialData?: Transaction;
}

export function TransactionForm({ onSuccess, initialData }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    initialData?.type || TransactionType.EXPENSE
  );
  const [isInstallment, setIsInstallment] = useState(
    !!initialData?.installments && initialData.installments > 1
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(initialData?.isPaid ?? true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [isMac, setIsMac] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);

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
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadData();
    
    // Detectar SO
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  const getSortedCategories = () => {
    const labels = selectedType === TransactionType.INCOME ? incomeCategoriesLabels : expenseCategoriesLabels;
    return Object.entries(labels)
      .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB, 'pt-BR'))
      .map(([key, label]) => ({ key, label }));
  };
  

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: (initialData?.type as any) || TransactionType.EXPENSE,
      category: initialData?.category || '',
      amount: initialData ? Math.abs(initialData.amount) : undefined,
      description: initialData?.description || '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: initialData 
        ? (initialData.cardId ? `card:${initialData.cardId}` : `account:${initialData.accountId}`)
        : '',
      equityId: initialData?.equityId || undefined,
      installments: initialData?.installments || undefined,
      isPaid: initialData?.isPaid ?? true,
      paidDate: initialData?.paidDate ? new Date(initialData.paidDate).toISOString().split('T')[0] : undefined,
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

  const selectedCategory = watch('category');

  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      const [methodType, methodId] = data.paymentMethod.split(':');
      
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
          accountId: methodType === 'account' ? methodId : null,
          cardId: methodType === 'card' ? methodId : null,
        });

        reset();
        setIsRecurring(false);
        const count = result.transactionsGenerated || 1;
        toast.success(`${count} transação${count > 1 ? 's' : ''} recorrente${count > 1 ? 's' : ''} criada${count > 1 ? 's' : ''}!`);
      } else {
        // Create single transaction
        const payload = {
          type: data.type,
          category: data.category as TransactionCategory,
          amount: data.amount,
          description: data.description,
          date: data.date,
          equityId: data.equityId,
          accountId: methodType === 'account' ? methodId : undefined,
          cardId: methodType === 'card' ? methodId : undefined,
          installments: isInstallment ? data.installments : undefined,
          isPaid: isPaid,
          paidDate: isPaid ? (data.paidDate || data.date) : undefined,
        };

        if (initialData) {
          await transactionService.update({
            id: initialData.id,
            ...payload
          });
          toast.success('Transação atualizada com sucesso!');
        } else {
          await createTransaction(payload);
          reset();
          toast.success('Movimentação registrada com sucesso!');
        }
      }
      
      onSuccess?.();
    } catch (error: any) {
      // Check if it's an insufficient balance error
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        const info = error.response.data;
        setBalanceInfo(info);
        
        // Reconstruct payload for retry
        const [methodType, methodId] = data.paymentMethod.split(':');
        const payload = {
            type: data.type,
            category: data.category as TransactionCategory,
            amount: data.amount,
            description: data.description,
            date: data.date,
            equityId: data.equityId,
            accountId: methodType === 'account' ? methodId : undefined,
            cardId: methodType === 'card' ? methodId : undefined,
            isPaid: isPaid,
            paidDate: isPaid ? (data.paidDate || data.date) : undefined,
        };
        setPendingPayload(payload);
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao registrar movimentação:', error);
        toast.error('Erro ao registrar movimentação');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNegativeBalance = async () => {
    if (!pendingPayload || !balanceInfo) return;

    try {
      setIsSubmitting(true);
      
      await confirmTransaction({
        ...pendingPayload,
        confirmNegativeBalance: true
      });

      reset();
      setShowBalanceDialog(false);
      setPendingPayload(null);
      setBalanceInfo(null);
      toast.success('Movimentação registrada com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Erro ao registrar movimentação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (value: string) => {
    const type = value as TransactionType;
    setSelectedType(type);
  };

  return (
    <>
      <Card className="w-full shadow-sm border-gray-100">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-center text-black">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Valor em destaque */}
            <div className="flex flex-col items-center space-y-3 w-full">
              <Label className="text-gray-500 font-medium">Valor</Label>
              <div className="w-full flex justify-center">
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || 0}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                      className="text-3xl font-semibold"
                      symbolClassName="text-3xl font-semibold text-gray-400"
                      autoResize
                    />
                  )}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 text-center">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-600">Tipo</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => {
                      field.onChange(value);
                      handleTypeChange(value);
                    }}>
                      <SelectTrigger id="type" className="w-full h-10 border-gray-200 focus:ring-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
                        <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-600">Categoria</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Popover open={openCategory} onOpenChange={setOpenCategory}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCategory}
                          className="w-full h-10 justify-between border-gray-200 focus:ring-black"
                        >
                          {field.value
                            ? getSortedCategories().find((cat) => cat.key === field.value)?.label
                            : 'Selecione uma categoria...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command
                          filter={(value, search) => {
                            const categories = getSortedCategories();
                            const category = categories.find(c => c.key === value);
                            if (!category) return 0;
                            
                            const searchNormalized = search.toLowerCase();
                            const labelNormalized = category.label.toLowerCase();
                            const keyNormalized = category.key.toLowerCase();
                            
                            if (labelNormalized.includes(searchNormalized) || keyNormalized.includes(searchNormalized)) {
                              return 1;
                            }
                            return 0;
                          }}
                        >
                          <CommandInput placeholder="Pesquisar categoria..." />
                          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {getSortedCategories().map((category) => (
                                <CommandItem
                                  key={category.key}
                                  value={category.key}
                                  onSelect={(currentValue) => {
                                    field.onChange(currentValue === field.value ? '' : currentValue);
                                    setOpenCategory(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === category.key ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {category.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>
            {errors.category && (
              <p className="text-sm text-red-600 -mt-2">{errors.category.message}</p>
            )}

            {/* Seleção de Patrimônio (Apenas para Investimentos) */}
            {selectedType === TransactionType.EXPENSE && selectedCategory === 'INVESTMENT' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="equityId" className="text-gray-600">Destino do Investimento (Opcional)</Label>
                <Controller
                  name="equityId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-10 border-gray-200 focus:ring-black">
                        <SelectValue placeholder="Investimentos Gerais (Automático)" />
                      </SelectTrigger>
                      <SelectContent>
                        {equities
                          .filter(e => ['stocks', 'crypto', 'business', 'other'].includes(e.type)) // Filter relevant types
                          .map((equity) => (
                          <SelectItem key={equity.id} value={equity.id}>
                            {equity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-gray-500">
                  Se vazio, será adicionado a "Investimentos Gerais".
                </p>
              </div>
            )}

            {/* Parcelamento (Apenas Despesas) */}
            {selectedType === TransactionType.EXPENSE && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-installment" className="text-gray-600 font-medium">Parcelar esta despesa?</Label>
                  <Switch
                    id="is-installment"
                    checked={isInstallment}
                    onCheckedChange={setIsInstallment}
                    disabled={isRecurring}
                  />
                </div>

                {isInstallment && !isRecurring && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="installments" className="text-gray-600">Número de Parcelas</Label>
                    <Input
                      id="installments"
                      type="number"
                      min="2"
                      placeholder="Ex: 12"
                      className="border-gray-200 focus:border-black focus:ring-black"
                      {...register('installments', { valueAsNumber: true })}
                    />
                    {errors.installments && (
                      <p className="text-sm text-red-600">{errors.installments.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      O valor total será dividido pelo número de parcelas e lançado nos meses subsequentes.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recorrência */}
            {!isInstallment && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-recurring" className="text-gray-600 font-medium">Tornar recorrente?</Label>
                  <Switch
                    id="is-recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {isRecurring && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label htmlFor="frequency" className="text-gray-600">Frequência</Label>
                      <Controller
                        name="frequency"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full h-10 border-gray-200 focus:ring-black">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DAILY">Diário</SelectItem>
                              <SelectItem value="WEEKLY">Semanal</SelectItem>
                              <SelectItem value="MONTHLY">Mensal</SelectItem>
                              <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                              <SelectItem value="SEMI_ANNUAL">Semestral</SelectItem>
                              <SelectItem value="ANNUAL">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-gray-600">Data de Término (Opcional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        className="h-10 border-gray-200 focus:border-black focus:ring-black block w-full"
                        {...register('endDate')}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      A transação será lançada automaticamente na frequência escolhida a partir da data de início.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Conta / Cartão */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-gray-600">Conta / Cartão</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                    <SelectTrigger id="paymentMethod" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder={loadingAccounts ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Contas</SelectLabel>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={`account:${account.id}`}>
                            {account.name} {account.type === 'WALLET' && '(Dinheiro)'}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {cards.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Cartões de Crédito</SelectLabel>
                          {cards.map((card) => (
                            <SelectItem key={card.id} value={`card:${card.id}`}>
                              {card.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentMethod && (
                <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-600">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Compras do mês"
                className="h-10 border-gray-200 focus:border-black focus:ring-black"
                {...register('description')}
              />
               {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
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

            {/* Status de Pagamento */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-paid" className="text-gray-600 font-medium">Marcar como pago?</Label>
                <Switch
                  id="is-paid"
                  checked={isPaid}
                  onCheckedChange={setIsPaid}
                />
              </div>

              {isPaid && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="paidDate" className="text-gray-600">Data do Pagamento</Label>
                  <Input
                    id="paidDate"
                    type="date"
                    className="h-10 border-gray-200 focus:border-black focus:ring-black block w-full"
                    {...register('paidDate')}
                  />
                  <p className="text-xs text-gray-500">
                    Se vazio, usará a data da transação.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-400 hover:bg-blue-500 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Transação' : 'Salvar Transação')}
              {!isSubmitting && <Kbd className="bg-gray-700 text-white border-gray-600">{isMac ? '⌘' : 'Ctrl'}+Enter</Kbd>}
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
            setPendingPayload(null);
          }}
          isLoading={isSubmitting}
        />
      )}
    </>
  );
}

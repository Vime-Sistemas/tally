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
  SelectGroup,
  SelectLabel,
} from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Button } from '../../ui/button';
import { createTransaction, confirmTransaction, getAccounts, getCards } from '../../../services/api';
import { equityService } from '../../../services/equities';
import { TransactionType, type TransactionCategory } from '../../../types/transaction';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../../types/account';
import type { Equity } from '../../../types/equity';
import { InsufficientBalanceDialog } from '../../InsufficientBalanceDialog';
import { Loader2 } from 'lucide-react';

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
}

export function MobileTransactionForm({ onSuccess }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isInstallment, setIsInstallment] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

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
      type: TransactionType.EXPENSE,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCategory = watch('category');

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
    <div className="pb-24">
      <div className="space-y-6">
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSelectedType(TransactionType.EXPENSE);
              setValue('type', TransactionType.EXPENSE);
            }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              selectedType === TransactionType.EXPENSE
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType(TransactionType.INCOME);
              setValue('type', TransactionType.INCOME);
            }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              selectedType === TransactionType.INCOME
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Receita
          </button>
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
              <Label>Descrição</Label>
              <Input 
                placeholder="Ex: Compras no mercado" 
                className="h-12"
                {...register('description')} 
              />
              {errors.description && (
                <span className="text-sm text-red-500">{errors.description.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedType === TransactionType.INCOME ? (
                        Object.entries(incomeCategoriesLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))
                      ) : (
                        Object.entries(expenseCategoriesLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <span className="text-sm text-red-500">{errors.category.message}</span>
              )}
            </div>

            {selectedCategory === 'INVESTMENT' && (
              <div className="space-y-2">
                <Label>Ativo Relacionado (Opcional)</Label>
                <Controller
                  name="equityId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        {equities.map((equity) => (
                          <SelectItem key={equity.id} value={equity.id}>
                            {equity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

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
              <Label>Conta / Cartão</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione onde debitar/creditar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Contas</SelectLabel>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {selectedType === TransactionType.EXPENSE && cards.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Cartões de Crédito</SelectLabel>
                          {cards.map((card) => (
                            <SelectItem key={card.id} value={`card_${card.id}`}>
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
                <span className="text-sm text-red-500">{errors.paymentMethod.message}</span>
              )}
            </div>

            {selectedType === TransactionType.EXPENSE && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-base">Parcelado?</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilite para compras parceladas
                  </p>
                </div>
                <Switch
                  checked={isInstallment}
                  onCheckedChange={setIsInstallment}
                />
              </div>
            )}

            {isInstallment && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>Número de Parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  placeholder="Ex: 12"
                  className="h-12"
                  {...register('installments', { valueAsNumber: true })}
                />
                {errors.installments && (
                  <span className="text-sm text-red-500">{errors.installments.message}</span>
                )}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium rounded-xl" 
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
      </div>

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

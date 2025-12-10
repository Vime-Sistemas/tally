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
  SelectGroup,
  SelectLabel,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { createTransaction, confirmTransaction, getAccounts, getCards } from '../../services/api';
import { equityService } from '../../services/equities';
import { TransactionType, type TransactionCategory } from '../../types/transaction';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../types/account';
import type { Equity } from '../../types/equity';
import { InsufficientBalanceDialog } from '../InsufficientBalanceDialog';

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

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isInstallment, setIsInstallment] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
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
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadData();
  }, []);
  

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
      type: TransactionType.EXPENSE,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      
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
        installments: isInstallment ? data.installments : undefined,
      };

      await createTransaction(payload);
      reset();
      toast.success('Movimentação registrada com sucesso!');
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

  const getCategoriesForType = () => {
    if (selectedType === TransactionType.INCOME) {
      return Object.entries(incomeCategoriesLabels);
    }
    return Object.entries(expenseCategoriesLabels);
  };

  return (
    <>
      <Card className="w-full shadow-sm border-gray-100">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-center text-black">Nova Transação</CardTitle>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category" className="w-full h-10 border-gray-200 focus:ring-black">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoriesForType().map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  />
                </div>

                {isInstallment && (
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

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
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

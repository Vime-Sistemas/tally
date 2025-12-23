import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CurrencyInput } from '../ui/currency-input';
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

const investmentSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  investmentType: z.string().min(1, 'Tipo de aplicação é obrigatório'),
  sourceAccount: z.string().min(1, 'Conta de origem é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

const investmentTypeMap: Record<string, string> = {
  'STOCKS': 'Ações',
  'REAL_ESTATE': 'Imóveis',
  'REAL_ESTATE_FUNDS': 'Fundos Imobiliários (FIIs)',
  'CRYPTO': 'Criptomoedas',

  'BONDS': 'Títulos Públicos',
  'PRIVATE_BONDS': 'Títulos Privados (CDB, LCI, LCA, Debêntures)',

  'MUTUAL_FUND': 'Fundos de Investimento',
  'ETF': 'ETFs',

  'PENSION': 'Previdência Privada',
  'SAVINGS': 'Poupança',

  'FOREIGN_INVESTMENT': 'Investimentos no Exterior',
  'CASH': 'Caixa / Reserva de Emergência',

  'OTHER_INVESTMENT': 'Outros',
};

export function InvestmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingData, setPendingData] = useState<InvestmentFormData | null>(null);
  const [openInvestmentType, setOpenInvestmentType] = useState(false);

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

  const getSortedInvestmentTypes = () => {
    return Object.entries(investmentTypeMap)
      .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB, 'pt-BR'))
      .map(([key, label]) => ({ key, label }));
  };

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
      
      await confirmTransaction({
        type: 'EXPENSE',
        category: 'INVESTMENT',
        amount: pendingData.amount,
        description: pendingData.description || `Investimento em ${investmentTypeMap[pendingData.investmentType] || pendingData.investmentType}`,
        date: pendingData.date,
        accountId: pendingData.sourceAccount,
        confirmNegativeBalance: true
      });

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
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value || 0}
                onValueChange={field.onChange}
                label="Valor da Aplicação"
                placeholder="0,00"
                autoResize
                error={errors.amount?.message}
                className="text-3xl font-semibold"
                symbolClassName="text-lg"
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Aplicação */}
            <div className="space-y-2">
              <Label htmlFor="investmentType" className="text-gray-600">Tipo de Aplicação</Label>
              <Controller
                name="investmentType"
                control={control}
                render={({ field }) => (
                  <Popover open={openInvestmentType} onOpenChange={setOpenInvestmentType}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openInvestmentType}
                        className="w-full h-10 justify-between border-gray-200 focus:ring-black"
                      >
                        {field.value
                          ? getSortedInvestmentTypes().find((inv) => inv.key === field.value)?.label
                          : 'Selecione um tipo...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command
                        filter={(value, search) => {
                          const investments = getSortedInvestmentTypes();
                          const investment = investments.find(i => i.key === value);
                          if (!investment) return 0;
                          
                          const searchNormalized = search.toLowerCase();
                          const labelNormalized = investment.label.toLowerCase();
                          const keyNormalized = investment.key.toLowerCase();
                          
                          if (labelNormalized.includes(searchNormalized) || keyNormalized.includes(searchNormalized)) {
                            return 1;
                          }
                          return 0;
                        }}
                      >
                        <CommandInput placeholder="Pesquisar tipo..." />
                        <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {getSortedInvestmentTypes().map((investment) => (
                              <CommandItem
                                key={investment.key}
                                value={investment.key}
                                onSelect={(currentValue) => {
                                  field.onChange(currentValue === field.value ? '' : currentValue);
                                  setOpenInvestmentType(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === investment.key ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {investment.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
            className="w-full bg-blue-400 hover:bg-blue-500 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Registrar Aplicação'}
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

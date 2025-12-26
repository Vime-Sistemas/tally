import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '../ui/card';
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
import { Check, ChevronsUpDown, PiggyBank, Calendar, AlignLeft, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';

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
  'PRIVATE_BONDS': 'Títulos Privados (CDB, LCI, LCA)',
  'MUTUAL_FUND': 'Fundos de Investimento',
  'ETF': 'ETFs',
  'PENSION': 'Previdência Privada',
  'SAVINGS': 'Poupança',
  'FOREIGN_INVESTMENT': 'Investimentos no Exterior',
  'CASH': 'Reserva de Emergência',
  'OTHER_INVESTMENT': 'Outros',
};

export function InvestmentForm() {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingData, setPendingData] = useState<InvestmentFormData | null>(null);
  const [openInvestmentType, setOpenInvestmentType] = useState(false);
  const [isMac, setIsMac] = useState(false);

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
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
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
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        const info = error.response.data;
        setBalanceInfo(info);
        setPendingData(data);
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao registrar aplicação:', error);
        toast.error('Erro ao registrar aplicação.');
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
      toast.error('Erro ao registrar aplicação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-lg border border-zinc-100 rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* 1. SEÇÃO DE VALOR (Destaque) */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                <PiggyBank className="w-4 h-4" />
                Nova Aplicação
              </div>
              
              <div className="w-full text-center">
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <div className="relative inline-block">
                       <CurrencyInput
                        value={field.value || 0}
                        onValueChange={field.onChange}
                        placeholder="0,00"
                        className="text-5xl font-bold text-center bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-zinc-200 text-zinc-900"
                        symbolClassName="text-2xl align-top mr-1 font-medium text-zinc-300"
                        autoResize
                      />
                    </div>
                  )}
                />
                {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            {/* 2. GRID PRINCIPAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Origem */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-medium ml-1">Origem dos Recursos</Label>
                <Controller
                  name="sourceAccount"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                      <SelectTrigger className="pl-9 h-11 bg-zinc-50 border-zinc-100 focus:bg-white transition-all">
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
                {/* Ícone sobreposto */}
                {/* Nota: SelectTrigger não aceita children facilmente para ícones absolutos sem customização complexa, 
                    então usamos um wrapper relativo se necessário, ou assumimos o design limpo. 
                    Vou usar wrapper relativo para consistência com os outros forms. */}
              </div>

              {/* Tipo de Aplicação */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-medium ml-1">Tipo de Aplicação</Label>
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
                          className={cn(
                            "w-full h-11 justify-between bg-zinc-50 border-zinc-100 hover:bg-white hover:border-zinc-300 focus:bg-white text-zinc-900 font-normal pl-9",
                            !field.value && "text-zinc-400"
                          )}
                        >
                          <TrendingUp className="w-4 h-4 text-zinc-400 absolute left-3" />
                          {field.value
                            ? getSortedInvestmentTypes().find((inv) => inv.key === field.value)?.label
                            : 'Selecione o tipo'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command filter={(value, search) => {
                            const inv = getSortedInvestmentTypes().find(i => i.key === value);
                            if(!inv) return 0;
                            const s = search.toLowerCase();
                            return (inv.label.toLowerCase().includes(s) || inv.key.toLowerCase().includes(s)) ? 1 : 0;
                        }}>
                          <CommandInput placeholder="Buscar tipo..." />
                          <CommandList>
                            <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                            <CommandGroup>
                              {getSortedInvestmentTypes().map((investment) => (
                                <CommandItem
                                  key={investment.key}
                                  value={investment.key}
                                  onSelect={(val) => {
                                    field.onChange(val === field.value ? '' : val);
                                    setOpenInvestmentType(false);
                                  }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', field.value === investment.key ? 'opacity-100' : 'opacity-0')} />
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
                {errors.investmentType && <p className="text-xs text-red-500 ml-1">{errors.investmentType.message}</p>}
              </div>
            </div>

            {/* 3. DETALHES ADICIONAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Data */}
               <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400 font-medium ml-1">Data da Aplicação</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      className="pl-9 h-11 bg-zinc-50 border-zinc-100 focus:bg-white transition-all"
                      {...register('date')}
                    />
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                   {errors.date && <p className="text-xs text-red-500 ml-1">{errors.date.message}</p>}
               </div>

               {/* Descrição */}
               <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400 font-medium ml-1">Descrição (Opcional)</Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: Aporte mensal"
                      className="pl-9 h-11 bg-zinc-50 border-zinc-100 focus:bg-white transition-all"
                      {...register('description')}
                    />
                    <AlignLeft className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
               </div>
            </div>
            <div className='flex justify-center'>
              <Button
              type="submit"
              className="w-75 h-12 bg-blue-400 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-blue-100 mt-4 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Aplicação'}
              {!isSubmitting && !isMobile && (
                 <Kbd className="bg-white/20 text-white border-white/20 text-xs">{isMac ? '⌘' : 'Ctrl'}+Enter</Kbd>
              )}
            </Button>
            </div>
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
          onCancel={() => { setShowBalanceDialog(false); setBalanceInfo(null); setPendingData(null); }}
          isLoading={isSubmitting}
        />
      )}
    </>
  );
}
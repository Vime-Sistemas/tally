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
  SelectGroup,
  SelectLabel
} from '../ui/select';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { getAccounts, createTransaction, confirmTransaction } from '../../services/api';
import type { Account } from '../../types/account';
import { InsufficientBalanceDialog } from '../InsufficientBalanceDialog';
import { ArrowRight, ArrowDown, ArrowRightLeft, Calendar, AlignLeft, Wallet, Building2 } from 'lucide-react';
import { useIsMobile } from '../../hooks/use-mobile';

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

export function TransferForm() {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingData, setPendingData] = useState<TransferFormData | null>(null);
  const [isMac, setIsMac] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const sourceAccount = watch('sourceAccount');
  const destinationAccount = watch('destinationAccount');

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

  const handleSwapAccounts = () => {
    setValue('sourceAccount', destinationAccount);
    setValue('destinationAccount', sourceAccount);
  };

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
        setBalanceInfo(info);
        setPendingData(data);
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao realizar transferência:', error);
        toast.error('Erro ao realizar transferência.');
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
        type: 'TRANSFER',
        category: 'TRANSFER',
        amount: pendingData.amount,
        description: pendingData.description || 'Transferência entre contas',
        date: pendingData.date,
        accountId: pendingData.sourceAccount,
        destinationAccountId: pendingData.destinationAccount,
        confirmNegativeBalance: true
      });
      reset();
      setShowBalanceDialog(false);
      setPendingData(null);
      setBalanceInfo(null);
      toast.success('Transferência realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      toast.error('Erro ao realizar transferência');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-lg border border-zinc-100 rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* 1. SEÇÃO DE VALOR (Destaque Central) */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Nova Transferência
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

            {/* 2. FLUXO DE ORIGEM -> DESTINO */}
            <div className="relative bg-zinc-50/50 rounded-2xl p-4 md:p-6 border border-zinc-100">
               <div className="flex flex-col md:flex-row gap-4 items-center">
                  
                  {/* Origem */}
                  <div className="flex-1 w-full space-y-1.5">
                    <Label className="text-xs text-zinc-400 font-medium ml-1">De onde sai?</Label>
                    <Controller
                      name="sourceAccount"
                      control={control}
                      render={({ field }) => (
                        <div className="relative group">
                           <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                            <SelectTrigger className="pl-10 h-14 bg-white border-zinc-200 hover:border-blue-300 focus:ring-blue-100 transition-all rounded-xl shadow-sm">
                              <SelectValue placeholder="Conta de Origem" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectGroup>
                                <SelectLabel className="text-xs text-zinc-400 uppercase tracking-wider pl-2">Minhas Contas</SelectLabel>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id} className="py-3 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                       <span className="font-medium">{account.name}</span>
                                       {account.type === 'WALLET' && <span className="text-xs text-zinc-400">(Dinheiro)</span>}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <div className="absolute left-3 top-1.5 w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors pointer-events-none">
                             <Wallet className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    />
                    {errors.sourceAccount && <p className="text-xs text-red-500 ml-1">{errors.sourceAccount.message}</p>}
                  </div>

                  {/* Botão de Troca (Swap) - ALINHAMENTO CORRIGIDO */}
                  {/* Adicionado md:pt-6 para compensar a altura do Label e alinhar a seta com os inputs */}
                  <div className="relative z-10 flex items-center justify-center -my-2 md:my-0 md:pt-6">
                    <button
                      type="button"
                      onClick={handleSwapAccounts}
                      className="p-2 rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-400 hover:text-blue-500 hover:border-blue-300 hover:scale-110 transition-all"
                      title="Inverter contas"
                    >
                       {isMobile ? <ArrowDown className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Destino */}
                  <div className="flex-1 w-full space-y-1.5">
                    <Label className="text-xs text-zinc-400 font-medium ml-1">Para onde vai?</Label>
                    <Controller
                      name="destinationAccount"
                      control={control}
                      render={({ field }) => (
                        <div className="relative group">
                           <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                            <SelectTrigger className="pl-10 h-14 bg-white border-zinc-200 hover:border-blue-300 focus:ring-blue-100 transition-all rounded-xl shadow-sm">
                              <SelectValue placeholder="Conta de Destino" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectGroup>
                                <SelectLabel className="text-xs text-zinc-400 uppercase tracking-wider pl-2">Minhas Contas</SelectLabel>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id} disabled={account.id === sourceAccount} className="py-3 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                       <span className="font-medium">{account.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <div className="absolute left-3 top-1.5 w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors pointer-events-none">
                             <Building2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    />
                     {errors.destinationAccount && <p className="text-xs text-red-500 ml-1">{errors.destinationAccount.message}</p>}
                  </div>
               </div>
            </div>

            {/* 3. DETALHES ADICIONAIS (Grid Secundário) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Data */}
               <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400 font-medium ml-1">Data da Transferência</Label>
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
                      placeholder="Ex: Reserva de emergência"
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
              className="w-75 h-12 bg-blue-400 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-zinc-200 mt-4 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar Transferência'}
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
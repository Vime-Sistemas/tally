import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { CurrencyInput } from '../../ui/currency-input';
import { MobilePicker, type PickerOption } from '../../ui/mobile-picker';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { toast } from 'sonner';
import { createTransaction, getAccounts } from '../../../services/api';
import type { CreditCard, Account } from '../../../types/account';
import { TransactionType, type TransactionCategory } from '../../../types/transaction';
import { Loader2 } from 'lucide-react';

const payInvoiceSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  accountId: z.string().min(1, 'Conta de origem é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
});

type PayInvoiceFormData = z.infer<typeof payInvoiceSchema>;

interface MobilePayInvoiceDialogProps {
  open: boolean;
  card: CreditCard;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MobilePayInvoiceDialog({ open, card, onOpenChange, onSuccess }: MobilePayInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [validationDialog, setValidationDialog] = useState<{
    type: 'zero-value' | 'insufficient-balance';
    currentBalance?: number;
    requiredAmount?: number;
  } | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PayInvoiceFormData>({
    resolver: zodResolver(payInvoiceSchema),
    defaultValues: {
      amount: card.currentInvoice,
      date: new Date().toISOString().split('T')[0],
      description: `Pagamento Fatura ${card.name}`,
    },
  });

  const selectedAccountId = watch('accountId');
  const amount = watch('amount');
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas');
    }
  }, []);

  useEffect(() => {
    if (open) {
      setValue('amount', card.currentInvoice);
      setValue('description', `Pagamento Fatura ${card.name}`);
      loadAccounts();
    }
  }, [open, card, setValue, loadAccounts]);

  const accountOptions: PickerOption[] = useMemo(() => {
    return accounts.map(acc => ({
      value: acc.id,
      label: acc.name,
    }));
  }, [accounts]);

  const canSubmit = () => {
    // Check if amount is zero
    if (!amount || amount <= 0) {
      setValidationDialog({ type: 'zero-value' });
      return false;
    }

    // Check if account has sufficient balance
    if (selectedAccount && selectedAccount.balance < amount) {
      setValidationDialog({
        type: 'insufficient-balance',
        currentBalance: selectedAccount.balance,
        requiredAmount: amount,
      });
      return false;
    }

    return true;
  };

  const onSubmit = async (data: PayInvoiceFormData) => {
    if (!canSubmit()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      await createTransaction({
        type: TransactionType.INVOICE_PAYMENT,
        category: 'OTHER_EXPENSE' as TransactionCategory,
        amount: data.amount,
        description: data.description || `Pagamento Fatura ${card.name}`,
        date: data.date,
        accountId: data.accountId,
        cardId: card.id,
      });

      toast.success('Pagamento registrado com sucesso!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      
      // Handle insufficient balance error from backend
      if (error?.response?.status === 400 && error?.response?.data?.error === 'Insufficient balance') {
        setValidationDialog({
          type: 'insufficient-balance',
          currentBalance: error?.response?.data?.currentBalance,
          requiredAmount: error?.response?.data?.requiredAmount,
        });
      } else {
        toast.error('Erro ao registrar pagamento');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[2rem] p-0 mb-15 max-h-[85vh]">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="text-xl font-bold">Pagar Fatura</SheetTitle>
          <p className="text-sm text-gray-500">
            {card.name} - Final ****
          </p>
        </SheetHeader>

        <div className="p-6 pt-2 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Amount */}
                <div className="flex flex-col items-center space-y-3 w-full">
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

                {/* Account Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Conta de Origem</label>
                    <button
                        type="button"
                        onClick={() => setAccountPickerOpen(true)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 active:bg-gray-100 transition-colors"
                    >
                        <span className={selectedAccount ? "text-gray-900 font-medium" : "text-gray-400"}>
                            {selectedAccount ? selectedAccount.name : "Selecione a conta"}
                        </span>
                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                    </button>
                    {errors.accountId && (
                        <p className="text-sm text-red-600">{errors.accountId.message}</p>
                    )}
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium rounded-xl bg-blue-400 text-white hover:bg-gray-800"
                    disabled={isSubmitting || !amount || amount <= 0 || (selectedAccount && selectedAccount.balance < amount)}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                        </>
                    ) : (
                        'Confirmar Pagamento'
                    )}
                </Button>
            </form>
        </div>
      </SheetContent>

      <MobilePicker
        open={accountPickerOpen}
        onOpenChange={setAccountPickerOpen}
        value={selectedAccountId}
        onValueChange={(val) => setValue('accountId', val)}
        options={accountOptions}
        title="Selecione a Conta"
      />

      {/* Validation Dialogs */}
      <AlertDialog open={validationDialog?.type === 'zero-value'} onOpenChange={(open) => !open && setValidationDialog(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Valor Inválido</AlertDialogTitle>
            <AlertDialogDescription>
              É necessário informar um valor maior que zero para pagar a fatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setValidationDialog(null)}>
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={validationDialog?.type === 'insufficient-balance'} onOpenChange={(open) => !open && setValidationDialog(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Saldo Insuficiente</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                A conta selecionada não possui saldo suficiente para realizar este pagamento.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mt-3 space-y-1 text-sm">
                <p className="text-gray-600">
                  Saldo disponível: <span className="font-semibold text-gray-900">R$ {validationDialog?.currentBalance?.toFixed(2).replace('.', ',')}</span>
                </p>
                <p className="text-gray-600">
                  Valor necessário: <span className="font-semibold text-gray-900">R$ {validationDialog?.requiredAmount?.toFixed(2).replace('.', ',')}</span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setValidationDialog(null)}>
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Calendar, ChevronRight, Clock, CheckCircle2, AlertTriangle, CircleDashed, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import {
  getCreditCardInvoices,
  getInvoiceDetails,
  payInvoice,
  getAccounts,
  type CreditCardInvoice
} from '../../services/api';
import type { Account } from '../../types/account';

const statusConfig = {
  OPEN: {
    label: 'Aberta',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    icon: CircleDashed,
  },
  CLOSED: {
    label: 'Fechada',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    icon: Clock,
  },
  PAID: {
    label: 'Paga',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    icon: CheckCircle2,
  },
  PARTIAL: {
    label: 'Parcial',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    icon: Wallet,
  },
  OVERDUE: {
    label: 'Vencida',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    icon: AlertTriangle,
  },
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface CreditCardInvoicesProps {
  cardId: string;
  cardName: string;
  cardColor: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

export function CreditCardInvoices({
  cardId,
  cardName,
  cardColor,
  open,
  onOpenChange,
  onPaymentSuccess
}: CreditCardInvoicesProps) {
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<CreditCardInvoice | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadInvoices();
    }
  }, [open, cardId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getCreditCardInvoices(cardId);
      setInvoices(data);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
      toast.error('Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = async (invoice: CreditCardInvoice) => {
    try {
      const details = await getInvoiceDetails(invoice.id);
      setSelectedInvoice(details);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes da fatura');
    }
  };

  const handlePayInvoice = (invoice: CreditCardInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Group invoices by year
  const invoicesByYear = invoices.reduce((acc, invoice) => {
    const year = invoice.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(invoice);
    return acc;
  }, {} as Record<number, CreditCardInvoice[]>);

  const sortedYears = Object.keys(invoicesByYear).map(Number).sort((a, b) => b - a);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${cardColor}20` }}
              >
                <CreditCard className="h-5 w-5" style={{ color: cardColor }} />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold text-zinc-900">
                  Faturas - {cardName}
                </SheetTitle>
                <SheetDescription className="text-sm text-zinc-500">
                  Histórico de faturas do cartão
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                <Calendar className="h-12 w-12 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma fatura encontrada</p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {sortedYears.map(year => (
                  <div key={year}>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-2">
                      {year}
                    </h3>
                    <div className="space-y-2">
                      {invoicesByYear[year]
                        .sort((a, b) => b.month - a.month)
                        .map(invoice => {
                          const status = statusConfig[invoice.status];
                          const StatusIcon = status.icon;
                          const isOverdue = invoice.status === 'OVERDUE';
                          const isPending = ['CLOSED', 'OVERDUE', 'PARTIAL'].includes(invoice.status);

                          return (
                            <motion.div
                              key={invoice.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "group relative p-4 rounded-2xl bg-white border transition-all cursor-pointer",
                                isOverdue ? "border-red-200 hover:border-red-300" : "border-zinc-100 hover:border-zinc-200",
                                "hover:shadow-sm"
                              )}
                              onClick={() => handleInvoiceClick(invoice)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-2 rounded-xl", status.bgColor)}>
                                    <StatusIcon className={cn("h-4 w-4", status.color)} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-zinc-900">
                                      {monthNames[invoice.month - 1]}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                      Vence em {format(parseISO(invoice.dueDate), "dd 'de' MMM", { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className={cn(
                                      "font-semibold",
                                      isOverdue ? "text-red-600" : "text-zinc-900"
                                    )}>
                                      {formatCurrency(invoice.totalAmount)}
                                    </p>
                                    <span className={cn(
                                      "text-xs px-2 py-0.5 rounded-full",
                                      status.bgColor,
                                      status.color
                                    )}>
                                      {status.label}
                                    </span>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                                </div>
                              </div>

                              {isPending && invoice.totalAmount > 0 && (
                                <div className="mt-3 pt-3 border-t border-zinc-100">
                                  <Button
                                    size="sm"
                                    className="w-full h-9 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePayInvoice(invoice);
                                    }}
                                  >
                                    Pagar Fatura
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Invoice Details Dialog */}
      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onPayClick={() => {
          setDetailsOpen(false);
          setPaymentDialogOpen(true);
        }}
      />

      {/* Payment Dialog */}
      <InvoicePaymentDialog
        invoice={selectedInvoice}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={() => {
          loadInvoices();
          onPaymentSuccess?.();
        }}
      />
    </>
  );
}

// Invoice Details Dialog Component
interface InvoiceDetailsDialogProps {
  invoice: CreditCardInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayClick: () => void;
}

function InvoiceDetailsDialog({ invoice, open, onOpenChange, onPayClick }: InvoiceDetailsDialogProps) {
  if (!invoice) return null;

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;
  const isPending = ['CLOSED', 'OVERDUE', 'PARTIAL'].includes(invoice.status);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-zinc-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-zinc-900">
                Fatura de {monthNames[invoice.month - 1]} {invoice.year}
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-500">
                {invoice.card?.name}
              </DialogDescription>
            </div>
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", status.bgColor)}>
              <StatusIcon className={cn("h-4 w-4", status.color)} />
              <span className={cn("text-sm font-medium", status.color)}>
                {status.label}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50">
              <p className="text-xs text-zinc-500 mb-1">Total da Fatura</p>
              <p className="text-xl font-bold text-zinc-900">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50">
              <p className="text-xs text-zinc-500 mb-1">Valor Pago</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(invoice.paidAmount)}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-500">Fechamento</span>
              <span className="text-sm font-medium text-zinc-900">
                {format(parseISO(invoice.closingDate), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-500">Vencimento</span>
              <span className="text-sm font-medium text-zinc-900">
                {format(parseISO(invoice.dueDate), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            {invoice.paidDate && (
              <>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-500">Data do Pagamento</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {format(parseISO(invoice.paidDate), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Transactions List */}
          {invoice.fullTransactions && invoice.fullTransactions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-900 mb-3">
                Transações ({invoice.fullTransactions.length})
              </h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {invoice.fullTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {tx.description}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {format(parseISO(tx.date), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {isPending && invoice.totalAmount > invoice.paidAmount && (
          <DialogFooter className="p-6 pt-0">
            <Button
              className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              onClick={onPayClick}
            >
              Pagar Fatura
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Invoice Payment Dialog Component
interface InvoicePaymentDialogProps {
  invoice: CreditCardInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function InvoicePaymentDialog({ invoice, open, onOpenChange, onSuccess }: InvoicePaymentDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (open) {
      loadAccounts();
      if (invoice) {
        setAmount(invoice.totalAmount - invoice.paidAmount);
      }
    }
  }, [open, invoice]);

  const loadAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const handleSubmit = async () => {
    if (!invoice || !selectedAccount) {
      toast.error('Selecione uma conta');
      return;
    }

    try {
      setLoading(true);
      await payInvoice(invoice.id, amount, selectedAccount);
      toast.success('Pagamento realizado com sucesso!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao pagar fatura:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!invoice) return null;

  const remainingAmount = invoice.totalAmount - invoice.paidAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar Fatura</DialogTitle>
          <DialogDescription>
            Fatura de {monthNames[invoice.month - 1]} {invoice.year} - {invoice.card?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-xl bg-zinc-50">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-zinc-500">Total da Fatura</span>
              <span className="text-sm font-medium">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-zinc-500">Já Pago</span>
              <span className="text-sm font-medium text-emerald-600">
                {formatCurrency(invoice.paidAmount)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-sm font-medium text-zinc-900">Restante</span>
              <span className="text-sm font-bold text-zinc-900">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Conta de Origem</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span>{account.name}</span>
                      <span className="text-zinc-500 ml-2">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-11 rounded-xl"
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs rounded-lg"
                onClick={() => setAmount(remainingAmount)}
              >
                Pagar Total
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs rounded-lg"
                onClick={() => setAmount(invoice.totalAmount * 0.15)}
              >
                Mínimo (15%)
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedAccount || amount <= 0}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
          >
            {loading ? 'Processando...' : `Pagar ${formatCurrency(amount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

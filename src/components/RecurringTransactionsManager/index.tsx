import { useState, useEffect } from 'react';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Repeat, 
  Calendar, 
  Trash2, 
  CheckSquare, 
  Square, 
  MoreHorizontal,
  Pause,
  Play,
  AlertCircle,
  CreditCard,
  Building2,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '../ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import {
  getRecurringTransactions,
  deleteRecurringTransaction,
  bulkDeleteRecurringTransactions,
  updateRecurringTransaction,
} from '../../services/api';

interface RecurringTransaction {
  id: string;
  userId: string;
  accountId: string | null;
  cardId: string | null;
  type: string;
  category: string;
  amount: number;
  description: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  account?: {
    id: string;
    name: string;
    color: string;
  };
  card?: {
    id: string;
    name: string;
    color: string;
  };
}

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMI_ANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

const typeConfig = {
  INCOME: {
    label: 'Receita',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
  },
  EXPENSE: {
    label: 'Despesa',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  TRANSFER: {
    label: 'Transferência',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
};

interface RecurringTransactionsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function RecurringTransactionsManager({
  open,
  onOpenChange,
  onUpdate
}: RecurringTransactionsManagerProps) {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteGeneratedTransactions, setDeleteGeneratedTransactions] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      loadTransactions();
    }
  }, [open]);

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectionMode]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getRecurringTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações recorrentes:', error);
      toast.error('Erro ao carregar transações recorrentes');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleToggleActive = async (transaction: RecurringTransaction) => {
    try {
      await updateRecurringTransaction(transaction.id, {
        isActive: !transaction.isActive
      });
      toast.success(transaction.isActive ? 'Transação pausada' : 'Transação ativada');
      loadTransactions();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      toast.loading('Excluindo transação...', { id: `deleting-${id}` });
      await deleteRecurringTransaction(id);
      toast.dismiss(`deleting-${id}`);
      toast.success('Transação excluída com sucesso');
      loadTransactions();
      onUpdate?.();
    } catch (error) {
      toast.dismiss(`deleting-${id}`);
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsDeleting(true);
      const count = selectedIds.size;
      toast.loading(
        `Excluindo ${count} transação${count > 1 ? 'ões' : ''} recorrente${count > 1 ? 's' : ''}...`, 
        { id: 'bulk-deleting' }
      );
      
      const result = await bulkDeleteRecurringTransactions(
        Array.from(selectedIds),
        deleteGeneratedTransactions
      );
      
      toast.dismiss('bulk-deleting');
      toast.success(
        `✅ ${result.deletedRecurringCount} transação${result.deletedRecurringCount > 1 ? 'ões' : ''} recorrente${result.deletedRecurringCount > 1 ? 's' : ''} excluída${result.deletedRecurringCount > 1 ? 's' : ''}` +
        (deleteGeneratedTransactions ? `\n🗑️ ${result.deletedTransactionsCount} transação${result.deletedTransactionsCount > 1 ? 'ões' : ''} gerada${result.deletedTransactionsCount > 1 ? 's' : ''} removida${result.deletedTransactionsCount > 1 ? 's' : ''}` : ''),
        { duration: 5000 }
      );
      
      setDeleteDialogOpen(false);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      loadTransactions();
      onUpdate?.();
    } catch (error) {
      toast.dismiss('bulk-deleting');
      console.error('Erro ao excluir transações:', error);
      toast.error('Erro ao excluir transações');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const activeTransactions = transactions.filter(t => t.isActive);
  const inactiveTransactions = transactions.filter(t => !t.isActive);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50">
                  <Repeat className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold text-zinc-900">
                    Transações Recorrentes
                  </SheetTitle>
                  <SheetDescription className="text-sm text-zinc-500">
                    {transactions.length} transações configuradas
                  </SheetDescription>
                </div>
              </div>
              
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={cn(
                  "rounded-xl h-9",
                  isSelectionMode && "bg-blue-500 hover:bg-blue-600 text-white"
                )}
              >
                {isSelectionMode ? (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Selecionando
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Selecionar
                  </>
                )}
              </Button>
            </div>
          </SheetHeader>

          {/* Selection Actions Bar */}
          <AnimatePresence>
            {isSelectionMode && selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.size === transactions.length}
                    onCheckedChange={selectAll}
                    className="border-blue-300"
                  />
                  <span className="text-sm font-medium text-blue-700">
                    {selectedIds.size} selecionadas
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="rounded-xl h-8"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <ScrollArea className="h-[calc(100vh-180px)]">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                <Repeat className="h-12 w-12 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma transação recorrente</p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {/* Active Transactions */}
                {activeTransactions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                      <Play className="h-3 w-3" />
                      Ativas ({activeTransactions.length})
                    </h3>
                    <div className="space-y-2">
                      {activeTransactions.map(transaction => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          isSelected={selectedIds.has(transaction.id)}
                          isSelectionMode={isSelectionMode}
                          onToggleSelect={() => toggleSelection(transaction.id)}
                          onToggleActive={() => handleToggleActive(transaction)}
                          onDelete={() => handleDeleteSingle(transaction.id)}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Inactive Transactions */}
                {inactiveTransactions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                      <Pause className="h-3 w-3" />
                      Pausadas ({inactiveTransactions.length})
                    </h3>
                    <div className="space-y-2">
                      {inactiveTransactions.map(transaction => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          isSelected={selectedIds.has(transaction.id)}
                          isSelectionMode={isSelectionMode}
                          onToggleSelect={() => toggleSelection(transaction.id)}
                          onToggleActive={() => handleToggleActive(transaction)}
                          onDelete={() => handleDeleteSingle(transaction.id)}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Excluir {selectedIds.size} transações recorrentes?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Atenção</p>
                <p>As transações recorrentes selecionadas serão excluídas permanentemente.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50">
              <div>
                <Label htmlFor="delete-generated" className="text-sm font-medium text-zinc-900">
                  Excluir transações já geradas
                </Label>
                <p className="text-xs text-zinc-500 mt-1">
                  Remove também todas as transações que foram criadas por estas recorrências
                </p>
              </div>
              <Switch
                id="delete-generated"
                checked={deleteGeneratedTransactions}
                onCheckedChange={setDeleteGeneratedTransactions}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              {isDeleting ? 'Excluindo...' : `Excluir ${selectedIds.size} transações`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Transaction Card Component
interface TransactionCardProps {
  transaction: RecurringTransaction;
  isSelected: boolean;
  isSelectionMode: boolean;
  onToggleSelect: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  formatCurrency: (value: number) => string;
}

function TransactionCard({
  transaction,
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onToggleActive,
  onDelete,
  formatCurrency
}: TransactionCardProps) {
  const type = typeConfig[transaction.type as keyof typeof typeConfig] || typeConfig.EXPENSE;
  const isOverdue = isPast(parseISO(transaction.nextDueDate)) && transaction.isActive;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative p-4 rounded-2xl bg-white border transition-all",
        isSelected ? "border-blue-300 bg-blue-50/50" : "border-zinc-100 hover:border-zinc-200",
        !transaction.isActive && "opacity-60",
        "hover:shadow-sm"
      )}
      onClick={() => isSelectionMode && onToggleSelect()}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="border-zinc-300"
            />
          </div>
        )}

        {/* Type Indicator */}
        <div className={cn("p-2 rounded-xl flex-shrink-0", type.bgColor)}>
          {transaction.type === 'TRANSFER' ? (
            <ArrowRightLeft className={cn("h-4 w-4", type.color)} />
          ) : transaction.cardId ? (
            <CreditCard className={cn("h-4 w-4", type.color)} />
          ) : (
            <Building2 className={cn("h-4 w-4", type.color)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-zinc-900 truncate">
                {transaction.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500">
                  {transaction.category}
                </span>
                <span className="text-zinc-300">•</span>
                <span className="text-xs text-zinc-500">
                  {frequencyLabels[transaction.frequency] || transaction.frequency}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className={cn(
                "font-semibold",
                transaction.type === 'INCOME' ? "text-emerald-600" : "text-zinc-900"
              )}>
                {transaction.type === 'INCOME' ? '+' : '-'} {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span className={cn(
                isOverdue ? "text-red-500 font-medium" : "text-zinc-500"
              )}>
                {isOverdue ? 'Atrasada - ' : 'Próxima: '}
                {format(parseISO(transaction.nextDueDate), "dd 'de' MMM", { locale: ptBR })}
              </span>
            </div>

            {!isSelectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                    <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={onToggleActive} className="rounded-lg">
                    {transaction.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2 text-amber-500" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2 text-emerald-500" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Account/Card Info */}
          {(transaction.account || transaction.card) && (
            <div className="flex items-center gap-2 mt-2">
              {transaction.card ? (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: transaction.card.color }}
                  />
                  <span className="text-xs text-zinc-500">{transaction.card.name}</span>
                </div>
              ) : transaction.account ? (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: transaction.account.color }}
                  />
                  <span className="text-xs text-zinc-500">{transaction.account.name}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label"; // Importante para o Dialog
import { TransactionType } from "../../types/transaction";
import {
  Search,
  Plus,
  CalendarClock,
  Trash2,
  Home,
  Zap,
  Coffee,
  Car,
  Heart,
  Shield,
  GraduationCap,
  ShoppingBag,
  Shirt,
  Gamepad2,
  Repeat,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  MoreHorizontal,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  X,
  Check,
  Download
} from 'lucide-react';
import { exportTransactionsToPDF } from "../../tools/pdfExporter";
import { cn } from "../../lib/utils";
import { getTransactions, getAccounts, getCards, updateTransaction, deleteTransaction } from "../../services/api";
import { toast } from "sonner";
import type { Transaction } from "../../types/transaction";
import type { Account, CreditCard } from "../../types/account";
import { Button } from "../ui/button";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { Page } from "../../types/navigation";

// Helper to parse UTC date string as local date (ignoring time)
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

import { MobileTransactionHistory } from "./Mobile";
import { useIsMobile } from "../../hooks/use-mobile";

interface TransactionHistoryProps {
  onNavigate?: (page: Page) => void;
}

export function TransactionHistory({ onNavigate }: TransactionHistoryProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileTransactionHistory />;
  }

  return <DesktopTransactionHistory onNavigate={onNavigate} />;
}

function DesktopTransactionHistory({ onNavigate }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Editing State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Edit Form Fields
  const [editingDescription, setEditingDescription] = useState("");
  const [editingAmount, setEditingAmount] = useState(0);
  const [editingCategory, setEditingCategory] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingCurrentInstallment, setEditingCurrentInstallment] = useState<number | null>(null);
  const [editingTotalInstallments, setEditingTotalInstallments] = useState<number | null>(null);
  const [editingCostCenterId, setEditingCostCenterId] = useState("");
  const [editingPaymentMethod, setEditingPaymentMethod] = useState("");
  const [editingIsPaid, setEditingIsPaid] = useState(false);
  const [editingPaidDate, setEditingPaidDate] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionsData, accountsData, cardsData] = await Promise.all([
          getTransactions(),
          getAccounts(),
          getCards(),
        ]);
        setTransactions(transactionsData);
        setAccounts(accountsData);
        setCards(cardsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar transações');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Helpers ---
  const getSourceName = (transaction: Transaction): string => {
    if (transaction.type === TransactionType.INVOICE_PAYMENT && transaction.accountId) {
        return accounts.find(a => a.id === transaction.accountId)?.name || 'Conta';
    }
    if (transaction.cardId) {
        return cards.find(c => c.id === transaction.cardId)?.name || 'Cartão';
    }
    if (transaction.accountId) {
        return accounts.find(a => a.id === transaction.accountId)?.name || 'Conta';
    }
    return '-';
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-5 w-5" };
    switch (category) {
      // DESPESAS
      case 'HOUSING': return <Home {...iconProps} />;
      case 'UTILITIES': return <Zap {...iconProps} />;
      case 'FOOD': return <Coffee {...iconProps} />;
      case 'TRANSPORT': return <Car {...iconProps} />;
      case 'HEALTHCARE': return <Heart {...iconProps} />;
      case 'INSURANCE': return <Shield {...iconProps} />;
      case 'EDUCATION': return <GraduationCap {...iconProps} />;
      case 'SHOPPING': return <ShoppingBag {...iconProps} />;
      case 'CLOTHING': return <Shirt {...iconProps} />;
      case 'ENTERTAINMENT': return <Gamepad2 {...iconProps} />;
      case 'SUBSCRIPTIONS': return <Repeat {...iconProps} />;
      case 'TAXES': return <Landmark {...iconProps} />;
      case 'FEES': return <Receipt {...iconProps} />;
      case 'PETS': return <PawPrint {...iconProps} />;
      case 'DONATIONS': return <Gift {...iconProps} />;
      case 'TRAVEL': return <Plane {...iconProps} />;
      // RECEITAS
      case 'SALARY': return <Briefcase {...iconProps} />;
      case 'BONUS': return <Banknote {...iconProps} />;
      case 'FREELANCE': case 'SELF_EMPLOYED': return <DollarSign {...iconProps} />;
      case 'DIVIDENDS': case 'INTEREST': case 'RENT': case 'INVESTMENT_INCOME': return <TrendingUp {...iconProps} />;
      case 'PENSION_INCOME': return <PiggyBank {...iconProps} />;
      // INVESTIMENTOS
      case 'INVESTMENT': return <TrendingUp {...iconProps} />;
      case 'PENSION_CONTRIBUTION': return <PiggyBank {...iconProps} />;
      case 'SAVINGS': return <Wallet {...iconProps} />;
      case 'CRYPTO': return <Coins {...iconProps} />;
      case 'REAL_ESTATE': case 'REAL_ESTATE_FUNDS': return <Building2 {...iconProps} />;
      case 'FOREIGN_INVESTMENT': return <Globe {...iconProps} />;
      // TRANSF
      case 'TRANSFER': return <ArrowRightLeft {...iconProps} />;
      default: return <MoreHorizontal {...iconProps} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      HOUSING: 'Moradia', UTILITIES: 'Contas Fixas', FOOD: 'Alimentação', TRANSPORT: 'Transporte',
      HEALTHCARE: 'Saúde', INSURANCE: 'Seguros', EDUCATION: 'Educação', SHOPPING: 'Compras',
      CLOTHING: 'Vestuário', ENTERTAINMENT: 'Lazer', SUBSCRIPTIONS: 'Assinaturas', TAXES: 'Impostos',
      FEES: 'Taxas e Tarifas', PETS: 'Pets', DONATIONS: 'Doações', TRAVEL: 'Viagens',
      SALARY: 'Salário', BONUS: 'Bônus / PLR', FREELANCE: 'Freelance', SELF_EMPLOYED: 'Autônomo / PJ',
      DIVIDENDS: 'Dividendos', INTEREST: 'Juros', RENT: 'Aluguel', INVESTMENT_INCOME: 'Rendimentos',
      PENSION_INCOME: 'Previdência', INVESTMENT: 'Investimentos', PENSION_CONTRIBUTION: 'Previdência Privada',
      SAVINGS: 'Poupança', CRYPTO: 'Criptomoedas', REAL_ESTATE: 'Imóveis', REAL_ESTATE_FUNDS: 'FIIs',
      FOREIGN_INVESTMENT: 'Exterior', TRANSFER: 'Transferência', OTHER_EXPENSE: 'Outros'
    };
    return labels[category] || category;
  };

  // --- Handlers ---
  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditingDescription(transaction.description);
    setEditingAmount(transaction.amount);
    setEditingCategory(transaction.category);
    setEditingDate(transaction.date.split('T')[0]);
    setEditingCurrentInstallment((transaction as any).currentInstallment || null);
    setEditingTotalInstallments((transaction as any).totalInstallments || null);
    setEditingCostCenterId(transaction.costCenterId || "");
    setEditingPaymentMethod(
      transaction.cardId ? `card:${transaction.cardId}` : 
      (transaction.accountId ? `account:${transaction.accountId}` : "")
    );
    setEditingIsPaid(transaction.isPaid || false);
    setEditingPaidDate(transaction.paidDate ? transaction.paidDate.split('T')[0] : "");
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);
    try {
      const [methodType, methodId] = editingPaymentMethod.split(':');
      const updateData = {
        description: editingDescription,
        amount: editingAmount,
        category: editingCategory as any,
        date: editingDate,
        currentInstallment: editingCurrentInstallment ?? undefined,
        totalInstallments: editingTotalInstallments ?? undefined,
        costCenterId: editingCostCenterId || undefined,
        accountId: methodType === 'account' ? methodId : undefined,
        cardId: methodType === 'card' ? methodId : undefined,
        isPaid: editingIsPaid,
        paidDate: editingIsPaid && editingPaidDate ? editingPaidDate : undefined
      };

      await updateTransaction(selectedTransaction.id, updateData);
      setTransactions(transactions.map(t => t.id === selectedTransaction.id ? { ...t, ...updateData } : t));
      setIsEditDialogOpen(false);
      toast.success('Transação atualizada');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);
    try {
      await deleteTransaction(selectedTransaction.id);
      setTransactions(transactions.filter(t => t.id !== selectedTransaction.id));
      setIsDeleteDialogOpen(false);
      toast.success('Transação deletada');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao deletar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Filter Logic ---
  const { groups: groupedTransactions, summary } = useMemo(() => {
    const filtered = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "ALL" || t.type === typeFilter || (typeFilter === TransactionType.EXPENSE && t.type === 'INVOICE_PAYMENT');
        const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
        const matchesAccount = accountFilter === "ALL" || (t.accountId === accountFilter) || (t.cardId === accountFilter);
        const transactionDate = startOfDay(parseUTCDate(t.date));
        const matchesDate = (!dateRange?.from || transactionDate >= startOfDay(dateRange.from)) && (!dateRange?.to || transactionDate <= endOfDay(dateRange.to));
        return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Stats
    const stats = filtered.reduce((acc, curr) => {
      acc.count += 1;
      if (curr.type === TransactionType.INCOME) {
        acc.income += curr.amount;
      } else {
        acc.expense += curr.amount;
      }
      return acc;
    }, { count: 0, income: 0, expense: 0 });

    // Grouping
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(transaction => {
      const date = parseUTCDate(transaction.date);
      let dateKey = format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
      if (isToday(date)) dateKey = "Hoje";
      else if (isYesterday(date)) dateKey = "Ontem";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(transaction);
    });

    return { groups, summary: stats };
  }, [transactions, searchTerm, typeFilter, categoryFilter, accountFilter, dateRange]);

  const handleExportPDF = () => {
    const filteredTransactions = Object.values(groupedTransactions).flat();
    exportTransactionsToPDF(
      { transactions: filteredTransactions, summary, dateRange },
      accounts,
      cards
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando histórico...</div>;
  }

  return (
    <div className="w-full min-h-screen max-w-6xl bg-white p-4 md:p-2 space-y-8">
      
      {/* --- Header & Controls --- */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Histórico</h2>
            <p className="text-zinc-500 text-sm">Visualize e gerencie suas movimentações.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportPDF}
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50 rounded-full shadow-md transition-all hover:scale-[1.02]"
            >
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
            {onNavigate && (
              <Button 
                onClick={() => onNavigate('transactions-new')}
                className="bg-blue-400 hover:bg-blue-500 text-white rounded-full shadow-md shadow-blue-100 transition-all hover:scale-[1.02]"
              >
                <Plus className="mr-2 h-4 w-4" /> Nova Transação
              </Button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-zinc-100 flex flex-col lg:flex-row gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por descrição..."
              className="pl-10 border-zinc-100 bg-zinc-50/50 rounded-xl h-10 focus:bg-white focus:ring-blue-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters Group */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}` : format(dateRange.from, "dd/MM")
                  ) : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl border-zinc-200">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas Categorias</SelectItem>
                <SelectItem value="FOOD">Alimentação</SelectItem>
                <SelectItem value="TRANSPORT">Transporte</SelectItem>
                <SelectItem value="HOUSING">Moradia</SelectItem>
                <SelectItem value="SALARY">Salário</SelectItem>
                <SelectItem value="INVESTMENT">Investimento</SelectItem>
                {/* Adicione outras categorias conforme necessário */}
                <SelectItem value="OTHER_EXPENSE">Outros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl border-zinc-200">
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas Contas</SelectItem>
                {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                {cards.map(card => <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {(categoryFilter !== "ALL" || accountFilter !== "ALL" || searchTerm !== "") && (
               <Button variant="ghost" size="icon" onClick={() => { setCategoryFilter("ALL"); setAccountFilter("ALL"); setSearchTerm(""); }} className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-xl" title="Limpar Filtros">
                 <X className="h-4 w-4" />
               </Button>
            )}
          </div>
        </div>

        {/* Type Filter Tabs (Centered) */}
        <div className="flex justify-center">
           <div className="bg-zinc-100 p-1 rounded-xl inline-flex">
              {["ALL", TransactionType.INCOME, TransactionType.EXPENSE].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-6 py-1.5 text-sm font-medium rounded-lg transition-all",
                    typeFilter === type ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {type === "ALL" ? "Tudo" : type === TransactionType.INCOME ? "Entradas" : "Saídas"}
                </button>
              ))}
           </div>
        </div>

        {/* Summary Banner (Only if filtered or searching to show context) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Registros</p>
              <p className="text-2xl font-bold text-zinc-900">{summary.count}</p>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Entradas</p>
              <p className="text-2xl font-bold text-blue-500">+ {summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Saídas</p>
              <p className="text-2xl font-bold text-red-500">- {summary.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
           </div>
           <div className={cn("p-4 rounded-2xl border shadow-sm", (summary.income - summary.expense) >= 0 ? "bg-white border-zinc-100" : "bg-red-50 border-red-100")}>
              <p className={cn("text-xs uppercase tracking-wider font-semibold", (summary.income - summary.expense) >= 0 ? "text-zinc-500" : "text-red-600")}>Resultado</p>
              <p className={cn("text-2xl font-bold", (summary.income - summary.expense) >= 0 ? "text-blue-500" : "text-red-700")}>
                 {(summary.income - summary.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
           </div>
        </div>
      </div>

      {/* --- Transaction List --- */}
      <div className="space-y-8">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-white rounded-3xl border border-zinc-100 border-dashed">
            <div className="bg-zinc-50 p-4 rounded-full mb-4">
               <Search className="h-8 w-8 text-zinc-300" />
            </div>
            <p className="font-medium text-lg text-zinc-600">Nenhuma transação encontrada</p>
            <p className="text-sm">Tente ajustar seus filtros ou data.</p>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, groupTxs]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-4">
                 <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-100 px-3 py-1 rounded-full">{date}</h3>
                 <div className="h-px bg-zinc-200 flex-1" />
              </div>
              
              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden divide-y divide-zinc-50">
                {groupTxs.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-50/80 transition-all cursor-pointer gap-4"
                    onClick={() => handleEditClick(transaction)}
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                        transaction.type === TransactionType.INCOME ? "bg-blue-50 text-blue-500" : "bg-red-50 text-red-500"
                      )}>
                        {getCategoryIcon(transaction.category)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-zinc-900 text-base">{transaction.description}</p>
                          
                          {/* Badges */}
                          {transaction.isPaid && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Pago
                            </span>
                          )}
                          {(transaction as any).totalInstallments > 1 && (
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-md font-medium">
                              {(transaction as any).currentInstallment}/{(transaction as any).totalInstallments}
                            </span>
                          )}
                          {transaction.recurringTransactionId && (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md font-medium">
                              Recorrente
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                           <span>{getCategoryLabel(transaction.category)}</span>
                           <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                           <span>{getSourceName(transaction)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-1">
                      <span className={cn(
                        "font-bold text-lg tabular-nums tracking-tight",
                        transaction.type === TransactionType.INCOME ? "text-blue-500" : "text-zinc-900"
                      )}>
                        {transaction.type === TransactionType.INCOME ? '+' : '-'} {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-xs text-zinc-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
                         Editar <ArrowRightLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Edit Dialog (Redesigned) --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden bg-zinc-50">
          <DialogHeader className="p-6 bg-white border-b border-zinc-100">
            <DialogTitle className="text-xl">Detalhes da Transação</DialogTitle>
            <DialogDescription>Edite ou remova este registro.</DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 font-bold uppercase">Descrição</Label>
                   <Input 
                      value={editingDescription} 
                      onChange={(e) => setEditingDescription(e.target.value)} 
                      className="bg-white border-zinc-200 h-11"
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 font-bold uppercase">Valor</Label>
                   <Input 
                      type="number" 
                      value={editingAmount} 
                      onChange={(e) => setEditingAmount(parseFloat(e.target.value))} 
                      className="bg-white border-zinc-200 h-11 font-mono font-medium"
                   />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 font-bold uppercase">Categoria</Label>
                   <Select value={editingCategory} onValueChange={setEditingCategory}>
                      <SelectTrigger className="bg-white border-zinc-200 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="FOOD">Alimentação</SelectItem>
                         <SelectItem value="HOUSING">Moradia</SelectItem>
                         <SelectItem value="TRANSPORT">Transporte</SelectItem>
                         {/* Add all options here similarly to main filter */}
                         <SelectItem value="OTHER_EXPENSE">Outros</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 font-bold uppercase">Data</Label>
                   <Input type="date" value={editingDate} onChange={(e) => setEditingDate(e.target.value)} className="bg-white border-zinc-200 h-11" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 font-bold uppercase">Conta / Cartão</Label>
                   <Select value={editingPaymentMethod} onValueChange={setEditingPaymentMethod}>
                      <SelectTrigger className="bg-white border-zinc-200 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         {accounts.map(a => <SelectItem key={a.id} value={`account:${a.id}`}>{a.name}</SelectItem>)}
                         {cards.map(c => <SelectItem key={c.id} value={`card:${c.id}`}>{c.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="flex items-center gap-3 pt-6 pl-2">
                   <Switch checked={editingIsPaid} onCheckedChange={setEditingIsPaid} />
                   <Label className="cursor-pointer" onClick={() => setEditingIsPaid(!editingIsPaid)}>
                      {editingIsPaid ? "Marcado como Pago" : "Pendente"}
                   </Label>
                </div>
             </div>

             <div className="flex gap-3 pt-4 border-t border-zinc-200/50">
                <Button variant="destructive" className="flex-1 rounded-xl h-12" onClick={() => { setIsEditDialogOpen(false); handleDeleteClick(selectedTransaction!); }}>
                   <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </Button>
                <Button className="flex-[2] bg-blue-500 hover:bg-blue-600 rounded-xl h-12" onClick={handleEditSave} disabled={isSubmitting}>
                   {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>Tem certeza? Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting} className="rounded-xl">Confirmar Exclusão</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
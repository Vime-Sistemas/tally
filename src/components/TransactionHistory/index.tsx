import { useState, useEffect, useMemo } from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TransactionType } from "../../types/transaction";
import {
  Search,
  Plus,
  CalendarClock,
  Edit,
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
  Globe
} from 'lucide-react';
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
  DialogTrigger,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState("");
  const [editingAmount, setEditingAmount] = useState(0);
  const [editingCategory, setEditingCategory] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingCurrentInstallment, setEditingCurrentInstallment] = useState<number | null>(null);
  const [editingTotalInstallments, setEditingTotalInstallments] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

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

  const formatDateToDDMMYYYY = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-5 w-5" };
    switch (category) {
    /* =======================
     * DESPESAS
     * ======================= */
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

    /* =======================
     * RECEITAS
     * ======================= */
    case 'SALARY': return <Briefcase {...iconProps} />;
    case 'BONUS': return <Banknote {...iconProps} />;
    case 'FREELANCE':
    case 'SELF_EMPLOYED':
      return <DollarSign {...iconProps} />;

    case 'DIVIDENDS':
    case 'INTEREST':
    case 'RENT':
    case 'INVESTMENT_INCOME':
      return <TrendingUp {...iconProps} />;

    case 'PENSION_INCOME': return <PiggyBank {...iconProps} />;

    /* =======================
     * INVESTIMENTOS / APORTES
     * ======================= */
    case 'INVESTMENT': return <TrendingUp {...iconProps} />;
    case 'PENSION_CONTRIBUTION': return <PiggyBank {...iconProps} />;
    case 'SAVINGS': return <Wallet {...iconProps} />;
    case 'CRYPTO': return <Coins {...iconProps} />;
    case 'REAL_ESTATE':
    case 'REAL_ESTATE_FUNDS':
      return <Building2 {...iconProps} />;

    case 'FOREIGN_INVESTMENT': return <Globe {...iconProps} />;

    /* =======================
     * TRANSFERÊNCIAS
     * ======================= */
    case 'TRANSFER': return <ArrowRightLeft {...iconProps} />;

    default:
      return <MoreHorizontal {...iconProps} />;
  }
  };

  const activeClass = (active: boolean, color: string) =>
  active
    ? `${color} text-white hover:${color}`
    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"


  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      HOUSING: 'Moradia',
      UTILITIES: 'Contas Fixas',
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

      SALARY: 'Salário',
      BONUS: 'Bônus / PLR',
      FREELANCE: 'Freelance',
      SELF_EMPLOYED: 'Autônomo / PJ',
      DIVIDENDS: 'Dividendos',
      INTEREST: 'Juros',
      RENT: 'Aluguel',
      INVESTMENT_INCOME: 'Rendimentos',
      PENSION_INCOME: 'Previdência / Aposentadoria',

      INVESTMENT: 'Investimentos',
      PENSION_CONTRIBUTION: 'Previdência Privada',
      SAVINGS: 'Poupança',
      CRYPTO: 'Criptomoedas',
      REAL_ESTATE: 'Imóveis',
      REAL_ESTATE_FUNDS: 'Fundos Imobiliários',
      FOREIGN_INVESTMENT: 'Investimentos no Exterior',

      TRANSFER: 'Transferência',
      OTHER_EXPENSE: 'Outros'
    };
    return labels[category] || category;
  };

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditingDescription(transaction.description);
    setEditingAmount(transaction.amount);
    setEditingCategory(transaction.category);
    setEditingDate(transaction.date.split('T')[0]);
    setEditingCurrentInstallment((transaction as any).currentInstallment || null);
    setEditingTotalInstallments((transaction as any).totalInstallments || null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedTransaction) return;
    
    setIsSubmitting(true);
    try {
      const updateData = {
        description: editingDescription,
        amount: editingAmount,
        category: editingCategory as any,
        date: editingDate,
        currentInstallment: editingCurrentInstallment ?? undefined,
        totalInstallments: editingTotalInstallments ?? undefined
      };

      await updateTransaction(selectedTransaction.id, updateData);
      
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id 
          ? { ...t, ...updateData }
          : t
      ));
      
      setIsEditDialogOpen(false);
      toast.success('Transação atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
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
      toast.success('Transação deletada com sucesso');
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      toast.error('Erro ao deletar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { groups: groupedTransactions, summary } = useMemo(() => {
    const filtered = transactions
      .filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === "ALL" || 
          t.type === typeFilter || 
          (typeFilter === TransactionType.EXPENSE && t.type === 'INVOICE_PAYMENT');

        const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;

        const matchesAccount = accountFilter === "ALL" || 
          (t.accountId === accountFilter) || 
          (t.cardId === accountFilter);

        const transactionDate = startOfDay(parseUTCDate(t.date));
        const matchesDate = (!dateRange?.from || transactionDate >= startOfDay(dateRange.from)) && 
                            (!dateRange?.to || transactionDate <= endOfDay(dateRange.to));

        return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Cálculo do Resumo
    const stats = filtered.reduce((acc, curr) => {
      acc.count += 1;
      if (curr.type === TransactionType.INCOME) {
        acc.income += curr.amount;
      } else {
        acc.expense += curr.amount;
      }
      return acc;
    }, { count: 0, income: 0, expense: 0 });

    const groups: Record<string, Transaction[]> = {};

    filtered.forEach(transaction => {
      const date = parseUTCDate(transaction.date);
      let dateKey = format(date, "dd 'de' MMMM", { locale: ptBR });
      
      if (isToday(date)) {
        dateKey = "Hoje";
      } else if (isYesterday(date)) {
        dateKey = "Ontem";
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return { groups, summary: stats };
  }, [transactions, searchTerm, typeFilter, categoryFilter, accountFilter]);

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="sticky top-0 backdrop-blur-md z-10 pb-4 pt-2 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Histórico</h2>
          {onNavigate && (
            <Button 
              onClick={() => onNavigate('transactions-new')}
              className="rounded-full bg-blue-400 hover:bg-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar transações..."
              className="pl-10 bg-gray-100/50 border-none rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-blue-900 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <Button
              size="sm"
              onClick={() => setTypeFilter("ALL")}
              className={cn(
                "rounded-full px-4 h-11",
                activeClass(typeFilter === "ALL", "bg-blue-400")
              )}
            >
              Tudo
            </Button>

            <Button
              size="sm"
              onClick={() => setTypeFilter(TransactionType.INCOME)}
              className={cn(
                "rounded-full px-4 h-11",
                activeClass(typeFilter === TransactionType.INCOME, "bg-blue-400")
              )}
            >
              Entradas
            </Button>

            <Button
              size="sm"
              onClick={() => setTypeFilter(TransactionType.EXPENSE)}
              className={cn(
                "rounded-full px-4 h-11",
                activeClass(typeFilter === TransactionType.EXPENSE, "bg-blue-400")
              )}
            >
              Saídas
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full md:w-[300px] justify-start text-left font-normal h-11 rounded-xl bg-gray-100/50 border-none",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/y")} -{" "}
                      {format(dateRange.to, "dd/MM/y")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/y")
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-11 rounded-xl bg-gray-100/50 border-none">
              <SelectValue placeholder="Todas Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas Categorias</SelectItem>
              <SelectItem value="FOOD">Alimentação</SelectItem>
              <SelectItem value="TRANSPORT">Transporte</SelectItem>
              <SelectItem value="HOUSING">Moradia</SelectItem>
              <SelectItem value="SHOPPING">Compras</SelectItem>
              <SelectItem value="SALARY">Salário</SelectItem>
              <SelectItem value="INVESTMENT">Investimento</SelectItem>
              <SelectItem value="UTILITIES">Contas</SelectItem>
              <SelectItem value="HEALTHCARE">Saúde</SelectItem>
              <SelectItem value="ENTERTAINMENT">Lazer</SelectItem>
              <SelectItem value="EDUCATION">Educação</SelectItem>
              <SelectItem value="FREELANCE">Freelance</SelectItem>
              <SelectItem value="OTHER_EXPENSE">Outros (Despesa)</SelectItem>
              <SelectItem value="OTHER_INCOME">Outros (Receita)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-11 rounded-xl bg-gray-100/50 border-none">
              <SelectValue placeholder="Todas Contas/Cartões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas Contas/Cartões</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>Conta: {acc.name}</SelectItem>
              ))}
              {cards.map(card => (
                <SelectItem key={card.id} value={card.id}>Cartão: {card.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(categoryFilter !== "ALL" || accountFilter !== "ALL" || searchTerm !== "") && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-wrap gap-6 items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Registros:</span>
              <span className="font-semibold text-gray-900">{summary.count}</span>
            </div>
            <div className="flex items-center gap-4">
              {summary.income > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Entradas:</span>
                  <span className="font-semibold text-[#009FE3]">+ R$ {summary.income.toFixed(2)}</span>
                </div>
              )}
              {summary.expense > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Saídas:</span>
                  <span className="font-semibold text-red-600">- R$ {summary.expense.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <span className="text-gray-500">Total:</span>
                <span className={cn(
                  "font-bold",
                  (summary.income - summary.expense) >= 0 ? "text-[#009FE3]" : "text-red-600"
                )}>
                  R$ {(summary.income - summary.expense).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-medium">Nenhuma transação encontrada</p>
            <p className="text-sm mt-1">Tente ajustar seus filtros de busca</p>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, transactions]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">{date}</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {transactions.map((transaction, index) => (
                  <Dialog key={transaction.id}>
                    <DialogTrigger asChild>
                      <div 
                        className={cn(
                          "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group",
                          index !== transactions.length - 1 && "border-b border-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                            transaction.type === TransactionType.INCOME 
                              ? "bg-[#009FE3]/10 text-[#009FE3]" 
                              : "bg-red-100 text-red-600"
                          )}>
                            {getCategoryIcon(transaction.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              {transaction.isPaid && (
                                <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                                  ✓ Pago
                                </span>
                              )}
                              {transaction.recurringTransactionId && (
                                <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  Recorrente
                                </span>
                              )}
                              {(transaction as any).totalInstallments > 1 && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  {(transaction as any).currentInstallment}/{(transaction as any).totalInstallments}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{getCategoryLabel(transaction.category)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "font-semibold",
                            transaction.type === TransactionType.INCOME ? "text-[#009FE3]" : "text-red-600"
                          )}>
                            {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-gray-400">{getSourceName(transaction)}</span>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detalhes da Transação</DialogTitle>
                        <DialogDescription>
                          Informações completas sobre esta movimentação.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center justify-center p-8 rounded-2xl">
                          <div className={cn(
                            "h-16 w-16 rounded-full flex items-center justify-center mb-4",
                            transaction.type === TransactionType.INCOME 
                              ? "bg-[#009FE3]/10 text-[#009FE3]" 
                              : "bg-red-100 text-red-600"
                          )}>
                            {getCategoryIcon(transaction.category)}
                          </div>
                          <span className="text-sm text-muted-foreground mb-1">Valor</span>
                          <span className={cn(
                            "text-4xl font-bold tracking-tight",
                            transaction.type === TransactionType.INCOME ? "text-[#009FE3]" : "text-red-600"
                          )}>
                            {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
                          </span>
                          {(transaction as any).totalInstallments > 1 && (
                            <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                              Parcela {(transaction as any).currentInstallment} de {(transaction as any).totalInstallments}
                            </div>
                          )}
                          {transaction.recurringTransactionId && (
                            <div className="mt-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full font-medium">
                              Transação Recorrente
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Descrição</span>
                            <span className="font-medium text-gray-900">{transaction.description}</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Categoria</span>
                            <span className="font-medium text-gray-900">{getCategoryLabel(transaction.category)}</span>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Conta</span>
                            <span className="font-medium text-gray-900">{getSourceName(transaction)}</span>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Data</span>
                            <span className="font-medium text-gray-900">{formatDateToDDMMYYYY(transaction.date)}</span>
                          </div>

                          {transaction.isPaid && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-500">Status</span>
                              <span className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md text-sm">✓ Pago</span>
                            </div>
                          )}

                          {transaction.isPaid && transaction.paidDate && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-500">Data do Pagamento</span>
                              <span className="font-medium text-gray-900">{formatDateToDDMMYYYY(transaction.paidDate)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button 
                            variant="outline" 
                            className="flex-1 h-11 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 bg-blue-400 text-white"
                            onClick={() => handleEditClick(transaction)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1 h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none"
                            onClick={() => handleDeleteClick(transaction)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na transação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                step="0.01"
                value={editingAmount}
                onChange={(e) => setEditingAmount(parseFloat(e.target.value))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Parcela Atual</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 1"
                  value={editingCurrentInstallment || ''}
                  onChange={(e) => setEditingCurrentInstallment(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Parcelas</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 12"
                  value={editingTotalInstallments || ''}
                  onChange={(e) => setEditingTotalInstallments(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={editingCategory} onValueChange={setEditingCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(selectedTransaction?.type === TransactionType.INCOME ? {
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
                  } : {
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
                  }).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={editingDate}
                onChange={(e) => setEditingDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEditSave} disabled={isSubmitting} className="bg-blue-400 text-white">
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

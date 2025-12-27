import { useState, useEffect, useMemo } from "react";
import { Input } from "../../ui/input";
import { TransactionType } from "../../../types/transaction";
import { 
  Search, 
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Zap,
  Heart,
  Gamepad2,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  Filter,
  X,
  CreditCard as CreditCardIcon,
  Tag as TagIcon
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { getTransactions, getAccounts, getCards } from "../../../services/api";
import { transactionService } from "../../../services/transactions";
import { CategoryService, type Category } from "../../../services/categoryService";
import { TagService } from "../../../services/tagService";
import type { Tag } from "../../../services/tagService";
import { toast } from "sonner";
import type { Transaction } from "../../../types/transaction";
import type { Account, CreditCard } from "../../../types/account";
import { Button } from "../../ui/button";
import { format, isToday, isYesterday, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "../../ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { DateRange } from "react-day-picker";
import { MobileTransactionDialog } from "../../TransactionDialog/Mobile";
import { TransactionForm } from "../../TransactionForm";
import { formatCurrency } from "../../../utils/formatters";

// Local interface for display categories (includes label property)
interface DisplayCategory {
  id: string;
  name: string;
  label: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'FOOD': return <Coffee className="h-5 w-5" />;
    case 'TRANSPORT': return <Car className="h-5 w-5" />;
    case 'HOUSING': return <Home className="h-5 w-5" />;
    case 'SHOPPING': return <ShoppingBag className="h-5 w-5" />;
    case 'UTILITIES': return <Zap className="h-5 w-5" />;
    case 'HEALTHCARE': return <Heart className="h-5 w-5" />;
    case 'ENTERTAINMENT': return <Gamepad2 className="h-5 w-5" />;
    case 'EDUCATION': return <GraduationCap className="h-5 w-5" />;
    case 'SALARY': return <DollarSign className="h-5 w-5" />;
    case 'FREELANCE': return <Briefcase className="h-5 w-5" />;
    case 'INVESTMENT': return <TrendingUp className="h-5 w-5" />;
    case 'TRANSFER': return <ArrowRightLeft className="h-5 w-5" />;
    default: return <DollarSign className="h-5 w-5" />;
  }
};

const globalIncomeCategories: DisplayCategory[] = [
  { id: 'salary', name: 'SALARY', label: 'Salário', type: 'INCOME', icon: 'Briefcase' },
  { id: 'bonus', name: 'BONUS', label: 'Bônus / PLR', type: 'INCOME', icon: 'Banknote' },
  { id: 'freelance', name: 'FREELANCE', label: 'Freelance', type: 'INCOME', icon: 'DollarSign' },
  { id: 'self_employed', name: 'SELF_EMPLOYED', label: 'Autônomo / PJ', type: 'INCOME', icon: 'DollarSign' },
  { id: 'dividends', name: 'DIVIDENDS', label: 'Dividendos', type: 'INCOME', icon: 'TrendingUp' },
  { id: 'interest', name: 'INTEREST', label: 'Juros', type: 'INCOME', icon: 'TrendingUp' },
  { id: 'rent', name: 'RENT', label: 'Aluguel', type: 'INCOME', icon: 'TrendingUp' },
  { id: 'investment_income', name: 'INVESTMENT_INCOME', label: 'Rendimentos', type: 'INCOME', icon: 'TrendingUp' },
  { id: 'pension_income', name: 'PENSION_INCOME', label: 'Previdência', type: 'INCOME', icon: 'PiggyBank' },
];

const globalExpenseCategories: DisplayCategory[] = [
  { id: 'housing', name: 'HOUSING', label: 'Moradia', type: 'EXPENSE', icon: 'Home' },
  { id: 'utilities', name: 'UTILITIES', label: 'Contas Fixas', type: 'EXPENSE', icon: 'Zap' },
  { id: 'food', name: 'FOOD', label: 'Alimentação', type: 'EXPENSE', icon: 'Coffee' },
  { id: 'transport', name: 'TRANSPORT', label: 'Transporte', type: 'EXPENSE', icon: 'Car' },
  { id: 'healthcare', name: 'HEALTHCARE', label: 'Saúde', type: 'EXPENSE', icon: 'Heart' },
  { id: 'insurance', name: 'INSURANCE', label: 'Seguros', type: 'EXPENSE', icon: 'Shield' },
  { id: 'education', name: 'EDUCATION', label: 'Educação', type: 'EXPENSE', icon: 'GraduationCap' },
  { id: 'shopping', name: 'SHOPPING', label: 'Compras', type: 'EXPENSE', icon: 'ShoppingBag' },
  { id: 'clothing', name: 'CLOTHING', label: 'Vestuário', type: 'EXPENSE', icon: 'Shirt' },
  { id: 'entertainment', name: 'ENTERTAINMENT', label: 'Lazer', type: 'EXPENSE', icon: 'Gamepad2' },
  { id: 'subscriptions', name: 'SUBSCRIPTIONS', label: 'Assinaturas', type: 'EXPENSE', icon: 'Repeat' },
  { id: 'taxes', name: 'TAXES', label: 'Impostos', type: 'EXPENSE', icon: 'Landmark' },
  { id: 'fees', name: 'FEES', label: 'Taxas e Tarifas', type: 'EXPENSE', icon: 'Receipt' },
  { id: 'pets', name: 'PETS', label: 'Pets', type: 'EXPENSE', icon: 'PawPrint' },
  { id: 'donations', name: 'DONATIONS', label: 'Doações', type: 'EXPENSE', icon: 'Gift' },
  { id: 'travel', name: 'TRAVEL', label: 'Viagens', type: 'EXPENSE', icon: 'Plane' },
  { id: 'investment', name: 'INVESTMENT', label: 'Investimentos', type: 'EXPENSE', icon: 'TrendingUp' },
  { id: 'transfer', name: 'TRANSFER', label: 'Transferência', type: 'EXPENSE', icon: 'ArrowRightLeft' },
];

const globalCategories = [...globalIncomeCategories, ...globalExpenseCategories];

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'FOOD': return 'bg-blue-400 text-white';
    case 'TRANSPORT': return 'bg-blue-400 text-white';
    case 'HOUSING': return 'bg-blue-400 text-white';
    case 'SHOPPING': return 'bg-blue-400 text-white';
    case 'UTILITIES': return 'bg-blue-400 text-white';
    case 'HEALTHCARE': return 'bg-blue-400 text-white';
    case 'ENTERTAINMENT': return 'bg-blue-400 text-white';
    case 'EDUCATION': return 'bg-blue-400 text-white';
    case 'SALARY': return 'bg-blue-400 text-white';
    case 'FREELANCE': return 'bg-blue-400 text-white';
    case 'INVESTMENT': return 'bg-blue-400 text-white';
    case 'TRANSFER': return 'bg-blue-400 text-white';
    default: return 'bg-blue-400 text-white';
  }
};

export const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    FOOD: 'Alimentação',
    TRANSPORT: 'Transporte',
    HOUSING: 'Moradia',
    SHOPPING: 'Compras',
    UTILITIES: 'Contas',
    HEALTHCARE: 'Saúde',
    ENTERTAINMENT: 'Lazer',
    EDUCATION: 'Educação',
    SALARY: 'Salário',
    FREELANCE: 'Freelance',
    INVESTMENT: 'Investimento',
    TRANSFER: 'Transferência',
    OTHER_EXPENSE: 'Outros',
    OTHER_INCOME: 'Outros',
  };
  return labels[category] || category;
};

export function MobileTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionsData, accountsData, cardsData, userCategoriesData, tagsData] = await Promise.all([
          getTransactions(),
          getAccounts(),
          getCards(),
          CategoryService.getCategories(),
          TagService.getTags(),
        ]);
        setTransactions(transactionsData);
        setAccounts(accountsData);
        setCards(cardsData);
        setUserCategories(userCategoriesData);
        setTags(tagsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar transações');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getSortedCategories = (): DisplayCategory[] => {
    // Convert user categories to DisplayCategory format
    const userDisplayCategories: DisplayCategory[] = userCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      label: cat.name, // Use name as label for user categories
      type: cat.type,
      icon: cat.icon,
      color: cat.color
    }));

    const allCategories = [...userDisplayCategories, ...globalCategories];
    const uniqueCategories = allCategories.filter((cat, index, self) =>
      index === self.findIndex(c => c.name === cat.name)
    );
    return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getCategoryLabel = (categoryName: string) => {
    const allCategories = getSortedCategories();
    const category = allCategories.find(cat => cat.name === categoryName);
    return category ? category.label : categoryName;
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditSheetOpen(true);
    setDetailsOpen(false);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteDialogOpen(true);
    setDetailsOpen(false);
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      await transactionService.delete(deletingTransaction.id);
      setTransactions(prev => prev.filter(t => t.id !== deletingTransaction.id));
      toast.success("Transação excluída com sucesso");
      setIsDeleteDialogOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  const handleEditSuccess = async () => {
    setIsEditSheetOpen(false);
    setEditingTransaction(null);
    // Reload transactions
    const transactionsData = await getTransactions();
    setTransactions(transactionsData);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || transaction.type === typeFilter;
      const matchesCategory = categoryFilter === "ALL" || transaction.category === categoryFilter;
      const matchesTag = tagFilter === "ALL" || (transaction.tags && transaction.tags.some(tag => tag.id === tagFilter));
      
      let matchesAccount = true;
      if (accountFilter !== "ALL") {
        if (accountFilter.startsWith('card_')) {
          matchesAccount = transaction.cardId === accountFilter.replace('card_', '');
        } else {
          matchesAccount = transaction.accountId === accountFilter;
        }
      }

      let matchesDate = true;
      if (dateRange?.from) {
        const transactionDate = new Date(transaction.date.substring(0, 10) + 'T12:00:00');
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        
        if (dateRange.to) {
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          matchesDate = transactionDate >= from && transactionDate <= to;
        } else {
          matchesDate = transactionDate >= from;
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesTag && matchesAccount && matchesDate;
    }).sort((a, b) => new Date(b.date.substring(0, 10) + 'T12:00:00').getTime() - new Date(a.date.substring(0, 10) + 'T12:00:00').getTime());
  }, [transactions, searchTerm, typeFilter, categoryFilter, tagFilter, accountFilter, dateRange]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date.substring(0, 10) + 'T12:00:00');
      let key = format(date, "dd 'de' MMMM", { locale: ptBR });
      
      if (isToday(date)) {
        key = "Hoje";
      } else if (isYesterday(date)) {
        key = "Ontem";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    });

    return groups;
  }, [filteredTransactions]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white backdrop-blur-md">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Extrato</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                  <Filter className="h-5 w-5 text-blue-600" />
                </Button>
              </SheetTrigger>
            <SheetContent side="bottom" className="h-[95vh] rounded-t-[32px] p-0 bg-[#F2F2F7]">
              <div className="flex flex-col h-full">
                <SheetHeader className="px-6 pt-6 pb-4 bg-white rounded-t-[32px] border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-bold">Filtros</SheetTitle>
                    <Button 
                      variant="ghost" 
                      className="text-blue-500 font-medium hover:bg-transparent hover:text-blue-600 p-0 h-auto"
                      onClick={() => {
                        setTypeFilter("ALL");
                        setCategoryFilter("ALL");
                        setTagFilter("ALL");
                        setAccountFilter("ALL");
                        setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Tipo de Transação - Segmented Control Style */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-3">Tipo</label>
                    <div className="bg-white p-1 rounded-xl flex shadow-sm">
                      <button
                        onClick={() => setTypeFilter("ALL")}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          typeFilter === "ALL" ? "bg-blue-400 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setTypeFilter(TransactionType.INCOME)}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          typeFilter === TransactionType.INCOME ? "bg-[#009FE3] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        Entradas
                      </button>
                      <button
                        onClick={() => setTypeFilter(TransactionType.EXPENSE)}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          typeFilter === TransactionType.EXPENSE ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        Saídas
                      </button>
                    </div>
                  </div>

                  {/* Período */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-3">Período</label>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        locale={ptBR}
                        className="w-full flex justify-center p-3"
                        classNames={{
                          head_cell: "text-blue-400 font-normal text-[0.8rem]",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-blue-400 rounded-full",
                          day_selected: "bg-blue-400 text-white hover:bg-blue-400 hover:text-white focus:bg-blue-400 focus:text-white",
                          day_today: "bg-gray-100 text-blue-400",
                        }}
                      />
                    </div>
                  </div>

                  {/* Filtros de Seleção */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-3">Detalhes</label>
                    <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
                      <div className="p-1">
                        <Select value={accountFilter} onValueChange={setAccountFilter}>
                          <SelectTrigger className="w-full border-none shadow-none h-12 text-base focus:ring-0">
                            <div className="flex items-center gap-3 text-gray-500">
                              <CreditCardIcon className="h-5 w-5" />
                              <span className="text-gray-900">Conta / Cartão</span>
                            </div>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Todas as contas</SelectItem>
                            {accounts.map(account => (
                              <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                            ))}
                            {cards.map(card => (
                              <SelectItem key={`card_${card.id}`} value={`card_${card.id}`}>Cartão {card.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="p-1">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="w-full border-none shadow-none h-12 text-base focus:ring-0">
                            <div className="flex items-center gap-3 text-gray-500">
                              <TagIcon className="h-5 w-5" />
                              <span className="text-gray-900">Categoria</span>
                            </div>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Todas as categorias</SelectItem>
                            {getSortedCategories().map(cat => (
                              <SelectItem key={cat.name} value={cat.name}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-1">
                        <Select value={tagFilter} onValueChange={setTagFilter}>
                          <SelectTrigger className="w-full border-none shadow-none h-12 text-base focus:ring-0">
                            <div className="flex items-center gap-3 text-gray-500">
                              <Filter className="h-5 w-5" />
                              <span className="text-gray-900">Tag</span>
                            </div>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Todas as tags</SelectItem>
                            {tags.map(tag => (
                              <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-10"
            />
          </div>

        {/* Active Filters Chips */}
        {(typeFilter !== "ALL" || categoryFilter !== "ALL" || tagFilter !== "ALL" || accountFilter !== "ALL") && (
          <div className="flex gap-2 overflow-x-auto pt-2 scrollbar-hide">
            {typeFilter !== "ALL" && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap">
                {typeFilter === TransactionType.INCOME ? "Entradas" : "Saídas"}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setTypeFilter("ALL")} />
              </div>
            )}
            {categoryFilter !== "ALL" && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap">
                {getCategoryLabel(categoryFilter)}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setCategoryFilter("ALL")} />
              </div>
            )}
            {tagFilter !== "ALL" && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap">
                {tags.find(t => t.id === tagFilter)?.name}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setTagFilter("ALL")} />
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {date}
                </h3>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl active:scale-[0.98] transition-transform cursor-pointer"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className={cn("p-2.5 rounded-xl", getCategoryColor(transaction.category))}>
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                          {transaction.isPaid && (
                            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">
                              ✓ Pago
                            </span>
                          )}
                          {transaction.recurringTransactionId && (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">
                              Recorrente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{getCategoryLabel(transaction.category)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "font-semibold",
                          transaction.type === TransactionType.INCOME ? "text-[#009FE3]" : "text-red-600"
                        )}>
                          {transaction.type === TransactionType.INCOME ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </p>
                        {transaction.installments && (
                          <p className="text-xs text-gray-400">
                            {transaction.currentInstallment}/{transaction.installments}x
                          </p>
                        )}
                        {transaction.recurringTransactionId && !transaction.installments && (
                          <p className="text-xs text-purple-500">
                            Recorrente
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileTransactionDialog 
        transaction={selectedTransaction}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
          <div className="h-full overflow-y-auto p-4 pb-24">
            {editingTransaction && (
              <TransactionForm 
                initialData={editingTransaction}
                onSuccess={handleEditSuccess}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[90%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir Transação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

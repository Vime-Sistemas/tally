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
  Tag as TagIcon,
  Repeat,
  Calendar as CalendarIcon,
  Shirt,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  Shield,
  Percent,
  Key,
  MapPin,
  Users
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
import { RecurringTransactionsManager } from "../../RecurringTransactionsManager";
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
import { Badge } from "../../ui/badge";

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
    case 'FOOD': return <Coffee className="h-4 w-4" />;
    case 'TRANSPORT': return <Car className="h-4 w-4" />;
    case 'HOUSING': return <Home className="h-4 w-4" />;
    case 'SHOPPING': return <ShoppingBag className="h-4 w-4" />;
    case 'UTILITIES': return <Zap className="h-4 w-4" />;
    case 'HEALTHCARE': return <Heart className="h-4 w-4" />;
    case 'ENTERTAINMENT': return <Gamepad2 className="h-4 w-4" />;
    case 'EDUCATION': return <GraduationCap className="h-4 w-4" />;
    case 'SALARY': return <DollarSign className="h-4 w-4" />;
    case 'FREELANCE': return <Briefcase className="h-4 w-4" />;
    case 'INVESTMENT': return <TrendingUp className="h-4 w-4" />;
    case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
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

export const getCategoryColor = () => {
  // Using a more subtle palette for backgrounds
  return 'bg-zinc-100 text-zinc-600';
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
  const [recurringManagerOpen, setRecurringManagerOpen] = useState(false);

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

  const getCategoryLabel = (categoryKey: string) => {
    const allCategories = getSortedCategories();
    let category = allCategories.find(cat => cat.name === categoryKey);
    if (!category) category = allCategories.find(cat => cat.id === categoryKey);
    return category ? category.label : categoryKey;
  };

  const ICON_COMPONENTS: Record<string, any> = {
    Coffee, Car, Home, Zap, Heart, ShoppingBag, Shirt, Gamepad2, GraduationCap, Briefcase,
    DollarSign, TrendingUp, ArrowRightLeft, PiggyBank, Coins, Banknote, Wallet, Building2, Globe,
    Repeat, Landmark, Receipt, PawPrint, Gift, Plane, Shield, Percent, Key, MapPin, Users
  };

  const renderCategoryIconForTransaction = (tx: Transaction) => {
    const allCats = getSortedCategories();
    const byName = allCats.find(c => c.name === tx.category);
    const byId = allCats.find(c => c.id === tx.category);
    const cat = byName || byId;
    if (cat && cat.icon && ICON_COMPONENTS[cat.icon]) {
      const Icon = ICON_COMPONENTS[cat.icon];
      return <Icon className="h-5 w-5" />;
    }
    // fallback to existing canonical mapping
    return getCategoryIcon(cat ? cat.name : tx.category);
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
      toast.loading('Excluindo transação...', { id: 'deleting-mobile' });
      await transactionService.delete(deletingTransaction.id);
      toast.dismiss('deleting-mobile');
      setTransactions(prev => prev.filter(t => t.id !== deletingTransaction.id));
      toast.success("Transação excluída com sucesso");
      setIsDeleteDialogOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      toast.dismiss('deleting-mobile');
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
      // Normalize transaction category (handle case where stored value is category id)
      const allCats = getSortedCategories();
      const txCategoryName = (() => {
        const byName = allCats.find(c => c.name === transaction.category);
        if (byName) return byName.name;
        const byId = allCats.find(c => c.id === transaction.category);
        if (byId) return byId.name;
        return transaction.category;
      })();
      const matchesCategory = categoryFilter === "ALL" || txCategoryName === categoryFilter;
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
    <div className="pb-24 bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="px-2 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-900">Extrato</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-zinc-100 text-zinc-500"
                onClick={() => setRecurringManagerOpen(true)}
              >
                <Repeat className="h-5 w-5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 text-zinc-500">
                    <Filter className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
            <SheetContent side="bottom" className="h-[95vh] rounded-t-[32px] p-0 bg-[#F2F2F7]">
              <div className="flex flex-col h-full">
                <SheetHeader className="px-6 pt-6 pb-4 bg-white rounded-t-[32px] border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-bold">Filtros</SheetTitle>
                    <Button 
                      variant="ghost" 
                      className="text-blue-600 font-medium hover:bg-transparent hover:text-blue-700 p-0 h-auto"
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
                          typeFilter === "ALL" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
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
                          head_cell: "text-blue-600 font-normal text-[0.8rem]",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-blue-600 hover:text-white rounded-full transition-colors",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                          day_today: "bg-zinc-100 text-blue-600 font-bold",
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
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-zinc-50 border-zinc-200 rounded-xl h-10 focus-visible:ring-blue-400"
            />
          </div>

        {/* Active Filters Chips */}
        {(typeFilter !== "ALL" || categoryFilter !== "ALL" || tagFilter !== "ALL" || accountFilter !== "ALL") && (
          <div className="flex gap-2 overflow-x-auto pt-2 scrollbar-hide px-1">
            {typeFilter !== "ALL" && (
              <Badge variant="secondary" className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1 py-1.5 px-3 rounded-full font-normal">
                {typeFilter === TransactionType.INCOME ? "Entradas" : "Saídas"}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setTypeFilter("ALL")} />
              </Badge>
            )}
            {categoryFilter !== "ALL" && (
              <Badge variant="secondary" className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1 py-1.5 px-3 rounded-full font-normal">
                {getCategoryLabel(categoryFilter)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter("ALL")} />
              </Badge>
            )}
            {tagFilter !== "ALL" && (
              <Badge variant="secondary" className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1 py-1.5 px-3 rounded-full font-normal">
                {tags.find(t => t.id === tagFilter)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setTagFilter("ALL")} />
              </Badge>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          </div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="font-medium text-zinc-900">Nenhuma transação encontrada</p>
            <p className="text-sm mt-1">Tente ajustar os filtros ou busque por outro termo.</p>
          </div>
        ) : (
          <div className="space-y-8 mt-6">
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                    {date}
                  </h3>
                </div>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="group flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm active:scale-[0.98] transition-all hover:border-zinc-200 cursor-pointer"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        transaction.type === TransactionType.INCOME ? "bg-blue-50 text-blue-400" : "bg-zinc-100 text-zinc-500"
                      )}>
                        {renderCategoryIconForTransaction(transaction)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-zinc-900 truncate text-sm">{transaction.description}</p>
                          {transaction.isPaid && (
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" title="Pago" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="truncate">{getCategoryLabel(transaction.category)}</span>
                          {transaction.installments && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-zinc-300" />
                              <span>{transaction.currentInstallment}/{transaction.installments}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cn(
                          "font-bold text-sm",
                          transaction.type === TransactionType.INCOME ? "text-blue-400" : "text-zinc-900"
                        )}>
                          {transaction.type === TransactionType.INCOME ? "+" : "-"} {formatCurrency(transaction.amount)}
                        </p>
                        {transaction.recurringTransactionId && (
                          <div className="flex items-center justify-end gap-1 mt-0.5 text-xs text-blue-400 font-medium">
                            <Repeat className="h-3 w-3" />
                          </div>
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
        userCategories={userCategories}
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

      {/* Recurring Transactions Manager */}
      <RecurringTransactionsManager
        open={recurringManagerOpen}
        onOpenChange={setRecurringManagerOpen}
        onUpdate={() => getTransactions().then(setTransactions)}
      />
    </div>
  );
}

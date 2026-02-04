import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  ShoppingBag,
  Shirt,
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
  Users,
  CheckSquare,
  MoreHorizontal
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { getTransactions, getAccounts, getCards } from "../../../services/api";
import { transactionService } from "../../../services/transactions";
import { CategoryService, type Category } from "../../../services/categoryService";
import { TagService, type Tag } from "../../../services/tagService";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import type { DateRange } from "react-day-picker";
import { MobileTransactionDialog } from "../../TransactionDialog/Mobile";
import { TransactionForm } from "../../TransactionForm";
import { Badge } from "../../ui/badge";

// Import new optimized components
import { SwipeableTransactionItem } from "./SwipeableItem";
import { QuickFilters } from "./QuickFilters";
import { TransactionListSkeleton, EmptyState } from "./Skeleton";
import { BulkDeleteBar, SelectionHeader, useBulkDelete } from "./BulkDelete";

// ============================================================================
// Types & Constants
// ============================================================================

interface DisplayCategory {
  id: string;
  name: string;
  label: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}

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

const ICON_COMPONENTS: Record<string, any> = {
  Coffee, Car, Home, Zap, Heart, ShoppingBag, Shirt, Gamepad2, GraduationCap, Briefcase,
  DollarSign, TrendingUp, ArrowRightLeft, PiggyBank, Coins, Banknote, Wallet, Building2, Globe,
  Repeat, Landmark, Receipt, PawPrint, Gift, Plane, Shield, Percent, Key, MapPin, Users
};

// ============================================================================
// Haptic Feedback
// ============================================================================

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30] };
    navigator.vibrate(patterns[type]);
  }
};

// ============================================================================
// Main Component
// ============================================================================

export function MobileTransactionHistoryOptimized() {
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // UI state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recurringManagerOpen, setRecurringManagerOpen] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  
  // Bulk delete
  const bulkDelete = useBulkDelete();

  // Scroll ref for virtual scrolling
  const listRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

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

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    triggerHaptic('light');
    try {
      const transactionsData = await getTransactions();
      setTransactions(transactionsData);
      toast.success('Atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Category helpers
  const getSortedCategories = useCallback((): DisplayCategory[] => {
    const userDisplayCategories: DisplayCategory[] = userCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      label: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color
    }));
    const allCategories = [...userDisplayCategories, ...globalCategories];
    const uniqueCategories = allCategories.filter((cat, index, self) =>
      index === self.findIndex(c => c.name === cat.name)
    );
    return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
  }, [userCategories]);

  const getCategoryLabel = useCallback((categoryKey: string) => {
    const allCategories = getSortedCategories();
    let category = allCategories.find(cat => cat.name === categoryKey);
    if (!category) category = allCategories.find(cat => cat.id === categoryKey);
    return category ? category.label : categoryKey;
  }, [getSortedCategories]);

  const getCategoryIcon = useCallback((tx: Transaction) => {
    const allCats = getSortedCategories();
    const byName = allCats.find(c => c.name === tx.category);
    const byId = allCats.find(c => c.id === tx.category);
    const cat = byName || byId;
    
    if (cat && cat.icon && ICON_COMPONENTS[cat.icon]) {
      const Icon = ICON_COMPONENTS[cat.icon];
      return <Icon className="h-5 w-5" />;
    }
    
    // Default icons
    const defaultIcons: Record<string, any> = {
      FOOD: Coffee, TRANSPORT: Car, HOUSING: Home, SHOPPING: ShoppingBag,
      UTILITIES: Zap, HEALTHCARE: Heart, ENTERTAINMENT: Gamepad2,
      EDUCATION: GraduationCap, SALARY: DollarSign, FREELANCE: Briefcase,
      INVESTMENT: TrendingUp, TRANSFER: ArrowRightLeft
    };
    const Icon = defaultIcons[cat ? cat.name : tx.category] || DollarSign;
    return <Icon className="h-5 w-5" />;
  }, [getSortedCategories]);

  // Filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || transaction.type === typeFilter;
      
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
  }, [transactions, searchTerm, typeFilter, categoryFilter, tagFilter, accountFilter, dateRange, getSortedCategories]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date.substring(0, 10) + 'T12:00:00');
      let key = format(date, "dd 'de' MMMM", { locale: ptBR });
      
      if (isToday(date)) key = "Hoje";
      else if (isYesterday(date)) key = "Ontem";

      if (!groups[key]) groups[key] = [];
      groups[key].push(transaction);
    });

    return groups;
  }, [filteredTransactions]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== "ALL") count++;
    if (tagFilter !== "ALL") count++;
    if (accountFilter !== "ALL") count++;
    return count;
  }, [categoryFilter, tagFilter, accountFilter]);

  // Handlers
  const handleTransactionClick = (transaction: Transaction) => {
    if (bulkDelete.isActive) {
      bulkDelete.toggleSelect(transaction.id);
    } else {
      setSelectedTransaction(transaction);
      setDetailsOpen(true);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    triggerHaptic('light');
    setEditingTransaction(transaction);
    setIsEditSheetOpen(true);
    setDetailsOpen(false);
  };

  const handleDelete = (transaction: Transaction) => {
    triggerHaptic('medium');
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
      triggerHaptic('heavy');
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
    const transactionsData = await getTransactions();
    setTransactions(transactionsData);
  };

  // Bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => transactionService.delete(id)));
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
      toast.success(`${ids.length} transações excluídas`);
      triggerHaptic('heavy');
    } catch (error) {
      console.error("Erro ao excluir transações:", error);
      toast.error("Erro ao excluir transações");
    }
  };

  const clearFilters = () => {
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setTagFilter("ALL");
    setAccountFilter("ALL");
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    triggerHaptic('light');
  };

  return (
    <div className="pb-24 bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-900">Extrato</h1>
            <div className="flex items-center gap-2">
              {/* Bulk Select Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full",
                  bulkDelete.isActive ? "bg-blue-100 text-blue-600" : "hover:bg-zinc-100 text-zinc-500"
                )}
                onClick={bulkDelete.isActive ? bulkDelete.deactivate : bulkDelete.activate}
              >
                <CheckSquare className="h-5 w-5" />
              </Button>
              
              {/* Recurring Transactions */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-zinc-100 text-zinc-500"
                onClick={() => setRecurringManagerOpen(true)}
              >
                <Repeat className="h-5 w-5" />
              </Button>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 text-zinc-500">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                    <Repeat className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                    Atualizar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Filters */}
          <QuickFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onOpenFullFilters={() => setFiltersSheetOpen(true)}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Active Filters Chips */}
          <AnimatePresence>
            {activeFiltersCount > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex gap-2 overflow-x-auto scrollbar-hide"
              >
                {categoryFilter !== "ALL" && (
                  <Badge 
                    variant="secondary" 
                    className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1 py-1.5 px-3 rounded-full font-normal cursor-pointer"
                    onClick={() => setCategoryFilter("ALL")}
                  >
                    {getCategoryLabel(categoryFilter)}
                    <X className="h-3 w-3" />
                  </Badge>
                )}
                {tagFilter !== "ALL" && (
                  <Badge 
                    variant="secondary" 
                    className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1 py-1.5 px-3 rounded-full font-normal cursor-pointer"
                    onClick={() => setTagFilter("ALL")}
                  >
                    {tags.find(t => t.id === tagFilter)?.name}
                    <X className="h-3 w-3" />
                  </Badge>
                )}
                {accountFilter !== "ALL" && (
                  <Badge 
                    variant="secondary" 
                    className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1 py-1.5 px-3 rounded-full font-normal cursor-pointer"
                    onClick={() => setAccountFilter("ALL")}
                  >
                    {accountFilter.startsWith('card_') 
                      ? cards.find(c => c.id === accountFilter.replace('card_', ''))?.name
                      : accounts.find(a => a.id === accountFilter)?.name
                    }
                    <X className="h-3 w-3" />
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selection Header */}
      <div className="px-4 pt-4">
        <SelectionHeader
          isActive={bulkDelete.isActive}
          selectedCount={bulkDelete.selectedCount}
          totalCount={filteredTransactions.length}
          onSelectAll={() => bulkDelete.selectAll(filteredTransactions.map(t => t.id))}
          onDeselectAll={bulkDelete.deselectAll}
          onClose={bulkDelete.deactivate}
        />
      </div>

      {/* Transactions List */}
      <div ref={listRef} className="px-4">
        {loading ? (
          <TransactionListSkeleton count={2} />
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8 text-zinc-300" />}
            title="Nenhuma transação encontrada"
            description="Tente ajustar os filtros ou busque por outro termo."
            action={activeFiltersCount > 0 ? { label: 'Limpar filtros', onClick: clearFilters } : undefined}
          />
        ) : (
          <div className="space-y-8 mt-4">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                    {date}
                  </h3>
                </div>
                <div>
                  {txs.map((transaction) => (
                    <SwipeableTransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onClick={handleTransactionClick}
                      categoryIcon={getCategoryIcon(transaction)}
                      categoryLabel={getCategoryLabel(transaction.category)}
                      isSelected={bulkDelete.isSelected(transaction.id)}
                      onSelect={(tx, selected) => {
                        if (selected) bulkDelete.toggleSelect(tx.id);
                        else bulkDelete.toggleSelect(tx.id);
                      }}
                      selectionMode={bulkDelete.isActive}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Delete Bar */}
      <BulkDeleteBar
        selectedCount={bulkDelete.selectedCount}
        onCancel={bulkDelete.deactivate}
        onDelete={() => bulkDelete.handleDelete(handleBulkDelete)}
        isDeleting={bulkDelete.isDeleting}
      />

      {/* Full Filters Sheet */}
      <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-[32px] p-0 bg-[#F2F2F7]">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 pt-6 pb-4 bg-white rounded-t-[32px] border-b border-gray-100">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold">Filtros</SheetTitle>
                <Button
                  variant="ghost"
                  className="text-blue-600 font-medium hover:bg-transparent hover:text-blue-700 p-0 h-auto"
                  onClick={clearFilters}
                >
                  Limpar
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
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

      {/* Transaction Details Dialog */}
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

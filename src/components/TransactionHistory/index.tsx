import { useState, useEffect, useMemo } from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
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
  GraduationCap,
  ShoppingBag,
  Gamepad2,
  MoreHorizontal,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  X,
  Check,
  Download,
  ChevronsUpDown,
  Tag as TagIcon,
  Shirt,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  Repeat,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  Shield,
  Smartphone,
  Glasses,
  KeyRound,
  Ticket,
  Wifi
} from 'lucide-react';
import { Percent, Key, MapPin, Users } from 'lucide-react';
import { exportTransactionsToPDF } from "../../tools/pdfExporter";
import { cn } from "../../lib/utils";
import { getTransactions, getAccounts, getCards, updateTransaction, deleteTransaction } from "../../services/api";
import { CategoryService, type Category } from "../../services/categoryService";
import { TagService, type Tag } from "../../services/tagService";
import { toast } from "sonner";
import type { Transaction } from "../../types/transaction";
import type { Account, CreditCard } from "../../types/account";
import { Button } from "../ui/button";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "../ui/calendar";
import type { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { useUser } from "../../contexts/UserContext";
import type { Page } from "../../types/navigation";
import { RecurringTransactionsManager } from "../RecurringTransactionsManager";

// Local interface for display categories (includes label property)
interface DisplayCategory {
  id: string;
  name: string;
  label: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}

// Helper to parse UTC date string as local date (ignoring time)
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

import { MobileTransactionHistory } from "./Mobile";
import { useIsMobile } from "../../hooks/use-mobile";

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
  // não precisamos de getRoles aqui — evitar aviso de variável não usada
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recurringManagerOpen, setRecurringManagerOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [openCategory, setOpenCategory] = useState(false);
  const [openTag, setOpenTag] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [presetApplied, setPresetApplied] = useState(false);

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
  const { costCenters } = useUser();

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

  useEffect(() => {
    if (presetApplied || loading) return;
    const raw = sessionStorage.getItem('transactionHistoryPreset');
    if (!raw) {
      setPresetApplied(true);
      return;
    }
    try {
      const preset = JSON.parse(raw);
      if (preset.category) setCategoryFilter([preset.category]);
      if (preset.tag) setTagFilter([preset.tag]);
      if (preset.type) setTypeFilter(preset.type);
      if (preset.searchTerm) setSearchTerm(preset.searchTerm);
    } catch (error) {
      console.error('Erro ao aplicar filtro do atalho', error);
    } finally {
      sessionStorage.removeItem('transactionHistoryPreset');
      setPresetApplied(true);
    }
  }, [presetApplied, loading]);

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

  const getCategoryIcon = (categoryName: string) => {
    const iconProps = { className: 'h-5 w-5' };
    switch (categoryName) {
      case 'FOOD': return <Coffee {...iconProps} />;
      case 'TRANSPORT': return <Car {...iconProps} />;
      case 'HOUSING': return <Home {...iconProps} />;
      case 'SHOPPING': return <ShoppingBag {...iconProps} />;
      case 'UTILITIES': return <Zap {...iconProps} />;
      case 'HEALTHCARE': return <Heart {...iconProps} />;
      case 'ENTERTAINMENT': return <Gamepad2 {...iconProps} />;
      case 'EDUCATION': return <GraduationCap {...iconProps} />;
      case 'SALARY': return <DollarSign {...iconProps} />;
      case 'FREELANCE': return <Briefcase {...iconProps} />;
      case 'INVESTMENT': return <TrendingUp {...iconProps} />;
      case 'TRANSFER': return <ArrowRightLeft {...iconProps} />;
      default: return <MoreHorizontal {...iconProps} />;
    }
  };

// Map of icon name -> lucide component (used when categories have an `icon` string)
const ICON_COMPONENTS: Record<string, any> = {
  Coffee, Car, Home, Zap, Heart, ShoppingBag, Shirt, Gamepad2, GraduationCap, Briefcase,
  DollarSign, TrendingUp, ArrowRightLeft, PiggyBank, Coins, Banknote, Wallet, Building2, Globe,
  Repeat, Landmark, Receipt, PawPrint, Gift, Plane, MoreHorizontal, Shield, Percent, Key, MapPin, Users, Smartphone, Glasses, KeyRound, Ticket, Wifi
};

const renderCategoryIconForTransaction = (tx: Transaction) => {
  const allCats = getSortedCategories();
  const byName = allCats.find(c => c.name === tx.category);
  const byId = allCats.find(c => c.id === tx.category);
  const cat = byName || byId;
  const iconProps = { className: 'h-5 w-5' };
  if (cat && cat.icon && ICON_COMPONENTS[cat.icon]) {
    const Icon = ICON_COMPONENTS[cat.icon];
    return <Icon {...iconProps} />;
  }
  // fallback to canonical mapping by name (handles global categories)
  const nameToUse = cat ? cat.name : tx.category;
  return getCategoryIcon(nameToUse);
};

  const getCategoryLabel = (categoryKey: string) => {
    const allCategories = getSortedCategories();
    // Try to find by canonical name first, then by id (user categories may be stored by id)
    let category = allCategories.find(cat => cat.name === categoryKey);
    if (!category) category = allCategories.find(cat => cat.id === categoryKey);
    return category ? category.label : categoryKey;
  };

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
        costCenterId: (editingCostCenterId && editingCostCenterId !== '__NONE__') ? editingCostCenterId : undefined,
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
        // Normalize transaction category: transaction may store either the category name (e.g. 'FOOD')
        // or the user category id (GUID). Try to map id -> name using merged categories.
        const allCats = getSortedCategories();
        const txCategoryName = (() => {
          const byName = allCats.find(c => c.name === t.category);
          if (byName) return byName.name;
          const byId = allCats.find(c => c.id === t.category);
          if (byId) return byId.name;
          return t.category;
        })();
        const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(txCategoryName);
        const matchesTag = tagFilter.length === 0 || (t.tags && t.tags.some(tag => tagFilter.includes(tag.id)));
        const matchesAccount = accountFilter === "ALL" || (t.accountId === accountFilter) || (t.cardId === accountFilter);
        const transactionDate = startOfDay(parseUTCDate(t.date));
        const matchesDate = (!dateRange?.from || transactionDate >= startOfDay(dateRange.from)) && (!dateRange?.to || transactionDate <= endOfDay(dateRange.to));
        return matchesSearch && matchesType && matchesCategory && matchesTag && matchesAccount && matchesDate;
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
  }, [transactions, searchTerm, typeFilter, categoryFilter, tagFilter, accountFilter, dateRange]);

  const handleExportPDF = () => {
    const filteredTransactions = Object.values(groupedTransactions).flat();
    exportTransactionsToPDF(
      { transactions: filteredTransactions, summary, dateRange },
      accounts,
      cards
    );
  };

  const clearFilters = () => {
    setCategoryFilter([]);
    setTagFilter([]);
    setAccountFilter("ALL");
    setTypeFilter("ALL");
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    setSearchTerm("");
  };

  const activeFilters =
    (categoryFilter.length > 0 ? 1 : 0) +
    (tagFilter.length > 0 ? 1 : 0) +
    (accountFilter !== "ALL" ? 1 : 0) +
    (typeFilter !== "ALL" ? 1 : 0);

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
              onClick={() => setRecurringManagerOpen(true)}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full shadow-md transition-all hover:scale-[1.02]"
            >
              <Repeat className="mr-2 h-4 w-4" /> Recorrentes
            </Button>
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

        {/* Search + Filters Sheet */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por descrição..."
              className="pl-10 border-zinc-100 bg-zinc-50/50 rounded-xl h-10 focus:bg-white focus:ring-blue-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              onClick={() => setFiltersOpen(true)}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Filtros
              {activeFilters > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-500 border-transparent">{activeFilters}</Badge>
              )}
            </Button>
          </div>
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md bg-white p-6 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>Refine o que você vê no histórico.</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Período</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-11 bg-zinc-50 border-zinc-100 hover:bg-white">
                      <div className="flex items-center gap-2 text-zinc-700">
                        <CalendarClock className="h-4 w-4 text-blue-400" />
                        {dateRange?.from ? (
                          dateRange.to ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}` : format(dateRange.from, "dd/MM")
                        ) : "Selecione"}
                      </div>
                      <ChevronsUpDown className="h-4 w-4 text-zinc-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Categorias</Label>
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full h-11 justify-between bg-zinc-50 border-zinc-100 hover:bg-white text-zinc-900 font-normal",
                        categoryFilter.length === 0 && "text-zinc-400"
                      )}
                    >
                      <div className="flex items-center gap-1 truncate">
                        {categoryFilter.length === 0 ? (
                          "Todas"
                        ) : categoryFilter.length === 1 ? (
                          getSortedCategories().find(cat => cat.name === categoryFilter[0])?.label
                        ) : (
                          <span className="text-xs">{categoryFilter.length} selecionadas</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar categoria..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="CLEAR"
                            onSelect={() => {
                              setCategoryFilter([]);
                              setOpenCategory(false);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            Limpar seleção
                          </CommandItem>
                          {getSortedCategories().map((cat) => (
                            <CommandItem
                              key={cat.name}
                              value={cat.name}
                              onSelect={(value) => {
                                setCategoryFilter(prev => 
                                  prev.includes(value) 
                                    ? prev.filter(c => c !== value)
                                    : [...prev, value]
                                );
                                setOpenCategory(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  categoryFilter.includes(cat.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {cat.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Tags</Label>
                <Popover open={openTag} onOpenChange={setOpenTag}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full h-11 justify-between bg-zinc-50 border-zinc-100 hover:bg-white text-zinc-900 font-normal"
                    >
                      <div className="flex items-center gap-1 truncate">
                        {tagFilter.length === 0 ? (
                          "Todas"
                        ) : tagFilter.length === 1 ? (
                          tags.find(tag => tag.id === tagFilter[0])?.name
                        ) : (
                          <span className="text-xs">{tagFilter.length} selecionadas</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[240px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tag..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="CLEAR" onSelect={() => { setTagFilter([]); setOpenTag(false); }}>
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            Limpar seleção
                          </CommandItem>
                          {tags.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              value={tag.id}
                              onSelect={(value) => {
                                setTagFilter(prev => 
                                  prev.includes(value) 
                                    ? prev.filter(t => t !== value)
                                    : [...prev, value]
                                );
                                setOpenTag(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  tagFilter.includes(tag.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Contas</Label>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="w-full h-11 bg-zinc-50 border-zinc-100">
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as contas</SelectItem>
                    {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    {cards.map(card => <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full h-11 bg-zinc-50 border-zinc-100">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value={TransactionType.INCOME}>Receitas</SelectItem>
                    <SelectItem value={TransactionType.EXPENSE}>Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SheetFooter className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>Limpar</Button>
              <Button className="flex-1 bg-blue-400 hover:bg-blue-500 text-white" onClick={() => setFiltersOpen(false)}>Aplicar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Active Filters */}
        {(categoryFilter.length > 0 || tagFilter.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {categoryFilter.map(catName => {
              const cat = getSortedCategories().find(c => c.name === catName);
              return cat ? (
                <Badge key={catName} variant="secondary" className="flex items-center gap-1">
                  {cat.label}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => setCategoryFilter(prev => prev.filter(c => c !== catName))}
                  />
                </Badge>
              ) : null;
            })}
            {tagFilter.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <Badge key={tagId} variant="outline" className="flex items-center gap-1">
                  <TagIcon className="h-3 w-3" />
                  {tag.name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => setTagFilter(prev => prev.filter(t => t !== tagId))}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        )}

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
                        {renderCategoryIconForTransaction(transaction)}
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
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden bg-white">
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
                         {getSortedCategories().map(cat => (
                           <SelectItem key={cat.name} value={cat.name}>{cat.label}</SelectItem>
                         ))}
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
                 <Label className="text-xs text-zinc-500 font-bold uppercase">Centro de Custo</Label>
                 <Select value={editingCostCenterId} onValueChange={setEditingCostCenterId}>
                   <SelectTrigger className="bg-white border-zinc-200 h-11"><SelectValue placeholder="Sem centro de custo" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="__NONE__">Sem Centro de Custo</SelectItem>
                     {costCenters.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label className="text-xs text-zinc-500 font-bold uppercase">Parcelas</Label>
                 <div className="flex gap-2">
                   <Input type="number" value={editingCurrentInstallment ?? ''} onChange={(e) => setEditingCurrentInstallment(e.target.value ? parseInt(e.target.value) : null)} className="bg-white border-zinc-200 h-11" placeholder="Atual" />
                   <Input type="number" value={editingTotalInstallments ?? ''} onChange={(e) => setEditingTotalInstallments(e.target.value ? parseInt(e.target.value) : null)} className="bg-white border-zinc-200 h-11" placeholder="Total" />
                 </div>
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

      {/* Recurring Transactions Manager */}
      <RecurringTransactionsManager
        open={recurringManagerOpen}
        onOpenChange={setRecurringManagerOpen}
        onUpdate={() => {
          // Recarrega as transações quando houver alterações nas recorrentes
          getTransactions().then(setTransactions);
        }}
      />

    </div>
  );
}
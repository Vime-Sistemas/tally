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
  X
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { getTransactions, getAccounts, getCards } from "../../../services/api";
import { transactionService } from "../../../services/transactions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { DateRange } from "react-day-picker";
import { MobileTransactionDialog } from "../../TransactionDialog/Mobile";

// Helper to parse UTC date string as local date (ignoring time)
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const getCategoryIcon = (category: string) => {
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

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'FOOD': return 'bg-orange-100 text-orange-600';
    case 'TRANSPORT': return 'bg-blue-100 text-blue-600';
    case 'HOUSING': return 'bg-indigo-100 text-indigo-600';
    case 'SHOPPING': return 'bg-pink-100 text-pink-600';
    case 'UTILITIES': return 'bg-yellow-100 text-yellow-600';
    case 'HEALTHCARE': return 'bg-red-100 text-red-600';
    case 'ENTERTAINMENT': return 'bg-purple-100 text-purple-600';
    case 'EDUCATION': return 'bg-cyan-100 text-cyan-600';
    case 'SALARY': return 'bg-emerald-100 text-emerald-600';
    case 'FREELANCE': return 'bg-teal-100 text-teal-600';
    case 'INVESTMENT': return 'bg-lime-100 text-lime-600';
    case 'TRANSFER': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getCategoryLabel = (category: string) => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || transaction.type === typeFilter;
      const matchesCategory = categoryFilter === "ALL" || transaction.category === categoryFilter;
      
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
        const transactionDate = parseUTCDate(transaction.date);
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

      return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, typeFilter, categoryFilter, accountFilter, dateRange]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = parseUTCDate(transaction.date);
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

  const handleEdit = (transaction: Transaction) => {
    toast.info("Edição em breve", transaction);
  };

  const handleDelete = async (transaction: Transaction) => {
    try {
      await transactionService.delete(transaction.id);
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      toast.success("Transação excluída");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  return (
    <div className="pb-24 space-y-4">
      {/* Header & Search */}
      <div className="sticky top-0 bg-white z-10 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              className="pl-10 bg-gray-100 border-none rounded-xl h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="mb-6">
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 overflow-y-auto pb-20">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Período</label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      locale={ptBR}
                      className="rounded-md border-none shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <div className="flex gap-2">
                    <Button
                      variant={typeFilter === "ALL" ? "default" : "outline"}
                      onClick={() => setTypeFilter("ALL")}
                      className="flex-1 rounded-xl"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={typeFilter === TransactionType.INCOME ? "default" : "outline"}
                      onClick={() => setTypeFilter(TransactionType.INCOME)}
                      className="flex-1 rounded-xl"
                    >
                      Entradas
                    </Button>
                    <Button
                      variant={typeFilter === TransactionType.EXPENSE ? "default" : "outline"}
                      onClick={() => setTypeFilter(TransactionType.EXPENSE)}
                      className="flex-1 rounded-xl"
                    >
                      Saídas
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Conta / Cartão</label>
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Todas as contas" />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Categoria</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as categorias</SelectItem>
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
                      <SelectItem value="OTHER_EXPENSE">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Chips */}
        {(typeFilter !== "ALL" || categoryFilter !== "ALL" || accountFilter !== "ALL" || (dateRange?.from && dateRange?.to)) && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {typeFilter !== "ALL" && (
              <div className="flex items-center gap-1 px-3 py-1 bg-black text-white rounded-full text-xs whitespace-nowrap">
                {typeFilter === TransactionType.INCOME ? "Entradas" : "Saídas"}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setTypeFilter("ALL")} />
              </div>
            )}
            {categoryFilter !== "ALL" && (
              <div className="flex items-center gap-1 px-3 py-1 bg-black text-white rounded-full text-xs whitespace-nowrap">
                {getCategoryLabel(categoryFilter)}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setCategoryFilter("ALL")} />
              </div>
            )}
            {/* Add more chips if needed */}
          </div>
        )}
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : Object.keys(groupedTransactions).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, transactions]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500 sticky top-14 bg-white/95 backdrop-blur py-2 z-0">
                {date}
              </h3>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", getCategoryColor(transaction.category))}>
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{getCategoryLabel(transaction.category)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        transaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"
                      )}>
                        {transaction.type === TransactionType.INCOME ? "+" : "-"} 
                        R$ {transaction.amount.toFixed(2)}
                      </p>
                      {transaction.installments && (
                        <p className="text-xs text-gray-400">
                          {transaction.currentInstallment}/{transaction.installments}
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

      <MobileTransactionDialog 
        transaction={selectedTransaction}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

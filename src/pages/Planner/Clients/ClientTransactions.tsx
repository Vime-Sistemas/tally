import { useState, useEffect } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Calendar as CalendarIcon, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Wallet,
  Tag,
  FileText,
  Building2
} from "lucide-react";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClientTransactionsProps {
  client: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  onBack: () => void;
}

// Helper to parse UTC date string as local date (ignoring time)
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

function MonthPicker({ date, onSelect }: { date: Date, onSelect: (date: Date) => void }) {
  const [year, setYear] = useState(date.getFullYear());
  
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  return (
    <div className="p-4 w-[280px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(year - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-bold text-sm text-zinc-900">{year}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(year + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {months.map((month, index) => {
          const isSelected = date.getMonth() === index && date.getFullYear() === year;
          return (
            <Button
              key={month}
              variant={isSelected ? "default" : "ghost"}
              className={cn(
                "text-xs h-8 w-full",
                isSelected ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-zinc-600"
              )}
              onClick={() => onSelect(new Date(year, index, 1))}
            >
              {month}
            </Button>
          )
        })}
      </div>
    </div>
  );
}


export function ClientTransactions({ client, onBack }: ClientTransactionsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [txRes, catRes] = await Promise.all([
          api.get(`/transactions?userId=${client.id}`),
          api.get(`/categories?userId=${client.id}`)
        ]);
        setTransactions(txRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error("Failed to fetch client data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [client.id]);

  const getCategoryDetails = (transaction: any) => {
    if (transaction.categoryModel) {
      return { name: transaction.categoryModel.name, color: transaction.categoryModel.color || '#9ca3af' };
    }
    
    const globalCategories = [
      { id: 'salary', name: 'SALARY', label: 'Salário', color: '#10b981' },
      { id: 'freelance', name: 'FREELANCE', label: 'Freelance', color: '#10b981' },
      { id: 'food', name: 'FOOD', label: 'Alimentação', color: '#ef4444' },
      { id: 'transport', name: 'TRANSPORT', label: 'Transporte', color: '#3b82f6' },
      { id: 'housing', name: 'HOUSING', label: 'Moradia', color: '#f59e0b' },
      { id: 'utilities', name: 'UTILITIES', label: 'Contas', color: '#6366f1' },
      { id: 'entertainment', name: 'ENTERTAINMENT', label: 'Lazer', color: '#8b5cf6' },
      { id: 'shopping', name: 'SHOPPING', label: 'Compras', color: '#ec4899' },
      { id: 'health', name: 'HEALTH', label: 'Saúde', color: '#ef4444' },
      { id: 'education', name: 'EDUCATION', label: 'Educação', color: '#3b82f6' },
      { id: 'other', name: 'OTHER', label: 'Outros', color: '#9ca3af' },
    ];

    if (transaction.category) {
      const global = globalCategories.find(c => c.name === transaction.category);
      if (global) return { name: global.label, color: global.color };

      const userCat = categories.find(c => c.id === transaction.category);
      if (userCat) return { name: userCat.name, color: userCat.color || '#9ca3af' };

      return { name: transaction.category, color: '#9ca3af' };
    }
    return null;
  };

  const filteredTransactions = transactions.filter(t => {
    const tDate = parseUTCDate(t.date);
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    const matchesDate = date ? isSameMonth(tDate, date) : true;

    return matchesSearch && matchesType && matchesDate;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack} className="rounded-full h-10 w-10 border-zinc-200 hover:bg-zinc-50">
          <ArrowLeft className="w-5 h-5 text-zinc-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Extrato Completo</h1>
          <p className="text-zinc-500">Visualizando movimentações de {client.name}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar transação..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal h-10 border-zinc-200", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                {date ? format(date, "MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione o mês</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-zinc-200 shadow-xl" align="start">
              <MonthPicker 
                date={date} 
                onSelect={(newDate) => {
                  setDate(newDate);
                  setIsMonthPickerOpen(false);
                }} 
              />
            </PopoverContent>
          </Popover>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="INCOME">Entradas</SelectItem>
              <SelectItem value="EXPENSE">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <span className="block text-zinc-500 text-xs">Entradas</span>
            <span className="font-semibold text-emerald-600">
              {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="h-8 w-px bg-zinc-200" />
          <div className="text-right">
            <span className="block text-zinc-500 text-xs">Saídas</span>
            <span className="font-semibold text-red-600">
              {totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="h-8 w-px bg-zinc-200" />
          <div className="text-right">
            <span className="block text-zinc-500 text-xs">Saldo</span>
            <span className={cn("font-semibold", balance >= 0 ? "text-emerald-600" : "text-red-600")}>
              {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-zinc-50/50">
                <TableHead className="w-[150px]">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                    Nenhuma transação encontrada neste período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((t) => {
                  const cat = getCategoryDetails(t);
                  return (
                    <TableRow 
                      key={t.id} 
                      className="group hover:bg-zinc-50 cursor-pointer"
                      onClick={() => setSelectedTransaction(t)}
                    >
                      <TableCell className="text-zinc-500 font-medium">
                        {format(parseUTCDate(t.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900">{t.description}</span>
                          {t.isPaid && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                              <Check className="w-3 h-3" /> Pago
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cat ? (
                          <Badge variant="outline" className="text-zinc-500 border-zinc-200 bg-white font-normal w-fit">
                            <span 
                              className="w-1.5 h-1.5 rounded-full mr-1.5"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </Badge>
                        ) : (
                          <span className="text-zinc-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">
                        {t.account?.name || t.card?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold whitespace-nowrap",
                          t.type === 'EXPENSE' ? "text-red-600" : "text-emerald-600"
                        )}>
                          {t.type === 'EXPENSE' ? '-' : '+'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-zinc-100">
                <div className={cn(
                  "p-3 rounded-full",
                  selectedTransaction.type === 'EXPENSE' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {selectedTransaction.type === 'EXPENSE' ? <ArrowLeft className="w-6 h-6 rotate-45" /> : <ArrowLeft className="w-6 h-6 -rotate-135" />}
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-500">Valor</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    selectedTransaction.type === 'EXPENSE' ? "text-red-600" : "text-emerald-600"
                  )}>
                    {selectedTransaction.type === 'EXPENSE' ? '-' : '+'} {selectedTransaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-sm">Data</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-900">
                    {format(parseUTCDate(selectedTransaction.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Descrição</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-900">{selectedTransaction.description}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">Categoria</span>
                  </div>
                  {(() => {
                    const cat = getCategoryDetails(selectedTransaction);
                    return cat ? (
                      <Badge variant="outline" className="text-zinc-500 border-zinc-200 bg-white font-normal">
                        <span 
                          className="w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-zinc-400">-</span>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-500">
                    {selectedTransaction.card ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    <span className="text-sm">{selectedTransaction.card ? 'Cartão' : 'Conta'}</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-900">
                    {selectedTransaction.account?.name || selectedTransaction.card?.name || '-'}
                  </span>
                </div>

                {selectedTransaction.costCenter && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm">Centro de Custo</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-900">
                      {selectedTransaction.costCenter.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <span className="text-sm text-zinc-500">Status</span>
                  {selectedTransaction.isPaid ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Pago
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pendente
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

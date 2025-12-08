import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TransactionType, TransactionCategory } from "../../types/transaction";
import { ArrowDownCircle, ArrowUpCircle, Search, Filter, ArrowUpDown, Calendar, Receipt, Tag, Wallet } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

// Mock data
const initialTransactions = [
  {
    id: '1',
    type: TransactionType.EXPENSE,
    category: TransactionCategory.FOOD,
    amount: 45.90,
    description: 'Almoço',
    date: '2025-12-08',
    account: 'Nubank',
  },
  {
    id: '2',
    type: TransactionType.INCOME,
    category: TransactionCategory.FREELANCE,
    amount: 1500.00,
    description: 'Projeto Website',
    date: '2025-12-07',
    account: 'Banco Inter',
  },
  {
    id: '3',
    type: TransactionType.EXPENSE,
    category: TransactionCategory.TRANSPORT,
    amount: 22.50,
    description: 'Uber',
    date: '2025-12-07',
    account: 'Nubank',
  },
   {
    id: '4',
    type: TransactionType.EXPENSE,
    category: TransactionCategory.SHOPPING,
    amount: 250.00,
    description: 'Roupas',
    date: '2025-12-05',
    account: 'Itaú',
  },
  {
    id: '5',
    type: TransactionType.EXPENSE,
    category: TransactionCategory.UTILITIES,
    amount: 120.00,
    description: 'Conta de Luz',
    date: '2025-12-01',
    account: 'Banco Inter',
  },
];

export function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<string>("DATE_DESC");

  const filteredTransactions = initialTransactions
    .filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortOrder === "DATE_DESC") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === "DATE_ASC") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOrder === "AMOUNT_DESC") return b.amount - a.amount;
      if (sortOrder === "AMOUNT_ASC") return a.amount - b.amount;
      return 0;
    });

  return (
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-black">Histórico de Transações</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredTransactions.length} registros encontrados
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value={TransactionType.INCOME}>Receitas</SelectItem>
                <SelectItem value={TransactionType.EXPENSE}>Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DATE_DESC">Mais recentes</SelectItem>
                <SelectItem value="DATE_ASC">Mais antigas</SelectItem>
                <SelectItem value="AMOUNT_DESC">Maior valor</SelectItem>
                <SelectItem value="AMOUNT_ASC">Menor valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada.
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <Dialog key={transaction.id}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                        transaction.type === TransactionType.INCOME 
                          ? "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200" 
                          : "bg-red-100 text-red-600 group-hover:bg-red-200"
                      )}>
                        {transaction.type === TransactionType.INCOME ? <ArrowUpCircle className="h-6 w-6" /> : <ArrowDownCircle className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-gray-600">{transaction.account}</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-semibold text-lg",
                      transaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"
                    )}>
                      {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
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
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                      <span className="text-sm text-muted-foreground mb-1">Valor</span>
                      <span className={cn(
                        "text-3xl font-bold",
                        transaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"
                      )}>
                        {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Receipt className="h-4 w-4" />
                          <span>Descrição</span>
                        </div>
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="h-4 w-4" />
                          <span>Categoria</span>
                        </div>
                        <span className="font-medium">{transaction.category}</span>
                      </div>

                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Wallet className="h-4 w-4" />
                          <span>Conta</span>
                        </div>
                        <span className="font-medium">{transaction.account}</span>
                      </div>

                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Data</span>
                        </div>
                        <span className="font-medium">{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

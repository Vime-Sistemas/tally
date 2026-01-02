import { useState, useEffect } from "react";
import api from "@/services/api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Calendar,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ClientDashboardProps {
  client: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  onBack: () => void;
}

export function ClientDashboard({ client, onBack }: ClientDashboardProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [txRes, accRes, cardRes] = await Promise.all([
          api.get(`/transactions?userId=${client.id}`),
          api.get(`/accounts?userId=${client.id}`),
          api.get(`/cards?userId=${client.id}`)
        ]);
        setTransactions(txRes.data);
        setAccounts(accRes.data);
        setCards(cardRes.data);
      } catch (error) {
        console.error("Failed to fetch client data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [client.id]);

  // Calculations
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const income = recentTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const expense = recentTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  
  // Cash Flow Ratio (for progress bar)
  const cashFlowTotal = income + expense;
  const incomeRatio = cashFlowTotal > 0 ? (income / cashFlowTotal) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full h-10 w-10 border-zinc-200 hover:bg-zinc-50">
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-emerald-100">
              <AvatarImage src={client.picture} />
              <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold text-lg">
                {client.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-none">{client.name}</h2>
              <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                 <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                 Cliente Ativo
                 <span className="text-zinc-300">•</span>
                 {client.email}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
             <Calendar className="w-4 h-4 mr-2" />
             Agendar Reunião
           </Button>
           <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200">
             Gerar Relatório
           </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Balance Card */}
        <Card className="border-zinc-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet className="w-24 h-24 text-emerald-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Patrimônio Líquido (Contas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{formatCurrency(totalBalance)}</div>
            <div className="flex items-center gap-2 mt-2 text-sm">
               <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" /> +12%
               </span>
               <span className="text-zinc-400">vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card className="border-zinc-200 shadow-sm col-span-1 md:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
             <div>
                <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Fluxo de Caixa (30d)</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between mb-2">
                <div>
                   <span className="text-sm text-zinc-500 block">Entradas</span>
                   <span className="text-2xl font-bold text-emerald-600">{formatCurrency(income)}</span>
                </div>
                <div className="text-right">
                   <span className="text-sm text-zinc-500 block">Saídas</span>
                   <span className="text-2xl font-bold text-red-600">{formatCurrency(expense)}</span>
                </div>
             </div>
             
             {/* Visual Progress Bar */}
             <div className="relative h-3 w-full bg-red-100 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${incomeRatio}%` }}
                />
             </div>
             <div className="flex justify-between mt-1 text-xs text-zinc-400">
                <span>{incomeRatio.toFixed(0)}% Receita</span>
                <span>{(100 - incomeRatio).toFixed(0)}% Despesa</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column: Lists */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Accounts List */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-zinc-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-zinc-900">Contas Bancárias</CardTitle>
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">{accounts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <div className="space-y-1">
                {accounts.map(account => (
                  <div key={account.id} className="group flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-zinc-200 shadow-sm group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-colors">
                        <Wallet className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-zinc-900">{account.name}</p>
                        <p className="text-xs text-zinc-500 capitalize">{account.type.toLowerCase()}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-zinc-700">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
                {accounts.length === 0 && <p className="text-sm text-zinc-500 text-center py-6">Nenhuma conta encontrada.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Credit Cards List */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-zinc-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-zinc-900">Cartões de Crédito</CardTitle>
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">{cards.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <div className="space-y-1">
                {cards.map(card => {
                  const usage = (card.currentInvoice / card.limit) * 100;
                  const isHighUsage = usage > 80;
                  
                  return (
                    <div key={card.id} className="flex flex-col gap-2 px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-zinc-200 shadow-sm">
                            <CreditCard className="w-4 h-4 text-zinc-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-zinc-900">{card.name}</p>
                            <p className="text-xs text-zinc-500">Fecha dia {card.closingDay}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-zinc-900">{formatCurrency(card.currentInvoice || 0)}</p>
                          <p className="text-xs text-zinc-400">de {formatCurrency(card.limit)}</p>
                        </div>
                      </div>
                      
                      {/* Mini usage bar */}
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full rounded-full", isHighUsage ? "bg-red-500" : "bg-emerald-500")}
                           style={{ width: `${Math.min(usage, 100)}%` }} 
                         />
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && <p className="text-sm text-zinc-500 text-center py-6">Nenhum cartão encontrado.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Transactions */}
        <div className="lg:col-span-2">
          <Card className="border-zinc-200 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-900">Extrato Recente</CardTitle>
                <CardDescription>Últimas movimentações financeiras do cliente.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                Ver completo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-zinc-100">
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 8).map((t) => (
                    <TableRow key={t.id} className="group hover:bg-zinc-50 border-zinc-50">
                      <TableCell className="text-zinc-500 font-medium text-xs">
                        {format(new Date(t.date), "dd MMM yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-zinc-700">{t.description}</span>
                      </TableCell>
                      <TableCell>
                        {t.category ? (
                          <Badge variant="outline" className="text-zinc-500 border-zinc-200 bg-white font-normal">
                             <span 
                               className="w-1.5 h-1.5 rounded-full mr-1.5"
                               style={{ backgroundColor: t.category.color || '#9ca3af' }}
                             />
                             {t.category.name}
                          </Badge>
                        ) : (
                          <span className="text-zinc-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold whitespace-nowrap",
                          t.type === 'EXPENSE' ? "text-red-600" : "text-emerald-600"
                        )}>
                          {t.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(t.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-zinc-400">
                           <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                           <p>Nenhuma transação recente encontrada.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
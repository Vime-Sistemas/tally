import { useEffect, useState } from "react";
import { Card, CardContent} from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  CreditCard as CreditCardIcon,
  Calendar,
  TrendingUp,
  Bell
} from "lucide-react";
import { accountService } from "@/services/accounts";
import { transactionService } from "@/services/transactions";
import { getCards } from "@/services/api";
import { type Account, type CreditCard } from "@/types/account";
import { TransactionCategory, type Transaction } from "@/types/transaction";
import { format, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { formatCurrency } from "@/utils/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Helper to parse UTC date string as local date (ignoring time)
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

export function MobileSummary() {
  const { user } = useUser();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accData, txData, cardsData] = await Promise.all([
          accountService.getAll(),
          transactionService.getAll(),
          getCards()
        ]);
        setAccounts(accData);
        setTransactions(txData);
        setCards(cardsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- Calculations ---
  const currentDate = new Date();

  // 1. Cards Data
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const currentMonthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), currentDate));

  const currentIncome = currentMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = currentMonthTxs.filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT).reduce((sum, t) => sum + t.amount, 0);
  
  const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;

  // 2. Cash Flow Chart (Last 6 months)
  const cashFlowData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentDate, i);
    const monthTxs = transactions.filter(t => isSameMonth(parseUTCDate(t.date), date));
    return {
      month: format(date, 'MMM', { locale: ptBR }),
      income: monthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTxs.filter(t => t.type === 'EXPENSE' && t.category !== TransactionCategory.INVESTMENT).reduce((sum, t) => sum + t.amount, 0),
      date: date // for sorting
    };
  }).reverse();

  // 7. Upcoming Bills (Next 7 days)
  const upcomingBills = transactions
    .filter(t => {
      const date = parseUTCDate(t.date);
      const diffTime = date.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return t.type === 'EXPENSE' && diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // 8. Credit Card Usage
  const cardUsageData = cards.map(card => ({
    name: card.name,
    used: card.limitUsed || 0,
    available: card.limit - (card.limitUsed || 0),
    limit: card.limit
  }));

  // 10. Recent Transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const displayName = user?.name?.split(' ')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-zinc-200">
            <AvatarImage src={user?.picture} />
            <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-zinc-500 font-medium">{getGreeting()},</p>
            <h1 className="text-sm font-bold text-zinc-900">{displayName}</h1>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
          <Bell className="h-5 w-5" />
        </Button>
      </header>

      <div className="p-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Main Balance Card - Apple Wallet Style */}
        <div className="relative overflow-hidden rounded-3xl bg-blue-400 p-6 text-white shadow-xl shadow-blue-200 transition-transform active:scale-[0.98]">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-black/10 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full gap-6">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium tracking-wide">Saldo Total</span>
              <Wallet className="h-5 w-5 text-white" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(totalBalance)}</h2>
              <p className="text-white text-xs mt-1 font-medium">Disponível em contas</p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <TrendingUp className="h-3 w-3 text-emerald-300" />
              <span className="text-xs font-medium text-white">
                {savingsRate > 0 ? `+${savingsRate.toFixed(0)}% economia` : '0% economia'}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Summary - Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-zinc-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Entradas</p>
                <p className="text-lg font-bold text-zinc-900">{formatCurrency(currentIncome)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Saídas</p>
                <p className="text-lg font-bold text-zinc-900">{formatCurrency(currentExpense)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-zinc-900">Fluxo Financeiro</h3>
            <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 hover:bg-zinc-200 font-normal text-[10px]">6 meses</Badge>
          </div>
          <Card className="border-zinc-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-0 pt-6 pb-2">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#a1a1aa' }} 
                      dy={10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      fillOpacity={0} 
                      fill="transparent" 
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-zinc-900">Próximos Vencimentos</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="min-w-[200px] bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-orange-100 text-orange-700 bg-orange-50">
                      {format(parseUTCDate(bill.date), "dd MMM", { locale: ptBR })}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 truncate">{bill.description}</p>
                    <p className="text-lg font-bold text-zinc-900">{formatCurrency(bill.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Cards */}
        {cardUsageData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-zinc-900">Cartões de Crédito</h3>
            </div>
            <div className="space-y-3">
              {cardUsageData.map((card) => {
                const percentage = Math.min((card.used / card.limit) * 100, 100);
                return (
                  <div key={card.name} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center">
                          <CreditCardIcon className="h-4 w-4 text-zinc-600" />
                        </div>
                        <span className="font-medium text-sm text-zinc-900">{card.name}</span>
                      </div>
                      <span className="text-xs font-medium text-zinc-500">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-zinc-100" indicatorClassName="bg-zinc-900" />
                    <div className="flex justify-between mt-2 text-xs text-zinc-500">
                      <span>{formatCurrency(card.used)}</span>
                      <span>Disp: {formatCurrency(card.available)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-zinc-900">Últimas Movimentações</h3>
          </div>
          <Card className="border-zinc-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-50">
                {recentTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        t.type === 'INCOME' ? 'bg-blue-50' : 'bg-zinc-100'
                      }`}>
                        {t.type === 'INCOME' ? (
                          <ArrowUpRight className="h-5 w-5 text-blue-600" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 line-clamp-1">{t.description}</p>
                        <p className="text-xs text-zinc-500 capitalize">
                          {format(parseUTCDate(t.date), "dd 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold whitespace-nowrap ${
                      t.type === 'INCOME' ? 'text-blue-600' : 'text-zinc-900'
                    }`}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

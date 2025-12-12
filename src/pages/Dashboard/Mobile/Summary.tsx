import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  AlertTriangle, 
  CreditCard as CreditCardIcon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { accountService } from "../../../services/accounts";
import { transactionService } from "../../../services/transactions";
import { getCards } from "../../../services/api";
import { type Account, type CreditCard } from "../../../types/account";
import { TransactionCategory, type Transaction } from "../../../types/transaction";
import { format, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth0 } from "@auth0/auth0-react";

// Helper to parse UTC date string as local date (ignoring time)
const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const chartConfig = {
  income: {
    label: "Receitas",
    color: "#009FE3", // brand blue
  },
  expense: {
    label: "Despesas",
    color: "#ef4444", // red-500
  },
};

export function MobileSummary() {
  const { user: auth0User } = useAuth0();
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
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
    .slice(0, 3);

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

  const displayName = auth0User?.name || 'Usuário';

  return (
    <div className="w-full p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Olá, {displayName}</h2>
        <p className="text-sm text-muted-foreground">Aqui está o resumo das suas finanças.</p>
      </div>

      {/* Main Balance Card */}
      <Card className="bg-blue-400 text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white">Saldo Total</span>
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div className="text-3xl font-bold mb-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
          </div>
          <div className="flex gap-4 text-xs text-white">
            <span className="text-sm font-medium text-white">Movimentações</span>
            <div className="flex items-center gap-1">
              <ArrowUpCircle className="h-3 w-3 text-white" />
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentIncome)}</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDownCircle className="h-3 w-3 text-white" />
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentExpense)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {upcomingBills.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Atenção</h3>
          {upcomingBills.map(bill => (
            <Alert key={bill.id} className="bg-blue-50 border-blue-100">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 text-sm">Conta a vencer</AlertTitle>
              <AlertDescription className="text-blue-700 text-xs">
                {bill.description} - R$ {bill.amount.toFixed(2)} <br/>
                Vence em {format(parseUTCDate(bill.date), "dd/MM")}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Simplified Cash Flow Chart */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Fluxo de Caixa</h3>
        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-0 pt-4">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  dataKey="expense"
                  type="natural"
                  fill="url(#fillExpense)"
                  fillOpacity={0.4}
                  stroke="var(--color-expense)"
                  stackId="a"
                />
                <Area
                  dataKey="income"
                  type="natural"
                  fill="url(#fillIncome)"
                  fillOpacity={0.4}
                  stroke="var(--color-income)"
                  stackId="b"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards */}
      {cardUsageData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cartões</h3>
          <div className="space-y-3">
            {cardUsageData.map((card) => (
              <Card key={card.name} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{card.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((card.used / card.limit) * 100)}% usado
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-blue-300 transition-all duration-500"
                      style={{ width: `${Math.min((card.used / card.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ {card.used.toFixed(2)}</span>
                    <span>Disp: R$ {card.available.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Últimas Transações</h3>
        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-[#009FE3]/10 text-[#009FE3]' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'INCOME' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{format(parseUTCDate(t.date), "dd 'de' MMM", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium whitespace-nowrap ${t.type === 'INCOME' ? 'text-[#009FE3]' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

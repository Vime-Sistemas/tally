import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TransactionType, TransactionCategory } from "../../types/transaction";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "../../lib/utils";

// Mock data
const transactions = [
  {
    id: '1',
    type: TransactionType.EXPENSE,
    category: TransactionCategory.FOOD,
    amount: 45.90,
    description: 'Almoço',
    date: '2025-12-08',
  },
  {
    id: '2',
    type: TransactionType.INCOME,
    category: TransactionCategory.FREELANCE,
    amount: 1500.00,
    description: 'Projeto Website',
    date: '2025-12-07',
  },
  {
    id: '3',
    type: TransactionType.EXPENSE,
    category: TransactionCategory.TRANSPORT,
    amount: 22.50,
    description: 'Uber',
    date: '2025-12-07',
  },
   {
    id: '4',
    type: TransactionType.EXPENSE,
    category: TransactionCategory.SHOPPING,
    amount: 250.00,
    description: 'Roupas',
    date: '2025-12-05',
  },
];

export function TransactionHistory() {
  return (
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-black">Histórico de Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  transaction.type === TransactionType.INCOME ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {transaction.type === TransactionType.INCOME ? <ArrowUpCircle className="h-6 w-6" /> : <ArrowDownCircle className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className={cn(
                "font-semibold text-lg",
                transaction.type === TransactionType.INCOME ? "text-green-600" : "text-red-600"
              )}>
                {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

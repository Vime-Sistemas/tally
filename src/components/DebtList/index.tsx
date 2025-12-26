import { useEffect, useState } from 'react';
import { 
  Receipt, Edit, Trash2, Calendar, User, Percent, CheckCircle2, AlertCircle, XCircle, Wallet
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner';
import { getDebts, deleteDebt, type Debt } from '../../services/api';
import { EditDebtDialog } from '../EditDebtDialog';
import { PayDebtDialog } from '../PayDebtDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { cn } from '../../lib/utils';

export function DebtList() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [payingDebt, setPayDebt] = useState<Debt | null>(null);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const data = await getDebts();
      setDebts(data);
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
      toast.error('Erro ao carregar dívidas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDebt(id);
      toast.success('Dívida excluída com sucesso!');
      loadDebts();
    } catch (error) {
      console.error('Erro ao excluir dívida:', error);
      toast.error('Erro ao excluir dívida');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Em Aberto', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: AlertCircle };
      case 'PAID':
        return { label: 'Quitada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle2 };
      case 'CANCELLED':
        return { label: 'Cancelada', bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200', icon: XCircle };
      default:
        return { label: status, bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: AlertCircle };
    }
  };

  // Cálculo do total para o header
  const totalDebt = debts
    .filter(d => d.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.remainingAmount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 p-8 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Carregando dívidas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-8xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Dívidas</h1>
            <p className="text-zinc-500 mt-1">Controle seus pagamentos e quite seus débitos.</p>
          </div>
          
          <div className="flex items-center gap-4">
             {totalDebt > 0 && (
                <div className="hidden md:block text-right mr-4">
                   <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total a Pagar</p>
                   <p className="text-xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                </div>
             )}
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200 text-zinc-400">
            <div className="p-4 bg-zinc-50 rounded-full mb-4">
               <Receipt className="h-8 w-8 text-zinc-300" />
            </div>
            <p className="font-medium text-zinc-600">Nenhuma dívida cadastrada</p>
            <p className="text-sm">Parabéns! Ou comece adicionando uma agora.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {debts.map((debt) => {
              const status = getStatusConfig(debt.status);
              const StatusIcon = status.icon;
              const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
              const isPaid = debt.status === 'PAID';

              return (
                <Card 
                  key={debt.id} 
                  className={cn(
                    "group border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between h-full",
                    isPaid ? "bg-white" : "bg-white"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl", isPaid ? "bg-emerald-100 text-emerald-600" : "bg-red-50 text-red-600")}>
                           <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                           <CardTitle className="text-base font-bold text-zinc-900 line-clamp-1" title={debt.name}>
                              {debt.name}
                           </CardTitle>
                           <div className="flex items-center gap-1.5 mt-1">
                              {debt.creditor && (
                                 <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <User className="w-3 h-3" /> {debt.creditor}
                                 </span>
                              )}
                           </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide font-bold px-2 py-0.5", status.bg, status.text, status.border)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                       <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Valor Restante</p>
                       <p className={cn("text-3xl font-bold tracking-tight", isPaid ? "text-emerald-600" : "text-zinc-900")}>
                          {formatCurrency(debt.remainingAmount)}
                       </p>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs text-zinc-500">
                          <span>Pago: {Math.round(progress)}%</span>
                          <span>Total: {formatCurrency(debt.totalAmount)}</span>
                       </div>
                       <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                             className={cn("h-full rounded-full transition-all duration-1000 ease-out", isPaid ? "bg-emerald-500" : "bg-red-500")}
                             style={{ width: `${progress}%` }} 
                          />
                       </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                       <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                          <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                             <Calendar className="w-3.5 h-3.5" />
                             <span className="text-[10px] uppercase font-bold">Vencimento</span>
                          </div>
                          <p className="text-sm font-medium text-zinc-700">
                             {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : '-'}
                          </p>
                       </div>
                       <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                          <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                             <Percent className="w-3.5 h-3.5" />
                             <span className="text-[10px] uppercase font-bold">Juros</span>
                          </div>
                          <p className="text-sm font-medium text-zinc-700">
                             {debt.interestRate ? `${debt.interestRate}% a.a.` : 'Não Informado'}
                          </p>
                       </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t border-zinc-100 bg-zinc-50/30 flex gap-2 justify-end">
                     {debt.status === 'ACTIVE' && (
                        <Button 
                           size="sm" 
                           className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 shadow-sm mr-auto"
                           onClick={() => setPayDebt(debt)}
                        >
                           <Wallet className="w-3.5 h-3.5 mr-1.5" />
                           Amortizar
                        </Button>
                     )}
                     
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        onClick={() => setEditingDebt(debt)}
                     >
                        <Edit className="w-4 h-4" />
                     </Button>

                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                           >
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                           <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Dívida?</AlertDialogTitle>
                              <AlertDialogDescription>
                                 Tem certeza que deseja apagar o registro de "{debt.name}"?
                              </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                 onClick={() => handleDelete(debt.id)}
                                 className="bg-red-600 hover:bg-red-700 rounded-xl"
                              >
                                 Excluir
                              </AlertDialogAction>
                           </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialogs */}
        <EditDebtDialog
          debt={editingDebt}
          open={!!editingDebt}
          onOpenChange={(open) => !open && setEditingDebt(null)}
          onSuccess={loadDebts}
        />
        <PayDebtDialog
          debt={payingDebt}
          open={!!payingDebt}
          onOpenChange={(open) => !open && setPayDebt(null)}
          onSuccess={loadDebts}
        />
      </div>
    </div>
  );
}
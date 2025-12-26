import { useEffect, useState } from 'react';
import { Receipt, Edit, Trash2, Calendar, User, Percent, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-100 text-red-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativa';
      case 'PAID':
        return 'Paga';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="border-zinc-200">
        <CardContent className="p-6">
          <div className="text-center text-zinc-500">Carregando dívidas...</div>
        </CardContent>
      </Card>
    );
  }

  if (debts.length === 0) {
    return (
      <Card className="border-zinc-200">
        <CardContent className="p-6">
          <div className="text-center text-zinc-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma dívida cadastrada ainda.</p>
            <p className="text-sm">Adicione sua primeira dívida para começar a acompanhar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {debts.map((debt) => (
        <Card key={debt.id} className="border-zinc-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-zinc-600" />
                <CardTitle className="text-lg text-zinc-900">{debt.name}</CardTitle>
                <Badge className={getStatusColor(debt.status)}>
                  {getStatusLabel(debt.status)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-zinc-600 hover:text-green-600"
                  onClick={() => setPayDebt(debt)}
                  disabled={debt.status === 'PAID'}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-zinc-600 hover:text-black"
                  onClick={() => setEditingDebt(debt)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-zinc-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Dívida</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a dívida "{debt.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(debt.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Valor Total</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {formatCurrency(debt.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Valor Restante</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {formatCurrency(debt.remainingAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Progresso</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full"
                      style={{
                        width: `${((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-zinc-600">
                    {Math.round(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
              {debt.creditor && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <User className="h-4 w-4" />
                  <span>Credor: {debt.creditor}</span>
                </div>
              )}
              {debt.dueDate && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Calendar className="h-4 w-4" />
                  <span>Vence em: {new Date(debt.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {debt.interestRate && debt.interestRate > 0 && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Percent className="h-4 w-4" />
                  <span>Juros: {debt.interestRate}% a.a.</span>
                </div>
              )}
            </div>

            {debt.description && (
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-sm text-zinc-600">{debt.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
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
  );
}
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { type Transaction, TransactionType } from "../../../types/transaction";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Calendar, CreditCard, Tag } from "lucide-react";
import { cn } from "../../../lib/utils";

interface TransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function MobileTransactionDialog({ 
  transaction, 
  open, 
  onOpenChange,
  onEdit,
  onDelete 
}: TransactionDialogProps) {
  if (!transaction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pt-6 pb-24">
        <SheetHeader className="text-left space-y-4">
          <div className="space-y-1">
            <SheetTitle className="text-xl">{transaction.description}</SheetTitle>
            <SheetDescription>Detalhes da transação</SheetDescription>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">R$</span>
            <span className={cn(
              "text-4xl font-bold",
              transaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"
            )}>
              {Math.abs(transaction.amount).toFixed(2)}
            </span>
          </div>
        </SheetHeader>

        <div className="py-8 space-y-6">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Data</p>
              <p className="font-medium">
                {format(new Date(transaction.date.substring(0, 10) + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Categoria</p>
              <p className="font-medium">{transaction.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Conta / Cartão</p>
              <p className="font-medium">
                {transaction.cardId ? "Cartão de Crédito" : "Conta Corrente"}
              </p>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1 gap-2 h-12 rounded-xl"
            onClick={() => {
              onOpenChange(false);
              onEdit(transaction);
            }}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1 gap-2 h-12 rounded-xl"
            onClick={() => {
              onOpenChange(false);
              onDelete(transaction);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

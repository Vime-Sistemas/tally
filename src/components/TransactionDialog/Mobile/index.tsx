import {
  Drawer,
  DrawerContent,
} from "../../ui/drawer";
import { Button } from "../../ui/button";
import { type Transaction, TransactionType } from "../../../types/transaction";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, CreditCard, Tag, Layers } from "lucide-react";
import { cn } from "../../../lib/utils";
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from "../../TransactionHistory/Mobile";

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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[32px] p-0 bg-white border-none">
        <div className="px-6 pb-8">
          {/* Header - Centered */}
          <div className="flex flex-col items-center text-center py-6">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center mb-4",
              getCategoryColor(transaction.category)
            )}>
              <div className="scale-125">
                {getCategoryIcon(transaction.category)}
              </div>
            </div>
            
            <p className="text-gray-500 text-sm mb-1">{transaction.description}</p>
            
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg text-gray-400">R$</span>
              <span className={cn(
                "text-4xl font-semibold",
                transaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-gray-900"
              )}>
                {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
              {format(new Date(transaction.date.substring(0, 10) + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Details List */}
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 mb-6">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Categoria</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {getCategoryLabel(transaction.category)}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Conta / Cartão</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {transaction.cardId ? "Cartão de Crédito" : "Conta Corrente"}
              </span>
            </div>
            
            {transaction.installments && (
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Parcelas</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {transaction.currentInstallment}/{transaction.installments}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50"
              onClick={() => {
                onOpenChange(false);
                onEdit(transaction);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12 rounded-xl"
              onClick={() => {
                onOpenChange(false);
                onDelete(transaction);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

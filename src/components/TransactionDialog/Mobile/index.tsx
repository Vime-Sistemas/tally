import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "../../ui/drawer";
import { Button } from "../../ui/button";
import { type Transaction, TransactionType } from "../../../types/transaction";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, CreditCard, Tag, Layers } from "lucide-react";
import { cn } from "../../../lib/utils";
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from "../../TransactionHistory/Mobile";
import { formatCurrencyValue } from "../../../utils/formatters";
import type { Category } from "../../../services/categoryService";
import { 
  Coffee, Car, Home, Zap, Heart, ShoppingBag, Shirt, Gamepad2, GraduationCap, Briefcase,
  DollarSign, TrendingUp, ArrowRightLeft, PiggyBank, Coins, Banknote, Wallet, Building2, Globe,
  Repeat, Landmark, Receipt, PawPrint, Gift, Plane, Shield, Percent, Key, MapPin, Users
} from "lucide-react";

interface TransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  userCategories: Category[];
}

const ICON_COMPONENTS: Record<string, any> = {
  Coffee, Car, Home, Zap, Heart, ShoppingBag, Shirt, Gamepad2, GraduationCap, Briefcase,
  DollarSign, TrendingUp, ArrowRightLeft, PiggyBank, Coins, Banknote, Wallet, Building2, Globe,
  Repeat, Landmark, Receipt, PawPrint, Gift, Plane, Shield, Percent, Key, MapPin, Users
};

export function MobileTransactionDialog({ 
  transaction, 
  open, 
  onOpenChange,
  onEdit,
  onDelete,
  userCategories
}: TransactionDialogProps) {
  if (!transaction) return null;

  const renderCategoryIcon = () => {
    const userCat = userCategories.find(c => c.name === transaction.category || c.id === transaction.category);
    if (userCat && userCat.icon && ICON_COMPONENTS[userCat.icon]) {
      const Icon = ICON_COMPONENTS[userCat.icon];
      return <Icon className="h-4 w-4" />;
    }
    return getCategoryIcon(userCat ? userCat.name : transaction.category);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} snapPoints={[0.6, 0.95]}>
      <DrawerContent className="mt-0 rounded-t-[32px] p-0 bg-white border-none max-h-[150vh]">
        <DrawerTitle className="sr-only">Detalhes da Transação</DrawerTitle>
        <DrawerDescription className="sr-only">Detalhes da transação selecionada</DrawerDescription>
        <div className="px-6 pb-64 h-full overflow-y-auto">
          {/* Header - Centered */}
          <div className="flex flex-col items-center text-center py-6">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center mb-4",
              getCategoryColor()
            )}>
              <div className="scale-125">
                {renderCategoryIcon()}
              </div>
            </div>
            
            <p className="text-zinc-500 text-sm mb-1">{transaction.description}</p>
            
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg text-zinc-400">R$</span>
              <span className={cn(
                "text-4xl font-semibold",
                transaction.type === TransactionType.INCOME ? "text-blue-400" : "text-zinc-900"
              )}>
                {formatCurrencyValue(Math.abs(transaction.amount))}
              </span>
            </div>
            
            <p className="text-xs text-zinc-400 mt-2">
              {format(new Date(transaction.date.substring(0, 10) + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Details List */}
          <div className="bg-zinc-50 rounded-2xl divide-y divide-zinc-100 mb-6">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600">Categoria</span>
              </div>
              <span className="text-sm font-medium text-zinc-900">
                {getCategoryLabel(transaction.category)}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600">Conta / Cartão</span>
              </div>
              <span className="text-sm font-medium text-zinc-900">
                {transaction.cardId ? "Cartão de Crédito" : "Conta Corrente"}
              </span>
            </div>
            
            {transaction.installments && (
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600">Parcelas</span>
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {transaction.currentInstallment}/{transaction.installments}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 bg-blue-400 text-white"
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

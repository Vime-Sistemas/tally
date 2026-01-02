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
import { getCategoryIcon, getCategoryLabel } from "../../TransactionHistory/Mobile";
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

  const category = userCategories.find(c => c.name === transaction.category || c.id === transaction.category);

  const renderCategoryIcon = () => {
    if (category && category.icon && ICON_COMPONENTS[category.icon]) {
      const Icon = ICON_COMPONENTS[category.icon];
      return <Icon className="h-8 w-8 text-white" />;
    }
    
    // Clone the default icon to change its props
    const defaultIcon = getCategoryIcon(transaction.category);
    // @ts-ignore
    return <defaultIcon.type {...defaultIcon.props} className="h-8 w-8 text-white" />;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mt-0 rounded-t-[50px] p-0 bg-white border-none max-h-[150vh]">
        <DrawerTitle className="sr-only">Detalhes da Transação</DrawerTitle>
        <DrawerDescription className="sr-only">Detalhes da transação selecionada</DrawerDescription>
        
        <div className="px-6 pb-32 h-full overflow-y-auto">
          {/* Header - Fixed/Non-scrollable part for better dragging */}
          <div className="flex flex-col items-center text-center pt-8 pb-6 px-6 shrink-0">
            <div 
              className="h-20 w-20 rounded-[24px] flex items-center justify-center mb-6 shadow-sm"
              style={{ backgroundColor: category?.color || '#60a5fa' }}
            >
              {renderCategoryIcon()}
            </div>
            
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                {format(new Date(transaction.date.substring(0, 10) + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}
              </span>
              <p className="text-zinc-900 font-semibold text-lg">{transaction.description}</p>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-2xl text-zinc-400 font-medium">R$</span>
              <span className={cn(
                "text-5xl font-bold tracking-tighter",
                transaction.type === TransactionType.INCOME ? "text-blue-500" : "text-zinc-900"
              )}>
                {formatCurrencyValue(Math.abs(transaction.amount))}
              </span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {/* Details List */}
            <div className="bg-zinc-50/80 backdrop-blur-sm rounded-3xl border border-zinc-100/50 overflow-hidden mb-8">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-zinc-100">
                    <Tag className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-sm text-zinc-600 font-medium">Categoria</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900">
                  {category?.name || getCategoryLabel(transaction.category)}
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-zinc-100">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-sm text-zinc-600 font-medium">Conta / Cartão</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900">
                  {transaction.cardId ? "Cartão de Crédito" : "Conta Corrente"}
                </span>
              </div>
              
              {transaction.installments && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-zinc-100">
                      <Layers className="h-4 w-4 text-zinc-400" />
                    </div>
                    <span className="text-sm text-zinc-600 font-medium">Parcelas</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">
                    {transaction.currentInstallment}/{transaction.installments}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-900 font-medium transition-all"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(transaction);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="ghost" 
                className="h-14 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium transition-all"
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}

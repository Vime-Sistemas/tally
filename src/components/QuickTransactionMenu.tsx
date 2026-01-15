import { useMemo } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle, PiggyBank, PlusCircle } from "lucide-react";
import { cn } from "../lib/utils";
import type { Page } from "../types/navigation";
import { TransactionType } from "../types/transaction";
import { useUser } from "../contexts/UserContext";

export const TRANSACTION_INTENT_KEY = "transaction_intent";

export type TransactionIntent = {
  tab: "TRANSACTION" | "TRANSFER" | "INVESTMENT";
  type?: TransactionType;
};

interface QuickTransactionMenuProps {
  onNavigate: (page: Page) => void;
  collapsed?: boolean;
  variant?: "sidebar" | "header";
}

export function QuickTransactionMenu({ onNavigate, collapsed = false, variant = "sidebar" }: QuickTransactionMenuProps) {
  const { user } = useUser();
  const isPlanner = user?.type === "PLANNER";

  const accent = useMemo(() => ({
    bg: isPlanner ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600",
    text: isPlanner ? "text-emerald-600" : "text-blue-600",
  }), [isPlanner]);

  const handleIntent = (intent: TransactionIntent) => {
    sessionStorage.setItem(TRANSACTION_INTENT_KEY, JSON.stringify(intent));
    onNavigate("transactions-new");
  };

  const menuSide = variant === "header" ? "bottom" : "right";
  const menuAlign = variant === "header" ? "end" : "start";
  const menuOffset = variant === "header" ? 10 : 12;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            "group shadow-sm transition-all duration-200 text-white",
            collapsed
              ? cn("h-10 w-10 p-0 rounded-full", accent.bg)
              : variant === "header"
                ? cn("h-10 px-4 rounded-full font-semibold", accent.bg)
                : cn("w-full justify-between h-11 rounded-2xl px-3 text-white", accent.bg)
          )}
        >
          <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>            
            <PlusCircle className="h-4 w-4" />
            {!collapsed && <span>Nova</span>}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side={menuSide}
        align={menuAlign}
        sideOffset={menuOffset}
        className="w-56 rounded-2xl border-zinc-100 bg-white shadow-xl z-50"
      >
        <DropdownMenuLabel className="text-sm text-zinc-900">Nova movimentação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={() => handleIntent({ tab: "TRANSACTION", type: TransactionType.EXPENSE })}>
          <ArrowDownCircle className={cn("h-4 w-4", accent.text)} />
          <span>Despesa</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => handleIntent({ tab: "TRANSACTION", type: TransactionType.INCOME })}>
          <ArrowUpCircle className={cn("h-4 w-4", accent.text)} />
          <span>Receita</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => handleIntent({ tab: "TRANSFER" })}>
          <ArrowRightLeft className={cn("h-4 w-4", accent.text)} />
          <span>Transferência</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => handleIntent({ tab: "INVESTMENT" })}>
          <PiggyBank className={cn("h-4 w-4", accent.text)} />
          <span>Aplicação</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

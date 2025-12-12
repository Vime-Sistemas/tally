import { Home, List, PlusCircle, User, Wallet } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Page } from "../../../types/navigation";

interface MobileHeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export function MobileHeader({ onNavigate, currentPage }: MobileHeaderProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 pb-safe md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-16 px-2 pb-2 pt-1">
        <button
          onClick={() => onNavigate('dashboard-summary')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            currentPage === 'dashboard-summary' ? "text-black" : "text-gray-400"
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Início</span>
        </button>

        <button
          onClick={() => onNavigate('transactions-history')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            currentPage === 'transactions-history' ? "text-black" : "text-gray-400"
          )}
        >
          <List className="w-6 h-6" />
          <span className="text-[10px] font-medium">Extrato</span>
        </button>

        <button
          onClick={() => onNavigate('transactions-new')}
          className="flex flex-col items-center justify-center w-full h-full -mt-6"
        >
          <div className="bg-blue-400 text-white rounded-full p-3 shadow-lg">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium mt-1">Novo</span>
        </button>

        <button
          onClick={() => onNavigate('accounts-list')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            currentPage === 'accounts-list' ? "text-black" : "text-gray-400"
          )}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Contas</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            currentPage === 'profile' ? "text-black" : "text-gray-400"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { TransactionForm } from '../../components/TransactionForm';
import { TransferForm } from '../../components/TransferForm';
import { InvestmentForm } from '../../components/InvestmentForm';
import { MobileTransactionForm } from '../../components/TransactionForm/Mobile';
import { MobileTransferForm } from '../../components/TransferForm/Mobile';
import { MobileInvestmentForm } from '../../components/InvestmentForm/Mobile';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { List } from 'lucide-react';
import { Kbd } from '../../components/ui/kbd';
import type { Page } from '../../types/navigation';

type Tab = 'TRANSACTION' | 'TRANSFER' | 'INVESTMENT';

interface TransactionsProps {
  onNavigate?: (page: Page) => void;
}

export function Transactions({ onNavigate }: TransactionsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('TRANSACTION');
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('TRANSACTION');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('TRANSFER');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('INVESTMENT');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn("p-4 md:p-8", isMobile && "p-4 pt-2")}>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        {!isMobile && (
          <div className="mb-8 text-center relative">
            {onNavigate && (
              <Button 
                className="absolute right-0 top-0 hidden md:flex bg-blue-400 hover:bg-blue-500 text-white"
                onClick={() => onNavigate('transactions-history')}
              >
                <List className="mr-2 h-4 w-4" />
                Ver Histórico
              </Button>
            )}
            <h1 className="text-3xl font-bold text-black mb-2 tracking-tight">Nova Movimentação</h1>
            <p className="text-gray-500">Registre suas transações, transferências e aplicações</p>
            
            {onNavigate && (
              <Button 
                variant="outline" 
                className="mt-4 md:hidden w-full"
                onClick={() => onNavigate('transactions-history')}
              >
                <List className="mr-2 h-4 w-4" />
                Ver Histórico
              </Button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className={cn("flex justify-center mb-6", isMobile && "mb-4")}>
          <div className={cn("inline-flex bg-gray-100 p-1 rounded-xl", isMobile && "w-full grid grid-cols-3")}>
            <button
              onClick={() => setActiveTab('TRANSACTION')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2",
                activeTab === 'TRANSACTION'
                  ? "bg-blue-400 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <span className={cn(isMobile && "text-xs")}>Transação</span>
              {!isMobile && activeTab !== 'TRANSACTION' && <Kbd className="bg-blue-300 text-white">Alt+1</Kbd>}
            </button>
            <button
              onClick={() => setActiveTab('TRANSFER')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2",
                activeTab === 'TRANSFER'
                  ? "bg-blue-400 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <span className={cn(isMobile && "text-xs")}>Transferência</span>
              {!isMobile && activeTab !== 'TRANSFER' && <Kbd className="bg-blue-300 text-white">Alt+2</Kbd>}
            </button>
            <button
              onClick={() => setActiveTab('INVESTMENT')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2",
                activeTab === 'INVESTMENT'
                  ? "bg-blue-400 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <span className={cn(isMobile && "text-xs")}>Aplicação</span>
              {!isMobile && activeTab !== 'INVESTMENT' && <Kbd className="bg-blue-300 text-white">Alt+3</Kbd>}
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'TRANSACTION' && (isMobile ? <MobileTransactionForm /> : <TransactionForm />)}
          {activeTab === 'TRANSFER' && (isMobile ? <MobileTransferForm /> : <TransferForm />)}
          {activeTab === 'INVESTMENT' && (isMobile ? <MobileInvestmentForm /> : <InvestmentForm />)}
        </div>
      </div>
    </div>
  );
}

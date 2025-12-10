import { useState } from 'react';
import { TransactionForm } from '../../components/TransactionForm';
import { TransferForm } from '../../components/TransferForm';
import { InvestmentForm } from '../../components/InvestmentForm';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { List } from 'lucide-react';
import type { Page } from '../../types/navigation';

type Tab = 'TRANSACTION' | 'TRANSFER' | 'INVESTMENT';

interface TransactionsProps {
  onNavigate?: (page: Page) => void;
}

export function Transactions({ onNavigate }: TransactionsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('TRANSACTION');

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center relative">
          {onNavigate && (
            <Button 
              variant="ghost" 
              className="absolute right-0 top-0 hidden md:flex"
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

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('TRANSACTION')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === 'TRANSACTION'
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Transação
            </button>
            <button
              onClick={() => setActiveTab('TRANSFER')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === 'TRANSFER'
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Transferência
            </button>
            <button
              onClick={() => setActiveTab('INVESTMENT')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === 'INVESTMENT'
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Aplicação
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'TRANSACTION' && <TransactionForm />}
          {activeTab === 'TRANSFER' && <TransferForm />}
          {activeTab === 'INVESTMENT' && <InvestmentForm />}
        </div>
      </div>
    </div>
  );
}

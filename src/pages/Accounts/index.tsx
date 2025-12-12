import { useState } from 'react';
import { AccountForm } from '../../components/AccountForm';
import { CardForm } from '../../components/CardForm';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { List } from 'lucide-react';
import type { Page } from '../../types/navigation';

type Tab = 'ACCOUNT' | 'CARD';

interface AccountsProps {
  onNavigate?: (page: Page) => void;
}

export function Accounts({ onNavigate }: AccountsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ACCOUNT');

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center relative">
          {onNavigate && (
            <Button 
              variant="ghost" 
              className="absolute right-0 top-0 hidden md:flex"
              onClick={() => onNavigate('accounts-list')}
            >
              <List className="mr-2 h-4 w-4" />
              Ver Contas
            </Button>
          )}
          <h1 className="text-3xl font-bold text-black mb-2 tracking-tight">Contas e Cartões</h1>
          <p className="text-gray-500">Gerencie suas contas bancárias e cartões de crédito</p>

          {onNavigate && (
            <Button 
              variant="outline" 
              className="mt-4 md:hidden w-full"
              onClick={() => onNavigate('accounts-list')}
            >
              <List className="mr-2 h-4 w-4" />
              Ver Contas
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ACCOUNT')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === 'ACCOUNT'
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Conta Bancária
            </button>
            <button
              onClick={() => setActiveTab('CARD')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === 'CARD'
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Cartão de Crédito
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'ACCOUNT' && <AccountForm />}
          {activeTab === 'CARD' && <CardForm />}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { AccountForm } from '../../components/AccountForm';
import { CardForm } from '../../components/CardForm';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { List, Wallet, CreditCard } from 'lucide-react';
import { Kbd } from '../../components/ui/kbd';
import type { Page } from '../../types/navigation';

type Tab = 'ACCOUNT' | 'CARD';

interface AccountsProps {
  onNavigate?: (page: Page) => void;
}

export function Accounts({ onNavigate }: AccountsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ACCOUNT');

  // Keyboard shortcut to switch tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.altKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('ACCOUNT'); }
        if (e.key === '2') { e.preventDefault(); setActiveTab('CARD'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Adicionar à Carteira</h1>
            <p className="text-zinc-500 text-sm">Cadastre uma nova conta ou cartão.</p>
          </div>
          {onNavigate && (
            <Button 
              variant="outline"
              className="gap-2 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200"
              onClick={() => onNavigate('accounts-list')}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Gerenciar Contas</span>
            </Button>
          )}
        </div>

        {/* Tabs (Segmented Control) */}
        <div className="bg-zinc-200/50 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveTab('ACCOUNT')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-2",
              activeTab === 'ACCOUNT'
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            )}
          >
            <Wallet className="w-4 h-4" />
            Conta Bancária
            {activeTab !== 'ACCOUNT' && <Kbd className="hidden md:inline-flex bg-transparent border-zinc-300 text-zinc-400 ml-2">Alt+1</Kbd>}
          </button>
          <button
            onClick={() => setActiveTab('CARD')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-2",
              activeTab === 'CARD'
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Cartão de Crédito
            {activeTab !== 'CARD' && <Kbd className="hidden md:inline-flex bg-transparent border-zinc-300 text-zinc-400 ml-2">Alt+2</Kbd>}
          </button>
        </div>
        
        {/* Form Container */}
        <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          {activeTab === 'ACCOUNT' && <AccountForm onSuccess={() => onNavigate?.('accounts-list')} />}
          {activeTab === 'CARD' && <CardForm onSuccess={() => onNavigate?.('accounts-list')} />}
        </div>
      </div>
    </div>
  );
}
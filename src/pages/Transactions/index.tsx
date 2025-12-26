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
import { List, ArrowRightLeft, TrendingUp, PiggyBank } from 'lucide-react';
import type { Page } from '../../types/navigation';

type Tab = 'TRANSACTION' | 'TRANSFER' | 'INVESTMENT';

interface TransactionsProps {
  onNavigate?: (page: Page) => void;
}

export function Transactions({ onNavigate }: TransactionsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('TRANSACTION');
  const isMobile = useIsMobile();

  // Atalhos de teclado (mantidos)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.altKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setActiveTab('TRANSACTION'); break;
          case '2': e.preventDefault(); setActiveTab('TRANSFER'); break;
          case '3': e.preventDefault(); setActiveTab('INVESTMENT'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Componente de Aba estilo Apple Segmented Control
  const TabButton = ({ id, label, icon: Icon, shortcut }: { id: Tab, label: string, icon: any, shortcut: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "relative flex-1 py-2 px-3 text-sm font-medium rounded-full transition-all duration-200 ease-out flex items-center justify-center gap-2",
        activeTab === id
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {!isMobile && activeTab === id && (
        <span className="hidden lg:inline-flex ml-2 text-[10px] text-zinc-400 border border-zinc-200 px-1 rounded bg-zinc-50">
          Alt+{shortcut}
        </span>
      )}
    </button>
  );

  return (
    <div className={cn("min-h-screen bg-zinc-50/50", isMobile ? "p-4" : "p-8")}>
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Header Compacto */}
        {!isMobile && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Nova Movimentação</h1>
              <p className="text-zinc-500 text-sm">O que vamos registrar hoje?</p>
            </div>
            {onNavigate && (
              <Button 
                variant="outline"
                className="gap-2 text-zinc-600 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50"
                onClick={() => onNavigate('transactions-history')}
              >
                <List className="h-4 w-4" />
                Histórico
              </Button>
            )}
          </div>
        )}

        {/* Abas (Segmented Control) */}
        <div className="bg-zinc-100/80 p-1.5 rounded-full flex gap-1 shadow-inner">
          <TabButton id="TRANSACTION" label="Transação" icon={TrendingUp} shortcut="1" />
          <TabButton id="TRANSFER" label="Transferência" icon={ArrowRightLeft} shortcut="2" />
          <TabButton id="INVESTMENT" label="Aplicação" icon={PiggyBank} shortcut="3" />
        </div>

        {/* Área do Formulário */}
        <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          {activeTab === 'TRANSACTION' && (isMobile ? <MobileTransactionForm /> : <TransactionForm />)}
          {activeTab === 'TRANSFER' && (isMobile ? <MobileTransferForm /> : <TransferForm />)}
          {activeTab === 'INVESTMENT' && (isMobile ? <MobileInvestmentForm /> : <InvestmentForm />)}
        </div>
      </div>
    </div>
  );
}
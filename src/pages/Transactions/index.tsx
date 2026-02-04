import { useState, useEffect, useCallback } from 'react';
import { TransactionForm } from '../../components/TransactionForm';
import { TransferForm } from '../../components/TransferForm';
import { InvestmentForm } from '../../components/InvestmentForm';
import { TransactionWizard, type WizardData } from '../../components/TransactionWizard';
import { MobileTransferForm } from '../../components/TransferForm/Mobile';
import { MobileInvestmentForm } from '../../components/InvestmentForm/Mobile';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { List, ArrowRightLeft, TrendingUp, PiggyBank } from 'lucide-react';
import type { Page } from '../../types/navigation';
import { TransactionType, type TransactionCategory } from '../../types/transaction';
import { TRANSACTION_INTENT_KEY, type TransactionIntent } from '../../components/QuickTransactionMenu';
import { createTransaction, confirmTransaction } from '../../services/api';
import { toast } from 'sonner';

type Tab = 'TRANSACTION' | 'TRANSFER' | 'INVESTMENT';
type IncomeExpenseType = typeof TransactionType.INCOME | typeof TransactionType.EXPENSE;

interface TransactionsProps {
  onNavigate?: (page: Page) => void;
}

export function Transactions({ onNavigate }: TransactionsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('TRANSACTION');
  const [prefilledType, setPrefilledType] = useState<IncomeExpenseType | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardIntent, setWizardIntent] = useState<TransactionIntent | undefined>();
  const isMobile = useIsMobile();

  useEffect(() => {
    const stored = sessionStorage.getItem(TRANSACTION_INTENT_KEY);
    if (!stored) return;
    try {
      const intent = JSON.parse(stored) as TransactionIntent;
      const validTab = intent.tab === 'TRANSACTION' || intent.tab === 'TRANSFER' || intent.tab === 'INVESTMENT';
      if (validTab) {
        setActiveTab(intent.tab);
        if (intent.tab === 'TRANSACTION' && intent.type && (intent.type === TransactionType.INCOME || intent.type === TransactionType.EXPENSE)) {
          setPrefilledType(intent.type);
          // On mobile, show wizard directly
          if (isMobile) {
            setWizardIntent(intent);
            setShowWizard(true);
          }
        } else {
          setPrefilledType(null);
        }
      }
    } catch (err) {
      console.error('Não foi possível ler o atalho de transação', err);
    } finally {
      sessionStorage.removeItem(TRANSACTION_INTENT_KEY);
    }
  }, [isMobile]);

  // Show wizard on mobile when tab is TRANSACTION
  useEffect(() => {
    if (isMobile && activeTab === 'TRANSACTION' && !showWizard) {
      setShowWizard(true);
    }
  }, [isMobile, activeTab, showWizard]);

  // Keyboard shortcuts (desktop only)
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

  // Handle wizard completion
  const handleWizardComplete = useCallback(async (data: WizardData) => {
    try {
      const payload = {
        type: data.type!,
        category: data.category as TransactionCategory,
        amount: data.amount!,
        description: data.description!,
        date: data.date!,
        accountId: data.accountId,
        cardId: data.cardId,
        equityId: data.category === 'INVESTMENT' ? data.equityId : undefined,
        installments: data.installments,
      };

      await createTransaction(payload);
      toast.success('Transação registrada com sucesso!');
      setShowWizard(false);
      setWizardIntent(undefined);
      
      // Navigate to history on success
      if (onNavigate) {
        onNavigate('transactions-history');
      }
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        // Handle insufficient balance - for now, confirm anyway
        try {
          await confirmTransaction({
            type: data.type!,
            category: data.category as TransactionCategory,
            amount: data.amount!,
            description: data.description!,
            date: data.date!,
            accountId: data.accountId,
            cardId: data.cardId,
            confirmNegativeBalance: true,
          });
          toast.success('Transação registrada com saldo negativo!');
          setShowWizard(false);
          if (onNavigate) {
            onNavigate('transactions-history');
          }
        } catch (confirmError) {
          console.error('Erro ao confirmar transação:', confirmError);
          toast.error('Erro ao registrar transação');
        }
      } else {
        console.error('Erro ao criar transação:', error);
        toast.error('Erro ao registrar transação');
      }
    }
  }, [onNavigate]);

  // Handle wizard cancel
  const handleWizardCancel = useCallback(() => {
    setShowWizard(false);
    setWizardIntent(undefined);
    if (onNavigate) {
      onNavigate('dashboard-summary');
    }
  }, [onNavigate]);

  // Tab Button component
  const TabButton = ({ id, label, icon: Icon, shortcut }: { id: Tab, label: string, icon: any, shortcut: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        if (isMobile && id === 'TRANSACTION') {
          setShowWizard(true);
        }
      }}
      className={cn(
        "relative flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 ease-out",
        isMobile 
          ? cn(
              "flex-none px-5 py-2.5 rounded-full border",
              activeTab === id
                ? "bg-blue-400 text-white border-blue-400 shadow-sm"
                : "bg-white text-zinc-600 border-zinc-200"
            )
          : cn(
              "flex-1 py-2 px-3 rounded-full",
              activeTab === id
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            )
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

  // Mobile: Show Wizard for transactions
  if (isMobile && showWizard && activeTab === 'TRANSACTION') {
    return (
      <TransactionWizard
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
        initialIntent={wizardIntent}
      />
    );
  }

  return (
    <div className={cn("min-h-screen bg-white", isMobile ? "p-4" : "p-8")}>
      <div className="mx-auto max-w-5xl space-y-6">
        
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
        <div className={cn(
          isMobile 
            ? "flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" 
            : "bg-zinc-100/80 p-1.5 rounded-full flex gap-1 shadow-inner"
        )}>
          <TabButton id="TRANSACTION" label="Transação" icon={TrendingUp} shortcut="1" />
          <TabButton id="TRANSFER" label="Transferência" icon={ArrowRightLeft} shortcut="2" />
          <TabButton id="INVESTMENT" label="Aplicação" icon={PiggyBank} shortcut="3" />
        </div>

        {/* Área do Formulário */}
        <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          {activeTab === 'TRANSACTION' && !isMobile && (
            <TransactionForm defaultType={prefilledType ?? undefined} />
          )}
          {activeTab === 'TRANSFER' && (isMobile ? <MobileTransferForm /> : <TransferForm />)}
          {activeTab === 'INVESTMENT' && (isMobile ? <MobileInvestmentForm /> : <InvestmentForm />)}
        </div>
      </div>
    </div>
  );
}
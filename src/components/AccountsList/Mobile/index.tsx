import { useEffect, useState } from 'react';
import { AccountType } from "../../../types/account";
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  CreditCard as CreditCardIcon, 
  Landmark, 
  PiggyBank, 
  Banknote, 
  Receipt,
  FileText
} from "lucide-react";
import { getAccounts, getCards } from '../../../services/api';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../../types/account';
import { Button } from '../../ui/button';
import type { Page } from '../../../types/navigation';
import { cn } from '../../../lib/utils';
import { EditAccountDialog } from '../../EditAccountDialog';
import { EditCardDialog } from '../../EditCardDialog';
import { PayInvoiceDialog } from '../../PayInvoiceDialog';
import { CreditCardInvoices } from '../../CreditCardInvoices';
import { formatCurrency } from '../../../utils/formatters';

interface AccountsListProps {
  onNavigate?: (page: Page) => void;
}

export function MobileAccountsList({ onNavigate }: AccountsListProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [payingCard, setPayingCard] = useState<CreditCard | null>(null);
  const [viewingInvoicesCard, setViewingInvoicesCard] = useState<CreditCard | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsData, cardsData] = await Promise.all([
        getAccounts(),
        getCards(),
      ]);
      setAccounts(accountsData);
      setCards(cardsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar contas e cartões');
    } finally {
      setLoading(false);
    }
  };

  const handleReloadData = async () => {
    await loadData();
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case AccountType.CHECKING: return <Landmark className="w-5 h-5" />;
      case AccountType.SAVINGS: return <PiggyBank className="w-5 h-5" />;
      case AccountType.WALLET: return <Banknote className="w-5 h-5" />;
      case AccountType.INVESTMENT: return <TrendingUp className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case AccountType.CHECKING: return 'Conta Corrente';
      case AccountType.SAVINGS: return 'Poupança';
      case AccountType.WALLET: return 'Dinheiro';
      case AccountType.INVESTMENT: return 'Investimentos';
      default: return type;
    }
  };

  return (
    <div className="pb-24 space-y-8 px-4 pt-2">
      {/* Header Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm active:scale-95 transition-all duration-200"
          onClick={() => onNavigate?.('accounts-new')}
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-zinc-900">Nova Conta</span>
        </button>
        
        <button 
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm active:scale-95 transition-all duration-200"
          onClick={() => onNavigate?.('accounts-new')}
        >
          <div className="p-2 bg-zinc-100 text-zinc-900 rounded-full">
            <CreditCardIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-zinc-900">Novo Cartão</span>
        </button>
      </div>

      {/* Accounts Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            Contas Bancárias
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-zinc-100 rounded-3xl animate-pulse" />)}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <Wallet className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
            <p className="text-sm font-medium">Nenhuma conta</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm active:scale-[0.98] transition-all duration-200"
                onClick={() => setEditingAccount(account)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", 
                       account.type === AccountType.WALLET ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                       {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-sm">{account.name}</h3>
                      <p className="text-zinc-500 text-xs">{getTypeLabel(account.type)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-zinc-900 tracking-tight">{formatCurrency(account.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-blue-500" />
            Cartões de Crédito
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-zinc-100 rounded-3xl animate-pulse" />)}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <CreditCardIcon className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
            <p className="text-sm font-medium">Nenhum cartão</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => {
              const limitUsed = card.limitUsed || 0;
              const limitPercent = Math.min((limitUsed / card.limit) * 100, 100);
              const available = card.limit - limitUsed;

              return (
                <div 
                  key={card.id} 
                  className={cn(
                    "relative p-5 rounded-3xl text-white shadow-lg overflow-hidden active:scale-[0.98] transition-all duration-200",
                    card.color && card.color.startsWith('bg-') ? card.color : "bg-zinc-900"
                  )}
                  onClick={() => setEditingCard(card)}
                >
                  {/* Texture */}
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl"></div>

                  <div className="relative z-10 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="h-5 w-5 opacity-80" />
                        <span className="font-medium text-sm opacity-90">{card.name}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] opacity-60 uppercase tracking-wider">Fatura Atual</p>
                         <p className="text-lg font-bold">{formatCurrency(card.currentInvoice)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] opacity-80">
                         <span>Limite Usado</span>
                         <span>{Math.round(limitPercent)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                         <div 
                            className="h-full bg-white/90 rounded-full" 
                            style={{ width: `${limitPercent}%` }} 
                         />
                      </div>
                      <div className="flex justify-between text-[10px] opacity-60">
                         <span>Disp: {formatCurrency(available)}</span>
                         <span>Total: {formatCurrency(card.limit)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                       <span className="text-[10px] opacity-60">
                          {card.lastFourDigits ? `•••• ${card.lastFourDigits}` : `Venc. dia ${card.closingDay}`}
                       </span>
                       <div className="flex gap-2">
                         <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md rounded-lg px-3"
                            onClick={(e) => {
                               e.stopPropagation();
                               setViewingInvoicesCard(card);
                            }}
                         >
                            <FileText className="w-3 h-3 mr-1" />
                            Faturas
                         </Button>
                         <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md rounded-lg px-3"
                            onClick={(e) => {
                               e.stopPropagation();
                               setPayingCard(card);
                            }}
                         >
                            <Receipt className="w-3 h-3 mr-1" />
                            Pagar
                         </Button>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dialogs */}
      {editingAccount && (
        <EditAccountDialog
          open={!!editingAccount}
          account={editingAccount}
          onOpenChange={(open) => {
            if (!open) setEditingAccount(null);
          }}
          onSuccess={handleReloadData}
        />
      )}

      {editingCard && (
        <EditCardDialog
          open={!!editingCard}
          card={editingCard}
          onOpenChange={(open) => {
            if (!open) setEditingCard(null);
          }}
          onSuccess={handleReloadData}
        />
      )}

      {payingCard && (
        <PayInvoiceDialog
          open={!!payingCard}
          card={payingCard}
          onOpenChange={(open) => {
            if (!open) setPayingCard(null);
          }}
          onSuccess={handleReloadData}
        />
      )}

      {viewingInvoicesCard && (
        <CreditCardInvoices
          cardId={viewingInvoicesCard.id}
          cardName={viewingInvoicesCard.name}
          cardColor={viewingInvoicesCard.color || "blue"}
          open={!!viewingInvoicesCard}
          onOpenChange={(open) => {
            if (!open) setViewingInvoicesCard(null);
          }}
          onPaymentSuccess={handleReloadData}
        />
      )}
    </div>
  );
}

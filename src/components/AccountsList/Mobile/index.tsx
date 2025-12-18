import { useEffect, useState } from 'react';
import { AccountType } from "../../../types/account";
import { Wallet, Plus, TrendingUp, CreditCard as CreditCardIcon, ArrowUpRight, Layers, LayoutGrid } from "lucide-react";
import { getAccounts, getCards } from '../../../services/api';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../../types/account';
import { Button } from '../../ui/button';
import type { Page } from '../../../types/navigation';
import { cn } from '../../../lib/utils';
import { EditAccountDialog } from '../../EditAccountDialog';
import { EditCardDialog } from '../../EditCardDialog';
import { PayInvoiceDialog } from '../../PayInvoiceDialog';
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
  const [accountsStacked, setAccountsStacked] = useState(false);
  const [cardsStacked, setCardsStacked] = useState(false);

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case AccountType.CHECKING:
        return 'Conta Corrente';
      case AccountType.SAVINGS:
        return 'Poupança';
      case AccountType.WALLET:
        return 'Dinheiro';
      case AccountType.INVESTMENT:
        return 'Investimentos';
      default:
        return type;
    }
  };

  return (
    <div className="pb-24 space-y-8 px-1">
      <style>{`
        .wallet-card {
          position: absolute;
          left: 0;
          right: 0;
          transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
          will-change: transform, opacity;
        }
      `}</style>
      {/* Header Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          className="group relative flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-white shadow-sm border border-gray-100 active:scale-95 transition-all duration-300 hover:shadow-md"
          onClick={() => onNavigate?.('accounts-new')}
        >
          <div className="p-3.5 bg-blue-400 text-white rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Nova Conta</span>
        </button>
        
        <button 
          className="group relative flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-white shadow-sm border border-gray-100 active:scale-95 transition-all duration-300 hover:shadow-md"
          onClick={() => onNavigate?.('accounts-new')}
        >
          <div className="p-3.5 bg-blue-400 text-white rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
            <CreditCardIcon className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Novo Cartão</span>
        </button>
      </div>

      {/* Equity Shortcut */}
      <div 
        className="relative overflow-hidden bg-gradient-to-br from-blue-400 to-blue-400 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-200 cursor-pointer active:scale-[0.98] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300 group"
        onClick={() => onNavigate?.('equity-list')}
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
        
        <div className="relative flex items-center justify-between mb-6">
          <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md border border-white/10">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-1 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <span className="text-xs font-semibold text-white">Ver tudo</span>
            <ArrowUpRight className="h-3 w-3 text-white/80" />
          </div>
        </div>
        <div className="relative">
          <h3 className="text-xl font-bold mb-1 tracking-tight">Meus Investimentos</h3>
          <p className="text-sm text-blue-100 font-medium">Gerencie seus ativos e patrimônio</p>
        </div>
      </div>

      {/* Accounts Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Minhas Contas</h2>
          {accounts.length > 1 && (
            <button
              onClick={() => setAccountsStacked(!accountsStacked)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
                accountsStacked 
                  ? "bg-black text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {accountsStacked ? (
                <>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Expandir
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
                  Agrupar
                </>
              )}
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <Wallet className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">Nenhuma conta cadastrada</p>
          </div>
        ) : (
          <div 
            className="relative transition-all duration-500 ease-out"
            style={{ 
              height: accountsStacked 
                ? `${208 + (accounts.length - 1) * 10}px` 
                : `${accounts.length * 224}px` 
            }}
          >
            {accounts.map((account, index) => {
              const isTopCard = index === 0;
              const yOffset = accountsStacked ? index * 10 : index * 224;
              const scale = accountsStacked ? 1 - (index * 0.05) : 1;
              const opacity = accountsStacked && index > 2 ? 0 : 1;
              
              return (
                <div 
                  key={account.id} 
                  className={cn(
                    "wallet-card overflow-hidden p-6 rounded-[2rem] text-white shadow-xl group cursor-pointer h-52",
                    account.color
                  )}
                  style={{
                    transform: `translate3d(0, ${yOffset}px, 0) scale(${scale})`,
                    zIndex: accounts.length - index,
                    opacity,
                    transformOrigin: 'top center'
                  }}
                  onClick={() => {
                    if (accountsStacked) {
                      setAccountsStacked(false);
                    } else {
                      setEditingAccount(account);
                    }
                  }}
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-colors" />
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/10 rounded-full blur-2xl" />

                  <div className="relative flex justify-between items-start mb-8">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg tracking-wide">{account.name}</h3>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-wider">{getTypeLabel(account.type)}</p>
                    </div>
                    <div className="p-2.5 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <p className="text-white/80 text-xs font-medium mb-1">Saldo Disponível</p>
                    <p className="text-3xl font-bold tracking-tight">{formatCurrency(account.balance)}</p>
                  </div>
                  
                  {/* Stack indicator when stacked */}
                  {accountsStacked && isTopCard && accounts.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                      <span className="text-xs font-bold">{accounts.length} contas</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cards Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Meus Cartões</h2>
          {cards.length > 1 && (
            <button
              onClick={() => setCardsStacked(!cardsStacked)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
                cardsStacked 
                  ? "bg-black text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cardsStacked ? (
                <>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Expandir
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
                  Agrupar
                </>
              )}
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <CreditCardIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div 
            className="relative transition-all duration-500 ease-out"
            style={{ 
              height: cardsStacked 
                ? `${256 + (cards.length - 1) * 10}px` 
                : `${cards.length * 272}px` 
            }}
          >
            {cards.map((card, index) => {
              const isTopCard = index === 0;
              const yOffset = cardsStacked ? index * 10 : index * 272;
              const scale = cardsStacked ? 1 - (index * 0.05) : 1;
              const opacity = cardsStacked && index > 2 ? 0 : 1;
              
              return (
                <div 
                  key={card.id} 
                  className={cn(
                    "wallet-card overflow-hidden p-6 rounded-[2rem] text-white shadow-xl group cursor-pointer h-64",
                    card.color
                  )}
                  style={{
                    transform: `translate3d(0, ${yOffset}px, 0) scale(${scale})`,
                    zIndex: cards.length - index,
                    opacity,
                    transformOrigin: 'top center'
                  }}
                  onClick={() => {
                    if (cardsStacked) {
                      setCardsStacked(false);
                    } else {
                      setEditingCard(card);
                    }
                  }}
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-colors" />
                  
                  <div className="relative flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                        <CreditCardIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg tracking-wide">{card.name}</h3>
                        <p className="text-white/70 text-xs font-medium">Final ****</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-0.5">Limite</p>
                       <p className="text-white font-semibold">{formatCurrency(card.limit)}</p>
                    </div>
                  </div>

                  <div className="relative mt-auto pt-5 border-t border-white/10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/80 text-xs font-medium mb-1">Fatura Atual</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-white/80 font-medium">R$</span>
                          <span className="text-3xl font-bold tracking-tight">
                            {card.currentInvoice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                          </span>
                        </div>
                      </div>
                      
                      {!cardsStacked && (
                        <div className="flex flex-col items-end gap-3">
                          <span className="text-xs text-white/80 font-medium bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
                            Vence dia {card.closingDay}
                          </span>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="bg-white text-black hover:bg-gray-100 border-0 h-9 px-5 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPayingCard(card);
                            }}
                          >
                            Pagar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stack indicator when stacked */}
                  {cardsStacked && isTopCard && cards.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                      <span className="text-xs font-bold">{cards.length} cartões</span>
                    </div>
                  )}
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
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AccountType } from "../../../types/account";
import { Wallet, Plus, TrendingUp, CreditCard as CreditCardIcon } from "lucide-react";
import { getAccounts, getCards } from '../../../services/api';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../../types/account';
import { Button } from '../../ui/button';
import type { Page } from '../../../types/navigation';
import { cn } from '../../../lib/utils';
import { EditAccountDialog } from '../../EditAccountDialog';
import { EditCardDialog } from '../../EditCardDialog';
import { PayInvoiceDialog } from '../../PayInvoiceDialog';

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
    <div className="pb-24 space-y-6">
      {/* Header Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2 rounded-2xl border-dashed border-2"
          onClick={() => onNavigate?.('accounts-new')}
        >
          <div className="p-2 bg-gray-100 rounded-full">
            <Plus className="h-5 w-5 text-gray-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Nova Conta</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2 rounded-2xl border-dashed border-2"
          onClick={() => onNavigate?.('accounts-new')} // Assuming same flow for cards or separate
        >
          <div className="p-2 bg-gray-100 rounded-full">
            <CreditCardIcon className="h-5 w-5 text-gray-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Novo Cartão</span>
        </Button>
      </div>

      {/* Equity Shortcut */}
      <div 
        className="bg-gradient-to-br from-blue-500 to-blue-400 rounded-3xl p-6 text-white shadow-xl cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => onNavigate?.('equity-list')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium bg-white/10 px-3 py-1 rounded-full text-white">
            Patrimônio
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Meus Investimentos</h3>
          <p className="text-sm text-white">Gerencie seus ativos e patrimônio</p>
        </div>
      </div>

      {/* Accounts Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 px-1">Minhas Contas</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
            <Wallet className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma conta cadastrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className={cn(
                  "p-5 rounded-2xl text-white shadow-lg transition-transform active:scale-[0.98]",
                  account.color
                )}
                onClick={() => setEditingAccount(account)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{account.name}</h3>
                    <p className="text-white/80 text-sm">{getTypeLabel(account.type)}</p>
                  </div>
                  <Wallet className="h-5 w-5 opacity-80" />
                </div>
                <div>
                  <p className="text-white/80 text-xs mb-1">Saldo Atual</p>
                  <p className="text-2xl font-bold">R$ {account.balance.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 px-1">Meus Cartões</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
            <CreditCardIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div 
                key={card.id} 
                className={cn(
                  "p-5 rounded-2xl text-white shadow-lg transition-transform active:scale-[0.98]",
                  card.color
                )}
                onClick={() => setEditingCard(card)}
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-semibold text-lg">{card.name}</h3>
                    <p className="text-white/80 text-sm">Limite: R$ {card.limit.toFixed(2)}</p>
                  </div>
                  <CreditCardIcon className="h-5 w-5 opacity-80" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/80 text-xs mb-1">Fatura Atual</p>
                    <p className="text-2xl font-bold">R$ {card.currentInvoice?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-white/80 text-xs">Vence dia {card.closingDay}</p>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 px-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPayingCard(card);
                      }}
                    >
                      Pagar Fatura
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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

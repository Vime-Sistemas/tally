import { useEffect, useState } from 'react';
import { AccountType } from "../../types/account";
import { CreditCard, Wallet, Banknote } from "lucide-react";
import { getAccounts, getCards } from '../../services/api';
import { toast } from 'sonner';
import type { Account, CreditCard as CreditCardType } from '../../types/account';
import { EditAccountDialog } from '../EditAccountDialog';
import { EditCardDialog } from '../EditCardDialog';
import { PayInvoiceDialog } from '../PayInvoiceDialog';
import { Button } from '../ui/button';
import type { Page } from '../../types/navigation';
import { formatCurrency } from '../../utils/formatters';

import { MobileAccountsList } from './Mobile';
import { useIsMobile } from '../../hooks/use-mobile';

interface AccountsListProps {
  onNavigate?: (page: Page) => void;
}

export function AccountsList({ onNavigate }: AccountsListProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileAccountsList onNavigate={onNavigate} />;
  }

  return <DesktopAccountsList onNavigate={onNavigate} />;
}

function DesktopAccountsList({ onNavigate }: AccountsListProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [payingCard, setPayingCard] = useState<CreditCardType | null>(null);

  useEffect(() => {
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
    loadData();
  }, []);

  const handleReloadData = async () => {
    try {
      const [accountsData, cardsData] = await Promise.all([
        getAccounts(),
        getCards(),
      ]);
      setAccounts(accountsData);
      setCards(cardsData);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
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
    <div className="space-y-8">
      {/* Contas */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Minhas Contas</h2>
          {onNavigate && (
            <Button onClick={() => onNavigate('accounts-new')} className='bg-blue-400 hover:bg-blue-500'>
              <Wallet className="mr-2 h-6 w-6" />
              Nova Conta
            </Button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : accounts.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-600 font-medium mb-1">Nenhuma conta cadastrada</p>
            <p className="text-sm text-gray-500">Crie sua primeira conta para começar a organizar suas finanças</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className={`p-6 rounded-2xl text-white shadow-lg ${account.color} transition-transform hover:scale-[1.02] cursor-pointer`}
                onClick={() => setEditingAccount(account)}
              >
                <div className="flex justify-between items-start mb-8">
                  {account.type === AccountType.WALLET ? (
                    <Banknote className="h-6 w-6 opacity-80" />
                  ) : (
                    <Wallet className="h-6 w-6 opacity-80" />
                  )}
                  <span className="text-sm font-medium opacity-80">{getTypeLabel(account.type)}</span>
                </div>
                <div>
                  <p className="text-sm opacity-80 mb-1">Saldo Atual</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(account.balance)}</h3>
                  <p className="mt-2 font-medium">{account.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cartões */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Meus Cartões</h2>
          {onNavigate && (
            <Button onClick={() => onNavigate('accounts-new')} className='bg-blue-400 hover:bg-blue-500'>
              <CreditCard className="mr-2 h-4 w-4" />
              Novo Cartão
            </Button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : cards.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-600 font-medium mb-1">Nenhum cartão cadastrado</p>
            <p className="text-sm text-gray-500">Adicione um cartão de crédito para rastrear suas despesas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <div 
                key={card.id} 
                className={`p-6 rounded-2xl text-white shadow-lg ${card.color} relative overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer`}
                onClick={() => setEditingCard(card)}
              >
                {/* Decorative circles */}
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white opacity-10"></div>
                <div className="absolute -right-10 top-10 w-32 h-32 rounded-full bg-white opacity-5"></div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <CreditCard className="h-6 w-6 opacity-80" />
                  <span className="text-sm font-medium opacity-80">Crédito</span>
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm opacity-80 mb-1">Fatura Atual</p>
                      <h3 className="text-2xl font-bold">{formatCurrency(card.currentInvoice)}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-80">Limite Disponível</p>
                      <p className="font-medium">{formatCurrency(card.limit - (card.limitUsed || 0))}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <div>
                        <p className="font-medium tracking-wide">{card.name}</p>
                        <p className="text-xs opacity-80">Vence dia {card.dueDay}</p>
                    </div>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
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

      {/* Edit Dialogs */}
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

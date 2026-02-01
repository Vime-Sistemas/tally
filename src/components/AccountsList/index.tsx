import { useEffect, useState } from 'react';
import { AccountType } from "../../types/account";
import { CreditCard, Wallet, Banknote, Plus, ArrowRight, Landmark, Receipt, PiggyBank, TrendingUp, FileText } from "lucide-react";
import { getAccounts, getCards } from '../../services/api';
import { toast } from 'sonner';
import type { Account, CreditCard as CreditCardType } from '../../types/account';
import { EditAccountDialog } from '../EditAccountDialog';
import { EditCardDialog } from '../EditCardDialog';
import { PayInvoiceDialog } from '../PayInvoiceDialog';
import { CreditCardInvoices } from '../CreditCardInvoices';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Page } from '../../types/navigation';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';

import { MobileAccountsList } from './Mobile';
import { useIsMobile } from '../../hooks/use-mobile';

interface AccountsListProps {
  onNavigate?: (page: Page) => void;
}

export function AccountsList({ onNavigate }: AccountsListProps) {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileAccountsList onNavigate={onNavigate} />;
  return <DesktopAccountsList onNavigate={onNavigate} />;
}

function DesktopAccountsList({ onNavigate }: AccountsListProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [payingCard, setPayingCard] = useState<CreditCardType | null>(null);
  const [viewingInvoicesCard, setViewingInvoicesCard] = useState<CreditCardType | null>(null);

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

  const handleReloadData = loadData;

  // Ícones e Labels refinados
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
      case AccountType.WALLET: return 'Dinheiro Físico';
      case AccountType.INVESTMENT: return 'Investimentos';
      default: return type;
    }
  };

  // Mapeamento de cores para classes Tailwind (caso venha do backend como string hex ou nome)
  // Se o backend manda classes como 'bg-blue-500', ok. Se manda hex, precisaria de style inline.
  // Vou assumir que 'account.color' é uma classe Tailwind válida ou string compatível.
  // Para garantir o design clean, vou usar estilos inline para opacidade se for cor sólida.

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* --- Header --- */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Carteira</h1>
            <p className="text-zinc-500 mt-1">Gerencie suas fontes de recursos e cartões.</p>
          </div>
          <div className="flex gap-3">
             {onNavigate && (
              <>
                <Button 
                    variant="outline" 
                    className="gap-2 rounded-xl h-10 border-zinc-200 text-zinc-600 hover:text-blue-600 hover:border-blue-200"
                    onClick={() => onNavigate('accounts-new')}
                >
                  <Plus className="w-4 h-4" /> Nova Conta
                </Button>
                <Button 
                    className="gap-2 rounded-xl h-10 bg-blue-400 hover:bg-blue-500 text-white shadow-lg shadow-zinc-200"
                    onClick={() => onNavigate('accounts-new')}
                >
                  <CreditCard className="w-4 h-4" /> Novo Cartão
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-40 bg-zinc-200 rounded-3xl" />)}
           </div>
        ) : (
          <>
            {/* --- Seção Contas Bancárias --- */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                Contas Bancárias
              </h2>
              
              {accounts.length === 0 ? (
                <EmptyState 
                  icon={Wallet} 
                  title="Nenhuma conta" 
                  desc="Adicione sua primeira conta bancária." 
                  action={() => onNavigate?.('accounts-new')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setEditingAccount(account)}
                      className="group relative bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      {/* Background Decorativo Suave */}
                      <div className={cn("absolute right-0 top-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-full transition-opacity group-hover:opacity-10", 
                        account.type === AccountType.WALLET ? "from-emerald-400 to-green-600" : "from-blue-400 to-indigo-600"
                      )} />

                      <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                        <div className="flex justify-between items-start">
                          <div className={cn("p-3 rounded-2xl transition-colors", 
                             account.type === AccountType.WALLET ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                          )}>
                             {getAccountIcon(account.type)}
                          </div>
                          <Badge variant="secondary" className="bg-zinc-50 text-zinc-500 font-normal group-hover:bg-white group-hover:text-zinc-700">
                             {getTypeLabel(account.type)}
                          </Badge>
                        </div>
                        
                        <div>
                           <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Saldo Disponível</p>
                           <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{formatCurrency(account.balance)}</h3>
                           <p className="text-zinc-600 font-medium mt-1 truncate">{account.name}</p>
                        </div>

                        <div className="flex items-center text-xs font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                           Editar detalhes <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* --- Seção Cartões de Crédito --- */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                Cartões de Crédito
              </h2>

              {cards.length === 0 ? (
                 <EmptyState 
                  icon={CreditCard} 
                  title="Nenhum cartão" 
                  desc="Controle seus gastos no crédito." 
                  action={() => onNavigate?.('accounts-new')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card) => {
                    // Lógica visual para barra de progresso do limite
                    const limitUsed = card.limitUsed || 0;
                    const limitPercent = Math.min((limitUsed / card.limit) * 100, 100);
                    const available = card.limit - limitUsed;

                    return (
                      <div
                        key={card.id}
                        onClick={() => setEditingCard(card)}
                        className={cn(
                          "group relative p-6 rounded-3xl text-white shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden",
                          // Se card.color for uma classe válida (ex: bg-red-500), usa. Senão, fallback para gradiente padrão.
                          card.color && card.color.startsWith('bg-') ? card.color : "bg-gradient-to-br from-zinc-800 to-zinc-900"
                        )}
                      >
                        {/* Textura "Noise" ou Pattern para dar aspecto premium */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
                        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"></div>

                        <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                           <div className="flex justify-between items-center">
                              <CreditCard className="w-6 h-6 opacity-80" />
                              <span className="font-mono text-xs opacity-60 tracking-widest uppercase">
                                {card.name}
                              </span>
                           </div>

                           <div className="space-y-1">
                              <p className="text-xs font-medium opacity-70 uppercase tracking-wider">Fatura Atual</p>
                              <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(card.currentInvoice)}</h3>
                           </div>

                           <div className="space-y-3">
                              {/* Barra de Limite */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs opacity-80">
                                   <span>Limite Usado</span>
                                   <span>{Math.round(limitPercent)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                   <div 
                                      className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out" 
                                      style={{ width: `${limitPercent}%` }} 
                                   />
                                </div>
                                <div className="flex justify-between text-[10px] opacity-60 pt-0.5">
                                   <span>Disp: {formatCurrency(available)}</span>
                                   <span>Total: {formatCurrency(card.limit)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                 <div className="text-xs opacity-70">
                                    {card.lastFourDigits ? `•••• ${card.lastFourDigits}` : `Venc. dia ${card.dueDay}`}
                                 </div>
                                 <div className="flex gap-2">
                                   <Button 
                                      size="sm" 
                                      variant="secondary"
                                      className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md rounded-lg"
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setViewingInvoicesCard(card);
                                      }}
                                   >
                                      <FileText className="w-3 h-3 mr-1.5" />
                                      Faturas
                                   </Button>
                                   <Button 
                                      size="sm" 
                                      variant="secondary"
                                      className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md rounded-lg"
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setPayingCard(card);
                                      }}
                                   >
                                      <Receipt className="w-3 h-3 mr-1.5" />
                                      Pagar
                                   </Button>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

      </div>

      {/* --- Dialogs (Mantidos) --- */}
      {editingAccount && (
        <EditAccountDialog
          open={!!editingAccount}
          account={editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
          onSuccess={handleReloadData}
        />
      )}
      {editingCard && (
        <EditCardDialog
          open={!!editingCard}
          card={editingCard}
          onOpenChange={(open) => !open && setEditingCard(null)}
          onSuccess={handleReloadData}
        />
      )}
      {payingCard && (
        <PayInvoiceDialog
          open={!!payingCard}
          card={payingCard}
          onOpenChange={(open) => !open && setPayingCard(null)}
          onSuccess={handleReloadData}
        />
      )}
      {viewingInvoicesCard && (
        <CreditCardInvoices
          cardId={viewingInvoicesCard.id}
          cardName={viewingInvoicesCard.name}
          cardColor={viewingInvoicesCard.color || '#3b82f6'}
          open={!!viewingInvoicesCard}
          onOpenChange={(open) => !open && setViewingInvoicesCard(null)}
          onPaymentSuccess={handleReloadData}
        />
      )}
    </div>
  );
}

// Componente Auxiliar de Estado Vazio
function EmptyState({ icon: Icon, title, desc, action }: { icon: any, title: string, desc: string, action?: () => void }) {
  return (
    <div 
      onClick={action}
      className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer text-center"
    >
      <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-zinc-400 group-hover:text-blue-500" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1 mb-3">{desc}</p>
      {action && (
         <span className="text-xs font-medium text-blue-500 group-hover:underline">Adicionar novo +</span>
      )}
    </div>
  );
}
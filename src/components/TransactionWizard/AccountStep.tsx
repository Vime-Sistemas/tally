import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet,
  CreditCard,
  Building2,
  PiggyBank,
  Check,
  AlertCircle,
  TrendingDown,
  type LucideIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAccounts, getCards } from '../../services/api';
import type { Account, CreditCard as CardType } from '../../types/account';
import { TransactionType } from '../../types/transaction';

// ============================================================================
// Types
// ============================================================================

type TransactionTypeValue = typeof TransactionType.INCOME | typeof TransactionType.EXPENSE;

interface AccountStepProps {
  transactionType: TransactionTypeValue;
  amount: number;
  value: string; // accountId or card_cardId
  onChange: (value: string, isCard: boolean) => void;
  onNext: () => void;
  isPlanner: boolean;
}

interface PaymentOption {
  id: string;
  name: string;
  type: 'account' | 'card';
  icon: LucideIcon;
  balance?: number;
  limit?: number;
  limitUsed?: number;
  color?: string;
  isInsufficient?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getAccountIcon(type: string): LucideIcon {
  switch (type?.toLowerCase()) {
    case 'checking':
    case 'corrente':
      return Building2;
    case 'savings':
    case 'poupança':
      return PiggyBank;
    case 'investment':
    case 'investimento':
      return TrendingDown;
    default:
      return Wallet;
  }
}

// ============================================================================
// Account Step Component
// ============================================================================

export function AccountStep({ 
  transactionType,
  amount,
  value, 
  onChange, 
  onNext,
  isPlanner 
}: AccountStepProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  const accentRing = isPlanner ? 'ring-emerald-500' : 'ring-blue-500';

  // Load accounts and cards
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
        console.error('Error loading payment methods:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Build payment options
  const paymentOptions = useMemo(() => {
    const options: PaymentOption[] = [];

    // Add accounts
    accounts.forEach(acc => {
      const isInsufficient = transactionType === TransactionType.EXPENSE && acc.balance < amount;
      options.push({
        id: acc.id,
        name: acc.name,
        type: 'account',
        icon: getAccountIcon(acc.type),
        balance: acc.balance,
        color: acc.color,
        isInsufficient,
      });
    });

    // Add cards (only for expenses)
    if (transactionType === TransactionType.EXPENSE) {
      cards.forEach(card => {
        const available = card.limit - (card.limitUsed || 0);
        const isInsufficient = available < amount;
        options.push({
          id: `card_${card.id}`,
          name: card.name,
          type: 'card',
          icon: CreditCard,
          limit: card.limit,
          limitUsed: card.limitUsed || 0,
          isInsufficient,
        });
      });
    }

    return options;
  }, [accounts, cards, transactionType, amount]);

  const handleSelect = (option: PaymentOption) => {
    onChange(option.id, option.type === 'card');
  };

  const handleContinue = () => {
    if (value) {
      onNext();
    }
  };

  const selectedOption = paymentOptions.find(o => o.id === value);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-zinc-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Info Header */}
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100">
        <p className="text-sm text-zinc-500">
          {transactionType === TransactionType.EXPENSE 
            ? 'De onde sairá o valor?' 
            : 'Onde entrará o valor?'}
        </p>
        <p className="text-lg font-bold text-zinc-900">
          {formatCurrency(amount)}
        </p>
      </div>

      {/* Payment Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Accounts Section */}
        {accounts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">
              Contas
            </p>
            <div className="space-y-2">
              {paymentOptions
                .filter(o => o.type === 'account')
                .map((option, index) => {
                  const isSelected = value === option.id;
                  
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                        isSelected
                          ? cn("border-transparent ring-2", accentRing, "bg-zinc-50")
                          : "border-zinc-100 bg-white hover:border-zinc-200 active:scale-[0.98]",
                        option.isInsufficient && "opacity-60"
                      )}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: option.color ? `${option.color}20` : '#f4f4f5' }}
                      >
                        <option.icon 
                          className="w-6 h-6"
                          style={{ color: option.color || '#71717a' }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 truncate">{option.name}</p>
                        <p className={cn(
                          "text-sm",
                          option.isInsufficient ? "text-rose-500" : "text-zinc-500"
                        )}>
                          Saldo: {formatCurrency(option.balance || 0)}
                        </p>
                      </div>

                      {option.isInsufficient && (
                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      )}

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0", accentBg)}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Cards Section (only for expenses) */}
        {transactionType === TransactionType.EXPENSE && cards.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">
              Cartões de Crédito
            </p>
            <div className="space-y-2">
              {paymentOptions
                .filter(o => o.type === 'card')
                .map((option, index) => {
                  const isSelected = value === option.id;
                  const available = (option.limit || 0) - (option.limitUsed || 0);
                  
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (accounts.length + index) * 0.05 }}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                        isSelected
                          ? cn("border-transparent ring-2", accentRing, "bg-zinc-50")
                          : "border-zinc-100 bg-white hover:border-zinc-200 active:scale-[0.98]",
                        option.isInsufficient && "opacity-60"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 truncate">{option.name}</p>
                        <p className={cn(
                          "text-sm",
                          option.isInsufficient ? "text-rose-500" : "text-zinc-500"
                        )}>
                          Disponível: {formatCurrency(available)}
                        </p>
                      </div>

                      {option.isInsufficient && (
                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      )}

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0", accentBg)}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        )}

        {paymentOptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="w-12 h-12 text-zinc-300 mb-3" />
            <p className="text-zinc-500">Nenhuma conta cadastrada</p>
            <p className="text-sm text-zinc-400 mt-1">Cadastre uma conta para continuar</p>
          </div>
        )}
      </div>

      {/* Warning for insufficient balance */}
      {selectedOption?.isInsufficient && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Saldo insuficiente. A transação será registrada, mas o saldo ficará negativo.
            </p>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="p-4 border-t border-zinc-100 bg-white">
        <motion.button
          onClick={handleContinue}
          disabled={!value}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-white transition-all",
            value 
              ? cn(accentBg, "active:scale-[0.98]") 
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          )}
          whileTap={value ? { scale: 0.98 } : {}}
        >
          Continuar
        </motion.button>
      </div>
    </div>
  );
}

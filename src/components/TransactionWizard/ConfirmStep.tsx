import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Wallet,
  CreditCard,
  Tag,
  FileText,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TransactionType } from '../../types/transaction';
import type { WizardData } from './index';

// ============================================================================
// Types
// ============================================================================

interface ConfirmStepProps {
  data: WizardData;
  onConfirm: () => void;
  onEdit: (step: string) => void;
  isSubmitting: boolean;
  isPlanner: boolean;
  accountName?: string;
  cardName?: string;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

// ============================================================================
// Summary Row Component
// ============================================================================

interface SummaryRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onEdit?: () => void;
}

function SummaryRow({ icon, label, value, onEdit }: SummaryRowProps) {
  return (
    <motion.button
      onClick={onEdit}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
        onEdit ? "hover:bg-zinc-50 active:bg-zinc-100" : ""
      )}
      disabled={!onEdit}
    >
      <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className="font-medium text-zinc-900 truncate">{value}</p>
      </div>
      {onEdit && (
        <span className="text-xs text-zinc-400">Editar</span>
      )}
    </motion.button>
  );
}

// ============================================================================
// Confirm Step Component
// ============================================================================

export function ConfirmStep({ 
  data,
  onConfirm,
  onEdit,
  isSubmitting,
  isPlanner,
  accountName,
  cardName,
}: ConfirmStepProps) {
  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  const isExpense = data.type === TransactionType.EXPENSE;
  const typeColor = isExpense ? 'text-rose-500' : 'text-emerald-500';
  const typeBg = isExpense ? 'bg-rose-50' : 'bg-emerald-50';

  const paymentMethodName = useMemo(() => {
    if (cardName) return cardName;
    if (accountName) return accountName;
    return 'Não selecionado';
  }, [accountName, cardName]);

  const categoryLabel = useMemo(() => {
    // Map category codes to labels
    const labels: Record<string, string> = {
      FOOD: 'Alimentação',
      TRANSPORT: 'Transporte',
      HOUSING: 'Moradia',
      UTILITIES: 'Contas',
      HEALTHCARE: 'Saúde',
      ENTERTAINMENT: 'Lazer',
      EDUCATION: 'Educação',
      SHOPPING: 'Compras',
      INVESTMENT: 'Investimento',
      OTHER_EXPENSE: 'Outros',
      SALARY: 'Salário',
      FREELANCE: 'Freelance',
      OTHER_INCOME: 'Outros',
    };
    return labels[data.category || ''] || data.category || 'Não selecionada';
  }, [data.category]);

  return (
    <div className="flex flex-col h-full">
      {/* Hero Section */}
      <div className={cn("px-6 py-8 text-center", typeBg)}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4"
        >
          {isExpense ? (
            <ArrowDownCircle className="w-8 h-8 text-rose-500" />
          ) : (
            <ArrowUpCircle className="w-8 h-8 text-emerald-500" />
          )}
        </motion.div>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-zinc-500 mb-1"
        >
          {isExpense ? 'Despesa' : 'Receita'}
        </motion.p>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={cn("text-4xl font-bold", typeColor)}
        >
          {formatCurrency(data.amount || 0)}
        </motion.p>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-600 mt-2 font-medium"
        >
          {data.description || 'Sem descrição'}
        </motion.p>
      </div>

      {/* Details */}
      <div className="flex-1 p-4 space-y-1">
        <SummaryRow
          icon={<Tag className="w-5 h-5" />}
          label="Categoria"
          value={categoryLabel}
          onEdit={() => onEdit('category')}
        />

        <SummaryRow
          icon={data.cardId ? <CreditCard className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          label={data.cardId ? 'Cartão' : 'Conta'}
          value={paymentMethodName}
          onEdit={() => onEdit('account')}
        />

        <SummaryRow
          icon={<Calendar className="w-5 h-5" />}
          label="Data"
          value={data.date ? formatDate(data.date) : 'Hoje'}
        />

        {data.installments && data.installments > 1 && (
          <SummaryRow
            icon={<FileText className="w-5 h-5" />}
            label="Parcelas"
            value={`${data.installments}x de ${formatCurrency((data.amount || 0) / data.installments)}`}
          />
        )}
      </div>

      {/* Confirmation */}
      <div className="p-4 border-t border-zinc-100 bg-white space-y-3">
        {/* Success Animation Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-sm text-zinc-500"
        >
          <Sparkles className="w-4 h-4" />
          <span>Pronto para registrar</span>
        </motion.div>

        {/* Confirm Button */}
        <motion.button
          onClick={onConfirm}
          disabled={isSubmitting}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2",
            accentBg,
            isSubmitting ? "opacity-80" : "active:scale-[0.98]"
          )}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Confirmar Transação
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

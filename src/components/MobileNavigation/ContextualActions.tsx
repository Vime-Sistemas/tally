import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus,
  Filter,
  Download,
  Search,
  SlidersHorizontal,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  CreditCard,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Page } from '../../types/navigation';

// ============================================================================
// Types
// ============================================================================

interface ContextualActionsProps {
  currentPage: Page;
  onAction: (actionId: string) => void;
  isPlanner?: boolean;
  isVisible?: boolean;
}

interface ContextAction {
  id: string;
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
}

// ============================================================================
// Page Actions Configuration
// ============================================================================

const PAGE_ACTIONS: Record<string, ContextAction[]> = {
  'transactions-history': [
    { id: 'filter', icon: Filter, label: 'Filtrar' },
    { id: 'search', icon: Search, label: 'Buscar' },
    { id: 'export', icon: Download, label: 'Exportar' },
  ],
  'accounts-list': [
    { id: 'new-account', icon: Plus, label: 'Nova Conta', variant: 'primary' },
    { id: 'transfer', icon: Wallet, label: 'Transferir' },
  ],
  'budgets': [
    { id: 'new-budget', icon: Plus, label: 'Novo', variant: 'primary' },
    { id: 'adjust', icon: SlidersHorizontal, label: 'Ajustar' },
  ],
  'cashflow-future': [
    { id: 'add-income', icon: ArrowUpCircle, label: 'Receita', variant: 'primary' },
    { id: 'add-expense', icon: ArrowDownCircle, label: 'Despesa' },
    { id: 'filter-period', icon: Calendar, label: 'Período' },
  ],
  'equity-list': [
    { id: 'new-equity', icon: Plus, label: 'Novo Ativo', variant: 'primary' },
    { id: 'update-values', icon: SlidersHorizontal, label: 'Atualizar' },
  ],
  'debts': [
    { id: 'new-debt', icon: Plus, label: 'Nova Dívida', variant: 'primary' },
    { id: 'pay-debt', icon: CreditCard, label: 'Pagar' },
  ],
  'planner-clients': [
    { id: 'invite-client', icon: Plus, label: 'Convidar', variant: 'primary' },
    { id: 'search-clients', icon: Search, label: 'Buscar' },
  ],
};

// ============================================================================
// Main Component
// ============================================================================

export function ContextualActions({ 
  currentPage, 
  onAction, 
  isPlanner,
  isVisible = true 
}: ContextualActionsProps) {
  const actions = useMemo(() => PAGE_ACTIONS[currentPage] || [], [currentPage]);
  
  const theme = useMemo(() => ({
    primary: isPlanner ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white',
    secondary: 'bg-zinc-100 text-zinc-700',
    destructive: 'bg-rose-500 text-white',
  }), [isPlanner]);

  // Don't render if no actions for this page
  if (actions.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-4 bottom-28 z-40 flex flex-col gap-2 md:hidden"
        >
          {actions.map((action, index) => {
            const variantClass = action.variant 
              ? theme[action.variant] 
              : theme.secondary;
            
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onAction(action.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full",
                  "shadow-lg backdrop-blur-sm",
                  "active:scale-95 transition-transform",
                  variantClass
                )}
              >
                <action.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Floating Action Button (FAB) - Single Primary Action
// ============================================================================

interface FABProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isPlanner?: boolean;
  position?: 'left' | 'right';
}

export function FloatingActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  isPlanner,
  position = 'right' 
}: FABProps) {
  const bgColor = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  const positionClass = position === 'left' ? 'left-4' : 'right-4';
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "fixed bottom-28 z-40 md:hidden",
        "flex items-center gap-2 px-5 py-3 rounded-full",
        "shadow-xl shadow-zinc-300/40",
        "text-white font-medium",
        bgColor,
        positionClass
      )}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
      
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-full opacity-30 blur-xl -z-10",
        bgColor
      )} />
    </motion.button>
  );
}

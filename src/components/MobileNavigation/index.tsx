import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { 
  Home, 
  CalendarClock, 
  LayoutList, 
  WalletCards, 
  User,
  Users,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  PiggyBank,
  X,
  ChevronUp,
  Target,
  PieChart,
  Landmark,
  BanknoteX,
  Boxes,
  type LucideIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Page } from '../../types/navigation';
import { useUser } from '../../contexts/UserContext';
import { TransactionType } from '../../types/transaction';
import { TRANSACTION_INTENT_KEY, type TransactionIntent } from '../QuickTransactionMenu';

// Re-export related components
export { DynamicIsland, DynamicIslandCompact } from './DynamicIsland';
export { ContextualActions, FloatingActionButton } from './ContextualActions';

// ============================================================================
// Haptic Feedback Utility
// ============================================================================

function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  }
}

// ============================================================================
// Types
// ============================================================================

interface MobileNavigationProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  page: Page;
  isMain?: boolean;
}

interface QuickAction {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
  action: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const PERSONAL_NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: Home, label: 'Início', page: 'dashboard-summary' },
  { id: 'cashflow', icon: CalendarClock, label: 'Fluxo', page: 'cashflow-future' },
  { id: 'add', icon: PlusCircle, label: 'Novo', page: 'transactions-new', isMain: true },
  { id: 'history', icon: LayoutList, label: 'Extrato', page: 'transactions-history' },
  { id: 'accounts', icon: WalletCards, label: 'Contas', page: 'accounts-list' },
];

const PLANNER_NAV_ITEMS: NavItem[] = [
  { id: 'clients', icon: Users, label: 'Clientes', page: 'planner-clients' },
  { id: 'add', icon: PlusCircle, label: 'Novo', page: 'transactions-new', isMain: true },
  { id: 'cashflow', icon: CalendarClock, label: 'Fluxo', page: 'cashflow-future' },
];

const MORE_ITEMS_PERSONAL: NavItem[] = [
  { id: 'goals', icon: Target, label: 'Metas', page: 'dashboard-goals' },
  { id: 'budgets', icon: PieChart, label: 'Orçamento', page: 'budgets' },
  { id: 'equity', icon: Landmark, label: 'Patrimônio', page: 'equity-list' },
  { id: 'debts', icon: BanknoteX, label: 'Dívidas', page: 'debts' },
  { id: 'params', icon: Boxes, label: 'Config', page: 'params-categories' },
  { id: 'profile', icon: User, label: 'Perfil', page: 'profile' },
];

const MORE_ITEMS_PLANNER: NavItem[] = [
  { id: 'profile', icon: User, label: 'Perfil', page: 'profile' },
];

// ============================================================================
// Animated Background Blur
// ============================================================================

function AnimatedBackdrop({ isExpanded }: { isExpanded: boolean }) {
  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        />
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Dynamic Island - Quick Actions Pill
// ============================================================================

interface QuickActionsPillProps {
  isExpanded: boolean;
  onClose: () => void;
  onAction: (intent: TransactionIntent) => void;
  accentColor: string;
}

function QuickActionsPill({ isExpanded, onClose, onAction, accentColor }: QuickActionsPillProps) {
  const actions: QuickAction[] = [
    { 
      id: 'expense', 
      icon: ArrowDownCircle, 
      label: 'Despesa', 
      color: 'text-rose-500',
      action: () => onAction({ tab: 'TRANSACTION', type: TransactionType.EXPENSE })
    },
    { 
      id: 'income', 
      icon: ArrowUpCircle, 
      label: 'Receita', 
      color: 'text-emerald-500',
      action: () => onAction({ tab: 'TRANSACTION', type: TransactionType.INCOME })
    },
    { 
      id: 'transfer', 
      icon: ArrowRightLeft, 
      label: 'Transf.', 
      color: accentColor,
      action: () => onAction({ tab: 'TRANSFER' })
    },
    { 
      id: 'investment', 
      icon: PiggyBank, 
      label: 'Aplicação', 
      color: 'text-amber-500',
      action: () => onAction({ tab: 'INVESTMENT' })
    },
  ];

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-zinc-200/60 rounded-2xl shadow-2xl shadow-zinc-300/30 p-2 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 mb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Nova movimentação
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            
            {/* Actions Grid */}
            <div className="grid grid-cols-4 gap-1 p-1">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 active:scale-95 transition-all"
                >
                  <action.icon className={cn("w-6 h-6", action.color)} />
                  <span className="text-[10px] font-medium text-zinc-600">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Arrow pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-zinc-200/60 rotate-45" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// More Menu - Expandable Grid
// ============================================================================

interface MoreMenuProps {
  isExpanded: boolean;
  onClose: () => void;
  items: NavItem[];
  onNavigate: (page: Page) => void;
  currentPage: Page;
  accentColor: string;
}

function MoreMenu({ isExpanded, onClose, items, onNavigate, currentPage, accentColor }: MoreMenuProps) {
  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-full right-0 mb-3 z-50"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-zinc-200/60 rounded-2xl shadow-2xl shadow-zinc-300/30 p-2 min-w-[200px]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 mb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Mais opções
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            
            {/* Items List */}
            <div className="grid grid-cols-3 gap-1 p-1">
              {items.map((item, index) => {
                const isActive = currentPage === item.page;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      onNavigate(item.page);
                      onClose();
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95",
                      isActive 
                        ? "bg-zinc-100" 
                        : "hover:bg-zinc-50 active:bg-zinc-100"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5",
                      isActive ? accentColor : "text-zinc-500"
                    )} />
                    <span className={cn(
                      "text-[10px] font-medium",
                      isActive ? "text-zinc-900" : "text-zinc-600"
                    )}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Nav Item Button
// ============================================================================

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  accentColor: string;
  accentBg: string;
  onClick: () => void;
  isMain?: boolean;
}

function NavItemButton({ item, isActive, accentColor, accentBg, onClick, isMain }: NavItemButtonProps) {
  const springConfig = { damping: 20, stiffness: 300 };
  const scale = useSpring(1, springConfig);
  
  if (isMain) {
    return (
      <motion.button
        onClick={onClick}
        onTapStart={() => scale.set(0.9)}
        onTap={() => scale.set(1)}
        onTapCancel={() => scale.set(1)}
        style={{ scale }}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 -mt-5 rounded-full shadow-lg transition-colors",
          accentBg
        )}
      >
        <item.icon className="w-6 h-6 text-white" />
        
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-full opacity-40 blur-xl -z-10",
          accentBg
        )} />
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      onTapStart={() => scale.set(0.9)}
      onTap={() => scale.set(1)}
      onTapCancel={() => scale.set(1)}
      style={{ scale }}
      className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[60px]"
    >
      <div className="relative">
        <item.icon className={cn(
          "w-6 h-6 transition-colors",
          isActive ? accentColor : "text-zinc-400"
        )} />
        
        {/* Active indicator dot */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                accentBg
              )}
            />
          )}
        </AnimatePresence>
      </div>
      
      <span className={cn(
        "text-[10px] font-medium transition-colors",
        isActive ? "text-zinc-900" : "text-zinc-400"
      )}>
        {item.label}
      </span>
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MobileNavigation({ onNavigate, currentPage }: MobileNavigationProps) {
  const { user } = useUser();
  const isPlanner = user?.type === 'PLANNER';
  
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  // Theme colors based on user type
  const theme = useMemo(() => ({
    accentColor: isPlanner ? 'text-emerald-500' : 'text-blue-500',
    accentBg: isPlanner ? 'bg-emerald-500' : 'bg-blue-500',
    accentHover: isPlanner ? 'hover:bg-emerald-600' : 'hover:bg-blue-600',
  }), [isPlanner]);

  // Navigation items based on user type
  const navItems = isPlanner ? PLANNER_NAV_ITEMS : PERSONAL_NAV_ITEMS;
  const moreItems = isPlanner ? MORE_ITEMS_PLANNER : MORE_ITEMS_PERSONAL;

  // Handle transaction intent
  const handleTransactionIntent = useCallback((intent: TransactionIntent) => {
    triggerHaptic('medium');
    sessionStorage.setItem(TRANSACTION_INTENT_KEY, JSON.stringify(intent));
    onNavigate('transactions-new');
  }, [onNavigate]);

  // Handle main button click
  const handleMainClick = useCallback(() => {
    triggerHaptic('light');
    setQuickActionsOpen(prev => !prev);
    setMoreMenuOpen(false);
  }, []);

  // Handle more button click  
  const handleMoreClick = useCallback(() => {
    triggerHaptic('light');
    setMoreMenuOpen(prev => !prev);
    setQuickActionsOpen(false);
  }, []);

  // Close all menus
  const closeAllMenus = useCallback(() => {
    setQuickActionsOpen(false);
    setMoreMenuOpen(false);
  }, []);

  // Close menus on navigation
  const handleNavigate = useCallback((page: Page) => {
    triggerHaptic('light');
    closeAllMenus();
    onNavigate(page);
  }, [closeAllMenus, onNavigate]);

  const isExpanded = quickActionsOpen || moreMenuOpen;

  return (
    <>
      {/* Backdrop blur when expanded */}
      <AnimatedBackdrop isExpanded={isExpanded} />
      
      {/* Click outside to close */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeAllMenus}
        />
      )}

      {/* Accessibility announcer */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {quickActionsOpen && 'Menu de ações rápidas aberto'}
        {moreMenuOpen && 'Menu de mais opções aberto'}
      </div>

      {/* Main Dock */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        role="navigation"
        aria-label="Navegação principal"
      >
        {/* Safe area spacer for notch devices */}
        <div className="relative">
          {/* Quick Actions Pill */}
          <QuickActionsPill
            isExpanded={quickActionsOpen}
            onClose={() => setQuickActionsOpen(false)}
            onAction={handleTransactionIntent}
            accentColor={theme.accentColor}
          />
          
          {/* More Menu */}
          <MoreMenu
            isExpanded={moreMenuOpen}
            onClose={() => setMoreMenuOpen(false)}
            items={moreItems}
            onNavigate={handleNavigate}
            currentPage={currentPage}
            accentColor={theme.accentColor}
          />

          {/* Dock Container */}
          <motion.div
            layout
            className={cn(
              "mx-4 mb-4 bg-white/90 backdrop-blur-xl border border-zinc-200/60 rounded-[28px] shadow-2xl shadow-zinc-300/40",
              "pb-safe" // Safe area for home indicator
            )}
          >
            {/* Navigation Items */}
            <div className="flex items-center justify-around px-2 py-1">
              {navItems.map((item) => (
                <NavItemButton
                  key={item.id}
                  item={item}
                  isActive={currentPage === item.page}
                  accentColor={theme.accentColor}
                  accentBg={theme.accentBg}
                  onClick={item.isMain ? handleMainClick : () => handleNavigate(item.page)}
                  isMain={item.isMain}
                />
              ))}
              
              {/* More button */}
              <motion.button
                onClick={handleMoreClick}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[60px]"
                animate={{ rotate: moreMenuOpen ? 180 : 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <ChevronUp className={cn(
                  "w-5 h-5 transition-colors",
                  moreMenuOpen ? theme.accentColor : "text-zinc-400"
                )} />
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  moreMenuOpen ? "text-zinc-900" : "text-zinc-400"
                )}>
                  Mais
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </nav>
    </>
  );
}

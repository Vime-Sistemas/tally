import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Trash2, Pencil, Check, Repeat, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Transaction } from '../../../types/transaction';
import { TransactionType } from '../../../types/transaction';
import { formatCurrency } from '../../../utils/formatters';

// ============================================================================
// Types
// ============================================================================

interface SwipeableItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onClick: (transaction: Transaction) => void;
  categoryIcon: React.ReactNode;
  categoryLabel: string;
  isSelected?: boolean;
  onSelect?: (transaction: Transaction, selected: boolean) => void;
  selectionMode?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SWIPE_THRESHOLD = 80;
const DELETE_THRESHOLD = 150;
const SPRING_CONFIG = { type: 'spring' as const, stiffness: 500, damping: 35 };

// ============================================================================
// Haptic Feedback
// ============================================================================

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[type]);
  }
};

// ============================================================================
// Component
// ============================================================================

export function SwipeableTransactionItem({
  transaction,
  onEdit,
  onDelete,
  onClick,
  categoryIcon,
  categoryLabel,
  isSelected = false,
  onSelect,
  selectionMode = false,
}: SwipeableItemProps) {
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  
  // Transform values for action buttons
  const leftActionOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rightActionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const deleteScale = useTransform(x, [-DELETE_THRESHOLD, -SWIPE_THRESHOLD], [1.2, 1]);
  
  // Handle drag end
  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Swipe right = edit
    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      setIsOpen('right');
      triggerHaptic('light');
    }
    // Swipe left = delete
    else if (offset < -DELETE_THRESHOLD || velocity < -800) {
      setIsDeleting(true);
      triggerHaptic('heavy');
      setTimeout(() => onDelete(transaction), 300);
    }
    else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      setIsOpen('left');
      triggerHaptic('light');
    }
    else {
      setIsOpen(null);
    }
  };

  // Handle selection in bulk mode
  const handleToggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      triggerHaptic('light');
      onSelect(transaction, !isSelected);
    }
  };

  // Handle item click
  const handleClick = () => {
    if (selectionMode && onSelect) {
      triggerHaptic('light');
      onSelect(transaction, !isSelected);
    } else if (isOpen) {
      setIsOpen(null);
    } else {
      onClick(transaction);
    }
  };

  // Handle edit action
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onEdit(transaction);
    setIsOpen(null);
  };

  // Handle delete action
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    setIsDeleting(true);
    setTimeout(() => onDelete(transaction), 300);
  };

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
          className="relative mb-3"
        >
          {/* Background Actions */}
          <div className="absolute inset-0 flex items-center justify-between rounded-2xl overflow-hidden">
            {/* Left Action (Edit) - revealed on swipe right */}
            <motion.div 
              style={{ opacity: leftActionOpacity }}
              className="absolute left-0 h-full flex items-center pl-4 bg-blue-500 rounded-l-2xl"
            >
              <button
                onClick={handleEdit}
                className="flex flex-col items-center justify-center w-16 h-full text-white"
              >
                <Pencil className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Editar</span>
              </button>
            </motion.div>

            {/* Right Action (Delete) - revealed on swipe left */}
            <motion.div 
              style={{ opacity: rightActionOpacity, scale: deleteScale }}
              className="absolute right-0 h-full flex items-center pr-4 bg-red-500 rounded-r-2xl"
            >
              <button
                onClick={handleDelete}
                className="flex flex-col items-center justify-center w-16 h-full text-white"
              >
                <Trash2 className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Excluir</span>
              </button>
            </motion.div>
          </div>

          {/* Main Content (Draggable) */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -DELETE_THRESHOLD, right: SWIPE_THRESHOLD + 20 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            animate={{ 
              x: isOpen === 'left' ? -SWIPE_THRESHOLD : isOpen === 'right' ? SWIPE_THRESHOLD : 0 
            }}
            transition={SPRING_CONFIG}
            style={{ x }}
            onClick={handleClick}
            className={cn(
              "relative flex items-center gap-4 p-4 bg-white border rounded-2xl shadow-sm",
              "active:cursor-grabbing touch-pan-y",
              selectionMode && isSelected 
                ? "border-blue-500 bg-blue-50/50" 
                : "border-zinc-100 hover:border-zinc-200"
            )}
          >
            {/* Selection Checkbox */}
            {selectionMode && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={handleToggleSelect}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected 
                    ? "bg-blue-500 border-blue-500" 
                    : "border-zinc-300"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </motion.button>
            )}

            {/* Category Icon */}
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
              transaction.type === TransactionType.INCOME 
                ? "bg-blue-50 text-blue-500" 
                : "bg-zinc-100 text-zinc-500"
            )}>
              {categoryIcon}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-zinc-900 truncate text-sm">
                  {transaction.description}
                </p>
                {transaction.isPaid && (
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" title="Pago" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="truncate">{categoryLabel}</span>
                {transaction.installments && transaction.currentInstallment && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    <span>{transaction.currentInstallment}/{transaction.installments}</span>
                  </>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <p className={cn(
                "font-bold text-sm tabular-nums",
                transaction.type === TransactionType.INCOME 
                  ? "text-blue-500" 
                  : "text-zinc-900"
              )}>
                {transaction.type === TransactionType.INCOME ? "+" : "-"} 
                {formatCurrency(transaction.amount)}
              </p>
              {transaction.recurringTransactionId && (
                <div className="flex items-center justify-end gap-1 mt-0.5 text-xs text-blue-500 font-medium">
                  <Repeat className="h-3 w-3" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Swipe Hint (shows briefly on first load) */}
          {isOpen && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-1.5 bg-white/80 rounded-full shadow-sm"
              onClick={() => setIsOpen(null)}
            >
              <X className="w-4 h-4 text-zinc-400" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

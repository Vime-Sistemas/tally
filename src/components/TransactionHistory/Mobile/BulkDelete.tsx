import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';

// ============================================================================
// Types
// ============================================================================

interface BulkDeleteBarProps {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

// BulkDeleteManagerProps foi movido para o hook useBulkDelete

// ============================================================================
// Haptic Feedback
// ============================================================================

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30] };
    navigator.vibrate(patterns[type]);
  }
};

// ============================================================================
// Bulk Delete Action Bar
// ============================================================================

export function BulkDeleteBar({ selectedCount, onCancel, onDelete, isDeleting }: BulkDeleteBarProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    triggerHaptic('medium');
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    triggerHaptic('heavy');
    await onDelete();
    setShowConfirm(false);
  };

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <div className="bg-zinc-900 text-white rounded-2xl shadow-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  key={selectedCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-sm font-bold">{selectedCount}</span>
                </motion.div>
                <span className="text-sm font-medium">
                  {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {isDeleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="w-[90%] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">
              Excluir {selectedCount} {selectedCount === 1 ? 'transação' : 'transações'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Esta ação não pode ser desfeita. As transações serão permanentemente removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1 rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-500 hover:bg-red-600 rounded-xl"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Selection Mode Header
// ============================================================================

interface SelectionHeaderProps {
  isActive: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClose: () => void;
}

export function SelectionHeader({
  isActive,
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onClose,
}: SelectionHeaderProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  const handleToggleAll = () => {
    triggerHaptic('light');
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between py-3 px-2 bg-blue-50 rounded-xl mb-3">
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-2 text-sm font-medium text-blue-600"
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                allSelected 
                  ? "bg-blue-500 border-blue-500" 
                  : "border-blue-300"
              )}>
                {allSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>

            <button
              onClick={onClose}
              className="text-sm font-medium text-zinc-500"
            >
              Concluir
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Bulk Delete Manager Hook
// ============================================================================

export function useBulkDelete() {
  const [isActive, setIsActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const activate = useCallback(() => {
    triggerHaptic('light');
    setIsActive(true);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDelete = useCallback(async (deleteFunction: (ids: string[]) => Promise<void>) => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteFunction(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsActive(false);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds]);

  return {
    isActive,
    selectedIds,
    selectedCount: selectedIds.size,
    isDeleting,
    activate,
    deactivate,
    toggleSelect,
    selectAll,
    deselectAll,
    handleDelete,
    isSelected: (id: string) => selectedIds.has(id),
  };
}

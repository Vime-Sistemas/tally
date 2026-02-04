import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUser } from '../../contexts/UserContext';
import { TransactionType } from '../../types/transaction';
import { type TransactionIntent } from '../QuickTransactionMenu';
import { CategoryStep } from './CategoryStep';
import { AccountStep } from './AccountStep';
import { ConfirmStep } from './ConfirmStep';

// ============================================================================
// Types
// ============================================================================

export type WizardTab = 'TRANSACTION' | 'TRANSFER' | 'INVESTMENT';
export type TransactionTypeValue = typeof TransactionType.INCOME | typeof TransactionType.EXPENSE;

export interface WizardData {
  tab: WizardTab;
  type?: TransactionTypeValue;
  amount?: number;
  description?: string;
  category?: string;
  accountId?: string;
  cardId?: string;
  equityId?: string;
  date?: string;
  installments?: number;
  isRecurring?: boolean;
  frequency?: string;
  endDate?: string;
  // Transfer specific
  fromAccountId?: string;
  toAccountId?: string;
}

interface TransactionWizardProps {
  onComplete: (data: WizardData) => Promise<void>;
  onCancel: () => void;
  initialIntent?: TransactionIntent;
}

// ============================================================================
// Constants
// ============================================================================

const STEPS = {
  TRANSACTION: ['type', 'amount', 'category', 'account', 'confirm'] as const,
  TRANSFER: ['amount', 'accounts', 'confirm'] as const,
  INVESTMENT: ['amount', 'equity', 'account', 'confirm'] as const,
};

// ============================================================================
// Step Indicator
// ============================================================================

interface StepIndicatorProps {
  steps: readonly string[];
  currentStep: number;
  isPlanner: boolean;
}

function StepIndicator({ steps, currentStep, isPlanner }: StepIndicatorProps) {
  const accentColor = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((_, index) => (
        <motion.div
          key={index}
          initial={false}
          animate={{
            width: index === currentStep ? 24 : 8,
            opacity: index <= currentStep ? 1 : 0.3,
          }}
          className={cn(
            "h-2 rounded-full transition-colors",
            index <= currentStep ? accentColor : "bg-zinc-200"
          )}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Header
// ============================================================================

interface WizardHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  canGoBack: boolean;
  isPlanner: boolean;
}

function WizardHeader({ title, subtitle, onBack, canGoBack }: WizardHeaderProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-100">
      <motion.button
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(
          "p-2 rounded-full transition-all",
          canGoBack 
            ? "hover:bg-zinc-100 active:scale-95" 
            : "opacity-0 pointer-events-none"
        )}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowLeft className="w-5 h-5 text-zinc-600" />
      </motion.button>
      
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Type Selection Step
// ============================================================================

interface TypeStepProps {
  onSelect: (type: TransactionTypeValue) => void;
  isPlanner: boolean;
}

function TypeStep({ onSelect }: TypeStepProps) {
  const options = [
    {
      type: TransactionType.EXPENSE as TransactionTypeValue,
      icon: ArrowDownCircle,
      label: 'Despesa',
      description: 'Registrar um gasto',
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      borderActive: 'border-rose-500',
    },
    {
      type: TransactionType.INCOME as TransactionTypeValue,
      icon: ArrowUpCircle,
      label: 'Receita',
      description: 'Registrar entrada',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      borderActive: 'border-emerald-500',
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-zinc-900">Qual o tipo?</h3>
        <p className="text-zinc-500 mt-1">Selecione o tipo de transação</p>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <motion.button
            key={option.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(option.type)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100",
              "hover:border-zinc-200 active:scale-[0.98] transition-all",
              option.bg
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-white shadow-sm"
            )}>
              <option.icon className={cn("w-6 h-6", option.color)} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-zinc-900">{option.label}</p>
              <p className="text-sm text-zinc-500">{option.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Amount Step
// ============================================================================

interface AmountStepProps {
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  transactionType?: TransactionTypeValue;
  isPlanner: boolean;
}

function AmountStep({ 
  value, 
  onChange, 
  onNext, 
  description, 
  onDescriptionChange,
  transactionType,
  isPlanner 
}: AmountStepProps) {
  const [inputValue, setInputValue] = useState(value ? String(Math.round(value * 100)) : '');
  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';

  const displayValue = useMemo(() => {
    const num = parseInt(inputValue || '0', 10);
    return (num / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }, [inputValue]);

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'backspace') {
      setInputValue(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setInputValue('');
    } else if (/^\d$/.test(key)) {
      setInputValue(prev => {
        const newValue = prev + key;
        // Limit to reasonable amount (99,999,999.99)
        if (parseInt(newValue, 10) > 9999999999) return prev;
        return newValue;
      });
    }
  }, []);

  useEffect(() => {
    const num = parseInt(inputValue || '0', 10);
    onChange(num / 100);
  }, [inputValue, onChange]);

  const isValid = parseInt(inputValue || '0', 10) > 0 && description.length >= 3;
  const typeColor = transactionType === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div className="flex flex-col h-full">
      {/* Amount Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.p
          key={displayValue}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "text-4xl font-bold tabular-nums",
            parseInt(inputValue || '0', 10) > 0 ? typeColor : "text-zinc-300"
          )}
        >
          {displayValue}
        </motion.p>
        
        {/* Description Input */}
        <div className="w-full max-w-xs mt-6">
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Descrição (ex: Almoço)"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200",
                "text-center text-zinc-900 placeholder:text-zinc-400",
                "focus:outline-none focus:ring-2",
                isPlanner ? "focus:ring-emerald-500/20 focus:border-emerald-500" : "focus:ring-blue-500/20 focus:border-blue-500"
              )}
            />
          </div>
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="bg-zinc-50 p-4 rounded-t-3xl">
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleKeyPress(key)}
              className={cn(
                "h-14 rounded-xl font-semibold text-xl transition-colors",
                key === 'clear' || key === 'backspace'
                  ? "text-zinc-500 text-base"
                  : "text-zinc-900 bg-white shadow-sm active:bg-zinc-100"
              )}
            >
              {key === 'backspace' ? '⌫' : key === 'clear' ? 'C' : key}
            </motion.button>
          ))}
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={onNext}
          disabled={!isValid}
          className={cn(
            "w-full mt-4 py-4 rounded-xl font-semibold text-white transition-all",
            isValid 
              ? cn(accentBg, "active:scale-[0.98]") 
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          )}
          whileTap={isValid ? { scale: 0.98 } : {}}
        >
          Continuar
        </motion.button>
      </div>
    </div>
  );
}

// ============================================================================
// Exports for sub-steps (will be implemented in separate files)
// ============================================================================

export { TypeStep, AmountStep, StepIndicator, WizardHeader };

// ============================================================================
// Main Wizard Component
// ============================================================================

export function TransactionWizard({ onComplete, onCancel, initialIntent }: TransactionWizardProps) {
  const { user } = useUser();
  const isPlanner = user?.type === 'PLANNER';
  
  // Wizard state
  const [currentTab, ] = useState<WizardTab>(initialIntent?.tab || 'TRANSACTION');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [data, setData] = useState<WizardData>({
    tab: initialIntent?.tab || 'TRANSACTION',
    type: initialIntent?.type,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const steps = STEPS[currentTab];
  const currentStep = steps[currentStepIndex];

  // Navigation
  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, steps.length]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      onCancel();
    }
  }, [currentStepIndex, onCancel]);

  // Update data
  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle type selection and auto-advance
  const handleTypeSelect = useCallback((type: TransactionTypeValue) => {
    updateData({ type });
    goNext();
  }, [updateData, goNext]);

  // Get step title
  const getStepTitle = useCallback(() => {
    switch (currentStep) {
      case 'type': return 'Tipo de Transação';
      case 'amount': return 'Valor';
      case 'category': return 'Categoria';
      case 'account': return 'Conta';
      case 'accounts': return 'Contas';
      case 'equity': return 'Ativo';
      case 'confirm': return 'Confirmar';
      default: return 'Nova Transação';
    }
  }, [currentStep]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onComplete]);

  // If initial intent has type, skip type step
  useEffect(() => {
    if (initialIntent?.type && currentStep === 'type') {
      updateData({ type: initialIntent.type });
      goNext();
    }
  }, [initialIntent, currentStep, updateData, goNext]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
      {/* Header */}
      <WizardHeader
        title={getStepTitle()}
        onBack={goBack}
        canGoBack={true}
        isPlanner={isPlanner}
      />

      {/* Progress */}
      <StepIndicator
        steps={steps}
        currentStep={currentStepIndex}
        isPlanner={isPlanner}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {currentStep === 'type' && (
              <TypeStep 
                onSelect={handleTypeSelect}
                isPlanner={isPlanner}
              />
            )}
            
            {currentStep === 'amount' && (
              <AmountStep
                value={data.amount || 0}
                onChange={(amount) => updateData({ amount })}
                onNext={goNext}
                description={data.description || ''}
                onDescriptionChange={(description) => updateData({ description })}
                transactionType={data.type}
                isPlanner={isPlanner}
              />
            )}

            {currentStep === 'category' && data.type && (
              <CategoryStep
                transactionType={data.type}
                value={data.category || ''}
                onChange={(category) => updateData({ category })}
                onNext={goNext}
                isPlanner={isPlanner}
              />
            )}

            {currentStep === 'account' && data.type && (
              <AccountStep
                transactionType={data.type}
                amount={data.amount || 0}
                value={data.cardId ? `card_${data.cardId}` : data.accountId || ''}
                onChange={(value, isCard) => {
                  if (isCard) {
                    updateData({ cardId: value.replace('card_', ''), accountId: undefined });
                  } else {
                    updateData({ accountId: value, cardId: undefined });
                  }
                }}
                onNext={goNext}
                isPlanner={isPlanner}
              />
            )}

            {currentStep === 'confirm' && (
              <ConfirmStep
                data={data}
                onConfirm={handleSubmit}
                onEdit={(step) => {
                  const stepIndex = steps.indexOf(step as any);
                  if (stepIndex >= 0) {
                    setCurrentStepIndex(stepIndex);
                  }
                }}
                isSubmitting={isSubmitting}
                isPlanner={isPlanner}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

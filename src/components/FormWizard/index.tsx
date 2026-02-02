import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isOptional?: boolean;
  validate?: () => boolean | Promise<boolean>;
}

interface WizardContextValue {
  currentStep: number;
  steps: WizardStep[];
  data: Record<string, any>;
  setData: (key: string, value: any) => void;
  updateData: (updates: Record<string, any>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a FormWizard');
  }
  return context;
}

// ============================================================================
// Auto-save Hook
// ============================================================================

const AUTOSAVE_KEY_PREFIX = 'wizard_autosave_';

function useAutoSave(wizardId: string, data: Record<string, any>, enabled: boolean) {
  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!enabled) return;
    const key = `${AUTOSAVE_KEY_PREFIX}${wizardId}`;
    localStorage.setItem(key, JSON.stringify(data));
  }, [wizardId, data, enabled]);
}

function getAutoSavedData(wizardId: string): Record<string, any> | null {
  const key = `${AUTOSAVE_KEY_PREFIX}${wizardId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

function clearAutoSavedData(wizardId: string) {
  const key = `${AUTOSAVE_KEY_PREFIX}${wizardId}`;
  localStorage.removeItem(key);
}

// ============================================================================
// Progress Indicator
// ============================================================================

interface ProgressIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  allowNavigation?: boolean;
}

function ProgressIndicator({ 
  steps, 
  currentStep, 
  onStepClick,
  allowNavigation = false 
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = allowNavigation && index <= currentStep;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <motion.button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(index)}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                isCompleted && "bg-blue-400 border-blue-400 text-white",
                isCurrent && "border-blue-400 bg-white text-blue-400",
                !isCompleted && !isCurrent && "border-zinc-200 bg-white text-zinc-400",
                isClickable && "cursor-pointer hover:scale-105",
                !isClickable && "cursor-default"
              )}
              whileHover={isClickable ? { scale: 1.05 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
            >
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.span
                    key="number"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-semibold"
                  >
                    {index + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="relative w-12 h-0.5 mx-1">
                <div className="absolute inset-0 bg-zinc-200 rounded-full" />
                <motion.div
                  className="absolute inset-0 bg-blue-400 rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Step Header
// ============================================================================

interface StepHeaderProps {
  step: WizardStep;
  stepNumber: number;
  totalSteps: number;
}

function StepHeader({ step, stepNumber, totalSteps }: StepHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-6"
    >
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 uppercase tracking-wider mb-2">
        <span>Passo {stepNumber} de {totalSteps}</span>
        {step.isOptional && (
          <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-500">Opcional</span>
        )}
      </div>
      <h2 className="text-xl font-semibold text-zinc-900">{step.title}</h2>
      {step.description && (
        <p className="text-sm text-zinc-500 mt-1">{step.description}</p>
      )}
    </motion.div>
  );
}

// ============================================================================
// Navigation Buttons
// ============================================================================

interface NavigationProps {
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  nextLabel?: string;
  submitLabel?: string;
  canProceed?: boolean;
}

function Navigation({
  onPrev,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  isSubmitting,
  nextLabel = "Continuar",
  submitLabel = "Concluir",
  canProceed = true,
}: NavigationProps) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
      <Button
        type="button"
        variant="ghost"
        onClick={onPrev}
        disabled={isFirstStep || isSubmitting}
        className={cn(
          "gap-2 text-zinc-600",
          isFirstStep && "invisible"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </Button>

      {isLastStep ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !canProceed}
          className="gap-2 bg-blue-400 hover:bg-blue-500 text-white min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              {submitLabel}
              <Check className="w-4 h-4" />
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting || !canProceed}
          className="gap-2 bg-blue-400 hover:bg-blue-500 text-white min-w-[140px]"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Main FormWizard Component
// ============================================================================

interface FormWizardProps {
  wizardId: string;
  steps: WizardStep[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  children: React.ReactNode;
  submitLabel?: string;
  allowStepNavigation?: boolean;
  autoSave?: boolean;
  className?: string;
}

export function FormWizard({
  wizardId,
  steps,
  initialData = {},
  onSubmit,
  onCancel,
  children,
  submitLabel = "Concluir",
  allowStepNavigation = true,
  autoSave = true,
  className,
}: FormWizardProps) {
  // Try to restore auto-saved data
  const savedData = autoSave ? getAutoSavedData(wizardId) : null;
  const mergedInitialData = savedData ? { ...initialData, ...savedData } : initialData;

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setDataState] = useState<Record<string, any>>(mergedInitialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  // Auto-save hook
  useAutoSave(wizardId, data, autoSave);

  const setData = useCallback((key: string, value: any) => {
    setDataState(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateData = useCallback((updates: Record<string, any>) => {
    setDataState(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(async () => {
    const step = steps[currentStep];
    if (step.validate) {
      const isValid = await step.validate();
      if (!isValid) return;
    }
    
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index <= currentStep) {
      setDirection(index > currentStep ? 1 : -1);
      setCurrentStep(index);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    const step = steps[currentStep];
    if (step.validate) {
      const isValid = await step.validate();
      if (!isValid) return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // Clear auto-saved data on successful submit
      if (autoSave) {
        clearAutoSavedData(wizardId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextValue: WizardContextValue = {
    currentStep,
    steps,
    data,
    setData,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    isSubmitting,
  };

  // Animation variants for step transitions
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  // Get children as array and render current step
  const childrenArray = Array.isArray(children) ? children : [children];
  const currentChild = childrenArray[currentStep];

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={cn("w-full max-w-lg mx-auto", className)}>
        {/* Progress Indicator */}
        <ProgressIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
          allowNavigation={allowStepNavigation}
        />

        {/* Step Header */}
        <StepHeader
          step={steps[currentStep]}
          stepNumber={currentStep + 1}
          totalSteps={steps.length}
        />

        {/* Step Content with Animation */}
        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {currentChild}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <Navigation
          onPrev={prevStep}
          onNext={nextStep}
          onSubmit={handleSubmit}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === steps.length - 1}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
        />

        {/* Cancel Button */}
        {onCancel && (
          <div className="text-center mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-zinc-400 hover:text-zinc-600"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </WizardContext.Provider>
  );
}

// ============================================================================
// Step Wrapper Component
// ============================================================================

interface WizardStepContentProps {
  children: React.ReactNode;
  className?: string;
}

export function WizardStepContent({ children, className }: WizardStepContentProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

// Export utilities
export { clearAutoSavedData, getAutoSavedData };

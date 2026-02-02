import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

import { WelcomeStep } from './WelcomeStep';
import { AccountStep, type AccountFormData } from './AccountStep';
import { CardStep, type CardFormData } from './CardStep';
import { CategoryStep, CATEGORY_PRESETS, iconMap } from './CategoryStep';
import { PreferencesStep } from './PreferencesStep';
import { CompletionStep } from './CompletionStep';

import { createAccount, createCard, createCategory, updateUser, completeOnboarding } from '../../services/api';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

type OnboardingStep = 
  | 'welcome' 
  | 'accounts' 
  | 'cards' 
  | 'categories' 
  | 'preferences' 
  | 'completion';

interface OnboardingData {
  accounts: AccountFormData[];
  cards: CardFormData[];
  selectedCategories: string[];
  menuPreference: 'header' | 'sidebar';
}

interface OnboardingWizardProps {
  userName?: string;
  onComplete: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: 'accounts', label: 'Contas' },
  { id: 'cards', label: 'Cartões' },
  { id: 'categories', label: 'Categorias' },
  { id: 'preferences', label: 'Estilo' },
];

const STORAGE_KEY = 'onboarding_progress';

// ============================================================================
// Progress Indicator Component
// ============================================================================

interface ProgressIndicatorProps {
  steps: typeof STEPS;
  currentIndex: number;
}

function ProgressIndicator({ steps, currentIndex }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 text-sm font-medium",
                isCompleted && "bg-blue-400 border-blue-400 text-white",
                isCurrent && "border-blue-400 bg-white text-blue-400",
                !isCompleted && !isCurrent && "border-zinc-200 bg-white text-zinc-400"
              )}
              animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </motion.div>

            {index < steps.length - 1 && (
              <div className="relative w-8 h-0.5 mx-1">
                <div className="absolute inset-0 bg-zinc-200 rounded-full" />
                <motion.div
                  className="absolute inset-0 bg-blue-400 rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
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
// Main OnboardingWizard Component
// ============================================================================

export function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize data from localStorage or defaults
  const [data, setData] = useState<OnboardingData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore errors
    }
    return {
      accounts: [],
      cards: [],
      selectedCategories: [],
      menuPreference: 'header' as const,
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Get current step index for progress
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  // Navigation handlers
  const goToStep = useCallback((step: OnboardingStep, dir: number = 1) => {
    setDirection(dir);
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const stepOrder: OnboardingStep[] = ['welcome', 'accounts', 'cards', 'categories', 'preferences', 'completion'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1], 1);
    }
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    const stepOrder: OnboardingStep[] = ['welcome', 'accounts', 'cards', 'categories', 'preferences', 'completion'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1], -1);
    }
  }, [currentStep, goToStep]);

  // Data update handlers
  const updateAccounts = useCallback((accounts: AccountFormData[]) => {
    setData(prev => ({ ...prev, accounts }));
  }, []);

  const updateCards = useCallback((cards: CardFormData[]) => {
    setData(prev => ({ ...prev, cards }));
  }, []);

  const updateCategories = useCallback((selectedCategories: string[]) => {
    setData(prev => ({ ...prev, selectedCategories }));
  }, []);

  const updateMenuPreference = useCallback((menuPreference: 'header' | 'sidebar') => {
    setData(prev => ({ ...prev, menuPreference }));
  }, []);

  // Validation
  const canProceedFromAccounts = data.accounts.filter(a => a.name.trim() !== '').length >= 1;

  // Submit all data
  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Create accounts
      const validAccounts = data.accounts.filter(a => a.name.trim() !== '');
      const createdAccounts: { id: string; name: string }[] = [];
      
      for (const account of validAccounts) {
        try {
          const result = await createAccount(account);
          createdAccounts.push({ id: result.id, name: account.name });
        } catch (error) {
          console.error('Error creating account:', error);
        }
      }

      // 2. Create cards (with account linking if possible)
      const validCards = data.cards.filter(c => c.name.trim() !== '');
      for (const card of validCards) {
        try {
          // Try to find matching account by temp ID
          let accountId: string | undefined;
          if (card.accountId?.startsWith('temp-')) {
            const tempIndex = parseInt(card.accountId.replace('temp-', ''));
            if (createdAccounts[tempIndex]) {
              accountId = createdAccounts[tempIndex].id;
            }
          }
          
          await createCard({
            ...card,
            accountId,
            currentInvoice: 0,
          } as any);
        } catch (error) {
          console.error('Error creating card:', error);
        }
      }

      // 3. Create categories
      for (const categoryId of data.selectedCategories) {
        const preset = CATEGORY_PRESETS.find(c => c.id === categoryId);
        if (preset) {
          try {
            await createCategory({
              name: preset.name,
              color: preset.color,
              icon: preset.icon,
            });
          } catch (error) {
            console.error('Error creating category:', error);
          }
        }
      }

      // 4. Update user preferences
      await updateUser({
        menuPreference: data.menuPreference,
      });

      // 5. Mark onboarding as complete
      await completeOnboarding();

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      toast.success('Configuração concluída com sucesso!');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep userName={userName} onStart={nextStep} />;
      
      case 'accounts':
        return (
          <AccountStep
            accounts={data.accounts}
            onAccountsChange={updateAccounts}
            minAccounts={1}
          />
        );
      
      case 'cards':
        return (
          <CardStep
            cards={data.cards}
            onCardsChange={updateCards}
            accounts={data.accounts}
            onSkip={nextStep}
          />
        );
      
      case 'categories':
        return (
          <CategoryStep
            selectedCategories={data.selectedCategories}
            onCategoriesChange={updateCategories}
            onSkip={nextStep}
          />
        );
      
      case 'preferences':
        return (
          <PreferencesStep
            menuPreference={data.menuPreference}
            onMenuPreferenceChange={updateMenuPreference}
          />
        );
      
      case 'completion':
        return (
          <CompletionStep
            accountsCount={data.accounts.filter(a => a.name.trim() !== '').length}
            cardsCount={data.cards.filter(c => c.name.trim() !== '').length}
            categoriesCount={data.selectedCategories.length}
            onFinish={handleFinish}
            isLoading={isSubmitting}
          />
        );
    }
  };

  // Show/hide navigation
  const showNavigation = !['welcome', 'completion'].includes(currentStep);
  const showProgress = !['welcome', 'completion'].includes(currentStep);

  // Can proceed checks
  const canProceed = () => {
    switch (currentStep) {
      case 'accounts':
        return canProceedFromAccounts;
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Progress Indicator */}
      {showProgress && <ProgressIndicator steps={STEPS} currentIndex={stepIndex} />}

      {/* Step Content */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={isSubmitting}
            className="gap-2 text-zinc-600"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>

          <Button
            type="button"
            onClick={nextStep}
            disabled={!canProceed() || isSubmitting}
            className="gap-2 bg-blue-400 hover:bg-blue-500 text-white min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export { CATEGORY_PRESETS, iconMap };

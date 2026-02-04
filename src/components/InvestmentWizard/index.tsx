import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  FileText,
  Wallet,
  Building2,
  CreditCard,
  ChevronRight,
  Check,
  Loader2,
  Calendar,
  TrendingUp,
  Landmark,
  Bitcoin,
  Home,
  PiggyBank,
  Globe,
  Coins,
  BarChart3,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUser } from '../../contexts/UserContext';
import { getAccounts } from '../../services/api';
import type { Account } from '../../types/account';

// ============================================================================
// Types
// ============================================================================

export interface InvestmentWizardData {
  amount: number;
  description: string;
  date: string;
  investmentType: string;
  sourceAccountId: string;
}

interface InvestmentWizardProps {
  onComplete: (data: InvestmentWizardData) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const STEPS = ['amount', 'type', 'account', 'confirm'] as const;
type StepType = typeof STEPS[number];

const INVESTMENT_TYPES = [
  { key: 'STOCKS', label: 'Ações', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'REAL_ESTATE_FUNDS', label: 'Fundos Imobiliários', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50' },
  { key: 'CRYPTO', label: 'Criptomoedas', icon: Bitcoin, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'BONDS', label: 'Títulos Públicos', icon: Landmark, color: 'text-green-500', bg: 'bg-green-50' },
  { key: 'PRIVATE_BONDS', label: 'CDB, LCI, LCA', icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { key: 'MUTUAL_FUND', label: 'Fundos de Investimento', icon: BarChart3, color: 'text-teal-500', bg: 'bg-teal-50' },
  { key: 'ETF', label: 'ETFs', icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { key: 'PENSION', label: 'Previdência Privada', icon: PiggyBank, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'SAVINGS', label: 'Poupança', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { key: 'REAL_ESTATE', label: 'Imóveis', icon: Home, color: 'text-rose-500', bg: 'bg-rose-50' },
  { key: 'FOREIGN_INVESTMENT', label: 'Investimentos Exterior', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'CASH', label: 'Reserva Emergência', icon: Wallet, color: 'text-zinc-500', bg: 'bg-zinc-100' },
];

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
// Amount Step
// ============================================================================

interface AmountStepProps {
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  isPlanner: boolean;
}

function AmountStep({ 
  value, 
  onChange, 
  onNext, 
  description, 
  onDescriptionChange,
  date,
  onDateChange,
  isPlanner 
}: AmountStepProps) {
  const [inputValue, setInputValue] = useState(value ? String(Math.round(value * 100)) : '');
  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  const accentFocus = isPlanner ? 'focus:ring-emerald-500/20 focus:border-emerald-500' : 'focus:ring-blue-500/20 focus:border-blue-500';

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
        if (parseInt(newValue, 10) > 9999999999) return prev;
        return newValue;
      });
    }
  }, []);

  useEffect(() => {
    const num = parseInt(inputValue || '0', 10);
    onChange(num / 100);
  }, [inputValue, onChange]);

  const isValid = parseInt(inputValue || '0', 10) > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Amount Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        
        <motion.p
          key={displayValue}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "text-4xl font-bold tabular-nums",
            parseInt(inputValue || '0', 10) > 0 ? "text-emerald-500" : "text-zinc-300"
          )}
        >
          {displayValue}
        </motion.p>
        
        {/* Description & Date Inputs */}
        <div className="w-full max-w-xs mt-6 space-y-3">
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200",
                "text-center text-zinc-900 placeholder:text-zinc-400",
                "focus:outline-none focus:ring-2",
                accentFocus
              )}
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200",
                "text-center text-zinc-900",
                "focus:outline-none focus:ring-2",
                accentFocus
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
// Investment Type Step
// ============================================================================

interface TypeStepProps {
  value: string;
  onChange: (type: string) => void;
  onNext: () => void;
  isPlanner: boolean;
}

function TypeStep({ value, onChange, onNext, isPlanner }: TypeStepProps) {
  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  const accentBorder = isPlanner ? 'border-emerald-500' : 'border-blue-500';

  const handleSelect = (key: string) => {
    onChange(key);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-zinc-900">Tipo de Aplicação</h3>
          <p className="text-sm text-zinc-500">Onde você está investindo?</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {INVESTMENT_TYPES.map((type, index) => {
            const Icon = type.icon;
            const isSelected = value === type.key;
            
            return (
              <motion.button
                key={type.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleSelect(type.key)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  isSelected 
                    ? cn(accentBorder, "bg-white shadow-sm") 
                    : "border-zinc-100 hover:border-zinc-200"
                )}
                whileTap={{ scale: 0.98 }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  type.bg
                )}>
                  <Icon className={cn("w-5 h-5", type.color)} />
                </div>
                <span className="text-sm font-medium text-zinc-900 text-center leading-tight">
                  {type.label}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn("w-5 h-5 rounded-full flex items-center justify-center", accentBg)}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
      <div className="p-4 border-t border-zinc-100">
        <motion.button
          onClick={onNext}
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

// ============================================================================
// Account Step
// ============================================================================

interface AccountStepProps {
  value: string;
  onChange: (id: string) => void;
  onNext: () => void;
  amount: number;
  isPlanner: boolean;
}

function AccountStep({ value, onChange, onNext, amount, isPlanner }: AccountStepProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  const accentBorder = isPlanner ? 'border-emerald-500' : 'border-blue-500';

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, []);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CHECKING': return Wallet;
      case 'SAVINGS': return Building2;
      case 'INVESTMENT': return CreditCard;
      default: return Wallet;
    }
  };

  const selectedAccount = accounts.find(a => a.id === value);
  const insufficientBalance = selectedAccount && selectedAccount.balance < amount;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-zinc-900">Conta de Origem</h3>
          <p className="text-sm text-zinc-500">De onde sairá o valor?</p>
        </div>

        <div className="space-y-2">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type);
            const isSelected = account.id === value;
            
            return (
              <motion.button
                key={account.id}
                onClick={() => onChange(account.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                  isSelected ? cn(accentBorder, "bg-white") : "border-zinc-100 hover:border-zinc-200"
                )}
                whileTap={{ scale: 0.98 }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-emerald-50" : "bg-zinc-50"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? "text-emerald-500" : "text-zinc-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{account.name}</p>
                  <p className={cn(
                    "text-sm",
                    account.balance < 0 ? "text-rose-500" : "text-zinc-500"
                  )}>
                    {formatCurrency(account.balance)}
                  </p>
                </div>
                {isSelected && (
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", accentBg)}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {insufficientBalance && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg"
          >
            ⚠️ Saldo insuficiente (aplicação continuará com saldo negativo)
          </motion.p>
        )}
      </div>

      {/* Continue Button */}
      <div className="p-4 border-t border-zinc-100">
        <motion.button
          onClick={onNext}
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

// ============================================================================
// Confirm Step
// ============================================================================

interface ConfirmStepProps {
  data: InvestmentWizardData;
  onConfirm: () => void;
  onEdit: (step: StepType) => void;
  isSubmitting: boolean;
  isPlanner: boolean;
}

function ConfirmStep({ data, onConfirm, onEdit, isSubmitting, isPlanner }: ConfirmStepProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accs = await getAccounts();
        setAccounts(accs);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
      }
    };
    loadAccounts();
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const investmentType = INVESTMENT_TYPES.find(t => t.key === data.investmentType);
  const sourceAccount = accounts.find(a => a.id === data.sourceAccountId);
  const Icon = investmentType?.icon || TrendingUp;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className={cn(
            "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4",
            investmentType?.bg || "bg-emerald-50"
          )}>
            <Icon className={cn("w-8 h-8", investmentType?.color || "text-emerald-500")} />
          </div>
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-emerald-500"
          >
            {formatCurrency(data.amount)}
          </motion.p>
          <p className="text-zinc-500 mt-1">{investmentType?.label || 'Aplicação'}</p>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <SummaryRow
            label="Tipo"
            value={investmentType?.label || data.investmentType}
            icon={<Icon className={cn("w-4 h-4", investmentType?.color)} />}
            onEdit={() => onEdit('type')}
          />
          <SummaryRow
            label="Conta"
            value={sourceAccount?.name || '...'}
            icon={<Wallet className="w-4 h-4 text-zinc-400" />}
            onEdit={() => onEdit('account')}
          />
          <SummaryRow
            label="Data"
            value={formatDate(data.date)}
            icon={<Calendar className="w-4 h-4 text-zinc-400" />}
            onEdit={() => onEdit('amount')}
          />
          {data.description && (
            <SummaryRow
              label="Descrição"
              value={data.description}
              icon={<FileText className="w-4 h-4 text-zinc-400" />}
              onEdit={() => onEdit('amount')}
            />
          )}
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-4 border-t border-zinc-100">
        <motion.button
          onClick={onConfirm}
          disabled={isSubmitting}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2",
            accentBg,
            !isSubmitting && "active:scale-[0.98]"
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
              Confirmar Aplicação
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ============================================================================
// Summary Row Component
// ============================================================================

interface SummaryRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onEdit?: () => void;
}

function SummaryRow({ label, value, icon, onEdit }: SummaryRowProps) {
  return (
    <div 
      onClick={onEdit}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl bg-zinc-50",
        onEdit && "cursor-pointer hover:bg-zinc-100 active:scale-[0.99] transition-all"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-zinc-500 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-zinc-900 text-sm">{value}</span>
        {onEdit && <ChevronRight className="w-4 h-4 text-zinc-400" />}
      </div>
    </div>
  );
}

// ============================================================================
// Main Wizard Component
// ============================================================================

export function InvestmentWizard({ onComplete, onCancel }: InvestmentWizardProps) {
  const { user } = useUser();
  const isPlanner = user?.type === 'PLANNER';
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [data, setData] = useState<InvestmentWizardData>({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    investmentType: '',
    sourceAccountId: '',
  });

  const currentStep = STEPS[currentStepIndex];

  const goNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      onCancel();
    }
  }, [currentStepIndex, onCancel]);

  const updateData = useCallback((updates: Partial<InvestmentWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const getStepTitle = useCallback(() => {
    switch (currentStep) {
      case 'amount': return 'Valor da Aplicação';
      case 'type': return 'Tipo de Investimento';
      case 'account': return 'Conta de Origem';
      case 'confirm': return 'Confirmar';
      default: return 'Aplicação';
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
      <WizardHeader
        title={getStepTitle()}
        onBack={goBack}
        canGoBack={true}
      />

      <StepIndicator
        steps={STEPS}
        currentStep={currentStepIndex}
        isPlanner={isPlanner}
      />

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
            {currentStep === 'amount' && (
              <AmountStep
                value={data.amount}
                onChange={(amount) => updateData({ amount })}
                onNext={goNext}
                description={data.description}
                onDescriptionChange={(description) => updateData({ description })}
                date={data.date}
                onDateChange={(date) => updateData({ date })}
                isPlanner={isPlanner}
              />
            )}

            {currentStep === 'type' && (
              <TypeStep
                value={data.investmentType}
                onChange={(investmentType) => updateData({ investmentType })}
                onNext={goNext}
                isPlanner={isPlanner}
              />
            )}

            {currentStep === 'account' && (
              <AccountStep
                value={data.sourceAccountId}
                onChange={(sourceAccountId) => updateData({ sourceAccountId })}
                onNext={goNext}
                amount={data.amount}
                isPlanner={isPlanner}
              />
            )}

            {currentStep === 'confirm' && (
              <ConfirmStep
                data={data}
                onConfirm={handleSubmit}
                onEdit={(step) => {
                  const stepIndex = STEPS.indexOf(step);
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

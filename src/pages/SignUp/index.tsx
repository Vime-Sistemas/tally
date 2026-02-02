import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Brain,
  User,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { AuthLoadingScreen } from '../../components/AuthLoadingScreen';
import { AuthErrorAlert } from '../../components/AuthErrorAlert';
import { cn } from '../../lib/utils';

// ============================================================================
// Types & Constants
// ============================================================================

type PlanType = 'free' | 'monthly' | 'annual';
type AccountType = 'PERSONAL' | 'PLANNER';

const PLAN_DETAILS = {
  free: { 
    name: 'Starter', 
    price: 'R$ 0,00', 
    period: '/mês', 
    features: ['Acesso Básico', '2 Contas', '1 Cartão'],
    popular: false
  },
  monthly: { 
    name: 'Pro Mensal', 
    price: 'R$ 15,00', 
    period: '/mês', 
    features: ['Fluxo de Caixa', 'Gestão de Dívidas', 'Contas ilimitadas'],
    popular: true
  },
  annual: { 
    name: 'Pro Anual', 
    price: 'R$ 120,00', 
    period: '/ano', 
    features: ['Tudo do Pro', '2 meses grátis', 'Suporte prioritário'],
    popular: false
  },
};

// ============================================================================
// Account Type Selector
// ============================================================================

interface AccountTypeSelectorProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
}

function AccountTypeSelector({ value, onChange }: AccountTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <motion.button
        type="button"
        onClick={() => onChange('PERSONAL')}
        className={cn(
          "relative p-4 rounded-xl border-2 transition-all text-left",
          value === 'PERSONAL'
            ? "border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-400/10"
            : "border-slate-200 bg-white hover:border-slate-300"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {value === 'PERSONAL' && (
          <motion.div
            layoutId="account-type-check"
            className="absolute -top-2 -right-2 w-5 h-5 bg-blue-400 text-white rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-3 h-3" />
          </motion.div>
        )}
        <User className={cn(
          "w-5 h-5 mb-2",
          value === 'PERSONAL' ? "text-blue-500" : "text-slate-400"
        )} />
        <h4 className={cn(
          "font-semibold text-sm",
          value === 'PERSONAL' ? "text-blue-600" : "text-slate-700"
        )}>
          Pessoal
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Controle suas finanças
        </p>
      </motion.button>

      <motion.button
        type="button"
        onClick={() => onChange('PLANNER')}
        className={cn(
          "relative p-4 rounded-xl border-2 transition-all text-left",
          value === 'PLANNER'
            ? "border-emerald-400 bg-emerald-50/50 shadow-lg shadow-emerald-400/10"
            : "border-slate-200 bg-white hover:border-slate-300"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {value === 'PLANNER' && (
          <motion.div
            layoutId="account-type-check"
            className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 text-white rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-3 h-3" />
          </motion.div>
        )}
        <Briefcase className={cn(
          "w-5 h-5 mb-2",
          value === 'PLANNER' ? "text-emerald-500" : "text-slate-400"
        )} />
        <h4 className={cn(
          "font-semibold text-sm",
          value === 'PLANNER' ? "text-emerald-600" : "text-slate-700"
        )}>
          Planejador
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie clientes
        </p>
      </motion.button>
    </div>
  );
}

// ============================================================================
// Plan Card
// ============================================================================

interface PlanCardProps {
  planKey: PlanType;
  plan: typeof PLAN_DETAILS[PlanType];
  isSelected: boolean;
  onClick: () => void;
}

function PlanCard({ plan, isSelected, onClick }: PlanCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all text-left w-full",
        isSelected
          ? "border-blue-400 bg-blue-50/50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {plan.popular && (
        <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full">
          Popular
        </span>
      )}
      
      {isSelected && (
        <motion.div
          layoutId="plan-check"
          className="absolute top-3 right-3 w-5 h-5 text-white rounded-full flex items-center justify-center"
        >
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h4 className={cn(
            "font-semibold",
            isSelected ? "text-blue-600" : "text-slate-800"
          )}>
            {plan.name}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {plan.features[0]}
          </p>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-bold",
            isSelected ? "text-blue-600" : "text-slate-900"
          )}>
            {plan.price}
          </p>
          <p className="text-[10px] text-slate-400">{plan.period}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SignUpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginWithRedirect, error: auth0Error } = useAuth0();
  
  // Get plan from URL or default to free
  const initialPlan = (searchParams.get('plan') as PlanType) || 'free';
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for Auth0 error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setAuthError(errorParam);
      // Clean URL params without page reload
      searchParams.delete('error');
      searchParams.delete('error_description');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Also check for Auth0 SDK error
  useEffect(() => {
    if (auth0Error) {
      setAuthError(auth0Error.message || 'default');
    }
  }, [auth0Error]);

  const plan = PLAN_DETAILS[selectedPlan];
  const isPlanner = accountType === 'PLANNER';

  const dismissError = () => setAuthError(null);

  const handleSignUp = async () => {
    setIsRedirecting(true);
    
    // Save account type and plan to localStorage for post-auth sync
    localStorage.setItem('signup_account_type', accountType);
    localStorage.setItem('signup_plan', selectedPlan);
    
    try {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR',
        },
        appState: {
          returnTo: '/onboarding',
          accountType,
          plan: selectedPlan,
        },
      });
    } catch (error) {
      console.error('Error redirecting to Auth0:', error);
      setIsRedirecting(false);
    }
  };

  // Show loading screen while redirecting
  if (isRedirecting) {
    return <AuthLoadingScreen phase="redirecting" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      
      {/* Mobile Plan Summary */}
      <div className="lg:hidden px-4 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
            Plano selecionado
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{plan.name}</p>
              <p className="text-xs text-slate-600">{plan.features.slice(0, 2).join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">{plan.price}</p>
              <p className="text-xs text-slate-500">{plan.period}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white relative overflow-hidden">
        <div className="mx-auto w-full max-w-sm lg:w-96 relative z-10">
          
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:-translate-x-1 transition-transform"/>
              <span className="text-sm font-medium text-slate-500">Voltar para Home</span>
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isPlanner ? "bg-emerald-400" : "bg-blue-400"
              )}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Cérebro das Finanças</span>
            </motion.div>
            
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Crie sua conta
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Escolha seu tipo de conta e comece a organizar suas finanças
            </p>
          </div>

          {/* Auth Error Alert */}
          {authError && (
            <div className="mb-6">
              <AuthErrorAlert 
                error={authError} 
                onDismiss={dismissError}
                variant={isPlanner ? 'emerald' : 'blue'}
              />
            </div>
          )}

          {/* Account Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Tipo de Conta
            </label>
            <AccountTypeSelector value={accountType} onChange={setAccountType} />
          </motion.div>

          {/* Plan Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Escolha seu Plano
            </label>
            <div className="space-y-2">
              {(Object.entries(PLAN_DETAILS) as [PlanType, typeof PLAN_DETAILS[PlanType]][]).map(([key, planData]) => (
                <PlanCard
                  key={key}
                  planKey={key}
                  plan={planData}
                  isSelected={selectedPlan === key}
                  onClick={() => setSelectedPlan(key)}
                />
              ))}
            </div>
          </motion.div>

          {/* Auth0 Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-3 items-start mb-6"
          >
            <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Você será redirecionado para o <strong>Auth0</strong> para criar sua conta de forma segura. Nenhuma senha é armazenada em nossos servidores.
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleSignUp}
            disabled={isRedirecting}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]",
              isPlanner 
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" 
                : "bg-blue-400 hover:bg-blue-500 shadow-blue-400/20"
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isRedirecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Criar Conta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {/* Login Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-slate-500"
          >
            Já tem uma conta?{' '}
            <Link to="/login" className={cn(
              "font-semibold hover:underline",
              isPlanner ? "text-emerald-600" : "text-blue-500"
            )}>
              Fazer login
            </Link>
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Summary */}
      <div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 h-full flex flex-col justify-center p-12 text-slate-300">
          <div className="max-w-md mx-auto w-full">
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-2xl"
            >
              <h3 className="text-lg font-medium text-white mb-6">Resumo da Conta</h3>
              
              {/* Account Type */}
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-400">Tipo de conta</span>
                <span className="text-white font-medium">
                  {accountType === 'PERSONAL' ? 'Pessoal' : 'Planejador'}
                </span>
              </div>
              
              {/* Plan */}
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-400">Plano</span>
                <span className="text-white font-medium">{plan.name}</span>
              </div>
              
              {/* Features */}
              <div className="py-4 space-y-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Incluso</span>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm">
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center mr-3",
                      isPlanner ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-end">
                <span className="text-sm text-slate-400">Valor</span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
              </div>
            </motion.div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex gap-4 items-center opacity-70"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full bg-slate-700 border-2 border-slate-900" />
                ))}
              </div>
              <p className="text-xs">
                Junte-se a +1000 pessoas organizando suas finanças.
              </p>
            </motion.div>

            {/* Sparkle decoration */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="absolute top-20 right-20"
            >
              <Sparkles className="w-8 h-8 text-blue-400/30" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

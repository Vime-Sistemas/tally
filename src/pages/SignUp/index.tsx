import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // Assumindo react-router-dom
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  Loader2, 
  Lock, 
  ShieldCheck 
} from 'lucide-react';

// --- TIPO E DADOS ---
type PlanType = 'free' | 'monthly' | 'annual';

const PLAN_DETAILS = {
  free: { name: 'Starter', price: 'R$ 0,00', period: '/mês', features: ['Acesso Básico', '2 Contas'] },
  monthly: { name: 'Pro Mensal', price: 'R$ 15,00', period: '/mês', features: ['Fluxo de Caixa', 'Gestão de Dívidas', 'Cobrança mensal'] },
  annual: { name: 'Pro Anual', price: 'R$ 120,00', period: '/ano', features: ['Fluxo de Caixa', 'Gestão de Dívidas', 'Cobrança única'] },
};

// --- COMPONENTES UI MICRO ---
// Input com estilo "Linear/Stripe" (borda suave, foco forte)
const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <input 
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
      {...props}
    />
  </div>
);

// Simulação visual do Stripe Element (Para o layout)
const MockStripeElement = () => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dados do Cartão</label>
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
      <div className="flex items-center gap-3">
        <CreditCard className="h-4 w-4 text-slate-400" />
        <input placeholder="0000 0000 0000 0000" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-300" />
      </div>
      <div className="mt-2 flex gap-3 border-t border-slate-100 pt-2">
        <input placeholder="MM / AA" className="w-1/2 bg-transparent text-sm outline-none placeholder:text-slate-300" />
        <input placeholder="CVC" className="w-1/2 bg-transparent text-sm outline-none placeholder:text-slate-300" />
      </div>
    </div>
    <p className="text-[10px] text-slate-400 flex items-center gap-1">
      <Lock className="h-3 w-3" /> Pagamento processado de forma segura via Stripe.
    </p>
  </div>
);

export default function RegistrationPage() {
  const [searchParams] = useSearchParams();
  // Pega o plano da URL ou define 'free' como fallback
  const planKey = (searchParams.get('plan') as PlanType) || 'free';
  const plan = PLAN_DETAILS[planKey] || PLAN_DETAILS.free;
  
  // Steps: 1 = Conta, 2 = Pagamento, 3 = Sucesso
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = avançar, -1 = voltar

  // Lógica para pular pagamento se for Free
  const isFree = planKey === 'free';
  const totalSteps = isFree ? 1 : 2;

  const handleNext = async () => {
    setLoading(true);
    // Simula delay de rede (Auth0 ou Stripe)
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);

    if (step < totalSteps) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      // Finalizar cadastro
      setDirection(1);
      setStep(3); // Vai para tela de sucesso
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      
      {/* --- LEFT PANEL (FORM) --- */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white relative overflow-hidden">
        <div className="mx-auto w-full max-w-sm lg:w-96 relative z-10">
          
          {/* Logo / Header */}
          <div className="mb-10">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
               <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:-translate-x-1 transition-transform"/>
               <span className="text-sm font-medium text-slate-500">Voltar para Home</span>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {step === 3 ? 'Bem-vindo ao CDF!' : 'Vamos criar sua conta'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {step === 1 && "Preencha seus dados para começar."}
              {step === 2 && "Configure seu método de pagamento seguro."}
              {step === 3 && "Sua jornada financeira começa agora."}
            </p>
          </div>

          {/* Wrapper Animado do Formulário */}
          <motion.div 
            layout // A mágica: anima a altura do container quando o conteúdo muda
            className="relative overflow-visible"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AnimatePresence mode='wait' custom={direction}>
              
              {/* STEP 1: CONTA (Auth0 fields) */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  initial={{ x: direction === 1 ? 20 : -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction === 1 ? -20 : 20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nome" placeholder="Seu nome" />
                    <Input label="Sobrenome" placeholder="Sobrenome" />
                  </div>
                  <Input label="Email" type="email" placeholder="seu@email.com" />
                  <Input label="Senha" type="password" placeholder="••••••••" />
                  
                  {/* Auth0 Disclaimer */}
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100 flex gap-3 items-start">
                     <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                     <p className="text-xs text-slate-500 leading-relaxed">
                       Usamos <strong>Auth0</strong> para proteger sua identidade. Seus dados nunca são compartilhados sem permissão.
                     </p>
                  </div>

                  <button 
                    onClick={handleNext}
                    disabled={loading}
                    className="w-full flex items-center justify-center rounded-lg bg-blue-400 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-blue-500 disabled:opacity-70 transition-all active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isFree ? 'Criar Conta Gratuita' : 'Continuar para Pagamento')}
                  </button>
                </motion.div>
              )}

              {/* STEP 2: PAGAMENTO (Stripe Elements) */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <MockStripeElement />
                  
                  <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <span>Total a pagar hoje:</span>
                    <span className="font-bold text-slate-900">{plan.price}</span>
                  </div>

                  <div className="flex gap-3">
                    <button 
                        onClick={handleBack}
                        className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={loading}
                        className="flex-[2] flex items-center justify-center rounded-lg bg-blue-400 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-blue-500 disabled:opacity-70 transition-all active:scale-[0.98]"
                    >
                         {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Assinar ${plan.name}`}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: SUCESSO */}
              {step === 3 && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
                    >
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-slate-900">Cadastro realizado!</h3>
                    <p className="text-slate-600 mt-2 mb-8">
                        Enviamos um email de confirmação para você.
                    </p>
                    <Link to="/app/dashboard" className="block w-full rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                        Acessar o Sistema
                    </Link>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
          
          {/* Progress Indicator */}
          {!isFree && step < 3 && (
              <div className="mt-8 flex justify-center gap-2">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-blue-400' : 'w-2 bg-slate-200'}`} />
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-blue-400' : 'w-2 bg-slate-200'}`} />
              </div>
          )}
        </div>
      </div>

      {/* --- RIGHT PANEL (SUMMARY) --- */}
      <div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
        {/* Background Pattern estilizado */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-center p-12 text-slate-300">
           <div className="max-w-md mx-auto w-full">
               <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-2xl">
                   <h3 className="text-lg font-medium text-white mb-6">Resumo do Pedido</h3>
                   
                   <div className="flex justify-between items-center py-4 border-b border-slate-700">
                       <div>
                           <p className="text-white font-semibold">Plano {plan.name}</p>
                           <p className="text-xs text-slate-400">Assinatura {plan.period.replace('/', '')}</p>
                       </div>
                       <div className="text-white font-bold">{plan.price}</div>
                   </div>
                   
                   <div className="py-4 space-y-3">
                       {plan.features.map((feature: string, idx: number) => (
                           <div key={idx} className="flex items-center text-sm">
                               <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 text-emerald-400">
                                   <CheckCircle2 className="h-3 w-3" />
                               </div>
                               {feature}
                           </div>
                       ))}
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-slate-700 flex justify-between items-end">
                       <span className="text-sm">Total a pagar hoje</span>
                       <span className="text-3xl font-bold text-white">{plan.price}</span>
                   </div>
               </div>

               {/* Testimonial ou Social Proof (Opcional, mas comum no onboarding) */}
               <div className="mt-12 flex gap-4 items-center opacity-70">
                   <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                           <div key={i} className="h-8 w-8 rounded-full bg-slate-700 border-2 border-slate-900" />
                       ))}
                   </div>
                   <p className="text-xs">Junte-se a +1000 fundadores organizando suas finanças.</p>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
}
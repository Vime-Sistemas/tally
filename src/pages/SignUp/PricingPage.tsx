import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { CheckCircle2, Shield, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createCheckoutSession } from '@/services/stripe';
import { PageWrapper, MotionButton } from './NewReusableComponents'; // Certifique-se do caminho
import { setAuthToken } from '@/services/api';

// --- SUB-COMPONENTS ---

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex w-full items-center justify-between py-4 text-left font-medium text-slate-900 transition-colors hover:text-blue-500"
      >
        {question}
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-slate-600 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN PAGE ---

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<null | 'annual' | 'monthly'>(null);
  const [advisorAlertOpen, setAdvisorAlertOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const priceIds = useMemo(() => ({
    annual: import.meta.env.VITE_STRIPE_PRICE_ANNUAL,
    monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
  }), []);

  const handleCheckout = useCallback(async (plan: 'annual' | 'monthly') => {
    const priceId = priceIds[plan];

    if (!priceId) {
      console.error('Stripe priceId configuration missing.');
      return;
    }

    if (isLoading) return;

    if (!isAuthenticated) {
      localStorage.setItem('pending_checkout_plan', plan);
      await loginWithRedirect({ appState: { returnTo: `/planos` } });
      return;
    }

    try {
      setLoadingPlan(plan);
      localStorage.removeItem('pending_checkout_plan');
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      setAuthToken(token);
      const { url } = await createCheckoutSession(priceId);
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout failed', error);
    } finally {
      setLoadingPlan(null);
    }
  }, [getAccessTokenSilently, isLoading, isAuthenticated, loginWithRedirect, navigate, priceIds]);

  // Auto-trigger checkout if pending
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const pendingPlan = localStorage.getItem('pending_checkout_plan');
    if (pendingPlan === 'annual' || pendingPlan === 'monthly') {
      handleCheckout(pendingPlan as 'annual' | 'monthly');
    }
  }, [isAuthenticated, isLoading, handleCheckout]);

  return (
    <PageWrapper>
      {/* --- HERO SECTION --- */}
      <section className="pt-24 pb-12 md:pt-32 bg-white relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-blue-50/50 to-transparent rounded-[100%] blur-3xl -z-10" />

        <div className="container mx-auto px-4 md:px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
              Investimento simples.<br/>
              <span className="text-blue-500">Retorno exponencial.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10">
              Escolha o plano que se adapta ao seu momento financeiro. 
              Cancele a qualquer momento, sem letras miúdas.
            </p>
          </motion.div>

          {/* --- TOGGLE SWITCH --- */}
          <div className="flex justify-center mb-16">
            <div className="bg-white p-1 rounded-full flex items-center relative cursor-pointer shadow-sm border border-slate-200" onClick={() => setIsAnnual(!isAnnual)}>
               <motion.div 
                 className="absolute top-1 left-1 w-[110px] h-10 bg-blue-400 rounded-full shadow-md z-0"
                 animate={{ x: isAnnual ? 110 : 0 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
               />
               <button className={`relative z-10 w-[110px] h-10 rounded-full text-sm font-semibold transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                 Mensal
               </button>
               <button className={`relative z-10 w-[110px] h-10 rounded-full text-sm font-semibold transition-colors duration-300 ${isAnnual ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                 Anual
               </button>
            </div>
            <AnimatePresence>
                {isAnnual && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -10, scale: 0.9 }}
                        className="ml-4 flex items-center"
                    >
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                            -25% OFF
                        </span>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- PRICING CARDS --- */}
      <section className="pb-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
             
             {/* FREE TIER */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="flex flex-col p-8 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors"
             >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                    <p className="text-sm text-slate-500 mt-1">Para organizar a casa.</p>
                </div>
                <div className="mb-6">
                   <span className="text-4xl font-bold tracking-tight text-slate-900">R$0</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Controle manual de gastos', 'Até 2 contas bancárias', 'Relatórios básicos'].map((item, i) => (
                    <li key={i} className="flex text-sm text-slate-600">
                      <CheckCircle2 className="mr-3 h-5 w-5 text-slate-300 shrink-0"/> {item}
                    </li>
                  ))}
                </ul>
                <MotionButton variant="outline" asLink to="/cadastro?plan=free" className="w-full">
                  Começar Grátis
                </MotionButton>
             </motion.div>

             {/* PRO TIER (HERO) */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                layout
                className="flex flex-col p-8 bg-slate-900 text-white rounded-3xl shadow-2xl shadow-blue-900/20 relative overflow-hidden transform md:-translate-y-4 border border-slate-800"
             >
                {/* Gradient Bg Effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

                {isAnnual && (
                    <div className="absolute top-0 right-0 mt-6 mr-6 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg animate-pulse">
                        Recomendado
                    </div>
                )}

                <div className="mb-4 relative z-10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Pro {isAnnual ? 'Anual' : 'Mensal'} <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">Controle total e previsibilidade.</p>
                </div>
                
                <div className="mb-6 h-12 relative z-10 flex items-baseline">
                   <span className="text-sm text-slate-400 mr-1 self-start mt-2">R$</span>
                   <AnimatePresence mode='wait'>
                    <motion.span 
                        key={isAnnual ? 'an' : 'mo'}
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                        className="text-5xl font-bold tracking-tight text-white"
                    >
                        {isAnnual ? '120' : '15'}
                    </motion.span>
                   </AnimatePresence>
                   <span className="text-slate-400 ml-1">/{isAnnual ? 'ano' : 'mês'}</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1 relative z-10">
                  {['Fluxo de Caixa Projetado', 'Gestão de Dívidas & Juros', 'Valuation de Ativos', 'Metas Ilimitadas', 'Suporte Prioritário'].map((item, i) => (
                    <li key={i} className="flex text-sm text-slate-200 font-medium">
                      <CheckCircle2 className="mr-3 h-5 w-5 text-blue-400 shrink-0"/> {item}
                    </li>
                  ))}
                </ul>
                
                <MotionButton 
                    onClick={() => handleCheckout(isAnnual ? 'annual' : 'monthly')} 
                    className="w-full bg-blue-400 text-slate-800 hover:bg-blue-400 hover:text-slate-900 border-none font-bold"
                    disabled={loadingPlan !== null}
                >
                  {loadingPlan ? 'Processando...' : (isAnnual ? 'Assinar Agora' : 'Assinar Mensal')}
                </MotionButton>
             </motion.div>

             {/* ADVISOR TIER */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="flex flex-col p-8 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors opacity-90 hover:opacity-100"
             >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Advisor</h3>
                    <p className="text-sm text-slate-500 mt-1">Para planejadores financeiros.</p>
                </div>
                <div className="mb-6 flex items-center h-10">
                   <span className="text-2xl font-bold text-slate-900">Sob Consulta</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Gestão Multi-cliente', 'White-label (Sua Marca)', 'Portal do Cliente', 'Relatórios PDF Personalizados'].map((item, i) => (
                    <li key={i} className="flex text-sm text-slate-600">
                      <Shield className="mr-3 h-5 w-5 text-slate-400 shrink-0"/> {item}
                    </li>
                  ))}
                </ul>
                <MotionButton variant="outline" onClick={() => setAdvisorAlertOpen(true)} className="w-full bg-transparent border-slate-300 hover:bg-white">
                  Falar com Consultor
                </MotionButton>
             </motion.div>

          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900">Perguntas Frequentes</h2>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100">
                <FaqItem 
                    question="Como funciona a garantia de 7 dias?" 
                    answer="Se você não sentir que o CDF te deu clareza financeira na primeira semana, basta nos enviar um email. Devolvemos 100% do valor, sem perguntas."
                />
                <FaqItem 
                    question="Posso cancelar quando quiser?" 
                    answer="Sim. O cancelamento é feito com um clique no painel de configurações. Você manterá acesso até o fim do ciclo pago."
                />
                <FaqItem 
                    question="Meus dados estão seguros?" 
                    answer="Absolutamente. Utilizamos criptografia de nível bancário (AES-256) no banco de dados e todo o tráfego é protegido via SSL. Nem nós temos acesso às suas senhas."
                />
                <FaqItem 
                    question="O que é o Fluxo de Caixa Projetado?" 
                    answer="Diferente de apps comuns, o CDF projeta seu saldo futuro baseado nas suas transações recorrentes e parcelas de cartão. Você sabe hoje se vai faltar dinheiro daqui a 3 meses."
                />
            </div>
        </div>
      </section>

      {/* --- ADVISOR ALERT --- */}
      <AlertDialog open={advisorAlertOpen} onOpenChange={setAdvisorAlertOpen}>
        <AlertDialogContent className="bg-white rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Área Advisor em Beta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Estamos liberando o acesso para Advisors em lotes para garantir a qualidade da plataforma. 
              <br/><br/>
              Gostaria de entrar na lista de espera prioritária?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAdvisorAlertOpen(false)} className="bg-slate-900 text-white rounded-xl">
              Entrar na Lista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </PageWrapper>
  );
}
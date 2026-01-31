import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper, MotionButton } from './NewReusableComponents';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <PageWrapper>
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Planos Flexíveis</h1>
            <p className="text-slate-600">Escolha o melhor investimento para o seu controle financeiro.</p>
          </div>

          {/* --- Toggle Switch Mensal/Anual com Motion --- */}
          <div className="flex justify-center mb-16">
            <div className="bg-slate-100 p-1 rounded-full flex items-center relative cursor-pointer" onClick={() => setIsAnnual(!isAnnual)}>
               {/* O background móvel do switch */}
               <motion.div 
                 className="absolute top-1 left-1 w-[100px] h-10 bg-white rounded-full shadow-sm border border-slate-200/50 z-0"
                 animate={{ x: isAnnual ? 100 : 0 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
               />
               <button className={`relative z-10 w-[100px] h-10 rounded-full text-sm font-medium transition-colors duration-300 ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                 Mensal
               </button>
               <button className={`relative z-10 w-[100px] h-10 rounded-full text-sm font-medium transition-colors duration-300 ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                 Anual
               </button>
            </div>
              {/* Badge de desconto que aparece só no anual */}
             <AnimatePresence>
                {isAnnual && (
                    <motion.span 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="ml-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 self-center"
                    >
                        Economize 33%
                    </motion.span>
                )}
             </AnimatePresence>
          </div>

          {/* --- Grid de Planos --- */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
             {/* Free Tier (Card estático simples) */}
             <div className="flex flex-col p-8 bg-white border border-slate-200 rounded-xl">
                <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                <div className="mt-4 text-4xl font-bold tracking-tight">R$0</div>
                <p className="mt-4 text-sm text-slate-600">Para começar a organizar.</p>
                <ul className="mt-6 space-y-3 flex-1 mb-8">
                  <li className="flex text-sm text-slate-600"><CheckCircle2 className="mr-2 h-4 w-4 text-slate-900"/> Controle manual</li>
                  <li className="flex text-sm text-slate-600"><CheckCircle2 className="mr-2 h-4 w-4 text-slate-900"/> 2 Contas</li>
                </ul>
                <MotionButton variant="outline" asLink to="/cadastro?plan=free">Começar Grátis</MotionButton>
              </div>

            {/* Pro Tier (Card com animação de preço e destaque) */}
             <motion.div 
                layout // Anima se a altura do card mudar
                className={`flex flex-col p-8 rounded-2xl relative z-10 h-full justify-between transition-all duration-500 ${isAnnual ? 'bg-blue-400 text-white shadow-2xl scale-105' : 'bg-white border border-slate-200 shadow-sm'}`}
              >
                <div>
                  {isAnnual && <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">Recomendado</div>}
                  <h3 className={`text-lg font-semibold ${isAnnual ? 'text-white' : 'text-slate-900'}`}>Pro {isAnnual ? 'Anual' : 'Mensal'}</h3>
                  
                  <div className="mt-4 flex items-baseline overflow-hidden h-12">
                    <span className="text-xl mr-1 self-start mt-2">R$</span>
                    {/* Animação de Layout nos Números */}
                    <motion.span 
                        key={isAnnual ? "annual-price" : "monthly-price"} // A chave força a remontagem
                        layout // O layout faz a transição suave entre os estados de montagem
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`text-5xl font-bold tracking-tight ${isAnnual ? 'text-white' : 'text-slate-900'}`}
                    >
                        {isAnnual ? '120' : '15'}
                    </motion.span>
                    <motion.span layout className={`ml-1 text-xl ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                         /{isAnnual ? 'ano' : 'mês'}
                    </motion.span>
                  </div>
                  <p className={`mt-4 text-sm ${isAnnual ? 'text-white' : 'text-slate-600'}`}>O pacote completo para controle total.</p>
                  <ul className="mt-8 space-y-4">
                    {['Fluxo de Caixa Projetado', 'Gestão de Dívidas', 'Ativos & Patrimônio', 'Metas ilimitadas', 'Suporte Prioritário'].map(i => (
                      <li key={i} className={`flex text-sm ${isAnnual ? 'text-white' : 'text-slate-600'}`}>
                        <CheckCircle2 className={`mr-2 h-4 w-4 ${isAnnual ? 'text-white' : 'text-slate-900'}`}/> {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <MotionButton 
                    variant={isAnnual ? "primary" : "outline"} 
                    asLink to={`/cadastro?plan=${isAnnual ? 'annual' : 'monthly'}`} 
                    className={`mt-8 w-full ${isAnnual ? 'bg-white text-slate-900 hover:bg-slate-100 border-none font-bold' : ''}`}
                >
                  {isAnnual ? 'Assinar Anual' : 'Assinar Mensal'}
                </MotionButton>
              </motion.div>

              {/* Advisor Tier (Placeholder) */}
              <div className="flex flex-col p-8 bg-slate-50 border border-slate-200 rounded-xl opacity-75 hover:opacity-100 transition-opacity">
                <h3 className="text-lg font-semibold text-slate-900">Advisor</h3>
                <p className="mt-4 text-sm text-slate-600">Para gestores financeiros.</p>
                <div className="my-8 flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                   <span className="text-sm text-slate-500 font-medium">Consulte condições</span>
                </div>
                <MotionButton variant="link" asLink to="/advisor">Saiba mais</MotionButton>
              </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
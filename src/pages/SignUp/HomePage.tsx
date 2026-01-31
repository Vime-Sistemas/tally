import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
// Importe os componentes compartilhados acima
import { PageWrapper, MotionButton } from './NewReusableComponents';

export default function HomePage() {
  const { scrollY } = useScroll();
  const yPreview = useTransform(scrollY, [0, 500], [0, -50]);

  return (
    <PageWrapper>
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-48 overflow-hidden">
        {/* Background Grid animado (mesmo do anterior) */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-slate-400 opacity-20 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 md:px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Novo: Módulo de Gestão de Dívidas
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl max-w-5xl mx-auto text-slate-900 mb-6"
          >
            O verdadeiro <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-300">cérebro</span> das suas finanças.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg text-slate-600 max-w-[700px] mx-auto leading-relaxed mb-10"
          >
            Controle total sobre fluxo de caixa, patrimônio, dívidas e orçamentos. Previsibilidade para quem leva finanças a sério.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <MotionButton asLink to="/cadastro" className="h-12 px-8 text-base shadow-xl shadow-slate-900/10">
              Criar Conta Gratuita <ArrowRight className="ml-2 h-4 w-4" />
            </MotionButton>
            {/* Link para a página de funcionalidades interna */}
            <MotionButton variant="outline" asLink to="/funcionalidades" className="h-12 px-8 text-base">
              Ver recursos
            </MotionButton>
          </motion.div>
          
          {/* Parallax Dashboard Preview */}
          <motion.div 
            style={{ y: yPreview }}
            initial={{ opacity: 0, rotateX: 20, z: -100, scale: 0.9 }}
            animate={{ opacity: 1, rotateX: 0, z: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.6, type: "spring", bounce: 0.2 }}
            className="mt-16 relative mx-auto max-w-5xl perspective-1000 hidden md:block"
          >
            <div className="rounded-xl border border-slate-200 bg-white/50 backdrop-blur p-2 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none z-20 group-hover:from-white/80 transition-all" />
              <div className="rounded-lg bg-slate-50 border border-slate-100 aspect-[21/9] flex items-center justify-center relative overflow-hidden">
                <img src="/dashboard.png" alt="Dashboard Cérebro das Finanças" />
              </div>
            </div>
          </motion.div>

          {/* Mobile-first preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mt-10 md:hidden"
          >
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-4">
              <div className="rounded-lg bg-slate-50 border border-slate-100 aspect-[4/3] flex items-center justify-center overflow-hidden">
                <img
                  src="/dashboard.png"
                  alt="Dashboard mobile"
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="text-left mt-4 space-y-2">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Fluxo de caixa, metas e cartões num layout adaptado para telas menores.
                </p>
                <div className="flex gap-2">
                  <MotionButton asLink to="/cadastro" className="h-10 px-4 text-sm flex-1">Criar conta</MotionButton>
                  <MotionButton variant="outline" asLink to="/login" className="h-10 px-4 text-sm flex-1">Entrar</MotionButton>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
}
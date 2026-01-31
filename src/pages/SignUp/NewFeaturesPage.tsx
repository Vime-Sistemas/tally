import { useState } from 'react';
import { CreditCard, Lock, PieChart, Target, Wallet, TrendingUp, ShieldCheck, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from './NewReusableComponents';

// Dados das funcionalidades com categorias
const featuresData = [
  { id: 1, icon: TrendingUp, title: "Fluxo de Caixa Projetado", category: "Planejamento", description: "Visão futura do seu dinheiro baseada em recorrências e cenários." },
  { id: 2, icon: PieChart, title: "Orçamento Wizard", category: "Controle", description: "Criação guiada de budgets e acompanhamento em tempo real." },
  { id: 3, icon: Target, title: "Metas & Patrimônio", category: "Planejamento", description: "Acompanhamento de valuation de ativos e progresso de objetivos." },
  { id: 4, icon: CreditCard, title: "Gestão de Dívidas", category: "Controle", description: "Controle detalhado de parcelas, juros e amortização." },
  { id: 5, icon: Wallet, title: "Multicarteira", category: "Gestão", description: "Centralização de múltiplas contas e cartões." },
  { id: 6, icon: Lock, title: "Segurança & Privacidade", category: "Gestão", description: "Dados criptografados e exportação facilitada sem lock-in." },
  { id: 7, icon: Layers, title: "Categorização Inteligente", category: "Controle", description: "Tags e centros de custo para análise granular." },
  { id: 8, icon: ShieldCheck, title: "Perfil Advisor", category: "Gestão", description: "Ferramentas para gestores gerenciarem carteiras de clientes." },
];

const categories = ["Todos", "Planejamento", "Controle", "Gestão"];

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredFeatures = selectedCategory === "Todos" 
    ? featuresData 
    : featuresData.filter(f => f.category === selectedCategory);

  return (
    <PageWrapper>
      <section className="py-24 bg-white min-h-screen">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Funcionalidades Detalhadas
            </motion.h1>
            <p className="text-slate-600">Explore como o CDF te dá controle total.</p>
          </div>

          {/* --- Filter Tabs com Layout Animation --- */}
          <div className="flex justify-center mb-12 gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {selectedCategory === cat && (
                  <motion.div
                    layoutId="activeTabBg" // O segredo para o "pill" deslizar entre os botões
                    className="absolute inset-0 bg-blue-400 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
          </div>

          {/* --- Grid com Layout Animation --- */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredFeatures.map((feature) => (
                <motion.div
                  layout // Habilita a animação de reorganização
                  key={feature.id} // Essencial para o React identificar os itens
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  className="group bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 text-slate-900 group-hover:bg-blue-400 group-hover:text-white transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                   <span className="text-xs font-medium text-slate-400 mb-3 block">{feature.category}</span>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

        </div>
      </section>
    </PageWrapper>
  );
}
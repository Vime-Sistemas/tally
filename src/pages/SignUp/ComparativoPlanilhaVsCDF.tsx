import React, { useState, useRef } from 'react';
import { 
  ArrowRight, 
  LayoutDashboard, 
  Check, 
  Zap, 
  ShieldAlert, 
  FileSpreadsheet
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { PageWrapper, MotionButton } from './NewReusableComponents'; // Importe seus componentes base

// --- DADOS DO COMPARATIVO ---
const comparisonData = [
  {
    category: "Inteligência Financeira",
    features: [
      { 
        name: "Fluxo de Caixa Futuro", 
        sheet: "Fórmulas manuais complexas que quebram fácil.", 
        cdf: "Motor de projeção nativo baseado em recorrência.",
        winner: "cdf"
      },
      { 
        name: "Gestão de Dívidas", 
        sheet: "Cálculo de juros/amortização manual.", 
        cdf: "Controle automático de parcelas e saldo devedor.",
        winner: "cdf"
      },
      { 
        name: "Valuation de Ativos", 
        sheet: "Atualização manual de cotações.", 
        cdf: "Rastreamento histórico e consolidação de patrimônio.",
        winner: "cdf"
      }
    ]
  },
  {
    category: "Produtividade & Acesso",
    features: [
      { 
        name: "Experiência Mobile", 
        sheet: "Zoom pinçado, difícil de clicar e editar.", 
        cdf: "App responsivo nativo, rápido e tátil.",
        winner: "cdf"
      },
      { 
        name: "Lançamentos Recorrentes", 
        sheet: "Copiar e colar linhas todo mês.", 
        cdf: "Automação inteligente. Configure uma vez, esqueça.",
        winner: "cdf"
      },
      { 
        name: "Advisor / Compartilhamento", 
        sheet: "Enviar arquivos por email (risco de versão).", 
        cdf: "Portal seguro com convites e níveis de acesso.",
        winner: "cdf"
      }
    ]
  }
];

// --- COMPONENTE: VISUAL SLIDER (The "Wow" Factor) ---
const ComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
    const position = ((pageX - left) / width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  };

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <div 
      className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-2xl select-none cursor-ew-resize group"
      ref={containerRef}
      onMouseMove={(e) => isDragging.current && handleMouseMove(e)}
      onTouchMove={(e) => handleMouseMove(e)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* --- LAYER 1: SPREADSHEET (Background) --- */}
      <div className="absolute inset-0 bg-white flex flex-col font-mono text-xs text-slate-500">
        <div className="bg-emerald-700 text-white p-2 text-sm font-bold flex items-center justify-between">
            <span>Finanças_2025_Final_v3.xlsx</span>
            <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
        </div>
        <div className="flex border-b border-slate-200 bg-slate-50">
           <div className="w-10 border-r border-slate-200 p-1 text-center bg-slate-100"></div>
           {['A', 'B', 'C', 'D', 'E', 'F'].map(l => <div key={l} className="flex-1 border-r border-slate-200 p-1 text-center bg-slate-100 font-bold">{l}</div>)}
        </div>
        {/* Rows simulating complex data */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex border-b border-slate-100 hover:bg-slate-50">
             <div className="w-10 border-r border-slate-200 p-2 text-center bg-slate-50 font-bold">{i + 1}</div>
             <div className="flex-1 border-r border-slate-100 p-2 truncate text-slate-900">{i === 0 ? 'CATEGORIA' : ['Aluguel', 'Salário', 'Investimento', 'Mercado', 'Luz'][i % 5]}</div>
             <div className="flex-1 border-r border-slate-100 p-2 text-right">{i === 0 ? 'VALOR' : `R$ ${(Math.random() * 2000).toFixed(2)}`}</div>
             <div className="flex-1 border-r border-slate-100 p-2 text-red-400">{i === 4 ? '#REF!' : ''}</div>
             <div className="flex-1 border-r border-slate-100 p-2">{i === 0 ? 'DATA' : '12/01/25'}</div>
             <div className="flex-1 border-r border-slate-100 p-2 bg-yellow-50">{i === 0 ? 'STATUS' : 'Manual'}</div>
          </div>
        ))}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-red-100 max-w-xs">
           <div className="flex items-center gap-2 text-red-600 font-bold mb-1"><ShieldAlert size={16}/> Cuidado</div>
           <p className="leading-tight">Fórmulas quebradas detectadas. Backups manuais necessários.</p>
        </div>
      </div>

      {/* --- LAYER 2: CDF (Clipped Foreground) --- */}
      <motion.div 
        className="absolute inset-0 bg-white-900 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div className="absolute inset-0 bg-white flex flex-col text-slate-50 font-sans p-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center"><LayoutDashboard className="text-white w-5 h-5"/></div>
                    <span className="font-bold text-xl text-slate-800">Dashboard</span>
                </div>
                <div className="text-sm text-slate-800">Dados criptografados &bull; Atualizado agora</div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-50/10 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Patrimônio Líquido</span>
                    <div className="text-2xl font-bold mt-1 text-slate-600">R$ 142.050,00</div>
                    <div className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><Zap size={12}/> +12% esse mês</div>
                </div>
                <div className="bg-slate-50/10 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Projeção (90 dias)</span>
                    <div className="text-2xl font-bold mt-1 text-slate-600">R$ 35.200,00</div>
                    <div className="text-slate-400 text-xs mt-1">Baseado em recorrência</div>
                </div>
                <div className="bg-slate-50/10 p-4 rounded-xl border border-slate-200">
                     <span className="text-slate-400 text-xs uppercase tracking-wider">Dívidas Ativas</span>
                    <div className="text-2xl font-bold mt-1 text-slate-600">R$ 4.500,00</div>
                    <div className="text-orange-400 text-xs mt-1">2 parcelas restantes</div>
                </div>
            </div>

            {/* Simulated Chart Area */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 relative flex items-end px-4 pb-4 gap-2">
                 <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500">Fluxo de Caixa Projetado</div>
                 {[40, 65, 50, 80, 55, 90, 70, 85, 60, 95].map((h, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ height: 0 }} 
                        animate={{ height: `${h}%` }} 
                        transition={{ delay: 0.2 + (i * 0.05) }}
                        className={`flex-1 rounded-t-sm ${i > 6 ? 'bg-blue-500 border-t-2' : 'bg-blue-400'}`} // Future items highlighted
                    />
                 ))}
            </div>
        </div>
      </motion.div>

      {/* --- SLIDER HANDLE --- */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-slate-100 text-slate-900 transition-transform group-hover:scale-110">
            <div className="flex gap-1">
                <ArrowRight className="w-4 h-4 rotate-180" />
                <ArrowRight className="w-4 h-4" />
            </div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
         <span className={`px-3 py-1 rounded-full bg-white/90 text-xs font-bold shadow-sm transition-opacity ${sliderPosition < 15 ? 'opacity-0' : 'opacity-100'}`}>Planilha Manual</span>
      </div>
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
         <span className={`px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm transition-opacity ${sliderPosition > 85 ? 'opacity-0' : 'opacity-100'}`}>Sistema Inteligente</span>
      </div>

    </div>
  );
};

export default function ComparisonPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <PageWrapper>
      {/* --- HERO COMPARATIVO --- */}
      <section className="pt-24 pb-16 bg-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-950 mb-6">
                VS
                </span>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-900 mb-6">
                Evolua da Planilha.<br/>
                <span className="text-slate-400">Abrace o Sistema.</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-[700px] mx-auto leading-relaxed mb-12">
                Planilhas são ótimas para começar, mas péssimas para escalar. Veja como o CDF transforma horas de trabalho manual em inteligência automática.
                </p>
            </motion.div>

            {/* O Slider Interativo */}
            <div className="max-w-5xl mx-auto mb-16">
                <ComparisonSlider />
                <p className="text-xs text-slate-400 mt-4 font-mono">Arraste para comparar</p>
            </div>
        </div>
      </section>

      {/* --- FEATURE BATTLE --- */}
      <section className="py-24 bg-white" ref={ref}>
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
           
           {comparisonData.map((section, idx) => (
             <div key={section.category} className="mb-16">
                <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: idx * 0.2 }}
                    className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-slate-900 pl-4"
                >
                    {section.category}
                </motion.h3>

                <div className="grid gap-4">
                    {section.features.map((item, i) => (
                        <motion.div 
                            key={item.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="grid md:grid-cols-12 gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all hover:shadow-md group relative overflow-hidden"
                        >
                            {/* Feature Name */}
                            <div className="md:col-span-3 flex items-center font-semibold text-slate-900">
                                {item.name}
                            </div>

                            {/* Spreadsheet Side (Bad) */}
                            <div className="md:col-span-4 flex items-start gap-3 text-sm text-slate-500 opacity-70 group-hover:opacity-100 transition-opacity">
                                <FileSpreadsheet className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                <span>{item.sheet}</span>
                            </div>

                            {/* Arrow on Desktop */}
                            <div className="hidden md:flex md:col-span-1 items-center justify-center">
                                <ArrowRight className="w-5 h-5 text-slate-300" />
                            </div>

                            {/* CDF Side (Good) */}
                            <div className="md:col-span-4 flex items-start gap-3 text-sm font-medium text-slate-900">
                                <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                                <span>{item.cdf}</span>
                            </div>

                            {/* Highlight Background on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-emerald-50/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
                        </motion.div>
                    ))}
                </div>
             </div>
           ))}

        </div>
      </section>

      {/* --- CALL TO ACTION --- */}
      <section className="py-24 bg-blue-400 text-white text-center relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-slate-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-slate-900/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
           <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Pare de lutar contra as células.</h2>
           <p className="text-white max-w-xl mx-auto mb-10 text-lg">
             Importe seus dados hoje e veja seu fluxo de caixa projetado automaticamente para os próximos 12 meses.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <MotionButton variant="outline" asLink to="/cadastro" className="bg-white text-slate-900 hover:bg-slate-200 border-none font-bold h-12 px-8">
                Migrar para o CDF
             </MotionButton>
             <MotionButton variant="ghost" asLink to="/funcionalidades" className="text-white hover:text-white hover:bg-slate-800 h-12 px-8">
                Ver todas funcionalidades
             </MotionButton>
           </div>
        </div>
      </section>

    </PageWrapper>
  );
}
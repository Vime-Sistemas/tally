import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  RefreshCw, 
  Target, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  Facebook, 
  Chrome, // Trocando Chromium por Chrome para o ícone padrão
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import type { Page } from "@/types/navigation";

// --- Zod Schema ---
const signUpSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

export function SignUp({ onNavigate }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithRedirect } = useAuth0();

  // --- Form Setup ---
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "" },
  });

  // --- Handlers ---
  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
        login_hint: data.email,
        connection: 'Username-Password-Authentication',
        ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR',
      }
    });
    setIsLoading(false);
  };

  const handleSocialLogin = (connection: string) => {
    loginWithRedirect({ 
      authorizationParams: {
        connection: connection,
        screen_hint: 'signup',
        ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR'
      }
    });
  };

  // --- Data: Features ---
  const features = [
    {
      title: "Contas e Cartões",
      description: "Controle de limites, faturas e avisos de saldo.",
      icon: <CreditCard className="w-6 h-6 text-blue-400" />,
      items: ["Múltiplas contas", "Gestão de Fatura", "Avisos inteligentes"]
    },
    {
      title: "Transações",
      description: "Recorrências, parcelamentos e categorização.",
      icon: <RefreshCw className="w-6 h-6 text-blue-400" />,
      items: ["Gastos recorrentes", "Parcelamentos", "Histórico completo"]
    },
    {
      title: "Metas Financeiras",
      description: "Defina objetivos e acompanhe o progresso real.",
      icon: <Target className="w-6 h-6 text-blue-400" />,
      items: ["Objetivos de viagem", "Reserva de emergência", "Visualização clara"]
    },
    {
      title: "Investimentos",
      description: "Monitore a evolução do seu patrimônio global.",
      icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
      items: ["Cadastro de ativos", "Preço médio", "Curva de patrimônio"]
    },
    {
      title: "Orçamento",
      description: "Planeje seu mês e não gaste mais do que ganha.",
      icon: <PieChart className="w-6 h-6 text-blue-400" />,
      items: ["Previsto vs Realizado", "Visão mensal", "Alertas de desvio"]
    }
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-blue-100">
      
      {/* --- Navbar --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">CDF</span>
          </div>
          <div>
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('login')}
              className="text-zinc-600 hover:text-blue-400 hover:bg-blue-50 font-medium"
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section (Hybrid: Pitch + Form) --- */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Background blobs decorativos */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Pitch */}
          <div className="space-y-8 text-center lg:text-left z-10">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
              Novo: Integração completa de Orçamentos
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.15]">
              O cérebro da sua <br />
              <span className="text-blue-400">independência financeira.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Deixe de anotar gastos em cadernos. Tenha contas, cartões, metas e investimentos centralizados em uma plataforma inteligente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Dados criptografados
              </div>
              <div className="hidden sm:block w-1 h-1 bg-zinc-300 rounded-full" />
              <div>Plataforma 100% Gratuita para começar</div>
            </div>
          </div>

          {/* Right: Sign Up Card */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto bg-white rounded-2xl shadow-xl border border-zinc-100 p-6 sm:p-8 z-20 relative">
            <div className="absolute -top-4 -right-4 bg-blue-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
              Comece Agora
            </div>

            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-zinc-900">Crie sua conta</h2>
              <p className="text-zinc-500 text-sm">Junte-se ao CDF e controle seu dinheiro.</p>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button variant="outline" className="w-full" type="button" onClick={() => handleSocialLogin('google-oauth2')}>
                <Chrome className="mr-2 h-4 w-4 text-blue-400" /> Google
              </Button>
              <Button variant="outline" className="w-full" type="button" onClick={() => handleSocialLogin('facebook')}>
                <Facebook className="mr-2 h-4 w-4 text-blue-400" /> Facebook
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400">Ou use seu e-mail</span></div>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" placeholder="Seu nome" {...form.register("name")} className="h-10 focus-visible:ring-blue-400" />
                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...form.register("email")} className="h-10 focus-visible:ring-blue-400" />
                {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full h-11 bg-blue-400 hover:bg-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition-all" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar conta grátis"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
            
            <p className="mt-4 text-center text-xs text-zinc-400">
              Ao criar conta, você concorda com nossos Termos de Uso.
            </p>
          </div>
        </div>
      </section>

      {/* --- Features Grid Section --- */}
      <section className="py-20 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
              Funcionalidades que você desconhece (ainda)
            </h2>
            <p className="text-zinc-500 text-lg">
              O CDF vai muito além do básico. Descubra ferramentas poderosas projetadas para quem quer enriquecer de verdade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-zinc-500 mb-4 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-zinc-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            {/* Last Card: Call to Action Style */}
            <div className="bg-blue-400 p-6 rounded-2xl shadow-lg flex flex-col justify-center text-white relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-2xl font-bold mb-2 relative z-10">E muito mais...</h3>
              <p className="text-blue-50 mb-6 relative z-10">
                Relatórios mensais, categorização automática e suporte premium.
              </p>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full bg-white text-blue-500 font-bold py-3 rounded-lg hover:bg-blue-50 transition-colors relative z-10 shadow-sm"
              >
                Começar agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-8 bg-white border-t border-zinc-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="w-6 h-6 bg-blue-400 rounded-md flex items-center justify-center text-white text-xs font-bold">C</div>
          <span className="font-bold text-zinc-900">CDF</span>
        </div>
        <p className="text-zinc-400 text-sm">
          © 2025 Cérebro das Finanças (CDF). Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
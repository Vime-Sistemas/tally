import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  CreditCard, 
  Target, 
  TrendingUp, 
  LayoutDashboard,
  Users,
  FileText,
  Chrome, 
  Facebook,
  ArrowRight,
  Check,
  ShieldCheck,
  Briefcase,
  User
} from "lucide-react";
import type { Page } from "@/types/navigation";

// --- Types & Schema ---
type AccountType = 'PERSONAL' | 'PLANNER';

const signUpSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

// --- Images (Unsplash IDs) ---
// Adicionei parâmetros 'auto=format' e 'q=80' para otimizar o carregamento
const IMG_PERSONAL = "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2000&auto=format&fit=crop";
const IMG_PLANNER = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2000&auto=format&fit=crop";

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

export function SignUp({ onNavigate }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL');
  const [animateHeader, setAnimateHeader] = useState(false);
  const { loginWithRedirect } = useAuth0();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => { setAnimateHeader(true) }, []);

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
        login_hint: data.email,
        connection: 'Username-Password-Authentication',
      }
    });
    setIsLoading(false);
  };

  const handleSocialLogin = (connection: string) => {
    loginWithRedirect({ authorizationParams: { connection, screen_hint: 'signup' } });
  };

  // --- Dynamic Styling Configuration ---
  const isPlanner = accountType === 'PLANNER';
  
  const theme = isPlanner ? {
    primary: "bg-emerald-400 hover:bg-emerald-500",
    text: "text-emerald-400",
    lightBg: "bg-emerald-50",
    border: "border-emerald-100",
    ring: "focus-visible:ring-emerald-600",
  } : {
    primary: "bg-blue-400 hover:bg-blue-500",
    text: "text-blue-400",
    lightBg: "bg-blue-50",
    border: "border-blue-100",
    ring: "focus-visible:ring-blue-600",
  };

  const content = {
    PERSONAL: {
      pill: "Para Você e sua Família",
      headlineStart: "O cérebro da sua",
      headlineEnd: "independência financeira.",
      description: "Chega de planilhas quebradas. Centralize contas, cartões e investimentos em uma plataforma inteligente que trabalha por você.",
      features: [
        { title: "Controle Total", desc: "Cartões e contas em um só lugar.", icon: CreditCard },
        { title: "Metas Reais", desc: "Planejamento visual de sonhos.", icon: Target },
        { title: "Investimentos", desc: "Acompanhamento de rentabilidade.", icon: TrendingUp },
      ]
    },
    PLANNER: {
      pill: "Para Consultores & Planejadores",
      headlineStart: "Potencialize sua",
      headlineEnd: "consultoria financeira.",
      description: "Centralize a gestão financeira dos seus clientes. Aumente sua produtividade, elimine o trabalho manual e entregue valor real com análises profissionais.",
      features: [
        { title: "Gestão de Clientes", desc: "Painel multiparceiros unificado.", icon: Users },
        { title: "Visão Integrada", desc: "Todas as carteiras em um só lugar.", icon: LayoutDashboard },
        { title: "Relatórios Auto", desc: "PDFs profissionais em 1 clique.", icon: FileText },
      ]
    }
  };

  const current = content[accountType];

  return (
    // FIX 1: Removida a cor de fundo (bg-zinc-50) daqui para não cobrir a imagem
    <div className="min-h-screen text-zinc-900 font-sans selection:bg-zinc-100 overflow-x-hidden relative flex flex-col">
      
      {/* --- Background Images (FIXED POSITION) --- */}
      {/* FIX 2: Usando 'fixed inset-0' e z-index negativo para garantir que fique no fundo mas visível */}
      <div className="fixed inset-0 -z-50">
        {/* Image for Personal */}
        <div 
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out",
            !isPlanner ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url(${IMG_PERSONAL})` }}
        />
        {/* Image for Planner */}
        <div 
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out",
            isPlanner ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url(${IMG_PLANNER})` }}
        />
        {/* Overlay branco suave para garantir leitura do texto */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px]" />
      </div>

      {/* --- Navbar --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={"h-9 w-9"}>
              <img src="icon.svg"></img>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">CDF</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden sm:inline text-sm text-zinc-600 font-medium">Já tem conta?</span>
             <Button variant="outline" onClick={() => onNavigate('login')} className="font-medium bg-white/50 hover:bg-white/80 border-zinc-200/50">
               Entrar
             </Button>
          </div>
        </div>
      </nav>

      {/* --- Main Section --- */}
      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* LEFT: Copy & Value Prop */}
          <div className={`lg:col-span-7 space-y-8 transition-all duration-700 ${animateHeader ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Pill Badge */}
            <div className={cn("inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 bg-white/80 backdrop-blur-md shadow-sm", theme.text, theme.border)}>
              <span className={cn("flex h-2 w-2 rounded-full mr-2 animate-pulse bg-current")} />
              {current.pill}
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 leading-[1.1] drop-shadow-sm">
              {current.headlineStart} <br className="hidden lg:block"/>
              <span className={cn("transition-colors duration-500 block mt-2", theme.text)}>
                {current.headlineEnd}
              </span>
            </h1>
            
            <p className="text-xl text-zinc-600 max-w-2xl leading-relaxed font-medium">
              {current.description}
            </p>

            {/* Feature Cards */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              {current.features.map((feature, idx) => (
                <div key={idx} className="group flex flex-col gap-3 p-4 rounded-2xl bg-white/60 border border-white/50 shadow-sm hover:shadow-md transition-all backdrop-blur-md">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300", theme.lightBg, theme.text)}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{feature.title}</h4>
                    <p className="text-sm text-zinc-600 leading-snug mt-1 font-medium">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 text-sm text-zinc-600 font-medium pt-2">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" />
                 Dados Criptografados
               </div>
               <div className="hidden sm:flex items-center gap-2">
                 <Check className="w-4 h-4 text-emerald-600" />
                 Setup Gratuito
               </div>
            </div>
          </div>

          {/* RIGHT: High-Converting Form */}
          <div className="lg:col-span-5 w-full">
            <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-zinc-900/10 border border-white/60 p-8 overflow-hidden">
              
              {/* Toggle Switch */}
              <div className="flex justify-center mb-8">
                <div className="bg-zinc-100/80 p-1.5 rounded-full inline-flex w-full sm:w-auto relative border border-zinc-200/50">
                  <div 
                    className={cn(
                      "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                      isPlanner ? "translate-x-[100%] left-1.5" : "left-1.5"
                    )}
                  />
                  
                  <button 
                    type="button"
                    onClick={() => setAccountType('PERSONAL')}
                    className={cn(
                      "relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300",
                      !isPlanner ? "text-blue-500" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    <User className="w-4 h-4" /> Para mim
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAccountType('PLANNER')}
                    className={cn(
                      "relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300",
                      isPlanner ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    <Briefcase className="w-4 h-4" /> Sou Planejador
                  </button>
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-zinc-900">
                  {isPlanner ? "Comece a escalar" : "Crie sua conta"}
                </h3>
                <p className="text-zinc-500 mt-2 text-sm font-medium">
                  {isPlanner ? "Ferramenta profissional para consultores." : "Junte-se a 10.000+ membros inteligentes."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-11 w-full hover:bg-zinc-50 font-medium border-zinc-200/80 bg-white/50" type="button" onClick={() => handleSocialLogin('google-oauth2')}>
                    <Chrome className={cn("mr-2 h-4 w-4", theme.text)} /> Google
                  </Button>
                  <Button variant="outline" className="h-11 w-full hover:bg-zinc-50 font-medium border-zinc-200/80 bg-white/50" type="button" onClick={() => handleSocialLogin('facebook')}>
                    <Facebook className={cn("mr-2 h-4 w-4", theme.text)} /> Facebook
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200/80" /></div>
                  <div className="relative flex justify-center text-xs uppercase font-medium tracking-wide"><span className="bg-white/80 px-3 text-zinc-400">ou e-mail</span></div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-zinc-700 ml-1">NOME COMPLETO</Label>
                    <Input id="name" placeholder="Como você quer ser chamado?" {...form.register("name")} className={cn("h-11 bg-white/50 border-zinc-200/80 transition-all", theme.ring)} />
                    {form.formState.errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{form.formState.errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 ml-1">E-MAIL</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" {...form.register("email")} className={cn("h-11 bg-white/50 border-zinc-200/80 transition-all", theme.ring)} />
                    {form.formState.errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{form.formState.errors.email.message}</p>}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className={cn("w-full h-12 text-white font-bold text-base shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2", theme.primary)} 
                  disabled={isLoading}
                >
                  {isLoading ? "Processando..." : (
                    <span className="flex items-center">
                      {isPlanner ? "Criar Conta Profissional" : "Criar Conta Grátis"} 
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>
              
              <p className="mt-6 text-center text-xs text-zinc-500 font-medium">
                Ao clicar em criar, você concorda com nossos Termos de Uso.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="py-8 text-center border-t border-white/20 bg-white/40 backdrop-blur-md relative z-10">
        <p className="text-zinc-500 text-sm font-medium">
          © 2025 Cérebro das Finanças (CDF).
        </p>
      </footer>
    </div>
  );
}
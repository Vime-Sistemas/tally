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
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { 
  ChevronRight, 
  Facebook, 
  Chrome, 
  Clock, 
  X, 
  User, 
  Briefcase 
} from "lucide-react";
import { encryptPayload, decryptPayload } from "@/utils/crypto";
import type { Page } from "@/types/navigation";

// --- Types & Schema ---
type AccountType = 'PERSONAL' | 'PLANNER';

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  onNavigate: (page: Page) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL');
  const { loginWithRedirect } = useAuth0();

  const [lastSocial, setLastSocial] = useState<string | null>(null);
  const [lastAccount, setLastAccount] = useState<string | null>(null);

  // --- Logic: Restore Session ---
  useEffect(() => {
    try {
      const data = localStorage.getItem('tally_u');
      if (data) {
        const decrypted = decryptPayload<{ social?: string; account?: string }>(data);
        if (decrypted.social) setLastSocial(decrypted.social);
        if (decrypted.account) setLastAccount(decrypted.account);
      }
    } catch (e) {
      // ignore corruption
    }
  }, []);

  // --- Logic: Save Session ---
  const saveLastData = (social?: string, account?: string) => {
    try {
      const current = localStorage.getItem('tally_u');
      let data: { social?: string; account?: string } = {};
      try {
        data = decryptPayload<{ social?: string; account?: string }>(current || '{}');
      } catch (e) { /* ignore */ }
      
      if (social !== undefined) data.social = social;
      if (account !== undefined) data.account = account;
      
      localStorage.setItem('tally_u', encryptPayload(data));
    } catch (e) { /* ignore */ }
  };

  const saveLastAccount = (email: string) => {
    saveLastData(undefined, email);
    setLastAccount(email);
  };

  const clearLastData = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click
    try { localStorage.removeItem('tally_u'); } catch (e) { /* ignore */ }
    setLastAccount(null);
    setLastSocial(null);
    form.setValue('email', '');
  };

  // --- Helpers ---
  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length-1]}@${domain}`;
  };

  // --- Form ---
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    saveLastAccount(data.email);
    localStorage.setItem('signup_account_type', accountType);
    
    // Você pode passar o accountType como parâmetro extra se precisar direcionar no Auth0
    await loginWithRedirect({
      authorizationParams: {
        login_hint: data.email,
        ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR',
      }
    });
    setIsLoading(false);
  };

  const handleSocialLogin = (connection: string) => {
    saveLastData(connection, undefined);
    setLastSocial(connection);
    localStorage.setItem('signup_account_type', accountType);
    loginWithRedirect({ 
      authorizationParams: {
        connection: connection,
        ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR'
      }
    });
  };

  // --- Dynamic Theme ---
  const isPlanner = accountType === 'PLANNER';

  const theme = isPlanner ? {
    primary: "bg-emerald-500 hover:bg-emerald-600",
    text: "text-emerald-600",
    border: "border-emerald-100",
    ring: "focus-visible:ring-emerald-500",
    iconBg: "bg-emerald-50",
    overlay: "bg-emerald-900/60 mix-blend-multiply",
    socialActive: "border-emerald-400 bg-emerald-50/50 text-emerald-700"
  } : {
    // Usando Emerald conforme solicitado
    primary: "bg-blue-400 hover:bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-100",
    ring: "focus-visible:ring-blue-500",
    iconBg: "bg-blue-50",
    overlay: "bg-blue-900/60 mix-blend-multiply",
    socialActive: "border-blue-400 bg-blue-50/50 text-blue-700"
  };

  // --- Content ---
  const slides = [
    {
      quote: "Finalmente consegui entender para onde meu dinheiro vai todo mês, sem planilhas complexas.",
      author: "Controle financeiro pessoal",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1470&auto=format&fit=crop"
    },
    {
      quote: "Ver minhas metas avançando aos poucos me ajudou a manter a disciplina financeira.",
      author: "Organização e metas",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2400&auto=format&fit=crop"
    },
    {
      quote: "A visão unificada das carteiras dos meus clientes aumentou minha produtividade.",
      author: "Gestão profissional", // Um slide focado em B2B
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="w-full h-screen flex overflow-hidden bg-white">
      
      {/* --- Left Side (Visual) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 text-white overflow-hidden">
        {/* Dynamic Overlay Color */}
        <div className={cn("absolute inset-0 z-10 transition-colors duration-700", theme.overlay)} />
        
        {/* Content Wrapper */}
        <div className="relative z-20 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white font-bold">
              <img src="icon.svg"></img>
            </div>
            <span className="text-xl font-bold tracking-tight">CDF</span>
          </div>

          <div className="w-full max-w-md">
            <Carousel 
              plugins={[Autoplay({ delay: 5000 })]}
              opts={{ loop: true }}
              className="w-full"
            >
              <CarouselContent>
                {slides.map((slide, index) => (
                  <CarouselItem key={index}>
                    <div className="space-y-6 animate-in fade-in duration-700">
                      <blockquote className="text-2xl font-medium leading-relaxed">
                        "{slide.quote}"
                      </blockquote>
                      <div className="flex items-center gap-2 text-white/80">
                        <div className="h-0.5 w-4 bg-white/50" />
                        <p className="font-medium text-sm">{slide.author}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
          
          <div className="text-xs text-white/40 flex justify-between items-end">
            <p>© 2025 Cérebro das Finanças</p>
          </div>
        </div>

        {/* Background Images Carousel */}
        <div className="absolute inset-0 z-0">
           <Carousel 
             plugins={[Autoplay({ delay: 5000 })]}
             opts={{ loop: true, watchDrag: false }} 
             className="w-full h-full"
           >
             <CarouselContent className="h-full ml-0">
               {slides.map((slide, index) => (
                 <CarouselItem key={index} className="pl-0 h-full">
                    <img 
                      src={slide.image} 
                      alt="Background" 
                      className="w-full h-full object-cover opacity-60 grayscale transition-transform duration-[10s] hover:scale-105" 
                    />
                 </CarouselItem>
               ))}
             </CarouselContent>
           </Carousel>
        </div>
      </div>

      {/* --- Right Side (Form) --- */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-24">
          <div className="w-full max-w-sm space-y-8">
            
            {/* Context Switcher (Pill) */}
            <div className="flex justify-center mb-6">
              <div className="bg-zinc-100 p-1.5 rounded-full inline-flex relative border border-zinc-200">
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
                    "relative z-10 flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold transition-colors duration-300",
                    !isPlanner ? "text-blue-400" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <User className="w-3.5 h-3.5" /> Para mim
                </button>
                <button 
                  type="button"
                  onClick={() => setAccountType('PLANNER')}
                  className={cn(
                    "relative z-10 flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold transition-colors duration-300",
                    isPlanner ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Briefcase className="w-3.5 h-3.5" /> Planejador
                </button>
              </div>
            </div>

            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                {isPlanner ? "Portal do Planejador" : "Bem-vindo de volta"}
              </h1>
              <p className="text-zinc-500">
                {isPlanner 
                  ? "Gerencie seus clientes com inteligência." 
                  : "Acesse sua central de controle financeiro."}
              </p>
            </div>

            {/* --- Last Account Recognition Card --- */}
            {lastAccount && (
              <div className={cn(
                "relative group overflow-hidden bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer",
                theme.border,
                // Hover border color
                isPlanner ? "hover:border-indigo-300" : "hover:border-emerald-300"
              )}>
                <div className="absolute top-0 right-0 p-3 z-10">
                   <button 
                    onClick={clearLastData} 
                    className="text-zinc-300 hover:text-red-400 transition-colors p-1 hover:bg-zinc-50 rounded-full"
                   >
                      <X className="w-4 h-4" />
                   </button>
                </div>
                
                <div 
                  onClick={() => form.setValue('email', lastAccount)}
                  className="flex items-center gap-4"
                >
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0 transition-colors", theme.iconBg, theme.text)}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium mb-0.5", theme.text)}>Continuar como</p>
                    <p className="text-sm font-semibold text-zinc-900 truncate">{maskEmail(lastAccount)}</p>
                  </div>
                  <ChevronRight className={cn("w-5 h-5 text-zinc-300 group-hover:translate-x-1 transition-all", `group-hover:${theme.text}`)} />
                </div>
              </div>
            )}

            {/* --- Social Login --- */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className={cn(
                  "h-11 transition-all", 
                  lastSocial === 'google-oauth2' ? theme.socialActive : "hover:bg-zinc-50"
                )}
                onClick={() => handleSocialLogin('google-oauth2')}
              >
                <Chrome className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button 
                variant="outline" 
                className={cn(
                  "h-11 transition-all", 
                  lastSocial === 'facebook' ? theme.socialActive : "hover:bg-zinc-50"
                )}
                onClick={() => handleSocialLogin('facebook')}
              >
                <Facebook className="mr-2 h-4 w-4" /> Facebook
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400">Ou use seu e-mail</span></div>
            </div>

            {/* --- Email Form --- */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    {...form.register("email")} 
                    className={cn(
                      "h-11 bg-zinc-50/50 focus:bg-white transition-all",
                      theme.ring
                    )}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className={cn("w-full h-11 text-white font-semibold transition-all shadow-md hover:shadow-lg", theme.primary)} 
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar na conta"}
                {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-zinc-500">Ainda não tem conta? </span>
              <button 
                onClick={() => onNavigate('signup')} 
                className={cn("font-medium hover:underline underline-offset-4", theme.text)}
              >
                Criar conta gratuita
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
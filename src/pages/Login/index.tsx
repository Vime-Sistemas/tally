import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Briefcase,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { encryptPayload, decryptPayload } from "@/utils/crypto";

// --- Types & Schema ---
type AccountType = 'PERSONAL' | 'PLANNER';

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL');
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

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
    e.stopPropagation();
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

  // --- Dynamic Theme (Updated for Linear Look) ---
  const isPlanner = accountType === 'PLANNER';

  const theme = isPlanner ? {
    // Planner: Emerald / Dark Green Professional
    primary: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10",
    text: "text-emerald-700",
    border: "border-emerald-200",
    ring: "focus-visible:ring-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-700",
    pillActive: "bg-emerald-600 text-white",
    socialActive: "border-emerald-200 bg-emerald-50 text-emerald-800",
    overlay: "bg-emerald-950/40 mix-blend-multiply" 
  } : {
    // Personal: Slate / Monochrome Minimalist
    primary: "bg-blue-400 hover:bg-blue-500 shadow-blue-900/10",
    text: "text-slate-700",
    border: "border-slate-200",
    ring: "focus-visible:ring-slate-900",
    iconBg: "bg-slate-100 text-slate-900",
    pillActive: "bg-blue-400 text-white",
    socialActive: "border-slate-300 bg-slate-50 text-slate-900",
    overlay: "bg-slate-950/40 mix-blend-multiply"
  };

  // --- Content Slides ---
  const slides = [
    {
      quote: "O controle que faltava para escalar meu patrimônio com segurança.",
      author: "Investidor Pessoal",
      image: "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?q=80&w=2070&auto=format&fit=crop"
    },
    {
      quote: "Centralizo a visão de todos os meus clientes em um único dashboard.",
      author: "Wealth Advisor",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop"
    },
    {
      quote: "Adeus planilhas quebradas. Olá previsibilidade financeira.",
      author: "CFO de Startups",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
    }
  ];

  return (
    <div className="w-full h-screen flex overflow-hidden bg-white font-sans text-slate-950 selection:bg-slate-900 selection:text-white">
      
      {/* --- Left Side (Visual / Atmosfera) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Dynamic Overlay */}
        <div className={cn("absolute inset-0 z-10 transition-colors duration-1000 ease-in-out", theme.overlay)} />
        
        {/* Animated Background Image Carousel */}
        <div className="absolute inset-0 z-0 scale-105">
           <Carousel 
             plugins={[Autoplay({ delay: 6000 })]}
             opts={{ loop: true, watchDrag: false }} 
             className="w-full h-full"
           >
             <CarouselContent className="h-full ml-0">
               {slides.map((slide, index) => (
                 <CarouselItem key={index} className="pl-0 h-full">
                    <motion.img 
                      initial={{ scale: 1 }}
                      animate={{ scale: 1.05 }}
                      transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                      src={slide.image} 
                      alt="Background" 
                      className="w-full h-full object-cover opacity-60 grayscale filter contrast-125" 
                    />
                 </CarouselItem>
               ))}
             </CarouselContent>
           </Carousel>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-20 flex flex-col justify-between h-full p-16">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center">
                <Brain className="h-5 w-5 text-blue-400" />
             </div>
             <span className="text-xl font-bold tracking-tight text-white">Cérebro das Finanças</span>
          </div>

          <div className="max-w-md">
            <Carousel 
              plugins={[Autoplay({ delay: 6000 })]}
              opts={{ loop: true }}
              className="w-full"
            >
              <CarouselContent>
                {slides.map((slide, index) => (
                  <CarouselItem key={index}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                    >
                      <blockquote className="text-3xl font-medium leading-tight text-white tracking-tight">
                        "{slide.quote}"
                      </blockquote>
                      <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-white/40" />
                        <p className="font-medium text-sm text-white/80 uppercase tracking-wider">{slide.author}</p>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
          
          <div className="text-xs text-white/30 flex justify-between items-end font-medium">
            <p>© {new Date().getFullYear()} Cérebro das Finanças</p>
            <p>v2.0.4</p>
          </div>
        </div>
      </div>

      {/* --- Right Side (Form) --- */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white">
        
        {/* Top Navigation for Mobile */}
        <div className="lg:hidden p-6 flex items-center gap-2">
           <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
           </div>
           <span className="font-bold">CDF</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-24">
          <div className="w-full max-w-sm space-y-10">
            
            {/* Header + Toggle */}
            <div className="space-y-8">
               <div className="space-y-2 text-center">
                <motion.h1 
                    key={accountType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold tracking-tighter text-slate-900"
                >
                  {isPlanner ? "Portal do Advisor" : "Bem-vindo de volta"}
                </motion.h1>
                <p className="text-slate-500 text-sm">
                  {isPlanner ? "Gerencie carteiras de clientes." : "Acesse seu controle financeiro."}
                </p>
              </div>

               {/* Custom Motion Toggle */}
               <div className="flex justify-center">
                  <div className="bg-slate-100 p-1 rounded-full inline-flex relative border border-slate-200">
                    {['PERSONAL', 'PLANNER'].map((type) => {
                        const isActive = accountType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => setAccountType(type as AccountType)}
                                className={cn(
                                    "relative z-10 flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold transition-colors duration-200",
                                    isActive ? (isPlanner ? "text-white" : "text-white") : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="pill"
                                        className={cn("absolute inset-0 rounded-full shadow-sm", theme.pillActive)}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    {type === 'PERSONAL' ? <User className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                                    {type === 'PERSONAL' ? 'Para mim' : 'Advisor'}
                                </span>
                            </button>
                        );
                    })}
                  </div>
               </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="space-y-6">
                
                {/* Last Account Recognition (Apple Style) */}
                <AnimatePresence>
                  {lastAccount && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "relative group overflow-hidden bg-white border rounded-xl p-1 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer",
                          theme.border
                        )}
                        onClick={() => form.setValue('email', lastAccount)}
                    >
                      <div className="flex items-center p-3 gap-4">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors", theme.iconBg)}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-500">Continuar como</p>
                          <p className={cn("text-sm font-semibold truncate", theme.text)}>{maskEmail(lastAccount)}</p>
                        </div>
                        <div className="pr-2">
                           <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                        </div>
                      </div>
                      
                      {/* Close Button Absolute */}
                      <button 
                         onClick={clearLastData} 
                         className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-slate-50"
                      >
                         <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Social Login Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[{ id: 'google-oauth2', icon: Chrome, label: 'Google' }, { id: 'facebook', icon: Facebook, label: 'Facebook' }].map((provider) => (
                         <Button 
                            key={provider.id}
                            variant="outline" 
                            type="button"
                            className={cn(
                            "h-11 bg-white hover:bg-slate-50 transition-all font-medium text-slate-600 border-slate-200", 
                            lastSocial === provider.id && theme.socialActive
                            )}
                            onClick={() => handleSocialLogin(provider.id)}
                        >
                            <provider.icon className="mr-2 h-4 w-4" /> {provider.label}
                        </Button>
                    ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-semibold"><span className="bg-white px-2 text-slate-400">Ou use e-mail</span></div>
                </div>

                {/* Email Form */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-mail</Label>
                    <div className="relative">
                         <Input 
                            id="email" 
                            type="email" 
                            placeholder="seu@email.com" 
                            {...form.register("email")} 
                            className={cn(
                                "h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all pl-4",
                                theme.ring
                            )}
                        />
                        {/* Status Icon Indicator (Optional Enhancement) */}
                        {!form.formState.errors.email && form.watch('email') && (
                            <div className="absolute right-3 top-3 text-emerald-500 animate-in fade-in zoom-in">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    {form.formState.errors.email && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 font-medium">
                          {form.formState.errors.email.message}
                      </motion.p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className={cn("w-full h-11 text-white font-bold tracking-wide transition-all shadow-lg active:scale-[0.98]", theme.primary)} 
                    disabled={isLoading}
                  >
                    {isLoading ? "Autenticando..." : "Entrar na Conta"}
                    {!isLoading && <ChevronRight className="ml-2 h-4 w-4 opacity-70" />}
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <span className="text-slate-500">Novo por aqui? </span>
                  <button 
                    type="button"
                    onClick={() => navigate('/cadastro')} 
                    className={cn("font-bold hover:underline underline-offset-4 transition-colors", theme.text)}
                  >
                    Criar conta gratuita
                  </button>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
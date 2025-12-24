import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  // CarouselNext, // Opcional no login, deixei autoplay para ser mais clean
  // CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ChevronRight, Facebook, Chrome, Clock, X } from "lucide-react";
import { encryptPayload, decryptPayload } from "@/utils/crypto";
import type { Page } from "@/types/navigation";

// --- Schema ---
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  onNavigate: (page: Page) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
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

  const clearLastData = () => {
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
    loginWithRedirect({ 
      authorizationParams: {
        connection: connection,
        ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR'
      }
    });
  };

  // --- Content ---
  const slides = [
    {
      quote: "Finalmente consegui entender para onde meu dinheiro vai todo mês, sem planilhas.",
      author: "Controle financeiro pessoal",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1470&auto=format&fit=crop"
    },
    {
      quote: "Ver minhas metas avançando aos poucos me ajudou a manter a disciplina financeira.",
      author: "Organização e metas",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2400&auto=format&fit=crop"
    },
    {
      quote: "Controlar cartão, gastos parcelados e recorrentes no mesmo lugar fez muita diferença.",
      author: "Gastos do dia a dia",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2400&auto=format&fit=crop"
    }
  ];


  return (
    <div className="w-full h-screen flex overflow-hidden bg-white">
      
      {/* --- Left Side (Visual) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 text-white">
        <div className="absolute inset-0 z-10 bg-blue-600/20 mix-blend-overlay" />
        
        {/* Content Wrapper */}
        <div className="relative z-20 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white font-bold">
              C
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
                    <div className="space-y-6">
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
            <p>© 2025 Vime Sistemas</p>
          </div>
        </div>

        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
           <Carousel 
              plugins={[Autoplay({ delay: 5000 })]}
              opts={{ loop: true, watchDrag: false }} // Sync visually implies visuals match quotes if ordered same
              className="w-full h-full"
            >
              <CarouselContent className="h-full ml-0">
                {slides.map((slide, index) => (
                  <CarouselItem key={index} className="pl-0 h-full">
                     <img 
                      src={slide.image} 
                      alt="Background" 
                      className="w-full h-full object-cover opacity-50 grayscale transition-all duration-[3000ms]" 
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
            
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Bem-vindo de volta</h1>
              <p className="text-zinc-500">Acesse sua central de controle financeiro.</p>
            </div>

            {/* --- Last Account Recognition Card --- */}
            {lastAccount && (
              <div className="relative group overflow-hidden bg-white border border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3">
                   <button onClick={clearLastData} className="text-zinc-300 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                   </button>
                </div>
                
                <div 
                  onClick={() => form.setValue('email', lastAccount)}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-500 mb-0.5">Continuar como</p>
                    <p className="text-sm font-semibold text-zinc-900 truncate">{maskEmail(lastAccount)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            )}

            {/* --- Social Login --- */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className={`h-11 ${lastSocial === 'google-oauth2' ? 'border-blue-400 bg-blue-50/50 text-blue-700' : 'hover:bg-zinc-50'}`}
                onClick={() => handleSocialLogin('google-oauth2')}
              >
                <Chrome className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button 
                variant="outline" 
                className={`h-11 ${lastSocial === 'facebook' ? 'border-blue-400 bg-blue-50/50 text-blue-700' : 'hover:bg-zinc-50'}`}
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
                    className="h-11 bg-zinc-50/50 focus:bg-white transition-colors"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 bg-blue-400 hover:bg-blue-500 text-white font-semibold" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar na conta"}
                {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-zinc-500">Ainda não tem conta? </span>
              <button 
                onClick={() => onNavigate('signup')} 
                className="font-medium text-blue-500 hover:text-blue-600 hover:underline underline-offset-4"
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
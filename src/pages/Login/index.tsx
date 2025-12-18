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
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ChevronRight, Facebook, Chromium, Clock, X } from "lucide-react";
import { encryptPayload, decryptPayload } from "@/utils/crypto";
import type { Page } from "@/types/navigation";

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

  useEffect(() => {
    try {
      const data = localStorage.getItem('tally_u');
      if (data) {
        const decrypted = decryptPayload<{ social?: string; account?: string }>(data);
        if (decrypted.social) setLastSocial(decrypted.social);
        if (decrypted.account) setLastAccount(decrypted.account);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveLastData = (social?: string, account?: string) => {
    try {
      const current = localStorage.getItem('tally_u');
      let data: { social?: string; account?: string } = {};
      try {
        data = decryptPayload<{ social?: string; account?: string }>(current || '{}');
      } catch (e) {
        // ignore
      }
      if (social !== undefined) data.social = social;
      if (account !== undefined) data.account = account;
      localStorage.setItem('tally_u', encryptPayload(data));
    } catch (e) {
      // ignore
    }
  };

  const saveLastAccount = (email: string) => {
    saveLastData(undefined, email);
    setLastAccount(email);
  };

  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length-1]}@${domain}`;
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    // For custom UI with Auth0, we typically redirect to Universal Login
    // passing the email as a hint if possible, or use Resource Owner Password flow (not recommended).
    // Here we will redirect to the standard Auth0 login page for security.
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

  const clearLastData = () => {
    try {
      localStorage.removeItem('tally_u');
    } catch (e) {
      // ignore
    }
    setLastAccount(null);
    setLastSocial(null);
  };

  const features = [
    {
      title: "Controle Total",
      description: "Gerencie suas finanças pessoais e empresariais em um único lugar, com simplicidade e elegância.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2626&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Metas Claras",
      description: "Defina objetivos financeiros e acompanhe sua evolução com gráficos intuitivos e motivadores.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Insights Poderosos",
      description: "Tome decisões melhores com relatórios detalhados sobre seus hábitos de consumo e investimentos.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
  ];

  return (
    <div className="w-full h-screen flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* Left Side - Carousel */}
      <div className="hidden lg:flex w-1/2 bg-white text-zinc-900 relative flex-col justify-between p-12">
        <div className="z-10">
          <div className="h-6 w-6 bg-white rounded-md flex items-center justify-center">
              <img src="/icon.svg"></img>
            </div>
          <h1 className="text-2xl font-bold tracking-tighter text-blue-400">Cérebro de Finanças.</h1>
        </div>

        <div className="z-10 w-full max-w-5xl mx-auto">
          <Carousel 
            className="w-full"
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            opts={{
              loop: true,
            }}
          >
            <CarouselContent>
              {features.map((feature, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <div className="space-y-6">
                      <div className="aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                         <img src={feature.image} alt={feature.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-semibold tracking-tight text-blue-400">{feature.title}</h2>
                        <p className="text-zinc-500 text-lg leading-relaxed max-w-lg">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex gap-2 mt-8">
                <CarouselPrevious className="static translate-y-0 bg-white hover:bg-white border-zinc-200 text-zinc-900" />
                <CarouselNext className="static translate-y-0 bg-white hover:bg-white border-zinc-200 text-zinc-900" />
            </div>
          </Carousel>
        </div>

        <div className="z-10 text-sm text-zinc-500">
          © 2025 um produto da Vime Sistemas.
        </div>
        
        {/* Abstract Background Pattern - Light Version */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-white to-white opacity-80 pointer-events-none" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-24 bg-white">
        <div className="w-full max-w-sm space-y-6 sm:space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo de volta</h1>
            <p className="text-gray-500">Entre para acessar suas finanças.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <Button 
                variant="outline" 
                className={`w-full h-12 sm:h-14 px-4 sm:px-6 transition-all text-sm sm:text-base ${lastSocial === 'google-oauth2' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                type="button" 
                onClick={() => handleSocialLogin('google-oauth2')}
              >
                <Chromium className="mr-2 h-4 w-4 text-blue-400" />
                Google
              </Button>
              {lastSocial === 'google-oauth2' && (
                <div className="absolute -top-3 -right-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-400 text-white text-xs font-semibold rounded-full shadow-md">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">Recente</span>
                </div>
              )}
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                className={`w-full h-12 sm:h-14 px-4 sm:px-6 transition-all text-sm sm:text-base ${lastSocial === 'facebook' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                type="button" 
                onClick={() => handleSocialLogin('facebook')}
              >
                <Facebook className="mr-2 h-4 w-4 text-blue-400" />
                Facebook
              </Button>
              {lastSocial === 'facebook' && (
                <div className="absolute -top-3 -right-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-400 text-white text-xs font-semibold rounded-full shadow-md">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">Recente</span>
                </div>
              )}
            </div>
          </div>

          {lastAccount && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-400 flex items-center justify-center text-white text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Última conta</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={lastAccount}>
                      {maskEmail(lastAccount)}
                    </p>
                  </div>
                </div>
                <button
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  onClick={() => clearLastData()}
                  type="button"
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <button
                className="w-full mt-2 sm:mt-3 px-3 py-2 bg-blue-400 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                onClick={() => form.setValue('email', lastAccount)}
                type="button"
              >
                Continuar com essa conta
              </button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Ou continue com</span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...form.register("email")}
                  className="h-11"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base bg-blue-400 hover:bg-blue-500" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
              {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-500">Não tem uma conta? </span>
            <button 
              onClick={() => onNavigate('signup')} 
              className="font-medium text-black hover:underline underline-offset-4"
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

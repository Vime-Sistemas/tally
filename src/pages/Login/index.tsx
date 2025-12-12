import { useState } from "react";
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
import { ChevronRight, Facebook } from "lucide-react";
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
    await loginWithRedirect({
      authorizationParams: {
        login_hint: data.email,
        ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR',
      }
    });
    setIsLoading(false);
  };

  const handleSocialLogin = (connection: string) => {
    loginWithRedirect({ 
      authorizationParams: {
        connection: connection 
        ,ui_locales: import.meta.env.VITE_AUTH0_LOCALE || 'pt-BR'
      }
    });
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
      <div className="hidden lg:flex w-1/2 bg-zinc-50 text-zinc-900 relative flex-col justify-between p-12">
        <div className="z-10">
          <h1 className="text-2xl font-bold tracking-tighter">Cérebro de Finanças.</h1>
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
                      <div className="aspect-video overflow-hidden rounded-2xl shadow-2xl border border-zinc-200 bg-white">
                         <img src={feature.image} alt={feature.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-semibold tracking-tight">{feature.title}</h2>
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
                <CarouselPrevious className="static translate-y-0 bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-900" />
                <CarouselNext className="static translate-y-0 bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-900" />
            </div>
          </Carousel>
        </div>

        <div className="z-10 text-sm text-zinc-500">
          © 2025 um produto da Vime Sistemas.
        </div>
        
        {/* Abstract Background Pattern - Light Version */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-100 via-zinc-50 to-white opacity-80 pointer-events-none" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo de volta</h1>
            <p className="text-gray-500">Entre para acessar suas finanças.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full h-11" type="button" onClick={() => handleSocialLogin('google-oauth2')}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              Google
            </Button>
            <Button variant="outline" className="w-full h-11" type="button" onClick={() => handleSocialLogin('facebook')}>
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
          </div>

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

            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
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

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth0 } from "@auth0/auth0-react";
import { CheckCircle2, ArrowRight, ShieldCheck, LineChart, Wallet } from "lucide-react";

interface InviteDetails {
  token: string;
  planner: {
    name: string;
    picture?: string;
    businessName?: string;
  };
}

// Background Grid Pattern para dar textura profissional
const GridPattern = () => (
  <svg className="absolute inset-0 -z-10 h-full w-full stroke-zinc-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
    <defs>
      <pattern id="grid-pattern-invite" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M0 40L40 0H20L0 20M40 40V20L20 40" strokeWidth="1" fill="none" opacity="0.4" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" strokeWidth="0" fill="url(#grid-pattern-invite)" />
  </svg>
);

export function InviteLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      localStorage.setItem("invite_token", token);
      
      api.get(`/invites/${token}`)
        .then(res => setInvite(res.data))
        .catch(err => {
          console.error(err);
          setError("Este link de convite é inválido ou já expirou.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const handleSignup = () => {
    localStorage.setItem('signup_account_type', 'PERSONAL');
    loginWithRedirect({
      authorizationParams: { screen_hint: 'signup' },
      appState: { returnTo: '/dashboard-summary' }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        <p className="text-zinc-500 text-sm animate-pulse">Verificando convite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 relative overflow-hidden">
        <GridPattern />
        <Card className="w-full max-w-md text-center shadow-xl border-zinc-200">
          <CardContent className="pt-10 pb-10 space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-900">Convite não encontrado</h2>
              <p className="text-zinc-500">{error}</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <GridPattern />
      
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        
        {/* Logo/Brand Header */}
        <div className="text-center mb-8">
           <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-zinc-100 mb-6">
             <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-white text-[10px] font-bold"><img src="/icon.svg"></img></div>
             <span className="text-sm font-semibold text-zinc-900">CDF</span>
             <span className="text-zinc-300 mx-1">|</span>
             <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Convite Exclusivo</span>
           </div>
        </div>

        <Card className="border-zinc-200/60 shadow-2xl shadow-zinc-200/50 overflow-visible bg-white/80 backdrop-blur-sm">
          {/* Top colored bar */}
          <CardContent className="pt-0 pb-8 px-6 sm:px-8">
            
            {/* Planner Profile Section - Negative margin to pull avatar up */}
            <div className="flex flex-col items-center -mt-10 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 animate-pulse"></div>
                <Avatar className="h-24 w-24 border-[6px] border-white shadow-lg relative z-10">
                  <AvatarImage src={invite?.planner.picture} />
                  <AvatarFallback className="bg-blue-50 text-blue-700 text-2xl font-bold">
                    {invite?.planner.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 z-20 bg-blue-500 text-white p-1.5 rounded-full border-[3px] border-white shadow-sm" title="Planejador Verificado">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>

              <div className="text-center mt-4 space-y-1">
                <h2 className="text-2xl font-bold text-zinc-900">
                   {invite?.planner.name}
                </h2>
                {invite?.planner.businessName && (
                  <p className="text-emerald-700 font-medium text-sm bg-emerald-50 px-3 py-0.5 rounded-full inline-block">
                    {invite?.planner.businessName}
                  </p>
                )}
                <p className="text-zinc-500 text-sm pt-1">
                   te convidou para conectar suas finanças.
                </p>
              </div>
            </div>

            {/* Value Props / Context */}
            <div className="grid grid-cols-2 gap-3 mb-8">
               <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex flex-col items-center text-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-zinc-600 leading-tight">Acompanhamento Profissional</span>
               </div>
               <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex flex-col items-center text-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-zinc-600 leading-tight">Gestão Centralizada</span>
               </div>
            </div>

            {/* Main Action */}
            <div className="space-y-4">
              <Button 
                onClick={handleSignup} 
                className="w-full bg-blue-400 hover:bg-blue-500 text-white h-12 text-base font-semibold transition-all hover:-translate-y-0.5"
              >
                Aceitar Convite e Começar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-xs text-zinc-400 px-4">
                 Ao aceitar, você concorda em compartilhar seus dados de visualização (saldos e extratos) com este planejador.
              </p>
            </div>

            {/* Footer / Login Link */}
            <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
              <p className="text-sm text-zinc-500">
                Já possui uma conta no CDF?{' '}
                <button 
                  onClick={() => loginWithRedirect()} 
                  className="text-blue-400 hover:text-blue-500 font-semibold hover:underline decoration-2 underline-offset-2 transition-all"
                >
                  Entrar agora
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-400 text-xs font-medium">
           <ShieldCheck className="w-4 h-4" />
           <span>Ambiente Seguro e Criptografado</span>
        </div>
      </div>
    </div>
  );
}
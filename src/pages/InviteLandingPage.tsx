import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth0 } from "@auth0/auth0-react";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface InviteDetails {
  token: string;
  planner: {
    name: string;
    picture?: string;
    businessName?: string;
  };
}

export function InviteLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      // Store token for after login
      localStorage.setItem("invite_token", token);
      
      api.get(`/invites/${token}`)
        .then(res => setInvite(res.data))
        .catch(err => {
          console.error(err);
          setError("Convite inválido ou expirado.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const handleSignup = () => {
    // Store account type preference
    localStorage.setItem('signup_account_type', 'PERSONAL');
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
      appState: {
        returnTo: '/dashboard-summary'
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Ops!</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">CDF</h1>
          <p className="text-zinc-500">Gestão financeira inteligente</p>
        </div>

        <Card className="border-zinc-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                <AvatarImage src={invite?.planner.picture} />
                <AvatarFallback>{invite?.planner.name[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-xl">
              {invite?.planner.businessName || invite?.planner.name}
            </CardTitle>
            <CardDescription>
              convidou você para gerenciar suas finanças no Tally.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-800">
              <p>
                Ao criar sua conta, você será automaticamente conectado ao planejador para receber assessoria financeira.
              </p>
            </div>

            <Button 
              onClick={handleSignup} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base"
            >
              Aceitar Convite e Criar Conta
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="text-center text-xs text-zinc-500 mt-4">
              Já tem uma conta? <button onClick={() => loginWithRedirect()} className="text-emerald-600 hover:underline font-medium">Fazer Login</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

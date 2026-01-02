import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/services/api";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { 
  ShieldCheck, 
  Building2, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
} from "lucide-react";

interface PlannerRequest {
  id: string;
  planner: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    businessName?: string;
  };
}

export function PlannerInvitesDialog() {
  const { user } = useUser();
  const [requests, setRequests] = useState<PlannerRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Apenas usuários comuns (não planners) recebem convites de planners
    if (user && user.type !== 'PLANNER') {
      checkRequests();
    }
  }, [user]);

  const checkRequests = async () => {
    try {
      const response = await api.get('/client/requests');
      if (response.data && response.data.length > 0) {
        setRequests(response.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Failed to check planner requests", error);
    }
  };

  const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
    setIsLoading(true);
    try {
      await api.post(`/client/requests/${requestId}/${action}`);
      
      if (action === 'accept') {
        toast.success("Vínculo estabelecido com sucesso!");
      } else {
        toast.info("Convite recusado.");
      }

      // Remove o request atual da lista
      const remaining = requests.filter(r => r.id !== requestId);
      setRequests(remaining);

      // Se não houver mais requests, fecha o modal
      if (remaining.length === 0) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} convite.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (requests.length === 0) return null;

  const currentRequest = requests[0];
  const totalRequests = requests.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Impede fechar clicando fora se houver convites pendentes (opcional, mas recomendado para garantir ação)
      if (!open && requests.length === 0) {
        setIsOpen(false);
      }
    }}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0 border-0 shadow-2xl">
        
        {/* --- Header Visual --- */}
        <div className="bg-zinc-50 border-b border-zinc-100 p-6 flex flex-col items-center relative">
          {totalRequests > 1 && (
             <div className="absolute top-4 right-4 text-xs font-medium text-zinc-400 bg-white px-2 py-1 rounded-full border border-zinc-100 shadow-sm">
               {totalRequests} convites pendentes
             </div>
          )}
          
          <div className="relative mb-3">
             <div className="absolute -inset-1 rounded-full opacity-70 blur-sm animate-pulse" />
             <Avatar className="h-20 w-20 border-4 border-white shadow-lg relative z-10">
              <AvatarImage src={currentRequest.planner.picture} />
              <AvatarFallback className="bg-zinc-100 text-zinc-500 text-xl font-bold">
                {currentRequest.planner.name?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm z-20">
               <ShieldCheck className="w-5 h-5 text-emerald-500 fill-emerald-50" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="font-bold text-xl text-zinc-900 flex items-center justify-center gap-2">
              {currentRequest.planner.name}
            </h3>
            
            <div className="flex flex-col items-center gap-1 text-sm text-zinc-500">
              {currentRequest.planner.businessName && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{currentRequest.planner.businessName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                 <Mail className="w-3.5 h-3.5" />
                 <span>{currentRequest.planner.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Body Content --- */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <DialogHeader className="p-0 space-y-1 text-left">
              <DialogTitle className="text-base text-zinc-900">Solicitação de Acesso</DialogTitle>
              <DialogDescription className="text-zinc-500 text-sm">
                Este planejador está solicitando acesso para visualizar seus dados e auxiliar na sua estratégia.
              </DialogDescription>
            </DialogHeader>

            {/* Permissions List */}
            <div className="bg-zinc-50/50 rounded-lg p-3 border border-zinc-100 space-y-2">
               <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 pl-1">O QUE SERÁ COMPARTILHADO:</p>
               <div className="grid grid-cols-1 gap-2">
                 <div className="flex items-center gap-2 text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Visualização de contas e saldos</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Histórico de transações</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Demais dados financeiros</span>
                 </div>
               </div>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-md">
               <AlertCircle className="w-4 h-4 shrink-0" />
               <p>O planejador <strong>não pode</strong> movimentar seu dinheiro ou realizar transações em seu nome.</p>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleAction(currentRequest.id, 'reject')}
              disabled={isLoading}
              className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              Recusar
            </Button>
            <Button 
              onClick={() => handleAction(currentRequest.id, 'accept')}
              disabled={isLoading}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white"
            >
              {isLoading ? "Processando..." : "Confirmar Acesso"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
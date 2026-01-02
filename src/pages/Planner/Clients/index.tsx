import { useState, useEffect } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Mail, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientDashboard } from "./ClientDashboard";
import { ClientTransactions } from "./ClientTransactions";

interface Client {
  id: string;
  name: string;
  email: string;
  picture?: string;
  createdAt: string;
}

interface Request {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
}

export function PlannerClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'TRANSACTIONS'>('DASHBOARD');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, requestsRes] = await Promise.all([
        api.get('/planner/clients'),
        api.get('/planner/requests')
      ]);
      setClients(clientsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await api.post('/planner/invite', { email: inviteEmail });
      toast.success("Convite enviado com sucesso!");
      setInviteEmail("");
      setIsInviteOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Erro ao enviar convite.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja remover este cliente?")) return;
    try {
      await api.delete(`/planner/clients/${clientId}`);
      toast.success("Cliente removido.");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover cliente.");
    }
  };

  if (selectedClient) {
    if (viewMode === 'TRANSACTIONS') {
      return (
        <ClientTransactions 
          client={selectedClient} 
          onBack={() => setViewMode('DASHBOARD')} 
        />
      );
    }
    return (
      <ClientDashboard 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
        onViewAllTransactions={() => setViewMode('TRANSACTIONS')}
      />
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Meus Clientes</h1>
          <p className="text-zinc-500 mt-1">Gerencie sua carteira de clientes e convites.</p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Cliente</DialogTitle>
              <DialogDescription>
                Digite o e-mail do usuário que você deseja gerenciar. Ele receberá uma notificação para aceitar o vínculo.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input 
                  placeholder="email@exemplo.com" 
                  className="pl-9" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
              <Button onClick={handleInvite} disabled={isInviting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isInviting ? "Enviando..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {/* Active Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Carteira Ativa</CardTitle>
            <CardDescription>Clientes que você gerencia atualmente.</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <div className="bg-zinc-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-zinc-400" />
                </div>
                <p>Nenhum cliente vinculado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="cursor-pointer hover:bg-zinc-50"
                      onClick={() => {
                        setSelectedClient(client);
                        setViewMode('DASHBOARD');
                      }}
                    >
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={client.picture} />
                          <AvatarFallback>{client.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-zinc-500">{client.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.createdAt), "d 'de' MMM, yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveClient(client.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Enviadas</CardTitle>
              <CardDescription>Histórico de convites recentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={req.client.picture} />
                          <AvatarFallback>{req.client.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{req.client.name}</div>
                          <div className="text-xs text-zinc-500">{req.client.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {req.status === 'PENDING' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex w-fit items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendente
                          </Badge>
                        )}
                        {req.status === 'ACCEPTED' && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex w-fit items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Aceito
                          </Badge>
                        )}
                        {req.status === 'REJECTED' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex w-fit items-center gap-1">
                            <XCircle className="w-3 h-3" /> Recusado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">
                        {format(new Date(req.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

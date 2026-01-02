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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Mail, Clock, CheckCircle2, XCircle, Rocket, Copy } from "lucide-react";
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

interface Invite {
  id: string;
  token: string;
  email?: string;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
  link: string;
}

export function PlannerClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'TRANSACTIONS'>('DASHBOARD');

  const [inviteLink, setInviteLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, requestsRes, invitesRes] = await Promise.all([
        api.get('/planner/clients'),
        api.get('/planner/requests'),
        api.get('/planner/invites')
      ]);
      setClients(clientsRes.data);
      setRequests(requestsRes.data);
      setInvites(invitesRes.data);
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

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const response = await api.post('/planner/invites/generate', {});
      setInviteLink(response.data.link);
      toast.success("Link gerado com sucesso!");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar link.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string = inviteLink) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
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
                Escolha como deseja convidar seu cliente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Option 1: Email */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center">
                    <Mail className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Enviar por Email</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="cliente@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button onClick={handleInvite} disabled={isInviting || !inviteEmail} className="bg-blue-600 hover:bg-blue-700">
                    {isInviting ? "..." : "Enviar"}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-zinc-500">Ou</span>
                </div>
              </div>

              {/* Option 2: Link */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Rocket className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium">Link de Cadastro</span>
                </div>
                
                {!inviteLink ? (
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400"
                    onClick={handleGenerateLink}
                    disabled={isGeneratingLink}
                  >
                    {isGeneratingLink ? "Gerando..." : "Gerar Link Único"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="bg-zinc-50 font-mono text-xs" />
                    <Button variant="outline" onClick={() => copyToClipboard()}>Copiar</Button>
                  </div>
                )}
                <p className="text-[10px] text-zinc-400">
                  O cliente será automaticamente vinculado à sua conta ao se cadastrar por este link.
                </p>
              </div>
            </div>
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

        {/* Invites List */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Links de Convite Gerados</CardTitle>
              <CardDescription>Gerencie os links de acesso rápido criados.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => {
                    const isExpired = new Date(invite.expiresAt) < new Date();
                    const isUsed = !!invite.usedAt;
                    
                    return (
                      <TableRow key={invite.id}>
                        <TableCell className="font-mono text-xs text-zinc-500 max-w-[200px] truncate" title={invite.link}>
                          {invite.link}
                        </TableCell>
                        <TableCell>
                          {isUsed ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex w-fit items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Usado
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex w-fit items-center gap-1">
                              <XCircle className="w-3 h-3" /> Expirado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex w-fit items-center gap-1">
                              <Rocket className="w-3 h-3" /> Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-sm">
                          {format(new Date(invite.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(invite.link)}
                            disabled={isExpired || isUsed}
                            title="Copiar Link"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

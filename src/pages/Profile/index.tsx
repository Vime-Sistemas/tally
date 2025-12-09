import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, User, Mail, Phone, Briefcase, Camera, Upload } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { toast } from "sonner";

interface ProfileProps {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
}

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  picture: z.string().optional(),
  coverImage: z.string().optional(),
  businessName: z.string().optional(),
  businessCnpj: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function Profile({ hasBusiness, setHasBusiness }: ProfileProps) {
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      occupation: user?.occupation || "",
      picture: user?.picture || "",
      coverImage: user?.coverImage || "",
      businessName: user?.businessName || "",
      businessCnpj: user?.businessCnpj || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || "", 
        occupation: user.occupation || "",
        picture: user.picture || "",
        coverImage: user.coverImage || "",
        businessName: user.businessName || "",
        businessCnpj: user.businessCnpj || "",
      });
    }
  }, [user, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, field: "picture" | "coverImage") => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue(field, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.put('/users/me', {
        name: data.name,
        phone: data.phone,
        occupation: data.occupation,
        picture: data.picture,
        coverImage: data.coverImage,
        businessName: data.businessName,
        businessCnpj: data.businessCnpj,
      });
      setUser(response.data);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const userInitials = user?.name ? getInitials(user.name) : user?.email?.substring(0, 2).toUpperCase() || 'US';
  const currentPicture = form.watch("picture");
  const currentCover = form.watch("coverImage");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar / Header Info */}
        <div className="w-full md:w-1/3 space-y-6">
            <Card className="overflow-hidden group relative">
                <div 
                  className="h-32 bg-cover bg-center bg-no-repeat relative"
                  style={{ 
                    backgroundImage: currentCover ? `url(${currentCover})` : undefined,
                    background: !currentCover ? 'linear-gradient(to right, #6366f1, #9333ea)' : undefined
                  }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button variant="secondary" size="sm" className="gap-2" onClick={() => coverInputRef.current?.click()}>
                      <Camera className="h-4 w-4" />
                      Alterar Capa
                    </Button>
                  </div>
                  <input 
                    type="file" 
                    ref={coverInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "coverImage")}
                  />
                </div>
                <CardContent className="relative pt-0">
                    <div className="absolute -top-12 left-6">
                      <div className="relative group/avatar">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                            <AvatarImage src={currentPicture || ""} />
                            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                        </Avatar>
                        <div 
                          className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => profileInputRef.current?.click()}
                        >
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <input 
                          type="file" 
                          ref={profileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "picture")}
                        />
                      </div>
                    </div>
                    <div className="mt-14 space-y-1">
                        <h2 className="text-2xl font-bold">{user?.name || "Usuário"}</h2>
                        <p className="text-muted-foreground text-sm">{user?.email || "email@exemplo.com"}</p>
                    </div>
                    <div className="mt-6 space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Briefcase className="mr-2 h-4 w-4" />
                            {user?.occupation || "Ocupação não definida"}
                        </div>
                        {user?.businessName && (
                          <div className="flex items-center text-sm text-muted-foreground">
                              <Building2 className="mr-2 h-4 w-4" />
                              {user.businessName}
                          </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Status da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Plano</span>
                        <span className="text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">PRO</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Membro desde</span>
                        <span className="text-sm text-muted-foreground">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : "Dezembro 2023"}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
            <Tabs defaultValue="general" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="business" disabled={!hasBusiness}>Empresarial</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Pessoais</CardTitle>
                            <CardDescription>Atualize seus dados de identificação e contato.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="name" className="pl-9" {...form.register("name")} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" type="email" className="pl-9" {...form.register("email")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Telefone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="phone" className="pl-9" {...form.register("phone")} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="occupation">Ocupação</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="occupation" className="pl-9" {...form.register("occupation")} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isLoading}>
                                      {isLoading ? "Salvando..." : "Salvar Alterações"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="business" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados da Empresa</CardTitle>
                            <CardDescription>Gerencie as informações da sua pessoa jurídica.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="businessName">Razão Social</Label>
                                    <Input id="businessName" placeholder="Sua Empresa LTDA" {...form.register("businessName")} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="businessCnpj">CNPJ</Label>
                                    <Input id="businessCnpj" placeholder="00.000.000/0001-00" {...form.register("businessCnpj")} />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isLoading}>
                                      {isLoading ? "Salvando..." : "Salvar Alterações"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferências do Sistema</CardTitle>
                            <CardDescription>Personalize sua experiência no Tally.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <div className="flex flex-col space-y-1">
                                    <Label htmlFor="business-mode" className="text-base font-medium">Modo Empresarial</Label>
                                    <span className="text-sm text-muted-foreground">
                                        Habilita funcionalidades para gestão de finanças empresariais (PJ).
                                    </span>
                                </div>
                                <Switch
                                    id="business-mode"
                                    checked={hasBusiness}
                                    onCheckedChange={setHasBusiness}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <div className="flex flex-col space-y-1">
                                    <Label className="text-base font-medium">Notificações por Email</Label>
                                    <span className="text-sm text-muted-foreground">
                                        Receba resumos semanais e alertas de vencimento.
                                    </span>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                            <CardDescription className="text-red-600/80">
                                Ações irreversíveis para sua conta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" className="w-full sm:w-auto">Excluir Conta</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}

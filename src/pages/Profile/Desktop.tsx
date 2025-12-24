import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building2, User, Mail, Phone, Briefcase, Camera, ShieldAlert, CreditCard,
  MapPin, Globe
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useUser } from "../../contexts/UserContext";
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
  location: z.string().optional(),
  picture: z.string().optional(),
  coverImage: z.string().optional(),
  businessName: z.string().optional(),
  businessCnpj: z.string().optional(),
  businessWebsite: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function DesktopProfile({ hasBusiness, setHasBusiness }: ProfileProps) {
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
      location: "", // Add field to user context if needed later
      picture: user?.picture || "",
      coverImage: user?.coverImage || "",
      businessName: user?.businessName || "",
      businessCnpj: user?.businessCnpj || "",
      businessWebsite: "",
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
        form.setValue(field, base64String, { shouldDirty: true });
        // Optional: auto-submit image changes or just show preview
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call structure
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
      form.reset(data); // Reset dirty state
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
  const isDirty = form.formState.isDirty;

  return (
    <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- Header Area --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Meu Perfil</h1>
            <p className="text-zinc-500">Gerencie suas informações pessoais e preferências.</p>
          </div>
          {isDirty && (
            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm border border-yellow-200 animate-in fade-in slide-in-from-right-4">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Você tem alterações não salvas
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* --- Left Column: Profile Card --- */}
          <div className="w-full lg:w-1/3 space-y-6">
            
            {/* Identity Card */}
            <Card className="overflow-hidden border-zinc-200 shadow-sm bg-white group">
              <div 
                className="h-32 bg-cover bg-center bg-no-repeat relative transition-all group-hover:h-36"
                style={{ 
                  backgroundImage: currentCover ? `url(${currentCover})` : undefined,
                  background: !currentCover ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : undefined
                }}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-2 bg-white/90 hover:bg-white text-zinc-900 shadow-sm backdrop-blur-sm" 
                    onClick={() => coverInputRef.current?.click()}
                  >
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
              
              <CardContent className="relative pt-0 px-6 pb-6">
                <div className="flex justify-between items-end -mt-12 mb-4">
                  <div className="relative group/avatar">
                    <Avatar className="h-24 w-24 border-[4px] border-white shadow-lg bg-white">
                      <AvatarImage src={currentPicture || ""} className="object-cover" />
                      <AvatarFallback className="text-2xl font-bold bg-zinc-100 text-zinc-400">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer backdrop-blur-[1px]"
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
                  <div className="mb-1">
                     <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100">PRO</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 leading-tight">{user?.name || "Seu Nome"}</h2>
                    <p className="text-zinc-500 text-sm font-medium">{user?.email || "email@exemplo.com"}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-zinc-600">
                      <Briefcase className="mr-3 h-4 w-4 text-zinc-400" />
                      {user?.occupation || "Ocupação não definida"}
                    </div>
                    {user?.businessName && (
                      <div className="flex items-center text-sm text-zinc-600">
                        <Building2 className="mr-3 h-4 w-4 text-zinc-400" />
                        {user.businessName}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-zinc-600">
                      <MapPin className="mr-3 h-4 w-4 text-zinc-400" />
                      Brasil
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="border-zinc-200 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-zinc-500" />
                  Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-zinc-900 block">Plano Atual</span>
                    <span className="text-xs text-zinc-500">Renova em 01/01/2026</span>
                  </div>
                  <span className="text-xs font-bold text-white bg-zinc-900 px-2.5 py-1 rounded-md shadow-sm">
                    PRO
                  </span>
                </div>
                <Button variant="outline" className="w-full text-xs h-9 border-zinc-200">
                  Gerenciar Assinatura
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* --- Right Column: Forms --- */}
          <div className="flex-1 w-full">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="general" className="w-full space-y-6">
                
                <TabsList className="bg-white p-1 border border-zinc-200 rounded-xl w-full justify-start h-auto">
                  <TabsTrigger 
                    value="general" 
                    className="flex-1 md:flex-none data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 rounded-lg px-6 py-2.5"
                  >
                    Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="business" 
                    disabled={!hasBusiness}
                    className="flex-1 md:flex-none data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 rounded-lg px-6 py-2.5"
                  >
                    Empresarial
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="flex-1 md:flex-none data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 rounded-lg px-6 py-2.5"
                  >
                    Configurações
                  </TabsTrigger>
                </TabsList>
                
                {/* Tab: General */}
                <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="border-zinc-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle>Informações Pessoais</CardTitle>
                      <CardDescription>Dados visíveis no seu perfil público.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome Completo</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                            <Input id="name" className="pl-10 h-11 bg-zinc-50 border-zinc-200" {...form.register("name")} />
                          </div>
                          {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                            <Input id="email" type="email" className="pl-10 h-11 bg-zinc-50 border-zinc-200" {...form.register("email")} />
                          </div>
                          {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                            <Input id="phone" className="pl-10 h-11 bg-zinc-50 border-zinc-200" {...form.register("phone")} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="occupation">Ocupação / Cargo</Label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                            <Input id="occupation" className="pl-10 h-11 bg-zinc-50 border-zinc-200" {...form.register("occupation")} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-zinc-50/50 border-t border-zinc-100 flex justify-end py-4">
                      <Button type="submit" disabled={isLoading || !isDirty} className="bg-zinc-900 hover:bg-zinc-800 text-white min-w-[120px]">
                        {isLoading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* Tab: Business */}
                <TabsContent value="business" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="border-zinc-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle>Dados da Empresa</CardTitle>
                      <CardDescription>Informações legais da sua Pessoa Jurídica.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Razão Social</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                            <Input id="businessName" className="pl-10 h-11 bg-zinc-50 border-zinc-200" {...form.register("businessName")} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="businessCnpj">CNPJ</Label>
                          <Input id="businessCnpj" className="h-11 bg-zinc-50 border-zinc-200" placeholder="00.000.000/0001-00" {...form.register("businessCnpj")} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="businessWebsite">Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                            <Input id="businessWebsite" className="pl-10 h-11 bg-zinc-50 border-zinc-200" placeholder="https://suaempresa.com.br" {...form.register("businessWebsite")} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-zinc-50/50 border-t border-zinc-100 flex justify-end py-4">
                      <Button type="submit" disabled={isLoading || !isDirty} className="bg-zinc-900 hover:bg-zinc-800 text-white min-w-[120px]">
                        {isLoading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* Tab: Settings */}
                <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="border-zinc-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle>Preferências</CardTitle>
                      <CardDescription>Personalize sua experiência no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-zinc-500" />
                            <Label className="text-base font-medium text-zinc-900">Modo Empresarial</Label>
                          </div>
                          <p className="text-sm text-zinc-500 max-w-[300px] md:max-w-none">
                            Habilita funcionalidades para gestão de finanças PJ, como emissão de notas e fluxo de caixa separado.
                          </p>
                        </div>
                        <Switch checked={hasBusiness} onCheckedChange={(v) => setHasBusiness(!!v)} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-zinc-500" />
                            <Label className="text-base font-medium text-zinc-900">Relatórios por Email</Label>
                          </div>
                          <p className="text-sm text-zinc-500">
                            Receba resumos semanais do seu desempenho financeiro.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                    </CardContent>
                  </Card>
                  
                  {/* Danger Zone */}
                  <Card className="border-red-100 bg-red-50/30 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                        <ShieldAlert className="w-5 h-5" />
                        Zona de Perigo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-red-600/80">
                          Excluir sua conta é uma ação irreversível. Todos os seus dados serão perdidos.
                        </p>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 shadow-sm">
                          Excluir Conta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
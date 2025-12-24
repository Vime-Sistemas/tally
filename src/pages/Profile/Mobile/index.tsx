import { useUser } from "../../../contexts/UserContext";
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import api from "../../../services/api";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Bell, 
  Shield, 
  HelpCircle,
  Building2,
  Camera,
  Mail,
  Phone,
  Briefcase,
  Save
} from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../components/ui/sheet";

interface ProfileProps {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
  onLogout?: () => void;
}

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  picture: z.string().optional(),
  businessName: z.string().optional(),
  businessCnpj: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function MobileProfile({ hasBusiness, setHasBusiness, onLogout }: ProfileProps) {
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      occupation: user?.occupation || "",
      picture: user?.picture || "",
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
        businessName: user.businessName || "",
        businessCnpj: user.businessCnpj || "",
      });
    }
  }, [user, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const response = await api.put('/users/me', { picture: base64String });
          setUser(response.data);
          toast.success("Foto atualizada com sucesso!");
        } catch (error) {
          console.error("Erro ao atualizar foto:", error);
          toast.error("Erro ao atualizar foto");
        }
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
        businessName: data.businessName,
        businessCnpj: data.businessCnpj,
      });
      setUser(response.data);
      toast.success("Perfil atualizado com sucesso!");
      setActiveSheet(null);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    {
      title: "Editar Perfil",
      icon: User,
      sheet: "edit-profile",
    },
    {
      title: "Notificações",
      icon: Bell,
      sheet: "notifications",
    },
    {
      title: "Configurações",
      icon: Settings,
      sheet: "settings",
    },
    {
      title: "Segurança",
      icon: Shield,
      onClick: () => toast.info("Funcionalidade em breve"),
    },
    {
      title: "Ajuda e Suporte",
      icon: HelpCircle,
      onClick: () => toast.info("Funcionalidade em breve"),
    },
  ];

  return (
    <div className="pb-24">
      {/* Header Profile */}
      <div className="bg-white pt-4 pb-8 px-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-gray-50 shadow-xl">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="text-2xl bg-blue-400 text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => profileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md bg-blue-400 text-white flex items-center justify-center"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input 
              type="file" 
              ref={profileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.occupation && (
              <p className="text-xs text-gray-400 mt-1">{user.occupation}</p>
            )}
          </div>
        </div>
      </div>

      {/* Context Switcher */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-2">
          <button
            onClick={() => setHasBusiness(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
              !hasBusiness 
                ? "bg-blue-400 text-white shadow-md" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <User className="h-4 w-4" />
            Pessoal
          </button>
          <button
            onClick={() => setHasBusiness(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
              hasBusiness 
                ? "bg-blue-400 text-white shadow-md" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Building2 className="h-4 w-4" />
            Empresa
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 ml-1">Geral</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.sheet ? (
                  <Sheet open={activeSheet === item.sheet} onOpenChange={(open) => setActiveSheet(open ? item.sheet! : null)}>
                    <SheetTrigger asChild>
                      <button
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-gray-700">{item.title}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md p-0">
                      {item.sheet === "edit-profile" && (
                        <div className="h-full flex flex-col">
                          <SheetHeader className="px-4 py-4 border-b">
                            <div className="flex items-center gap-3">
                              <button onClick={() => setActiveSheet(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <SheetTitle>Editar Perfil</SheetTitle>
                            </div>
                          </SheetHeader>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input id="name" className="pl-10 h-12 rounded-xl" {...form.register("name")} />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input id="email" type="email" className="pl-10 h-12 rounded-xl bg-gray-50" {...form.register("email")} disabled />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input id="phone" className="pl-10 h-12 rounded-xl" placeholder="(00) 00000-0000" {...form.register("phone")} />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="occupation">Ocupação</Label>
                                <div className="relative">
                                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input id="occupation" className="pl-10 h-12 rounded-xl" placeholder="Desenvolvedor" {...form.register("occupation")} />
                                </div>
                              </div>
                            </div>

                            {hasBusiness && (
                              <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold text-gray-900">Dados da Empresa</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="businessName">Razão Social</Label>
                                  <Input id="businessName" className="h-12 rounded-xl" placeholder="Sua Empresa LTDA" {...form.register("businessName")} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="businessCnpj">CNPJ</Label>
                                  <Input id="businessCnpj" className="h-12 rounded-xl" placeholder="00.000.000/0001-00" {...form.register("businessCnpj")} />
                                </div>
                              </div>
                            )}

                            <div className="pt-4 pb-8">
                              <Button type="submit" className="w-full h-12 bg-blue-400 rounded-xl gap-2" disabled={isLoading}>
                                <Save className="h-4 w-4" />
                                {isLoading ? "Salvando..." : "Salvar Alterações"}
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}

                      {item.sheet === "notifications" && (
                        <div className="h-full flex flex-col">
                          <SheetHeader className="px-4 py-4 border-b">
                            <div className="flex items-center gap-3">
                              <button onClick={() => setActiveSheet(null)} className="p-2 -ml-2 hover:bg-blue-400 rounded-lg">
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <SheetTitle>Notificações</SheetTitle>
                            </div>
                          </SheetHeader>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                              <div>
                                <p className="font-medium text-gray-900">Notificações Push</p>
                                <p className="text-sm text-gray-500">Receba alertas no seu dispositivo</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                              <div>
                                <p className="font-medium text-gray-900">Resumo Semanal</p>
                                <p className="text-sm text-gray-500">Receba por email</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                              <div>
                                <p className="font-medium text-gray-900">Alertas de Vencimento</p>
                                <p className="text-sm text-gray-500">Lembre-me sobre faturas</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </div>
                      )}

                      {item.sheet === "settings" && (
                        <div className="h-full flex flex-col">
                          <SheetHeader className="px-4 py-4 border-b">
                            <div className="flex items-center gap-3">
                              <button onClick={() => setActiveSheet(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <SheetTitle>Configurações</SheetTitle>
                            </div>
                          </SheetHeader>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                              <div>
                                <p className="font-medium text-gray-900">Modo Empresarial</p>
                                <p className="text-sm text-gray-500">Habilita funções para PJ</p>
                              </div>
                              <Switch checked={hasBusiness} onCheckedChange={(v) => setHasBusiness(!!v)} />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Plano</span>
                                <span className="text-sm font-bold text-white bg-blue-400 px-2 py-1 rounded-md">PRO</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Membro desde</span>
                                <span className="text-sm text-gray-500">
                                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : "Dezembro 2023"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </SheetContent>
                  </Sheet>
                ) : (
                  <button
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-gray-700">{item.title}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                )}
                {index < menuItems.length - 1 && (
                  <div className="h-[1px] bg-gray-100 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 ml-1">Conta</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors active:bg-red-100 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-100 transition-colors">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium text-red-600">Sair da conta</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">Versão 1.5.0</p>
      </div>
    </div>
  );
}

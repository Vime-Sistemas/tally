import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  User,
  Mail,
  Camera,
  ShieldAlert,
  MapPin,
  Globe,
  Store,
  Settings,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useUser } from "../../contexts/UserContext";
import api from "../../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { maskPhone, maskCNPJ, maskCEP, unmask } from "../../utils/masks";
import axios from "axios";

interface ProfileProps {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
}

// ATUALIZADO: Incluído 'dock' no enum
const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  cep: z.string().optional(),
  picture: z.string().optional(),
  coverImage: z.string().optional(),
  businessName: z.string().optional(),
  businessCnpj: z.string().optional(),
  businessWebsite: z.string().optional(),
  hasBusiness: z.boolean().optional(),
  menuPreference: z.enum(["header", "sidebar", "dock"]).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function DesktopProfile({ hasBusiness, setHasBusiness }: ProfileProps) {
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      occupation: user?.occupation || "",
      location: user?.location || "",
      cep: "",
      picture: user?.picture || "",
      coverImage: user?.coverImage || "",
      businessName: user?.businessName || "",
      businessCnpj: user?.businessCnpj || "",
      businessWebsite: user?.businessWebsite || "",
      hasBusiness: user?.hasBusiness || false,
      menuPreference:
        (user?.menuPreference as "header" | "sidebar" | "dock") || "header",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        occupation: user.occupation || "",
        location: user.location || "",
        cep: user.cep || "",
        picture: user.picture || "",
        coverImage: user.coverImage || "",
        businessName: user.businessName || "",
        businessCnpj: user.businessCnpj || "",
        businessWebsite: user.businessWebsite || "",
        hasBusiness: user.hasBusiness || false,
        menuPreference:
          (user.menuPreference as "header" | "sidebar" | "dock") || "header",
      });
      setHasBusiness(user.hasBusiness || false);
    }
  }, [user, form, setHasBusiness]);

  const handleCepLookup = async (cep: string) => {
    const cleanCep = unmask(cep);
    if (cleanCep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await axios.get(
        `https://viacep.com.br/ws/${cleanCep}/json/`,
      );
      if (response.data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      const { localidade, uf } = response.data;
      form.setValue("location", `${localidade} - ${uf}`, { shouldDirty: true });
      toast.success("Endereço encontrado!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleCnpjLookup = async () => {
    const cnpj = form.getValues("businessCnpj");
    const cleanCnpj = unmask(cnpj || "");
    if (cleanCnpj.length !== 14) {
      toast.error("CNPJ inválido. Digite os 14 números.");
      return;
    }

    setIsFetchingCnpj(true);
    try {
      const response = await axios.get(
        `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      );
      const { razao_social, nome_fantasia } = response.data;

      form.setValue("businessName", nome_fantasia || razao_social, {
        shouldDirty: true,
      });

      toast.success("Dados da empresa encontrados!");
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
      toast.error("Erro ao buscar dados do CNPJ.");
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "picture" | "coverImage",
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue(field, base64String, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.put("/users/me", {
        name: data.name,
        phone: data.phone,
        occupation: data.occupation,
        picture: data.picture,
        coverImage: data.coverImage,
        businessName: data.businessName,
        businessCnpj: data.businessCnpj,
        businessWebsite: data.businessWebsite,
        location: data.location,
        hasBusiness: data.hasBusiness,
        menuPreference: data.menuPreference,
        cep: data.cep,
      });
      const merged = {
        ...(response.data || {}),
        menuPreference: data.menuPreference ?? response.data?.menuPreference,
      };
      setUser(merged);

      if (data.hasBusiness !== undefined) {
        setHasBusiness(data.hasBusiness);
      }

      toast.success("Perfil atualizado com sucesso!");
      form.reset(data);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const userInitials = user?.name
    ? getInitials(user.name)
    : user?.email?.substring(0, 2).toUpperCase() || "US";
  const currentPicture = form.watch("picture");
  const isDirty = form.formState.isDirty;

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Configurações da Conta
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Gerencie seus dados pessoais e preferências do sistema.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 animate-in fade-in">
                Alterações não salvas
              </span>
            )}
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading || !isDirty}
              className={cn(
                "transition-all",
                isDirty
                  ? "bg-zinc-900 hover:bg-zinc-800"
                  : "bg-zinc-200 text-zinc-400 hover:bg-zinc-200 cursor-not-allowed",
              )}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col lg:flex-row gap-10"
            orientation="vertical"
          >
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 flex-shrink-0 space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => profileInputRef.current?.click()}
                >
                  <Avatar className="h-12 w-12 border border-zinc-200 shadow-sm">
                    <AvatarImage
                      src={currentPicture || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-zinc-100 text-zinc-500 font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={profileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "picture")}
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-1 w-full items-stretch">
                <TabsTrigger
                  value="general"
                  className="justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 rounded-md transition-all"
                >
                  <User className="w-4 h-4 mr-2" />
                  Geral
                </TabsTrigger>
                <TabsTrigger
                  value="business"
                  disabled={!hasBusiness}
                  className="justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 rounded-md transition-all disabled:opacity-50"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Empresarial
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 rounded-md transition-all"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Preferências
                </TabsTrigger>
              </TabsList>

              <div className="px-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700">
                      Plano PRO
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-white text-[10px] h-5"
                    >
                      ATIVO
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600/80 leading-relaxed">
                    Sua assinatura renova em 01/01/2026.
                  </p>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Tab: General */}
              <TabsContent
                value="general"
                className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-zinc-900">
                      Informações Pessoais
                    </h2>
                    <p className="text-sm text-zinc-500">
                      Atualize sua foto e detalhes pessoais aqui.
                    </p>
                  </div>
                  <Separator />

                  <div className="grid gap-6 max-w-2xl">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome de Exibição</Label>
                      <Input
                        id="name"
                        className="bg-white"
                        {...form.register("name")}
                      />
                      <p className="text-[11px] text-zinc-500">
                        Este é o nome que aparecerá no seu perfil e emails.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                          <Input
                            id="email"
                            className="pl-9 bg-zinc-50 text-zinc-500"
                            {...form.register("email")}
                            disabled
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          className="bg-white"
                          placeholder="(00) 00000-0000"
                          {...form.register("phone")}
                          onChange={(e) => {
                            const masked = maskPhone(e.target.value);
                            form.setValue("phone", masked, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="occupation">Ocupação</Label>
                      <Input
                        id="occupation"
                        className="bg-white"
                        placeholder="Ex: Designer, Desenvolvedor..."
                        {...form.register("occupation")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="cep">CEP</Label>
                        <div className="relative">
                          <Input
                            id="cep"
                            className="bg-white"
                            placeholder="00000-000"
                            {...form.register("cep")}
                            onChange={(e) => {
                              const masked = maskCEP(e.target.value);
                              form.setValue("cep", masked);
                              if (unmask(masked).length === 8) {
                                handleCepLookup(masked);
                              }
                            }}
                            disabled={isFetchingCep}
                          />
                          {isFetchingCep && (
                            <div className="absolute right-3 top-3 text-xs text-zinc-400 animate-pulse">
                              ...
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="location">Localização</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                          <Input
                            id="location"
                            className="pl-9 bg-white"
                            placeholder="Cidade - Estado"
                            {...form.register("location")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Foto de Capa</Label>
                      <div
                        className="h-32 w-full rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center cursor-pointer hover:bg-zinc-100 transition-colors overflow-hidden relative group"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        {form.watch("coverImage") ? (
                          <img
                            src={form.watch("coverImage") || ""}
                            alt="Capa"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <Camera className="h-6 w-6" />
                            <span className="text-xs">
                              Clique para alterar a capa
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      <input
                        type="file"
                        ref={coverInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "coverImage")}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Business */}
              <TabsContent
                value="business"
                className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-zinc-900">
                      Perfil da Empresa
                    </h2>
                    <p className="text-sm text-zinc-500">
                      Gerencie as informações da sua entidade jurídica.
                    </p>
                  </div>
                  <Separator />

                  <div className="grid gap-6 max-w-2xl">
                    <div className="grid gap-2">
                      <Label htmlFor="businessName">
                        Razão Social / Nome Fantasia
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                          id="businessName"
                          className="pl-9 bg-white"
                          {...form.register("businessName")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="businessCnpj">CNPJ</Label>
                        <div className="flex gap-2">
                          <Input
                            id="businessCnpj"
                            className="bg-white"
                            placeholder="00.000.000/0001-00"
                            {...form.register("businessCnpj")}
                            onChange={(e) => {
                              const masked = maskCNPJ(e.target.value);
                              form.setValue("businessCnpj", masked, {
                                shouldDirty: true,
                              });
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCnpjLookup}
                            disabled={isFetchingCnpj}
                            className="px-3"
                          >
                            {isFetchingCnpj ? "..." : "Buscar"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="businessWebsite">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                          <Input
                            id="businessWebsite"
                            className="pl-9 bg-white"
                            placeholder="https://"
                            {...form.register("businessWebsite")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Settings */}
              <TabsContent
                value="settings"
                className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-zinc-900">
                      Preferências do Sistema
                    </h2>
                    <p className="text-sm text-zinc-500">
                      Personalize sua experiência de uso.
                    </p>
                  </div>
                  <Separator />

                  <div className="space-y-6 max-w-3xl">
                    <div className="flex items-center justify-between py-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Modo Empresarial</Label>
                        <p className="text-sm text-zinc-500">
                          Habilita funcionalidades para gestão PJ.
                        </p>
                      </div>
                      <Switch
                        checked={form.watch("hasBusiness")}
                        onCheckedChange={(v) => {
                          form.setValue("hasBusiness", v, {
                            shouldDirty: true,
                          });
                        }}
                      />
                    </div>
                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base">Layout de Navegação</Label>
                      {/* ATUALIZADO: Grid cols 3 para acomodar a nova opção */}
                      <RadioGroup
                        value={form.watch("menuPreference") || "header"}
                        onValueChange={(value) =>
                          form.setValue(
                            "menuPreference",
                            value as "header" | "sidebar" | "dock",
                            { shouldDirty: true },
                          )
                        }
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        <Label
                          htmlFor="header"
                          className={cn(
                            "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-zinc-50 cursor-pointer transition-all",
                            form.watch("menuPreference") === "header"
                              ? "border-zinc-900 bg-zinc-50/50"
                              : "border-zinc-200",
                          )}
                        >
                          <RadioGroupItem
                            value="header"
                            id="header"
                            className="sr-only"
                          />
                          <div className="w-full h-20 bg-zinc-100 rounded-md mb-3 border border-zinc-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-4 bg-zinc-300" />
                          </div>
                          <span className="block w-full text-center font-medium text-sm">
                            Menu Superior
                          </span>
                        </Label>

                        <Label
                          htmlFor="sidebar"
                          className={cn(
                            "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-zinc-50 cursor-pointer transition-all",
                            form.watch("menuPreference") === "sidebar"
                              ? "border-zinc-900 bg-zinc-50/50"
                              : "border-zinc-200",
                          )}
                        >
                          <RadioGroupItem
                            value="sidebar"
                            id="sidebar"
                            className="sr-only"
                          />
                          <div className="w-full h-20 bg-zinc-100 rounded-md mb-3 border border-zinc-200 relative overflow-hidden">
                            <div className="absolute top-0 bottom-0 left-0 w-6 bg-zinc-300" />
                          </div>
                          <span className="block w-full text-center font-medium text-sm">
                            Menu Lateral
                          </span>
                        </Label>

                        {/* NOVA OPÇÃO: DOCK */}
                        <Label
                          htmlFor="dock"
                          className={cn(
                            "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-zinc-50 cursor-pointer transition-all",
                            form.watch("menuPreference") === "dock"
                              ? "border-zinc-900 bg-zinc-50/50"
                              : "border-zinc-200",
                          )}
                        >
                          <RadioGroupItem
                            value="dock"
                            id="dock"
                            className="sr-only"
                          />
                          <div className="w-full h-20 bg-zinc-100 rounded-md mb-3 border border-zinc-200 relative overflow-hidden">
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-zinc-300 rounded-full shadow-sm" />
                          </div>
                          <span className="block w-full text-center font-medium text-sm">
                            Menu Flutuante
                          </span>
                        </Label>
                      </RadioGroup>
                    </div>

                    <Separator />

                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-red-600 mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        Zona de Perigo
                      </h3>
                      <div className="rounded-lg border border-red-100 bg-red-50 p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-red-900">
                            Excluir conta
                          </p>
                          <p className="text-xs text-red-700">
                            Esta ação é permanente e não pode ser desfeita.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  );
}

import { useUser } from "../../../contexts/UserContext";
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import api from "../../../services/api";
import { 
  User, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Camera,
  Mail,
  Phone,
  Briefcase,
  Save,
  Loader2
} from "lucide-react";
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
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function MobileProfile({ onLogout }: ProfileProps) {
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      });
    }
  }, [user, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const response = await api.put('/users/me', { picture: base64String });
            const merged = {
              ...(response.data || {}),
              menuPreference: response.data?.menuPreference || user?.menuPreference,
            };
            setUser(merged);
          toast.success("Foto atualizada com sucesso!");
        } catch (error) {
          console.error("Erro ao atualizar foto:", error);
          toast.error("Erro ao atualizar foto");
        } finally {
          setIsUploading(false);
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
      });
      const merged = {
        ...(response.data || {}),
        menuPreference: response.data?.menuPreference || user?.menuPreference,
      };
      setUser(merged);
      toast.success("Perfil atualizado com sucesso!");
      setActiveSheet(null);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-24 min-h-full bg-zinc-50 px-4 pt-6">
      {/* Header Profile */}
      <div className="flex flex-col items-center text-center space-y-6 mb-10">
        <div className="relative group">
          <div className="relative inline-block">
            <Avatar className="h-28 w-28 border-4 border-white shadow-2xl shadow-zinc-200">
              <AvatarImage src={user?.picture} className="object-cover" />
              <AvatarFallback className="text-3xl bg-blue-400 text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isUploading && (
              <div className="absolute inset-0 bg-blue-400 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <button 
            onClick={() => profileInputRef.current?.click()}
            className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-colors active:scale-95"
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
        
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{user?.name}</h1>
          <p className="text-sm text-zinc-500 font-medium">{user?.email}</p>
          {user?.occupation && (
            <div className="pt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {user.occupation}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-2">Conta</h2>
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            
            {/* Edit Profile Item */}
            <Sheet open={activeSheet === "edit-profile"} onOpenChange={(open) => setActiveSheet(open ? "edit-profile" : null)}>
              <SheetTrigger asChild>
                <button className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors active:bg-zinc-100 group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-zinc-50 rounded-2xl text-zinc-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-semibold text-zinc-900">Editar Perfil</span>
                      <span className="block text-xs text-zinc-500">Alterar dados pessoais</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-300" />
                </button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l-0">
                <div className="h-full flex flex-col bg-zinc-50">
                  <SheetHeader className="px-6 py-6 bg-white border-b border-zinc-100">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setActiveSheet(null)} 
                        className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="h-6 w-6 text-zinc-900" />
                      </button>
                      <SheetTitle className="text-xl font-bold text-zinc-900">Editar Perfil</SheetTitle>
                    </div>
                  </SheetHeader>
                  
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-600 font-medium">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                          <Input 
                            id="name" 
                            className="pl-12 h-14 rounded-2xl bg-white border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900" 
                            {...form.register("name")} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-600 font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                          <Input 
                            id="email" 
                            type="email" 
                            className="pl-12 h-14 rounded-2xl bg-zinc-100 border-transparent text-zinc-500" 
                            {...form.register("email")} 
                            disabled 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-zinc-600 font-medium">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                          <Input 
                            id="phone" 
                            className="pl-12 h-14 rounded-2xl bg-white border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900" 
                            placeholder="(00) 00000-0000" 
                            {...form.register("phone")} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="occupation" className="text-zinc-600 font-medium">Ocupação</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                          <Input 
                            id="occupation" 
                            className="pl-12 h-14 rounded-2xl bg-white border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900" 
                            placeholder="Ex: Designer" 
                            {...form.register("occupation")} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-14 bg-blue-400 hover:bg-blue-500 text-white rounded-2xl text-base font-semibold shadow-lg shadow-zinc-900/10" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-5 w-5" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </SheetContent>
            </Sheet>

            <div className="h-[1px] bg-zinc-100 mx-5" />

            {/* Logout Item */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between p-5 hover:bg-red-50/50 transition-colors active:bg-red-50 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-red-50 rounded-2xl text-red-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <LogOut className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-red-600">Sair da conta</span>
                  <span className="block text-xs text-red-400/80">Encerrar sessão atual</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-xs font-medium text-zinc-300">CDF App • v1.5.24</p>
      </div>
    </div>
  );
}

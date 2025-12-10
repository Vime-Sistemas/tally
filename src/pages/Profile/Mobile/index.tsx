import { useUser } from "../../../contexts/UserContext";
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { toast } from "sonner";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Bell, 
  Shield, 
  HelpCircle,
  Building2
} from "lucide-react";
import { cn } from "../../../lib/utils";

interface ProfileProps {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
  onLogout?: () => void;
}

export function MobileProfile({ hasBusiness, setHasBusiness, onLogout }: ProfileProps) {
  const { user } = useUser();

  const menuItems = [
    {
      title: "Configurações da Conta",
      icon: Settings,
      onClick: () => toast.info("Funcionalidade em breve"),
    },
    {
      title: "Notificações",
      icon: Bell,
      onClick: () => toast.info("Funcionalidade em breve"),
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
              <AvatarFallback className="text-2xl bg-gray-100 text-gray-400">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
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
                ? "bg-black text-white shadow-md" 
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
                ? "bg-black text-white shadow-md" 
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
        <p className="text-xs text-gray-400">Versão 1.0.0</p>
      </div>
    </div>
  );
}

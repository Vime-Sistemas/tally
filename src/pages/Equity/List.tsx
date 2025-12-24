import { useEffect, useState } from "react";
import { 
  Plus, Car, Home, Briefcase, Gem, Smartphone, Banknote, 
  Building2, LandPlot, Bike, TrendingUp, Wallet, Zap, Palette, Calendar,
} from "lucide-react";
import { type Equity, EQUITY_TYPES } from "../../types/equity";
import { cn } from "../../lib/utils";
import { equityService } from "../../services/equities";
import { toast } from "sonner";
import type { Page } from "../../types/navigation";
import { EditEquityDialog } from "../../components/EditEquityDialog";
import { EquityCardMenu } from "../../components/EquityCardMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

// Configuração de Estilo por Tipo (Sóbrio & Elegante)
const getEquityStyle = (type: string) => {
  const styles: Record<string, { icon: any, color: string, bg: string, ring: string }> = {
    // Imóveis (Tons Terrosos/Sólidos)
    'real-estate-house': { icon: Home, color: "text-stone-600", bg: "bg-stone-100", ring: "group-hover:ring-stone-200" },
    'real-estate-apt': { icon: Building2, color: "text-slate-600", bg: "bg-slate-100", ring: "group-hover:ring-slate-200" },
    'real-estate-land': { icon: LandPlot, color: "text-emerald-700", bg: "bg-emerald-100", ring: "group-hover:ring-emerald-200" },

    // Veículos (Tons de Ação)
    'vehicle-car': { icon: Car, color: "text-blue-600", bg: "bg-blue-100", ring: "group-hover:ring-blue-200" },
    'vehicle-motorcycle': { icon: Bike, color: "text-orange-600", bg: "bg-orange-100", ring: "group-hover:ring-orange-200" },

    // Investimentos (Tons de Dinheiro/Tech)
    'stocks': { icon: TrendingUp, color: "text-green-600", bg: "bg-green-100", ring: "group-hover:ring-green-200" },
    'crypto': { icon: Zap, color: "text-violet-600", bg: "bg-violet-100", ring: "group-hover:ring-violet-200" },
    'business': { icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100", ring: "group-hover:ring-amber-200" },

    // Pessoais (Tons Vibrantes mas suaves)
    'electronics': { icon: Smartphone, color: "text-zinc-700", bg: "bg-zinc-100", ring: "group-hover:ring-zinc-200" },
    'jewelry': { icon: Gem, color: "text-rose-600", bg: "bg-rose-100", ring: "group-hover:ring-rose-200" },
    'art': { icon: Palette, color: "text-purple-600", bg: "bg-purple-100", ring: "group-hover:ring-purple-200" },

    // Outros
    'cash': { icon: Wallet, color: "text-teal-600", bg: "bg-teal-100", ring: "group-hover:ring-teal-200" },
  };

  return styles[type] || { icon: Banknote, color: "text-blue-600", bg: "bg-blue-100", ring: "group-hover:ring-blue-200" };
};

const getLabelForType = (type: string) => {
  return EQUITY_TYPES.find(t => t.value === type)?.label || type;
};

interface EquityListProps {
  onNavigate: (page: Page) => void;
}

export function EquityList({ onNavigate }: EquityListProps) {
  const [equities, setEquities] = useState<Equity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEquity, setEditingEquity] = useState<Equity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Equity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEquities();
  }, []);

  const loadEquities = async () => {
    try {
      const data = await equityService.getAll();
      setEquities(data);
    } catch (error) {
      console.error("Failed to load equities:", error);
      toast.error("Erro ao carregar patrimônio");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await equityService.delete(deleteConfirm.id);
      toast.success("Item removido com sucesso!");
      setEquities(equities.filter((e) => e.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Erro ao remover item");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalValue = equities.reduce((acc, item) => acc + item.value, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 p-8 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Carregando patrimônio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Patrimônio</h1>
            <p className="text-zinc-500 mt-1">Gerencie seus ativos, bens e investimentos.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 pr-2 pl-6 rounded-2xl shadow-sm border border-zinc-100">
            <div className="text-right mr-2">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Acumulado</p>
              <p className="text-xl font-bold text-zinc-900">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
              </p>
            </div>
            <Button 
              className="h-10 rounded-xl bg-blue-400 hover:bg-blue-500 text-white shadow-lg shadow-zinc-200 gap-2 px-4"
              onClick={() => onNavigate('equity-new')}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar Bem</span>
            </Button>
          </div>
        </div>

        {/* --- Grid de Cards --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          
          {/* Add New Placeholder (Primeiro item para fácil acesso) */}
          <div 
            onClick={() => onNavigate('equity-new')}
            className="group flex flex-col items-center justify-center h-[200px] rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer gap-3"
          >
            <div className="h-12 w-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors">Adicionar Novo</span>
          </div>

          {equities.map((item) => {
            const style = getEquityStyle(item.type);
            const Icon = style.icon;
            
            return (
              <div 
                key={item.id} 
                className={cn(
                  "group relative bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-[200px] overflow-hidden",
                  `hover:ring-1 ${style.ring}`
                )}
              >
                {/* Header: Icon & Menu */}
                <div className="flex justify-between items-start z-10">
                  <div className={cn("p-3 rounded-2xl transition-colors", style.bg, style.color)}>
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <EquityCardMenu
                    onEdit={() => setEditingEquity(item)}
                    onDelete={() => setDeleteConfirm(item)}
                  />
                </div>

                {/* Content: Name & Type */}
                <div className="space-y-1 z-10">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-zinc-50 text-zinc-500 hover:bg-zinc-100 text-[10px] px-2 h-5 font-normal">
                      {getLabelForType(item.type)}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 truncate leading-tight" title={item.name}>
                    {item.name}
                  </h3>
                </div>

                {/* Footer: Value & Date */}
                <div className="pt-4 border-t border-zinc-50 flex justify-between items-end z-10">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">Valor Atual</p>
                    <p className={cn("text-xl font-bold tracking-tight", style.color)}>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value)}
                    </p>
                  </div>
                  
                  {item.acquisitionDate && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-zinc-400" title="Data de aquisição">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs font-medium">{new Date(item.acquisitionDate).getFullYear()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Background Decorativo Suave (Opala) */}
                <div className={cn(
                  "absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none blur-3xl",
                  style.bg.replace('bg-', 'bg-') // Reutiliza a cor de fundo
                )} />
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Dialogs --- */}
      {editingEquity && (
        <EditEquityDialog
          open={!!editingEquity}
          equity={editingEquity}
          onOpenChange={(open) => !open && setEditingEquity(null)}
          onSuccess={() => { loadEquities(); setEditingEquity(null); }}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-3xl border-zinc-100 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover <strong>{deleteConfirm?.name}</strong> do seu patrimônio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-zinc-50 p-4 rounded-2xl flex items-center justify-between">
             <span className="text-sm text-zinc-500">Valor do item</span>
             <span className="font-bold text-zinc-900">
               {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(deleteConfirm?.value || 0)}
             </span>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl border-zinc-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { 
  Plus, Car, Home, Briefcase, Gem, Smartphone, Banknote, 
  Building2, LandPlot, Bike, TrendingUp, Wallet, Zap, Palette
} from "lucide-react";
import { type Equity, EQUITY_TYPES } from "../../types/equity";
import { cn } from "../../lib/utils";
import { equityService } from "../../services/equities";
import { toast } from "sonner";
import type { Page } from "../../types/navigation";
import { EditEquityDialog } from "../../components/EditEquityDialog";
import { EquityCardMenu } from "../../components/EquityCardMenu";

const getCardStyle = (type: string) => {
  // Real Estate
  if (type === 'real-estate-house') return {
    gradient: "bg-gradient-to-br from-stone-500 to-stone-700",
    icon: Home,
    shadow: "shadow-stone-500/20",
    pattern: "radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 50%)"
  };
  if (type === 'real-estate-apt') return {
    gradient: "bg-gradient-to-br from-slate-500 to-slate-700",
    icon: Building2,
    shadow: "shadow-slate-500/20",
    pattern: "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)"
  };
  if (type === 'real-estate-land') return {
    gradient: "bg-gradient-to-br from-emerald-600 to-teal-700",
    icon: LandPlot,
    shadow: "shadow-emerald-500/20",
    pattern: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px)"
  };

  // Vehicles
  if (type === 'vehicle-car') return {
    gradient: "bg-gradient-to-br from-blue-600 to-indigo-700",
    icon: Car,
    shadow: "shadow-blue-500/20",
    pattern: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)"
  };
  if (type === 'vehicle-motorcycle') return {
    gradient: "bg-gradient-to-br from-red-600 to-orange-700",
    icon: Bike,
    shadow: "shadow-red-500/20",
    pattern: "radial-gradient(circle at bottom left, rgba(255,255,255,0.2), transparent 60%)"
  };

  // Investments
  if (type === 'stocks') return {
    gradient: "bg-gradient-to-br from-green-500 to-emerald-700",
    icon: TrendingUp,
    shadow: "shadow-green-500/20",
    pattern: "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.1) 20px)"
  };
  if (type === 'crypto') return {
    gradient: "bg-gradient-to-br from-violet-600 to-fuchsia-700",
    icon: Zap,
    shadow: "shadow-violet-500/20",
    pattern: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px) 0 0 / 10px 10px"
  };
  if (type === 'business') return {
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    icon: Briefcase,
    shadow: "shadow-amber-500/20",
    pattern: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px) 0 0 / 20px 100%"
  };

  // Personal
  if (type === 'electronics') return {
    gradient: "bg-gradient-to-br from-zinc-700 to-black",
    icon: Smartphone,
    shadow: "shadow-zinc-500/20",
    pattern: "linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)"
  };
  if (type === 'jewelry') return {
    gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
    icon: Gem,
    shadow: "shadow-pink-500/20",
    pattern: "radial-gradient(circle at center, rgba(255,255,255,0.2), transparent)"
  };
  if (type === 'art') return {
    gradient: "bg-gradient-to-br from-purple-500 to-indigo-600",
    icon: Palette,
    shadow: "shadow-purple-500/20",
    pattern: "conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1), transparent)"
  };

  // Cash/Other
  if (type === 'cash') return {
    gradient: "bg-gradient-to-br from-teal-500 to-cyan-600",
    icon: Wallet,
    shadow: "shadow-teal-500/20",
    pattern: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 5px, transparent 5px, transparent 10px)"
  };

  return {
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: Banknote,
    shadow: "shadow-blue-500/20",
    pattern: ""
  };
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
      toast.success("Patrimônio deletado com sucesso!");
      setEquities(equities.filter((e) => e.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete equity:", error);
      toast.error("Erro ao deletar patrimônio");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalValue = equities.reduce((acc, item) => acc + item.value, 0);

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patrimônio</h2>
          <p className="text-muted-foreground">Gerencie seus bens e ativos.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Valor Total Estimado</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
            </p>
          </div>
          <Button 
            className="bg-blue-400 hover:bg-gray-800 text-white gap-2"
            onClick={() => onNavigate('equity-new')}
          >
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Mobile Total Display */}
      <Card className="md:hidden bg-gray-50 border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Valor Total Estimado</p>
          <p className="text-3xl font-bold mt-1">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {equities.map((item) => {
          const style = getCardStyle(item.type);
          const Icon = style.icon;
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer group h-[220px] flex flex-col justify-between border border-white/10",
                style.gradient,
                style.shadow
              )}
            >
              {/* Background Pattern */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay" 
                style={{ backgroundImage: style.pattern }}
              />
              
              {/* Large Background Icon Watermark */}
              <div className="absolute -right-6 -bottom-6 text-white/10 transform rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-500">
                <Icon className="h-48 w-48" strokeWidth={1} />
              </div>
              
              {/* Header */}
              <div className="relative z-10 flex justify-between items-start">
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-sm">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <EquityCardMenu
                  onEdit={() => setEditingEquity(item)}
                  onDelete={() => setDeleteConfirm(item)}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 space-y-2">
                <div>
                  <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">
                    {getLabelForType(item.type)}
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight truncate leading-tight" title={item.name}>
                    {item.name}
                  </h3>
                </div>
                
                <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Valor Atual</p>
                    <p className="text-xl font-bold tracking-tight">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value)}
                    </p>
                  </div>
                  {item.acquisitionDate && (
                    <div className="text-right">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Desde</p>
                      <p className="text-sm font-medium text-white/80">
                        {new Date(item.acquisitionDate).getFullYear()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add New Card Placeholder */}
        <div 
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer h-[220px] gap-4 group"
          onClick={() => onNavigate('equity-new')}
        >
          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all duration-300">
            <Plus className="h-7 w-7" />
          </div>
          <span className="font-medium text-lg">Adicionar novo bem</span>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingEquity && (
        <EditEquityDialog
          open={!!editingEquity}
          equity={editingEquity}
          onOpenChange={(open) => !open && setEditingEquity(null)}
          onSuccess={() => {
            loadEquities();
            setEditingEquity(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Patrimônio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar "{deleteConfirm?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="text-gray-600">
              Valor: <span className="font-semibold text-gray-900">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(deleteConfirm?.value || 0)}
              </span>
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


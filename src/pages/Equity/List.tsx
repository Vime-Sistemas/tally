import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus, Car, Home, Briefcase, Gem, Smartphone, Banknote, MoreHorizontal } from "lucide-react";
import { type Equity, EQUITY_TYPES } from "../../types/equity";
import { cn } from "../../lib/utils";

// Mock data
const mockEquity: Equity[] = [
  {
    id: '1',
    name: 'Apartamento Centro',
    type: 'real-estate-apt',
    value: 450000,
    acquisitionDate: '2020-03-15',
    color: 'bg-zinc-900',
    description: 'Rua das Flores, 123'
  },
  {
    id: '2',
    name: 'BMW X1',
    type: 'vehicle-car',
    value: 180000,
    acquisitionDate: '2023-01-10',
    color: 'bg-blue-600',
    description: 'Placa ABC-1234'
  },
  {
    id: '3',
    name: 'Reserva de Emergência',
    type: 'cash',
    value: 50000,
    acquisitionDate: '2024-01-01',
    color: 'bg-emerald-600',
    description: 'Nubank Caixinha'
  },
  {
    id: '4',
    name: 'MacBook Pro M3',
    type: 'electronics',
    value: 18000,
    acquisitionDate: '2024-05-20',
    color: 'bg-zinc-500',
  }
];

const getIconForType = (type: string) => {
  if (type.startsWith('real-estate')) return Home;
  if (type.startsWith('vehicle')) return Car;
  if (type === 'business' || type === 'stocks') return Briefcase;
  if (type === 'jewelry' || type === 'art') return Gem;
  if (type === 'electronics') return Smartphone;
  return Banknote;
};

const getLabelForType = (type: string) => {
  return EQUITY_TYPES.find(t => t.value === type)?.label || type;
};

export function EquityList() {
  const totalValue = mockEquity.reduce((acc, item) => acc + item.value, 0);

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
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </p>
          </div>
          <Button className="bg-black hover:bg-gray-800 text-white gap-2">
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
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockEquity.map((item) => {
          const Icon = getIconForType(item.type);
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "relative overflow-hidden rounded-xl p-6 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer group h-[200px] flex flex-col justify-between",
                item.color || "bg-zinc-900"
              )}
            >
              {/* Background Pattern/Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/20 h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              <div className="relative z-10 space-y-1">
                <p className="text-white/80 text-sm font-medium tracking-wide uppercase">
                  {getLabelForType(item.type)}
                </p>
                <h3 className="text-2xl font-bold tracking-tight truncate" title={item.name}>
                  {item.name}
                </h3>
                <div className="flex justify-between items-end pt-2">
                  <p className="text-lg font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                  </p>
                  {item.acquisitionDate && (
                    <p className="text-xs text-white/60">
                      Desde {new Date(item.acquisitionDate).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add New Card Placeholder */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer h-[200px] gap-4 group">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
            <Plus className="h-6 w-6" />
          </div>
          <span className="font-medium">Adicionar novo bem</span>
        </div>
      </div>
    </div>
  );
}

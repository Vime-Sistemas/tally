import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Check, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  ShoppingBag,
  Shirt,
  Gamepad2,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  Repeat,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  MoreHorizontal,
  Shield,
  Percent,
  Key,
  MapPin,
  Users,
  Smartphone,
  Glasses,
  KeyRound,
  Ticket,
  Wifi,
  Utensils,
  Bus,
  Lightbulb,
  Music,
  Camera,
  BookOpen,
  Dumbbell,
  Pill,
  Baby,
  Tv,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Icon Map
// ============================================================================

export const ICON_MAP: Record<string, LucideIcon> = {
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  ShoppingBag,
  Shirt,
  Gamepad2,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  Repeat,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  MoreHorizontal,
  Shield,
  Percent,
  Key,
  MapPin,
  Users,
  Smartphone,
  Glasses,
  KeyRound,
  Ticket,
  Wifi,
  Utensils,
  Bus,
  Lightbulb,
  Music,
  Camera,
  BookOpen,
  Dumbbell,
  Pill,
  Baby,
  Tv,
};

export const ICON_LABELS: Record<string, string> = {
  Coffee: 'Café',
  Car: 'Carro',
  Home: 'Casa',
  Zap: 'Energia',
  Heart: 'Saúde',
  ShoppingBag: 'Compras',
  Shirt: 'Roupas',
  Gamepad2: 'Games',
  GraduationCap: 'Educação',
  Briefcase: 'Trabalho',
  DollarSign: 'Dinheiro',
  TrendingUp: 'Investimento',
  ArrowRightLeft: 'Transferência',
  PiggyBank: 'Poupança',
  Coins: 'Moedas',
  Banknote: 'Notas',
  Wallet: 'Carteira',
  Building2: 'Empresa',
  Globe: 'Internet',
  Repeat: 'Recorrente',
  Landmark: 'Banco',
  Receipt: 'Recibo',
  PawPrint: 'Pet',
  Gift: 'Presente',
  Plane: 'Viagem',
  MoreHorizontal: 'Outros',
  Shield: 'Seguro',
  Percent: 'Desconto',
  Key: 'Aluguel',
  MapPin: 'Local',
  Users: 'Família',
  Smartphone: 'Celular',
  Glasses: 'Ótica',
  KeyRound: 'Chave',
  Ticket: 'Ingresso',
  Wifi: 'Internet',
  Utensils: 'Alimentação',
  Bus: 'Transporte',
  Lightbulb: 'Luz',
  Music: 'Música',
  Camera: 'Fotografia',
  BookOpen: 'Livros',
  Dumbbell: 'Academia',
  Pill: 'Remédios',
  Baby: 'Bebê',
  Tv: 'Streaming',
};

// ============================================================================
// Animated Icon Selector
// ============================================================================

interface AnimatedIconSelectorProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  color?: string;
  label?: string;
  showSearch?: boolean;
  className?: string;
}

export function AnimatedIconSelector({
  value,
  onChange,
  color = '#3b82f6',
  label,
  showSearch = true,
  className,
}: AnimatedIconSelectorProps) {
  const [search, setSearch] = useState('');

  const iconNames = Object.keys(ICON_MAP);

  const filteredIcons = useMemo(() => {
    if (!search) return iconNames;
    const searchLower = search.toLowerCase();
    return iconNames.filter(name => {
      const label = ICON_LABELS[name]?.toLowerCase() || '';
      return name.toLowerCase().includes(searchLower) || label.includes(searchLower);
    });
  }, [search, iconNames]);

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="text-sm font-medium text-zinc-700">{label}</Label>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar ícone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Icon Grid */}
      <div className="grid grid-cols-8 gap-2 max-h-[240px] overflow-y-auto p-1">
        {/* No Icon Option */}
        <motion.button
          type="button"
          onClick={() => onChange(undefined)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "relative p-2.5 rounded-xl border-2 border-dashed transition-all",
            !value 
              ? "border-zinc-900 bg-zinc-100" 
              : "border-zinc-200 hover:border-zinc-300 bg-white"
          )}
          title="Sem ícone"
        >
          <span className="text-zinc-400 text-sm">—</span>
          <AnimatePresence>
            {!value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center"
              >
                <Check className="w-2.5 h-2.5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Icon Options */}
        {filteredIcons.map((iconName, index) => {
          const Icon = ICON_MAP[iconName];
          const isSelected = value === iconName;

          return (
            <motion.button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.01, 0.3) }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative p-2.5 rounded-xl border-2 transition-all",
                isSelected 
                  ? "border-zinc-900 bg-zinc-100" 
                  : "border-zinc-100 hover:border-zinc-200 bg-white"
              )}
              title={ICON_LABELS[iconName] || iconName}
            >
              <Icon 
                className="w-5 h-5" 
                style={{ color: isSelected ? color : '#71717a' }}
              />
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredIcons.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-zinc-400 text-sm"
        >
          Nenhum ícone encontrado
        </motion.div>
      )}

      {/* Selected Icon Preview */}
      {value && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl"
        >
          <motion.div
            layout
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            {(() => {
              const Icon = ICON_MAP[value];
              return Icon ? <Icon className="w-5 h-5 text-white" /> : null;
            })()}
          </motion.div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">
              {ICON_LABELS[value] || value}
            </p>
            <p className="text-xs text-zinc-500">Ícone selecionado</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Compact Icon Display (for showing selected icon)
// ============================================================================

interface IconDisplayProps {
  icon?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconDisplay({ icon, color = '#3b82f6', size = 'md', className }: IconDisplayProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (!icon) return null;

  const Icon = ICON_MAP[icon];
  if (!Icon) return null;

  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      <Icon className={cn("text-white", iconSizes[size])} />
    </div>
  );
}

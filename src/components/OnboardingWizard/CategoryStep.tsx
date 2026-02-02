import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { 
  Tag,
  Home,
  Car,
  Utensils,
  ShoppingBag,
  Dumbbell,
  Plane,
  GraduationCap,
  Heart,
  Briefcase,
  Wifi,
  Smartphone,
  Gift,
  Music,
  Coffee,
  Bus,
  Check,
  Sparkles,
  SkipForward
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface CategoryPreset {
  id: string;
  name: string;
  icon: string;
  color: string;
  popular?: boolean;
}

interface CategoryStepProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onSkip?: () => void;
}

// ============================================================================
// Preset Categories
// ============================================================================

const CATEGORY_PRESETS: CategoryPreset[] = [
  { id: 'moradia', name: 'Moradia', icon: 'Home', color: '#3b82f6', popular: true },
  { id: 'alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#f97316', popular: true },
  { id: 'transporte', name: 'Transporte', icon: 'Car', color: '#8b5cf6', popular: true },
  { id: 'saude', name: 'Saúde', icon: 'Heart', color: '#ef4444', popular: true },
  { id: 'lazer', name: 'Lazer', icon: 'Music', color: '#ec4899' },
  { id: 'educacao', name: 'Educação', icon: 'GraduationCap', color: '#06b6d4' },
  { id: 'compras', name: 'Compras', icon: 'ShoppingBag', color: '#a855f7' },
  { id: 'trabalho', name: 'Trabalho', icon: 'Briefcase', color: '#64748b' },
  { id: 'academia', name: 'Academia', icon: 'Dumbbell', color: '#22c55e' },
  { id: 'viagens', name: 'Viagens', icon: 'Plane', color: '#0ea5e9' },
  { id: 'internet', name: 'Internet/TV', icon: 'Wifi', color: '#6366f1' },
  { id: 'celular', name: 'Celular', icon: 'Smartphone', color: '#14b8a6' },
  { id: 'presentes', name: 'Presentes', icon: 'Gift', color: '#f43f5e' },
  { id: 'cafe', name: 'Café/Lanches', icon: 'Coffee', color: '#78716c' },
  { id: 'transporte_publico', name: 'Transporte Público', icon: 'Bus', color: '#84cc16' },
];

// Icon mapping
const iconMap: Record<string, any> = {
  Home,
  Car,
  Utensils,
  ShoppingBag,
  Dumbbell,
  Plane,
  GraduationCap,
  Heart,
  Briefcase,
  Wifi,
  Smartphone,
  Gift,
  Music,
  Coffee,
  Bus,
};

// ============================================================================
// Category Card Component
// ============================================================================

interface CategoryCardProps {
  category: CategoryPreset;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

function CategoryCard({ category, isSelected, onClick, index }: CategoryCardProps) {
  const IconComponent = iconMap[category.icon] || Tag;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all",
        isSelected
          ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-400/20"
          : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-md"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Popular Badge */}
      {category.popular && !isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full"
        >
          Popular
        </motion.div>
      )}

      {/* Selection Check */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div 
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all",
          isSelected ? "scale-110" : ""
        )}
        style={{ backgroundColor: `${category.color}20`, color: category.color }}
      >
        <IconComponent className="w-6 h-6" />
      </div>

      {/* Name */}
      <span className={cn(
        "text-sm font-medium text-center transition-colors",
        isSelected ? "text-blue-600" : "text-zinc-700"
      )}>
        {category.name}
      </span>
    </motion.button>
  );
}

// ============================================================================
// Main Category Step Component
// ============================================================================

export function CategoryStep({ selectedCategories, onCategoriesChange, onSkip }: CategoryStepProps) {
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const selectAll = () => {
    onCategoriesChange(CATEGORY_PRESETS.map(c => c.id));
  };

  const selectPopular = () => {
    onCategoriesChange(CATEGORY_PRESETS.filter(c => c.popular).map(c => c.id));
  };

  const clearAll = () => {
    onCategoriesChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-400/30 mb-2"
        >
          <Tag className="w-8 h-8" />
        </motion.div>
        <h3 className="text-lg font-semibold text-zinc-900">Categorias de Gastos</h3>
        <p className="text-sm text-zinc-500">
          Selecione as categorias que você mais usa para organizar suas despesas
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={selectPopular}
          className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors"
        >
          ✨ Populares
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={selectAll}
          className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
        >
          Selecionar Todas
        </motion.button>
        {selectedCategories.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearAll}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-600 rounded-full hover:bg-zinc-200 transition-colors"
          >
            Limpar
          </motion.button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {CATEGORY_PRESETS.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategories.includes(category.id)}
            onClick={() => toggleCategory(category.id)}
            index={index}
          />
        ))}
      </div>

      {/* Skip Button */}
      {selectedCategories.length === 0 && onSkip && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onSkip}
          className="w-full p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 text-zinc-500"
        >
          <SkipForward className="w-4 h-4" />
          <span className="text-sm font-medium">Pular e criar depois</span>
        </motion.button>
      )}

      {/* Status Indicator */}
      <AnimatePresence>
        {selectedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3"
          >
            <Sparkles className="w-4 h-4" />
            <span>{selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''} selecionada{selectedCategories.length > 1 ? 's' : ''}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { CATEGORY_PRESETS, iconMap };

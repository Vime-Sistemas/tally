import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Plus,
  Check,
  Utensils,
  Car,
  Home,
  Zap,
  Heart,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  TrendingUp,
  MoreHorizontal,
  Briefcase,
  Gift,
  Landmark,
  type LucideIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TransactionType } from '../../types/transaction';
import { CategoryService, type Category } from '../../services/categoryService';

// ============================================================================
// Types
// ============================================================================

type TransactionTypeValue = typeof TransactionType.INCOME | typeof TransactionType.EXPENSE;

interface CategoryStepProps {
  transactionType: TransactionTypeValue;
  value: string;
  onChange: (category: string) => void;
  onNext: () => void;
  isPlanner: boolean;
}

interface CategoryOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  isCustom?: boolean;
}

// ============================================================================
// Category Icons Mapping
// ============================================================================

const CATEGORY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  // Expense categories
  FOOD: { icon: Utensils, color: 'text-orange-500 bg-orange-50' },
  TRANSPORT: { icon: Car, color: 'text-blue-500 bg-blue-50' },
  HOUSING: { icon: Home, color: 'text-violet-500 bg-violet-50' },
  UTILITIES: { icon: Zap, color: 'text-yellow-500 bg-yellow-50' },
  HEALTHCARE: { icon: Heart, color: 'text-rose-500 bg-rose-50' },
  ENTERTAINMENT: { icon: Gamepad2, color: 'text-pink-500 bg-pink-50' },
  EDUCATION: { icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50' },
  SHOPPING: { icon: ShoppingBag, color: 'text-cyan-500 bg-cyan-50' },
  INVESTMENT: { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
  OTHER_EXPENSE: { icon: MoreHorizontal, color: 'text-zinc-500 bg-zinc-50' },
  // Income categories
  SALARY: { icon: Briefcase, color: 'text-emerald-500 bg-emerald-50' },
  FREELANCE: { icon: Landmark, color: 'text-blue-500 bg-blue-50' },
  OTHER_INCOME: { icon: Gift, color: 'text-amber-500 bg-amber-50' },
};

const DEFAULT_EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: 'FOOD', label: 'Alimentação', ...CATEGORY_ICONS.FOOD },
  { value: 'TRANSPORT', label: 'Transporte', ...CATEGORY_ICONS.TRANSPORT },
  { value: 'HOUSING', label: 'Moradia', ...CATEGORY_ICONS.HOUSING },
  { value: 'UTILITIES', label: 'Contas', ...CATEGORY_ICONS.UTILITIES },
  { value: 'HEALTHCARE', label: 'Saúde', ...CATEGORY_ICONS.HEALTHCARE },
  { value: 'ENTERTAINMENT', label: 'Lazer', ...CATEGORY_ICONS.ENTERTAINMENT },
  { value: 'EDUCATION', label: 'Educação', ...CATEGORY_ICONS.EDUCATION },
  { value: 'SHOPPING', label: 'Compras', ...CATEGORY_ICONS.SHOPPING },
  { value: 'INVESTMENT', label: 'Investimento', ...CATEGORY_ICONS.INVESTMENT },
  { value: 'OTHER_EXPENSE', label: 'Outros', ...CATEGORY_ICONS.OTHER_EXPENSE },
];

const DEFAULT_INCOME_CATEGORIES: CategoryOption[] = [
  { value: 'SALARY', label: 'Salário', ...CATEGORY_ICONS.SALARY },
  { value: 'FREELANCE', label: 'Freelance', ...CATEGORY_ICONS.FREELANCE },
  { value: 'INVESTMENT', label: 'Investimento', ...CATEGORY_ICONS.INVESTMENT },
  { value: 'OTHER_INCOME', label: 'Outros', ...CATEGORY_ICONS.OTHER_INCOME },
];

// ============================================================================
// Category Step Component
// ============================================================================

export function CategoryStep({ 
  transactionType, 
  value, 
  onChange, 
  onNext,
  isPlanner 
}: CategoryStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [, setIsLoading] = useState(true);

  const accentBg = isPlanner ? 'bg-emerald-500' : 'bg-blue-500';
  const accentRing = isPlanner ? 'ring-emerald-500' : 'ring-blue-500';

  // Load user categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await CategoryService.getCategories();
        setUserCategories(categories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Build category options
  const categories = useMemo(() => {
    const defaultCategories = transactionType === TransactionType.INCOME 
      ? DEFAULT_INCOME_CATEGORIES 
      : DEFAULT_EXPENSE_CATEGORIES;

    const customCategories: CategoryOption[] = userCategories
      .filter(c => c.type === transactionType)
      .map(c => ({
        value: c.name,
        label: c.name,
        icon: MoreHorizontal,
        color: 'text-zinc-500 bg-zinc-50',
        isCustom: true,
      }));

    return [...defaultCategories, ...customCategories];
  }, [transactionType, userCategories]);

  // Filter by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(c => c.label.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  const handleSelect = (category: string) => {
    onChange(category);
  };

  const handleContinue = () => {
    if (value) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200",
              "text-zinc-900 placeholder:text-zinc-400",
              "focus:outline-none focus:ring-2",
              isPlanner ? "focus:ring-emerald-500/20 focus:border-emerald-500" : "focus:ring-blue-500/20 focus:border-blue-500"
            )}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {filteredCategories.map((category, index) => {
            const isSelected = value === category.value;
            const [iconColor, bgColor] = category.color.split(' ');
            
            return (
              <motion.button
                key={category.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleSelect(category.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                  isSelected
                    ? cn("border-transparent ring-2", accentRing, bgColor)
                    : "border-zinc-100 bg-white hover:border-zinc-200 active:scale-95"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  isSelected ? "bg-white shadow-sm" : bgColor
                )}>
                  <category.icon className={cn("w-6 h-6", iconColor)} />
                </div>
                <span className={cn(
                  "text-xs font-medium text-center line-clamp-2",
                  isSelected ? "text-zinc-900" : "text-zinc-600"
                )}>
                  {category.label}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn("absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white", accentBg)}
                  >
                    <Check className="w-3 h-3" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-zinc-500">Nenhuma categoria encontrada</p>
            <button className={cn("mt-2 text-sm font-medium", isPlanner ? "text-emerald-500" : "text-blue-500")}>
              <Plus className="w-4 h-4 inline mr-1" />
              Criar categoria
            </button>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="p-4 border-t border-zinc-100 bg-white">
        <motion.button
          onClick={handleContinue}
          disabled={!value}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-white transition-all",
            value 
              ? cn(accentBg, "active:scale-[0.98]") 
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          )}
          whileTap={value ? { scale: 0.98 } : {}}
        >
          Continuar
        </motion.button>
      </div>
    </div>
  );
}

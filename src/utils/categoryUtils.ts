/**
 * Category Icons & Utils - Utilitário centralizado para ícones e labels de categorias
 */
import { 
  Coffee, 
  Car, 
  Home, 
  ShoppingBag, 
  Zap, 
  Heart, 
  Gamepad2, 
  GraduationCap, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  ArrowRightLeft,
  Shirt,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  Shield,
  Repeat,
  Users,
  Baby,
  Dumbbell,
  Music,
  Utensils,
  Sparkles,
  type LucideIcon
} from 'lucide-react';

export interface CategoryDefinition {
  id: string;
  name: string;
  label: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
}

// Mapeamento de ícones string para componentes
export const ICON_MAP: Record<string, LucideIcon> = {
  Coffee,
  Car,
  Home,
  ShoppingBag,
  Zap,
  Heart,
  Gamepad2,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  Shirt,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  Building2,
  Globe,
  Landmark,
  Receipt,
  PawPrint,
  Gift,
  Plane,
  Shield,
  Repeat,
  Users,
  Baby,
  Dumbbell,
  Music,
  Utensils,
  Sparkles,
};

// Lista de ícones disponíveis para seleção
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

// Cores predefinidas para categorias
export const CATEGORY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
];

// Categorias padrão do sistema (legado - para compatibilidade)
export const DEFAULT_INCOME_CATEGORIES: CategoryDefinition[] = [
  { id: 'salary', name: 'SALARY', label: 'Salário', type: 'INCOME', icon: 'Briefcase', color: '#10B981' },
  { id: 'freelance', name: 'FREELANCE', label: 'Freelance', type: 'INCOME', icon: 'DollarSign', color: '#3B82F6' },
  { id: 'investment_income', name: 'INVESTMENT', label: 'Investimentos', type: 'INCOME', icon: 'TrendingUp', color: '#8B5CF6' },
  { id: 'other_income', name: 'OTHER_INCOME', label: 'Outros', type: 'INCOME', icon: 'Coins', color: '#6366F1' },
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoryDefinition[] = [
  { id: 'food', name: 'FOOD', label: 'Alimentação', type: 'EXPENSE', icon: 'Coffee', color: '#F59E0B' },
  { id: 'transport', name: 'TRANSPORT', label: 'Transporte', type: 'EXPENSE', icon: 'Car', color: '#3B82F6' },
  { id: 'housing', name: 'HOUSING', label: 'Moradia', type: 'EXPENSE', icon: 'Home', color: '#10B981' },
  { id: 'utilities', name: 'UTILITIES', label: 'Contas', type: 'EXPENSE', icon: 'Zap', color: '#EF4444' },
  { id: 'healthcare', name: 'HEALTHCARE', label: 'Saúde', type: 'EXPENSE', icon: 'Heart', color: '#EC4899' },
  { id: 'entertainment', name: 'ENTERTAINMENT', label: 'Lazer', type: 'EXPENSE', icon: 'Gamepad2', color: '#8B5CF6' },
  { id: 'education', name: 'EDUCATION', label: 'Educação', type: 'EXPENSE', icon: 'GraduationCap', color: '#06B6D4' },
  { id: 'shopping', name: 'SHOPPING', label: 'Compras', type: 'EXPENSE', icon: 'ShoppingBag', color: '#F97316' },
  { id: 'other_expense', name: 'OTHER_EXPENSE', label: 'Outros', type: 'EXPENSE', icon: 'Receipt', color: '#6366F1' },
];

export const ALL_DEFAULT_CATEGORIES = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

// Labels legados para compatibilidade
export const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',
  HOUSING: 'Moradia',
  SHOPPING: 'Compras',
  UTILITIES: 'Contas',
  HEALTHCARE: 'Saúde',
  ENTERTAINMENT: 'Lazer',
  EDUCATION: 'Educação',
  SALARY: 'Salário',
  FREELANCE: 'Freelance',
  INVESTMENT: 'Investimentos',
  TRANSFER: 'Transferência',
  DEBT_PAYMENT: 'Pagamento de Dívida',
  OTHER_INCOME: 'Outras Receitas',
  OTHER_EXPENSE: 'Outras Despesas',
  BONUS: 'Bônus / PLR',
  SELF_EMPLOYED: 'Autônomo / PJ',
  DIVIDENDS: 'Dividendos',
  INTEREST: 'Juros',
  RENT: 'Aluguel',
  INVESTMENT_INCOME: 'Rendimentos',
  PENSION_INCOME: 'Previdência',
  INSURANCE: 'Seguros',
  CLOTHING: 'Vestuário',
  SUBSCRIPTIONS: 'Assinaturas',
  TAXES: 'Impostos',
  FEES: 'Taxas e Tarifas',
  PETS: 'Pets',
  DONATIONS: 'Doações',
  TRAVEL: 'Viagens',
};

/**
 * Retorna o componente de ícone para uma categoria
 */
export function getCategoryIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || DollarSign;
}

/**
 * Retorna o label de uma categoria (suporta legado e novo)
 */
export function getCategoryLabel(categoryNameOrId: string, userCategories?: { id: string; name: string }[]): string {
  // Primeiro tenta encontrar nas categorias do usuário
  if (userCategories) {
    const userCat = userCategories.find(c => c.id === categoryNameOrId || c.name === categoryNameOrId);
    if (userCat) return userCat.name;
  }

  // Depois tenta encontrar nas categorias padrão
  const defaultCat = ALL_DEFAULT_CATEGORIES.find(c => c.id === categoryNameOrId || c.name === categoryNameOrId);
  if (defaultCat) return defaultCat.label;

  // Por último, tenta o mapeamento legado
  return LEGACY_CATEGORY_LABELS[categoryNameOrId] || categoryNameOrId;
}

/**
 * Retorna a cor de uma categoria
 */
export function getCategoryColor(categoryNameOrId: string, userCategories?: { id: string; color?: string }[]): string {
  // Primeiro tenta encontrar nas categorias do usuário
  if (userCategories) {
    const userCat = userCategories.find(c => c.id === categoryNameOrId);
    if (userCat?.color) return userCat.color;
  }

  // Depois tenta encontrar nas categorias padrão
  const defaultCat = ALL_DEFAULT_CATEGORIES.find(c => c.id === categoryNameOrId || c.name === categoryNameOrId);
  if (defaultCat) return defaultCat.color;

  return '#6366F1'; // default indigo
}

/**
 * Retorna o ícone de uma categoria baseado no nome
 */
export function getCategoryIconName(categoryNameOrId: string, userCategories?: { id: string; icon?: string }[]): string {
  // Primeiro tenta encontrar nas categorias do usuário
  if (userCategories) {
    const userCat = userCategories.find(c => c.id === categoryNameOrId);
    if (userCat?.icon) return userCat.icon;
  }

  // Depois tenta encontrar nas categorias padrão
  const defaultCat = ALL_DEFAULT_CATEGORIES.find(c => c.id === categoryNameOrId || c.name === categoryNameOrId);
  if (defaultCat) return defaultCat.icon;

  // Mapeamento legado por nome
  const legacyIconMap: Record<string, string> = {
    FOOD: 'Coffee',
    TRANSPORT: 'Car',
    HOUSING: 'Home',
    SHOPPING: 'ShoppingBag',
    UTILITIES: 'Zap',
    HEALTHCARE: 'Heart',
    ENTERTAINMENT: 'Gamepad2',
    EDUCATION: 'GraduationCap',
    SALARY: 'Briefcase',
    FREELANCE: 'DollarSign',
    INVESTMENT: 'TrendingUp',
    TRANSFER: 'ArrowRightLeft',
  };

  return legacyIconMap[categoryNameOrId] || 'DollarSign';
}

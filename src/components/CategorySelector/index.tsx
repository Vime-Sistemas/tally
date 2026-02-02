/**
 * CategorySelector - Seletor visual de categorias com criação inline
 * 
 * Features:
 * - Grid visual com ícones e cores
 * - Criação rápida de nova categoria inline
 * - Busca fuzzy
 * - Priorização por frequência de uso (IndexedDB)
 * - Suporte a categorias legadas e novas
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { cn } from '../../lib/utils';
import { Search, Plus, Check, ChevronDown, Sparkles } from 'lucide-react';
import { CategoryService, type Category } from '../../services/categoryService';
import { frequencyCache } from '../../services/frequencyCache';
import { 
  AVAILABLE_ICONS,
  CATEGORY_COLORS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  getCategoryIconComponent,
} from '../../utils/categoryUtils';
import { toast } from 'sonner';

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string, categoryName?: string) => void;
  type: 'INCOME' | 'EXPENSE';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

interface DisplayCategory {
  id: string;
  name: string;
  label: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  isCustom: boolean;
  frequency?: number;
}

export function CategorySelector({
  value,
  onChange,
  type,
  placeholder = 'Selecionar categoria',
  disabled = false,
  error,
  className,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [frequentIds, setFrequentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('DollarSign');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Carregar categorias do usuário e frequência
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [categories, frequent] = await Promise.all([
          CategoryService.getCategories(),
          frequencyCache.getMostFrequent('category', 20),
        ]);
        setUserCategories(categories);
        setFrequentIds(frequent);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Combinar categorias padrão e do usuário, filtradas por tipo
  const allCategories = useMemo((): DisplayCategory[] => {
    const defaultCats = type === 'INCOME' 
      ? DEFAULT_INCOME_CATEGORIES 
      : DEFAULT_EXPENSE_CATEGORIES;

    // Categorias padrão
    const defaultDisplay: DisplayCategory[] = defaultCats.map(cat => ({
      ...cat,
      isCustom: false,
    }));

    // Categorias do usuário (filtradas por tipo)
    const userDisplay: DisplayCategory[] = userCategories
      .filter(cat => cat.type === type)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        label: cat.name,
        type: cat.type,
        icon: cat.icon || 'DollarSign',
        color: cat.color || CATEGORY_COLORS[0],
        isCustom: true,
      }));

    return [...userDisplay, ...defaultDisplay];
  }, [type, userCategories]);

  // Ordenar por frequência de uso
  const sortedCategories = useMemo(() => {
    const frequencyMap = new Map(frequentIds.map((id, idx) => [id, idx]));
    
    return [...allCategories].sort((a, b) => {
      const aFreq = frequencyMap.get(a.id) ?? frequencyMap.get(a.name) ?? Infinity;
      const bFreq = frequencyMap.get(b.id) ?? frequencyMap.get(b.name) ?? Infinity;
      
      // Primeiro por frequência
      if (aFreq !== bFreq) return aFreq - bFreq;
      
      // Depois categorias customizadas vêm primeiro
      if (a.isCustom !== b.isCustom) return a.isCustom ? -1 : 1;
      
      // Por último, alfabeticamente
      return a.label.localeCompare(b.label);
    });
  }, [allCategories, frequentIds]);

  // Filtrar por busca
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return sortedCategories;
    
    const term = search.toLowerCase();
    return sortedCategories.filter(cat => 
      cat.label.toLowerCase().includes(term) ||
      cat.name.toLowerCase().includes(term)
    );
  }, [sortedCategories, search]);

  // Separar em frequentes e outros
  const { frequentCategories, otherCategories } = useMemo(() => {
    const frequent = filteredCategories.slice(0, 8);
    const others = filteredCategories.slice(8);
    return { frequentCategories: frequent, otherCategories: others };
  }, [filteredCategories]);

  // Categoria selecionada
  const selectedCategory = useMemo(() => {
    return allCategories.find(cat => cat.id === value || cat.name === value);
  }, [allCategories, value]);

  // Selecionar categoria
  const handleSelect = useCallback(async (category: DisplayCategory) => {
    // Registrar uso no IndexedDB
    await frequencyCache.trackUsage(category.id || category.name, 'category');
    
    // Chamar onChange com id (para categorias custom) ou name (para legado)
    if (category.isCustom) {
      onChange(category.id, category.name);
    } else {
      onChange(category.name); // Mantém compatibilidade com legado
    }
    
    setOpen(false);
    setSearch('');
  }, [onChange]);

  // Criar nova categoria
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Digite um nome para a categoria');
      return;
    }

    try {
      setCreating(true);
      const newCategory = await CategoryService.createCategory({
        name: newCategoryName.trim(),
        type,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });

      setUserCategories(prev => [...prev, newCategory]);
      
      // Selecionar a nova categoria
      await frequencyCache.trackUsage(newCategory.id, 'category');
      onChange(newCategory.id, newCategory.name);
      
      toast.success('Categoria criada!');
      setCreateDialogOpen(false);
      setOpen(false);
      setNewCategoryName('');
      setNewCategoryIcon('DollarSign');
      setNewCategoryColor(CATEGORY_COLORS[0]);
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    } finally {
      setCreating(false);
    }
  };

  // Atalho para criar quando não encontra
  const showCreateSuggestion = search.trim().length > 0 && filteredCategories.length === 0;

  // Renderizar ícone
  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = getCategoryIconComponent(iconName);
    return <IconComponent className={cn('h-4 w-4', className)} />;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between h-11 font-normal',
              !selectedCategory && 'text-muted-foreground',
              error && 'border-red-500',
              className
            )}
          >
            {selectedCategory ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedCategory.color + '20' }}
                >
                  {renderIcon(selectedCategory.icon, `text-[${selectedCategory.color}]`)}
                </div>
                <span>{selectedCategory.label}</span>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar ou criar categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
              </div>
            ) : (
              <>
                {/* Categorias frequentes */}
                {frequentCategories.length > 0 && (
                  <div className="mb-3">
                    {!search && (
                      <div className="flex items-center gap-1 px-2 mb-2">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-zinc-400 font-medium">Frequentes</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      {frequentCategories.map((category) => (
                        <button
                          key={category.id || category.name}
                          onClick={() => handleSelect(category)}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                            'hover:bg-zinc-100 active:bg-zinc-200',
                            (value === category.id || value === category.name) && 'bg-blue-50 ring-1 ring-blue-200'
                          )}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            {renderIcon(category.icon)}
                          </div>
                          <span className="text-sm truncate">{category.label}</span>
                          {(value === category.id || value === category.name) && (
                            <Check className="h-4 w-4 text-blue-500 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outras categorias */}
                {otherCategories.length > 0 && (
                  <div>
                    {!search && frequentCategories.length > 0 && (
                      <div className="px-2 mb-2">
                        <span className="text-xs text-zinc-400 font-medium">Outras</span>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {otherCategories.map((category) => (
                        <button
                          key={category.id || category.name}
                          onClick={() => handleSelect(category)}
                          className={cn(
                            'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                            'hover:bg-zinc-100 active:bg-zinc-200',
                            (value === category.id || value === category.name) && 'bg-blue-50 ring-1 ring-blue-200'
                          )}
                        >
                          <div 
                            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            {renderIcon(category.icon)}
                          </div>
                          <span className="text-sm">{category.label}</span>
                          {category.isCustom && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded ml-auto">
                              Sua
                            </span>
                          )}
                          {(value === category.id || value === category.name) && (
                            <Check className="h-4 w-4 text-blue-500 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugestão de criar quando não encontra */}
                {showCreateSuggestion && (
                  <div className="text-center py-6">
                    <p className="text-sm text-zinc-500 mb-3">
                      Nenhuma categoria encontrada
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewCategoryName(search);
                        setCreateDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar "{search}"
                    </Button>
                  </div>
                )}

                {/* Botão de criar nova categoria */}
                {!showCreateSuggestion && (
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="w-full flex items-center gap-2 p-2 mt-2 rounded-lg text-left transition-colors hover:bg-zinc-100 text-blue-600 border border-dashed border-zinc-200"
                  >
                    <div className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-50">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Nova categoria</span>
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Dialog de criar categoria */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Preview */}
            <div className="flex items-center justify-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: newCategoryColor + '20' }}
              >
                {renderIcon(newCategoryIcon, 'h-8 w-8')}
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Academia, Netflix, Pet..."
                autoFocus
              />
            </div>

            {/* Ícone */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-8 gap-1 p-2 bg-zinc-50 rounded-lg max-h-[120px] overflow-y-auto">
                {AVAILABLE_ICONS.slice(0, 32).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewCategoryIcon(iconName)}
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                      newCategoryIcon === iconName 
                        ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-300' 
                        : 'hover:bg-zinc-200 text-zinc-600'
                    )}
                  >
                    {renderIcon(iconName)}
                  </button>
                ))}
              </div>
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform',
                      newCategoryColor === color && 'ring-2 ring-offset-2 ring-zinc-400 scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={creating || !newCategoryName.trim()}>
              {creating ? 'Criando...' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

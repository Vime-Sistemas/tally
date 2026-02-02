/**
 * TagSelector - Seletor visual de tags com criação inline
 * 
 * Features:
 * - Multi-seleção com chips visuais
 * - Criação rápida inline (apenas digita e pressiona Enter)
 * - Busca fuzzy
 * - Priorização por frequência de uso (IndexedDB)
 * - Cores automáticas ou personalizáveis
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { cn } from '../../lib/utils';
import { Search, Plus, X, Tag as TagIcon, Sparkles } from 'lucide-react';
import { TagService, type Tag } from '../../services/tagService';
import { frequencyCache } from '../../services/frequencyCache';
import { CATEGORY_COLORS } from '../../utils/categoryUtils';
import { toast } from 'sonner';

interface TagSelectorProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
}

interface DisplayTag extends Tag {
  frequency?: number;
}

export function TagSelector({
  value = [],
  onChange,
  placeholder = 'Adicionar tags...',
  disabled = false,
  maxTags = 10,
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [frequentIds, setFrequentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar tags do usuário e frequência
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tags, frequent] = await Promise.all([
          TagService.getTags(),
          frequencyCache.getMostFrequent('tag', 20),
        ]);
        setUserTags(tags);
        setFrequentIds(frequent);
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Ordenar por frequência de uso
  const sortedTags = useMemo((): DisplayTag[] => {
    const frequencyMap = new Map(frequentIds.map((id, idx) => [id, idx]));
    
    return [...userTags].sort((a, b) => {
      const aFreq = frequencyMap.get(a.id) ?? Infinity;
      const bFreq = frequencyMap.get(b.id) ?? Infinity;
      
      // Primeiro por frequência
      if (aFreq !== bFreq) return aFreq - bFreq;
      
      // Por último, alfabeticamente
      return a.name.localeCompare(b.name);
    });
  }, [userTags, frequentIds]);

  // Filtrar por busca
  const filteredTags = useMemo(() => {
    if (!search.trim()) return sortedTags;
    
    const term = search.toLowerCase();
    return sortedTags.filter(tag => 
      tag.name.toLowerCase().includes(term)
    );
  }, [sortedTags, search]);

  // Separar em selecionadas, frequentes e outras
  const { selectedTags, availableTags, frequentTags, otherTags } = useMemo(() => {
    const selected = sortedTags.filter(tag => value.includes(tag.id));
    const available = filteredTags.filter(tag => !value.includes(tag.id));
    
    // Limitar frequentes apenas se não houver busca
    const frequent = search.trim() ? [] : available.slice(0, 6);
    const others = search.trim() ? available : available.slice(6);
    
    return { 
      selectedTags: selected, 
      availableTags: available,
      frequentTags: frequent, 
      otherTags: others 
    };
  }, [sortedTags, filteredTags, value, search]);

  // Selecionar/desselecionar tag
  const handleToggle = useCallback(async (tag: Tag) => {
    const isSelected = value.includes(tag.id);
    
    if (isSelected) {
      onChange(value.filter(id => id !== tag.id));
    } else {
      if (value.length >= maxTags) {
        toast.error(`Máximo de ${maxTags} tags permitidas`);
        return;
      }
      // Registrar uso no IndexedDB
      await frequencyCache.trackUsage(tag.id, 'tag');
      onChange([...value, tag.id]);
    }
  }, [value, onChange, maxTags]);

  // Remover tag
  const handleRemove = useCallback((tagId: string) => {
    onChange(value.filter(id => id !== tagId));
  }, [value, onChange]);

  // Criar nova tag
  const handleCreateTag = async (name: string) => {
    if (!name.trim()) return;
    
    // Verificar se já existe
    const exists = userTags.some(t => t.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.error('Essa tag já existe');
      return;
    }

    try {
      setCreating(true);
      
      // Gerar cor aleatória das predefinidas
      const randomColor = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
      
      const newTag = await TagService.createTag({
        name: name.trim(),
        color: randomColor,
      });

      setUserTags(prev => [...prev, newTag]);
      
      // Selecionar a nova tag
      await frequencyCache.trackUsage(newTag.id, 'tag');
      onChange([...value, newTag.id]);
      
      toast.success('Tag criada!');
      setSearch('');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag');
    } finally {
      setCreating(false);
    }
  };

  // Handler para Enter no input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      
      // Se a busca corresponde exatamente a uma tag existente, seleciona
      const exactMatch = availableTags.find(t => 
        t.name.toLowerCase() === search.toLowerCase()
      );
      
      if (exactMatch) {
        handleToggle(exactMatch);
        setSearch('');
      } else {
        // Senão, cria uma nova
        handleCreateTag(search);
      }
    }
  };

  // Verificar se deve mostrar sugestão de criar
  const showCreateSuggestion = search.trim().length > 0 && 
    !userTags.some(t => t.name.toLowerCase() === search.toLowerCase());

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tags selecionadas */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1 pr-1 h-7"
            style={{ 
              backgroundColor: (tag.color || '#6366F1') + '20', 
              color: tag.color || '#6366F1',
              borderColor: (tag.color || '#6366F1') + '40',
            }}
          >
            <TagIcon className="h-3 w-3" />
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemove(tag.id)}
              disabled={disabled}
              className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {/* Botão para adicionar mais */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || value.length >= maxTags}
              className={cn(
                'h-7 px-2 text-xs gap-1 border-dashed',
                value.length >= maxTags && 'opacity-50'
              )}
            >
              <Plus className="h-3 w-3" />
              {selectedTags.length === 0 ? placeholder : 'Mais'}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-[280px] p-0" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  ref={inputRef}
                  placeholder="Buscar ou criar tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 h-9"
                  autoFocus
                />
              </div>
              {search.trim() && (
                <p className="text-[10px] text-zinc-400 mt-1 ml-1">
                  Pressione Enter para {showCreateSuggestion ? 'criar' : 'selecionar'}
                </p>
              )}
            </div>

            <div className="max-h-[250px] overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
                </div>
              ) : (
                <>
                  {/* Tags frequentes */}
                  {frequentTags.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 px-2 mb-2">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-zinc-400 font-medium">Frequentes</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {frequentTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleToggle(tag)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
                              'hover:opacity-80 active:scale-95'
                            )}
                            style={{ 
                              backgroundColor: (tag.color || '#6366F1') + '20', 
                              color: tag.color || '#6366F1',
                            }}
                          >
                            <TagIcon className="h-3 w-3" />
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outras tags */}
                  {otherTags.length > 0 && (
                    <div>
                      {frequentTags.length > 0 && !search && (
                        <div className="px-2 mb-2">
                          <span className="text-xs text-zinc-400 font-medium">Todas</span>
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {otherTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleToggle(tag)}
                            className={cn(
                              'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                              'hover:bg-zinc-100 active:bg-zinc-200'
                            )}
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color || '#6366F1' }}
                            />
                            <span className="text-sm">{tag.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sugestão de criar quando não encontra */}
                  {showCreateSuggestion && (
                    <button
                      onClick={() => handleCreateTag(search)}
                      disabled={creating}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                        'hover:bg-blue-50 text-blue-600 border border-dashed border-blue-200',
                        creating && 'opacity-50'
                      )}
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center bg-blue-100">
                        <Plus className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium">
                        {creating ? 'Criando...' : `Criar "${search}"`}
                      </span>
                    </button>
                  )}

                  {/* Estado vazio */}
                  {availableTags.length === 0 && !showCreateSuggestion && (
                    <div className="text-center py-6">
                      <TagIcon className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">
                        {userTags.length === 0 
                          ? 'Nenhuma tag criada ainda' 
                          : 'Todas as tags já selecionadas'}
                      </p>
                      {userTags.length === 0 && (
                        <p className="text-xs text-zinc-400 mt-1">
                          Digite acima para criar a primeira
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Contador de tags */}
      {value.length > 0 && (
        <p className="text-[10px] text-zinc-400">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}

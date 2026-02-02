import {  useMemo } from 'react';
import { motion } from 'framer-motion';
import { FormWizard, WizardStepContent, useWizard, type WizardStep } from '../FormWizard';
import { AnimatedColorPalette, PRESET_COLORS } from '../AnimatedColorPalette';
import { AnimatedIconSelector, IconDisplay, ICON_MAP } from '../AnimatedIconSelector';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, Sparkles, FolderTree, Target, Check } from 'lucide-react';
import type { Category } from '../../services/categoryService';

// ============================================================================
// Types
// ============================================================================

export interface CategoryWizardData {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon?: string;
  parentId: string | null;
  setupBudget: boolean;
  budgetAmount?: number;
}

interface CategoryWizardProps {
  initialData?: Partial<CategoryWizardData>;
  existingCategories: Category[];
  editingCategoryId?: string;
  onSubmit: (data: CategoryWizardData) => Promise<void>;
  onCancel: () => void;
  onBudgetSetup?: (categoryData: CategoryWizardData) => void;
}

// ============================================================================
// Step 1: Basic Info
// ============================================================================

function BasicInfoStep() {
  const { data, updateData } = useWizard();

  return (
    <WizardStepContent>
      {/* Type Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-zinc-700">Tipo da categoria</Label>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            onClick={() => updateData({ type: 'EXPENSE', parentId: null })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative p-4 rounded-2xl border-2 transition-all text-left",
              data.type === 'EXPENSE'
                ? "border-rose-400 bg-rose-50"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                data.type === 'EXPENSE' ? "bg-rose-400" : "bg-zinc-200"
              )}>
                <ArrowDownCircle className={cn(
                  "w-5 h-5",
                  data.type === 'EXPENSE' ? "text-white" : "text-zinc-500"
                )} />
              </div>
              <div>
                <p className={cn(
                  "font-semibold",
                  data.type === 'EXPENSE' ? "text-rose-700" : "text-zinc-700"
                )}>
                  Despesa
                </p>
                <p className="text-xs text-zinc-500">Gastos e saídas</p>
              </div>
            </div>
            {data.type === 'EXPENSE' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-5 h-5 bg-rose-400 rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => updateData({ type: 'INCOME', parentId: null })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative p-4 rounded-2xl border-2 transition-all text-left",
              data.type === 'INCOME'
                ? "border-emerald-400 bg-emerald-50"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                data.type === 'INCOME' ? "bg-emerald-400" : "bg-zinc-200"
              )}>
                <ArrowUpCircle className={cn(
                  "w-5 h-5",
                  data.type === 'INCOME' ? "text-white" : "text-zinc-500"
                )} />
              </div>
              <div>
                <p className={cn(
                  "font-semibold",
                  data.type === 'INCOME' ? "text-emerald-700" : "text-zinc-700"
                )}>
                  Receita
                </p>
                <p className="text-xs text-zinc-500">Ganhos e entradas</p>
              </div>
            </div>
            {data.type === 'INCOME' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>

      {/* Name Input */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-zinc-700">Nome da categoria</Label>
        <Input
          value={data.name || ''}
          onChange={(e) => updateData({ name: e.target.value })}
          placeholder="Ex: Alimentação, Salário, Transporte..."
          className="h-12 text-base"
          autoFocus
        />
        <p className="text-xs text-zinc-500">
          Escolha um nome que represente bem os gastos ou receitas desta categoria.
        </p>
      </div>

      {/* Preview */}
      {data.name && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-zinc-50 rounded-2xl"
        >
          <p className="text-xs text-zinc-500 mb-2">Preview</p>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: data.color || PRESET_COLORS[0] }}
            />
            <div>
              <p className="font-medium text-zinc-900">{data.name}</p>
              <p className="text-xs text-zinc-500">
                {data.type === 'INCOME' ? 'Receita' : 'Despesa'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </WizardStepContent>
  );
}

// ============================================================================
// Step 2: Visual Config
// ============================================================================

function VisualConfigStep() {
  const { data, updateData } = useWizard();

  return (
    <WizardStepContent>
      {/* Color Selection */}
      <AnimatedColorPalette
        value={data.color || PRESET_COLORS[0]}
        onChange={(color) => updateData({ color })}
        label="Cor da categoria"
      />

      {/* Icon Selection */}
      <AnimatedIconSelector
        value={data.icon}
        onChange={(icon) => updateData({ icon })}
        color={data.color || PRESET_COLORS[0]}
        label="Ícone (opcional)"
      />

      {/* Full Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-zinc-50 rounded-2xl"
      >
        <p className="text-xs text-zinc-500 mb-3">Preview final</p>
        <div className="flex items-center gap-3">
          {data.icon ? (
            <IconDisplay
              icon={data.icon}
              color={data.color || PRESET_COLORS[0]}
              size="lg"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl"
              style={{ backgroundColor: data.color || PRESET_COLORS[0] }}
            />
          )}
          <div>
            <p className="font-semibold text-zinc-900">{data.name || 'Nova Categoria'}</p>
            <div className="flex items-center gap-2 mt-1">
              {data.type === 'INCOME' ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Receita
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  Despesa
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </WizardStepContent>
  );
}

// ============================================================================
// Step 3: Hierarchy
// ============================================================================

interface HierarchyStepProps {
  categories: Category[];
  editingId?: string;
}

function HierarchyStep({ categories, editingId }: HierarchyStepProps) {
  const { data, updateData } = useWizard();

  // Get available parent categories (same type, not self or descendants)
  const availableParents = useMemo(() => {
    const getDescendantIds = (id: string): Set<string> => {
      const descendants = new Set<string>();
      const stack = [id];
      while (stack.length) {
        const current = stack.pop()!;
        categories.forEach(cat => {
          if (cat.parentId === current && !descendants.has(cat.id)) {
            descendants.add(cat.id);
            stack.push(cat.id);
          }
        });
      }
      return descendants;
    };

    const blockedIds = editingId 
      ? new Set([editingId, ...getDescendantIds(editingId)])
      : new Set<string>();

    return categories.filter(cat => 
      cat.type === data.type && !blockedIds.has(cat.id)
    );
  }, [categories, data.type, editingId]);

  const selectedParent = availableParents.find(c => c.id === data.parentId);

  return (
    <WizardStepContent>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-zinc-700">Categoria mãe</Label>
          <p className="text-xs text-zinc-500 mt-1">
            Organize suas categorias em hierarquias para relatórios mais detalhados.
          </p>
        </div>

        {/* No Parent Option */}
        <motion.button
          type="button"
          onClick={() => updateData({ parentId: null })}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "w-full p-4 rounded-2xl border-2 text-left transition-all",
            !data.parentId
              ? "border-blue-400 bg-blue-50"
              : "border-zinc-200 bg-white hover:border-zinc-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              !data.parentId ? "bg-blue-400" : "bg-zinc-200"
            )}>
              <Sparkles className={cn(
                "w-5 h-5",
                !data.parentId ? "text-white" : "text-zinc-500"
              )} />
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-semibold",
                !data.parentId ? "text-blue-700" : "text-zinc-700"
              )}>
                Categoria principal
              </p>
              <p className="text-xs text-zinc-500">
                Sem categoria mãe - aparecerá no nível raiz
              </p>
            </div>
            {!data.parentId && (
              <Check className="w-5 h-5 text-blue-400" />
            )}
          </div>
        </motion.button>

        {/* Available Parents */}
        {availableParents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Ou escolha uma categoria mãe
            </p>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {availableParents.map((category) => {
                const Icon = category.icon ? ICON_MAP[category.icon] : null;
                const isSelected = data.parentId === category.id;

                return (
                  <motion.button
                    key={category.id}
                    type="button"
                    onClick={() => updateData({ parentId: category.id })}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "w-full p-3 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-blue-400 bg-blue-50"
                        : "border-zinc-100 bg-white hover:border-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color || '#64748b' }}
                      >
                        {Icon ? (
                          <Icon className="w-4 h-4 text-white" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 truncate">
                          {category.name}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview with hierarchy */}
        {data.parentId && selectedParent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-zinc-50 rounded-2xl"
          >
            <p className="text-xs text-zinc-500 mb-3">Hierarquia</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-zinc-700">{selectedParent.name}</span>
              <span className="text-zinc-400">→</span>
              <span className="font-semibold text-zinc-900">{data.name || 'Nova Categoria'}</span>
            </div>
          </motion.div>
        )}
      </div>
    </WizardStepContent>
  );
}

// ============================================================================
// Step 4: Budget Setup (Optional)
// ============================================================================

function BudgetSetupStep() {
  const { data, updateData } = useWizard();

  return (
    <WizardStepContent>
      <div className="space-y-6">
        {/* Toggle Budget */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Definir meta mensal</p>
              <p className="text-xs text-zinc-500">
                Acompanhe seus gastos com alertas
              </p>
            </div>
          </div>
          <Switch
            checked={data.setupBudget || false}
            onCheckedChange={(checked) => updateData({ setupBudget: checked })}
          />
        </div>

        {/* Budget Amount */}
        {data.setupBudget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <Label className="text-sm font-medium text-zinc-700">
              Valor limite mensal
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                R$
              </span>
              <Input
                type="number"
                value={data.budgetAmount || ''}
                onChange={(e) => updateData({ budgetAmount: parseFloat(e.target.value) || undefined })}
                placeholder="0,00"
                className="h-14 text-xl font-semibold pl-12"
              />
            </div>
            <p className="text-xs text-zinc-500">
              Você receberá alertas quando estiver próximo ou ultrapassar este limite.
            </p>
          </motion.div>
        )}

        {/* Skip Info */}
        {!data.setupBudget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-6 border-2 border-dashed border-zinc-200 rounded-2xl"
          >
            <p className="text-sm text-zinc-500">
              Você pode configurar uma meta depois nas configurações da categoria.
            </p>
          </motion.div>
        )}

        {/* Final Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl"
        >
          <p className="text-xs text-zinc-500 mb-3">Resumo da categoria</p>
          <div className="flex items-center gap-3">
            {data.icon ? (
              <IconDisplay
                icon={data.icon}
                color={data.color || PRESET_COLORS[0]}
                size="lg"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl"
                style={{ backgroundColor: data.color || PRESET_COLORS[0] }}
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-zinc-900">{data.name || 'Nova Categoria'}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {data.type === 'INCOME' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Receita
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    Despesa
                  </span>
                )}
                {data.setupBudget && data.budgetAmount && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Meta: R$ {data.budgetAmount.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </WizardStepContent>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic',
    title: 'Informações básicas',
    description: 'Tipo e nome da categoria',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: 'visual',
    title: 'Aparência',
    description: 'Cor e ícone para identificação',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: 'hierarchy',
    title: 'Organização',
    description: 'Hierarquia de categorias',
    icon: <FolderTree className="w-4 h-4" />,
    isOptional: true,
  },
  {
    id: 'budget',
    title: 'Meta mensal',
    description: 'Configure um limite de gastos',
    icon: <Target className="w-4 h-4" />,
    isOptional: true,
  },
];

export function CategoryWizard({
  initialData,
  existingCategories,
  editingCategoryId,
  onSubmit,
  onCancel
}: CategoryWizardProps) {
  const defaultData: CategoryWizardData = {
    name: initialData?.name || '',
    type: initialData?.type || 'EXPENSE',
    color: initialData?.color || PRESET_COLORS[0],
    icon: initialData?.icon,
    parentId: initialData?.parentId ?? null,
    setupBudget: false,
    budgetAmount: undefined,
  };

  const handleSubmit = async (data: Record<string, any>) => {
    const categoryData = data as CategoryWizardData;
    
    if (!categoryData.name?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    await onSubmit(categoryData);
  };

  return (
    <FormWizard
      wizardId={editingCategoryId ? `category-edit-${editingCategoryId}` : 'category-create'}
      steps={WIZARD_STEPS}
      initialData={defaultData}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Criar Categoria"
      autoSave={true}
      allowStepNavigation={true}
    >
      <BasicInfoStep />
      <VisualConfigStep />
      <HierarchyStep categories={existingCategories} editingId={editingCategoryId} />
      <BudgetSetupStep />
    </FormWizard>
  );
}

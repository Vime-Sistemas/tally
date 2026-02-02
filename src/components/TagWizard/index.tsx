import { motion } from 'framer-motion';
import { FormWizard, WizardStepContent, useWizard, type WizardStep } from '../FormWizard';
import { AnimatedColorPalette, PRESET_COLORS } from '../AnimatedColorPalette';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Tag, Sparkles } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface TagWizardData {
  name: string;
  color: string;
}

interface TagWizardProps {
  initialData?: Partial<TagWizardData>;
  editingTagId?: string;
  onSubmit: (data: TagWizardData) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Step 1: Name & Preview
// ============================================================================

function NameStep() {
  const { data, updateData } = useWizard();

  return (
    <WizardStepContent>
      {/* Name Input */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-zinc-700">Nome da tag</Label>
        <Input
          value={data.name || ''}
          onChange={(e) => updateData({ name: e.target.value })}
          placeholder="Ex: Viagem 2024, Projeto X, Emergência..."
          className="h-12 text-base"
          autoFocus
        />
        <p className="text-xs text-zinc-500">
          Tags são marcadores flexíveis para organizar suas transações de forma transversal.
        </p>
      </div>

      {/* Use Cases */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Ideias de uso
        </p>
        <div className="grid grid-cols-2 gap-2">
          {['Viagem 2024', 'Projeto Casa', 'Emergência', 'Freelance'].map((example) => (
            <motion.button
              key={example}
              type="button"
              onClick={() => updateData({ name: example })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 rounded-xl border border-zinc-200 bg-white text-left hover:border-zinc-300 transition-all"
            >
              <p className="text-sm font-medium text-zinc-700">{example}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {data.name && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-zinc-50 rounded-2xl"
        >
          <p className="text-xs text-zinc-500 mb-3">Preview</p>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color || PRESET_COLORS[10] }}
            />
            <span className="px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-700">
              {data.name}
            </span>
          </div>
        </motion.div>
      )}
    </WizardStepContent>
  );
}

// ============================================================================
// Step 2: Color Selection
// ============================================================================

function ColorStep() {
  const { data, updateData } = useWizard();

  return (
    <WizardStepContent>
      {/* Color Selection */}
      <AnimatedColorPalette
        value={data.color || PRESET_COLORS[10]}
        onChange={(color) => updateData({ color })}
        label="Cor da tag"
      />

      {/* Final Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl"
      >
        <p className="text-xs text-zinc-500 mb-4 text-center">Preview final</p>
        <div className="flex justify-center">
          <motion.div
            layout
            className="flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white shadow-sm"
            style={{ borderColor: data.color || PRESET_COLORS[10] }}
          >
            <motion.div 
              layout
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color || PRESET_COLORS[10] }}
              animate={{ backgroundColor: data.color || PRESET_COLORS[10] }}
            />
            <span className="font-medium text-zinc-900">
              {data.name || 'Nova Tag'}
            </span>
          </motion.div>
        </div>

        {/* Example in Transaction */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-zinc-200">
          <p className="text-xs text-zinc-400 mb-2">Exemplo em uma transação</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">Compras no mercado</p>
              <p className="text-xs text-zinc-500">Alimentação • Hoje</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-zinc-900">R$ 150,00</p>
              <div className="flex items-center gap-1 mt-1 justify-end">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: data.color || PRESET_COLORS[10] }}
                />
                <span className="text-xs text-zinc-500">{data.name || 'Nova Tag'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </WizardStepContent>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'name',
    title: 'Nome da tag',
    description: 'Como você quer chamar esta tag?',
    icon: <Tag className="w-4 h-4" />,
  },
  {
    id: 'color',
    title: 'Escolha uma cor',
    description: 'Para identificar rapidamente',
    icon: <Sparkles className="w-4 h-4" />,
  },
];

export function TagWizard({
  initialData,
  editingTagId,
  onSubmit,
  onCancel,
}: TagWizardProps) {
  const defaultData: TagWizardData = {
    name: initialData?.name || '',
    color: initialData?.color || PRESET_COLORS[10], // Slate color as default
  };

  const handleSubmit = async (data: Record<string, any>) => {
    const tagData = data as TagWizardData;
    
    if (!tagData.name?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    await onSubmit(tagData);
  };

  return (
    <FormWizard
      wizardId={editingTagId ? `tag-edit-${editingTagId}` : 'tag-create'}
      steps={WIZARD_STEPS}
      initialData={defaultData}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Criar Tag"
      autoSave={true}
      allowStepNavigation={true}
    >
      <NameStep />
      <ColorStep />
    </FormWizard>
  );
}

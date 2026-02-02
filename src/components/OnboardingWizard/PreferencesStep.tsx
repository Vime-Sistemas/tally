import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { 
  PanelTop,
  PanelLeft,
  Check,
  Sparkles,
  MonitorSmartphone
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type MenuPreference = 'header' | 'sidebar';

interface PreferencesStepProps {
  menuPreference: MenuPreference;
  onMenuPreferenceChange: (preference: MenuPreference) => void;
}

// ============================================================================
// Menu Style Card Component
// ============================================================================

interface MenuStyleCardProps {
  type: MenuPreference;
  title: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

function MenuStyleCard({ 
  title, 
  description, 
  icon, 
  preview, 
  isSelected, 
  onClick 
}: MenuStyleCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col p-5 rounded-2xl border-2 transition-all text-left w-full",
        isSelected
          ? "border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-400/20"
          : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-md"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Selection Check */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 text-white rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </motion.div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div 
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
            isSelected ? "bg-blue-400 text-white" : "bg-zinc-100 text-zinc-600"
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold mb-1 transition-colors",
            isSelected ? "text-blue-600" : "text-zinc-900"
          )}>
            {title}
          </h4>
          <p className="text-sm text-zinc-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
        {preview}
      </div>
    </motion.button>
  );
}

// ============================================================================
// Preview Components
// ============================================================================

function HeaderPreview() {
  return (
    <div className="aspect-video relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-white border-b border-zinc-200 flex items-center px-3 gap-2">
        <div className="w-4 h-4 rounded bg-blue-400" />
        <div className="flex gap-2">
          <div className="w-10 h-2 rounded bg-zinc-200" />
          <div className="w-10 h-2 rounded bg-zinc-200" />
          <div className="w-10 h-2 rounded bg-zinc-200" />
        </div>
      </div>
      {/* Content */}
      <div className="absolute top-10 left-3 right-3 bottom-2 flex gap-2">
        <div className="flex-1 rounded-lg bg-white border border-zinc-200" />
        <div className="w-1/3 rounded-lg bg-white border border-zinc-200" />
      </div>
    </div>
  );
}

function SidebarPreview() {
  return (
    <div className="aspect-video relative">
      {/* Sidebar */}
      <div className="absolute top-0 bottom-0 left-0 w-12 bg-zinc-900 flex flex-col items-center py-2 gap-2">
        <div className="w-6 h-6 rounded bg-blue-400" />
        <div className="w-4 h-4 rounded bg-zinc-700" />
        <div className="w-4 h-4 rounded bg-zinc-700" />
        <div className="w-4 h-4 rounded bg-zinc-700" />
      </div>
      {/* Content */}
      <div className="absolute top-2 left-14 right-2 bottom-2 flex gap-2">
        <div className="flex-1 rounded-lg bg-white border border-zinc-200" />
        <div className="w-1/3 rounded-lg bg-white border border-zinc-200" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Preferences Step Component
// ============================================================================

export function PreferencesStep({ menuPreference, onMenuPreferenceChange }: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-lg shadow-indigo-400/30 mb-2"
        >
          <MonitorSmartphone className="w-8 h-8" />
        </motion.div>
        <h3 className="text-lg font-semibold text-zinc-900">Estilo de Navegação</h3>
        <p className="text-sm text-zinc-500">
          Escolha como você prefere navegar pelo sistema
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-4">
        <MenuStyleCard
          type="header"
          title="Menu Superior"
          description="Navegação horizontal no topo da tela. Ideal para quem prefere mais espaço vertical."
          icon={<PanelTop className="w-6 h-6" />}
          preview={<HeaderPreview />}
          isSelected={menuPreference === 'header'}
          onClick={() => onMenuPreferenceChange('header')}
        />

        <MenuStyleCard
          type="sidebar"
          title="Menu Lateral"
          description="Navegação vertical na lateral esquerda. Perfeito para acesso rápido com ícones."
          icon={<PanelLeft className="w-6 h-6" />}
          preview={<SidebarPreview />}
          isSelected={menuPreference === 'sidebar'}
          onClick={() => onMenuPreferenceChange('sidebar')}
        />
      </div>

      {/* Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-sm text-indigo-600 bg-indigo-50 rounded-xl p-3"
      >
        <Sparkles className="w-4 h-4" />
        <span>
          {menuPreference === 'header' ? 'Menu superior selecionado' : 'Menu lateral selecionado'}
        </span>
      </motion.div>
    </div>
  );
}

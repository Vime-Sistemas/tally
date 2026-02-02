import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Check, Plus } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

// ============================================================================
// Preset Colors
// ============================================================================

export const PRESET_COLORS = [
  // Row 1 - Vibrant
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#10b981",
  // Row 2 - Cool
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  // Row 3 - Warm/Neutral
  "#d946ef", "#ec4899", "#f43f5e", "#78716c", "#64748b", "#475569",
];

// ============================================================================
// Animated Color Palette
// ============================================================================

interface AnimatedColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  allowCustom?: boolean;
  label?: string;
  className?: string;
}

export function AnimatedColorPalette({
  value,
  onChange,
  colors = PRESET_COLORS,
  allowCustom = true,
  label,
  className,
}: AnimatedColorPaletteProps) {
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const isCustomColor = !colors.includes(value);

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="text-sm font-medium text-zinc-700">{label}</Label>
      )}
      
      {/* Color Grid */}
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <motion.button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02, type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "relative w-8 h-8 rounded-full transition-shadow",
              value === color && "ring-2 ring-offset-2 ring-zinc-900"
            )}
            style={{ backgroundColor: color }}
          >
            <AnimatePresence>
              {value === color && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}

        {/* Custom Color Picker */}
        {allowCustom && (
          <Popover open={customColorOpen} onOpenChange={setCustomColorOpen}>
            <PopoverTrigger asChild>
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: colors.length * 0.02, type: "spring", stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative w-8 h-8 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center transition-all hover:border-zinc-400",
                  isCustomColor && "ring-2 ring-offset-2 ring-zinc-900 border-solid"
                )}
                style={{ backgroundColor: isCustomColor ? value : 'transparent' }}
              >
                {isCustomColor ? (
                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                ) : (
                  <Plus className="w-4 h-4 text-zinc-400" />
                )}
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="center">
              <div className="space-y-3">
                <Label className="text-xs text-zinc-500">Cor personalizada</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-zinc-200"
                  />
                  <Input
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    className="w-28 font-mono text-sm"
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={() => {
                    onChange(customColor);
                    setCustomColorOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Aplicar
                </motion.button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Selected Color Preview */}
      <motion.div 
        layout
        className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl"
      >
        <motion.div
          layout
          className="w-10 h-10 rounded-xl shadow-inner"
          style={{ backgroundColor: value }}
          animate={{ backgroundColor: value }}
          transition={{ duration: 0.2 }}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-900">Cor selecionada</p>
          <p className="text-xs text-zinc-500 font-mono">{value.toUpperCase()}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Compact Color Selector (for inline use)
// ============================================================================

interface CompactColorSelectorProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  size?: 'sm' | 'md';
}

export function CompactColorSelector({
  value,
  onChange,
  colors = PRESET_COLORS.slice(0, 12),
  size = 'md',
}: CompactColorSelectorProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <motion.button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "rounded-full transition-all",
            sizeClasses[size],
            value === color && "ring-2 ring-offset-1 ring-zinc-900"
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

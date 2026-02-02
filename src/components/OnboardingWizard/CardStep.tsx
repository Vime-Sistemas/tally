import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { CurrencyInput } from '../ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../lib/utils';
import { 
  CreditCard, 
  CalendarDays, 
  Hash,
  Gauge,
  Plus,
  Trash2,
  Check,
  Sparkles,
  SkipForward
} from 'lucide-react';
import type { AccountFormData } from './AccountStep';

// ============================================================================
// Types & Schema
// ============================================================================

const cardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  lastFourDigits: z.string().max(4, 'Máximo 4 dígitos').optional(),
  limit: z.number().positive('O limite deve ser positivo'),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  color: z.string().min(1, 'Cor é obrigatória'),
  accountId: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface CardStepProps {
  cards: CardFormData[];
  onCardsChange: (cards: CardFormData[]) => void;
  accounts: AccountFormData[];
  onSkip?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const colors = [
  { value: 'bg-slate-900', name: 'Preto', ring: 'ring-slate-900' },
  { value: 'bg-blue-500', name: 'Azul', ring: 'ring-blue-500' },
  { value: 'bg-purple-500', name: 'Roxo', ring: 'ring-purple-500' },
  { value: 'bg-green-500', name: 'Verde', ring: 'ring-green-500' },
  { value: 'bg-red-500', name: 'Vermelho', ring: 'ring-red-500' },
  { value: 'bg-orange-500', name: 'Laranja', ring: 'ring-orange-500' },
  { value: 'bg-pink-500', name: 'Rosa', ring: 'ring-pink-500' },
  { value: 'bg-indigo-500', name: 'Índigo', ring: 'ring-indigo-500' },
  { value: 'bg-gradient-to-br from-yellow-600 to-yellow-700', name: 'Gold', ring: 'ring-yellow-600' }
];

// ============================================================================
// Card Preview Component
// ============================================================================

interface CardPreviewProps {
  card: CardFormData;
  onClick?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
}

function CardPreview({ card, onClick, onDelete, isEditing }: CardPreviewProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, rotateY: -15, scale: 0.9 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      exit={{ opacity: 0, rotateY: 15, scale: 0.9 }}
      transition={{ type: 'spring', bounce: 0.3 }}
      className="group relative"
      onClick={onClick}
    >
      <div 
        className={cn(
          "relative w-full aspect-[1.586/1] rounded-2xl p-5 text-white shadow-xl cursor-pointer transition-transform hover:scale-[1.02]",
          card.color,
          isEditing && "ring-2 ring-blue-400 ring-offset-2"
        )}
      >
        {/* Chip */}
        <div className="absolute top-5 left-5 w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80" />
        
        {/* Card Number */}
        <div className="absolute bottom-14 left-5 text-lg font-mono tracking-wider opacity-90">
          •••• •••• •••• {card.lastFourDigits || '••••'}
        </div>
        
        {/* Card Name */}
        <div className="absolute bottom-5 left-5">
          <p className="text-xs uppercase tracking-wider opacity-70">Nome do Cartão</p>
          <p className="font-semibold truncate max-w-[150px]">{card.name || 'Seu Cartão'}</p>
        </div>
        
        {/* Limit */}
        <div className="absolute bottom-5 right-5 text-right">
          <p className="text-xs uppercase tracking-wider opacity-70">Limite</p>
          <p className="font-semibold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit || 0)}
          </p>
        </div>

        {/* Brand Logo Placeholder */}
        <div className="absolute top-5 right-5">
          <CreditCard className="w-8 h-8 opacity-50" />
        </div>
      </div>

      {/* Delete Button */}
      {onDelete && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </motion.div>
  );
}

// ============================================================================
// Card Form Component
// ============================================================================

interface CardFormProps {
  card: CardFormData;
  accounts: AccountFormData[];
  onSave: (data: CardFormData) => void;
  onCancel?: () => void;
}

function CardForm({ card, accounts, onSave, onCancel }: CardFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: card,
  });

  const selectedColor = watch('color');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-lg"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-5">
        {/* Limit Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-full text-xs text-zinc-500 font-medium">
            <Gauge className="w-3 h-3" />
            Limite Total
          </div>
          <Controller
            name="limit"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value || 0}
                onValueChange={field.onChange}
                placeholder="0,00"
                className="text-3xl font-bold text-center bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-zinc-200 text-zinc-900"
                symbolClassName="text-lg align-top mr-1 font-medium text-zinc-300"
                autoResize
              />
            )}
          />
          {errors.limit && <p className="text-xs text-red-500">{errors.limit.message}</p>}
        </div>

        {/* Name & Last 4 Digits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Nome do Cartão</Label>
            <Input
              placeholder="Ex: Nubank Gold"
              className="h-10 rounded-xl bg-zinc-50 border-zinc-100"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Final (Opcional)</Label>
            <div className="relative">
              <Input
                placeholder="1234"
                maxLength={4}
                className="h-10 pl-8 rounded-xl bg-zinc-50 border-zinc-100"
                {...register('lastFourDigits')}
              />
              <Hash className="w-4 h-4 text-zinc-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* Closing & Due Day */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Dia Fechamento</Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="05"
                className="h-10 pl-8 rounded-xl bg-zinc-50 border-zinc-100"
                {...register('closingDay', { valueAsNumber: true })}
              />
              <CalendarDays className="w-4 h-4 text-zinc-400 absolute left-2.5 top-3" />
            </div>
            {errors.closingDay && <p className="text-xs text-red-500">{errors.closingDay.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Dia Vencimento</Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="10"
                className="h-10 pl-8 rounded-xl bg-zinc-50 border-zinc-100"
                {...register('dueDay', { valueAsNumber: true })}
              />
              <CalendarDays className="w-4 h-4 text-zinc-400 absolute left-2.5 top-3" />
            </div>
            {errors.dueDay && <p className="text-xs text-red-500">{errors.dueDay.message}</p>}
          </div>
        </div>

        {/* Account for Payment */}
        {accounts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Conta para Pagamento (Opcional)</Label>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-100">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {accounts.filter(a => a.name.trim() !== '').map((account, idx) => (
                      <SelectItem key={idx} value={`temp-${idx}`} className="cursor-pointer">
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {/* Color Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Cor do Cartão</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <motion.button
                key={color.value}
                type="button"
                onClick={() => setValue('color', color.value)}
                className={cn(
                  "w-7 h-7 rounded-full transition-all relative flex items-center justify-center",
                  color.value,
                  selectedColor === color.value 
                    ? `ring-2 ring-offset-2 ${color.ring} scale-110` 
                    : "opacity-60 hover:opacity-100 hover:scale-105"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedColor === color.value && (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 h-10 bg-blue-400 hover:bg-blue-500 text-white rounded-xl"
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar Cartão
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

// ============================================================================
// Main Card Step Component
// ============================================================================

export function CardStep({ cards, onCardsChange, accounts, onSkip }: CardStepProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAddCard = () => {
    const newCard: CardFormData = {
      name: '',
      limit: 0,
      closingDay: 5,
      dueDay: 10,
      color: colors[cards.length % colors.length].value,
    };
    onCardsChange([...cards, newCard]);
    setEditingIndex(cards.length);
    setShowForm(true);
  };

  const handleSaveCard = (index: number, data: CardFormData) => {
    const updated = [...cards];
    updated[index] = data;
    onCardsChange(updated);
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleDeleteCard = (index: number) => {
    const updated = cards.filter((_, i) => i !== index);
    onCardsChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setShowForm(false);
    }
  };

  const handleEditCard = (index: number) => {
    setEditingIndex(index);
    setShowForm(true);
  };

  const validCards = cards.filter(c => c.name.trim() !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-400/30 mb-2"
        >
          <CreditCard className="w-8 h-8" />
        </motion.div>
        <h3 className="text-lg font-semibold text-zinc-900">Cartões de Crédito</h3>
        <p className="text-sm text-zinc-500">
          Adicione seus cartões para controlar faturas e limites
        </p>
      </div>

      {/* Cards Grid */}
      {validCards.length > 0 && !showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => (
              card.name.trim() !== '' && (
                <CardPreview
                  key={index}
                  card={card}
                  onClick={() => handleEditCard(index)}
                  onDelete={() => handleDeleteCard(index)}
                />
              )
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Card Form */}
      <AnimatePresence mode="wait">
        {showForm && editingIndex !== null && (
          <CardForm
            key={editingIndex}
            card={cards[editingIndex]}
            accounts={accounts}
            onSave={(data) => handleSaveCard(editingIndex, data)}
            onCancel={() => {
              if (cards[editingIndex].name.trim() === '') {
                handleDeleteCard(editingIndex);
              } else {
                setEditingIndex(null);
                setShowForm(false);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Add Card Button */}
      {!showForm && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleAddCard}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all flex items-center justify-center gap-2 text-zinc-500 hover:text-purple-500 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-medium">
            {validCards.length === 0 ? 'Adicionar um cartão' : 'Adicionar outro cartão'}
          </span>
        </motion.button>
      )}

      {/* Skip Button */}
      {validCards.length === 0 && !showForm && onSkip && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onSkip}
          className="w-full p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 text-zinc-500"
        >
          <SkipForward className="w-4 h-4" />
          <span className="text-sm font-medium">Pular esta etapa</span>
        </motion.button>
      )}

      {/* Status Indicator */}
      <AnimatePresence>
        {validCards.length > 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-sm text-purple-600 bg-purple-50 rounded-xl p-3"
          >
            <Sparkles className="w-4 h-4" />
            <span>{validCards.length} cartão{validCards.length > 1 ? 's' : ''} configurado{validCards.length > 1 ? 's' : ''}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { CardFormData };

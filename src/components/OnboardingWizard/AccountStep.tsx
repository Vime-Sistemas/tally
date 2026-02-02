import { useState, useEffect } from 'react';
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
  Building2, 
  PiggyBank, 
  Banknote, 
  TrendingUp, 
  Wallet,
  Plus,
  Trash2,
  Check,
  Sparkles
} from 'lucide-react';
import { AccountType } from '../../types/account';

// ============================================================================
// Types & Schema
// ============================================================================

const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.nativeEnum(AccountType),
  balance: z.number(),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountStepProps {
  accounts: AccountFormData[];
  onAccountsChange: (accounts: AccountFormData[]) => void;
  minAccounts?: number;
}

// ============================================================================
// Constants
// ============================================================================

const accountTypes = [
  { value: AccountType.CHECKING, label: 'Conta Corrente', icon: Building2, description: 'Conta principal do dia a dia' },
  { value: AccountType.SAVINGS, label: 'Poupança', icon: PiggyBank, description: 'Reserva de segurança' },
  { value: AccountType.WALLET, label: 'Dinheiro Físico', icon: Banknote, description: 'Dinheiro em carteira' },
  { value: AccountType.INVESTMENT, label: 'Investimentos', icon: TrendingUp, description: 'Corretora ou fundo' },
];

const colors = [
  { value: 'bg-zinc-900', ring: 'ring-zinc-900' },
  { value: 'bg-blue-500', ring: 'ring-blue-500' },
  { value: 'bg-purple-500', ring: 'ring-purple-500' },
  { value: 'bg-green-500', ring: 'ring-green-500' },
  { value: 'bg-red-500', ring: 'ring-red-500' },
  { value: 'bg-orange-500', ring: 'ring-orange-500' },
  { value: 'bg-pink-500', ring: 'ring-pink-500' },
  { value: 'bg-indigo-500', ring: 'ring-indigo-500' },
];

// ============================================================================
// Account Card Component
// ============================================================================

interface AccountCardProps {
  account: AccountFormData;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (data: AccountFormData) => void;
  canDelete: boolean;
}

function AccountCard({ 
  account, 
  isEditing, 
  onEdit, 
  onDelete, 
  onSave,
  canDelete 
}: AccountCardProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: account,
  });

  const selectedColor = watch('color');
  const selectedType = watch('type');
  const TypeIcon = accountTypes.find(t => t.value === selectedType)?.icon || Wallet;

  if (!isEditing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="group relative bg-white rounded-2xl border border-zinc-100 p-4 hover:border-zinc-200 hover:shadow-lg transition-all cursor-pointer"
        onClick={onEdit}
      >
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", account.color)}>
            <TypeIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-zinc-900 truncate">{account.name}</h4>
            <p className="text-sm text-zinc-500">
              {accountTypes.find(t => t.value === account.type)?.label}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-zinc-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
            </p>
          </div>
        </div>
        
        {canDelete && (
          <motion.button
            initial={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-blue-400 p-6 shadow-xl shadow-blue-400/10"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* Balance Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-full text-xs text-zinc-500 font-medium">
            <Wallet className="w-3 h-3" />
            Saldo Atual
          </div>
          <Controller
            name="balance"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value || 0}
                onValueChange={field.onChange}
                placeholder="0,00"
                className="text-4xl font-bold text-center bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-zinc-200 text-zinc-900"
                symbolClassName="text-xl align-top mr-1 font-medium text-zinc-300"
                autoResize
              />
            )}
          />
        </div>

        {/* Name & Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Nome da Conta</Label>
            <Input
              placeholder="Ex: Nubank Principal"
              className="h-11 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white transition-all"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 rounded-xl bg-zinc-50 border-zinc-100">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="rounded-lg py-2.5 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4 text-zinc-500" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-3">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Cor</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <motion.button
                key={color.value}
                type="button"
                onClick={() => setValue('color', color.value)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all relative flex items-center justify-center",
                  color.value,
                  selectedColor === color.value 
                    ? `ring-2 ring-offset-2 ${color.ring} scale-110` 
                    : "opacity-60 hover:opacity-100 hover:scale-105"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedColor === color.value && (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          className="w-full h-11 bg-blue-400 hover:bg-blue-500 text-white rounded-xl"
        >
          <Check className="w-4 h-4 mr-2" />
          Salvar Conta
        </Button>
      </form>
    </motion.div>
  );
}

// ============================================================================
// Main Account Step Component
// ============================================================================

export function AccountStep({ accounts, onAccountsChange, minAccounts = 1 }: AccountStepProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(
    accounts.length === 0 ? 0 : null
  );

  // Initialize with one empty account if none exist
  useEffect(() => {
    if (accounts.length === 0) {
      onAccountsChange([{
        name: '',
        type: AccountType.CHECKING,
        balance: 0,
        color: 'bg-blue-500',
      }]);
      setEditingIndex(0);
    }
  }, []);

  const handleAddAccount = () => {
    const newAccount: AccountFormData = {
      name: '',
      type: AccountType.CHECKING,
      balance: 0,
      color: colors[accounts.length % colors.length].value,
    };
    onAccountsChange([...accounts, newAccount]);
    setEditingIndex(accounts.length);
  };

  const handleSaveAccount = (index: number, data: AccountFormData) => {
    const updated = [...accounts];
    updated[index] = data;
    onAccountsChange(updated);
    setEditingIndex(null);
  };

  const handleDeleteAccount = (index: number) => {
    const updated = accounts.filter((_, i) => i !== index);
    onAccountsChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const validAccounts = accounts.filter(a => a.name.trim() !== '');
  const hasMinimumAccounts = validAccounts.length >= minAccounts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-400/30 mb-2"
        >
          <Building2 className="w-8 h-8" />
        </motion.div>
        <h3 className="text-lg font-semibold text-zinc-900">Suas Contas Bancárias</h3>
        <p className="text-sm text-zinc-500">
          Adicione pelo menos uma conta para começar a organizar suas finanças
        </p>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {accounts.map((account, index) => (
            <AccountCard
              key={index}
              account={account}
              index={index}
              isEditing={editingIndex === index}
              onEdit={() => setEditingIndex(index)}
              onDelete={() => handleDeleteAccount(index)}
              onSave={(data) => handleSaveAccount(index, data)}
              canDelete={accounts.length > minAccounts}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add Account Button */}
      {editingIndex === null && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleAddAccount}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 text-zinc-500 hover:text-blue-500 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-medium">Adicionar outra conta</span>
        </motion.button>
      )}

      {/* Status Indicator */}
      <AnimatePresence>
        {hasMinimumAccounts && editingIndex === null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3"
          >
            <Sparkles className="w-4 h-4" />
            <span>{validAccounts.length} conta{validAccounts.length > 1 ? 's' : ''} configurada{validAccounts.length > 1 ? 's' : ''}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { AccountFormData };

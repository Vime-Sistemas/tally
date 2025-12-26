import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Check, CreditCard, CalendarDays, Hash, Landmark, Gauge } from 'lucide-react';
import { createCard, getAccounts } from '../../services/api';
import { toast } from 'sonner';
import type { Account } from '../../types/account';
import { CurrencyInput } from '../ui/currency-input';

const cardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  accountId: z.string().optional(),
  lastFourDigits: z.string().max(4, 'Máximo 4 dígitos').optional(),
  limit: z.number().positive('O limite deve ser positivo'),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type CardFormData = z.infer<typeof cardSchema>;

// Cores aprimoradas com classes de anel (ring) para foco
const colors = [
  { value: 'bg-slate-900', name: 'Preto', ring: 'ring-slate-900' },
  { value: 'bg-blue-500', name: 'Azul', ring: 'ring-blue-500' },
  { value: 'bg-purple-500', name: 'Roxo', ring: 'ring-purple-500' },
  { value: 'bg-green-500', name: 'Verde', ring: 'ring-green-500' },
  { value: 'bg-red-500', name: 'Vermelho', ring: 'ring-red-500' },
  { value: 'bg-orange-500', name: 'Laranja', ring: 'ring-orange-500' },
  { value: 'bg-pink-500', name: 'Rosa', ring: 'ring-pink-500' },
  { value: 'bg-indigo-500', name: 'Índigo', ring: 'ring-indigo-500' },
  { value: 'bg-slate-500', name: 'Cinza', ring: 'ring-slate-500' },
  { value: 'bg-gradient-to-br from-yellow-600 to-yellow-700', name: 'Gold', ring: 'ring-yellow-600' }
];

export function CardForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
        toast.error('Erro ao carregar contas');
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      color: 'bg-slate-900',
      limit: 0,
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: CardFormData) => {
    try {
      setIsSubmitting(true);
      await createCard({ 
        ...data, 
        currentInvoice: 0,
      } as any);
      reset();
      toast.success('Cartão cadastrado com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao cadastrar cartão:', error);
      toast.error('Erro ao cadastrar cartão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border border-zinc-100 rounded-3xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* 1. Limite em destaque (Hero) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-zinc-50 px-4 py-1.5 rounded-full text-sm font-medium text-zinc-600 flex items-center gap-2 border border-zinc-100">
              <Gauge className="w-4 h-4" />
              Limite Total
            </div>
            
            <div className="w-full text-center">
              <Controller
                name="limit"
                control={control}
                render={({ field }) => (
                  <div className="relative inline-block">
                    <CurrencyInput
                      value={field.value || 0}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                      className="text-5xl font-bold text-center bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-zinc-200 text-zinc-900"
                      symbolClassName="text-2xl align-top mr-1 font-medium text-zinc-300"
                      autoResize
                    />
                  </div>
                )}
              />
              {errors.limit && (
                <p className="text-sm text-red-500 mt-1">{errors.limit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            
            {/* 2. Informações Principais (Nome e Final) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Nome do Cartão</Label>
                <div className="relative">
                  <Input
                    id="name"
                    placeholder="Ex: Nubank Gold"
                    className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                    {...register('name')}
                  />
                  <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
                </div>
                {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastFourDigits" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Últimos 4 Dígitos (Opcional)</Label>
                <div className="relative">
                  <Input
                    id="lastFourDigits"
                    placeholder="Ex: 1234"
                    maxLength={4}
                    className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                    {...register('lastFourDigits')}
                  />
                  <Hash className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
                </div>
                {errors.lastFourDigits && <p className="text-xs text-red-500 ml-1">{errors.lastFourDigits.message}</p>}
              </div>
            </div>

            {/* 3. Datas (Fechamento e Vencimento) */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="closingDay" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Dia Fechamento</Label>
                <div className="relative">
                  <Input
                    id="closingDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Dia 05"
                    className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                    {...register('closingDay', { valueAsNumber: true })}
                  />
                  <CalendarDays className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
                </div>
                {errors.closingDay && <p className="text-xs text-red-500 ml-1">{errors.closingDay.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDay" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Dia Vencimento</Label>
                <div className="relative">
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Dia 10"
                    className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                    {...register('dueDay', { valueAsNumber: true })}
                  />
                  <CalendarDays className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
                </div>
                {errors.dueDay && <p className="text-xs text-red-500 ml-1">{errors.dueDay.message}</p>}
              </div>
            </div>

            {/* 4. Conta para Débito Automático (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Conta para Pagamento (Opcional)</Label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Select value={field.value || ''} onValueChange={(value) => field.onChange(value || undefined)} disabled={loadingAccounts}>
                      <SelectTrigger id="accountId" className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all">
                        <SelectValue placeholder={loadingAccounts ? "Carregando..." : "Selecione a conta para débito"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id} className="cursor-pointer">
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Landmark className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                )}
              />
              {errors.accountId && <p className="text-xs text-red-500 ml-1">{errors.accountId.message}</p>}
            </div>

            {/* 5. Seletor de Cores */}
            <div className="space-y-3">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Cor do Cartão</Label>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue('color', color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-300 relative flex items-center justify-center shadow-sm hover:scale-110",
                      color.value,
                      selectedColor === color.value 
                        ? `ring-2 ring-offset-2 ${color.ring || 'ring-zinc-400'} scale-110` 
                        : "ring-0 ring-offset-0 opacity-70 hover:opacity-100"
                    )}
                    title={color.name}
                  >
                    {selectedColor === color.value && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
              {errors.color && <p className="text-xs text-red-500 ml-1">{errors.color.message}</p>}
            </div>

          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-400 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-zinc-200 mt-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Cadastrar Cartão'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
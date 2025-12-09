import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
import { Check } from 'lucide-react';
import { createCard, getAccounts } from '../../services/api';
import { toast } from 'sonner';
import type { Account } from '../../types/account';

const cardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  accountId: z.string().min(1, 'Conta vinculada é obrigatória'),
  limit: z.number().positive('O limite deve ser positivo'),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type CardFormData = z.infer<typeof cardSchema>;

const colors = [
  { name: 'Roxo', value: 'bg-purple-600' },
  { name: 'Azul', value: 'bg-blue-600' },
  { name: 'Verde', value: 'bg-green-600' },
  { name: 'Vermelho', value: 'bg-red-600' },
  { name: 'Laranja', value: 'bg-orange-600' },
  { name: 'Preto', value: 'bg-gray-900' },
  { name: 'Cinza', value: 'bg-gray-600' },
  { name: 'Rosa', value: 'bg-pink-600' },
  { name: 'Amarelo', value: 'bg-yellow-500' },
  { name: 'Indigo', value: 'bg-indigo-600' },
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
      color: 'bg-gray-900',
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: CardFormData) => {
    try {
      setIsSubmitting(true);
      await createCard(data);
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
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-center text-black">Novo Cartão de Crédito</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Limite em destaque */}
          <div className="flex flex-col items-center space-y-3">
            <Label htmlFor="limit" className="text-gray-500 font-medium">Limite do Cartão</Label>
            <div className="relative w-full max-w-[240px]">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                  R$
               </div>
               <Input
                id="limit"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="text-center text-3xl h-16 pl-10 font-semibold border-gray-200 focus:border-black focus:ring-black rounded-xl shadow-sm"
                {...register('limit', { valueAsNumber: true })}
              />
            </div>
             {errors.limit && (
                <p className="text-sm text-red-600 text-center">{errors.limit.message}</p>
              )}
          </div>

          <div className="space-y-4">
            {/* Nome do Cartão */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-600">Nome do Cartão</Label>
              <Input
                id="name"
                placeholder="Ex: Nubank Gold"
                className="h-10 border-gray-200 focus:border-black focus:ring-black"
                {...register('name')}
              />
               {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
            </div>

            {/* Conta Vinculada */}
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-gray-600">Conta Vinculada</Label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                    <SelectTrigger id="accountId" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder={loadingAccounts ? "Carregando contas..." : "Selecione a conta"} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.accountId && (
                <p className="text-sm text-red-600">{errors.accountId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Dia de Fechamento */}
              <div className="space-y-2">
                <Label htmlFor="closingDay" className="text-gray-600">Dia de Fechamento</Label>
                <Input
                  id="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 5"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('closingDay', { valueAsNumber: true })}
                />
                 {errors.closingDay && (
                    <p className="text-sm text-red-600">{errors.closingDay.message}</p>
                  )}
              </div>

              {/* Dia de Vencimento */}
              <div className="space-y-2">
                <Label htmlFor="dueDay" className="text-gray-600">Dia de Vencimento</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 10"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('dueDay', { valueAsNumber: true })}
                />
                 {errors.dueDay && (
                    <p className="text-sm text-red-600">{errors.dueDay.message}</p>
                  )}
              </div>
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label className="text-gray-600">Cor de Identificação</Label>
              <div className="flex flex-wrap gap-3 pt-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full cursor-pointer transition-all flex items-center justify-center",
                      color.value,
                      selectedColor === color.value ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-110"
                    )}
                    onClick={() => setValue('color', color.value)}
                    title={color.name}
                  >
                    {selectedColor === color.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
              {errors.color && (
                <p className="text-sm text-red-600">{errors.color.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting || loadingAccounts}
          >
            {isSubmitting ? 'Salvando...' : 'Cadastrar Cartão'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

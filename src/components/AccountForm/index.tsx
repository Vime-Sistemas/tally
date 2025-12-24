import { useState } from 'react';
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
import { AccountType } from '../../types/account';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';
import { createAccount } from '../../services/api';
import { toast } from 'sonner';
import { CurrencyInput } from '../ui/currency-input';

const accountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  type: z.nativeEnum(AccountType),
  balance: z.number(),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type AccountFormData = z.infer<typeof accountSchema>;

const accountTypes = [
  { value: AccountType.CHECKING, label: 'Conta Corrente' },
  { value: AccountType.SAVINGS, label: 'Poupança' },
  { value: AccountType.WALLET, label: 'Dinheiro' },
  { value: AccountType.INVESTMENT, label: 'Investimentos' },
];

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

export function AccountForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      balance: 0,
      color: 'bg-gray-900',
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: AccountFormData) => {
    try {
      setIsSubmitting(true);
      await createAccount(data);
      reset();
      toast.success('Conta cadastrada com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao cadastrar conta:', error);
      toast.error('Erro ao cadastrar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-center text-black">Nova Conta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Saldo Inicial */}
          <div className="flex flex-col items-center space-y-3 w-full">
            <Label htmlFor="balance" className="text-gray-500 font-medium">Saldo Inicial</Label>
            <div className="w-full flex justify-center">
              <Controller
                name="balance"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value || 0}
                    onValueChange={field.onChange}
                    placeholder="0,00"
                    className="text-3xl font-semibold"
                    symbolClassName="text-3xl font-semibold text-gray-400"
                    autoResize
                  />
                )}
              />
            </div>
             {errors.balance && (
                <p className="text-sm text-red-600 text-center">{errors.balance.message}</p>
              )}
          </div>

          <div className="space-y-4">
            {/* Nome da Conta */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-600">Nome da Conta</Label>
              <Input
                id="name"
                placeholder="Ex: Nubank, Itaú, Carteira"
                className="h-10 border-gray-200 focus:border-black focus:ring-black"
                {...register('name')}
              />
               {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
            </div>

            {/* Tipo de Conta */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-600">Tipo de Conta</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-400 hover:bg-blue-500 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Cadastrar Conta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

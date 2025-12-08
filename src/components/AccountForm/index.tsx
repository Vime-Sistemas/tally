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

const accountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  type: z.nativeEnum(AccountType),
  balance: z.number(),
});

type AccountFormData = z.infer<typeof accountSchema>;

const accountTypes = [
  { value: AccountType.CHECKING, label: 'Conta Corrente' },
  { value: AccountType.SAVINGS, label: 'Poupança' },
  { value: AccountType.WALLET, label: 'Carteira' },
  { value: AccountType.INVESTMENT, label: 'Investimentos' },
];

export function AccountForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      balance: 0,
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    try {
      setIsSubmitting(true);
      // TODO: Implement account service
      console.log('Account data:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      reset();
      alert('Conta cadastrada com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar conta:', error);
      alert('Erro ao cadastrar conta. Tente novamente.');
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
          <div className="flex flex-col items-center space-y-3">
            <Label htmlFor="balance" className="text-gray-500 font-medium">Saldo Inicial</Label>
            <div className="relative w-full max-w-[240px]">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                  R$
               </div>
               <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="text-center text-3xl h-16 pl-10 font-semibold border-gray-200 focus:border-black focus:ring-black rounded-xl shadow-sm"
                {...register('balance', { valueAsNumber: true })}
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
            className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Cadastrar Conta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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

const cardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  accountId: z.string().min(1, 'Conta vinculada é obrigatória'),
  limit: z.number().positive('O limite deve ser positivo'),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
});

type CardFormData = z.infer<typeof cardSchema>;

// Mock accounts for now
const accounts = [
  { id: '1', name: 'Nubank' },
  { id: '2', name: 'Itaú' },
  { id: '3', name: 'Bradesco' },
];

export function CardForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  });

  const onSubmit = async (data: CardFormData) => {
    try {
      setIsSubmitting(true);
      // TODO: Implement card service
      console.log('Card data:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      reset();
      alert('Cartão cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar cartão:', error);
      alert('Erro ao cadastrar cartão. Tente novamente.');
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="accountId" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione a conta" />
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
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Cadastrar Cartão'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

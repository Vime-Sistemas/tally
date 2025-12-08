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

const investmentSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  investmentType: z.string().min(1, 'Tipo de aplicação é obrigatório'),
  sourceAccount: z.string().min(1, 'Conta de origem é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

const investmentTypes = [
  { value: 'CDB', label: 'CDB' },
  { value: 'TREASURY', label: 'Tesouro Direto' },
  { value: 'STOCKS', label: 'Ações' },
  { value: 'FII', label: 'FIIs' },
  { value: 'CRYPTO', label: 'Criptomoedas' },
  { value: 'OTHER', label: 'Outros' },
];

const accounts = [
  { value: 'CHECKING', label: 'Conta Corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'WALLET', label: 'Carteira' },
];

export function InvestmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      setIsSubmitting(true);
      // TODO: Implement investment service
      console.log('Investment data:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      reset();
      alert('Aplicação registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar aplicação:', error);
      alert('Erro ao registrar aplicação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-center text-black">Nova Aplicação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Valor em destaque */}
          <div className="flex flex-col items-center space-y-3">
            <Label htmlFor="amount" className="text-gray-500 font-medium">Valor da Aplicação</Label>
            <div className="relative w-full max-w-[240px]">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                  R$
               </div>
               <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="text-center text-3xl h-16 pl-10 font-semibold border-gray-200 focus:border-black focus:ring-black rounded-xl shadow-sm"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
             {errors.amount && (
                <p className="text-sm text-red-600 text-center">{errors.amount.message}</p>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Aplicação */}
            <div className="space-y-2">
              <Label htmlFor="investmentType" className="text-gray-600">Tipo de Aplicação</Label>
              <Controller
                name="investmentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="investmentType" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {investmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.investmentType && (
                <p className="text-sm text-red-600">{errors.investmentType.message}</p>
              )}
            </div>

            {/* Conta de Origem */}
            <div className="space-y-2">
              <Label htmlFor="sourceAccount" className="text-gray-600">Conta de Origem</Label>
              <Controller
                name="sourceAccount"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sourceAccount" className="w-full h-10 border-gray-200 focus:ring-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.value} value={account.value}>
                          {account.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sourceAccount && (
                <p className="text-sm text-red-600">{errors.sourceAccount.message}</p>
              )}
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-600">Data</Label>
            <Input
              id="date"
              type="date"
              className="h-10 border-gray-200 focus:border-black focus:ring-black block w-full"
              {...register('date')}
            />
             {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-600">Descrição (Opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Aporte mensal CDB"
              className="h-10 border-gray-200 focus:border-black focus:ring-black"
              {...register('description')}
            />
             {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-medium rounded-lg mt-4 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Registrar Aplicação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
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
import { AccountType } from '../../types/account';
import { Wallet, Building2, PiggyBank, Banknote, TrendingUp } from 'lucide-react';
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
  { value: AccountType.CHECKING, label: 'Conta Corrente', icon: Building2 },
  { value: AccountType.SAVINGS, label: 'Poupança', icon: PiggyBank },
  { value: AccountType.WALLET, label: 'Dinheiro Físico', icon: Banknote },
  { value: AccountType.INVESTMENT, label: 'Conta de Investimento', icon: TrendingUp },
];
export function AccountForm({ onSuccess }: { onSuccess?: () => void }) {
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
      color: 'bg-zinc-900',
      type: AccountType.CHECKING,
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    try {
      setIsSubmitting(true);
      await createAccount(data);
      reset();
      toast.success('Conta criada com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao cadastrar conta:', error);
      toast.error('Erro ao cadastrar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border border-zinc-100 rounded-3xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* 1. Saldo Inicial (Hero) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-zinc-50 px-4 py-1.5 rounded-full text-sm font-medium text-zinc-600 flex items-center gap-2 border border-zinc-100">
              <Wallet className="w-4 h-4" />
              Saldo
            </div>
            
            <div className="w-full text-center">
              <Controller
                name="balance"
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
              {errors.balance && (
                <p className="text-sm text-red-500 mt-1">{errors.balance.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            
            {/* 2. Nome e Tipo (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Nome da Conta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Nubank Principal"
                  className="h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all text-base"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Tipo</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type" className="h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl p-1">
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="rounded-lg py-2.5 my-0.5 cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-zinc-100 rounded-md text-zinc-500">
                                <type.icon className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-zinc-700">{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-400 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-zinc-200 mt-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Conta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
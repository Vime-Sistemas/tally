import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerClose } from '../ui/drawer';
import { X, Receipt, Calendar, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { updateDebt, deleteDebt } from '../../services/api';
import type { Debt } from '../../services/api';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { CurrencyInput } from '../ui/currency-input';

const debtSchema = z.object({
  name: z.string().min(1, 'Nome da dívida é obrigatório'),
  totalAmount: z.number().min(0, 'Valor total deve ser positivo'),
  remainingAmount: z.number().min(0, 'Valor restante deve ser positivo'),
  interestRate: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  creditor: z.string().optional(),
  description: z.string().optional(),
});

type DebtFormData = z.infer<typeof debtSchema>;

interface EditDebtDialogProps {
  debt: Debt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditDebtDialog({ debt, open, onOpenChange, onSuccess }: EditDebtDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
  });

  useEffect(() => {
    if (debt) {
      setValue('name', debt.name);
      setValue('totalAmount', debt.totalAmount);
      setValue('remainingAmount', debt.remainingAmount);
      setValue('interestRate', debt.interestRate || 0);
      setValue('dueDate', debt.dueDate || '');
      setValue('creditor', debt.creditor || '');
      setValue('description', debt.description || '');
    }
  }, [debt, setValue]);

  const onSubmit = async (data: DebtFormData) => {
    if (!debt) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        interestRate: data.interestRate && data.interestRate > 0 ? data.interestRate : undefined,
        creditor: data.creditor || undefined,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
      };

      await updateDebt(debt.id, submitData);
      toast.success('Dívida atualizada com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao atualizar dívida');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!debt) return;

    if (!confirm('Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.')) return;

    try {
      await deleteDebt(debt.id);
      toast.success('Dívida excluída com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao excluir dívida');
      console.error(error);
    }
  };

  const content = (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-700">
              Nome da Dívida *
            </Label>
            <Input
              id="name"
              placeholder="Ex: Empréstimo Banco X"
              className="border-zinc-300 focus:border-black"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="creditor" className="text-zinc-700">
              Credor
            </Label>
            <Input
              id="creditor"
              placeholder="Ex: Banco do Brasil"
              className="border-zinc-300 focus:border-black"
              {...register('creditor')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalAmount" className="text-zinc-700">
              Valor Total *
            </Label>
            <Controller
              name="totalAmount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="R$ 0,00"
                  className="border-zinc-300 focus:border-black"
                />
              )}
            />
            {errors.totalAmount && (
              <p className="text-sm text-red-600">{errors.totalAmount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remainingAmount" className="text-zinc-700">
              Valor Restante *
            </Label>
            <Controller
              name="remainingAmount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="R$ 0,00"
                  className="border-zinc-300 focus:border-black"
                />
              )}
            />
            {errors.remainingAmount && (
              <p className="text-sm text-red-600">{errors.remainingAmount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interestRate" className="text-zinc-700 flex items-center gap-1">
              <Percent className="h-4 w-4" />
              Taxa de Juros (% ao ano)
            </Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              placeholder="0,00"
              className="border-zinc-300 focus:border-black"
              {...register('interestRate', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-zinc-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Data de Vencimento
            </Label>
            <Input
              id="dueDate"
              type="date"
              className="border-zinc-300 focus:border-black"
              {...register('dueDate')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-zinc-700">
            Descrição
          </Label>
          <Textarea
            id="description"
            placeholder="Detalhes sobre a dívida..."
            className="border-zinc-300 focus:border-black resize-none"
            rows={3}
            {...register('description')}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-400 text-white hover:bg-blue-500"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            className="px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Excluir
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b">
            <DrawerTitle className="flex items-center gap-2 text-zinc-900">
              <Receipt className="h-5 w-5" />
              Editar Dívida
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <div className="p-4 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900">
            <Receipt className="h-5 w-5" />
            Editar Dívida
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da sua dívida.
          </DialogDescription>
        </DialogHeader>
        <div className="px-1">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
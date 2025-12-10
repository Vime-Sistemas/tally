import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { updateCard, deleteCard } from '../../services/api';
import type { CreditCard } from '../../types/account';

const cardSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  limit: z.number().positive('Limite deve ser positivo'),
  closingDay: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
  dueDay: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
  color: z.string().min(1, 'Cor é obrigatória'),
  currentInvoice: z.number().optional(),
  limitUsed: z.number().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

const cardColors = [
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-purple-500', label: 'Roxo' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-orange-500', label: 'Laranja' },
  { value: 'bg-red-500', label: 'Vermelho' },
  { value: 'bg-slate-500', label: 'Cinza' },
  { value: 'bg-indigo-500', label: 'Índigo' },
];

interface EditCardDialogProps {
  open: boolean;
  card: CreditCard;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCardDialog({
  open,
  card,
  onOpenChange,
  onSuccess,
}: EditCardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: card.name,
      limit: card.limit,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      color: card.color,
      currentInvoice: card.currentInvoice,
      limitUsed: (card as any).limitUsed || 0,
    },
  });

  const onSubmit = async (data: CardFormData) => {
    try {
      setIsSubmitting(true);
      await updateCard(card.id, data);
      toast.success('Cartão atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      toast.error('Erro ao atualizar cartão');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCard(card.id);
      toast.success('Cartão deletado com sucesso!');
      onSuccess();
      onOpenChange(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Erro ao deletar cartão:', error);
      toast.error('Erro ao deletar cartão');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cartão</DialogTitle>
            <DialogDescription>
              Atualize as informações do seu cartão
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-600">Nome do Cartão</Label>
              <Input
                id="name"
                placeholder="Ex: Cartão Principal"
                className="h-10 border-gray-200 focus:border-black focus:ring-black"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="limit" className="text-gray-600">Limite</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('limit', { valueAsNumber: true })}
                />
                {errors.limit && (
                  <p className="text-sm text-red-600 mt-1">{errors.limit.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currentInvoice" className="text-gray-600">Fatura Atual</Label>
                <Input
                  id="currentInvoice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('currentInvoice', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="limitUsed" className="text-gray-600">Limite Utilizado</Label>
                <Input
                  id="limitUsed"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('limitUsed', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="closingDay" className="text-gray-600">Dia de Fechamento</Label>
                <Input
                  id="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('closingDay', { valueAsNumber: true })}
                />
                {errors.closingDay && (
                  <p className="text-sm text-red-600 mt-1">{errors.closingDay.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="dueDay" className="text-gray-600">Dia de Vencimento</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('dueDay', { valueAsNumber: true })}
                />
                {errors.dueDay && (
                  <p className="text-sm text-red-600 mt-1">{errors.dueDay.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="color" className="text-gray-600">Cor</Label>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="color" className="w-full h-10 border-gray-200 focus:ring-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cardColors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.value}`}></div>
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.color && (
                  <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-between pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                Deletar
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o cartão "{card.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

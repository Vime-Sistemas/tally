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
import { Drawer, DrawerContent, DrawerTitle, DrawerClose } from '../ui/drawer';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { updateAccount, deleteAccount } from '../../services/api';
import { AccountType } from '../../types/account';
import type { Account } from '../../types/account';
import { useMediaQuery } from '../../lib/useMediaQuery';

const accountSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum([AccountType.CHECKING, AccountType.SAVINGS, AccountType.WALLET, AccountType.INVESTMENT]),
  balance: z.number().optional(),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type AccountFormData = z.infer<typeof accountSchema>;

const accountColors = [
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-purple-500', label: 'Roxo' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-orange-500', label: 'Laranja' },
  { value: 'bg-red-500', label: 'Vermelho' },
  { value: 'bg-slate-500', label: 'Cinza' },
  { value: 'bg-indigo-500', label: 'Índigo' },
  { value: 'bg-yellow-500', label: 'Amarelo' },
  { value: 'bg-gray-900', label: 'Preto' },
];

interface EditAccountDialogProps {
  open: boolean;
  account: Account;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAccountDialog({
  open,
  account,
  onOpenChange,
  onSuccess,
}: EditAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account.name,
      type: account.type,
      balance: account.balance,
      color: account.color,
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    try {
      setIsSubmitting(true);
      await updateAccount(account.id, data);
      toast.success('Conta atualizada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount(account.id);
      toast.success('Conta deletada com sucesso!');
      onSuccess();
      onOpenChange(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast.error('Erro ao deletar conta');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="pb-24">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <DrawerTitle>Editar Conta</DrawerTitle>
              <DrawerClose asChild>
                <button className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </DrawerClose>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 py-4">
              <div>
                <Label htmlFor="name" className="text-gray-600">Nome da Conta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Conta Principal"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type" className="text-gray-600">Tipo de Conta</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type" className="w-full h-10 border-gray-200 focus:ring-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AccountType.CHECKING}>Conta Corrente</SelectItem>
                        <SelectItem value={AccountType.SAVINGS}>Poupança</SelectItem>
                        <SelectItem value={AccountType.WALLET}>Dinheiro</SelectItem>
                        <SelectItem value={AccountType.INVESTMENT}>Investimentos</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                )}
              </div>

              {account.type === AccountType.WALLET && (
                <div>
                  <Label htmlFor="balance" className="text-gray-600">Saldo Atual</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      className="pl-10 h-10 border-gray-200 focus:border-black focus:ring-black"
                      {...register('balance', { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Para dinheiro em espécie, você pode ajustar o saldo manualmente.
                  </p>
                </div>
              )}

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
                        {accountColors.map((color) => (
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
                    className='bg-blue-400'
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </form>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Conta</DialogTitle>
              <DialogDescription>
                Atualize as informações da sua conta
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-600">Nome da Conta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Conta Principal"
                  className="h-10 border-gray-200 focus:border-black focus:ring-black"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type" className="text-gray-600">Tipo de Conta</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type" className="w-full h-10 border-gray-200 focus:ring-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AccountType.CHECKING}>Conta Corrente</SelectItem>
                        <SelectItem value={AccountType.SAVINGS}>Poupança</SelectItem>
                        <SelectItem value={AccountType.WALLET}>Dinheiro</SelectItem>
                        <SelectItem value={AccountType.INVESTMENT}>Investimentos</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                )}
              </div>

              {account.type === AccountType.WALLET && (
                <div>
                  <Label htmlFor="balance" className="text-gray-600">Saldo Atual</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      className="pl-10 h-10 border-gray-200 focus:border-black focus:ring-black"
                      {...register('balance', { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Para dinheiro em espécie, você pode ajustar o saldo manualmente.
                  </p>
                </div>
              )}

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
                        {accountColors.map((color) => (
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
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a conta "{account.name}"? Esta ação não pode ser desfeita.
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

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { equityService } from "../../services/equities";
import type { Equity } from "../../types/equity";
import { EQUITY_TYPES } from "../../types/equity";

const editEquitySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  value: z.number().positive("Valor deve ser positivo"),
  cost: z.number().nonnegative("Custo não pode ser negativo"),
  acquisitionDate: z.string().min(1, "Data de aquisição é obrigatória"),
  description: z.string().optional(),
  color: z.string().optional(),
});

type EditEquityFormData = z.infer<typeof editEquitySchema>;

interface EditEquityDesktopDialogProps {
  open: boolean;
  equity: Equity;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEquityDesktopDialog({
  open,
  equity,
  onOpenChange,
  onSuccess,
}: EditEquityDesktopDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<EditEquityFormData>({
    resolver: zodResolver(editEquitySchema),
    defaultValues: {
      name: equity.name,
      type: equity.type,
      value: equity.value,
      cost: equity.cost,
      acquisitionDate: equity.acquisitionDate.split("T")[0],
      description: equity.description || "",
      color: equity.color || "bg-blue-400",
    },
  });

  const onSubmit = async (data: EditEquityFormData) => {
    try {
      setIsSubmitting(true);

      await equityService.update(equity.id, {
        name: data.name,
        type: data.type as any,
        value: data.value,
        cost: data.cost,
        acquisitionDate: data.acquisitionDate,
        description: data.description,
        color: data.color,
      });

      toast.success("Patrimônio atualizado com sucesso!");
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Erro ao atualizar patrimônio:", error);
      toast.error("Erro ao atualizar patrimônio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Patrimônio</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu bem ou ativo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Ex: Meu Carro" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor Atual</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                id="value"
                type="number"
                step="0.01"
                className="pl-10"
                {...register("value", { valueAsNumber: true })}
              />
            </div>
            {errors.value && (
              <p className="text-sm text-red-500">{errors.value.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Custo de Aquisição</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                id="cost"
                type="number"
                step="0.01"
                className="pl-10"
                {...register("cost", { valueAsNumber: true })}
              />
            </div>
            {errors.cost && (
              <p className="text-sm text-red-500">{errors.cost.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="acquisitionDate">Data de Aquisição</Label>
            <Input
              id="acquisitionDate"
              type="date"
              {...register("acquisitionDate")}
            />
            {errors.acquisitionDate && (
              <p className="text-sm text-red-500">
                {errors.acquisitionDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Carro branco com ar condicionado"
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

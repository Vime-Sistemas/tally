import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { CurrencyInput } from "../ui/currency-input";
import { MobilePicker, type PickerOption } from "../ui/mobile-picker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { equityService } from "../../services/equities";
import type { Equity } from "../../types/equity";
import { EQUITY_TYPES } from "../../types/equity";
import { Loader2 } from "lucide-react";

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

interface EditEquitySheetProps {
  open: boolean;
  equity: Equity;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEquitySheet({
  open,
  equity,
  onOpenChange,
  onSuccess,
}: EditEquitySheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
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

  const selectedType = watch("type");
  const typeLabel =
    EQUITY_TYPES.find((t) => t.value === selectedType)?.label || selectedType;

  const typeOptions: PickerOption[] = EQUITY_TYPES.map((type) => ({
    value: type.value,
    label: type.label,
  }));

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
    } catch (error) {
      console.error("Erro ao atualizar patrimônio:", error);
      toast.error("Erro ao atualizar patrimônio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-[2rem] p-0 mb-15 max-h-[90vh]"
        >
          <SheetHeader className="p-6 pb-2 text-left">
            <SheetTitle className="text-xl font-bold">
              Editar Patrimônio
            </SheetTitle>
          </SheetHeader>

          <div className="p-6 pt-2 space-y-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Meu Carro"
                  className="rounded-xl border-gray-200"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo</Label>
                <button
                  type="button"
                  onClick={() => setTypePickerOpen(true)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 active:bg-gray-100 transition-colors"
                >
                  <span
                    className={
                      selectedType
                        ? "text-gray-900 font-medium"
                        : "text-gray-400"
                    }
                  >
                    {typeLabel}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                </button>
                {errors.type && (
                  <p className="text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              {/* Value */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor Atual</Label>
                <Controller
                  name="value"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || 0}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                      className="rounded-xl border-gray-200"
                    />
                  )}
                />
                {errors.value && (
                  <p className="text-sm text-red-600">{errors.value.message}</p>
                )}
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Custo de Aquisição</Label>
                <Controller
                  name="cost"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || 0}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                      className="rounded-xl border-gray-200"
                    />
                  )}
                />
                {errors.cost && (
                  <p className="text-sm text-red-600">{errors.cost.message}</p>
                )}
              </div>

              {/* Acquisition Date */}
              <div className="space-y-2">
                <Label htmlFor="acquisitionDate" className="text-sm font-medium">
                  Data de Aquisição
                </Label>
                <Input
                  id="acquisitionDate"
                  type="date"
                  className="rounded-xl border-gray-200"
                  {...register("acquisitionDate")}
                />
                {errors.acquisitionDate && (
                  <p className="text-sm text-red-600">
                    {errors.acquisitionDate.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </Label>
                <Input
                  id="description"
                  placeholder="Ex: Carro branco com ar condicionado"
                  className="rounded-xl border-gray-200"
                  {...register("description")}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium rounded-xl bg-blue-400 text-white hover:bg-gray-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <MobilePicker
        open={typePickerOpen}
        onOpenChange={setTypePickerOpen}
        value={selectedType}
        onValueChange={(val) => setValue("type", val)}
        options={typeOptions}
        title="Selecione o Tipo"
      />
    </>
  );
}

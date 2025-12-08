import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EQUITY_TYPES } from "../../types/equity";
import { cn } from "../../lib/utils";
import { Check } from "lucide-react";

const equitySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.string().min(1, "Selecione um tipo"),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  acquisitionDate: z.string().min(1, "Data de aquisição é obrigatória"),
  description: z.string().optional(),
  color: z.string().min(1, "Selecione uma cor"),
});

type EquityFormValues = z.infer<typeof equitySchema>;

const colors = [
  { name: 'Zinc', value: 'bg-zinc-900' },
  { name: 'Red', value: 'bg-red-600' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Green', value: 'bg-emerald-600' },
  { name: 'Teal', value: 'bg-teal-600' },
  { name: 'Blue', value: 'bg-blue-600' },
  { name: 'Indigo', value: 'bg-indigo-600' },
  { name: 'Violet', value: 'bg-violet-600' },
  { name: 'Fuchsia', value: 'bg-fuchsia-600' },
  { name: 'Pink', value: 'bg-pink-600' },
  { name: 'Rose', value: 'bg-rose-600' },
];

export function EquityNew() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EquityFormValues>({
    resolver: zodResolver(equitySchema),
    defaultValues: {
      name: "",
      value: undefined,
      description: "",
      color: "bg-zinc-900",
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: EquityFormValues) => {
    console.log(data);
    // Here you would typically save the data
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert("Patrimônio cadastrado com sucesso!");
  };

  // Group types for the select
  const groupedTypes = EQUITY_TYPES.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof EQUITY_TYPES>);

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Novo Patrimônio</CardTitle>
          <CardDescription>
            Cadastre seus bens para acompanhar a evolução do seu patrimônio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Item</Label>
                <Input
                  id="name"
                  placeholder="Ex: Apartamento Centro, BMW X1..."
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Tipo (Combobox/Select) */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Patrimônio</Label>
                <Select onValueChange={(value) => setValue('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedTypes).map(([group, items]) => (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {items.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="value">Valor Estimado (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register('value', { valueAsNumber: true })}
                />
                {errors.value && (
                  <p className="text-sm text-red-500">{errors.value.message}</p>
                )}
              </div>

              {/* Data de Aquisição */}
              <div className="space-y-2">
                <Label htmlFor="acquisitionDate">Data de Aquisição</Label>
                <Input
                  id="acquisitionDate"
                  type="date"
                  {...register('acquisitionDate')}
                />
                {errors.acquisitionDate && (
                  <p className="text-sm text-red-500">{errors.acquisitionDate.message}</p>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input
                id="description"
                placeholder="Detalhes adicionais, localização, placa..."
                {...register('description')}
              />
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="flex flex-wrap gap-3 pt-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full cursor-pointer transition-all flex items-center justify-center",
                      color.value,
                      selectedColor === color.value ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-110"
                    )}
                    onClick={() => setValue('color', color.value)}
                    title={color.name}
                  >
                    {selectedColor === color.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
              {errors.color && (
                <p className="text-sm text-red-500">{errors.color.message}</p>
              )}
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Cadastrar Patrimônio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

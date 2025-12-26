import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { CurrencyInput } from "../../components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { EQUITY_TYPES } from "../../types/equity";
import { cn } from "../../lib/utils";
import { Check, ArrowLeft, Landmark, Calendar, Tag, Building2, Info } from "lucide-react";
import { equityService } from "../../services/equities";
import { createDebt } from "../../services/api";
import { toast } from "sonner";
import type { Page } from "../../types/navigation";

const equitySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.string().min(1, "Selecione um tipo"),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  cost: z.number().optional(),
  acquisitionDate: z.string().min(1, "Data de aquisição é obrigatória"),
  description: z.string().optional(),
  color: z.string().min(1, "Selecione uma cor"),
  isFinanced: z.boolean(),
  financedAmount: z.number().optional(),
  financingDueDate: z.string().optional(),
  paidAmount: z.number().optional(),
  creditor: z.string().optional(),
}).refine((data) => {
  if (data.isFinanced && (!data.financedAmount || data.financedAmount <= 0)) return false;
  return true;
}, {
  message: "Valor financiado é obrigatório",
  path: ["financedAmount"],
}).refine((data) => {
  if (data.isFinanced && !data.financingDueDate) return false;
  return true;
}, {
  message: "Data de vencimento é obrigatória",
  path: ["financingDueDate"],
}).refine((data) => {
  if (data.isFinanced && data.paidAmount && data.paidAmount > (data.financedAmount || 0)) return false;
  return true;
}, {
  message: "Valor pago não pode ser maior que o financiado",
  path: ["paidAmount"],
}).refine((data) => {
  if (data.isFinanced && !data.creditor) return false;
  return true;
}, {
  message: "Credor é obrigatório",
  path: ["creditor"],
});

type EquityFormValues = z.infer<typeof equitySchema>;

const colors = [
  { name: 'Zinc', value: 'bg-zinc-900', ring: 'ring-zinc-900' },
  { name: 'Red', value: 'bg-red-600', ring: 'ring-red-600' },
  { name: 'Orange', value: 'bg-orange-500', ring: 'ring-orange-500' },
  { name: 'Amber', value: 'bg-amber-500', ring: 'ring-amber-500' },
  { name: 'Green', value: 'bg-emerald-600', ring: 'ring-emerald-600' },
  { name: 'Teal', value: 'bg-teal-600', ring: 'ring-teal-600' },
  { name: 'Blue', value: 'bg-blue-600', ring: 'ring-blue-600' },
  { name: 'Indigo', value: 'bg-indigo-600', ring: 'ring-indigo-600' },
  { name: 'Violet', value: 'bg-violet-600', ring: 'ring-violet-600' },
  { name: 'Fuchsia', value: 'bg-fuchsia-600', ring: 'ring-fuchsia-600' },
  { name: 'Pink', value: 'bg-pink-600', ring: 'ring-pink-600' },
  { name: 'Rose', value: 'bg-rose-600', ring: 'ring-rose-600' },
];

interface EquityNewProps {
  onNavigate?: (page: Page) => void;
}

export function EquityNew({ onNavigate }: EquityNewProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EquityFormValues>({
    resolver: zodResolver(equitySchema),
    defaultValues: {
      name: "",
      value: undefined,
      description: "",
      color: "bg-zinc-900",
      isFinanced: false,
      acquisitionDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedColor = watch('color');
  const isFinanced = watch('isFinanced');

  const onSubmit = async (data: EquityFormValues) => {
    try {
      // Create equity first
      await equityService.create({
        ...data,
        cost: data.cost ?? data.value,
        type: data.type as any,
      });

      // Create debt if financed
      if (data.isFinanced && data.financedAmount && data.financingDueDate) {
        const paidAmount = data.paidAmount || 0;
        const remainingAmount = data.financedAmount - paidAmount;
        
        await createDebt({
          name: `Financiamento - ${data.name}`,
          totalAmount: data.financedAmount,
          remainingAmount: Math.max(0, remainingAmount),
          creditor: data.creditor || "Instituição Financeira",
          description: `Gerado automaticamente pelo cadastro de patrimônio: ${data.name}`,
          dueDate: data.financingDueDate,
        });
        toast.success("Patrimônio e financiamento cadastrados!");
      } else {
        toast.success("Patrimônio cadastrado com sucesso!");
      }

      if (onNavigate) {
        onNavigate('equity-list');
      }
    } catch (error) {
      console.error("Failed to create equity:", error);
      toast.error("Erro ao cadastrar patrimônio");
    }
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
    <div className="p-4 md:p-8 min-h-screen bg-white flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent hover:text-zinc-900 text-zinc-500 gap-2"
            onClick={() => onNavigate && onNavigate('equity-list')}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-zinc-900">Novo Patrimônio</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        <Card className="shadow-lg border-zinc-100 rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Valor Hero */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-zinc-50 px-4 py-1.5 rounded-full text-sm font-medium text-zinc-600 flex items-center gap-2 border border-zinc-100">
                  <Landmark className="w-4 h-4" />
                  Valor Estimado de Mercado
                </div>
                
                <div className="w-full text-center">
                  <Controller
                    name="value"
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
                  {errors.value && <p className="text-sm text-red-500 mt-1">{errors.value.message}</p>}
                </div>
              </div>

              {/* Grid de Informações */}
              <div className="grid gap-6 md:grid-cols-2">
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Nome do Item</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="Ex: Apartamento Centro"
                      className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white transition-all text-base"
                      {...register('name')}
                    />
                    <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
                  </div>
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Tipo</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white transition-all">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {Object.entries(groupedTypes).map(([group, items]) => (
                            <SelectGroup key={group}>
                              <SelectLabel className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-2">{group}</SelectLabel>
                              {items.map((item) => (
                                <SelectItem key={item.value} value={item.value} className="cursor-pointer">
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisitionDate" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Data de Aquisição</Label>
                  <div className="relative">
                    <Input
                      id="acquisitionDate"
                      type="date"
                      className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white transition-all"
                      {...register('acquisitionDate')}
                    />
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
                  </div>
                  {errors.acquisitionDate && <p className="text-xs text-red-500">{errors.acquisitionDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Custo Original (Opcional)</Label>
                  <div className="relative">
                    <Controller
                      name="cost"
                      control={control}
                      render={({ field }) => (
                        <CurrencyInput
                          value={field.value || 0}
                          onValueChange={field.onChange}
                          placeholder="0,00"
                          className="pl-9 h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white transition-all"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Financiamento */}
              <div className="bg-zinc-50/80 rounded-2xl border border-zinc-100 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-sm">
                      <Building2 className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <Label htmlFor="isFinanced" className="text-base font-semibold text-zinc-900 cursor-pointer">Financiamento</Label>
                      <p className="text-xs text-zinc-500">Este bem foi adquirido via financiamento?</p>
                    </div>
                  </div>
                  <Controller
                    name="isFinanced"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="isFinanced"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {isFinanced && (
                  <div className="space-y-5 animate-in slide-in-from-top-2 pt-2">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-700">
                      <Info className="w-5 h-5 shrink-0" />
                      <p>Uma dívida será criada automaticamente para você acompanhar as parcelas deste financiamento.</p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Valor Total Financiado</Label>
                        <Controller
                          name="financedAmount"
                          control={control}
                          render={({ field }) => (
                            <CurrencyInput
                              value={field.value || 0}
                              onValueChange={field.onChange}
                              placeholder="0,00"
                              className="h-11 rounded-xl border-zinc-200 bg-white"
                            />
                          )}
                        />
                        {errors.financedAmount && <p className="text-xs text-red-500">{errors.financedAmount.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Valor Já Pago</Label>
                        <Controller
                          name="paidAmount"
                          control={control}
                          render={({ field }) => (
                            <CurrencyInput
                              value={field.value || 0}
                              onValueChange={field.onChange}
                              placeholder="0,00"
                              className="h-11 rounded-xl border-zinc-200 bg-white"
                            />
                          )}
                        />
                        {errors.paidAmount && <p className="text-xs text-red-500">{errors.paidAmount.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Credor / Banco</Label>
                        <Input placeholder="Ex: Caixa Econômica" className="h-11 rounded-xl bg-white border-zinc-200" {...register('creditor')} />
                        {errors.creditor && <p className="text-xs text-red-500">{errors.creditor.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Data Final do Contrato</Label>
                        <Input type="date" className="h-11 rounded-xl bg-white border-zinc-200" {...register('financingDueDate')} />
                        {errors.financingDueDate && <p className="text-xs text-red-500">{errors.financingDueDate.message}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição e Cor */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Detalhes adicionais (opcional)"
                    className="h-12 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white transition-all"
                    {...register('description')}
                  />
                </div>

                <div className="space-y-3">
                  <div className='flex justify-center'>
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold ml-1">Cor de Identificação</Label>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setValue('color', color.value)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all duration-300 relative flex items-center justify-center shadow-sm hover:scale-110",
                          color.value,
                          selectedColor === color.value 
                            ? `ring-2 ring-offset-2 ${color.ring || 'ring-zinc-400'} scale-110` 
                            : "ring-0 ring-offset-0 opacity-70 hover:opacity-100"
                        )}
                        title={color.name}
                      >
                        {selectedColor === color.value && <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                  {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
                </div>
              </div>
              <div className='flex justify-center'>
                <Button 
                  type="submit" 
                  className="w-55 h-12 bg-blue-400 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando..." : "Cadastrar Patrimônio"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
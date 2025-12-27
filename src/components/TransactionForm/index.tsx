import { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '../ui/card'; // Removemos Header/Title pois já está na página pai
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Kbd } from '../ui/kbd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { createTransaction, confirmTransaction, getAccounts, getCards, createRecurringTransaction } from '../../services/api';
import { transactionService } from '../../services/transactions';
import { equityService } from '../../services/equities';
import { CategoryService, type Category } from '../../services/categoryService';
import { TagService, type Tag } from '../../services/tagService';
import { useUser } from '../../contexts/UserContext';
import { useIsMobile } from '../../hooks/use-mobile';
import { TransactionType, type TransactionCategory, type Transaction } from '../../types/transaction';
import { toast } from 'sonner';
import type { Account, CreditCard } from '../../types/account';
import type { Equity } from '../../types/equity';
import { InsufficientBalanceDialog } from '../InsufficientBalanceDialog';
import { CurrencyInput } from '../ui/currency-input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Check, ChevronsUpDown, Calendar, CreditCard as CardIcon, Tag as TagIcon, AlignLeft, RefreshCw, Layers, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import DescriptionAutocomplete, { addStoredDescription } from '../DescriptionAutocomplete';

const transactionSchema = z.object({
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  date: z.string().min(1, 'Data é obrigatória'),
  paymentMethod: z.string().min(1, 'Selecione uma conta ou cartão'),
  costCenterId: z.string().optional(),
  equityId: z.string().optional(),
  installments: z.number().min(2, 'Mínimo de 2 parcelas').optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional(),
  endDate: z.string().optional(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const incomeCategoriesLabels: Record<string, string> = {
  SALARY: 'Salário',
  BONUS: 'Bônus / PLR',
  COMMISSION: 'Comissão',

  FREELANCE: 'Freelance',
  SELF_EMPLOYED: 'Autônomo / PJ',

  INVESTMENT_INCOME: 'Rendimentos de Investimentos',
  DIVIDENDS: 'Dividendos',
  INTEREST: 'Juros',
  RENT: 'Aluguel',

  PENSION_INCOME: 'Previdência / Aposentadoria',

  BENEFITS: 'Benefícios',
  GIFTS: 'Presentes',
  REFUND: 'Reembolsos',

  OTHER_INCOME: 'Outros',
};

const expenseCategoriesLabels: Record<string, string> = {
  HOUSING: 'Moradia',
  UTILITIES: 'Contas Fixas (Água, Luz, Internet, Gás)',
  FOOD: 'Alimentação',
  TRANSPORT: 'Transporte',

  HEALTHCARE: 'Saúde',
  INSURANCE: 'Seguros',
  EDUCATION: 'Educação',

  SHOPPING: 'Compras',
  CLOTHING: 'Vestuário',

  ENTERTAINMENT: 'Lazer',
  SUBSCRIPTIONS: 'Assinaturas',

  TAXES: 'Impostos',
  FEES: 'Taxas e Tarifas',

  PETS: 'Pets',
  DONATIONS: 'Doações',

  TRAVEL: 'Viagens',

  OTHER_EXPENSE: 'Outros',
};

interface TransactionFormProps {
  onSuccess?: () => void;
  initialData?: Transaction;
  onNavigate?: (page: any) => void;
}

export function TransactionForm({ onSuccess, initialData }: TransactionFormProps) {
  const { costCenters } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    initialData?.type || TransactionType.EXPENSE
  );
  const [isInstallment, setIsInstallment] = useState(
    !!initialData?.installments && initialData.installments > 1
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(initialData?.isPaid ?? true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [useUserCategories, setUseUserCategories] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [isMac, setIsMac] = useState(false);
  const isMobile = useIsMobile();
  const [openCategory, setOpenCategory] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accData, cardData, eqData, catData, tagData] = await Promise.all([
          getAccounts(),
          getCards(),
          equityService.getAll(),
          CategoryService.getCategories(),
          TagService.getTags()
        ]);
        setAccounts(accData);
        setCards(cardData);
        setEquities(eqData);
        setUserCategories(catData);
        setUserTags(tagData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadData();
    
    // Detectar SO
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  const getSortedCategories = () => {
    if (useUserCategories) {
      // Usar categorias do usuário
      const filteredCategories = userCategories.filter(cat => cat.type === (selectedType === TransactionType.INCOME ? 'INCOME' : 'EXPENSE'));
      return filteredCategories
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .map(cat => ({ key: cat.id, label: cat.name, color: cat.color }));
    } else {
      // Usar categorias globais
      const labels = selectedType === TransactionType.INCOME ? incomeCategoriesLabels : expenseCategoriesLabels;
      return Object.entries(labels)
        .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB, 'pt-BR'))
        .map(([key, label]) => ({ key, label }));
    }
  };
  

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: (initialData?.type as any) || TransactionType.EXPENSE,
      category: initialData?.category || '',
      amount: initialData ? Math.abs(initialData.amount) : undefined,
      description: initialData?.description || '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: initialData 
        ? (initialData.cardId ? `card:${initialData.cardId}` : `account:${initialData.accountId}`)
        : '',
      costCenterId: initialData?.costCenterId || '',
      equityId: initialData?.equityId || undefined,
      installments: initialData?.installments || undefined,
      isPaid: initialData?.isPaid ?? true,
      paidDate: initialData?.paidDate ? new Date(initialData.paidDate).toISOString().split('T')[0] : undefined,
      tags: initialData?.tags?.map(tag => tag.id) || [],
    },
  });

  useEffect(() => {
    if (initialData?.tags) {
      const tagIds = initialData.tags.map(tag => tag.id);
      setSelectedTags(tagIds);
    }
  }, [initialData]);

  const selectedCategory = watch('category');

  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      const [methodType, methodId] = data.paymentMethod.split(':');
      
      if (isRecurring && data.frequency) {
        // Create recurring transaction
        const result = await createRecurringTransaction({
          type: data.type === TransactionType.INCOME ? 'INCOME' : 'EXPENSE',
          category: data.category,
          amount: data.amount,
          description: data.description,
          frequency: data.frequency,
          startDate: data.date,
          endDate: data.endDate || null,
          accountId: methodType === 'account' ? methodId : null,
          cardId: methodType === 'card' ? methodId : null,
          costCenterId: data.costCenterId || undefined,
        });

        reset();
        setIsRecurring(false);
        setSelectedTags([]);
        const count = result.transactionsGenerated || 1;
        toast.success(`${count} transação${count > 1 ? 's' : ''} recorrente${count > 1 ? 's' : ''} criada${count > 1 ? 's' : ''}!`);
      } else {
        // Create single transaction
        const payload = {
          type: data.type,
          category: data.category as TransactionCategory,
          amount: data.amount,
          description: data.description,
          date: data.date,
          costCenterId: data.costCenterId || undefined,
          equityId: data.equityId,
          accountId: methodType === 'account' ? methodId : undefined,
          cardId: methodType === 'card' ? methodId : undefined,
          installments: isInstallment ? data.installments : undefined,
          isPaid: isPaid,
          paidDate: isPaid ? (data.paidDate || data.date) : undefined,
          tags: data.tags || [],
        };

        if (initialData) {
          await transactionService.update({
            id: initialData.id,
            ...payload
          });
          addStoredDescription(payload.description || '');
          toast.success('Transação atualizada com sucesso!');
        } else {
          await createTransaction(payload);
          addStoredDescription(payload.description || '');
          reset();
          setSelectedTags([]);
          toast.success('Movimentação registrada com sucesso!');
        }
      }
      
      onSuccess?.();
    } catch (error: any) {
      // Check if it's an insufficient balance error
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
        const info = error.response.data;
        setBalanceInfo(info);
        
        // Reconstruct payload for retry
        const [methodType, methodId] = data.paymentMethod.split(':');
        const payload = {
            type: data.type,
            category: data.category as TransactionCategory,
            amount: data.amount,
            description: data.description,
            date: data.date,
            costCenterId: data.costCenterId || undefined,
            equityId: data.equityId,
            accountId: methodType === 'account' ? methodId : undefined,
            cardId: methodType === 'card' ? methodId : undefined,
            isPaid: isPaid,
            paidDate: isPaid ? (data.paidDate || data.date) : undefined,
            tags: data.tags || [],
        };
        setPendingPayload(payload);
        setShowBalanceDialog(true);
      } else {
        console.error('Erro ao registrar movimentação:', error);
        toast.error('Erro ao registrar movimentação');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNegativeBalance = async () => {
    if (!pendingPayload || !balanceInfo) return;

    try {
      setIsSubmitting(true);
      
      await confirmTransaction({
        ...pendingPayload,
        confirmNegativeBalance: true
      });
      addStoredDescription(pendingPayload.description || '');
      reset();
      setShowBalanceDialog(false);
      setPendingPayload(null);
      setBalanceInfo(null);
      toast.success('Movimentação registrada com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Erro ao registrar movimentação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (value: string) => {
    const type = value as TransactionType;
    setSelectedType(type);
  };

  return (
    <>
      <Card className="w-full shadow-lg border border-zinc-100 rounded-3xl overflow-hidden">  
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* 1. SEÇÃO DE VALOR E TIPO (Destaque) */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-4 bg-zinc-50 p-1.5 rounded-full">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <>
                      <button
                        type="button"
                        onClick={() => { field.onChange(TransactionType.EXPENSE); handleTypeChange(TransactionType.EXPENSE); }}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                          field.value === TransactionType.EXPENSE ? "bg-white text-red-500 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        Despesa
                      </button>
                      <button
                        type="button"
                        onClick={() => { field.onChange(TransactionType.INCOME); handleTypeChange(TransactionType.INCOME); }}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                          field.value === TransactionType.INCOME ? "bg-white text-blue-500 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        Receita
                      </button>
                    </>
                  )}
                />
              </div>

              <div className="w-full text-center">
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <div className="relative inline-block">
                       <CurrencyInput
                        value={field.value || 0}
                        onValueChange={field.onChange}
                        placeholder="0,00"
                        className={cn(
                          "text-5xl font-bold text-center bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-zinc-200",
                          selectedType === TransactionType.INCOME ? "text-blue-500" : "text-red-900"
                        )}
                        symbolClassName={cn("text-2xl align-top mr-1 font-medium", selectedType === TransactionType.INCOME ? "text-blue-300" : "text-zinc-300")}
                        autoResize
                      />
                    </div>
                  )}
                />
                {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            {/* 2. GRID PRINCIPAL (Dados Essenciais) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              
              {/* Data & Conta */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400 font-medium ml-1">Data</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        className="pl-9 h-11 bg-zinc-50 border-zinc-100 focus:bg-white transition-all"
                        {...register('date')}
                      />
                      <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                  
                  {/* Toggle Pago */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400 font-medium ml-1">Status</Label>
                    <div 
                        className={cn(
                          "h-11 flex items-center justify-between px-3 rounded-md border transition-all",
                          isPaid ? "bg-green-50 border-green-100" : "bg-zinc-50 border-zinc-100"
                        )}
                      >
                      <span className={cn("text-sm font-medium", isPaid ? "text-green-600" : "text-zinc-500")}>
                        {isPaid ? "Pago" : "Pendente"}
                      </span>
                      <Switch checked={isPaid} onCheckedChange={(v) => setIsPaid(!!v)} className="scale-75 data-[state=checked]:bg-green-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400 font-medium ml-1">Conta / Cartão</Label>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                          <SelectTrigger className="pl-9 h-11 bg-zinc-50 border-zinc-100 focus:bg-white">
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Contas</SelectLabel>
                              {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={`account:${acc.id}`}>{acc.name}</SelectItem>
                              ))}
                            </SelectGroup>
                            {cards.length > 0 && (
                              <SelectGroup>
                                <SelectLabel>Cartões</SelectLabel>
                                {cards.map((c) => (
                                  <SelectItem key={c.id} value={`card:${c.id}`}>{c.name}</SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                        <CardIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      </div>
                    )}
                  />
                  {errors.paymentMethod && <p className="text-xs text-red-500 ml-1">{errors.paymentMethod.message}</p>}
                </div>
              </div>

              {/* Categoria & Descrição */}
              <div className="space-y-4">
                 <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-400 font-medium ml-1">Categoria</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Padrão</span>
                      <Switch
                        checked={useUserCategories}
                        onCheckedChange={setUseUserCategories}
                        className="scale-75"
                      />
                      <span className="text-xs text-zinc-500">Minhas</span>
                    </div>
                  </div>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Popover open={openCategory} onOpenChange={setOpenCategory}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full pl-9 h-11 justify-between bg-zinc-50 border-zinc-100 hover:bg-white hover:border-zinc-300 focus:bg-white text-zinc-900 font-normal",
                              !field.value && "text-zinc-400"
                            )}
                          >
                            <TagIcon className="w-4 h-4 text-zinc-400 absolute left-3" />
                            {field.value
                              ? getSortedCategories().find((cat) => cat.key === field.value)?.label
                              : 'Selecione a categoria'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            {field.value && useUserCategories && (
                              <div
                                className="ml-2 w-3 h-3 rounded-full border border-white"
                                style={{
                                  backgroundColor: (getSortedCategories().find((cat) => cat.key === field.value) as any)?.color || '#60a5fa'
                                }}
                              />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command filter={(value, search) => {
                             const cat = getSortedCategories().find(c => c.key === value);
                             if(!cat) return 0;
                             const s = search.toLowerCase();
                             return (cat.label.toLowerCase().includes(s) || cat.key.toLowerCase().includes(s)) ? 1 : 0;
                          }}>
                            <CommandInput placeholder="Buscar..." />
                            <CommandList>
                              <CommandEmpty>Nada encontrado.</CommandEmpty>
                              <CommandGroup>
                                {getSortedCategories().map((cat) => (
                                  <CommandItem
                                    key={cat.key}
                                    value={cat.key}
                                    onSelect={(val) => {
                                      field.onChange(val === field.value ? '' : val);
                                      setOpenCategory(false);
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', field.value === cat.key ? 'opacity-100' : 'opacity-0')} />
                                    {useUserCategories && (cat as any).color && (
                                      <div
                                        className="mr-2 w-3 h-3 rounded-full border border-gray-300"
                                        style={{ backgroundColor: (cat as any).color }}
                                      />
                                    )}
                                    {cat.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.category && <p className="text-xs text-red-500 ml-1">{errors.category.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400 font-medium ml-1">Descrição</Label>
                  <div className="relative">
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <DescriptionAutocomplete
                          inputProps={{
                            name: field.name,
                            onChange: (e: any) => field.onChange(e.target.value),
                            onBlur: field.onBlur,
                            ref: field.ref,
                            value: field.value,
                          }}
                          placeholder="Ex: Almoço de domingo"
                          className="pl-9 h-11"
                        />
                      )}
                    />
                    <AlignLeft className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                  {errors.description && <p className="text-xs text-red-500 ml-1">{errors.description.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400 font-medium ml-1">Tags (Opcional)</Label>
                  <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-1 p-2 min-h-[44px] bg-zinc-50 border border-zinc-100 rounded-md focus-within:bg-white focus-within:border-zinc-300">
                        {selectedTags.map((tagId) => {
                          const tag = userTags.find(t => t.id === tagId);
                          return tag ? (
                            <Badge
                              key={tagId}
                              variant="secondary"
                              className="flex items-center gap-1"
                              style={{ backgroundColor: tag.color + '20', color: tag.color }}
                            >
                              {tag.name}
                              <button
                                type="button"
                                onClick={() => {
                                  const newTags = selectedTags.filter(id => id !== tagId);
                                  setSelectedTags(newTags);
                                  field.onChange(newTags);
                                }}
                                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-zinc-400 hover:text-zinc-600"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar tags..." />
                              <CommandList>
                                <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                                <CommandGroup>
                                  {userTags
                                    .filter(tag => !selectedTags.includes(tag.id))
                                    .map((tag) => (
                                      <CommandItem
                                        key={tag.id}
                                        onSelect={() => {
                                          const newTags = [...selectedTags, tag.id];
                                          setSelectedTags(newTags);
                                          field.onChange(newTags);
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-3 h-3 rounded-full border border-gray-300"
                                            style={{ backgroundColor: tag.color }}
                                          />
                                          {tag.name}
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Campos Condicionais (Investimento / Centro de Custo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {selectedType === TransactionType.EXPENSE && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400 font-medium ml-1">Centro de Custo (Opcional)</Label>
                    <Controller
                      name="costCenterId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 text-xs bg-white border-zinc-100">
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                          <SelectContent>
                            {costCenters.map((center) => (
                              <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
               )}
                {selectedType === TransactionType.EXPENSE && selectedCategory === 'INVESTMENT' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <Label className="text-xs text-zinc-400 font-medium ml-1">Vincular a Ativo</Label>
                    <Controller
                      name="equityId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 text-xs bg-white border-zinc-100">
                            <SelectValue placeholder="Investimento Geral" />
                          </SelectTrigger>
                          <SelectContent>
                            {equities.filter(e => ['stocks', 'crypto', 'business', 'other'].includes(e.type)).map((eq) => (
                              <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}
            </div>

            {/* 3. OPÇÕES AVANÇADAS (Compactas) */}
            <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100 space-y-4">
               <div className="flex gap-4 overflow-x-auto pb-1">
                 {/* Botão Recorrência */}
                 <button
                   type="button"
                   onClick={() => { setIsRecurring(!isRecurring); setIsInstallment(false); }}
                   className={cn(
                     "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all whitespace-nowrap",
                     isRecurring ? "bg-white border-blue-200 text-blue-600 shadow-sm" : "border-transparent text-zinc-500 hover:bg-zinc-100"
                   )}
                 >
                   <RefreshCw className="w-4 h-4" />
                   {isRecurring ? "Recorrente: Sim" : "Tornar Recorrente"}
                 </button>

                 {/* Botão Parcelamento */}
                 {selectedType === TransactionType.EXPENSE && (
                   <button
                    type="button"
                    onClick={() => { setIsInstallment(!isInstallment); setIsRecurring(false); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all whitespace-nowrap",
                      isInstallment ? "bg-white border-blue-200 text-blue-600 shadow-sm" : "border-transparent text-zinc-500 hover:bg-zinc-100"
                    )}
                   >
                     <Layers className="w-4 h-4" />
                     {isInstallment ? "Parcelado: Sim" : "Parcelar Compra"}
                   </button>
                 )}
               </div>

               {/* Inputs Condicionais das Opções */}
               {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                       <Label className="text-xs">Frequência</Label>
                       <Controller
                        name="frequency"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DAILY">Diário</SelectItem>
                              <SelectItem value="WEEKLY">Semanal</SelectItem>
                              <SelectItem value="MONTHLY">Mensal</SelectItem>
                              <SelectItem value="ANNUAL">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-xs">Data Final (Opcional)</Label>
                       <Input type="date" className="h-9 bg-white" {...register('endDate')} />
                    </div>
                  </div>
               )}

               {isInstallment && !isRecurring && (
                 <div className="max-w-[150px] animate-in slide-in-from-top-2 space-y-1">
                    <Label className="text-xs">Número de Parcelas</Label>
                    <Input type="number" min="2" className="h-9 bg-white" {...register('installments', { valueAsNumber: true })} />
                 </div>
               )}
            </div>

            {/* Botão Salvar */}
            <div className='flex justify-center'>
              <Button
              type="submit"
              className={cn(
                "w-75 h-12 text-base font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]",
                selectedType === TransactionType.INCOME 
                  ? "bg-blue-400 hover:bg-blue-500 text-white shadow-blue-100" 
                  : "bg-red-900 hover:bg-red-800 text-white shadow-zinc-200"
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Movimentação' : 'Registrar Movimentação')}
              {!isSubmitting && !isMobile && (
                <Kbd className="ml-2 bg-white/20 text-white border-white/20 text-xs">
                  {isMac ? '⌘' : 'Ctrl'}+Enter
                </Kbd>
              )}
            </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {balanceInfo && (
        <InsufficientBalanceDialog
          open={showBalanceDialog}
          currentBalance={balanceInfo.currentBalance}
          requiredAmount={balanceInfo.requiredAmount}
          finalBalance={balanceInfo.finalBalance}
          onConfirm={handleConfirmNegativeBalance}
          onCancel={() => { setShowBalanceDialog(false); setBalanceInfo(null); setPendingPayload(null); }}
          isLoading={isSubmitting}
        />
      )}
    </>
  );
}
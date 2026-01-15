import { useState, useEffect, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Plus, X, Search, Tag as TagIcon, List } from "lucide-react";
import { toast } from "sonner";
import { TagService, type Tag } from "../../services/tagService";
import { cn } from "../../lib/utils";
import { getTransactions } from "../../services/api";
import type { Transaction } from "../../types/transaction";
import { TransactionType } from "../../types/transaction";
import { startOfMonth, endOfMonth } from "date-fns";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import type { Page } from "../../types/navigation";
import { formatCurrency } from "../../utils/formatters";

const PRESET_COLORS = [
  "#64748b", "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e"
];

interface TagsProps {
  onNavigate?: (page: Page) => void;
}

export function Tags({ onNavigate }: TagsProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#64748b',
  });

  useEffect(() => {
    loadTags();
    loadTransactionsForChart();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await TagService.getTags();
      setTags(data);
    } catch (error) {
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionsForChart = async () => {
    try {
      setChartLoading(true);
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      toast.error('Erro ao carregar transações para o gráfico de tags');
    } finally {
      setChartLoading(false);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Nome é obrigatório');

    try {
      if (editingTag) {
        await TagService.updateTag(editingTag.id, formData);
        toast.success('Tag atualizada');
      } else {
        await TagService.createTag(formData);
        toast.success('Tag criada');
      }
      setIsDialogOpen(false);
      resetForm();
      loadTags();
    } catch (error) {
      toast.error('Erro ao salvar tag');
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    try {
      await TagService.deleteTag(tagToDelete);
      toast.success('Tag removida');
      loadTags();
    } catch (error) {
      toast.error('Erro ao remover tag');
    } finally {
      setTagToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingTag(null);
    setFormData({ name: '', color: '#64748b' });
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || '#64748b',
    });
    setIsDialogOpen(true);
  };

  const handleNavigateToHistory = (tag: Tag) => {
    sessionStorage.setItem('transactionHistoryPreset', JSON.stringify({
      tag: tag.id,
      type: TransactionType.EXPENSE,
    }));
    onNavigate?.('transactions-history');
  };

  const tagChartData = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const totals = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.type !== TransactionType.EXPENSE) return;
      const txDate = new Date(tx.date);
      if (txDate < start || txDate > end) return;
      if (!tx.tags || tx.tags.length === 0) return;

      tx.tags.forEach((tag) => {
        totals.set(tag.id, (totals.get(tag.id) || 0) + Math.abs(tx.amount));
      });
    });

    return tags
      .filter(tag => (totals.get(tag.id) ?? 0) > 0)
      .map((tag, index) => ({
        tagId: tag.id,
        name: tag.name,
        value: totals.get(tag.id) || 0,
        color: tag.color || PRESET_COLORS[index % PRESET_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, tags]);

  const tagExpensesTotal = useMemo(() => tagChartData.reduce((sum, item) => sum + item.value, 0), [tagChartData]);

  const renderChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div className="rounded-xl border border-zinc-100 bg-white px-3 py-2 shadow-sm text-xs text-zinc-700">
        <div className="font-semibold text-zinc-900">{item.name}</div>
        <div className="text-zinc-600">{formatCurrency(item.value)}</div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tags</h1>
          <p className="text-sm text-zinc-500">Marcadores para organização flexível</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
        <Input 
          placeholder="Filtrar tags..." 
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">Despesas por tag</p>
            <p className="text-lg font-semibold text-zinc-900">Mês atual</p>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-500" onClick={loadTransactionsForChart}>
            Atualizar
          </Button>
        </div>

        <div className="grid gap-6 mt-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="h-56">
            {chartLoading ? (
              <div className="h-full w-full animate-pulse rounded-2xl bg-zinc-100" />
            ) : tagChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                Sem despesas categorizadas com tags neste mês.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tagChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    stroke="transparent"
                    onClick={(item) => {
                      const tag = tags.find(t => t.id === (item as any).tagId);
                      if (tag) handleNavigateToHistory(tag);
                    }}
                  >
                    {tagChartData.map((entry) => (
                      <Cell key={entry.tagId} fill={entry.color} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={renderChartTooltip} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {tagChartData.map((item) => {
              const percent = tagExpensesTotal ? (item.value / tagExpensesTotal) * 100 : 0;
              return (
                <button
                  key={item.tagId}
                  onClick={() => {
                    const tag = tags.find(t => t.id === item.tagId);
                    if (tag) handleNavigateToHistory(tag);
                  }}
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-zinc-900 truncate">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="text-xs text-zinc-500">{percent.toFixed(1)}% das despesas</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-zinc-50/50 min-h-[200px] rounded-xl border border-zinc-200 border-dashed p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-zinc-400">
            Carregando...
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
            <TagIcon className="h-8 w-8 mb-2 opacity-20" />
            <p>Nenhuma tag encontrada</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredTags.map((tag) => (
              <div 
                key={tag.id}
                className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer select-none"
                onClick={() => openEdit(tag)}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: tag.color }} 
                />
                <span className="text-sm font-medium text-zinc-700">{tag.name}</span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToHistory(tag);
                  }}
                  className="ml-1 text-zinc-300 hover:text-blue-500 hover:bg-blue-50 rounded-full p-0.5 transition-colors"
                  title="Ver no histórico"
                >
                  <List className="h-3 w-3" />
                </button>

                {/* Delete Button (appears on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTagToDelete(tag.id);
                  }}
                  className="ml-1 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Viagem 2024"
              />
            </div>

            <div className="space-y-3">
              <Label>Cor da Tag</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      formData.color === color ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-8 p-1 cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a tag de todas as transações associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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
import { Badge } from "../../components/ui/badge";
import { Plus, Edit2, Trash2, Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { CategoryService, type Category } from "../../services/categoryService";

// Modern color palette presets
const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef",
  "#f43f5e", "#64748b"
];

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    color: '#3b82f6',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    let result = categories;
    
    if (search) {
      result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (typeFilter !== "ALL") {
      result = result.filter(c => c.type === typeFilter);
    }

    setFilteredCategories(result);
  }, [categories, search, typeFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Nome é obrigatório');

    try {
      if (editingCategory) {
        await CategoryService.updateCategory(editingCategory.id, formData);
        toast.success('Categoria atualizada');
      } else {
        await CategoryService.createCategory(formData);
        toast.success('Categoria criada');
      }
      setIsDialogOpen(false);
      resetForm();
      loadCategories();
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await CategoryService.deleteCategory(categoryToDelete);
      toast.success('Categoria removida');
      loadCategories();
    } catch (error) {
      toast.error('Erro ao remover categoria');
    } finally {
      setCategoryToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', type: 'EXPENSE', color: '#3b82f6' });
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || '#3b82f6',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Categorias</h1>
          <p className="text-sm text-zinc-500">Organize suas transações por tipo</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Buscar categorias..." 
            className="pl-9 bg-zinc-50/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant={typeFilter === "ALL" ? "secondary" : "ghost"} 
            onClick={() => setTypeFilter("ALL")}
            size="sm"
          >
            Todas
          </Button>
          <Button 
            variant={typeFilter === "INCOME" ? "secondary" : "ghost"} 
            onClick={() => setTypeFilter("INCOME")}
            size="sm"
            className="text-emerald-600"
          >
            Receitas
          </Button>
          <Button 
            variant={typeFilter === "EXPENSE" ? "secondary" : "ghost"} 
            onClick={() => setTypeFilter("EXPENSE")}
            size="sm"
            className="text-rose-600"
          >
            Despesas
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[150px]">Tipo</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id} className="group">
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded-full border border-zinc-100 shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    {category.type === 'INCOME' ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                        <ArrowUpCircle className="h-3 w-3" /> Receita
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
                        <ArrowDownCircle className="h-3 w-3" /> Despesa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                        <Edit2 className="h-4 w-4 text-zinc-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setCategoryToDelete(category.id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Alimentação"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded-full transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="w-6 h-6 rounded-full bg-conic-gradient border border-zinc-200 flex items-center justify-center text-[10px] bg-white">
                    +
                  </div>
                </div>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Transações ligadas a esta categoria podem ficar sem categoria.
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
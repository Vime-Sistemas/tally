import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TransactionType } from "../../types/transaction";
import { ArrowDownCircle, ArrowUpCircle, Search, Filter, ArrowUpDown, Calendar, Receipt, Tag, Wallet, Edit, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { getTransactions, getAccounts, updateTransaction, deleteTransaction } from "../../services/api";
import { toast } from "sonner";
import type { Transaction } from "../../types/transaction";
import type { Account } from "../../types/account";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<string>("DATE_DESC");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState("");
  const [editingAmount, setEditingAmount] = useState(0);
  const [editingCategory, setEditingCategory] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionsData, accountsData] = await Promise.all([
          getTransactions(),
          getAccounts(),
        ]);
        setTransactions(transactionsData);
        setAccounts(accountsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar transações');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getAccountName = (accountId: string): string => {
    return accounts.find(a => a.id === accountId)?.name || accountId;
  };

  const formatDateToDDMMYYYY = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditingDescription(transaction.description);
    setEditingAmount(transaction.amount);
    setEditingCategory(transaction.category);
    setEditingDate(transaction.date.split('T')[0]);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedTransaction) return;
    
    setIsSubmitting(true);
    try {
      await updateTransaction(selectedTransaction.id, {
        description: editingDescription,
        amount: editingAmount,
        category: editingCategory as any,
        date: editingDate,
      });
      
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id 
          ? { ...t, description: editingDescription, amount: editingAmount, category: editingCategory as any, date: editingDate }
          : t
      ));
      
      setIsEditDialogOpen(false);
      toast.success('Transação atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransaction) return;
    
    setIsSubmitting(true);
    try {
      await deleteTransaction(selectedTransaction.id);
      setTransactions(transactions.filter(t => t.id !== selectedTransaction.id));
      setIsDeleteDialogOpen(false);
      toast.success('Transação deletada com sucesso');
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      toast.error('Erro ao deletar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortOrder === "DATE_DESC") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === "DATE_ASC") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOrder === "AMOUNT_DESC") return b.amount - a.amount;
      if (sortOrder === "AMOUNT_ASC") return a.amount - b.amount;
      return 0;
    });

  if (loading) {
    return (
      <Card className="w-full shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-black">Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border-gray-100">
      <CardHeader className="pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-black">Histórico de Transações</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredTransactions.length} registros encontrados
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value={TransactionType.INCOME}>Receitas</SelectItem>
                <SelectItem value={TransactionType.EXPENSE}>Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DATE_DESC">Mais recentes</SelectItem>
                <SelectItem value="DATE_ASC">Mais antigas</SelectItem>
                <SelectItem value="AMOUNT_DESC">Maior valor</SelectItem>
                <SelectItem value="AMOUNT_ASC">Menor valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada.
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <Dialog key={transaction.id}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                        transaction.type === TransactionType.INCOME 
                          ? "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200" 
                          : "bg-red-100 text-red-600 group-hover:bg-red-200"
                      )}>
                        {transaction.type === TransactionType.INCOME ? <ArrowUpCircle className="h-6 w-6" /> : <ArrowDownCircle className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateToDDMMYYYY(transaction.date)}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-gray-600">{getAccountName(transaction.accountId)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-semibold text-lg",
                      transaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"
                    )}>
                      {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Detalhes da Transação</DialogTitle>
                    <DialogDescription>
                      Informações completas sobre esta movimentação.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                      <span className="text-sm text-muted-foreground mb-1">Valor</span>
                      <span className={cn(
                        "text-3xl font-bold",
                        transaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"
                      )}>
                        {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Receipt className="h-4 w-4" />
                          <span>Descrição</span>
                        </div>
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="h-4 w-4" />
                          <span>Categoria</span>
                        </div>
                        <span className="font-medium">{transaction.category}</span>
                      </div>

                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Wallet className="h-4 w-4" />
                          <span>Conta</span>
                        </div>
                        <span className="font-medium">{getAccountName(transaction.accountId)}</span>
                      </div>

                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Data</span>
                        </div>
                        <span className="font-medium">{formatDateToDDMMYYYY(transaction.date)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6 pt-4 border-t">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditClick(transaction)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        {selectedTransaction && selectedTransaction.id === transaction.id && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Transação</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <label className="text-sm font-medium">Descrição</label>
                                <Input
                                  value={editingDescription}
                                  onChange={(e) => setEditingDescription(e.target.value)}
                                  placeholder="Digite a descrição..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Valor</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingAmount}
                                  onChange={(e) => setEditingAmount(parseFloat(e.target.value))}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Categoria</label>
                                <Select value={editingCategory} onValueChange={setEditingCategory}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecionar categoria" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedTransaction?.type === TransactionType.INCOME && (
                                      <>
                                        <SelectItem value="SALARY">Salário</SelectItem>
                                        <SelectItem value="FREELANCE">Freelance</SelectItem>
                                        <SelectItem value="INVESTMENT">Investimento</SelectItem>
                                        <SelectItem value="OTHER_INCOME">Outra Receita</SelectItem>
                                      </>
                                    )}
                                    {selectedTransaction?.type === TransactionType.EXPENSE && (
                                      <>
                                        <SelectItem value="FOOD">Alimentação</SelectItem>
                                        <SelectItem value="TRANSPORT">Transporte</SelectItem>
                                        <SelectItem value="HOUSING">Moradia</SelectItem>
                                        <SelectItem value="UTILITIES">Utilidades</SelectItem>
                                        <SelectItem value="HEALTHCARE">Saúde</SelectItem>
                                        <SelectItem value="ENTERTAINMENT">Entretenimento</SelectItem>
                                        <SelectItem value="EDUCATION">Educação</SelectItem>
                                        <SelectItem value="SHOPPING">Compras</SelectItem>
                                        <SelectItem value="OTHER_EXPENSE">Outra Despesa</SelectItem>
                                      </>
                                    )}
                                    {selectedTransaction?.type === TransactionType.TRANSFER && (
                                      <SelectItem value="TRANSFER">Transferência</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Data</label>
                                <Input
                                  type="date"
                                  value={editingDate}
                                  onChange={(e) => setEditingDate(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsEditDialogOpen(false)}
                                  disabled={isSubmitting}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  onClick={handleEditSave}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>

                      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteClick(transaction)}
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </Button>
                        </DialogTrigger>
                        {selectedTransaction && selectedTransaction.id === transaction.id && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirmar exclusão</DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja deletar esta transação? Esta ação não pode ser desfeita.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-2 justify-end mt-6">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={isSubmitting}
                              >
                                Cancelar
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'Deletando...' : 'Deletar'}
                              </Button>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

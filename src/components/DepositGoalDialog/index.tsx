import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createTransaction, getAccounts } from "../../services/api";
import { TransactionType, TransactionCategory } from "../../types/transaction";
import type { Goal } from "../../types/goal";
import type { Account } from "../../types/account";

const depositSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório"),
  accountId: z.string().min(1, "Conta de origem é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface DepositGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  onSuccess: () => void;
}

export function DepositGoalDialog({ open, onOpenChange, goal, onSuccess }: DepositGoalDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      accountId: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (open) {
      const loadAccounts = async () => {
        try {
          const data = await getAccounts();
          setAccounts(data);
        } catch (error) {
          console.error("Erro ao carregar contas:", error);
          toast.error("Erro ao carregar contas");
        }
      };
      loadAccounts();
    }
  }, [open]);

  const onSubmit = async (data: DepositFormValues) => {
    setIsSubmitting(true);
    try {
      await createTransaction({
        type: TransactionType.TRANSFER,
        category: TransactionCategory.INVESTMENT, // Or TRANSFER, but INVESTMENT fits well for goals
        amount: parseFloat(data.amount),
        description: `Depósito na meta: ${goal.name}`,
        date: data.date,
        accountId: data.accountId,
        goalId: goal.id,
      });

      toast.success("Depósito realizado com sucesso!");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao realizar depósito:", error);
      if (error.response?.data?.error === 'Insufficient balance') {
        toast.error("Saldo insuficiente na conta de origem");
      } else {
        toast.error("Erro ao realizar depósito");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Valor à Meta</DialogTitle>
          <DialogDescription>
            Transfira dinheiro de uma conta para a meta <strong>{goal.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accountId">Conta de Origem</Label>
            <Select onValueChange={(value) => form.setValue("accountId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (R$ {account.balance.toFixed(2).replace('.', ',')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.accountId && (
              <p className="text-sm text-red-500">{form.formState.errors.accountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "Confirmar Depósito"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

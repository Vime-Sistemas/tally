import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface InsufficientBalanceDialogProps {
  open: boolean;
  currentBalance: number;
  requiredAmount: number;
  finalBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InsufficientBalanceDialog({
  open,
  currentBalance,
  requiredAmount,
  finalBalance,
  onConfirm,
  onCancel,
  isLoading = false,
}: InsufficientBalanceDialogProps) {
  // Validação defensiva
  const current = typeof currentBalance === 'number' ? currentBalance : 0;
  const required = typeof requiredAmount === 'number' ? requiredAmount : 0;
  const final = typeof finalBalance === 'number' ? finalBalance : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saldo Insuficiente</DialogTitle>
          <DialogDescription>
            A operação deixará a conta com saldo negativo. Deseja continuar mesmo assim?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Saldo atual:</span>
              <span className="font-medium">R$ {current.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div className="border-t border-red-200"></div>
            
            <div className="flex justify-between text-red-600">
              <span className="text-sm">Valor da operação:</span>
              <span className="font-medium">-R$ {required.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div className="border-t border-red-200"></div>
            
            <div className="flex justify-between">
              <span className="text-sm font-semibold">Saldo final:</span>
              <span className={`font-bold ${final < 0 ? 'text-red-600' : 'text-green-600'}`}>
                R$ {final.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

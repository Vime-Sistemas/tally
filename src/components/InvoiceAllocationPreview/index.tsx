import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, CreditCard, Info } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface PreviewTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  cardName: string;
  closingDay: number;
  dueDay: number;
  currentInvoiceMonth: number;
  currentInvoiceYear: number;
  correctedInvoiceMonth: number;
  correctedInvoiceYear: number;
}

interface InvoiceAllocationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewData: PreviewTransaction[];
}

export function InvoiceAllocationPreview({ 
  isOpen, 
  onClose, 
  onConfirm, 
  previewData 
}: InvoiceAllocationPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || previewData.length === 0) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (month: number, year: number) => {
    return format(new Date(year, month - 1), 'MMMM yyyy', { locale: ptBR });
  };

  const affectedCardsCount = new Set(previewData.map(t => t.cardName)).size;
  const totalTransactions = previewData.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-orange-50 border-b border-orange-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <div>
              <CardTitle className="text-orange-900">
                Correção de Alocação de Faturas
              </CardTitle>
              <p className="text-sm text-orange-700 mt-1">
                Identificamos {totalTransactions} transações em {affectedCardsCount} cartões 
                que estão alocadas na fatura incorreta
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
          <div className="p-6 space-y-4">
            {/* Info Card */}
            <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Como funciona a correção:</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>Transações após o dia de fechamento vão para a próxima fatura</li>
                  <li>Transações antes ou no dia de fechamento ficam na fatura atual</li>
                  <li>Os valores das faturas serão recalculados automaticamente</li>
                </ul>
              </div>
            </div>

            {/* Preview das mudanças */}
            <div className="space-y-4">
              {previewData.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {transaction.description}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {transaction.cardName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(transaction.date, 'dd/MM/yyyy')}
                        </div>
                        <span>Fecha dia {transaction.closingDay}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(transaction.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Fatura Atual (Incorreta)
                      </p>
                      <Badge variant="destructive" className="text-xs">
                        {getMonthName(transaction.currentInvoiceMonth, transaction.currentInvoiceYear)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Fatura Correta
                      </p>
                      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                        {getMonthName(transaction.correctedInvoiceMonth, transaction.correctedInvoiceYear)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <div className="border-t bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">⚠️ Atenção:</p>
              <p>Esta ação irá reorganizar as transações e pode afetar faturas já pagas.</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? 'Aplicando...' : 'Aplicar Correção'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
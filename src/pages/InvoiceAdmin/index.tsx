import { useState } from 'react';
import { Settings, AlertTriangle, RefreshCw, CheckCircle, CreditCard } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { InvoiceAllocationPreview } from '../../components/InvoiceAllocationPreview';
import { toast } from 'sonner';
import { getInvoiceAllocationPreview, correctInvoiceAllocations } from '../../services/api';

interface PreviewData {
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

interface InvoiceAdminProps {
  onNavigate?: (page: string) => void;
}

export function InvoiceAdmin({ onNavigate }: InvoiceAdminProps = {}) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [lastCorrectionResult, setLastCorrectionResult] = useState<{
    corrected: number;
    total: number;
    message: string;
  } | null>(null);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await getInvoiceAllocationPreview();
      const preview = response.data.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
      
      setPreviewData(preview);
      
      if (preview.length === 0) {
        toast.success('✅ Todas as alocações estão corretas!');
      } else {
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
      toast.error('Erro ao carregar preview das correções');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const applyCorrections = async () => {
    try {
      const result = await correctInvoiceAllocations();
      setLastCorrectionResult(result);
      setShowPreview(false);
      setPreviewData([]);
      
      toast.success(result.message);
    } catch (error) {
      console.error('Erro ao aplicar correções:', error);
      toast.error('Erro ao aplicar correções');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  Administração de Faturas
                </h1>
                <p className="text-zinc-500 text-sm">
                  Correção de alocação de transações de cartão de crédito
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate('dashboard')}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Card de informações */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">Sobre a Correção</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>O que faz:</strong> Verifica transações de cartão de crédito que podem estar 
              alocadas na fatura incorreta com base no dia de fechamento do cartão.
            </p>
            <p>
              <strong>Exemplo:</strong> Cartão com fechamento dia 3. Uma compra do dia 4 deve ir 
              para a fatura do próximo mês, não do mês atual.
            </p>
            <p>
              <strong>⚠️ Atenção:</strong> Esta operação pode afetar faturas já pagas ou fechadas. 
              Sempre revise o preview antes de aplicar.
            </p>
          </CardContent>
        </Card>

        {/* Card de ação principal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-zinc-600" />
              <CardTitle>Verificar Inconsistências</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-600">
              Clique no botão abaixo para analisar todas as transações de cartão de crédito 
              e identificar possíveis inconsistências na alocação de faturas.
            </p>
            
            <Button
              onClick={loadPreview}
              disabled={isLoadingPreview}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoadingPreview ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Analisar Alocações'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card de resultado da última correção */}
        {lastCorrectionResult && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900">Última Correção</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-green-800">
                {lastCorrectionResult.message}
              </p>
              {lastCorrectionResult.corrected > 0 && (
                <p className="text-sm text-green-700 mt-2">
                  ✅ As projeções de cashflow foram atualizadas automaticamente
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informações técnicas */}
        <Card className="border-zinc-100">
          <CardHeader>
            <CardTitle className="text-zinc-700 text-sm">Detalhes Técnicos</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500 space-y-2">
            <p>• A correção usa a nova lógica de cálculo de períodos de fatura</p>
            <p>• Transações após o dia de fechamento são movidas para a próxima fatura</p>
            <p>• Meses com diferentes quantidades de dias (28/30/31) são tratados automaticamente</p>
            <p>• Os totais das faturas são recalculados automaticamente</p>
            <p>• O cache de projeções de cashflow é invalidado após correções</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Preview */}
      <InvoiceAllocationPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={applyCorrections}
        previewData={previewData}
      />
    </div>
  );
}
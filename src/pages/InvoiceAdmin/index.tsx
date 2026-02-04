import { useState, useEffect } from 'react';
import { Settings, AlertTriangle, RefreshCw, CheckCircle, CreditCard, Package, Calculator, Loader2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { InvoiceAllocationPreview } from '../../components/InvoiceAllocationPreview';
import { toast } from 'sonner';
import { 
  getInvoiceAllocationPreview, 
  correctInvoiceAllocations,
  getOrphanTransactionsCount,
  correctOrphanTransactions,
  validateCurrentInvoice
} from '../../services/api';

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

  // Estados para transações órfãs
  const [orphanCount, setOrphanCount] = useState<number | null>(null);
  const [isLoadingOrphans, setIsLoadingOrphans] = useState(false);
  const [isCorrectingOrphans, setIsCorrectingOrphans] = useState(false);
  const [orphanProgress, setOrphanProgress] = useState(0);
  const [orphanResult, setOrphanResult] = useState<{ total: number } | null>(null);

  // Estados para validação de currentInvoice
  const [isValidatingInvoices, setIsValidatingInvoices] = useState(false);
  const [invoiceValidationResult, setInvoiceValidationResult] = useState<{
    cards: Array<{
      cardId: string;
      cardName: string;
      previousValue: number;
      newValue: number;
      difference: number;
      needsCorrection: boolean;
    }>;
    totalCorrected: number;
  } | null>(null);

  // Carregar contagem de órfãos ao montar
  useEffect(() => {
    loadOrphanCount();
  }, []);

  const loadOrphanCount = async () => {
    setIsLoadingOrphans(true);
    try {
      const result = await getOrphanTransactionsCount();
      setOrphanCount(result.orphanCount);
    } catch (error) {
      console.error('Erro ao contar transações órfãs:', error);
    } finally {
      setIsLoadingOrphans(false);
    }
  };

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

  // Corrigir transações órfãs em lotes
  const correctOrphans = async () => {
    setIsCorrectingOrphans(true);
    setOrphanProgress(0);
    let totalCorrected = 0;
    let hasMore = true;
    const initialCount = orphanCount || 0;

    try {
      while (hasMore) {
        const result = await correctOrphanTransactions(50);
        totalCorrected += result.corrected;
        hasMore = result.hasMore;
        
        // Atualizar progresso
        const progress = initialCount > 0 
          ? Math.min(100, (totalCorrected / initialCount) * 100)
          : 100;
        setOrphanProgress(progress);
      }

      setOrphanResult({ total: totalCorrected });
      setOrphanCount(0);
      toast.success(`✅ ${totalCorrected} transações órfãs corrigidas!`);
    } catch (error) {
      console.error('Erro ao corrigir órfãos:', error);
      toast.error('Erro ao corrigir transações órfãs');
    } finally {
      setIsCorrectingOrphans(false);
      loadOrphanCount(); // Recarregar contagem
    }
  };

  // Validar e corrigir currentInvoice
  const validateInvoices = async () => {
    setIsValidatingInvoices(true);
    try {
      const result = await validateCurrentInvoice();
      setInvoiceValidationResult(result);
      
      if (result.totalCorrected === 0) {
        toast.success('✅ Todos os cartões estão com valores corretos!');
      } else {
        toast.success(`✅ ${result.totalCorrected} cartão(ões) corrigido(s)!`);
      }
    } catch (error) {
      console.error('Erro ao validar faturas:', error);
      toast.error('Erro ao validar faturas');
    } finally {
      setIsValidatingInvoices(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
            {onNavigate && (
              <Button
                variant="outline"
                onClick={() => onNavigate('dashboard')}
              >
                Voltar ao Dashboard
              </Button>
            )}
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

        {/* Card de transações órfãs (parcelas e recorrentes) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle>Transações Órfãs (Parcelas e Recorrentes)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-600">
              Transações de cartão que não foram alocadas a nenhuma fatura (parcelas 2, 3, 4... 
              ou transações recorrentes antigas).
            </p>
            
            {orphanCount !== null && (
              <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-600">Transações órfãs encontradas:</span>
                <span className={`font-bold ${orphanCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {orphanCount}
                </span>
              </div>
            )}

            {isCorrectingOrphans && (
              <div className="space-y-2">
                <Progress value={orphanProgress} className="h-2" />
                <p className="text-sm text-zinc-500 text-center">
                  Processando em lotes... {Math.round(orphanProgress)}%
                </p>
              </div>
            )}

            {orphanResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  ✅ {orphanResult.total} transações foram alocadas às faturas corretas!
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadOrphanCount}
                disabled={isLoadingOrphans}
              >
                {isLoadingOrphans ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Atualizar Contagem'
                )}
              </Button>
              
              <Button
                onClick={correctOrphans}
                disabled={isCorrectingOrphans || orphanCount === 0}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isCorrectingOrphans ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  'Corrigir Transações Órfãs'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card de validação de currentInvoice */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-purple-600" />
              <CardTitle>Validar Totais dos Cartões</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-600">
              Verifica se o valor "Fatura Atual" de cada cartão corresponde à soma real das faturas 
              não pagas. Corrige automaticamente caso haja divergências.
            </p>
            
            {invoiceValidationResult && (
              <div className="space-y-3">
                {invoiceValidationResult.cards.map((card) => (
                  <div 
                    key={card.cardId}
                    className={`p-3 rounded-lg border ${
                      card.needsCorrection 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{card.cardName}</span>
                      {card.needsCorrection ? (
                        <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded">
                          Corrigido
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">
                          OK
                        </span>
                      )}
                    </div>
                    {card.needsCorrection && (
                      <div className="text-sm text-zinc-600 mt-1">
                        {formatCurrency(card.previousValue)} → {formatCurrency(card.newValue)}
                        <span className="text-xs text-zinc-400 ml-2">
                          (diferença: {formatCurrency(card.difference)})
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <Button
              onClick={validateInvoices}
              disabled={isValidatingInvoices}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isValidatingInvoices ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                'Validar e Corrigir Totais'
              )}
            </Button>
          </CardContent>
        </Card>

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
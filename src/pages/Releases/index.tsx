import { ChevronDown, ChevronUp, Sparkles, Bug, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import type { Page } from '../../types/navigation';

interface ReleaseNote {
  version: string;
  date: string;
  description: string;
  features: string[];
  fixes: string[];
  improvements: string[];
}

interface ReleasesProps {
  onNavigate: (page: Page) => void;
}

const releases: ReleaseNote[] = [
  {
    version: '1.5.19',
    date: '26 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: [],
    improvements: ['Mais melhorias visuais.'],
  },
  {
    version: '1.5.18',
    date: '26 de dezembro de 2025',
    description: 'Dívidas',
    features: [],
    fixes: [],
    improvements: ['Agora ao lançar um patrimônio financiado, a dívida já é automaticamente gerada.'],
  },
  {
    version: '1.5.18',
    date: '26 de dezembro de 2025',
    description: 'Dívidas',
    features: ['Agora você consegue adicionar e monitorar as suas dívidas.'],
    fixes: [],
    improvements: [],
  },
  {
    version: '1.5.17',
    date: '26 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: ['Corrigimos o bug do ícone no formulário de transações'],
    improvements: ['Correções de cores de zinc para white'],
  },
  {
    version: '1.5.16',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: [],
    improvements: ['Melhoramos consideravelmente a listagem de patrimônio e a página de perfil', 'Repaginamos o histórico de transações'],
  },
  {
    version: '1.5.15',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: ['Bug de switch de transação não-paga'],
    improvements: ['Melhoramos significativamente o visual do formulário de transação', 'Melhoramos o visual da listagem de contas e cartões', 'Removemos a funcionalidade de cor da conta', 'Melhoramos o formulário de transferência'],
  },
  {
    version: '1.5.14',
    date: '23 de dezembro de 2025',
    description: 'Novo Dashboard',
    features: [],
    fixes: [],
    improvements: ['Melhoramos significativamente o visual do dashboard e do header'],
  },
  {
    version: '1.5.13',
    date: '23 de dezembro de 2025',
    description: 'Novo Sign-in e novo Sign-up',
    features: [],
    fixes: [],
    improvements: ['Melhoramos completamente o visual das páginas de login e cadastro'],
  },
  {
    version: '1.5.12',
    date: '23 de dezembro de 2025',
    description: 'Onboarding',
    features: [],
    fixes: [],
    improvements: ['Agora temos um on-boarding para você não se perder no nosso mar de funcionalidades.'],
  },
  {
    version: '1.5.11',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: ['Correção do bug no dialog de edição de uma transação'],
    improvements: [],
  },
  {
    version: '1.5.10',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: ['Agora centros de custo não são obrigatórios para receitas.'],
    improvements: ['Ajustes nos dialogs de edição e listagem de transações'],
  },
  {
    version: '1.5.9',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: [],
    improvements: ['Melhoria no layout de transações para uma melhor experiência com os novos campos'],
  },
  {
    version: '1.5.8',
    date: '23 de dezembro de 2025',
    description: 'Centro de Custo',
    features: ['Apresentamos os centros de custos, uma nova de identificar os seus gastos'],
    fixes: [],
    improvements: [],
  },
  {
    version: '1.5.7',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: ['Bug da filtragem por data.'],
    improvements: [],
  },
  {
    version: '1.5.6',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: [],
    improvements: ['Melhor mapeamento de categorias na listagem de transações.'],
  },
  {
    version: '1.5.5',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: ['Bug na duplicação de orçamentos.'],
    improvements: [],
  },
  {
    version: '1.5.4',
    date: '23 de dezembro de 2025',
    description: 'Pequenas Melhorias',
    features: [],
    fixes: ['Bug de proporção do nome do sistema no header desktop.'],
    improvements: ['Dashboard melhorado com novas informações sobre orçamentos.'],
  },
  {
    version: '1.5.3',
    date: '23 de dezembro de 2025',
    description: 'Novas Categorias',
    features: [],
    fixes: [],
    improvements: ['Novas categorias para transações e investimentos.', 'Alteração do select padrão para um combobox searchable para acelerar a sua produtividade.'],
  },
  {
    version: '1.5.2',
    date: '23 de dezembro de 2025',
    description: 'Adição de orçamentos',
    features: [
      'Agora você consegue criar orçamentos com base em receitas/despesa e investimentos, uma boa hora de bater as suas metas...?',
    ],
    fixes: [],
    improvements: [],
  },
  {
    version: '1.5.1',
    date: '23 de dezembro de 2025',
    description: 'Adição de Transações pagas e não pagas',
    features: [
      'Agora você consegue criar transações com base em receitas/despesas futuras, aumentando a previsibilidade do seu fluxo financeiro.',
    ],
    fixes: [],
    improvements: [],
  },
  {
    version: '1.5.0',
    date: '18 de dezembro de 2025',
    description: 'Melhorias no sistema de cartões de crédito e transações recorrentes',
    features: [
      'Identificação de últimos 4 dígitos de cartões para uma melhor localização',
      'Transações recorrentes com separação por período de fatura',
      'Suporte para editar cartões existentes',
      'Suporte para editar contas existentes',
      'Melhorias visuais',
      'Logins recentes'
    ],
    fixes: [
      'Correção de CORS para requisições PUT',
      'Ajuste de contagem de faturas em transações recorrentes',
      'Validação de maxLength em campos de entrada',
      'Melhorias nas formatações financeiras',
    ],
    improvements: [
      'Melhor experiência móvel no editor de cartões',
      'Logs mais detalhados de transações recorrentes',
      'Desvinculação de cartão à uma conta',
    ],
  }
];

export function Releases({ onNavigate }: ReleasesProps) {
  const [expandedVersion, setExpandedVersion] = useState<string>('1.2.0');

  const toggleExpanded = (version: string) => {
    setExpandedVersion(expandedVersion === version ? '' : version);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Releases</h1>
          <p className="text-gray-600">Conheça as novidades e atualizações do Cérebro das Finanças</p>
        </div>

        <div className="space-y-4">
          {releases.map((release) => (
            <div key={release.version} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
              <button
                onClick={() => toggleExpanded(release.version)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-black">v{release.version}</h2>
                    <span className="text-sm text-gray-500">{release.date}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{release.description}</p>
                </div>
                <div className="ml-4">
                  {expandedVersion === release.version ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </button>

              {expandedVersion === release.version && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                  {release.features.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-black">Novas Funcionalidades</h3>
                      </div>
                      <ul className="space-y-1">
                        {release.features.map((feature, idx) => (
                          <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {release.fixes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Bug className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-black">Correções</h3>
                      </div>
                      <ul className="space-y-1">
                        {release.fixes.map((fix, idx) => (
                          <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {release.improvements.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-semibold text-black">Melhorias</h3>
                      </div>
                      <ul className="space-y-1">
                        {release.improvements.map((improvement, idx) => (
                          <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg text-center">
          <p className="text-gray-600 mb-4">Gostaria de fazer login para acessar o app?</p>
          <Button
            onClick={() => onNavigate('login')}
            className="bg-blue-400 text-white hover:bg-gray-800"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    </div>
  );
}

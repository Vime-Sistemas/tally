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

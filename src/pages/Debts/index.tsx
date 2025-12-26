import { useState, useEffect } from 'react';
import { DebtForm } from '../../components/DebtForm';
import { DebtList } from '../../components/DebtList';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { List, Receipt } from 'lucide-react';
import { Kbd } from '../../components/ui/kbd';
import type { Page } from '../../types/navigation';

type Tab = 'FORM' | 'LIST';

interface DebtsProps {
  onNavigate?: (page: Page) => void;
}

export function Debts({ onNavigate: _onNavigate }: DebtsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('LIST');

  // Keyboard shortcut to switch tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.altKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('FORM'); }
        if (e.key === '2') { e.preventDefault(); setActiveTab('LIST'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Dívidas</h1>
            <p className="text-zinc-500 text-sm">Gerencie suas dívidas e acompanhe pagamentos.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'FORM' ? 'default' : 'outline'}
              className={cn(
                'gap-2',
                activeTab === 'FORM'
                  ? 'bg-blue-400 text-white hover:bg-blue-500'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-50 hover:border-zinc-300'
              )}
              onClick={() => setActiveTab('FORM')}
            >
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Dívida</span>
              <Kbd>Alt+1</Kbd>
            </Button>
            <Button
              variant={activeTab === 'LIST' ? 'default' : 'outline'}
              className={cn(
                'gap-2',
                activeTab === 'LIST'
                  ? 'bg-blue-400 text-white hover:bg-blue-500'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-50 hover:border-zinc-300'
              )}
              onClick={() => setActiveTab('LIST')}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
              <Kbd>Alt+2</Kbd>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'FORM' && <DebtForm />}
          {activeTab === 'LIST' && <DebtList />}
        </div>

      </div>
    </div>
  );
}
import { Slash, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import type { Page } from "../../types/navigation";

// Define the structure for a breadcrumb path
type BreadcrumbPath = {
  label: string;
  page?: Page; // If present, it's clickable
};

// Configuration Map: Define the path for each page here
const BREADCRUMB_MAP: Partial<Record<Page, BreadcrumbPath[]>> = {
  'dashboard-summary': [
    { label: 'Visão Geral' }
  ],
  'dashboard-goals': [
    { label: 'Metas' }
  ],
  'transactions-new': [
    { label: 'Transações', page: 'transactions-new' } // Root level for transactions
  ],
  'transactions-history': [
    { label: 'Transações', page: 'transactions-new' },
    { label: 'Histórico' }
  ],
  'accounts-list': [
    { label: 'Carteira', page: 'accounts-list' }
  ],
  'accounts-new': [
    { label: 'Carteira', page: 'accounts-list' },
    { label: 'Nova Conta' }
  ],
  'equity-list': [
    { label: 'Patrimônio', page: 'equity-list' }
  ],
  'equity-new': [
    { label: 'Patrimônio', page: 'equity-list' },
    { label: 'Novo Item' }
  ],
  'budgets': [
    { label: 'Orçamentos' }
  ],
  'debts': [
    { label: 'Dívidas' }
  ],
  'reports': [
    { label: 'Relatórios' }
  ],
  'profile': [
    { label: 'Configurações' },
    { label: 'Perfil' }
  ]
};

interface AppBreadcrumbProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function AppBreadcrumb({ currentPage, onNavigate }: AppBreadcrumbProps) {
  // If the page isn't in the map (e.g. login/signup), don't render anything
  // or render a default. Here we return null to hide it.
  const paths = BREADCRUMB_MAP[currentPage];

  if (!paths) return null;

  return (
    <div className="flex items-center h-14 px-4 md:px-8 border-b border-zinc-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          {/* Always show a Home/Dashboard icon as the root */}
          <BreadcrumbItem>
            <BreadcrumbLink 
              asChild
              className="cursor-pointer flex items-center gap-2"
            >
              <button onClick={() => onNavigate('dashboard-summary')}>
                <Home className="h-4 w-4" />
                <span className="sr-only">Dashboard</span>
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator>
            <Slash className="h-4 w-4" />
          </BreadcrumbSeparator>

          {paths.map((item, index) => {
            const isLast = index === paths.length - 1;

            return (
              <BreadcrumbItem key={`${item.label}-${index}`}>
                {!isLast && item.page ? (
                  <>
                    <BreadcrumbLink asChild className="cursor-pointer">
                      <button onClick={() => onNavigate(item.page!)}>
                        {item.label}
                      </button>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator>
                      <Slash className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  </>
                ) : (
                  <BreadcrumbPage className="font-medium text-zinc-900">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
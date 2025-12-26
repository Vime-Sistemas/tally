import { useState, useEffect } from 'react'
import { useAuth0 } from "@auth0/auth0-react"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import api, { setAuthToken } from './services/api'
import { costCenterService } from './services/costCenters'
import { Transactions } from './pages/Transactions'
import { Accounts } from './pages/Accounts'
import { Summary } from './pages/Dashboard/Summary'
import { MobileSummary } from './pages/Dashboard/Mobile/Summary'
import { Goals } from './pages/Dashboard/Goals'
import { EquityNew } from './pages/Equity/New'
import { EquityList } from './pages/Equity/List'
import { Profile } from './pages/Profile'
import { SignUp } from './pages/SignUp'
import { Login } from './pages/Login'
import { Releases } from './pages/Releases'
import { BudgetsPage } from './pages/Budgets/index'
import { Debts } from './pages/Debts'
import { TransactionHistory } from './components/TransactionHistory'
import { AccountsList } from './components/AccountsList'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { LoadingScreen } from './components/LoadingScreen'
import type { Page, AppContext } from './types/navigation'
import { UserProvider, useUser } from './contexts/UserContext'
import { Toaster } from "./components/ui/sonner"
import { SessionExpiredDialog } from './components/SessionExpiredDialog'
import { useIsMobile } from './hooks/use-mobile'
import './App.css'

function AppContent() {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently, user: auth0User } = useAuth0();
  const { setUser, setCostCenters, user } = useUser();
  
  // Detect initial page from pathname
  const getInitialPage = (): Page => {
    const pathname = window.location.pathname;
    if (pathname.includes('/releases')) return 'releases';
    if (pathname.includes('/login')) return 'login';
    return 'signup';
  };
  
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());
  const [hasBusiness, setHasBusiness] = useState(false);
  const [currentContext, setCurrentContext] = useState<AppContext>('PERSONAL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && auth0User) {
        setIsSyncing(true);
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }
          });
          setAuthToken(token);
          
          const response = await api.post('/auth/sync', {
            email: auth0User.email,
            name: auth0User.name
          });
          
          setUser(response.data);

          // Load cost centers
          const costCenters = await costCenterService.getCostCenters();
          setCostCenters(costCenters);
        } catch (err) {
          console.error('Error syncing user:', err);
        } finally {
          setIsSyncing(false);
          setCurrentPage('dashboard-summary');
        }
      }
    };

    if (!isLoading) {
      syncUser();
    }
  }, [isAuthenticated, isLoading, auth0User, getAccessTokenSilently, setUser, setCostCenters]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Alt + Key shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd': // Dashboard
            e.preventDefault();
            setCurrentPage('dashboard-summary');
            break;
          case 't': // Transaction (New)
            e.preventDefault();
            setCurrentPage('transactions-new');
            break;
          case 'h': // History
            e.preventDefault();
            setCurrentPage('transactions-history');
            break;
          case 'c': // Contas (Accounts)
            e.preventDefault();
            setCurrentPage('accounts-list');
            break;
          case 'm': // Metas (Goals)
            e.preventDefault();
            setCurrentPage('dashboard-goals');
            break;
          case 'p': // Patrimônio (Equity)
            e.preventDefault();
            setCurrentPage('equity-list');
            break;
          case 'b': // Budgets (Orçamentos)
            e.preventDefault();
            setCurrentPage('budgets');
            break;
          case 'v': // Dívidas (Debts) - Alt+V (D reserved for Dashboard)
            e.preventDefault();
            setCurrentPage('debts');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading || isSyncing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro de Autenticação</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <p className="text-sm text-gray-500">Verifique se as conexões sociais (Google/Instagram) estão habilitadas no painel do Auth0.</p>
          <button 
            onClick={() => window.location.origin}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'signup':
        return <SignUp onNavigate={setCurrentPage} />;
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'transactions-new':
        return <Transactions onNavigate={setCurrentPage} />;
      case 'transactions-history':
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
              <TransactionHistory onNavigate={setCurrentPage} />
            </div>
          </div>
        );
      case 'accounts-new':
        return <Accounts onNavigate={setCurrentPage} />;
      case 'accounts-list':
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-8xl">
              <AccountsList onNavigate={setCurrentPage} />
            </div>
          </div>
        );
      case 'equity-new':
        return <EquityNew onNavigate={setCurrentPage} />;
      case 'equity-list':
        return <EquityList onNavigate={setCurrentPage} />;
      case 'profile':
        return <Profile hasBusiness={hasBusiness} setHasBusiness={setHasBusiness} />;
      case 'dashboard-summary':
        return isMobile ? <MobileSummary /> : <Summary onNavigate={setCurrentPage} />;
      case 'dashboard-goals':
        return <Goals />;
      case 'reports':
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
              <p className="text-gray-500 mt-2">Em breve</p>
            </div>
          </div>
        );
      case 'releases':
        return <Releases onNavigate={setCurrentPage} />;
      case 'budgets':
        return <BudgetsPage />;
      case 'debts':
        return <Debts onNavigate={setCurrentPage} />;
      default:
        return <Transactions onNavigate={setCurrentPage} />;
    }
  };

  const menuPreference = user?.menuPreference || 'header';
  const showSidebar = menuPreference === 'sidebar' && !isMobile && !['signup', 'login', 'releases'].includes(currentPage);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      {!['signup', 'login', 'releases'].includes(currentPage) && (
        <>
          {showSidebar ? (
            <div className="flex">
              <Sidebar
                onNavigate={setCurrentPage}
                currentPage={currentPage}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
              <div className="flex-1 transition-all duration-300">
                <main className={`w-full pb-24 bg-white md:pb-0 ${showSidebar ? (sidebarCollapsed ? 'pl-16' : 'pl-64') : 'px-4 md:px-8'}`}>
                  <div key={currentPage}>
                    {renderPage()}
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <>
              <Header 
                onNavigate={setCurrentPage} 
                hasBusiness={hasBusiness}
                currentContext={currentContext}
                onContextChange={setCurrentContext}
                currentPage={currentPage}
              />
              <main className={`w-full pb-24 md:pb-0 ${showSidebar ? (sidebarCollapsed ? 'pl-16' : 'pl-64') : 'px-4 md:px-8'}`}>
                <div key={currentPage}>
                  {renderPage()}
                </div>
              </main>
            </>
          )}
        </>
      )}
      {/* main is already rendered above together with Header or Sidebar; no duplicate rendering */}
      <SessionExpiredDialog onRedirect={() => setCurrentPage('login')} />
      <Toaster />
      <Analytics />
      <SpeedInsights />
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App

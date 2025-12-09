import { useState, useEffect } from 'react'
import { useAuth0 } from "@auth0/auth0-react"
import api from './services/api'
import { Transactions } from './pages/Transactions'
import { Accounts } from './pages/Accounts'
import { Summary } from './pages/Dashboard/Summary'
import { Goals } from './pages/Dashboard/Goals'
import { EquityNew } from './pages/Equity/New'
import { EquityList } from './pages/Equity/List'
import { Profile } from './pages/Profile'
import { SignUp } from './pages/SignUp'
import { Login } from './pages/Login'
import { TransactionHistory } from './components/TransactionHistory'
import { AccountsList } from './components/AccountsList'
import { Header } from './components/Header'
import type { Page, AppContext } from './types/navigation'
import './App.css'

function App() {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently, user } = useAuth0();
  const [currentPage, setCurrentPage] = useState<Page>('signup');
  const [hasBusiness, setHasBusiness] = useState(false);
  const [currentContext, setCurrentContext] = useState<AppContext>('PERSONAL');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && user) {
        setIsSyncing(true);
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }
          });
          console.log('Token obtained:', token.substring(0, 20) + '...');
          localStorage.setItem('token', token);
          
          await api.post('/auth/sync', {
            email: user.email,
            name: user.name
          });
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
  }, [isAuthenticated, isLoading, user, getAccessTokenSilently]);

  if (isLoading || isSyncing) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-gray-600">Carregando...</p>
      </div>
    );
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
        return <Transactions />;
      case 'transactions-history':
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
              <TransactionHistory />
            </div>
          </div>
        );
      case 'accounts-new':
        return <Accounts />;
      case 'accounts-list':
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
              <AccountsList />
            </div>
          </div>
        );
      case 'equity-new':
        return <EquityNew />;
      case 'equity-list':
        return <EquityList />;
      case 'profile':
        return <Profile hasBusiness={hasBusiness} setHasBusiness={setHasBusiness} />;
      case 'dashboard-summary':
        return <Summary />;
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
      default:
        return <Transactions />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!['signup', 'login'].includes(currentPage) && (
        <Header 
          onNavigate={setCurrentPage} 
          hasBusiness={hasBusiness}
          currentContext={currentContext}
          onContextChange={setCurrentContext}
        />
      )}
      <main>
        {renderPage()}
      </main>
    </div>
  )
}

export default App

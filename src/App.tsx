import { useState } from 'react'
import { Transactions } from './pages/Transactions'
import { Accounts } from './pages/Accounts'
import { Summary } from './pages/Dashboard/Summary'
import { Goals } from './pages/Dashboard/Goals'
import { EquityNew } from './pages/Equity/New'
import { EquityList } from './pages/Equity/List'
import { Profile } from './pages/Profile'
import { TransactionHistory } from './components/TransactionHistory'
import { AccountsList } from './components/AccountsList'
import { Header, type Page, type AppContext } from './components/Header'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard-summary');
  const [hasBusiness, setHasBusiness] = useState(false);
  const [currentContext, setCurrentContext] = useState<AppContext>('PERSONAL');

  const renderPage = () => {
    switch (currentPage) {
      case 'transactions-new':
        return <Transactions />;
      case 'transactions-history':
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-2xl">
              <TransactionHistory />
            </div>
          </div>
        );
      case 'accounts-new':
        return <Accounts />;
      case 'accounts-list':
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-2xl">
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
      <Header 
        onNavigate={setCurrentPage} 
        hasBusiness={hasBusiness}
        currentContext={currentContext}
        onContextChange={setCurrentContext}
      />
      <main>
        {renderPage()}
      </main>
    </div>
  )
}

export default App

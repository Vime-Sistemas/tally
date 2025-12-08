import { useState } from 'react'
import { Transactions } from './pages/Transactions'
import { Accounts } from './pages/Accounts'
import { TransactionHistory } from './components/TransactionHistory'
import { AccountsList } from './components/AccountsList'
import { Header, type Page } from './components/Header'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('transactions-new');

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
      case 'dashboard':
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
              <p className="text-gray-500 mt-2">Em breve</p>
            </div>
          </div>
        );
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
    <div className="min-h-screen bg-gray-50/50">
      <Header onNavigate={setCurrentPage} />
      <main>
        {renderPage()}
      </main>
    </div>
  )
}

export default App

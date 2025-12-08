import { useState } from 'react'
import { Transactions } from './pages/Transactions'
import { Accounts } from './pages/Accounts'
import { Header } from './components/Header'
import './App.css'

type Page = 'dashboard' | 'transactions' | 'reports' | 'accounts';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('transactions');

  const renderPage = () => {
    switch (currentPage) {
      case 'transactions':
        return <Transactions />;
      case 'accounts':
        return <Accounts />;
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

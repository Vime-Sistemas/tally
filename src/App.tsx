import { Transactions } from './pages/Transactions'
import { Header } from './components/Header'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main>
        <Transactions />
      </main>
    </div>
  )
}

export default App

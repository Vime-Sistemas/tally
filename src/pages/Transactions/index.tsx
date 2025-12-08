import { TransactionForm } from '../../components/TransactionForm';

export function Transactions() {
  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Tally</h1>
          <p className="text-gray-500 text-lg">Controle financeiro pessoal</p>
        </div>
        
        {/* Form */}
        <TransactionForm />
      </div>
    </div>
  );
}

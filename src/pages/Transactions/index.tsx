import { TransactionForm } from '../../components/TransactionForm';

export function Transactions() {
  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Tally</h1>
          <p className="text-gray-600">Controle financeiro pessoal</p>
        </div>
        
        {/* Form */}
        <TransactionForm />
      </div>
    </div>
  );
}

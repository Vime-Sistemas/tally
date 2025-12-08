import { AccountType } from "../../types/account";
import { CreditCard, Wallet } from "lucide-react";

// Mock data
const accounts = [
  {
    id: '1',
    name: 'Nubank',
    type: AccountType.CHECKING,
    balance: 1250.00,
    color: 'bg-purple-600',
  },
  {
    id: '2',
    name: 'Carteira',
    type: AccountType.WALLET,
    balance: 150.00,
    color: 'bg-gray-800',
  },
];

const cards = [
  {
    id: '1',
    name: 'Nubank Gold',
    limit: 5000.00,
    currentInvoice: 1250.00,
    closingDay: 5,
    dueDay: 10,
    color: 'bg-purple-700',
  },
  {
    id: '2',
    name: 'Itaú Click',
    limit: 8000.00,
    currentInvoice: 340.00,
    closingDay: 15,
    dueDay: 20,
    color: 'bg-orange-600',
  },
];

export function AccountsList() {
  return (
    <div className="space-y-8">
      {/* Contas */}
      <section>
        <h2 className="text-xl font-semibold text-black mb-4">Minhas Contas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className={`p-6 rounded-2xl text-white shadow-lg ${account.color} transition-transform hover:scale-[1.02] cursor-pointer`}>
              <div className="flex justify-between items-start mb-8">
                <Wallet className="h-6 w-6 opacity-80" />
                <span className="text-sm font-medium opacity-80">{account.type === 'CHECKING' ? 'Conta Corrente' : 'Carteira'}</span>
              </div>
              <div>
                <p className="text-sm opacity-80 mb-1">Saldo Atual</p>
                <h3 className="text-2xl font-bold">R$ {account.balance.toFixed(2).replace('.', ',')}</h3>
                <p className="mt-2 font-medium">{account.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cartões */}
      <section>
        <h2 className="text-xl font-semibold text-black mb-4">Meus Cartões</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.id} className={`p-6 rounded-2xl text-white shadow-lg ${card.color} relative overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer`}>
              {/* Decorative circles */}
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white opacity-10"></div>
              <div className="absolute -right-10 top-10 w-32 h-32 rounded-full bg-white opacity-5"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <CreditCard className="h-6 w-6 opacity-80" />
                <span className="text-sm font-medium opacity-80">Crédito</span>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm opacity-80 mb-1">Fatura Atual</p>
                    <h3 className="text-2xl font-bold">R$ {card.currentInvoice.toFixed(2).replace('.', ',')}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80">Limite Disponível</p>
                    <p className="font-medium">R$ {(card.limit - card.currentInvoice).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <p className="font-medium tracking-wide">{card.name}</p>
                  <p className="text-xs opacity-80">Vence dia {card.dueDay}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { createTransaction } from './api';
import { toast } from 'sonner';
import type { Transaction, CreateTransactionDTO } from '../types/transaction';

interface InsufficientBalanceResponse {
  error: 'Insufficient balance';
  currentBalance: number;
  requiredAmount: number;
  wouldNegative?: boolean;
  finalBalance?: number;
}

export const createTransactionWithValidation = async (
  data: CreateTransactionDTO,
  onInsufficientBalance?: (info: InsufficientBalanceResponse) => Promise<boolean>
): Promise<Transaction | null> => {
  try {
    // First attempt without confirmation
    const transaction = await createTransaction(data);
    return transaction;
  } catch (error: any) {
    // Check if it's an insufficient balance error
    if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient balance') {
      const balanceInfo = error.response.data as InsufficientBalanceResponse;

      // Ask user if they want to continue
      if (onInsufficientBalance) {
        const confirmed = await onInsufficientBalance(balanceInfo);
        
        if (confirmed) {
          // Retry with confirmation flag
          try {
            const transaction = await fetch(
              `${import.meta.env.VITE_API_URL}/api/transactions/confirm`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  ...data,
                  confirmNegativeBalance: true
                })
              }
            ).then(res => {
              if (!res.ok) throw new Error('Failed to create transaction');
              return res.json();
            });
            
            toast.success('Transação realizada com sucesso!');
            return transaction;
          } catch (confirmError) {
            console.error('Erro ao criar transação com confirmação:', confirmError);
            toast.error('Erro ao criar transação');
            return null;
          }
        }
      }
      
      throw error;
    }

    throw error;
  }
};

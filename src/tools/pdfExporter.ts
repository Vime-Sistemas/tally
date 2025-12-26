import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { TransactionType } from '../types/transaction';
import type { Transaction } from '../types/transaction';
import type { DateRange } from 'react-day-picker';

interface ExportData {
  transactions: Transaction[];
  summary: { count: number; income: number; expense: number };
  dateRange?: DateRange;
}

// --- Helpers ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const parseUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    HOUSING: 'Moradia', UTILITIES: 'Contas Fixas', FOOD: 'Alimentação', TRANSPORT: 'Transporte',
    HEALTHCARE: 'Saúde', INSURANCE: 'Seguros', EDUCATION: 'Educação', SHOPPING: 'Compras',
    CLOTHING: 'Vestuário', ENTERTAINMENT: 'Lazer', SUBSCRIPTIONS: 'Assinaturas', TAXES: 'Impostos',
    FEES: 'Taxas/Tarifas', PETS: 'Pets', DONATIONS: 'Doações', TRAVEL: 'Viagens',
    SALARY: 'Salário', BONUS: 'Bônus', FREELANCE: 'Freelance', SELF_EMPLOYED: 'Autônomo',
    DIVIDENDS: 'Dividendos', INTEREST: 'Juros', RENT: 'Aluguel', INVESTMENT_INCOME: 'Rendimentos',
    PENSION_INCOME: 'Previdência', INVESTMENT: 'Aporte', PENSION_CONTRIBUTION: 'Prev. Privada',
    SAVINGS: 'Poupança', CRYPTO: 'Cripto', REAL_ESTATE: 'Imóveis', REAL_ESTATE_FUNDS: 'FIIs',
    FOREIGN_INVESTMENT: 'Exterior', TRANSFER: 'Transferência', OTHER_EXPENSE: 'Outros'
  };
  return labels[category] || category;
};

const getSourceName = (transaction: Transaction, accounts: any[], cards: any[]): string => {
  if (transaction.type === TransactionType.INVOICE_PAYMENT && transaction.accountId) {
      return accounts.find(a => a.id === transaction.accountId)?.name || 'Conta';
  }
  if (transaction.cardId) {
      return cards.find(c => c.id === transaction.cardId)?.name || 'Cartão';
  }
  if (transaction.accountId) {
      return accounts.find(a => a.id === transaction.accountId)?.name || 'Conta';
  }
  return '-';
};

export const exportTransactionsToPDF = (
  data: ExportData,
  accounts: any[],
  cards: any[],
) => {
  const { transactions, summary, dateRange } = data;
  const doc = new jsPDF();
  
  // Cores da Marca
  const colors = {
    primary: [96, 165, 250], // Zinc 900
    secondary: [96, 165, 250], // Zinc 500
    accent: [59, 130, 246], // Blue 500
    success: [22, 163, 74], // Green 600
    danger: [220, 38, 38], // Red 600
    bgLight: [244, 244, 245], // Zinc 100
  };

  // --- Cabeçalho ---
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, 210, 40, 'F'); // Barra superior escura

  // Logo / Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CDF', 20, 20); // Simulação de Logo
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Financeiro Detalhado', 20, 28);

  // Informações do Lado Direito do Cabeçalho
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 190, 20, { align: 'right' });

  // --- Filtros / Contexto ---
  let currentY = 55;
  
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Período', 20, currentY);
  
  const periodText = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'dd/MM/yyyy')} até ${format(dateRange.to, 'dd/MM/yyyy')}`
    : 'Todo o histórico';
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text(periodText, 20, currentY + 6);

  // --- Cards de Resumo (Visual) ---
  currentY += 15;
  const cardWidth = 50;
  const cardHeight = 24;
  const gap = 10;
  
  // Helper para desenhar card
  const drawCard = (x: number, title: string, value: number, color: number[]) => {
    // Fundo leve
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(228, 228, 231); // Borda suave
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    
    // Título
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(title.toUpperCase(), x + 5, currentY + 8);
    
    // Valor
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(formatCurrency(value), x + 5, currentY + 18);
  };

  const balance = summary.income - summary.expense;
  
  drawCard(20, 'Entradas', summary.income, colors.success);
  drawCard(20 + cardWidth + gap, 'Saídas', summary.expense, colors.danger);
  drawCard(20 + (cardWidth + gap) * 2, 'Saldo', balance, balance >= 0 ? colors.success : colors.danger);

  // --- Tabela de Transações ---
  currentY += 35;

  const tableData = transactions.map(t => [
    format(parseUTCDate(t.date), 'dd/MM/yyyy'),
    t.description,
    getCategoryLabel(t.category),
    getSourceName(t, accounts, cards),
    formatCurrency(t.amount),
    t.type === TransactionType.INCOME ? 'Entrada' : 'Saída',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'Descrição', 'Categoria', 'Conta/Cartão', 'Valor', 'Tipo']],
    body: tableData,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 3,
      lineColor: [228, 228, 231],
      lineWidth: 0.1,
      textColor: [82, 82, 91] // Zinc 600
    },
    headStyles: { 
      fillColor: [96, 165, 250], // Zinc 900 (Black Header)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Data
      1: { cellWidth: 'auto' }, // Descrição
      2: { cellWidth: 30 }, // Categoria
      3: { cellWidth: 30 }, // Conta
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }, // Valor
      5: { cellWidth: 20, halign: 'center' }, // Tipo
    },
    // Hook para customizar cores das células
    didParseCell: function(data) {
      // Se for a coluna de Valor (índice 4)
      if (data.section === 'body' && data.column.index === 4) {
        const rawValue = tableData[data.row.index];
        const typeStr = rawValue[5]; // Pega a string 'Entrada' ou 'Saída'
        
        if (typeStr === 'Entrada') {
          data.cell.styles.textColor = [22, 163, 74]; // Verde
        } else {
          data.cell.styles.textColor = [220, 38, 38]; // Vermelho
        }
      }
    },
    // Rodapé em todas as páginas
    didDrawPage: function () {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      doc.text('CDF - Gestão Financeira Pessoal', 20, 290);
    }
  });

  // Salvar
  const fileName = `extrato_cdf_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(fileName);
};
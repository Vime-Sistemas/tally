import type { Equity } from "./equity";

export interface InvestmentHoldingSummary {
  id: string;
  name: string;
  type: string;
  acquisitionDate: string;
  currentValue: number;
  invested: number;
  netGain: number;
  netGainPct: number;
}

export interface InvestmentFlowPoint {
  month: string;
  contributions: number;
  withdrawals: number;
  net: number;
}

export interface InvestmentAllocationSlice {
  label: string;
  value: number;
}

export interface InvestmentMovement {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: string;
  equityId?: string;
}

export interface InvestmentWorkspaceTotals {
  currentValue: number;
  investedCapital: number;
  netGain: number;
  netGainPct: number;
  averageTicket: number;
  averageContribution: number;
}

export interface InvestmentWorkspaceSnapshot {
  equities: Equity[];
  holdings: InvestmentHoldingSummary[];
  totals: InvestmentWorkspaceTotals;
  allocation: InvestmentAllocationSlice[];
  flows: InvestmentFlowPoint[];
  recentMovements: InvestmentMovement[];
}

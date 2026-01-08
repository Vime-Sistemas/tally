export type Page = 
  | 'dashboard-summary' 
  | 'dashboard-goals' 
  | 'transactions-new' 
  | 'transactions-history' 
  | 'accounts-new' 
  | 'accounts-list' 
  | 'cashflow-future'
  | 'budgets'
  | 'debts'
  | 'reports' 
  | 'equity-list' 
  | 'equity-new' 
  | 'profile' 
  | 'signup' 
  | 'login'
  | 'releases'
  | 'params-categories'
  | 'params-tags'
  | 'planner-clients'
  | 'planner-dashboard';

export type AppContext = 'PERSONAL' | 'BUSINESS';

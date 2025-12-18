export type Page = 
  | 'dashboard-summary' 
  | 'dashboard-goals' 
  | 'transactions-new' 
  | 'transactions-history' 
  | 'accounts-new' 
  | 'accounts-list' 
  | 'reports' 
  | 'equity-list' 
  | 'equity-new' 
  | 'profile' 
  | 'signup' 
  | 'login'
  | 'releases';

export type AppContext = 'PERSONAL' | 'BUSINESS';

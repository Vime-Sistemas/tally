export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}
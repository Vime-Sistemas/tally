export type EquityType = 
  | 'real-estate-house' 
  | 'real-estate-apt' 
  | 'real-estate-land'
  | 'vehicle-car' 
  | 'vehicle-motorcycle' 
  | 'business' 
  | 'stocks' 
  | 'crypto' 
  | 'jewelry' 
  | 'art' 
  | 'electronics' 
  | 'cash'
  | 'other';

export interface Equity {
  id: string;
  name: string;
  type: EquityType;
  value: number;
  cost: number;
  acquisitionDate: string;
  description?: string;
  color?: string; // For the wallet card look
  createdAt: string;
  updatedAt: string;
}

export type CreateEquityDTO = Omit<Equity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEquityDTO = Partial<CreateEquityDTO> & { id: string };

export const EQUITY_TYPES: { value: EquityType; label: string; group: string }[] = [
  { value: 'real-estate-house', label: 'Casa', group: 'Imóveis' },
  { value: 'real-estate-apt', label: 'Apartamento', group: 'Imóveis' },
  { value: 'real-estate-land', label: 'Terreno / Lote', group: 'Imóveis' },
  { value: 'vehicle-car', label: 'Carro', group: 'Veículos' },
  { value: 'vehicle-motorcycle', label: 'Moto', group: 'Veículos' },
  { value: 'business', label: 'Empresa / Participação', group: 'Participações' },
  { value: 'stocks', label: 'Ações / Fundos', group: 'Investimentos' },
  { value: 'crypto', label: 'Criptomoedas', group: 'Investimentos' },
  { value: 'cash', label: 'Dinheiro em Espécie', group: 'Liquidez' },
  { value: 'jewelry', label: 'Joias / Relógios', group: 'Bens Pessoais' },
  { value: 'art', label: 'Obras de Arte', group: 'Bens Pessoais' },
  { value: 'electronics', label: 'Eletrônicos (MacBook, iPhone...)', group: 'Bens Pessoais' },
  { value: 'other', label: 'Outro', group: 'Outros' },
];

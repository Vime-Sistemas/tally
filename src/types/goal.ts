export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDTO {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  category: string;
  color: string;
}

export interface UpdateGoalDTO extends Partial<CreateGoalDTO> {
  id: string;
}

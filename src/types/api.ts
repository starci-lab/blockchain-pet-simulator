export interface ResponseItemDto {
  _id: string;
  name: string;
  type: "food" | "toy" | "clean" | "furniture" | "background";
  description: string;
  cost_nom: number;
  effect?: {
    hunger?: number;
    happiness?: number;
    cleanliness?: number;
    duration?: number;
  };
  image_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponsePetTypeDto {
  _id: string;
  name: string;
  description?: string;
  image_url?: string;
  default_stats: {
    happiness: number;
    last_update_happiness: string;
    hunger: number;
    last_update_hunger: string;
    cleanliness: number;
    last_update_cleanliness: string;
  };
  stat_decay: {
    happiness: { min: number; max: number };
    hunger: { min: number; max: number };
    cleanliness: { min: number; max: number };
  };
  time_natural: number;
  max_income: number;
  income_per_claim: number;
  max_income_per_claim: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreApiResponse {
  food: ResponseItemDto[];
  toy: ResponseItemDto[];
  clean: ResponseItemDto[];
  furniture: ResponseItemDto[];
  background: ResponseItemDto[];
  pet: ResponsePetTypeDto[];
}

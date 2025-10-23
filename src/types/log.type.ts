import type { FoodResponse  , IngredientResponse} from './food.type';
import type { NutritionResponse,MealSlot } from './types';

export interface LogResponse {
    id: string;
    mealSlot: MealSlot;
    food: FoodResponse;
    nameFood: string;
    portion: number;
    actualNutrition: NutritionResponse;
    ingredients: PlanLogIngredientResponse[];
}

export interface PlanLogIngredientResponse {
  id : string;
  quantity : number;
  ingredient: IngredientResponse;
}

export interface PlanLogManualRequest {
    date: string; 
    mealSlot: MealSlot;
    foodId?: string | null;
    nameFood: string;
    consumedServings: number;
    totalNutrition: {
      kcal: number;
      proteinG: number;
      carbG: number;
      fatG: number;
      fiberG: number;
      sodiumMg: number;
      sugarMg: number;
    };
    ingredients: Array<{
      id: string;
      qty: number;
    }>;
};

export interface PlanLogUpdateRequest {
  mealSlot: MealSlot;
  foodId?: string | null;
  nameFood: string;
  consumedServings: number;
  totalNutrition: {
    kcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
    fiberG: number;
    sodiumMg: number;
    sugarMg: number;
  };
  ingredients: Array<{
    id: string;
    qty: number;
  }>;
}

export interface KcalWarningResponse{
  mealSlot: string;  
  targetKcal:number; 
  actualKcal:number; 
  diff:number;       
  status: 'OVER' | 'UNDER' | 'OK'; 
}
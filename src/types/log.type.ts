import type { FoodResponse  } from './food.type';
import type { NutritionResponse,MealSlot } from './types';

export interface LogResponse {
    id: string;
    mealSlot: MealSlot;
    food: FoodResponse;
    nameFood: string;
    portion: number;
    actualNutrition: NutritionResponse;
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
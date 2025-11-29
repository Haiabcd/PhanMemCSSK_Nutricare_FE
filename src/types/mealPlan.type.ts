import { NutritionResponse, MealSlot } from './types';
import { FoodResponse } from './food.type';

export interface MealPlanItemResponse {
   id: string;
   mealSlot: string;
   food: FoodResponse;
   portion: number;
   rank: number;
   note: string;
   nutrition: NutritionResponse;
   used: boolean;
   swapped: boolean;
}


export interface MealPlanResponse {
   id: string;
   user: string;
   date: string; // ISO date string
   targetNutrition: NutritionResponse;
   waterTargetMl: number;
   items: MealPlanItemResponse[];
}

export interface SwapCandidate {
   foodId: string;
   foodName: string;
   portion: number;
   reason: string | null;
   imageUrl: string | null;
}

export interface SwapSuggestion {
   itemId: string | null;
   slot: MealSlot | string;
   originalFoodId: string | null;
   originalFoodName: string | null;
   originalPortion: number | null;
   candidates: SwapCandidate[];
}

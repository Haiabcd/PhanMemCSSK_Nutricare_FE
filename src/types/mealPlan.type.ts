import { NutritionResponse, MealSlot } from './types';
import { FoodResponse } from './food.type';

export interface MealPlanItemResponse {
   id: string;
   mealSlot: string;
   food : FoodResponse;
   portion:number;
   rank:number;
   note:string;
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
   reason: string;
   imageUrl: string;
 }
 
 export interface SwapSuggestion {
   itemId: string;
   slot: MealSlot | string; 
   originalFoodId: string;
   originalFoodName: string;
   originalPortion: number;
   candidates: SwapCandidate[]; 
 }
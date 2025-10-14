import type { FoodResponse, MealSlot } from './food.type';
import type { NutritionResponse } from './types';

export interface LogResponse {
    id: string;
    date: string;
    mealSlot: MealSlot;
    food: FoodResponse;
    isFromPlan: boolean;
    portion: number;
    actualNutrition: NutritionResponse;
}
import { NutritionResponse } from "./types";
import { MealSlot } from "./types";


export interface FoodResponse {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    servingName: string;
    servingGram: number;
    cookMinutes: number;
    defaultServing:number;
    nutrition: NutritionResponse;
    isIngredient: boolean;
    mealSlots: MealSlot[];
    tags: string[];
}

export interface IngredientResponse{
    id: string;
    name: string;
    per100: NutritionResponse;
    imageUrl: string;
    aliases: string[];
    servingName: string;
    servingSizeGram: number;
    unit: string;
    tags: string[];
}
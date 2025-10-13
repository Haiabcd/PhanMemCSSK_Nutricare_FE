import { NutritionResponse } from "./types";

export type MealSlot = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';


export interface FoodResponse {
    id: string;
    name:string;
    description:string;
    imageUrl:string;
    servingName:string;
    servingGram: number;
    cookMinutes:number;
    nutrition: NutritionResponse;
    isIngredient : boolean;
    mealSlots: MealSlot[];
    tags: string[];
 }

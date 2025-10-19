import type { NutritionResponse } from "./types";
export interface FoodAnalyzeResponse{
    name: string;
    servingGram : number;
    nutrition: NutritionResponse;
    ingredients: string[];
    confidence: number;
}

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

export interface PlanLogScanRequest {
  date: string; 
  mealSlot: MealSlot;
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

export type IngredientBreakdown = {
  requestedName: string;
  ingredientId?: string | null;    // UUID dạng string
  matchedName?: string | null;
  aliasMatched?: string | null;
  gram?: number | null;            // gram đã quy đổi
  per100?: NutritionResponse | null; // dinh dưỡng /100g từ DB
  subtotal?: NutritionResponse | null; // per100 * (gram/100)
  missing?: boolean | null;
};

export type NutritionAudit = {
  dishName: string;
  servingName?: string | null;
  servingGram?: number | null;
  items: IngredientBreakdown[];       // bảng chi tiết từng nguyên liệu
  totalFromDB: NutritionResponse;     // tổng dinh dưỡng tính từ DB
};
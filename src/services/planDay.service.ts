import { api } from '../config/api';
import type { ApiResponse } from '../types/types';
import type { MealPlanResponse } from '../types/mealPlan.type';


// Lấy meal plan tuần hiện tại (Thứ 2 -> CN)
export async function getMealPlanByDate(
  date: string,
  signal?: AbortSignal
): Promise<ApiResponse<MealPlanResponse>> {
  const res = await api.get<ApiResponse<MealPlanResponse>>('/meal-plans', {
    params: { date },
    signal,
  });
  return res.data;
}



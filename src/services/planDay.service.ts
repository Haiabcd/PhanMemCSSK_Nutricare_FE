import { api } from '../config/api';
import type { ApiResponse } from '../types/types';
import type { MealPlanResponse, SwapSuggestion } from '../types/mealPlan.type';


// Lấy meal plan theo ngày
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

// Đổi kế hoạch
export async function smartSwapMealItem(
  itemId: string,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  const res = await api.put<ApiResponse<void>>(
    `/meal-plans/${itemId}/swap`,
    null,
    { signal }
  );
  return res.data;
}

// Lấy danh sách gợi ý swap cho các item trong ngày
export async function getSwapSuggestions(
  signal?: AbortSignal
): Promise<ApiResponse<SwapSuggestion[]>> {
  const res = await api.get<ApiResponse<SwapSuggestion[]>>(
    '/meal-plans/suggest',
    { signal }
  );
  return res.data;
}
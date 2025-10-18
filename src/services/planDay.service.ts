import { api } from '../config/api';
import type { ApiResponse ,MealSlot} from '../types/types';
import type { MealPlanResponse } from '../types/mealPlan.type';
import type { FoodResponse } from '../types/food.type';


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


//Hàm đề xuất
export async function suggestAllowedFoods(
  opts: { slot?: MealSlot; limit?: number } = {},
  signal?: AbortSignal
): Promise<ApiResponse<FoodResponse[]>> {
  const { slot, limit } = opts;

  const safeLimit =
    typeof limit === 'number' ? Math.min(Math.max(limit, 1), 100) : undefined;

  const res = await api.get<ApiResponse<FoodResponse[]>>('/meal-plans/suggest', {
    params: { slot, limit: safeLimit },
    signal,
  });
  return res.data;
}
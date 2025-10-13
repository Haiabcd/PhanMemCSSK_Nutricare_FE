import { api } from '../config/api';
import type { ApiResponse } from '../types/types';
import type { FoodResponse } from '../types/food.type';

// Lấy thông tin món ăn theo id
export async function getFoodById(
  id: string,
  signal?: AbortSignal
): Promise<FoodResponse> {
  const res = await api.get<ApiResponse<FoodResponse>>(`/foods/${id}`, {
    signal,
  });
  return res.data.data!;
}

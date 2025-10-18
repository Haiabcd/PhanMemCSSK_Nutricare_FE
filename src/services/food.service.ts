import { api } from '../config/api';
import type { ApiResponse } from '../types/types';
import type { FoodResponse, IngredientResponse } from '../types/food.type';

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

export async function autocompleteFoods(
  keyword: string,
  limit = 10,
  signal?: AbortSignal
): Promise<FoodResponse[]> {
  if (!keyword?.trim()) return [];
  const res = await api.get<ApiResponse<FoodResponse[]>>('/foods/autocomplete', {
    params: { keyword, limit },
    signal,
  });
  return res.data.data ?? [];
}

export async function autocompleteIngredients(
  keyword: string,
  limit = 10,
  signal?: AbortSignal
): Promise<IngredientResponse[]> {
  if (!keyword?.trim()) return [];
  const res = await api.get<ApiResponse<IngredientResponse[]>>('/ingredients/autocomplete', {
    params: { keyword, limit },
    signal,
  });
  return res.data.data ?? [];
}
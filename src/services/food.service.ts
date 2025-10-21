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
) {
  if (!keyword?.trim()) return [];

  const res = await api.get('/foods/autocomplete', {
    params: {
      keyword: encodeURIComponent(keyword.trim()), // 👈 encode
      limit,
    },
    // với axios v1 có thể ép serializer an toàn:
    paramsSerializer: {
      encode: (val) => encodeURIComponent(String(val)),
      serialize: (params) => new URLSearchParams(params as any).toString(),
    },
    signal,
  });
  return (res.data as any)?.data ?? [];
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
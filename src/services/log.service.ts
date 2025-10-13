
import { api } from '../config/api';
import type { ApiResponse } from '../types/types';

// Lưu log cho một mục trong meal plan
export async function savePlanLogById(
  mealPlanItemId: string,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  const res = await api.post<ApiResponse<void>>(
    '/logs/plan',
    { mealPlanItemId },
    { signal }
  );
  return res.data;
}

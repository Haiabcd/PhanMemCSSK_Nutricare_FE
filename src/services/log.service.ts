
import { api } from '../config/api';
import type { ApiResponse , NutritionResponse} from '../types/types';

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

// Lấy dinh dưỡng đã dùng mỗi ngày
export async function getDailyNutrition(dateIso: string, signal?: AbortSignal) {
  const res = await api.get<ApiResponse<NutritionResponse>>('/logs/nutriLog', {
    params: { date: dateIso },
    signal, 
  });
  return res.data.data!;
}

// Xoá log cho một mục trong meal plan
export async function deletePlanLogById(
  mealPlanItemId: string,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  const res = await api.delete<ApiResponse<void>>(
    '/logs/plan', {
    data: { mealPlanItemId },
    signal,
  });
  return res.data;
}
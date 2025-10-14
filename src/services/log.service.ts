
import { api } from '../config/api';
import type { ApiResponse } from '../types/types';

import axios from 'axios';
import type { LogResponse } from '../types/log.type';
import type { MealSlot } from '../types/types';

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

export const getLogs = async (
  date: string,
  mealSlot?: MealSlot,
  signal?: AbortSignal
): Promise<LogResponse[]> => {
  try {
    const params: Record<string, any> = { date };
    if (mealSlot) params.mealSlot = mealSlot;

    const res = await api.get<ApiResponse<LogResponse[]>>('/logs', { params, signal });
    const result = res.data;

    if (result?.code === 1000) {
      return Array.isArray(result.data) ? result.data : [];
    }

    console.warn('getLogs non-success code:', result?.code, result?.message);
    return [];
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('⏹ Request canceled by user');
      return [];
    }
    console.error('Error fetching logs:', error);
    throw error;
  }
};

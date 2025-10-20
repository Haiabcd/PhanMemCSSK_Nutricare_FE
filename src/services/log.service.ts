
import { api } from '../config/api';
import type { ApiResponse , NutritionResponse} from '../types/types';
import axios from 'axios';
import type { LogResponse,PlanLogManualRequest, PlanLogUpdateRequest } from '../types/log.type';
import type { FoodAnalyzeResponse } from '../types/ai.type';
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
  mealSlot: MealSlot,
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

// Lấy dinh dưỡng đã dùng mỗi ngày
export async function getDailyNutrition(dateIso: string, signal?: AbortSignal) {
  const res = await api.get<ApiResponse<NutritionResponse>>('/logs/nutriLog', {
    params: { date: dateIso },
    signal, 
  });
  return res.data.data!;
}

// Xoá 1 plan log theo id
export async function deletePlanLogById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  const res = await api.delete<ApiResponse<void>>(`/logs/${id}`, { signal });
  return res.data;
}


export async function saveManualLog(
  payload: PlanLogManualRequest,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  const res = await api.post<ApiResponse<void>>('/logs/save/manual', payload, { signal });
  return res.data;
}

export async function saveAILog(
  asset: { uri: string; type?: string; fileName?: string },
  signal?: AbortSignal
): Promise<FoodAnalyzeResponse> {
  const form = new FormData();

  form.append(
    'image',
    {
      uri: asset.uri,                   
      type: asset.type || 'image/jpeg', 
      name: asset.fileName || 'photo.jpg', 
    } as any
  );
  const res = await api.post<ApiResponse<FoodAnalyzeResponse>>(
    '/meallog-ai/analyze-url',
    form,
    { 
      signal, 
      headers: {Authorization: undefined,},
    },
  );
  return res.data.data!;
}

export async function updatePlanLog(
  planLogId: string,
  payload: PlanLogUpdateRequest,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  const body = payload;

  const res = await api.put<ApiResponse<void>>(
    `/logs/${planLogId}`, 
    body,
    { signal }
  );
  return res.data;
}
import { api } from '../config/api';
import type { Condition, ApiResponse, PageableResponse } from '../types/types';
import axios from 'axios';

//Lấy danh sách bệnh nền
export const getAllConditions = async (
  signal?: AbortSignal,
  size: number = 20
): Promise<Condition[]> => {
  try {
    const res = await api.get<ApiResponse<PageableResponse<Condition>>>(
      '/conditions/all',
      {
        params: { page: 0, size, sort: ['createdAt,desc', 'id,desc'] },
        signal,
      }
    );
    const result = res.data;
    if (result.code === 1000) {
      return result.data.content;
    }
    return [];
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('⏹ Request canceled by user');
      return [];
    }
    console.error('Error fetching conditions:', error);
    throw error;
  }
};

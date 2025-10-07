import { api } from '../config/api';
import type { Condition, ApiResponse, PageableResponse } from '../types/types';
import axios from 'axios';


/**
 * Lấy tất cả bệnh nền (gộp tất cả các trang)
 */
export const getAllConditionsComplete = async (
  signal?: AbortSignal
): Promise<Condition[]> => {

  let allConditions: Condition[] = [];
  let page = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await api.get<ApiResponse<PageableResponse<Condition>>>(
        '/conditions/all',
        {
          params: { page, size: 30, sort: ['createdAt,desc', 'id,desc'] },
          signal,
        }
      );

      const result = response.data;
      if (result.code === 1000) {
        allConditions = [...allConditions, ...result.data.content];
        hasMore = !result.data.last;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allConditions;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('⏹ Request canceled by user');
    } else {
      console.error('Error fetching all conditions:', error);
    }
    throw error;
  }
};

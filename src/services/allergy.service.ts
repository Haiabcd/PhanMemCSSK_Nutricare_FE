import { api } from '../config/api';
import type { Allergy, ApiResponse, PageableResponse } from '../types/types';
import axios from 'axios';

/**
 * 🧩 Lấy tất cả dị ứng (gộp tất cả các trang)
 */
export const getAllAllergiesComplete = async (
    signal?: AbortSignal
): Promise<Allergy[]> => {
    let allAllergies: Allergy[] = [];
    let page = 0;
    let hasMore = true;

    try {
        while (hasMore) {
            const response = await api.get<ApiResponse<PageableResponse<Allergy>>>(
                '/allergies/all',
                {
                    params: { page, size: 30, sort: ['createdAt,desc', 'id,desc'] },
                    signal, // ✅ hủy request khi unmount
                }
            );

            const result = response.data;

            if (result.code === 1000) {
                allAllergies = [...allAllergies, ...result.data.content];
                hasMore = !result.data.last;
                page++;
            } else {
                hasMore = false;
            }
        }

        return allAllergies;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('⏹ Request canceled by user');
        } else {
            console.error('Error fetching all allergies:', error);
        }
        throw error;
    }
};

import { api } from '../config/api';
import type { Allergy, ApiResponse, PageableResponse } from '../types/types';
import axios from 'axios';

// Lấy tất cả dị ứng
export const getAllAllergies = async (
    signal?: AbortSignal,
    size: number = 20
): Promise<Allergy[]> => {
    try {
        const res = await api.get<ApiResponse<PageableResponse<Allergy>>>(
            '/allergies/all',
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

        console.error('Error fetching allergies:', error);
        throw error;
    }
};

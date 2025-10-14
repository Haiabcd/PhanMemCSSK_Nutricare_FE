import { api } from '../config/api';
import type { ApiResponse } from '../types/types';
import axios from 'axios';
import type { WaterLogCreationRequest } from '../types/types';


export const createWaterLog = async (
    request: WaterLogCreationRequest,
    signal?: AbortSignal
): Promise<boolean> => {
    try {
        const res = await api.post<ApiResponse<void>>('/water-logs', request, { signal });
        const result = res.data;

        if (result.code === 1000) {
            return true;
        }
        console.warn('createWaterLog non-success code:', result.code, result.message);
        return false;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('⏹ Request canceled by user');
            return false;
        }
        console.error('Error creating water log:', error);
        throw error;
    }
};


export const getTotalWaterByDate = async (
    date: string,
    signal?: AbortSignal
): Promise<number> => {
    try {
        const res = await api.get<ApiResponse<number>>('/water-logs/log', {
            params: { date },
            signal,
        });

        const result = res.data;
        if (result?.code === 1000) {
            return result.data ?? 0;
        }
        console.warn('getTotalWaterByDate non-success code:', result?.code, result?.message);
        return 0;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('⏹ Request canceled by user');
            return 0;
        }
        console.error('Error fetching total water by date:', error);
        throw error;
    }
};

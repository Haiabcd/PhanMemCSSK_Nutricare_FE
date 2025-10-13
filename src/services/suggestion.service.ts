// src/services/meal-plan.service.ts
import { api } from '../config/api';
import type { ApiResponse, PageableResponse } from '../types/types';
import type { FoodResponse } from '../types/food.type';
import axios from 'axios';

/** Tạo trang rỗng phòng khi BE trả code != 1000 hoặc lỗi khác */
const emptyPage = <T>(): PageableResponse<T> => ({
    content: [],
    pageable: {
        pageNumber: 0,
        pageSize: 0,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        paged: false,
        unpaged: true,
    },
    size: 0,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
});

//Danh sách món ăn gợi ý sắp tới (theo ngày hiện tại trở đi)
export const getUpcomingFoods = async (
    page: number = 0,
    size: number = 5,
    signal?: AbortSignal
): Promise<PageableResponse<FoodResponse>> => {
    try {
        const res = await api.get<ApiResponse<PageableResponse<FoodResponse>>>(
            '/meal-plans/suggestions',
            {
                params: { page, size },
                signal,
            }
        );
        const result = res.data;
        if (result.code === 1000 && result.data) {
            return result.data;
        }
        return emptyPage<FoodResponse>();
    } catch (error) {
        if (axios.isCancel(error)) {
            return emptyPage<FoodResponse>();
        }
        throw error;
    }
};

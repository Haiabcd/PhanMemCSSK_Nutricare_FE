import { api } from '../config/api';
import type { ApiResponse } from '../types/types';
import type { StatisticWeekResponse, StatisticMonthResponse } from '../types/statistic.type'; // nơi bạn khai báo interfaces ở bước trước


/** Thống kê theo tuần */
export async function getWeeklyStats(
    signal?: AbortSignal
): Promise<ApiResponse<StatisticWeekResponse>> {
    const res = await api.get<ApiResponse<StatisticWeekResponse>>(
        '/statistics/week',
        { signal }
    );
    return res.data;
}

/** Thống kê theo tháng (nếu có endpoint tương ứng @GetMapping("/month")) */
export async function getMonthlyStats(
    signal?: AbortSignal
): Promise<ApiResponse<StatisticMonthResponse>> {
    const res = await api.get<ApiResponse<StatisticMonthResponse>>(
        '/statistics/month',
        { signal }
    );
    return res.data;
}

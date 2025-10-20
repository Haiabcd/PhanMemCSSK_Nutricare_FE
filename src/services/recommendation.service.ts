import { api } from '../config/api';
import type { RecommendationItemDto } from '../types/recommendation.type';

/**
 * Gọi BE trả về mảng bài viết/video/meal cho newsfeed
 * - Ưu tiên GET /recommendations/findNewsfeed?limit=...
 * - Fallback POST (không body) nếu GET lỗi (một số BE chỉ mở POST)
 * - Trả về: RecommendationItemDto[]
 */
export async function findNewsfeedRecommendations(
    limit: number = 12,
    signal?: AbortSignal
): Promise<RecommendationItemDto[]> {
    try {
        const res = await api.post<any>(
            '/recommendations/findNewsfeed',
            undefined,
            {
                params: { limit },
                signal,
                timeout: 15000,
                transformRequest: [(data, headers) => {
                    if (!data && headers) delete (headers as any)['Content-Type'];
                    return data as any;
                }],
            }
        );
        const data = res?.data?.data ?? [];
        if (__DEV__) {
            console.log('[Reco][POST ok] /recommendations/findNewsfeed', {
                status: res.status,
                count: Array.isArray(data) ? data.length : 0,
            });
        }
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('[Reco] ❌ POST /recommendations/findNewsfeed lỗi:', err);
        throw err;
    }
}

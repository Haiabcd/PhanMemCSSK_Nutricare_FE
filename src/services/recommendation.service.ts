import { api } from '../config/api';
import type { RecommendationItemDto } from '../types/recommendation.type';


export async function findNewsfeedRecommendations(
    limit: number = 40,
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
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('[Reco] ❌ POST /recommendations/findNewsfeed lỗi:', err);
        throw err;
    }
}

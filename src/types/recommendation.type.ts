/** Dữ liệu item từ BE */
export type RecommendationItemDto = {
    type?: 'article' | 'video' | 'meal' | string;
    title?: string;
    url?: string | null;
    source?: string | null;
    imageUrl?: string | null;
    published?: string | null; // ISO-8601 | null
};
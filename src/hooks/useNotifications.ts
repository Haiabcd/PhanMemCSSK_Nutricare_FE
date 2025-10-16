// src/hooks/useNotifications.ts
import { useEffect, useMemo, useState, useCallback } from 'react';
import { NotiHistoryItem, readNotiHistory, subscribeNotiHistory } from '../storage/notifications';

type UIType = 'meal' | 'water' | 'reminder' | 'suggestion';

export type UINotification = {
    id: string;
    type: UIType;
    title: string;
    message: string;
    at: Date;
};

export function formatDayLabel(d: Date) {
    const now = new Date();
    const dd = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = dd(now).getTime();
    const that = dd(d).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (that === today) return 'Hôm nay';
    if (that === today - oneDay) return 'Hôm qua';
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}/${mon}/${yr}`;
}

function mapKindToUIType(kind: string): UIType {
    if (kind === 'meal-pre' || kind === 'meal-post') return 'meal';
    // bạn có thể mở rộng mapping sau này
    return 'reminder';
}

export function useNotifications() {
    const [items, setItems] = useState<NotiHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        const data = await readNotiHistory();
        setItems(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
        const unsub = subscribeNotiHistory(setItems);
        return () => unsub();
    }, [refresh]);

    // chuyển sang UI shape
    const uiItems = useMemo<UINotification[]>(
        () =>
            items.map((it) => ({
                id: it.id,
                type: mapKindToUIType(it.kind),
                title: it.title,
                message: it.message,
                at: new Date(it.at),
            })),
        [items],
    );

    // nhóm theo “Hôm nay/Hôm qua/dd/MM/yyyy”
    const sections = useMemo(() => {
        const groups = new Map<string, UINotification[]>();
        for (const n of uiItems) {
            const key = formatDayLabel(n.at);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(n);
        }
        // đảm bảo mỗi nhóm theo thời gian mới -> cũ
        for (const arr of groups.values()) {
            arr.sort((a, b) => b.at.getTime() - a.at.getTime());
        }
        // sắp xếp nhóm: hôm nay -> hôm qua -> ngày khác (mới -> cũ)
        const tuples = Array.from(groups.entries());
        tuples.sort((a, b) => {
            const keyRank = (k: string) => (k === 'Hôm nay' ? 0 : k === 'Hôm qua' ? 1 : 2);
            const ra = keyRank(a[0]);
            const rb = keyRank(b[0]);
            if (ra !== rb) return ra - rb;
            // cùng rank 2: sort theo ngày label mới -> cũ
            if (ra === 2) {
                // parse dd/MM/yyyy
                const parse = (s: string) => {
                    const [d, m, y] = s.split('/').map(Number);
                    return new Date(y, m - 1, d).getTime();
                };
                return parse(b[0]) - parse(a[0]);
            }
            return 0;
        });
        return tuples;
    }, [uiItems]);

    return { loading, sections, refresh };
}

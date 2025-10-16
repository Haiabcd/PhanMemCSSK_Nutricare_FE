// src/storage/notifications.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotiKind = 'meal-pre' | 'meal-post' | 'other';
export type MealKey = 'breakfast' | 'lunch' | 'dinner';

export type NotiHistoryItem = {
    id: string;
    title: string;
    message: string;
    at: string;          // ISO string
    kind: NotiKind;      // 'meal-pre' | 'meal-post' | 'other'
    meal?: MealKey;
};

const KEY = '@noti_history_v1';

let listeners: Array<(items: NotiHistoryItem[]) => void> = [];
function notify(items: NotiHistoryItem[]) {
    listeners.forEach(fn => fn(items));
}

export async function readNotiHistory(): Promise<NotiHistoryItem[]> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as NotiHistoryItem[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function appendNotiHistory(item: NotiHistoryItem): Promise<void> {
    const list = await readNotiHistory();
    // tránh trùng id
    const dedup = list.filter(x => x.id !== item.id);
    const next = [item, ...dedup].slice(0, 300); // giới hạn 300 dòng gần nhất
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    notify(next);
}

export async function clearNotiHistory(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
    notify([]);
}

export function subscribeNotiHistory(cb: (items: NotiHistoryItem[]) => void) {
    listeners.push(cb);
    // trả về hàm huỷ đăng ký
    return () => {
        listeners = listeners.filter(fn => fn !== cb);
    };
}

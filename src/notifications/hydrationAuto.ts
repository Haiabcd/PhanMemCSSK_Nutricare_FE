// src/notifications/hydrationAuto.ts
import {
    ensureHydrationReady,
    scheduleHydrationRange,
    subscribeHydrationForeground,
    hydrationBackgroundHandler,
} from './hydrationScheduler';
import { getUserGoal } from '../services/userGoal.service';
import notifee from '@notifee/react-native';

/** Đăng ký foreground events cho Hydration (độc lập với meal) */
export function registerHydrationForeground() {
    return subscribeHydrationForeground();
}

/** Đăng ký background listener riêng CHỈ CHO hydration, không thay đổi handler cũ */
export function registerHydrationBackground() {
    // đăng ký thêm 1 listener – Notifee cho phép nhiều listener song song
    return notifee.onBackgroundEvent(hydrationBackgroundHandler);
}

/** Bootstrap: xin quyền + lấy goal + lên lịch 7 ngày (nhắc trước 5') */
export async function bootstrapHydrationSchedule(days = 7) {
    const goal = await getUserGoal();
    await ensureHydrationReady();
    await scheduleHydrationRange(goal, days);
}

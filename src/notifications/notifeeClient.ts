import notifee, {
    AndroidImportance,
    TimestampTrigger,
    TriggerType,
    EventType,
    AndroidAction,
    AuthorizationStatus,
} from '@notifee/react-native';
import { Alert, Platform, Linking } from 'react-native';

/** ✅ Khởi tạo quyền + kênh, tự mở Settings nếu bị chặn hoặc giới hạn nền */
export async function ensureNotificationReady() {
    await notifee.createChannel({
        id: 'meal',
        name: 'Meal Reminders',
        importance: AndroidImportance.HIGH,
    });

    const settings = await notifee.getNotificationSettings();

    if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        console.log('[PERM] OK: Notifications authorized');
        return;
    }

    const perm = await notifee.requestPermission();
    if (perm.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        console.log('[PERM] Granted after request');
        return;
    }

    if (Platform.OS === 'android') {
        Alert.alert(
            'Bật thông báo & quyền nền',
            'NutriCare cần quyền thông báo, báo thức và tắt tối ưu pin để nhắc giờ ăn.',
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Mở Cài đặt',
                    onPress: async () => {
                        try {
                            await notifee.openNotificationSettings();
                        } catch {
                            await Linking.openSettings().catch(() => { });
                        }
                        Alert.alert(
                            '⚙️ Bước tiếp theo',
                            'Hãy kiểm tra:\n\n1️⃣ Cài đặt > Ứng dụng > NutriCare > Quyền đặc biệt > Báo thức và nhắc nhở → BẬT\n2️⃣ Cài đặt > Pin > Không giới hạn / Không tối ưu hóa cho NutriCare',
                        );
                    },
                },
            ],
        );
    }
}

/* ========= Định nghĩa chính ========= */
type MealKey = 'breakfast' | 'lunch' | 'dinner';

export const MEALS: Record<
    MealKey,
    { startHour: number; endHour: number; title: string }
> = {
    breakfast: { startHour: 6, endHour: 8, title: 'Bữa sáng' },
    lunch: { startHour: 12, endHour: 13, title: 'Bữa trưa' },
    dinner: { startHour: 17, endHour: 19, title: 'Bữa chiều' },
};

function ymd(d: Date) {
    return d.toISOString().slice(0, 10).replace(/-/g, '');
}
function parseYmd(s?: string) {
    if (!s) return new Date();
    return new Date(
        Number(s.slice(0, 4)),
        Number(s.slice(4, 6)) - 1,
        Number(s.slice(6, 8)),
    );
}
export function makeId(meal: MealKey, date: Date, kind: 'pre' | 'post') {
    return `meal-${meal}-${ymd(date)}-${kind}`;
}

const MARK_EATEN_ACTION_ID = 'mark-eaten';
const actions: AndroidAction[] = [
    { title: '✅ Đã ăn rồi', pressAction: { id: MARK_EATEN_ACTION_ID } },
];

const preTitle = (t: string) => `Sắp đến ${t}`;
const preBody = (t: string) =>
    `Còn 30 phút nữa là đến giờ ăn ${t}. Mở NutriCare để chọn món hoặc ghi nhanh nhé!`;
const postTitle = (t: string) => `Nhắc ${t}`;
const postBody = (t: string) =>
    `Bạn đã ghi món cho ${t} chưa? Nếu chưa, mở NutriCare để theo dõi đúng mục tiêu nhé.`;

/** Huỷ nhắc “sau ăn” */
export async function cancelPostReminder(meal: MealKey, date: Date) {
    await notifee.cancelNotification(makeId(meal, date, 'post'));
}

/** PRE: nổ 30' trước startHour (auto lăn sang ngày sau nếu đã trễ) */
export async function schedulePreOnly(meal: MealKey, forDate: Date) {
    await ensureNotificationReady();
    const def = MEALS[meal];

    // mốc start của NGÀY đó (hh:00)
    const start = new Date(forDate);
    start.setHours(def.startHour, 0, 0, 0);

    // nổ 30 phút trước giờ start
    let fireTime = new Date(start.getTime() - 30 * 60 * 1000);

    // nếu đã trễ → đẩy sang ngày sau
    if (fireTime.getTime() <= Date.now()) {
        const tomorrowStart = new Date(start);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        fireTime = new Date(tomorrowStart.getTime() - 30 * 60 * 1000);
    }

    const id = makeId(meal, fireTime, 'pre');
    await notifee.cancelNotification(id);

    const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: fireTime.getTime(),
        alarmManager: { allowWhileIdle: true },
    };

    await notifee.createTriggerNotification(
        {
            id,
            android: { channelId: 'meal', pressAction: { id: 'default' } },
            title: preTitle(MEALS[meal].title),
            body: preBody(MEALS[meal].title),
            data: { meal, kind: 'pre', date: ymd(fireTime) },
        },
        trigger,
    );
}

/** POST: nổ 30' sau endHour (auto lăn sang ngày sau nếu đã trễ) */
export async function schedulePostOnly(meal: MealKey, forDate: Date) {
    await ensureNotificationReady();
    const def = MEALS[meal];

    // mốc end của NGÀY đó (hh:00)
    const end = new Date(forDate);
    end.setHours(def.endHour, 0, 0, 0);

    // nổ 30 phút sau giờ end
    let fireTime = new Date(end.getTime() + 30 * 60 * 1000);

    // nếu đã trễ → đẩy sang ngày sau
    if (fireTime.getTime() <= Date.now()) {
        const tomorrowEnd = new Date(end);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        fireTime = new Date(tomorrowEnd.getTime() + 30 * 60 * 1000);
    }

    const id = makeId(meal, fireTime, 'post');
    await notifee.cancelNotification(id);

    const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: fireTime.getTime(),
        alarmManager: { allowWhileIdle: true },
    };

    await notifee.createTriggerNotification(
        {
            id,
            android: {
                channelId: 'meal',
                pressAction: { id: 'default' },
                actions,
            },
            title: postTitle(MEALS[meal].title),
            body: postBody(MEALS[meal].title),
            data: { meal, kind: 'post', date: ymd(fireTime) },
        },
        trigger,
    );
}

/** Đủ bộ pre + post cho 1 bữa của 1 ngày */
export async function scheduleMealDay(meal: MealKey, forDate: Date) {
    await schedulePreOnly(meal, forDate);
    await schedulePostOnly(meal, forDate);
}

/** Lên lịch 3 bữa cho N ngày tới (mặc định 7) */
export async function schedulePrePostRange(daysAhead = 7) {
    await ensureNotificationReady();
    const base = new Date();
    for (let i = 0; i <= daysAhead; i++) {
        const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
        await scheduleMealDay('breakfast', d);
        await scheduleMealDay('lunch', d);
        await scheduleMealDay('dinner', d);
    }
}

/** Gọi khi user tick “đã ăn” để huỷ post của ngày đó */
export async function onMealLogged(meal: MealKey, date: Date) {
    await cancelPostReminder(meal, date);
}

/** Foreground handler */
export function registerForegroundHandlers() {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
        if (
            type === EventType.ACTION_PRESS &&
            detail.pressAction?.id === MARK_EATEN_ACTION_ID
        ) {
            const meal = (detail.notification?.data?.meal as MealKey) || 'breakfast';
            const dateStr = detail.notification?.data?.date as string | undefined;
            await cancelPostReminder(meal, parseYmd(dateStr));
        }
    });
}

/** Background handler */
export const registerBackgroundHandler = () =>
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (
            type === EventType.ACTION_PRESS &&
            detail.pressAction?.id === MARK_EATEN_ACTION_ID
        ) {
            const meal = (detail.notification?.data?.meal as MealKey) || 'breakfast';
            const dateStr = detail.notification?.data?.date as string | undefined;
            await cancelPostReminder(meal, parseYmd(dateStr));
        }
    });

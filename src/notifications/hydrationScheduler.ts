// src/notifications/hydrationScheduler.ts
import notifee, {
    AndroidImportance,
    TimestampTrigger,
    TriggerType,
    EventType,
    AndroidAction,
    AuthorizationStatus,
    Event,
} from '@notifee/react-native';
import { Alert, Linking, Platform } from 'react-native';

export type GoalKey = 'LOSE' | 'GAIN' | 'MAINTAIN';

type HydrationSlot = { time: string; title: string; ml: number; note?: string };
type Plan = { principle: string; totalHint: string; slots: HydrationSlot[] };

const CHANNEL_ID = 'hydration';
const ACTION_MARK_DRUNK = 'mark-drunk';
const actions: AndroidAction[] = [
    { title: '✅ Đã uống', pressAction: { id: ACTION_MARK_DRUNK } },
];

/** ====== Kế hoạch uống nước theo mục tiêu ====== */
export const HYDRATION_PLANS: Record<GoalKey, Plan> = {
    LOSE: {
        principle: 'Uống trước bữa 15–30’ để tạo no nhẹ, giảm lượng ăn.',
        totalHint: '≈ 2.2 – 2.5 l/ngày',
        slots: [
            { time: '06:30', title: 'Sau khi thức dậy', ml: 300, note: 'Kích hoạt tiêu hoá' },
            { time: '07:30', title: 'Trước ăn sáng 30’', ml: 250, note: 'Tạo cảm giác no' },
            { time: '10:30', title: 'Giữa buổi sáng', ml: 200, note: 'Giữ năng lượng' },
            { time: '12:15', title: 'Trước ăn trưa 15’', ml: 250, note: 'Giảm khẩu phần' },
            { time: '13:15', title: 'Giữa buổi chiều', ml: 250, note: 'Giảm thèm ăn' },
            { time: '18:15', title: 'Trước ăn tối 15’', ml: 200, note: 'No nhẹ' },
            { time: '20:30', title: 'Sau ăn tối 1h', ml: 150, note: 'Thanh lọc nhẹ' },
            { time: '21:45', title: 'Trước ngủ 30’', ml: 100, note: 'Tránh khô miệng' },
        ],
    },
    GAIN: {
        principle: 'Không uống ngay trước bữa; ưu tiên sau bữa để hấp thu dinh dưỡng.',
        totalHint: '≈ 2.5 – 3.0 l/ngày',
        slots: [
            { time: '06:45', title: 'Sau khi thức dậy', ml: 250, note: 'Khởi động chuyển hoá' },
            { time: '07:45', title: 'Sau ăn sáng 15’', ml: 300, note: 'Hỗ trợ tiêu hoá' },
            { time: '10:30', title: 'Giữa buổi sáng', ml: 250, note: 'Tỉnh táo' },
            { time: '12:45', title: 'Sau ăn trưa 15’', ml: 300, note: 'Hấp thu tốt' },
            { time: '13:15', title: 'Giữa buổi chiều', ml: 300, note: 'Bù nước' },
            { time: '18:45', title: 'Sau ăn tối 15’', ml: 250, note: 'Thải độc nhẹ' },
            { time: '21:15', title: 'Trước ngủ 45’', ml: 150, note: 'Giữ ẩm, ngủ ngon' },
        ],
    },
    MAINTAIN: {
        principle: 'Giữ thói quen ổn định, chia đều lượng nước.',
        totalHint: '≈ 2.3 – 2.7 l/ngày',
        slots: [
            { time: '06:30', title: 'Sau khi thức dậy', ml: 300, note: 'Khởi động ngày mới' },
            { time: '08:00', title: 'Sau ăn sáng 30’', ml: 200, note: 'Cân bằng dịch thể' },
            { time: '10:30', title: 'Giữa buổi sáng', ml: 200, note: 'Duy trì năng lượng' },
            { time: '12:45', title: 'Sau ăn trưa 15’', ml: 250, note: 'Hỗ trợ tiêu hoá' },
            { time: '13:15', title: 'Giữa buổi chiều', ml: 250, note: 'Giữ tỉnh táo' },
            { time: '18:30', title: 'Sau ăn tối 30’', ml: 200, note: 'Thanh lọc nhẹ' },
            { time: '21:15', title: 'Trước ngủ 30’', ml: 150, note: 'Ngủ ngon' },
        ],
    },
};

/** ====== Chuẩn bị quyền thông báo ====== */
export async function ensureHydrationReady() {
    await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Hydration Reminders',
        importance: AndroidImportance.HIGH,
    });

    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) return;

    const perm = await notifee.requestPermission();
    if (perm.authorizationStatus === AuthorizationStatus.AUTHORIZED) return;

    if (Platform.OS === 'android') {
        Alert.alert(
            'Bật thông báo & quyền nền',
            'NutriCare cần quyền thông báo/báo thức để nhắc uống nước đúng giờ.',
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
                            '⚙️ Gợi ý',
                            '1) Ứng dụng > NutriCare > Báo thức & nhắc nhở → BẬT\n2) Pin > Không tối ưu hoá cho NutriCare',
                        );
                    },
                },
            ],
        );
    }
}

/** ====== Helpers ====== */
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const ymd = (d: Date) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
const dateAtTime = (base: Date, hhmm: string) => {
    const [hh, mm] = hhmm.split(':').map((x) => parseInt(x, 10));
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0, 0);
};
const makeId = (date: Date, idx: number) => `hydration-${ymd(date)}-${idx}`;

/** ====== Lên lịch theo ngày (bắn ĐÚNG GIỜ uống) ====== */
export async function scheduleHydrationForDate(goal: GoalKey, forDate: Date) {
    await ensureHydrationReady();
    const plan = HYDRATION_PLANS[goal];

    for (let i = 0; i < plan.slots.length; i++) {
        const s = plan.slots[i];
        const drinkAt = dateAtTime(forDate, s.time);
        let fireAt = drinkAt; // ⏰ Bắn đúng giờ uống

        // Nếu giờ đó đã trôi qua → chuyển sang NGÀY MAI cùng khung giờ
        if (fireAt.getTime() <= Date.now()) {
            const tmr = new Date(forDate);
            tmr.setDate(tmr.getDate() + 1);
            fireAt = dateAtTime(tmr, s.time);
        }

        const id = makeId(fireAt, i);
        await notifee.cancelNotification(id);

        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: fireAt.getTime(),
            alarmManager: { allowWhileIdle: true },
        };

        // ✅ Nội dung thông báo theo yêu cầu
        await notifee.createTriggerNotification(
            {
                id,
                android: { channelId: CHANNEL_ID, pressAction: { id: 'default' }, actions },
                title: `Đã đến giờ uống nước bữa ${s.title}`,
                body: 'Hãy cập nhật cho mình nhé',
                data: { kind: 'hydration', time: s.time, date: ymd(forDate), idx: String(i) },
            },
            trigger,
        );
    }
}

/** ====== Lên lịch nhiều ngày ====== */
export async function scheduleHydrationRange(goal: GoalKey, daysAhead = 7) {
    await ensureHydrationReady();
    const base = new Date();
    for (let i = 0; i <= daysAhead; i++) {
        const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
        await scheduleHydrationForDate(goal, d);
    }
}

/** ====== Foreground handler ====== */
export function subscribeHydrationForeground() {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === ACTION_MARK_DRUNK) {
            // TODO: ghi lịch sử uống nước nếu cần
        }
    });
}

/** ====== Background handler ====== */
export async function hydrationBackgroundHandler({ type, detail }: Event) {
    try {
        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === ACTION_MARK_DRUNK) {
            // TODO: ghi lịch sử uống nước nếu cần
        }
    } catch (e) {
        console.log('[Hydration][BG] error', e);
    }
}

import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    Pressable,
    Platform,
    Modal,
    Image,
    Dimensions,
    View,
    StyleSheet,
    ScaledSize,
    TouchableWithoutFeedback,
} from 'react-native';
import { BarChart, StackedBarChart, PieChart } from 'react-native-chart-kit';
import Entypo from 'react-native-vector-icons/Entypo';
import DateTimePicker from '@react-native-community/datetimepicker';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';

/** ===== Types ===== */
type Range = 'week' | 'month';

/** ===== Constants ===== */
const PAD = 16;
const CARD_PAD = 20;

/* Avatar fallback */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    if (photoUri) return <Image source={{ uri: photoUri }} style={{ width: 52, height: 52, borderRadius: 999 }} />;
    return (
        <ViewComponent
            center
            radius={999}
            border
            borderColor={C.border}
            backgroundColor={C.bg}
            style={{ width: 52, height: 52 }}
            flex={0}
        >
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

/** ===== Time helpers (ISO-like, Monday-start week) ===== */
const startOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // 0=Mon .. 6=Sun
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day);
    return date;
};
const endOfWeek = (d: Date) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
};
const addDays = (d: Date, days: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
};
const addMonths = (d: Date, months: number) => {
    const x = new Date(d);
    x.setMonth(x.getMonth() + months);
    return x;
};
const pad2 = (n: number) => `${n}`.padStart(2, '0');
const fmtDM = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
const fmtMonthYear = (d: Date) => `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;

// ISO-ish week number (Mon-start)
const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Thursday in current week decides the year
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};
const weekLabel = (anchor: Date) => {
    const s = startOfWeek(anchor);
    const e = endOfWeek(anchor);
    const w = getWeekNumber(anchor);
    return `Tuần ${w} • ${fmtDM(s)}–${fmtDM(e)}/${e.getFullYear()}`;
};

/** ===== Period picker row (ở TRÊN tabs) ===== */
function PeriodPicker({
    range,
    anchorDate,
    onChangeAnchor,
}: {
    range: Range;
    anchorDate: Date;
    onChangeAnchor: (d: Date) => void;
}) {
    const [open, setOpen] = useState(false);

    const label = useMemo(() => {
        return range === 'week' ? weekLabel(anchorDate) : fmtMonthYear(anchorDate);
    }, [range, anchorDate]);

    const goPrev = () => {
        onChangeAnchor(range === 'week' ? addDays(anchorDate, -7) : addMonths(anchorDate, -1));
    };
    const goNext = () => {
        onChangeAnchor(range === 'week' ? addDays(anchorDate, 7) : addMonths(anchorDate, 1));
    };

    return (
        <ViewComponent row center gap={8} mb={8} flex={0}>
            <Pressable onPress={goPrev} style={styles.navIcon}>
                <Entypo name="chevron-left" size={18} color={C.primary} />
            </Pressable>

            {/* Nút mở lịch */}
            <Pressable onPress={() => setOpen(true)}>
                <ViewComponent
                    center
                    p={10}
                    px={14}
                    radius={12}
                    border
                    borderColor={C.primaryBorder}
                    backgroundColor={C.primarySurface}
                    style={styles.periodPill}
                    flex={0}
                >
                    <TextComponent text={label} weight="bold" size={13} tone="primary" />
                </ViewComponent>
            </Pressable>

            <Pressable onPress={goNext} style={styles.navIcon}>
                <Entypo name="chevron-right" size={18} color={C.primary} />
            </Pressable>

            {/* DatePicker */}
            {Platform.OS === 'ios' ? (
                <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                    <TouchableWithoutFeedback onPress={() => setOpen(false)}>
                        <View style={styles.backdrop} />
                    </TouchableWithoutFeedback>

                    <View style={styles.sheet}>
                        <DateTimePicker
                            value={anchorDate}
                            mode="date"
                            display="inline"
                            onChange={(_, d) => {
                                if (d) onChangeAnchor(d);
                            }}
                            style={{ alignSelf: 'stretch' }}
                        />
                        <Pressable onPress={() => setOpen(false)} style={styles.sheetBtn}>
                            <TextComponent text="Xong" weight="bold" color={C.onPrimary} />
                        </Pressable>
                    </View>
                </Modal>
            ) : (
                open && (
                    <DateTimePicker
                        value={anchorDate}
                        mode="date"
                        display="calendar"
                        onChange={(event, d) => {
                            // @ts-expect-error Android event type
                            if (event?.type === 'set' && d) onChangeAnchor(d);
                            setOpen(false);
                        }}
                    />
                )
            )}
        </ViewComponent>
    );
}

/** Component đo width thật của vùng chứa để chart không tràn */
function ChartSizer({ children }: { children: (w: number) => JSX.Element }) {
    const [w, setW] = useState<number>(0);
    return (
        <View
            style={{ width: '100%' }}
            onLayout={e => {
                const width = Math.floor(e.nativeEvent.layout.width);
                if (width !== w) setW(width);
            }}
        >
            {w > 0 ? children(w) : null}
        </View>
    );
}

export default function Statistics(): JSX.Element {
    const navigation = useNavigation();
    const [range, setRange] = useState<Range>('week'); // mặc định TUẦN
    const [anchorDate, setAnchorDate] = useState<Date>(new Date()); // mốc đang xem
    const [showDetails, setShowDetails] = useState<boolean>(false);

    /** Width động theo xoay màn hình */
    const [, setScreenW] = useState<number>(Dimensions.get('window').width);
    useEffect(() => {
        const handler = ({ window }: { window: ScaledSize }) => setScreenW(window.width);
        const subscription = Dimensions.addEventListener('change', handler as any);
        return () => {
            // @ts-expect-error: RN types khác nhau theo version
            if (typeof subscription?.remove === 'function') subscription.remove();
            else {
                // @ts-expect-error
                Dimensions.removeEventListener('change', handler);
            }
        };
    }, []);

    /** ====== DỮ LIỆU THEO CHẾ ĐỘ (MOCK) ====== */
    const ds = useMemo(() => {
        type DS = {
            macrosLegend: string[];
            macrosData: number[][];
            labelsMacros: string[];
            waterLabels: string[];
            waterData: number[];
            titles: { macros: string; water: string };

            mealCountLabels: string[];
            mealCountData: number[];
            topFoods: { name: string; count: number }[];

            waterProgressPct: number;
            weight: string;
            bmi: string;
            goal: string;
            healthScore: number;
            goalProgress: { kcalPct: number; waterPct: number; proteinPct: number };

            badges: string[];
            alerts: string[];
        };

        if (range === 'week') {
            const labelsMacros = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            const macrosData = [
                [48, 27, 15, 10],
                [49, 26, 15, 10],
                [47, 28, 15, 10],
                [50, 26, 14, 10],
                [48, 27, 15, 10],
                [46, 29, 15, 10],
                [49, 26, 15, 10],
            ];

            return {
                macrosLegend: ['Carb', 'Chất đạm', 'Chất béo', 'Chất xơ'],
                macrosData,
                labelsMacros,
                waterLabels: labelsMacros,
                waterData: [1800, 2100, 2000, 2300, 2200, 2400, 2100],
                titles: {
                    macros: 'Tỷ lệ dinh dưỡng theo ngày (tuần)',
                    water: 'Uống nước (ml) theo ngày (tuần)',
                },

                mealCountLabels: ['Sáng', 'Trưa', 'Tối', 'Snack'],
                mealCountData: [6, 7, 7, 5],
                topFoods: [
                    { name: 'Salad gà', count: 8 },
                    { name: 'Cơm gạo lứt', count: 7 },
                    { name: 'Trứng luộc', count: 6 },
                    { name: 'Táo đỏ', count: 6 },
                    { name: 'Sữa chua Hy Lạp', count: 5 },
                ],

                waterProgressPct: 86,
                weight: '60.4 kg',
                bmi: '21.4',
                goal: 'Tăng cân',
                healthScore: 81,
                goalProgress: { kcalPct: 87, waterPct: 86, proteinPct: 90 },

                badges: ['🔥 Chuỗi 5 ngày đạt mục tiêu', '🥗 Đa dạng thực phẩm hơn tuần trước'],
                alerts: ['2 ngày vượt 2.2L nước — cân nhắc phân bổ đều hơn.', 'Ngày T4 đạm hơi thấp.'],
            } as DS;
        }

        const labelsMacros = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        const macrosData = [
            [49, 26, 15, 10],
            [50, 25, 15, 10],
            [48, 27, 15, 10],
            [51, 24, 15, 10],
        ];

        return {
            macrosLegend: ['Carb', 'Chất đạm', 'Chất béo', 'Chất xơ'],
            macrosData,
            labelsMacros,
            waterLabels: labelsMacros,
            waterData: [2000, 2100, 2050, 2150],
            titles: {
                macros: 'Tỷ lệ dinh dưỡng TB theo tuần (tháng)',
                water: 'Uống nước (ml) TB theo tuần (tháng)',
            },

            mealCountLabels: ['Sáng', 'Trưa', 'Tối', 'Snack'],
            mealCountData: [26, 28, 28, 18],
            topFoods: [
                { name: 'Salad gà', count: 24 },
                { name: 'Cơm gạo lứt', count: 20 },
                { name: 'Sữa chua Hy Lạp', count: 16 },
                { name: 'Táo đỏ', count: 15 },
                { name: 'Trứng luộc', count: 14 },
            ],

            waterProgressPct: 82,
            weight: '60.8 kg',
            bmi: '21.5',
            goal: 'Tăng cân',
            healthScore: 83,
            goalProgress: { kcalPct: 85, waterPct: 82, proteinPct: 89 },

            badges: ['🏅 Hoàn thành mục tiêu tháng', '💧 Duy trì >80% nước trong 4 tuần'],
            alerts: ['Tuần 3 ăn đêm nhiều hơn mức khuyến nghị.', 'Huấn luyện nhẹ tuần 2, nên tăng 10–15%.'],
        } as DS;
    }, [range, anchorDate]);

    /** CONFIG CHUNG CHO BAR */
    const baseConfig = useMemo(() => {
        return {
            backgroundGradientFrom: C.white,
            backgroundGradientTo: C.white,
            decimalPlaces: 0 as 0 | 1 | 2 | 3,
            color: () => C.primary,
            labelColor: () => C.text,
            barPercentage: 0.6,
            propsForLabels: { fontSize: 12 },
            propsForBackgroundLines: { stroke: C.border },
        };
    }, []);

    const infoConfig = useMemo(() => ({ ...baseConfig, color: () => C.info }), [baseConfig]);

    /* Tính "Mục tiêu đạt được" = TB % của 3 mục tiêu kcal/nước/protein */
    const achievedPct = useMemo(
        () => Math.round((ds.goalProgress.kcalPct + ds.goalProgress.waterPct + ds.goalProgress.proteinPct) / 3),
        [ds.goalProgress]
    );

    /* Top 5 món */
    const top5Foods = ds.topFoods.slice(0, 5);

    return (
        <Container>
            <ViewComponent style={{ flex: 1, paddingHorizontal: PAD }}>
                {/* ===== Header: Back lớn + tiêu đề gần nhau ===== */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => {
                            if ((navigation as any)?.canGoBack?.()) (navigation as any).goBack();
                        }}
                        style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.85 }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Quay lại"
                    >
                        <Entypo name="chevron-left" size={26} color={C.primary} />
                    </Pressable>

                    <TextComponent text="Thống kê" variant="h3" weight="bold" />
                </View>

                {/* Divider */}
                <View style={styles.line} />

                {/* Period selector ABOVE, then range tabs */}
                <ViewComponent center mb={8}>
                    <PeriodPicker range={range} anchorDate={anchorDate} onChangeAnchor={setAnchorDate} />

                    <ViewComponent
                        row
                        gap={8}
                        p={6}
                        radius={999}
                        border
                        borderColor={C.primaryBorder}
                        backgroundColor={C.primarySurface}
                        flex={0}
                        style={styles.rangeTabs}
                    >
                        {(['week', 'month'] as Range[]).map(opt => {
                            const active = range === opt;
                            return (
                                <Pressable
                                    key={opt}
                                    onPress={() => setRange(opt)}
                                    android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false, radius: 999 }}
                                    style={({ pressed }) => [
                                        styles.filterItemBase,
                                        active ? styles.filterItemActive : styles.filterItemInactive,
                                        pressed && { opacity: 0.95 },
                                    ]}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <TextComponent
                                        text={opt === 'week' ? 'Theo tuần' : 'Theo tháng'}
                                        weight="bold"
                                        size={12}
                                        color={active ? C.onPrimary : C.text}
                                    />
                                </Pressable>
                            );
                        })}
                    </ViewComponent>
                </ViewComponent>

                {/* ================== NỘI DUNG ================== */}
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
                    {/* 1) CHỈ SỐ SỨC KHỎE */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                        <TextComponent text="Chỉ số sức khỏe" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent row between mt={12} gap={8}>
                            {[
                                { label: 'Cân nặng', value: ds.weight },
                                { label: 'BMI', value: ds.bmi },
                                { label: 'Mục tiêu', value: ds.goal },
                            ].map(item => (
                                <ViewComponent
                                    key={item.label}
                                    flex={1}
                                    p={14}
                                    radius={14}
                                    border
                                    borderColor={C.border}
                                    backgroundColor={C.bg}
                                    alignItems="center"
                                >
                                    <TextComponent text={item.label} tone="muted" />
                                    <TextComponent text={item.value} weight="bold" />
                                </ViewComponent>
                            ))}
                        </ViewComponent>
                    </ViewComponent>

                    {/* 2) TIẾN ĐỘ & THÀNH TÍCH (chỉ 2 ô) */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                        <TextComponent text="Tiến độ & Thành tích" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent mt={12} row between gap={8}>
                            <ViewComponent
                                flex={1}
                                p={14}
                                radius={14}
                                border
                                borderColor={C.border}
                                backgroundColor={C.bg}
                                alignItems="center"
                            >
                                <TextComponent text="Nước đạt được" tone="muted" />
                                <TextComponent text={`${ds.waterProgressPct}%`} weight="bold" />
                            </ViewComponent>
                            <ViewComponent
                                flex={1}
                                p={14}
                                radius={14}
                                border
                                borderColor={C.border}
                                backgroundColor={C.bg}
                                alignItems="center"
                            >
                                <TextComponent text="Mục tiêu đạt được" tone="muted" />
                                <TextComponent text={`${achievedPct}%`} weight="bold" />
                            </ViewComponent>
                        </ViewComponent>
                    </ViewComponent>

                    {/* 3) TOP 5 MÓN ĂN */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                        <TextComponent text="Top 5 món ăn" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent mt={10} gap={8}>
                            {top5Foods.map(it => (
                                <ViewComponent
                                    key={it.name}
                                    row
                                    between
                                    alignItems="center"
                                    p={12}
                                    radius={12}
                                    border
                                    borderColor={C.border}
                                    backgroundColor={C.bg}
                                >
                                    <TextComponent text={`• ${it.name}`} />
                                    <TextComponent text={`x${it.count}`} weight="bold" />
                                </ViewComponent>
                            ))}
                        </ViewComponent>
                    </ViewComponent>

                    {/* NÚT XEM CHI TIẾT / THU GỌN */}
                    <Pressable onPress={() => setShowDetails(s => !s)}>
                        <ViewComponent
                            center
                            p={12}
                            radius={14}
                            border
                            borderColor={C.primaryBorder}
                            backgroundColor={C.primarySurface}
                            mb={12}
                        >
                            <TextComponent text={showDetails ? 'Thu gọn' : 'Xem chi tiết'} weight="bold" tone="primary" />
                        </ViewComponent>
                    </Pressable>

                    {/* ====== KHỐI CHI TIẾT ====== */}
                    {showDetails && (
                        <>
                            {/* Tỷ lệ dinh dưỡng (tuần: 7 cột | tháng: 4 cột) */}
                            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                                <TextComponent text={ds.titles.macros} variant="h3" weight="bold" tone="primary" />
                                <ChartSizer>
                                    {w => (
                                        <StackedBarChart
                                            width={w}
                                            height={240}
                                            data={{
                                                labels: ds.labelsMacros,
                                                legend: ds.macrosLegend,
                                                data: ds.macrosData,
                                                barColors: [C.info, C.success, C.warning, '#9CA3AF'],
                                            }}
                                            chartConfig={baseConfig}
                                            hideLegend={false}
                                            withHorizontalLabels
                                            fromZero
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                </ChartSizer>
                                <ViewComponent mt={8}>
                                    <TextComponent text="Mỗi cột là % Carb/Đạm/Béo/Xơ." tone="muted" align="center" />
                                </ViewComponent>
                            </ViewComponent>

                            {/* Số bữa đã ghi log (Pie) */}
                            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                                <TextComponent text="Số bữa đã ghi log" variant="h3" weight="bold" tone="primary" />
                                <ChartSizer>
                                    {w => {
                                        const mealColors = [C.info, C.success, C.warning, '#9CA3AF'];
                                        const pieData = ds.mealCountLabels.map((name, i) => ({
                                            name,
                                            population: ds.mealCountData[i] ?? 0,
                                            color: mealColors[i % mealColors.length],
                                            legendFontColor: C.text,
                                            legendFontSize: 12,
                                        }));
                                        return (
                                            <PieChart
                                                width={w}
                                                height={220}
                                                data={pieData}
                                                accessor="population"
                                                chartConfig={baseConfig}
                                                backgroundColor="transparent"
                                                paddingLeft="0"
                                                hasLegend
                                                absolute // số tuyệt đối
                                            />
                                        );
                                    }}
                                </ChartSizer>
                                <ViewComponent mt={8}>
                                    <TextComponent text={`Tổng: ${ds.mealCountData.reduce((a, b) => a + b, 0)} bữa`} tone="muted" align="center" />
                                </ViewComponent>
                            </ViewComponent>

                            {/* Uống nước */}
                            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                                <TextComponent text={ds.titles.water} variant="h3" weight="bold" tone="primary" />
                                <ChartSizer>
                                    {w => (
                                        <BarChart
                                            width={w}
                                            height={220}
                                            data={{
                                                labels: ds.waterLabels,
                                                datasets: [{ data: ds.waterData }],
                                            }}
                                            chartConfig={infoConfig}
                                            fromZero
                                            showValuesOnTopOfBars
                                            withHorizontalLabels
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                </ChartSizer>
                            </ViewComponent>
                        </>
                    )}

                    {/* ĐỀ XUẤT (CUỐI CÙNG) */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={28} radius={20}>
                        <TextComponent text="Đề xuất" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent mt={10} gap={6}>
                            {ds.alerts.map((t, idx) => (
                                <TextComponent key={`al-${idx}`} text={`⚠️ ${t}`} />
                            ))}
                        </ViewComponent>
                        <ViewComponent mt={12}>
                            <TextComponent text="Thành tích" variant="subtitle" weight="bold" />
                            <ViewComponent mt={6} gap={6}>
                                {ds.badges.map((b, i) => (
                                    <TextComponent key={`bd-${i}`} text={`🏅 ${b}`} />
                                ))}
                            </ViewComponent>
                        </ViewComponent>
                    </ViewComponent>
                </ScrollView>
            </ViewComponent>
        </Container>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerBackBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },

    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
    },
    line: {
        height: 2,
        backgroundColor: C.border,
        marginVertical: 12,
    },
    filterItemBase: {
        minWidth: 104,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    filterItemInactive: {
        backgroundColor: 'transparent',
    },
    filterItemActive: {
        backgroundColor: C.primary,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 1,
    },
    // Thu nhỏ icon điều hướng trong PeriodPicker
    navIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.primaryBorder,
        backgroundColor: C.primarySurface,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    periodPill: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rangeTabs: {
        marginTop: 6,
    },
    // iOS bottom sheet styles
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    sheet: {
        backgroundColor: C.white,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        paddingTop: 8,
        paddingBottom: 12,
    },
    sheetBtn: {
        alignSelf: 'center',
        marginTop: 8,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: C.primary,
    },
});

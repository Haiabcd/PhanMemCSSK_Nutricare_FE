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
} from 'react-native';
import { BarChart, StackedBarChart } from 'react-native-chart-kit';
import Entypo from 'react-native-vector-icons/Entypo';
import DateTimePicker from '@react-native-community/datetimepicker';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

/** ===== Types ===== */
type Range = 'day' | 'week' | 'month';

type RangeFilterProps = {
    value: Range;
    onChange: (r: Range) => void;
};

/** ===== Constants ===== */
const PAD = 16;        // padding ngang của màn hình (Container)
const CARD_PAD = 20;   // padding trong mỗi card

/* Avatar fallback */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (photoUri) return <Image source={{ uri: photoUri }} style={{ width: 52, height: 52, borderRadius: 999 }} />;
    return (
        <ViewComponent center radius={999} border borderColor={C.border} backgroundColor={C.bg} style={{ width: 52, height: 52 }} flex={0}>
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

const fmtVNFull = (d: Date) => {
    const dow = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
    const dd = `${d.getDate()}`.padStart(2, '0');
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${dow}, ${dd} Tháng ${mm}`;
};

function RangeFilter({ value, onChange }: RangeFilterProps) {
    const items: { key: Range; label: string }[] = [
        { key: 'day', label: 'Theo ngày' },
        { key: 'week', label: 'Theo tuần' },
        { key: 'month', label: 'Theo tháng' },
    ];

    return (
        <ViewComponent
            row
            gap={8}                 // khoảng cách giữa các nút
            p={6}                   // padding ngoài group
            radius={999}
            border
            borderColor={C.primaryBorder}
            backgroundColor={C.primarySurface}
            style={{ alignSelf: 'center' }}
            flex={0}
        >
            {items.map(it => {
                const active = value === it.key;
                return (
                    <Pressable
                        key={it.key}
                        onPress={() => onChange(it.key)}
                        android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false, radius: 999 }}
                        style={({ pressed }) => ([
                            styles.filterItemBase,                                     // <-- dùng style nền lớn
                            active ? styles.filterItemActive : styles.filterItemInactive,
                            pressed && { opacity: 0.95 },
                        ])}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}           // vùng chạm rộng hơn
                    >
                        <TextComponent
                            text={it.label}
                            weight="bold"
                            size={12}                                                  // chữ to hơn
                            color={active ? C.onPrimary : C.text}
                        />
                    </Pressable>
                );
            })}
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
                const width = Math.floor(e.nativeEvent.layout.width); // làm tròn để tránh lệch 1px
                if (width !== w) setW(width);
            }}
        >
            {w > 0 ? children(w) : null}
        </View>
    );
}

export default function Statistics(): JSX.Element {
    const [range, setRange] = useState<Range>('day');
    const [date, setDate] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState<boolean>(false);

    /** Width động, chuẩn theo xoay màn hình (để trigger re-render cards) */
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

    /** DỮ LIỆU THEO CHẾ ĐỘ */
    const ds = useMemo(() => {
        type DS = {
            macrosLegend: string[];
            macrosData: number[][];
            labelsMacros: string[];
            caloriesLabels: string[];
            caloriesData: number[];
            waterLabels: string[];
            waterData: number[];
            complianceLabels: string[];
            complianceData: number[];
            titles: { macros: string; cal: string; water: string; adh: string };
        };
        let out: DS;
        if (range === 'day') {
            out = {
                macrosLegend: ['Carb', 'Protein', 'Fat'],
                macrosData: [[55, 30, 15]],
                labelsMacros: ['Hôm nay'],
                caloriesLabels: ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'],
                caloriesData: [120, 150, 200, 350, 420, 260, 180, 140],
                waterLabels: ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'],
                waterData: [0, 200, 300, 400, 300, 300, 200, 200],
                complianceLabels: ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'],
                complianceData: [60, 65, 70, 80, 85, 75, 70, 65],
                titles: {
                    macros: 'Tỷ lệ dinh dưỡng hôm nay (stacked)',
                    cal: 'Calo theo khung giờ',
                    water: 'Uống nước (ml) theo khung giờ',
                    adh: 'Chỉ số tuân thủ (%) theo khung giờ',
                },
            };
        } else if (range === 'week') {
            out = {
                macrosLegend: ['Carb', 'Protein', 'Fat'],
                macrosData: [[50, 30, 20]],
                labelsMacros: ['Tuần này'],
                caloriesLabels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                caloriesData: [1900, 2000, 1850, 2100, 2150, 1950, 2050],
                waterLabels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                waterData: [1800, 2100, 2000, 2300, 2200, 2400, 2100],
                complianceLabels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                complianceData: [78, 82, 75, 88, 90, 84, 80],
                titles: {
                    macros: 'Tỷ lệ dinh dưỡng tuần này (stacked)',
                    cal: 'Calo theo ngày (tuần)',
                    water: 'Uống nước (ml) theo ngày (tuần)',
                    adh: 'Chỉ số tuân thủ (%) theo ngày (tuần)',
                },
            };
        } else {
            out = {
                macrosLegend: ['Carb', 'Protein', 'Fat'],
                macrosData: [[52, 28, 20]],
                labelsMacros: ['Tháng này'],
                caloriesLabels: ['W1', 'W2', 'W3', 'W4', 'W5'],
                caloriesData: [2000, 2050, 1980, 2100, 2020],
                waterLabels: ['W1', 'W2', 'W3', 'W4', 'W5'],
                waterData: [2000, 2100, 2050, 2150, 2080],
                complianceLabels: ['W1', 'W2', 'W3', 'W4', 'W5'],
                complianceData: [80, 83, 79, 86, 82],
                titles: {
                    macros: 'Tỷ lệ dinh dưỡng tháng này (stacked)',
                    cal: 'Calo TB theo tuần (tháng)',
                    water: 'Uống nước (ml) TB theo tuần (tháng)',
                    adh: 'Chỉ số tuân thủ (%) TB theo tuần (tháng)',
                },
            };
        }
        return out;
    }, [range]);

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
    const successConfig = useMemo(() => ({ ...baseConfig, color: () => C.success }), [baseConfig]);

    return (
        <Container>
            <ViewComponent style={{ flex: 1, paddingHorizontal: PAD }}>
                {/* Header */}
                <ViewComponent row between alignItems="center" mt={20}>
                    <ViewComponent row alignItems="center" gap={10} flex={0}>
                        <Avatar name="Anh Hải" />
                        <ViewComponent flex={0}>
                            <TextComponent text="Xin chào," variant="caption" tone="muted" />
                            <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
                        </ViewComponent>
                    </ViewComponent>
                    <Pressable style={styles.iconContainer}>
                        <Entypo name="bar-graph" size={20} color={C.primary} />
                    </Pressable>
                </ViewComponent>

                {/* Divider */}
                <View style={styles.line} />

                {/* Date + filter */}
                <ViewComponent center mb={12}>
                    <Pressable onPress={() => setShowPicker(true)}>
                        <ViewComponent row center gap={8} flex={0}>
                            <Entypo name="calendar" size={18} color={C.primary} />
                            <TextComponent text={fmtVNFull(date)} variant="subtitle" weight="bold" />
                        </ViewComponent>
                    </Pressable>

                    <View style={{ height: 10 }} />
                    <RangeFilter value={range} onChange={setRange} />
                </ViewComponent>

                {/* DatePicker modal */}
                <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
                    <Pressable onPress={() => setShowPicker(false)}>
                        <ViewComponent style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} justifyContent="flex-end" p={0} pb={0} flex={1}>
                            <Pressable>
                                <ViewComponent backgroundColor={C.white} radius={16} border borderColor={C.border} style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8, paddingBottom: 12 }}>
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                                        onChange={(event, d) => {
                                            if (Platform.OS === 'android') {
                                                setShowPicker(false);
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                if ((event as any).type === 'set' && d) setDate(d);
                                            } else if (d) setDate(d);
                                        }}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <Pressable onPress={() => setShowPicker(false)}>
                                            <ViewComponent center radius={999} backgroundColor={C.primary} style={{ alignSelf: 'center', marginTop: 8, paddingHorizontal: 18, paddingVertical: 10 }} flex={0}>
                                                <TextComponent text="Xong" weight="bold" color={C.onPrimary} />
                                            </ViewComponent>
                                        </Pressable>
                                    )}
                                </ViewComponent>
                            </Pressable>
                        </ViewComponent>
                    </Pressable>
                </Modal>

                {/* Nội dung */}
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
                    {/* Macros (STACKED BAR) */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                        <TextComponent text={ds.titles.macros} variant="h3" weight="bold" tone="primary" />
                        <ChartSizer>
                            {(w) => (
                                <StackedBarChart
                                    width={w}
                                    height={220}
                                    data={{
                                        labels: ds.labelsMacros,
                                        legend: ds.macrosLegend,
                                        data: ds.macrosData,
                                        barColors: [C.info, C.success, C.warning],
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
                            <TextComponent text="Tính theo % tổng năng lượng." tone="muted" align="center" />
                        </ViewComponent>
                    </ViewComponent>

                    {/* Calo (BAR) */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                        <TextComponent text={ds.titles.cal} variant="h3" weight="bold" tone="primary" />
                        <ChartSizer>
                            {(w) => (
                                <BarChart
                                    width={w}
                                    height={260}
                                    data={{
                                        labels: ds.caloriesLabels,
                                        datasets: [{ data: ds.caloriesData }],
                                    }}
                                    chartConfig={baseConfig}
                                    fromZero
                                    showValuesOnTopOfBars
                                    withHorizontalLabels
                                    style={{ marginTop: 10 }}
                                />
                            )}
                        </ChartSizer>
                    </ViewComponent>

                    {/* Uống nước (BAR) */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
                        <TextComponent text={ds.titles.water} variant="h3" weight="bold" tone="primary" />
                        <ChartSizer>
                            {(w) => (
                                <BarChart
                                    width={w}
                                    height={250}
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

                    {/* Chỉ số tuân thủ (BAR) */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={20} radius={20}>
                        <TextComponent text={ds.titles.adh} variant="h3" weight="bold" tone="primary" />
                        <ChartSizer>
                            {(w) => (
                                <BarChart
                                    width={w}
                                    height={250}
                                    data={{
                                        labels: ds.complianceLabels,
                                        datasets: [{ data: ds.complianceData }],
                                    }}
                                    chartConfig={successConfig}
                                    fromZero
                                    showValuesOnTopOfBars
                                    withHorizontalLabels
                                    style={{ marginTop: 10 }}
                                />
                            )}
                        </ChartSizer>
                        <ViewComponent mt={8}>
                            <TextComponent
                                text={
                                    range === 'day'
                                        ? 'Mức độ hoàn thành mục tiêu theo từng khung giờ.'
                                        : range === 'week'
                                            ? 'Tỷ lệ ngày đạt mục tiêu trong tuần.'
                                            : 'Tỷ lệ tuần đạt mục tiêu trung bình trong tháng.'
                                }
                                tone="muted"
                                align="center"
                            />
                        </ViewComponent>
                    </ViewComponent>

                    {/* Health */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={8} radius={20}>
                        <TextComponent text="Chỉ số sức khỏe" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent row between mt={12} gap={8}>
                            {[
                                { label: 'Cân nặng', value: '60 kg' },
                                { label: 'BMI', value: '21.3' },
                                { label: 'Mục tiêu', value: 'Tăng cân' },
                            ].map(item => (
                                <ViewComponent key={item.label} flex={1} p={14} radius={14} border borderColor={C.border} backgroundColor={C.bg} alignItems="center">
                                    <TextComponent text={item.label} tone="muted" />
                                    <TextComponent text={item.value} weight="bold" />
                                </ViewComponent>
                            ))}
                        </ViewComponent>
                    </ViewComponent>

                    {/* Insight */}
                    <ViewComponent variant="card" p={CARD_PAD} mb={28} radius={20}>
                        <TextComponent text="Đề xuất" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent mt={10}><TextComponent text="👉 Bạn thường thiếu chất xơ, hãy bổ sung rau xanh." /></ViewComponent>
                        <ViewComponent mt={6}><TextComponent text="💧 3 ngày gần đây bạn uống dưới 2L nước." /></ViewComponent>
                        <ViewComponent mt={6}><TextComponent text="🔥 Tuần này bạn tập luyện nhiều hơn 20% so với tuần trước." /></ViewComponent>
                    </ViewComponent>
                </ScrollView>
            </ViewComponent>
        </Container>
    );
}

const styles = StyleSheet.create({
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

    // Pill base: nhỏ gọn + luôn bo tròn
    filterItemBase: {
        minWidth: 104,        // ↓ từ 132
        paddingVertical: 9,   // ↓
        paddingHorizontal: 14,// ↓
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
        shadowOpacity: 0.12,  // nhẹ hơn
        shadowRadius: 4,      // nhỏ hơn
        elevation: 1,         // thấp hơn
    },
});

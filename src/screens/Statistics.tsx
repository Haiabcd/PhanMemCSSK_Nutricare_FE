import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ScrollView,
    Pressable,
    Platform,
    Modal,
    Image,
    View,
    StyleSheet,
    Animated,
    LayoutChangeEvent,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import DateTimePicker from '@react-native-community/datetimepicker';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

/** gifted-charts */
import {
    BarChart as GBarChart,
    StackedBarChart as GStackedBarChart,
} from 'react-native-gifted-charts';

/** Padding thực tế UI */
const PAD_SCREEN = 16;           // padding ngang màn hình
const PAD_CARD = 28;             // padding trong card (nới thêm)

/** Padding cho vùng chart để không mất chữ (nới rộng hẳn) */
const CHART_PAD_H = 16;          // padding ngang trong wrapper chart
const CHART_PAD_B = 88;          // padding dưới cho nhãn X (to để không cắt đuôi chữ)

type Range = 'day' | 'week' | 'month';

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

/** Segmented control (Ngày/Tuần/Tháng) có highlight trượt – inline */
function Segmented<T extends string>({
    value, onChange, items, padding = 4, itemMinWidth = 110,
}: {
    value: T; onChange: (v: T) => void; items: { key: T; label: string }[];
    padding?: number; itemMinWidth?: number;
}) {
    const activeIndex = useMemo(() => Math.max(0, items.findIndex(i => i.key === value)), [items, value]);
    const widths = useRef<number[]>([]);
    const offsets = useRef<number[]>([]);
    const animX = useRef(new Animated.Value(0)).current;
    const animW = useRef(new Animated.Value(itemMinWidth)).current;

    const onItemLayout = (i: number) => (e: LayoutChangeEvent) => {
        const w = Math.max(itemMinWidth, e.nativeEvent.layout.width);
        widths.current[i] = w;
        const o: number[] = [];
        let acc = padding;
        for (let k = 0; k < items.length; k++) { o[k] = acc; acc += widths.current[k] ?? itemMinWidth; }
        offsets.current = o;
        if (offsets.current[activeIndex] != null && widths.current[activeIndex] != null) {
            animX.setValue(offsets.current[activeIndex]);
            animW.setValue(widths.current[activeIndex]);
        }
    };

    useEffect(() => {
        const x = offsets.current[activeIndex] ?? 0;
        const w = widths.current[activeIndex] ?? itemMinWidth;
        Animated.parallel([
            Animated.timing(animX, { toValue: x, duration: 180, useNativeDriver: false }),
            Animated.timing(animW, { toValue: w, duration: 180, useNativeDriver: false }),
        ]).start();
    }, [activeIndex]);

    return (
        <ViewComponent row alignItems="center" radius={999} border borderColor={C.primaryBorder} backgroundColor={C.primarySurface} style={{ padding, position: 'relative' }} flex={0}>
            <Animated.View style={{ position: 'absolute', top: padding, bottom: padding, left: animX, width: animW, backgroundColor: C.primary, borderRadius: 999 }} />
            {items.map((it, i) => {
                const active = it.key === value;
                return (
                    <Pressable key={it.key} onPress={() => onChange(it.key)}>
                        <View onLayout={onItemLayout(i)} style={{ minWidth: itemMinWidth, paddingHorizontal: 14 }}>
                            <ViewComponent center style={{ height: 38 }} flex={0}>
                                <TextComponent text={it.label} weight="bold" size={12} color={active ? C.onPrimary : C.text} />
                            </ViewComponent>
                        </View>
                    </Pressable>
                );
            })}
        </ViewComponent>
    );
}

/** Dữ liệu theo chế độ lọc */
function buildDatasets(range: Range) {
    if (range === 'day') {
        const labels = ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'];
        return {
            labels,
            calories: [120, 150, 200, 350, 420, 260, 180, 140],
            water: [0, 200, 300, 400, 300, 300, 200, 200],
            compliance: [60, 65, 70, 80, 85, 75, 70, 65],
            macrosStack: [55, 30, 15],
        };
    }
    if (range === 'week') {
        const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        return {
            labels,
            calories: [1900, 2000, 1850, 2100, 2150, 1950, 2050],
            water: [1800, 2100, 2000, 2300, 2200, 2400, 2100],
            compliance: [78, 82, 75, 88, 90, 84, 80],
            macrosStack: [50, 30, 20],
        };
    }
    const labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
    return {
        labels,
        calories: [2000, 2050, 1980, 2100, 2020],
        water: [2000, 2100, 2050, 2150, 2080],
        compliance: [80, 83, 79, 86, 82],
        macrosStack: [52, 28, 20],
    };
}

/** Helper: đổi sang data của gifted-charts + GIÃN NHÃN tối đa */
const toBarData = (labels: string[], values: number[], color: string, labelWidth = 84) =>
    labels.map((label, i) => ({
        value: values[i],
        label,
        frontColor: color,
        labelWidth,
        labelTextStyle: {
            fontSize: 13,
            lineHeight: 24,
            paddingTop: 18,     // đẩy nhãn xa trục X
            includeFontPadding: false, // tránh cắt đuôi “g, y...”(Android)
            textAlign: 'center',
        },
    }));

const toStackedBarData = (label: string, carb: number, protein: number, fat: number) => ([
    {
        label,
        stacks: [
            { value: carb, color: C.info },
            { value: protein, color: C.success },
            { value: fat, color: C.warning },
        ],
    },
]);

export default function Statistics() {
    const [range, setRange] = useState<Range>('day');
    const [date, setDate] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState(false);

    // đo width thực của từng chart để căn padding hợp lý
    const [wMacros, setWMacros] = useState(0);
    const [wCal, setWCal] = useState(0);
    const [wWater, setWWater] = useState(0);
    const [wAdh, setWAdh] = useState(0);

    const ds = useMemo(() => buildDatasets(range), [range]);

    // data for gifted-charts
    const calData = useMemo(() => toBarData(ds.labels, ds.calories, C.primary), [ds]);
    const waterData = useMemo(() => toBarData(ds.labels, ds.water, C.info), [ds]);
    const adhData = useMemo(() => toBarData(ds.labels, ds.compliance, C.success), [ds]);
    const macrosData = useMemo(
        () => toStackedBarData('Macros', ds.macrosStack[0], ds.macrosStack[1], ds.macrosStack[2]),
        [ds],
    );

    // Số section ngang trục Y cho biểu đồ (đẹp mắt)
    const sectionsFor = (arr: number[]) => {
        const max = Math.max(...arr);
        if (max <= 100) return 5;
        if (max <= 1000) return 6;
        return 8;
    };

    return (
        <Container>
            <ViewComponent style={{ flex: 1 }}>
                {/* Header */}
                <ViewComponent row between alignItems="center" mt={20} px={PAD_SCREEN}>
                    <ViewComponent row alignItems="center" gap={10} flex={0}>
                        <Avatar name="Anh Hải" />
                        <ViewComponent flex={0}>
                            <TextComponent text="Xin chào," variant="caption" tone="muted" />
                            <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
                        </ViewComponent>
                    </ViewComponent>
                    <Pressable style={s.iconContainer}>
                        <Entypo name="bar-graph" size={20} color={C.primary} />
                    </Pressable>
                </ViewComponent>

                {/* Divider */}
                <View style={[s.line, { marginHorizontal: PAD_SCREEN }]} />

                {/* Date + segmented */}
                <ViewComponent center mb={16} px={PAD_SCREEN}>
                    <Pressable onPress={() => setShowPicker(true)}>
                        <ViewComponent row center gap={8} flex={0}>
                            <Entypo name="calendar" size={18} color={C.primary} />
                            <TextComponent text={fmtVNFull(date)} variant="subtitle" weight="bold" />
                        </ViewComponent>
                    </Pressable>

                    <View style={{ height: 14 }} />

                    <Segmented
                        value={range}
                        onChange={(v) => setRange(v)}
                        items={[
                            { key: 'day', label: 'Theo ngày' },
                            { key: 'week', label: 'Theo tuần' },
                            { key: 'month', label: 'Theo tháng' },
                        ]}
                    />
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
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD_SCREEN, paddingBottom: 44 }}>
                    {/* Macros (Stacked Bar) */}
                    <ViewComponent variant="card" p={PAD_CARD} mb={18} radius={20}>
                        <TextComponent
                            text={range === 'day' ? 'Tỷ lệ dinh dưỡng hôm nay'
                                : range === 'week' ? 'Tỷ lệ dinh dưỡng tuần này'
                                    : 'Tỷ lệ dinh dưỡng tháng này'}
                            variant="h3" weight="bold" tone="primary"
                        />
                        <View
                            onLayout={e => setWMacros(e.nativeEvent.layout.width)}
                            style={{ width: '100%' }}
                        >
                            {wMacros > 0 && (
                                <View
                                    style={{
                                        width: wMacros,
                                        borderRadius: 12,
                                        alignSelf: 'center',
                                        paddingHorizontal: CHART_PAD_H,
                                        paddingBottom: CHART_PAD_B,
                                    }}
                                >
                                    <GStackedBarChart
                                        data={macrosData}
                                        width={wMacros - CHART_PAD_H * 2}
                                        height={240}
                                        noOfSections={5}
                                        yAxisColor={C.border}
                                        xAxisColor={C.border}
                                        xAxisLabelTextStyle={{ fontSize: 13, lineHeight: 24, color: C.text, paddingTop: 18, includeFontPadding: false, textAlign: 'center' }}
                                        yAxisTextStyle={{ fontSize: 13, lineHeight: 20, color: C.text }}
                                        barBorderRadius={8}
                                        disableScroll
                                    />
                                    {/* Legend */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 14 }}>
                                        {[
                                            { c: C.info, t: 'Carb' },
                                            { c: C.success, t: 'Protein' },
                                            { c: C.warning, t: 'Fat' },
                                        ].map(it => (
                                            <View key={it.t} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: it.c, marginRight: 6 }} />
                                                <TextComponent text={it.t} size={12} />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                        <ViewComponent mt={12}>
                            <TextComponent text="Tính theo % tổng năng lượng." tone="muted" align="center" />
                        </ViewComponent>
                    </ViewComponent>

                    {/* Calo (Bar) */}
                    <ViewComponent variant="card" p={PAD_CARD} mb={18} radius={20}>
                        <TextComponent text="Calo" variant="h3" weight="bold" tone="primary" />
                        <View onLayout={e => setWCal(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
                            {wCal > 0 && (
                                <View
                                    style={{
                                        width: wCal,
                                        borderRadius: 12,
                                        alignSelf: 'center',
                                        paddingHorizontal: CHART_PAD_H,
                                        paddingBottom: CHART_PAD_B,
                                    }}
                                >
                                    <GBarChart
                                        data={calData}
                                        width={wCal - CHART_PAD_H * 2}
                                        height={320}
                                        barWidth={18}
                                        spacing={26}
                                        noOfSections={sectionsFor(ds.calories)}
                                        yAxisColor={C.border}
                                        xAxisColor={C.border}
                                        xAxisLabelTextStyle={{ fontSize: 13, lineHeight: 24, color: C.text, paddingTop: 18, includeFontPadding: false, textAlign: 'center' }}
                                        yAxisTextStyle={{ fontSize: 13, lineHeight: 20, color: C.text }}
                                        initialSpacing={28}
                                        frontColor={C.primary}
                                        isAnimated
                                        animationDuration={600}
                                        roundToDigits={0}
                                    />
                                </View>
                            )}
                        </View>
                    </ViewComponent>

                    {/* Uống nước (Bar) */}
                    <ViewComponent variant="card" p={PAD_CARD} mb={18} radius={20}>
                        <TextComponent text="Uống nước (ml)" variant="h3" weight="bold" tone="primary" />
                        <View onLayout={e => setWWater(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
                            {wWater > 0 && (
                                <View
                                    style={{
                                        width: wWater,
                                        borderRadius: 12,
                                        alignSelf: 'center',
                                        paddingHorizontal: CHART_PAD_H,
                                        paddingBottom: CHART_PAD_B,
                                    }}
                                >
                                    <GBarChart
                                        data={waterData}
                                        width={wWater - CHART_PAD_H * 2}
                                        height={310}
                                        barWidth={18}
                                        spacing={26}
                                        noOfSections={sectionsFor(ds.water)}
                                        yAxisColor={C.border}
                                        xAxisColor={C.border}
                                        xAxisLabelTextStyle={{ fontSize: 13, lineHeight: 24, color: C.text, paddingTop: 18, includeFontPadding: false, textAlign: 'center' }}
                                        yAxisTextStyle={{ fontSize: 13, lineHeight: 20, color: C.text }}
                                        initialSpacing={28}
                                        frontColor={C.info}
                                        isAnimated
                                        animationDuration={600}
                                        roundToDigits={0}
                                    />
                                </View>
                            )}
                        </View>
                    </ViewComponent>

                    {/* Chỉ số tuân thủ (Bar) */}
                    <ViewComponent variant="card" p={PAD_CARD} mb={36} radius={20}>
                        <TextComponent text="Chỉ số tuân thủ (%)" variant="h3" weight="bold" tone="primary" />
                        <View onLayout={e => setWAdh(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
                            {wAdh > 0 && (
                                <View
                                    style={{
                                        width: wAdh,
                                        borderRadius: 12,
                                        alignSelf: 'center',
                                        paddingHorizontal: CHART_PAD_H,
                                        paddingBottom: CHART_PAD_B,
                                    }}
                                >
                                    <GBarChart
                                        data={adhData}
                                        width={wAdh - CHART_PAD_H * 2}
                                        height={310}
                                        barWidth={18}
                                        spacing={26}
                                        noOfSections={5}
                                        maxValue={100}
                                        yAxisColor={C.border}
                                        xAxisColor={C.border}
                                        xAxisLabelTextStyle={{ fontSize: 13, lineHeight: 24, color: C.text, paddingTop: 18, includeFontPadding: false, textAlign: 'center' }}
                                        yAxisTextStyle={{ fontSize: 13, lineHeight: 20, color: C.text }}
                                        initialSpacing={28}
                                        frontColor={C.success}
                                        isAnimated
                                        animationDuration={600}
                                        roundToDigits={0}
                                    />
                                </View>
                            )}
                        </View>
                        <ViewComponent mt={12}>
                            <TextComponent
                                text={
                                    range === 'day'
                                        ? 'Tính theo mức hoàn thành mục tiêu theo từng khung giờ'
                                        : range === 'week'
                                            ? 'Tính theo % ngày đạt mục tiêu trong tuần'
                                            : 'Tính theo % ngày đạt mục tiêu trung bình theo tuần trong tháng'
                                }
                                tone="muted"
                                align="center"
                            />
                        </ViewComponent>
                    </ViewComponent>

                    {/* Health (Mục tiêu = Tăng cân) */}
                    <ViewComponent variant="card" p={PAD_CARD} mb={22} radius={20}>
                        <TextComponent text="Chỉ số sức khỏe" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent row between mt={16} gap={14}>
                            {[
                                { label: 'Cân nặng', value: '60 kg' },
                                { label: 'BMI', value: '21.3' },
                                { label: 'Mục tiêu', value: 'Tăng cân' },
                            ].map(item => (
                                <ViewComponent key={item.label} flex={1} p={18} radius={16} border borderColor={C.border} backgroundColor={C.bg} alignItems="center">
                                    <TextComponent text={item.label} tone="muted" />
                                    <TextComponent text={item.value} weight="bold" />
                                </ViewComponent>
                            ))}
                        </ViewComponent>
                    </ViewComponent>

                    {/* Insight */}
                    <ViewComponent variant="card" p={PAD_CARD} mb={48} radius={20}>
                        <TextComponent text="Đề xuất" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent mt={16}>
                            <TextComponent text="👉 Bạn thường thiếu chất xơ, hãy bổ sung rau xanh." />
                        </ViewComponent>
                        <ViewComponent mt={12}>
                            <TextComponent text="💧 3 ngày gần đây bạn uống dưới 2L nước." />
                        </ViewComponent>
                        <ViewComponent mt={12}>
                            <TextComponent text="🔥 Tuần này bạn tập luyện nhiều hơn 20% so với tuần trước." />
                        </ViewComponent>
                    </ViewComponent>
                </ScrollView>
            </ViewComponent>
        </Container>
    );
}

const s = StyleSheet.create({
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
});

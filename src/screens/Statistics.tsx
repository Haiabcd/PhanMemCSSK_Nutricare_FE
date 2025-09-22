import React, { useState } from 'react';
import { ScrollView, Pressable, Platform, Modal, Image, Dimensions, View, StyleSheet } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Entypo from 'react-native-vector-icons/Entypo';
import DateTimePicker from '@react-native-community/datetimepicker';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const chartW = Math.min(360, SCREEN_W - 32);

/* Avatar fallback */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (photoUri) {
        return (
            <Image
                source={{ uri: photoUri }}
                style={{ width: 52, height: 52, borderRadius: 999 }}
            />
        );
    }

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

const fmtVNFull = (d: Date) => {
    const dow = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
    const dd = `${d.getDate()}`.padStart(2, '0');
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${dow}, ${dd} Tháng ${mm}`;
};

export default function Statistics() {
    const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
    const [date, setDate] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const macros = [
        { name: 'Carb', value: 58, color: C.info, legendFontColor: C.text, legendFontSize: 12 },
        { name: 'Protein', value: 35, color: C.success, legendFontColor: C.text, legendFontSize: 12 },
        { name: 'Fat', value: 14, color: C.warning, legendFontColor: C.text, legendFontSize: 12 },
    ];

    const caloriesTrend = [1800, 2000, 1900, 2100, 2200, 1950, 2050];
    const waterTrend = [1.5, 2.0, 1.8, 2.3, 2.0, 2.5, 2.1];
    const labels7 = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
        <Container>
            <ViewComponent style={{ flex: 1 }}>
                {/* Header (đồng nhất với MealPlan) */}
                <ViewComponent row between alignItems="center" mt={20}>
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

                {/* Divider giống MealPlan */}
                <View style={s.line} />

                {/* Date + segmented control */}
                <ViewComponent center mb={12}>
                    <Pressable onPress={() => setShowPicker(true)}>
                        <ViewComponent row center gap={8} flex={0}>
                            <Entypo name="calendar" size={18} color={C.primary} />
                            <TextComponent text={fmtVNFull(date)} variant="subtitle" weight="bold" />
                        </ViewComponent>
                    </Pressable>

                    <ViewComponent
                        row gap={6} mt={8} p={4} radius={999} border
                        borderColor={C.primaryBorder}
                        backgroundColor={C.primarySurface}
                        flex={0}
                    >
                        {(['day', 'week', 'month'] as const).map(opt => {
                            const active = range === opt;
                            return (
                                <Pressable key={opt} onPress={() => setRange(opt)}>
                                    <ViewComponent
                                        center
                                        radius={999}
                                        style={{ minWidth: 100, height: 40, paddingHorizontal: 12 }}
                                        backgroundColor={active ? C.primary : undefined}
                                        flex={0}
                                    >
                                        <TextComponent
                                            text={opt === 'day' ? 'Theo ngày' : opt === 'week' ? 'Theo tuần' : 'Theo tháng'}
                                            size={12}
                                            weight="bold"
                                            color={active ? C.onPrimary : C.text}
                                        />
                                    </ViewComponent>
                                </Pressable>
                            );
                        })}
                    </ViewComponent>
                </ViewComponent>

                {/* DatePicker modal */}
                <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
                    <Pressable onPress={() => setShowPicker(false)}>
                        <ViewComponent
                            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
                            justifyContent="flex-end"
                            p={0}
                            pb={0}
                            flex={1}
                        >
                            <Pressable>
                                <ViewComponent
                                    backgroundColor={C.white}
                                    radius={16}
                                    border
                                    borderColor={C.border}
                                    style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8, paddingBottom: 12 }}
                                >
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                                        onChange={(event, d) => {
                                            if (Platform.OS === 'android') {
                                                setShowPicker(false);
                                                if ((event as any).type === 'set' && d) setDate(d);
                                            } else if (d) {
                                                setDate(d);
                                            }
                                        }}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <Pressable onPress={() => setShowPicker(false)}>
                                            <ViewComponent
                                                center
                                                radius={999}
                                                backgroundColor={C.primary}
                                                style={{ alignSelf: 'center', marginTop: 8, paddingHorizontal: 18, paddingVertical: 10 }}
                                                flex={0}
                                            >
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
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {/* Pie dinh dưỡng */}
                    <ViewComponent variant="card" p={20} mb={12} radius={20}>
                        <TextComponent text="Dinh dưỡng hôm nay" variant="h3" weight="bold" tone="primary" />
                        <PieChart
                            data={macros}
                            width={chartW}
                            height={180}
                            chartConfig={{ color: () => C.primary }}
                            accessor="value"
                            backgroundColor="transparent"
                            hasLegend
                            absolute
                        />
                        <ViewComponent mt={6}>
                            <TextComponent text="1800 / 2100 kcal" tone="muted" align="center" />
                        </ViewComponent>
                    </ViewComponent>

                    {/* Calo */}
                    <ViewComponent variant="card" p={20} mb={12} radius={20}>
                        <TextComponent text="Xu hướng Calo" variant="h3" weight="bold" tone="primary" />
                        <LineChart
                            data={{ labels: labels7, datasets: [{ data: caloriesTrend }] }}
                            width={chartW}
                            height={200}
                            chartConfig={{
                                backgroundGradientFrom: C.white,
                                backgroundGradientTo: C.white,
                                color: () => C.primary,
                                labelColor: () => C.text,
                            }}
                            bezier
                            style={{ marginTop: 10 }}
                        />
                    </ViewComponent>

                    {/* Nước */}
                    <ViewComponent variant="card" p={20} mb={12} radius={20}>
                        <TextComponent text="Uống nước" variant="h3" weight="bold" tone="primary" />
                        <LineChart
                            data={{ labels: labels7, datasets: [{ data: waterTrend }] }}
                            width={chartW}
                            height={200}
                            chartConfig={{
                                backgroundGradientFrom: C.white,
                                backgroundGradientTo: C.white,
                                color: () => C.info,
                                labelColor: () => C.text,
                            }}
                            bezier
                            style={{ marginTop: 10 }}
                        />
                    </ViewComponent>

                    {/* Health */}
                    <ViewComponent variant="card" p={20} mb={12} radius={20}>
                        <TextComponent text="Chỉ số sức khỏe" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent row between mt={12} gap={8}>
                            {[
                                { label: 'Cân nặng', value: '60 kg' },
                                { label: 'BMI', value: '21.3' },
                                { label: 'Mỡ cơ thể', value: '15%' },
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

                    {/* Insight */}
                    <ViewComponent variant="card" p={20} mb={28} radius={20}>
                        <TextComponent text="Đề xuất" variant="h3" weight="bold" tone="primary" />
                        <ViewComponent mt={10}>
                            <TextComponent text="👉 Bạn thường thiếu chất xơ, hãy bổ sung rau xanh." />
                        </ViewComponent>
                        <ViewComponent mt={6}>
                            <TextComponent text="💧 3 ngày gần đây bạn uống dưới 2L nước." />
                        </ViewComponent>
                        <ViewComponent mt={6}>
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
    avatarFallback: {
        width: 52,
        height: 52,
        borderRadius: 999,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 999,
    },
    line: {
        height: 2,
        backgroundColor: C.border,
        marginVertical: 12,
    },
});

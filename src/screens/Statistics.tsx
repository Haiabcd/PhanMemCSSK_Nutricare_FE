// screens/Statistics.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    ScrollView,
    Pressable,
    View,
    Platform,
    Modal,
    Image,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Entypo from 'react-native-vector-icons/Entypo';
import DateTimePicker from '@react-native-community/datetimepicker';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

const screenWidth = 340; // bạn có thể thay bằng Dimensions.get('window').width - margin

/* Avatar fallback */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    if (photoUri)
        return <Image source={{ uri: photoUri }} style={s.avatar} />;
    return (
        <ViewComponent center style={s.avatarFallback} flex={0}>
            <TextComponent
                text={initials}
                variant="subtitle"
                weight="bold"
                tone="primary"
            />
        </ViewComponent>
    );
}

const fmtVNFull = (d: Date) => {
    const dow = [
        'Chủ nhật',
        'Thứ 2',
        'Thứ 3',
        'Thứ 4',
        'Thứ 5',
        'Thứ 6',
        'Thứ 7',
    ][d.getDay()];
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
            {/* Header */}
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

            <View style={s.line} />

            {/* Date + segmented control */}
            <ViewComponent center mb={12}>
                <Pressable onPress={() => setShowPicker(true)}>
                    <ViewComponent row center gap={8} flex={0}>
                        <Entypo name="calendar" size={18} color={C.primary} />
                        <TextComponent
                            text={fmtVNFull(date)}
                            variant="subtitle"
                            weight="bold"
                        />
                    </ViewComponent>
                </Pressable>

                <ViewComponent
                    row
                    gap={6}
                    mt={8}
                    p={4}
                    radius={999}
                    border
                    borderColor={C.primaryBorder}
                    backgroundColor={C.primarySurface}
                    flex={0}
                >
                    {(['day', 'week', 'month'] as const).map(opt => (
                        <Pressable
                            key={opt}
                            onPress={() => setRange(opt)}
                            style={[s.segmentBtn, range === opt && s.segmentBtnActive]}
                        >
                            <TextComponent
                                text={
                                    opt === 'day'
                                        ? 'Theo ngày'
                                        : opt === 'week'
                                            ? 'Theo tuần'
                                            : 'Theo tháng'
                                }
                                size={12}
                                weight="bold"
                                color={range === opt ? C.onPrimary : C.text}
                            />
                        </Pressable>
                    ))}
                </ViewComponent>
            </ViewComponent>

            {/* DatePicker modal */}
            <Modal
                visible={showPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPicker(false)}
            >
                <Pressable style={s.pickerSheet} onPress={() => setShowPicker(false)}>
                    <Pressable style={s.pickerBox}>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                            onChange={(event, d) => {
                                if (Platform.OS === 'android') {
                                    setShowPicker(false);
                                    if (event.type === 'set' && d) setDate(d);
                                } else if (d) {
                                    setDate(d);
                                }
                            }}
                        />
                        {Platform.OS === 'ios' && (
                            <Pressable onPress={() => setShowPicker(false)} style={s.doneBtn}>
                                <TextComponent text="Xong" weight="bold" color={C.onPrimary} />
                            </Pressable>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Nội dung */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Pie dinh dưỡng */}
                <ViewComponent variant="card" p={20} mb={12} style={s.card}>
                    <TextComponent text="Dinh dưỡng hôm nay" variant="h3" weight="bold" tone="primary" />
                    <PieChart
                        data={macros}
                        width={screenWidth}
                        height={180}
                        chartConfig={{
                            color: () => C.primary,
                        }}
                        accessor="value"
                        backgroundColor="transparent"
                        hasLegend={true}
                        absolute
                    />
                    <TextComponent mt={6} text="1800 / 2100 kcal" tone="muted" align="center" />
                </ViewComponent>

                {/* Calo */}
                <ViewComponent variant="card" p={20} mb={12} style={s.card}>
                    <TextComponent text="Xu hướng Calo" variant="h3" weight="bold" tone="primary" />
                    <LineChart
                        data={{
                            labels: labels7,
                            datasets: [{ data: caloriesTrend }],
                        }}
                        width={screenWidth}
                        height={200}
                        chartConfig={{
                            backgroundGradientFrom: '#fff',
                            backgroundGradientTo: '#fff',
                            color: () => C.primary,
                            labelColor: () => C.text,
                        }}
                        bezier
                        style={{ marginTop: 10 }}
                    />
                </ViewComponent>

                {/* Nước */}
                <ViewComponent variant="card" p={20} mb={12} style={s.card}>
                    <TextComponent text="Uống nước" variant="h3" weight="bold" tone="primary" />
                    <LineChart
                        data={{
                            labels: labels7,
                            datasets: [{ data: waterTrend }],
                        }}
                        width={screenWidth}
                        height={200}
                        chartConfig={{
                            backgroundGradientFrom: '#fff',
                            backgroundGradientTo: '#fff',
                            color: () => C.info,
                            labelColor: () => C.text,
                        }}
                        bezier
                        style={{ marginTop: 10 }}
                    />
                </ViewComponent>

                {/* Health */}
                <ViewComponent variant="card" p={20} mb={12} style={s.card}>
                    <TextComponent text="Chỉ số sức khỏe" variant="h3" weight="bold" tone="primary" />
                    <ViewComponent row between mt={12}>
                        <View style={s.healthBox}>
                            <TextComponent text="Cân nặng" tone="muted" />
                            <TextComponent text="60 kg" weight="bold" />
                        </View>
                        <View style={s.healthBox}>
                            <TextComponent text="BMI" tone="muted" />
                            <TextComponent text="21.3" weight="bold" />
                        </View>
                        <View style={s.healthBox}>
                            <TextComponent text="Mỡ cơ thể" tone="muted" />
                            <TextComponent text="15%" weight="bold" />
                        </View>
                    </ViewComponent>
                </ViewComponent>

                {/* Insight */}
                <ViewComponent variant="card" p={20} mb={28} style={s.card}>
                    <TextComponent text="Đề xuất" variant="h3" weight="bold" tone="primary" />
                    <TextComponent mt={10} text="👉 Bạn thường thiếu chất xơ, hãy bổ sung rau xanh." />
                    <TextComponent mt={6} text="💧 3 ngày gần đây bạn uống dưới 2L nước." />
                    <TextComponent mt={6} text="🔥 Tuần này bạn tập luyện nhiều hơn 20% so với tuần trước." />
                </ViewComponent>
            </ScrollView>
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
    avatar: { width: 52, height: 52, borderRadius: 999 },

    line: { height: 2, backgroundColor: C.border, marginVertical: 12 },

    segmentBtn: {
        minWidth: 100,
        height: 40,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    segmentBtnActive: { backgroundColor: C.primary },

    pickerSheet: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    pickerBox: {
        backgroundColor: C.white,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderColor: C.border,
    },
    doneBtn: {
        alignSelf: 'center',
        marginTop: 8,
        backgroundColor: C.primary,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 999,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.white,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
    },
    healthBox: {
        flex: 1,
        marginHorizontal: 4,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.bg,
        alignItems: 'center',
    },
});

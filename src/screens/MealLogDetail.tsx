import React, { useState } from 'react';
import { Image, StyleSheet, ScrollView, Pressable, View, Linking } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

type MealType = 'Sáng' | 'Trưa' | 'Chiều' | 'Phụ';
type Ingredient = { name: string; qty: string };
type Step = { idx: number; text: string };
type MacroKey = 'carb' | 'protein' | 'fat' | 'fiber';
type Macro = { key: MacroKey; label: string; value: number; unit?: string };

type MealDetail = {
    mealType: MealType;
    image: string;
    title: string;
    descriptionTitle: string;
    description: string;
    servingTitle: string;
    servingNote: string;
    calories: number;
    macros: Macro[];
    ingredients: Ingredient[];
    steps: Step[];
    videoTitle: string;
    videoUrl: string;
};

const DEMO: MealDetail = {
    mealType: 'Trưa',
    image:
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1600&auto=format&fit=crop',
    title: 'Cơm gà áp chảo rau củ',
    descriptionTitle: 'Mô tả món ăn',
    description:
        'Ức gà áp chảo cùng rau củ (bông cải xanh, cà rốt) với ít dầu ô liu. Cân bằng đạm nạc và chất xơ, phù hợp giữ dáng/giảm mỡ.',
    servingTitle: 'Khẩu phần & Thành phần dinh dưỡng',
    servingNote: '1 khẩu phần ~ 350 g (ước lượng)',
    calories: 520,
    macros: [
        { key: 'carb', label: 'Carb', value: 58, unit: 'g' },
        { key: 'protein', label: 'Đạm', value: 35, unit: 'g' },
        { key: 'fat', label: 'Béo', value: 14, unit: 'g' },
        { key: 'fiber', label: 'Xơ', value: 7, unit: 'g' },
    ],
    ingredients: [
        { name: 'Ức gà', qty: '150 g' },
        { name: 'Cơm trắng', qty: '180 g' },
        { name: 'Bông cải xanh', qty: '80 g' },
        { name: 'Cà rốt', qty: '50 g' },
        { name: 'Dầu ô liu', qty: '1 thìa cà phê' },
        { name: 'Muối/tiêu', qty: 'vừa ăn' },
    ],
    steps: [
        { idx: 1, text: 'Ướp ức gà với muối/tiêu 10–15 phút.' },
        { idx: 2, text: 'Áp chảo gà lửa vừa tới chín vàng hai mặt.' },
        { idx: 3, text: 'Luộc/hấp bông cải & cà rốt chín tới.' },
        { idx: 4, text: 'Xới cơm, bày gà và rau, rưới chút dầu ô liu.' },
    ],
    videoTitle: 'Video hướng dẫn nấu ăn',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

function MacroCard({ m }: { m: Macro }) {
    const tone: Record<MacroKey, string> = {
        carb: C.info,
        protein: C.success,
        fat: C.warning,
        fiber: C.primary,
    };
    return (
        <ViewComponent variant="card" p={10} style={[s.macroPill, { borderColor: C.border, backgroundColor: C.bg }]}>
            <TextComponent text={m.label} size={12} tone="muted" />
            <TextComponent text={`${m.value}${m.unit ?? 'g'}`} weight="bold" color={tone[m.key]} />
        </ViewComponent>
    );
}

type Props = { onBack?: () => void };

export default function MealLogDetail({ onBack }: Props) {
    const [data] = useState<MealDetail>(DEMO);
    const [isAdded, setIsAdded] = useState(false);

    const openVideo = () => Linking.openURL(data.videoUrl).catch(() => { });
    const toggleAdd = () => setIsAdded(v => !v);
    const goBack = () => (onBack ? onBack() : console.log('Back pressed'));

    return (
        <Container>
            {/* Header */}
            <ViewComponent row alignItems="center" mt={8} mb={12}>
                <Pressable onPress={goBack} style={s.backBtn} hitSlop={10}>
                    <Entypo name="chevron-left" size={22} color={C.primary} />
                </Pressable>

                <TextComponent
                    text={data.title}
                    variant="h2"
                    weight="bold"
                    style={{ flex: 1, marginHorizontal: 8 }}
                    numberOfLines={1}
                />

                <View style={s.singleChip}>
                    <TextComponent text={data.mealType} weight="bold" size={12} color={C.onPrimary} />
                </View>
            </ViewComponent>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPad}>
                {/* Ảnh + overlay */}
                <View style={s.imageWrap}>
                    <Image source={{ uri: data.image }} style={s.image} />
                    <View style={s.imageShade} />
                    <Pressable onPress={toggleAdd} style={[s.addCircle, isAdded && s.addCircleActive]}>
                        <Entypo name={isAdded ? 'check' : 'plus'} size={20} color={isAdded ? C.onPrimary : C.primary} />
                    </Pressable>
                </View>

                {/* Mô tả */}
                <ViewComponent variant="card" p={24} mb={20} style={s.descCard}>
                    <View style={s.descHeader}>
                        <View style={s.descBar} />
                        <TextComponent
                            text={data.descriptionTitle}
                            variant="h3"
                            weight="bold"
                            tone="primary"
                            style={{ marginLeft: 10 }}
                        />
                    </View>

                    <TextComponent
                        mt={16}
                        text={data.description}
                        style={s.descText}
                    />
                </ViewComponent>

                {/* Khẩu phần & Thành phần dinh dưỡng — BẢN GỌN */}
                <ViewComponent variant="card" p={16} mb={16} style={s.card}>
                    <ViewComponent row between alignItems="center">
                        <TextComponent text={data.servingNote} tone="muted" />
                        <ViewComponent style={s.kcalBadge} p={8} radius={999} flex={0}>
                            <TextComponent text={`${data.calories} kcal`} weight="bold" tone="primary" size={13} />
                        </ViewComponent>
                    </ViewComponent>

                    <View style={s.macroRow}>
                        <View style={s.macroCol}>
                            <MacroCard m={data.macros[0]} />
                        </View>
                        <View style={s.macroCol}>
                            <MacroCard m={data.macros[1]} />
                        </View>
                        <View style={s.macroCol}>
                            <MacroCard m={data.macros[2]} />
                        </View>
                        <View style={s.macroCol}>
                            <MacroCard m={data.macros[3]} />
                        </View>
                    </View>
                </ViewComponent>

                {/* Nguyên liệu */}
                <ViewComponent variant="card" p={20} mb={16} style={s.card}>
                    <TextComponent text="Nguyên liệu & định lượng" variant="h3" weight="bold" tone="primary" />
                    <View style={{ marginTop: 10 }}>
                        {data.ingredients.map((ing, idx) => (
                            <View key={idx} style={s.ingRow}>
                                <TextComponent text={ing.name} />
                                <TextComponent text={ing.qty} weight="bold" tone="primary" />
                            </View>
                        ))}
                    </View>
                </ViewComponent>

                {/* Các bước */}
                <ViewComponent variant="card" p={20} mb={16} style={s.card}>
                    <TextComponent text="Các bước chế biến" variant="h3" weight="bold" tone="primary" />
                    <View style={{ marginTop: 10 }}>
                        {data.steps.map(sv => (
                            <View key={sv.idx} style={s.stepRow}>
                                <View style={s.stepBadge}>
                                    <TextComponent text={`${sv.idx}`} weight="bold" color={C.onPrimary} />
                                </View>
                                <TextComponent text={sv.text} style={{ flex: 1, marginLeft: 12 }} />
                            </View>
                        ))}
                    </View>
                </ViewComponent>

                {/* Video */}
                <ViewComponent variant="card" p={20} mb={24} style={s.card}>
                    <TextComponent text={data.videoTitle} variant="h3" weight="bold" tone="primary" />
                    <Pressable onPress={openVideo} style={s.videoThumb}>
                        <Image source={{ uri: data.image }} style={s.videoImg} />
                        <View style={s.playOverlay}>
                            <Entypo name="controller-play" size={40} color={C.onPrimary} />
                        </View>
                    </Pressable>
                </ViewComponent>
            </ScrollView>
        </Container>
    );
}

const s = StyleSheet.create({
    scrollPad: { paddingBottom: 24 },

    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    },

    singleChip: {
        backgroundColor: C.primary,
        borderRadius: 999,
        paddingHorizontal: 16,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },

    imageWrap: {
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 16,
    },
    image: { width: '100%', height: 240 },
    imageShade: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },

    addCircle: {
        position: 'absolute',
        right: 14,
        top: 14,
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    addCircleActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },

    card: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 20,
        backgroundColor: C.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },

    kcalBadge: {
        borderWidth: 1,
        borderColor: C.primaryBorder,
        backgroundColor: C.primarySurface,
        borderRadius: 999,
    },

    macroRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        marginHorizontal: -6,
    },
    macroCol: {
        width: '50%',
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    macroPill: {
        borderWidth: 1,
        borderRadius: 14,
    },

    ingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 10,
        backgroundColor: C.bg,
    },

    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    stepBadge: {
        width: 30, height: 30, borderRadius: 999,
        backgroundColor: C.primary,
        alignItems: 'center', justifyContent: 'center',
    },

    videoThumb: {
        marginTop: 12,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.border,
        position: 'relative',
    },
    videoImg: { width: '100%', height: 208 },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },

    // ==== Description styles ====
    descCard: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 22,
        backgroundColor: C.bg,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    descHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    descBar: {
        width: 5,
        height: 22,
        borderRadius: 3,
        backgroundColor: C.primary,
    },
    descText: {
        fontSize: 15,
        lineHeight: 26,
        color: C.text,
    },
});

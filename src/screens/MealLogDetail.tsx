import React, { useState } from 'react';
import { Image, StyleSheet, ScrollView, Pressable, View, Linking } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';

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

/* ====== Macro card: nhẹ nhàng, đồng bộ ====== */
function MacroCard({ m }: { m: Macro }) {
    const tone: Record<MacroKey, string> = {
        carb: C.accent,
        protein: C.success,
        fat: C.amber500,
        fiber: C.primary,
    };
    return (
        <ViewComponent variant="card" p={12} radius={14} style={s.macroCard}>
            <TextComponent text={m.label} variant="caption" tone="muted" />
            <TextComponent text={`${m.value}${m.unit ?? 'g'}`} weight="semibold" color={tone[m.key]} />
        </ViewComponent>
    );
}

type Props = { onBack?: () => void };

export default function MealLogDetail({ onBack }: Props) {
    const [data] = useState<MealDetail>(DEMO);
    const [isAdded, setIsAdded] = useState(false);
    const navigation = useNavigation();

    const openVideo = () => Linking.openURL(data.videoUrl).catch(() => { });
    const toggleAdd = () => setIsAdded(v => !v);
    const goBack = () => (onBack ? onBack() : (navigation as any).goBack?.());

    return (
        <Container>
            {/* Header */}
            <ViewComponent row alignItems="center" mt={12} mb={12}>
                <Pressable onPress={goBack} style={s.backBtn} hitSlop={10}>
                    <Entypo name="chevron-left" size={22} color={C.primary} />
                </Pressable>

                <TextComponent
                    text={data.title}
                    variant="h3"
                    weight="semibold"
                    style={{ flex: 1, marginHorizontal: 10 }}
                    numberOfLines={1}
                />

                <ViewComponent
                    px={14}
                    radius={999}
                    backgroundColor={C.primary}
                    style={{ height: 34, alignItems: 'center', justifyContent: 'center' }}
                    flex={0}
                >
                    <TextComponent text={data.mealType} weight="semibold" size={12} color={C.onPrimary} />
                </ViewComponent>
            </ViewComponent>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
                {/* Ảnh + overlay + nút thêm */}
                <ViewComponent radius={22} border borderColor={C.border} style={s.imageWrap}>
                    <Image source={{ uri: data.image }} style={s.image} />
                    <View style={s.imageShade} />
                    <Pressable onPress={toggleAdd} style={[s.addCircle, isAdded && s.addCircleActive]}>
                        <Entypo name={isAdded ? 'check' : 'plus'} size={20} color={isAdded ? C.onPrimary : C.primary} />
                    </Pressable>
                </ViewComponent>

                {/* Mô tả */}
                <ViewComponent variant="card" p={18} radius={18} mb={16}>
                    <ViewComponent row alignItems="center" mb={6} gap={10} flex={0}>
                        <View style={s.descBar} />
                        <TextComponent text={data.descriptionTitle} variant="h3" weight="semibold" />
                    </ViewComponent>
                    <TextComponent text={data.description} variant="body" style={s.descText} />
                </ViewComponent>

                {/* Khẩu phần & dinh dưỡng (gọn) */}
                <ViewComponent variant="card" p={16} radius={18} mb={16}>
                    <ViewComponent row between alignItems="center">
                        <TextComponent text={data.servingNote} variant="caption" tone="muted" />
                        <ViewComponent p={8} radius={999} border borderColor={C.primaryBorder} backgroundColor={C.primarySurface} flex={0}>
                            <TextComponent text={`${data.calories} kcal`} weight="semibold" tone="primary" size={13} />
                        </ViewComponent>
                    </ViewComponent>

                    <ViewComponent row wrap gap={12} mt={12}>
                        {data.macros.map(m => (
                            <View key={m.key} style={{ width: '48%' }}>
                                <MacroCard m={m} />
                            </View>
                        ))}
                    </ViewComponent>
                </ViewComponent>

                {/* Nguyên liệu */}
                <ViewComponent variant="card" p={18} radius={18} mb={16}>
                    <TextComponent text="Nguyên liệu & định lượng" variant="h3" weight="semibold" />
                    <ViewComponent mt={10} gap={10}>
                        {data.ingredients.map((ing, idx) => (
                            <ViewComponent
                                key={idx}
                                row
                                between
                                px={14}
                                py={10}
                                radius={14}
                                border
                                borderColor={C.border}
                                backgroundColor={C.bg}
                            >
                                <TextComponent text={ing.name} />
                                <TextComponent text={ing.qty} weight="semibold" tone="primary" />
                            </ViewComponent>
                        ))}
                    </ViewComponent>
                </ViewComponent>

                {/* Các bước */}
                <ViewComponent variant="card" p={18} radius={18} mb={16}>
                    <TextComponent text="Các bước chế biến" variant="h3" weight="semibold" />
                    <ViewComponent mt={10} gap={10}>
                        {data.steps.map(step => (
                            <ViewComponent key={step.idx} row alignItems="flex-start" gap={12}>
                                <View style={s.stepBadge}>
                                    <TextComponent text={`${step.idx}`} weight="bold" color={C.onPrimary} />
                                </View>
                                <TextComponent text={step.text} style={{ flex: 1 }} />
                            </ViewComponent>
                        ))}
                    </ViewComponent>
                </ViewComponent>

                {/* Video */}
                <ViewComponent variant="card" p={18} radius={18} mb={20}>
                    <TextComponent text={data.videoTitle} variant="h3" weight="semibold" />
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
    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    },

    imageWrap: {
        overflow: 'hidden',
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
        width: 44, height: 44, borderRadius: 999,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    addCircleActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },

    /* Macro */
    macroCard: {
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.white,
    },

    /* Video */
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

    /* Description */
    descBar: { width: 5, height: 22, borderRadius: 3, backgroundColor: C.primary },
    descText: { fontSize: 14, lineHeight: 22, color: C.text }, // nhẹ, dễ đọc
});

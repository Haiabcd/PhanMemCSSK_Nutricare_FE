// src/screens/ContentDetail.tsx
import React from 'react';
import { Image, StyleSheet, ScrollView, Pressable, View, Linking } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
// Nếu bạn có react-native-video, có thể import và dùng thay cho ảnh thumbnail
// import Video from 'react-native-video';

type MacroKey = 'carb' | 'protein' | 'fat' | 'fiber';
type Macro = { key: MacroKey; label: string; value: number; unit?: string };
type Ingredient = { name: string; qty: string };
type Step = { idx: number; text: string };

type BaseItem = {
    id: string;
    title: string;
    cover: string;          // ảnh/thumbnail
    tag: 'Món ăn' | 'Bài báo' | 'Video';
};

type RecipeItem = BaseItem & {
    type: 'recipe';
    description?: string;
    servingNote?: string;
    calories?: number;
    macros?: Macro[];
    ingredients: Ingredient[];
    steps: Step[];
    videoUrl?: string;      // optional video hướng dẫn
};

type ArticleItem = BaseItem & {
    type: 'article';
    excerpt?: string;
    contentText?: string;   // nội dung text (đã strip HTML) hoặc markdown render sẵn
    contentHtml?: string;   // nếu muốn render HTML, bạn có thể dùng react-native-render-html/WebView
};

type VideoItem = BaseItem & {
    type: 'video';
    videoUrl: string;       // link YouTube/vod
    description?: string;
};

export type ContentDetailParam =
    | RecipeItem
    | ArticleItem
    | VideoItem;

type Props = {
    route?: { params?: { item: ContentDetailParam } };
    navigation?: {
        goBack?: () => void;
        canGoBack?: () => boolean;
        navigate?: (name: string, params?: any) => void;
    };
};

// ---------- UI helpers ----------
function MacroPill({ m }: { m: Macro }) {
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

function HeroMedia({
    cover,
    onAddToggle,
    isAdded,
    videoUrl,
    playable,
}: {
    cover: string;
    onAddToggle?: () => void;
    isAdded?: boolean;
    videoUrl?: string;
    playable?: boolean; // true với video screen
}) {
    const openVideo = () => videoUrl && Linking.openURL(videoUrl).catch(() => { });
    return (
        <View style={s.imageWrap}>
            {/* Nếu dùng react-native-video: thay Image bằng <Video source={{uri: videoUrl}} .../> khi playable === true */}
            <Image source={{ uri: cover }} style={s.image} />
            <View style={s.imageShade} />
            {playable && (
                <Pressable onPress={openVideo} style={s.playOverlay}>
                    <Entypo name="controller-play" size={44} color={C.onPrimary} />
                </Pressable>
            )}
            {!!onAddToggle && (
                <Pressable onPress={onAddToggle} style={[s.addCircle, isAdded && s.addCircleActive]}>
                    <Entypo name={isAdded ? 'check' : 'plus'} size={20} color={isAdded ? C.onPrimary : C.primary} />
                </Pressable>
            )}
        </View>
    );
}

// ---------- Screen ----------
export default function ContentDetail({ route, navigation }: Props) {
    const item = route?.params?.item as ContentDetailParam | undefined;

    // fallback demo nếu quên truyền param
    const fallback: RecipeItem = {
        id: 'demo',
        type: 'recipe',
        tag: 'Món ăn',
        title: 'Cơm gà áp chảo rau củ',
        cover:
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1600&auto=format&fit=crop',
        description:
            'Ức gà áp chảo cùng rau củ (bông cải xanh, cà rốt) với ít dầu ô liu. Cân bằng đạm nạc và chất xơ, phù hợp giữ dáng/giảm mỡ.',
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
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    const data = item ?? fallback;

    const goBack = () => {
        if (navigation?.canGoBack?.()) navigation.goBack?.();
        else navigation?.navigate?.('Home', { screen: 'MealPlan' });
    };

    // để demo nút +/✓ cho recipe
    const [isAdded, setIsAdded] = React.useState(false);

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
                    <TextComponent text={data.tag} weight="bold" size={12} color={C.onPrimary} />
                </View>
            </ViewComponent>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPad}>
                {/* Media: image / video hero */}
                <HeroMedia
                    cover={data.cover}
                    playable={data.type === 'video'}
                    videoUrl={(data as VideoItem).videoUrl}
                    onAddToggle={data.type === 'recipe' ? () => setIsAdded(v => !v) : undefined}
                    isAdded={isAdded}
                />

                {/* COMMON: mô tả ngắn nếu có */}
                {'description' in data && !!data.description && (
                    <ViewComponent variant="card" p={24} mb={20} style={s.descCard}>
                        <View style={s.descHeader}>
                            <View style={s.descBar} />
                            <TextComponent
                                text={data.type === 'article' ? 'Tóm tắt' : 'Mô tả món ăn'}
                                variant="h3"
                                weight="bold"
                                tone="primary"
                                style={{ marginLeft: 10 }}
                            />
                        </View>
                        <TextComponent mt={16} text={data.description as string} style={s.descText} />
                    </ViewComponent>
                )}

                {/* SWITCH THEO TYPE */}
                {data.type === 'recipe' && (
                    <>
                        {/* Serving & macro */}
                        {(data.servingNote || data.calories || data.macros?.length) && (
                            <ViewComponent variant="card" p={16} mb={16} style={s.card}>
                                <ViewComponent row between alignItems="center">
                                    <TextComponent text={data.servingNote ?? ''} tone="muted" />
                                    {!!data.calories && (
                                        <ViewComponent style={s.kcalBadge} p={8} radius={999} flex={0}>
                                            <TextComponent text={`${data.calories} kcal`} weight="bold" tone="primary" size={13} />
                                        </ViewComponent>
                                    )}
                                </ViewComponent>

                                {!!data.macros?.length && (
                                    <View style={s.macroRow}>
                                        {data.macros.map(m => (
                                            <View key={m.key} style={s.macroCol}>
                                                <MacroPill m={m} />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </ViewComponent>
                        )}

                        {/* Ingredients */}
                        {!!data.ingredients?.length && (
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
                        )}

                        {/* Steps */}
                        {!!data.steps?.length && (
                            <ViewComponent variant="card" p={20} mb={16} style={s.card}>
                                <TextComponent text="Các bước chế biến" variant="h3" weight="bold" tone="primary" />
                                <View style={{ marginTop: 10 }}>
                                    {data.steps.map(step => (
                                        <View key={step.idx} style={s.stepRow}>
                                            <View style={s.stepBadge}>
                                                <TextComponent text={`${step.idx}`} weight="bold" color={C.onPrimary} />
                                            </View>
                                            <TextComponent text={step.text} style={{ flex: 1, marginLeft: 12 }} />
                                        </View>
                                    ))}
                                </View>
                            </ViewComponent>
                        )}

                        {/* Optional video for recipe */}
                        {!!(data as RecipeItem).videoUrl && (
                            <ViewComponent variant="card" p={20} mb={24} style={s.card}>
                                <TextComponent text="Video hướng dẫn" variant="h3" weight="bold" tone="primary" />
                                <Pressable onPress={() => Linking.openURL((data as RecipeItem).videoUrl!)} style={s.videoThumb}>
                                    <Image source={{ uri: data.cover }} style={s.videoImg} />
                                    <View style={s.playOverlay}>
                                        <Entypo name="controller-play" size={40} color={C.onPrimary} />
                                    </View>
                                </Pressable>
                            </ViewComponent>
                        )}
                    </>
                )}

                {data.type === 'article' && (
                    <ViewComponent variant="card" p={20} mb={24} style={s.card}>
                        <TextComponent text="Nội dung bài viết" variant="h3" weight="bold" tone="primary" />
                        {/* Nếu bạn có HTML, hãy dùng react-native-render-html hoặc WebView để render:
                <RenderHtml contentWidth={width} source={{ html: data.contentHtml! }} />
            */}
                        <TextComponent mt={10} text={(data as ArticleItem).contentText ?? '...'} />
                    </ViewComponent>
                )}

                {data.type === 'video' && (
                    <ViewComponent variant="card" p={20} mb={24} style={s.card}>
                        <TextComponent text="Mô tả video" variant="h3" weight="bold" tone="primary" />
                        <TextComponent mt={8} text={(data as VideoItem).description ?? '...'} />
                    </ViewComponent>
                )}
            </ScrollView>
        </Container>
    );
}

// ---------- styles ----------
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
    addCircleActive: { backgroundColor: C.primary, borderColor: C.primary },

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

    // Description card
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
    descHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    descBar: { width: 5, height: 22, borderRadius: 3, backgroundColor: C.primary },
    descText: { fontSize: 15, lineHeight: 26, color: C.text },

    // Kcal + macro
    kcalBadge: {
        borderWidth: 1, borderColor: C.primaryBorder, backgroundColor: C.primarySurface, borderRadius: 999,
    },
    macroRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginHorizontal: -6 },
    macroCol: { width: '50%', paddingHorizontal: 6, marginBottom: 12 },
    macroPill: { borderWidth: 1, borderRadius: 14 },

    // Ingredient & steps
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
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    stepBadge: { width: 30, height: 30, borderRadius: 999, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },

    // Video thumb
    videoThumb: {
        marginTop: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, position: 'relative',
    },
    videoImg: { width: '100%', height: 208 },
    playOverlay: {
        ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)',
    },
});

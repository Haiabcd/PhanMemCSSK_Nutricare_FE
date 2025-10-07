import React, { useMemo, useRef, useState } from 'react';
import {
    Image,
    Pressable,
    TextInput,
    FlatList,
    StyleSheet,
    useWindowDimensions,
    Animated,
    PanResponder,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';

import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GuideStackParamList } from '../navigation/GuideNavigator';

/* ================== Types & Data ================== */
type Kind = 'all' | 'meal' | 'article' | 'video';

type Item = {
    id: string;
    title: string;
    desc: string;
    kind: Kind;
    cal?: number;
    protein?: number;
    image: string;
    meta?: string;
    weightLine?: string;
    cta?: string;
};

const FILTERS: { key: Kind; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'meal', label: 'Món ăn' },
    { key: 'article', label: 'Bài báo' },
    { key: 'video', label: 'Video' },
];

const DATA: Item[] = [
    { id: '1', title: 'Salad Gà Ớt', desc: 'Món salad tươi ngon, giàu rau củ, phù hợp giảm cân.', kind: 'meal', cal: 380, protein: 18, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop', cta: 'XEM CÔNG THỨC' },
    { id: '2', title: 'Ăn Kiêng Khỏe Mạnh', desc: 'Các mẹo đơn giản để duy trì chế độ ăn cân bằng và lành mạnh.', kind: 'article', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop', cta: 'ĐỌC BÀI' },
    { id: '3', title: 'Nấu Bữa Sáng Cao Protein', desc: 'Hướng dẫn nấu ăn đơn giản với protein cao để bắt đầu ngày.', kind: 'video', meta: '10 phút | Video HD', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop', cta: 'XEM VIDEO' },
    { id: '4', title: 'Quinoa & Cá Hồi', desc: 'Omega-3 từ cá hồi, giàu hạt quinoa cho sức khỏe.', kind: 'meal', weightLine: '450g | 35g protein', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop', cta: 'XEM CÔNG THỨC' },
    { id: '5', title: 'Ăn Chay Lành Mạnh', desc: 'Lợi ích của chế độ ăn vegan cho sức khỏe và môi trường.', kind: 'article', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop', cta: 'ĐỌC BÀI' },
    { id: '6', title: 'Sinh Tố Thấp Calo', desc: 'Công thức smoothie ngon miệng mà vẫn nhẹ nhàng.', kind: 'video', meta: '5 phút | Video nhanh', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop', cta: 'XEM VIDEO' },
    { id: '7', title: 'Sinh Tố Rau Xanh', desc: 'Nước ép rau xanh & trái cây, vitamin tự nhiên.', kind: 'meal', cal: 250, protein: 8, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop', cta: 'XEM CÔNG THỨC' },
    { id: '8', title: 'Nguồn Protein Tốt', desc: 'Khám phá các nguồn protein thực vật & động vật có lợi.', kind: 'article', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop', cta: 'ĐỌC BÀI' },
];

/* ================== Avatar ================== */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;
    return (
        <ViewComponent center radius={999} border backgroundColor={C.bg} style={s.avatar}>
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

/* ================== Card ================== */
function Card({
    item,
    navigation,
}: {
    item: Item;
    navigation: NativeStackNavigationProp<GuideStackParamList>;
}) {
    const kindLabel = item.kind === 'meal' ? 'Món ăn' : item.kind === 'article' ? 'Bài báo' : 'Video';

    const handlePress = () => {
        if (item.kind === 'meal') navigation.navigate('MealLogDetail', { item });
        else if (item.kind === 'article') navigation.navigate('Newspaper', { item });
        else navigation.navigate('Video', { item });
    };

    return (
        <ViewComponent style={s.cardWrap}>
            <ViewComponent variant="card" radius={16} flex={1}>
                {/* Media */}
                <ViewComponent style={s.thumbWrap}>
                    <Image source={{ uri: item.image }} style={s.thumb} resizeMode="cover" />
                    {/* badge */}
                    <ViewComponent
                        center
                        radius={999}
                        px={8}
                        py={4}
                        style={s.badge}
                        backgroundColor="rgba(15,23,42,0.82)"
                        border
                        borderColor="rgba(255,255,255,0.12)"
                    >
                        <TextComponent text={kindLabel} variant="caption" weight="bold" tone="inverse" />
                    </ViewComponent>

                    {/* play overlay cho video */}
                    {item.kind === 'video' && (
                        <ViewComponent
                            center
                            radius={16}
                            style={s.playOverlay}
                            backgroundColor="rgba(0,0,0,0.55)"
                            border
                            borderColor="rgba(255,255,255,0.12)"
                        >
                            <Ionicons name="play" size={20} color={C.onPrimary} />
                        </ViewComponent>
                    )}
                </ViewComponent>

                {/* Body */}
                <ViewComponent style={s.cardBody}>
                    <ViewComponent style={{ flexShrink: 1 }}>
                        {/* Title luôn 2 dòng */}
                        <TextComponent
                            text={item.title}
                            variant="h3"
                            numberOfLines={2}
                            style={{ letterSpacing: 0.15, height: 44, lineHeight: 22 }}
                        />
                        {/* Desc luôn 3 dòng */}
                        <TextComponent
                            text={item.desc}
                            variant="body"
                            tone="muted"
                            numberOfLines={3}
                            style={{ lineHeight: 18, height: 54, textAlignVertical: 'top', marginTop: 2 }}
                        />

                        {/* Meta */}
                        <ViewComponent row gap={8} wrap style={{ marginTop: 8 }}>
                            {typeof item.cal === 'number' && (
                                <ViewComponent
                                    row
                                    alignItems="center"
                                    gap={4}
                                    backgroundColor={C.accentSurface}
                                    border
                                    borderColor={C.accentBorder}
                                    radius={999}
                                    px={8}
                                    py={4}
                                >
                                    <McIcon name="fire" size={14} color={C.red} />
                                    <TextComponent text={`${item.cal} kcal`} variant="caption" weight="bold" />
                                </ViewComponent>
                            )}
                            {typeof item.protein === 'number' && (
                                <ViewComponent
                                    row
                                    alignItems="center"
                                    gap={4}
                                    backgroundColor={C.primarySurface}
                                    border
                                    borderColor={C.primaryBorder}
                                    radius={999}
                                    px={8}
                                    py={4}
                                >
                                    <McIcon name="food-drumstick" size={14} color={C.success} />
                                    <TextComponent text={`${item.protein}g protein`} variant="caption" weight="bold" />
                                </ViewComponent>
                            )}
                            {!!item.weightLine && (
                                <TextComponent text={item.weightLine} variant="caption" tone="muted" numberOfLines={1} />
                            )}
                            {!!item.meta && (
                                <TextComponent text={item.meta} variant="caption" tone="muted" numberOfLines={1} />
                            )}
                        </ViewComponent>
                    </ViewComponent>

                    {/* CTA */}
                    <Pressable
                        onPress={handlePress}
                        style={({ pressed }) => [
                            s.ctaBtn,
                            {
                                backgroundColor: C.primarySurface,
                                borderColor: C.primaryBorder,
                                opacity: pressed ? 0.9 : 1,
                            },
                        ]}
                    >
                        <TextComponent
                            text={item.cta ?? 'XEM THÊM'}
                            variant="caption"
                            weight="bold"
                            style={{ color: C.primaryDark, letterSpacing: 0.3 }}
                            numberOfLines={1}
                        />
                    </Pressable>
                </ViewComponent>
            </ViewComponent>
        </ViewComponent>
    );
}

/* ================== Floating Chat Button (draggable) ================== */
function FloatingChat({
    screenW,
    screenH,
    navigation,
}: {
    screenW: number;
    screenH: number;
    navigation: NativeStackNavigationProp<GuideStackParamList>;
}) {
    const SIZE = 56;
    const MARGIN = 12;

    const pos = useRef(
        new Animated.ValueXY({
            x: screenW - SIZE - MARGIN,
            y: Math.max(MARGIN, Math.min(screenH * 0.65, screenH - SIZE - MARGIN)),
        })
    ).current;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { pos.extractOffset(); },
            onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                pos.flattenOffset();
                const cur = { x: (pos.x as any).__getValue(), y: (pos.y as any).__getValue() };
                const snapX = cur.x + SIZE / 2 > screenW / 2 ? screenW - SIZE - MARGIN : MARGIN;
                const boundedY = clamp(cur.y, MARGIN, screenH - SIZE - MARGIN);
                Animated.spring(pos, { toValue: { x: snapX, y: boundedY }, useNativeDriver: false, bounciness: 8 }).start();
            },
        })
    ).current;

    return (
        <Animated.View
            style={[s.chatBall, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }, pos.getLayout()]}
            pointerEvents="box-none"
            {...panResponder.panHandlers}
        >
            <Pressable style={s.chatInner} onPress={() => navigation.navigate('ChatAI')}>
                <Ionicons name="chatbubble-ellipses" size={24} color={C.onPrimary} />
            </Pressable>
        </Animated.View>
    );
}

/* ================== Screen ================== */
export default function NutritionGuide() {
    const [active, setActive] = useState<Kind>('all');
    const [q, setQ] = useState('');
    const { width: screenW, height: screenH } = useWindowDimensions();
    const navigation = useNavigation<NativeStackNavigationProp<GuideStackParamList>>();

    const filtered = useMemo(() => {
        const qLower = q.trim().toLowerCase();
        return DATA.filter(it => {
            const okKind = active === 'all' ? true : it.kind === active;
            const okQ = qLower.length === 0 ? true : [it.title, it.desc].some(t => t.toLowerCase().includes(qLower));
            return okKind && okQ;
        });
    }, [active, q]);

    const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));

    return (
        <Container>
            {/* Header avatar + chuông */}
            <ViewComponent row between alignItems="center">
                <ViewComponent row alignItems="center" gap={10} flex={0}>
                    <Avatar name="Anh Hải" />
                    <ViewComponent flex={0}>
                        <TextComponent text="Xin chào," variant="caption" tone="muted" />
                        <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
                    </ViewComponent>
                </ViewComponent>

                <Pressable>
                    <ViewComponent
                        center
                        radius={12}
                        backgroundColor={C.bg}
                        border
                        style={{ width: 42, height: 42 }}
                    >
                        <Entypo name="bell" size={20} color={C.primary} />
                    </ViewComponent>
                </Pressable>
            </ViewComponent>

            {/* Khối nội dung */}
            <ViewComponent style={{ flex: 1, minHeight: CONTENT_MIN_HEIGHT, overflow: 'hidden' }}>
                {/* Search */}
                <ViewComponent
                    row
                    alignItems="center"
                    gap={10}
                    backgroundColor={C.white}
                    radius={999}
                    border
                    borderColor={C.border}
                    px={14}
                    style={{ height: 50, marginTop: 10 }}
                >
                    <Ionicons name="search" size={18} color={C.slate500} />
                    <TextInput
                        placeholder="Tìm kiếm nội dung..."
                        placeholderTextColor={C.slate500}
                        value={q}
                        onChangeText={setQ}
                        returnKeyType="search"
                        style={s.searchInput}
                    />
                    {q ? (
                        <Pressable onPress={() => setQ('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={C.slate500} />
                        </Pressable>
                    ) : (
                        <Ionicons name="mic-outline" size={18} color={C.slate500} />
                    )}
                </ViewComponent>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 10, height: 44, maxHeight: 44 }}
                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
                >
                    {FILTERS.map(f => {
                        const isActive = active === f.key;
                        return (
                            <Pressable key={f.key} onPress={() => setActive(f.key)}>
                                <ViewComponent
                                    center
                                    radius={999}
                                    border
                                    px={20}
                                    py={8}
                                    backgroundColor={isActive ? C.primary : C.white}
                                    borderColor={isActive ? C.primary : C.border}
                                    style={isActive ? s.chipActiveShadow : undefined}
                                >
                                    <TextComponent
                                        text={f.label}
                                        variant="caption"
                                        weight="bold"
                                        tone={isActive ? 'inverse' : 'default'}
                                        numberOfLines={1}
                                    />
                                </ViewComponent>
                            </Pressable>
                        );
                    })}
                </ScrollView>


                {/* List */}
                <ViewComponent style={{ flex: 1, minHeight: 0 }}>
                    <FlatList
                        data={filtered}
                        keyExtractor={it => it.id}
                        numColumns={2}
                        renderItem={({ item }) => <Card item={item} navigation={navigation} />}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <ViewComponent center style={{ flex: 1, paddingVertical: 18 }}>
                                <TextComponent text="Không tìm thấy kết quả" variant="h3" />
                                <TextComponent text="Thử thay đổi bộ lọc hoặc từ khóa khác nhé." variant="body" tone="muted" />
                            </ViewComponent>
                        }
                    />
                </ViewComponent>
            </ViewComponent>

            {/* Chat nổi */}
            <FloatingChat screenW={screenW} screenH={screenH} navigation={navigation} />
        </Container>
    );
}

/* ================== Styles (tối thiểu) ================== */
const s = StyleSheet.create({
    avatar: { width: 52, height: 52, borderRadius: 999 },

    // search
    searchInput: { flex: 1, color: C.text, paddingVertical: 8, fontFamily: 'System' },

    chipActiveShadow: {
        shadowColor: C.primary,
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    // grid
    cardWrap: { width: '48%', marginBottom: 12 },

    // media
    thumbWrap: {
        width: '100%',
        aspectRatio: 1.2,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    thumb: { width: '100%', height: '100%' },

    badge: { position: 'absolute', top: 8, right: 8 },
    playOverlay: { position: 'absolute', bottom: 8, right: 8, width: 32, height: 32 },

    // body
    cardBody: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: C.border,
    },

    // CTA
    ctaBtn: {
        alignSelf: 'stretch',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    // floating chat
    chatBall: {
        position: 'absolute',
        zIndex: 20,
        elevation: 12,
        backgroundColor: C.primary,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 2,
        borderColor: C.primaryBorder,
        right: 0,
        bottom: 0,
    },
    chatInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

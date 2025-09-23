import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    Animated,
    PanResponder,
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
    { id: '3', title: 'Nấu Bữa Sáng Cao Protein', desc: 'Hướng dẫn nấu ăn đơn giản với protein cao để bắt đầu ngày.', kind: 'video', meta: '10 phút | Video HD', image: 'https://images.unsplash.com/photo-1551782450-17144c3a8f59?q=80&w=800&auto=format&fit=crop', cta: 'XEM VIDEO' },
    { id: '4', title: 'Quinoa & Cá Hồi', desc: 'Omega-3 từ cá hồi, giàu hạt quinoa cho sức khỏe.', kind: 'meal', weightLine: '450g | 35g protein', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop', cta: 'XEM CÔNG THỨC' },
    { id: '5', title: 'Ăn Chay Lành Mạnh', desc: 'Lợi ích của chế độ ăn vegan cho sức khỏe và môi trường.', kind: 'article', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop', cta: 'ĐỌC BÀI' },
    { id: '6', title: 'Sinh Tố Thấp Calo', desc: 'Công thức smoothie ngon miệng mà vẫn nhẹ nhàng.', kind: 'video', meta: '5 phút | Video nhanh', image: 'https://images.unsplash.com/photo-1556742400-b5b7c5121f90?q=80&w=800&auto=format&fit=crop', cta: 'XEM VIDEO' },
    { id: '7', title: 'Sinh Tố Rau Xanh', desc: 'Nước ép rau xanh & trái cây, vitamin tự nhiên.', kind: 'meal', cal: 250, protein: 8, image: 'https://images.unsplash.com/photo-1542442828-287225e22b67?q=80&w=800&auto=format&fit=crop', cta: 'XEM CÔNG THỨC' },
    { id: '8', title: 'Nguồn Protein Tốt', desc: 'Khám phá các nguồn protein thực vật & động vật có lợi.', kind: 'article', image: 'https://images.unsplash.com/photo-1505575972945-280e1d0d4c57?q=80&w=800&auto=format&fit=crop', cta: 'ĐỌC BÀI' },
];

/* ================== Avatar ================== */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (photoUri) return <Image source={{ uri: photoUri }} style={styles.avatar} />;
    return (
        <ViewComponent center style={styles.avatarFallback} flex={0}>
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

/* ================== Card ================== */
function Card({
    item,
    navigation, // <-- thêm navigation
}: {
    item: Item;
    navigation: NativeStackNavigationProp<GuideStackParamList>;
}) {
    const kindLabel = item.kind === 'meal' ? 'Món ăn' : item.kind === 'article' ? 'Bài báo' : 'Video';

    // điều hướng theo loại nội dung
    const handlePress = () => {
        if (item.kind === 'meal') {
            navigation.navigate('MealLogDetail', { item });
        } else if (item.kind === 'article') {
            navigation.navigate('Newspaper', { item });
        } else if (item.kind === 'video') {
            navigation.navigate('Video', { item });
        }
    };

    return (
        <View style={styles.cardWrap}>
            {/* bấm cả card cũng đi đến màn chi tiết */}
            <Pressable style={styles.card} onPress={handlePress}>
                <View style={styles.thumbWrap}>
                    <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
                    <View style={styles.badge}><Text style={styles.badgeText}>{kindLabel}</Text></View>
                    {item.kind === 'video' && (
                        <View style={styles.playOverlay}><Ionicons name="play" size={20} color="#fff" /></View>
                    )}
                </View>

                <View style={styles.cardBody}>
                    <View>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.cardDesc} numberOfLines={3}>{item.desc}</Text>
                        <View style={styles.metaRow}>
                            {typeof item.cal === 'number' && (
                                <View style={styles.metaPill}>
                                    <McIcon name="fire" size={14} color="#ef4444" />
                                    <Text style={styles.metaText}>{item.cal} kcal</Text>
                                </View>
                            )}
                            {typeof item.protein === 'number' && (
                                <View style={styles.metaPill}>
                                    <McIcon name="food-drumstick" size={14} color="#16a34a" />
                                    <Text style={styles.metaText}>{item.protein}g protein</Text>
                                </View>
                            )}
                            {!!item.weightLine && <Text style={styles.metaLoose} numberOfLines={1}>{item.weightLine}</Text>}
                            {!!item.meta && <Text style={styles.metaLoose} numberOfLines={1}>{item.meta}</Text>}
                        </View>
                    </View>

                    {/* CTA giữ nguyên nhưng cũng gọi handlePress */}
                    <Pressable style={styles.ctaBtn} onPress={handlePress}>
                        <Text style={styles.ctaText}>{item.cta ?? 'XEM THÊM'}</Text>
                    </Pressable>
                </View>
            </Pressable>
        </View>
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
            style={[styles.chatBall, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }, pos.getLayout()]}
            pointerEvents="box-none"
            {...panResponder.panHandlers}
        >
            <Pressable style={styles.chatInner} onPress={() => navigation.navigate('ChatAI')}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
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

    // vùng nội dung: cao tối thiểu theo màn hình nhưng vẫn giãn hết phần còn lại
    const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));

    return (
        <Container>
            {/* Header avatar + chuông (đồng bộ MealPlan) */}
            <ViewComponent row between alignItems="center" mt={20}>
                <ViewComponent row alignItems="center" gap={10} flex={0}>
                    <Avatar name="Anh Hải" />
                    <ViewComponent flex={0}>
                        <TextComponent text="Xin chào," variant="caption" tone="muted" />
                        <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
                    </ViewComponent>
                </ViewComponent>

                <Pressable style={styles.iconContainer/* onPress={() => navigation.navigate('Notification')}*/}>
                    <Entypo name="bell" size={20} color={C.primary} />
                </Pressable>
            </ViewComponent>

            {/* Khối nội dung */}
            <View style={{ flex: 1 }}>
                <View style={[styles.contentBlock, { flex: 1, minHeight: CONTENT_MIN_HEIGHT }]}>
                    {/* Search */}
                    <View style={styles.searchWrap}>
                        <Ionicons name="search" size={18} color="#64748b" />
                        <TextInput
                            placeholder="Tìm kiếm nội dung..."
                            placeholderTextColor="#94a3b8"
                            value={q}
                            onChangeText={setQ}
                            style={styles.searchInput}
                            returnKeyType="search"
                        />
                        {q ? (
                            <Pressable onPress={() => setQ('')} hitSlop={8}><Ionicons name="close-circle" size={18} color="#94a3b8" /></Pressable>
                        ) : (
                            <Ionicons name="mic-outline" size={18} color="#94a3b8" />
                        )}
                    </View>

                    {/* Filters */}
                    <View style={styles.filters}>
                        {FILTERS.map(f => {
                            const isActive = active === f.key;
                            return (
                                <Pressable key={f.key} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setActive(f.key)}>
                                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* List */}
                    <View style={styles.listHolder}>
                        <FlatList
                            data={filtered}
                            keyExtractor={it => it.id}
                            numColumns={2}
                            renderItem={({ item }) => (
                                <Card item={item} navigation={navigation} /> // <-- truyền navigation vào Card
                            )}
                            columnWrapperStyle={styles.columnWrap}
                            contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
                            style={styles.list}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyWrap}>
                                    <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                                    <Text style={styles.emptySub}>Thử thay đổi bộ lọc hoặc từ khóa khác nhé.</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </View>

            {/* Chat nổi */}
            <FloatingChat screenW={screenW} screenH={screenH} navigation={navigation} />
        </Container>
    );
}

/* ================== Styles (gộp 1 nơi) ================== */
const styles = StyleSheet.create({
    // Header (avatar + chuông)
    iconContainer: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    avatarFallback: {
        width: 52, height: 52, borderRadius: 999,
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    },
    avatar: { width: 52, height: 52, borderRadius: 999 },

    // Content block
    contentBlock: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
        overflow: 'hidden',
        flexDirection: 'column',
    },

    // Search
    searchWrap: {
        marginTop: 10, marginHorizontal: 12, height: 42,
        backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14,
        alignItems: 'center', flexDirection: 'row', gap: 8,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    searchInput: { flex: 1, color: '#0f172a', paddingVertical: 8, fontWeight: '600' },

    // Filters
    filters: {
        paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6,
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10,
    },
    chip: {
        minWidth: '23%',
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    },
    chipActive: {
        backgroundColor: '#10b981', borderColor: '#10b981',
        shadowColor: '#10b981', shadowOpacity: 0.14, shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    chipText: { color: '#0f172a', fontWeight: '800', fontSize: 13 },
    chipTextActive: { color: '#fff' },

    // List
    listHolder: { flex: 1, minHeight: 0 },
    list: { flex: 1 },
    listContent: { paddingTop: 6, paddingBottom: 12 },
    columnWrap: { paddingHorizontal: 12, justifyContent: 'space-between' },

    // Card
    cardWrap: { width: '48%', height: 280, marginBottom: 12 },
    card: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: '#eef2f7',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    thumbWrap: { width: '100%', aspectRatio: 1.9 },
    thumb: { width: '100%', height: '100%' },
    badge: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: 'rgba(15,23,42,0.82)',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
    playOverlay: {
        position: 'absolute', bottom: 8, right: 8,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },

    cardBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 0.15 },
    cardDesc: { fontSize: 13, color: '#334155', lineHeight: 18 },

    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    metaPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 999, borderWidth: 1, borderColor: '#e2e8f0',
    },
    metaText: { fontSize: 12, color: '#0f172a', fontWeight: '700' },
    metaLoose: { fontSize: 12, color: '#64748b' },

    ctaBtn: {
        alignSelf: 'flex-start', backgroundColor: '#fce7f3',
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
        borderWidth: 1, borderColor: '#f9a8d4',
    },
    ctaText: { color: '#be185d', fontWeight: '900', fontSize: 12, letterSpacing: 0.2 },

    // Empty state
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
    emptyTitle: { fontWeight: '900', color: '#0f172a', marginBottom: 6 },
    emptySub: { color: '#64748b' },

    // Floating chat
    chatBall: {
        position: 'absolute', zIndex: 20, elevation: 12,
        backgroundColor: '#10b981',
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 2, borderColor: '#34d399',
    },
    chatInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

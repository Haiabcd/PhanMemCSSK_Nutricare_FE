// NutritionGuide.tsx
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
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../components/Container';

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

export default function NutritionGuide() {
    const [active, setActive] = useState<Kind>('all');
    const [q, setQ] = useState('');
    const { width: screenW, height: screenH } = useWindowDimensions();

    const filtered = useMemo(() => {
        const qLower = q.trim().toLowerCase();
        return DATA.filter((it) => {
            const okKind = active === 'all' ? true : it.kind === active;
            const okQ =
                qLower.length === 0
                    ? true
                    : [it.title, it.desc].some((t) => t.toLowerCase().includes(qLower));
            return okKind && okQ;
        });
    }, [active, q]);

    return (
        <Container>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Hướng Dẫn Dinh Dưỡng</Text>
                <Text style={styles.headerSub}>Hướng dẫn dinh dưỡng giúp bạn chạm đến mục tiêu</Text>
            </View>

            {/* Khối trắng bao nội dung — NGẮN LẠI nhờ maxHeight, list cuộn bên trong */}
            <View style={[styles.contentBlock, { maxHeight: Math.max(420, screenH * 0.79) }]}>
                {/* Search */}
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={18} color="#64748b" />
                    <TextInput
                        placeholder="Tìm kiếm nội dung..."
                        placeholderTextColor="#94a3b8"
                        value={q}
                        onChangeText={setQ}
                        style={styles.searchInput}
                    />
                    {q ? (
                        <Pressable onPress={() => setQ('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </Pressable>
                    ) : (
                        <Ionicons name="mic-outline" size={18} color="#94a3b8" />
                    )}
                </View>

                {/* Filters */}
                <View style={styles.filters}>
                    {FILTERS.map((f) => {
                        const isActive = active === f.key;
                        return (
                            <Pressable
                                key={f.key}
                                style={[styles.chip, isActive && styles.chipActive]}
                                onPress={() => setActive(f.key)}
                            >
                                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                    {f.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* GRID 2 cột — mỗi ô bằng nhau, không mất chữ */}
                <FlatList
                    data={filtered}
                    keyExtractor={(it) => it.id}
                    numColumns={2}
                    renderItem={({ item }) => <Card item={item} />}
                    columnWrapperStyle={styles.columnWrap}
                    contentContainerStyle={styles.listContent}
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Chat nổi */}
            <FloatingChat screenW={screenW} screenH={screenH} />
        </Container>
    );
}

function Card({ item }: { item: Item }) {
    const kindLabel =
        item.kind === 'meal' ? 'Món ăn' : item.kind === 'article' ? 'Bài báo' : 'Video';

    return (
        <View style={styles.cardWrap}>
            <View style={styles.card}>
                {/* Ảnh thấp hơn để dành chỗ cho chữ */}
                <View style={styles.thumbWrap}>
                    <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{kindLabel}</Text>
                    </View>
                    {item.kind === 'video' && (
                        <View style={styles.playOverlay}>
                            <Ionicons name="play" size={20} color="#fff" />
                        </View>
                    )}
                </View>

                {/* Body fill còn lại, CTA bám đáy */}
                <View style={styles.cardBody}>
                    <View>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        {/* Cho phép tối đa 3 dòng để không “mất chữ” nhưng ô vẫn đều */}
                        <Text style={styles.cardDesc} numberOfLines={3} ellipsizeMode="tail">
                            {item.desc}
                        </Text>

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
                            {!!item.weightLine && (
                                <Text style={styles.metaLoose} numberOfLines={1}>
                                    {item.weightLine}
                                </Text>
                            )}
                            {!!item.meta && (
                                <Text style={styles.metaLoose} numberOfLines={1}>
                                    {item.meta}
                                </Text>
                            )}
                        </View>
                    </View>

                    <Pressable style={styles.ctaBtn} onPress={() => { }}>
                        <Text style={styles.ctaText}>{item.cta ?? 'XEM THÊM'}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

/** Chat nổi kéo thả */
function FloatingChat({ screenW, screenH }: { screenW: number; screenH: number }) {
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
            onPanResponderGrant: () => {
                pos.extractOffset();
            },
            onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: () => {
                pos.flattenOffset();
                const cur = { x: (pos.x as any).__getValue(), y: (pos.y as any).__getValue() };
                const snapX = cur.x + SIZE / 2 > screenW / 2 ? screenW - SIZE - MARGIN : MARGIN;
                const boundedY = clamp(cur.y, MARGIN, screenH - SIZE - MARGIN);
                Animated.spring(pos, {
                    toValue: { x: snapX, y: boundedY },
                    useNativeDriver: false,
                    bounciness: 8,
                }).start();
            },
        })
    ).current;

    const onPressChat = () => {
        Alert.alert('Chat', 'Mở màn hình chat tại đây.');
    };

    return (
        <Animated.View
            style={[
                styles.chatBall,
                {
                    width: SIZE,
                    height: SIZE,
                    borderRadius: SIZE / 2,
                },
                pos.getLayout(),
            ]}
            pointerEvents="box-none"
            {...panResponder.panHandlers}
        >
            <Pressable style={styles.chatInner} onPress={onPressChat}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </Pressable>
        </Animated.View>
    );
}

// ================== STYLES ==================
const styles = StyleSheet.create({
    // Header
    header: {
        backgroundColor: 'transparent',
        paddingTop: 14,
        paddingBottom: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5efe8',
        marginTop: 20,
    },
    headerTitle: {
        color: '#0f172a',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.1,
    },
    headerSub: { color: '#6b7280', fontSize: 13, marginTop: 2 },

    // Khối trắng bao nội dung (ngắn lại nhờ maxHeight ở trên)
    contentBlock: {
        flexGrow: 0,
        minHeight: 0,
        marginBottom: 12,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        overflow: 'hidden',
    },

    searchWrap: {
        marginTop: 10,
        marginHorizontal: 12,
        height: 42,
        backgroundColor: '#fff',
        borderRadius: 999,
        paddingHorizontal: 14,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: { flex: 1, color: '#0f172a', paddingVertical: 8, fontWeight: '600' },

    filters: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 6,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    chip: {
        minWidth: '23%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chipActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        shadowColor: '#10b981',
        shadowOpacity: 0.14,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    chipText: { color: '#0f172a', fontWeight: '800', fontSize: 13 },
    chipTextActive: { color: '#fff' },

    // FlatList area
    list: {
        flexGrow: 0,     // để list không ép contentBlock cao ra
    },
    listContent: {
        paddingTop: 6,
        paddingBottom: 12,
    },
    columnWrap: {
        paddingHorizontal: 12,
        justifyContent: 'space-between',
    },

    // Mỗi ô bằng nhau (chiều cao cố định), không mất chữ nhờ ảnh thấp & desc tối đa 3 dòng
    cardWrap: {
        width: '48%',
        height: 280,     // có thể chỉnh 260/300 tuỳ ý
        marginBottom: 12,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eef2f7',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    // Ảnh thấp hơn để dành chỗ cho text (aspectRatio lớn -> height nhỏ)
    thumbWrap: {
        width: '100%',
        aspectRatio: 1.9, // từ 1.6 -> 1.9 (ảnh thấp hơn)
    },
    thumb: { width: '100%', height: '100%' },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(15,23,42,0.82)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
    playOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },

    // Body còn lại, CTA bám đáy
    cardBody: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 0.15 },
    cardDesc: { fontSize: 13, color: '#334155', lineHeight: 18 },

    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    metaText: { fontSize: 12, color: '#0f172a', fontWeight: '700' },
    metaLoose: { fontSize: 12, color: '#64748b' },

    ctaBtn: {
        alignSelf: 'flex-start',
        backgroundColor: '#fce7f3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#f9a8d4',
    },
    ctaText: { color: '#be185d', fontWeight: '900', fontSize: 12, letterSpacing: 0.2 },

    // Chat nổi
    chatBall: {
        position: 'absolute',
        zIndex: 20,
        elevation: 12,
        backgroundColor: '#10b981',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 2,
        borderColor: '#34d399',
    },
    chatInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

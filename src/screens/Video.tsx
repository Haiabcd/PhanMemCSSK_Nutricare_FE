import React, { useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Image,
    ScrollView,
    Pressable,
    View,
    Linking,
    Alert,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';

import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

type VideoItem = {
    id: string;
    type: 'video';
    tag: 'Video';
    title: string;
    cover: string;
    videoUrl: string;
    description?: string;
    shortDesc?: string;
    author?: string;
    authorAvatar?: string;
};

type Props = {
    route?: { params?: { item: VideoItem } };
    navigation?: {
        goBack?: () => void;
        canGoBack?: () => boolean;
        navigate?: (name: string, params?: any) => void;
    };
};

const FALLBACK_DESC = `Sinh tố thấp calo là lựa chọn bữa sáng hoặc bữa phụ cực kỳ nhanh gọn, giúp nạp năng lượng mà không bị quá tải. Công thức trong video tập trung vào nhóm nguyên liệu thân thiện với tiêu hóa, ít đường bổ sung và vẫn giữ được cảm giác tươi mát nhờ trái cây đông lạnh. Bạn có thể thay đổi loại sữa thực vật hay tỉ lệ đá để đạt độ sánh mịn như ý.

Phần quan trọng là cân bằng vị ngọt tự nhiên với chất béo tốt và chất xơ. Chuối chín cho độ ngọt nhẹ, dâu tây bổ sung vitamin C, còn sữa chua Hy Lạp giúp tăng độ sánh và hàm lượng protein. Nếu muốn no lâu hơn, bạn có thể thêm hạt chia hoặc yến mạch cán mỏng; cả hai đều giúp thức uống đặc hơn nhưng không làm tăng nhiều calo.

Trong quá trình xay, hãy bắt đầu với tốc độ thấp rồi tăng dần để hạn chế tách nước. Đá viên chỉ nên thêm sau cùng và từng chút một để tránh loãng hương vị. Nếu muốn vị ngọt rõ hơn mà vẫn lành mạnh, một thìa mật ong hoặc siro cây thùa là đủ; tránh lạm dụng để giữ tổng năng lượng hợp lý.

Khi thưởng thức, bạn có thể rắc thêm một ít hạt điều rang không muối hoặc dừa sấy không đường để tăng độ tương phản về cấu trúc. Đây là món dễ biến tấu theo mùa, rất phù hợp cho người bận rộn, người mới bắt đầu kiểm soát calo, hoặc cần một lựa chọn nhẹ nhàng sau buổi tập.`;

const FALLBACK: VideoItem = {
    id: 'v1',
    type: 'video',
    tag: 'Video',
    title: 'Sinh Tố Thấp Calo — Cách làm nhanh',
    cover:
        'https://images.unsplash.com/photo-1556742400-b5b7c5121f90?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: FALLBACK_DESC,
    shortDesc:
        'Công thức sinh tố nhanh, ít calo, nguyên liệu dễ tìm — phù hợp bữa sáng hoặc sau tập.',
    author: 'Healthy Life Channel',
    authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
};

const RELATED: VideoItem[] = [
    {
        id: 'rel-1',
        type: 'video',
        tag: 'Video',
        title: 'Overnight Oats — Bữa sáng 300 kcal',
        cover:
            'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=V-_O7nl0Ii0',
        description:
            'Yến mạch để qua đêm tiện lợi, cân bằng macro. Thêm hạt chia để no lâu và giữ kết cấu sánh.',
        shortDesc: 'Bữa sáng nhanh gọn, giàu chất xơ.',
        author: 'Fit Kitchen',
    },
    {
        id: 'rel-2',
        type: 'video',
        tag: 'Video',
        title: 'Salad Gà Ức — 25g Protein',
        cover:
            'https://images.unsplash.com/photo-1551892374-ecf8754cf8a7?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
        description:
            'Salad ức gà thanh mát, ít chất béo. Mẹo trụng gà mọng nước và sốt chanh nhẹ dễ ăn.',
        shortDesc: 'Giàu đạm, ít béo, làm nhanh.',
        author: 'Lean Bites',
    },
    {
        id: 'rel-3',
        type: 'video',
        tag: 'Video',
        title: 'Smoothie Xanh — Giải độc cơ thể',
        cover:
            'https://images.unsplash.com/photo-1542444459-db63c3199d83?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=RubEgM6UFMQ',
        description:
            'Cải bó xôi + táo + dứa, thêm gừng lát. Mẹo xay mịn không tách nước, cân vị chua ngọt.',
        shortDesc: 'Dễ uống, giàu vi chất.',
        author: 'Green Daily',
    },
];

export default function VideoScreen({ route, navigation }: Props) {
    const item = route?.params?.item as VideoItem | undefined;
    const data = item ?? FALLBACK;

    const longDesc = useMemo(
        () =>
            (data.description && data.description.trim()) ||
            (data.shortDesc && data.shortDesc.trim()) ||
            FALLBACK_DESC,
        [data.description, data.shortDesc]
    );

    const excerpt = useMemo(() => {
        // dùng shortDesc nếu có, nếu không cắt 1-2 câu đầu của description
        if (data.shortDesc && data.shortDesc.trim()) return data.shortDesc.trim();
        const firstPara = longDesc.split('\n').find(p => p.trim().length > 0) ?? '';
        return firstPara.length > 180 ? firstPara.slice(0, 180).trim() + '…' : firstPara;
    }, [data.shortDesc, longDesc]);

    const goBack = useCallback(() => {
        if (navigation?.canGoBack?.()) navigation.goBack?.();
        else navigation?.navigate?.('Home', { screen: 'MealPlan' });
    }, [navigation]);

    const openVideo = useCallback(async () => {
        try {
            const supported = await Linking.canOpenURL(data.videoUrl);
            if (supported) await Linking.openURL(data.videoUrl);
            else Alert.alert('Không thể mở video');
        } catch {
            Alert.alert('Lỗi', 'Không thể mở video.');
        }
    }, [data.videoUrl]);

    return (
        <Container>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header đồng bộ */}
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
                        <TextComponent text="Video" weight="bold" size={12} color={C.onPrimary} />
                    </View>
                </ViewComponent>

                {/* Cover lớn + nút Play, giống bố cục NewspaperScreen */}
                <View style={s.coverWrap}>
                    <View style={{ position: 'relative' }}>
                        <Image
                            source={{
                                uri:
                                    data.cover && data.cover.startsWith('http')
                                        ? data.cover
                                        : 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
                            }}
                            style={s.coverImg}
                            resizeMode="cover"
                            onError={(e) => {
                                console.log('Cover image load error:', e.nativeEvent?.error);
                            }}
                        />
                        <Pressable style={s.playOverlay} onPress={openVideo}>
                            <Entypo name="controller-play" size={50} color={C.onPrimary} />
                        </Pressable>
                    </View>
                </View>

                {/* Excerpt ngắn (đồng bộ “Bài báo”) */}
                {!!excerpt && (
                    <View style={s.excerptBox}>
                        <TextComponent text={excerpt} style={s.excerptText} />
                    </View>
                )}

                {/* Nội dung mô tả — chia đoạn như bài báo */}
                <View style={s.articleBox}>
                    {longDesc.split('\n').map((p, idx) =>
                        p.trim().length ? (
                            <TextComponent key={idx} text={p} style={s.paragraph} />
                        ) : (
                            <View key={idx} style={{ height: 4 }} />
                        )
                    )}
                </View>

                {/* Quote */}
                <View style={s.quoteBox}>
                    <TextComponent
                        text="Thói quen lành mạnh được xây từ những lựa chọn nhỏ mỗi ngày. Một ly sinh tố tốt cho sức khỏe sẽ mở đầu ngày mới nhẹ nhàng hơn."
                        style={s.quoteText}
                    />
                </View>

                {/* Video liên quan — Grid 2 cột (đồng bộ NewspaperScreen) */}
                <TextComponent text="Video liên quan" variant="h3" weight="bold" style={s.relatedTitle} />
                <View style={s.relatedGrid}>
                    {RELATED.map((r) => (
                        <Pressable
                            key={r.id}
                            style={s.relatedCard}
                            onPress={() => navigation?.navigate?.('Video', { item: r })}
                        >
                            <Image source={{ uri: r.cover }} style={s.relatedImg} />
                            <View style={s.relatedBody}>
                                <TextComponent text={r.title} numberOfLines={2} weight="bold" />
                                {!!r.shortDesc && (
                                    <TextComponent text={r.shortDesc} size={12} tone="muted" />
                                )}
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </Container>
    );
}

const s = StyleSheet.create({
    scroll: { paddingBottom: 40 },

    /* Header */
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
    },
    singleChip: {
        backgroundColor: C.primary,
        borderRadius: 999,
        paddingHorizontal: 16,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Cover */
    coverWrap: { paddingHorizontal: 16 },
    coverImg: {
        width: '100%',
        height: 240,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 16,
        backgroundColor: '#f1f5f9',
    },
    playOverlay: {
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.20)',
        borderRadius: 20,
    },

    /* Excerpt */
    excerptBox: {
        marginHorizontal: 16,
        padding: 14,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    excerptText: {
        fontStyle: 'italic',
        fontSize: 15.5,
        lineHeight: 24,
        color: '#334155',
    },

    /* Content */
    articleBox: { marginTop: 20, marginHorizontal: 16 },
    paragraph: {
        fontSize: 15.5,
        lineHeight: 26,
        color: '#0f172a',
        marginBottom: 16,
        textAlign: 'justify',
    },

    /* Quote */
    quoteBox: {
        marginHorizontal: 16,
        marginTop: 28,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: C.primary,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
    },
    quoteText: { fontSize: 15.5, lineHeight: 25, color: '#065f46', marginTop: 6 },

    /* Related grid 2 cột */
    relatedTitle: {
        marginHorizontal: 16,
        marginTop: 28,
        marginBottom: 12,
        fontSize: 18,
    },
    relatedGrid: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    relatedCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    relatedImg: {
        width: '100%',
        height: 120,
    },
    relatedBody: {
        padding: 10,
    },
});

// src/screens/NutritionGuide.tsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
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
    Linking,
    View,
    ActivityIndicator,
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

// API & types
import { getMyInfo } from '../services/user.service';
import type {
    InfoResponse,
    ProfileDto,
    UserAllergyResponse,
    UserConditionResponse,
} from '../types/types';

/* ================== Cấu hình YouTube ================== */
const YOUTUBE_API_KEY = 'AIzaSyD63wZGYUgGZAIESv7nb6YK2vSwVM6aV4s';
const REGION = 'VN';
const FALLBACK_THUMB =
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop';

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
    url?: string;
    channel?: string;
    publishedAt?: string;
};

const FILTERS: { key: Kind; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'meal', label: 'Tập luyện' },
    { key: 'article', label: 'Bài báo' },
    { key: 'video', label: 'Video' },
];

// (Giữ lại DATA_STATIC cho tab khác nếu cần hiển thị trong "Tất cả" – nhưng tab "Tập luyện" sẽ dùng video từ YouTube)
const DATA_STATIC: Item[] = [
    {
        id: '1',
        title: 'Salad Gà Ớt',
        desc: 'Món salad tươi ngon, giàu rau củ, phù hợp giảm cân.',
        kind: 'article', // đổi sang article để tránh xuất hiện ở tab "Tập luyện"
        image:
            'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop',
        cta: 'ĐỌC BÀI',
    },
    {
        id: '2',
        title: 'Ăn Kiêng Khỏe Mạnh',
        desc: 'Các mẹo đơn giản để duy trì chế độ ăn cân bằng và lành mạnh.',
        kind: 'article',
        image:
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop',
        cta: 'ĐỌC BÀI',
    },
];

/* ================== Avatar ================== */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;
    return (
        <ViewComponent center radius={999} border backgroundColor={C.bg} style={s.avatar}>
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

/* ================== Card ================== */
function Card({ item }: { item: Item }) {
    const kindLabel =
        item.kind === 'meal' ? 'Tập luyện' : item.kind === 'article' ? 'Bài báo' : 'Video';

    const handlePress = () => {
        if (item.url) {
            Linking.openURL(item.url).catch(() => { });
        }
    };

    return (
        <ViewComponent style={s.cardWrap}>
            <Pressable onPress={handlePress} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
                <ViewComponent variant="card" radius={16} flex={1}>
                    {/* Media */}
                    <ViewComponent style={s.thumbWrap}>
                        <Image source={{ uri: item.image || FALLBACK_THUMB }} style={s.thumb} resizeMode="cover" />
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

                        {/* play overlay: hiện nếu có url (video YouTube) */}
                        {item.url && (
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
                        <View style={{ flexShrink: 1 }}>
                            <TextComponent
                                text={item.title}
                                variant="h3"
                                numberOfLines={2}
                                style={{ letterSpacing: 0.15, height: 44, lineHeight: 22 }}
                            />
                            <TextComponent
                                text={item.desc}
                                variant="body"
                                tone="muted"
                                numberOfLines={3}
                                style={{ lineHeight: 18, height: 54, textAlignVertical: 'top', marginTop: 2 }}
                            />

                            {/* Meta */}
                            <ViewComponent row gap={8} wrap style={{ marginTop: 8 }}>
                                {!!item.meta && (
                                    <TextComponent text={item.meta} variant="caption" tone="muted" numberOfLines={1} />
                                )}
                            </ViewComponent>
                        </View>

                        {/* CTA (không cần cho video) */}
                        {!item.url && (
                            <View style={{ marginTop: 10 }}>
                                <ViewComponent
                                    center
                                    radius={12}
                                    border
                                    style={{ paddingVertical: 10, borderColor: C.primaryBorder, backgroundColor: C.primarySurface }}
                                >
                                    <TextComponent
                                        text={item.cta ?? 'XEM THÊM'}
                                        variant="caption"
                                        weight="bold"
                                        style={{ color: C.primaryDark, letterSpacing: 0.3 }}
                                        numberOfLines={1}
                                    />
                                </ViewComponent>
                            </View>
                        )}
                    </ViewComponent>
                </ViewComponent>
            </Pressable>
        </ViewComponent>
    );
}

/* ================== Helpers build query trực tiếp từ InfoResponse ================== */
const ageFromBirthYear = (y?: number | null) =>
    typeof y === 'number' ? new Date().getFullYear() - y : undefined;

// Query cho VIDEO dinh dưỡng — đã bias về món ăn/công thức/recipe
function buildQueryFromInfo(info?: InfoResponse | null, userText?: string) {
    const terms: string[] = [];
    if (!info) {
        const base = (userText?.trim() || 'dinh dưỡng món ăn công thức nấu ăn healthy recipes');
        return `${base} tiếng Việt`;
    }

    const p: ProfileDto | undefined = info.profileCreationResponse;

    if (userText?.trim()) terms.push(userText.trim());

    switch (p?.goal) {
        case 'LOSE':
            terms.push('giảm cân', 'low calorie', 'healthy recipes', 'ăn kiêng');
            break;
        case 'GAIN':
            terms.push('tăng cân lành mạnh', 'tăng cơ', 'high protein', 'calorie surplus');
            break;
        case 'MAINTAIN':
            terms.push('duy trì cân nặng', 'balanced diet');
            break;
    }

    if (p?.gender === 'MALE') terms.push('dinh dưỡng cho nam');
    else if (p?.gender === 'FEMALE') terms.push('dinh dưỡng cho nữ');

    const age = ageFromBirthYear(p?.birthYear);
    if (typeof age === 'number') {
        if (age < 18) terms.push('dinh dưỡng vị thành niên');
        else if (age < 30) terms.push('dinh dưỡng người trẻ');
        else if (age < 50) terms.push('dinh dưỡng người trưởng thành');
        else terms.push('dinh dưỡng người trung niên');
    }

    switch (p?.activityLevel) {
        case 'SEDENTARY':
            terms.push('ít vận động');
            break;
        case 'LIGHTLY_ACTIVE':
            terms.push('bài tập nhẹ');
            break;
        case 'MODERATELY_ACTIVE':
            terms.push('tập luyện vừa phải');
            break;
        case 'VERY_ACTIVE':
        case 'EXTRA_ACTIVE':
            terms.push('tập luyện cường độ cao');
            break;
    }

    (info.conditions || []).forEach((c: UserConditionResponse) => {
        const name = (c?.name || '').toLowerCase();
        if (!name) return;
        if (name.includes('tiểu đường') || name.includes('đái tháo đường') || name.includes('diabetes')) {
            terms.push('thực đơn cho người tiểu đường', 'low glycemic');
        } else if (name.includes('huyết áp') || name.includes('hypertension')) {
            terms.push('ít muối', 'tốt cho tim mạch');
        } else if (name.includes('mỡ máu') || name.includes('cholesterol')) {
            terms.push('ít chất béo bão hoà', 'heart healthy');
        } else {
            terms.push(`${c.name} dinh dưỡng`);
        }
    });

    // ===== ép trọng tâm về MÓN ĂN / CÔNG THỨC / RECIPE =====
    terms.push(
        'dinh dưỡng', 'món ăn', 'cách nấu', 'công thức', 'recipe', 'cooking',
        'healthy recipes', 'meal prep', 'ăn gì', 'thực đơn', 'tiếng Việt'
    );

    const unique = Array.from(new Set(terms)).slice(0, 10).join(' | ');
    return unique;
}

// Query cho VIDEO TẬP LUYỆN (mới)
function buildWorkoutQueryFromInfo(info?: InfoResponse | null, userText?: string) {
    const terms: string[] = [];
    if (!info) return (userText?.trim() || 'bài tập tại nhà') + ' tiếng Việt';

    const p = info.profileCreationResponse;

    // Ưu tiên text người dùng
    if (userText?.trim()) terms.push(userText.trim());

    // Mục tiêu
    switch (p.goal) {
        case 'LOSE':
            terms.push('giảm mỡ', 'giảm cân', 'cardio', 'HIIT', 'fat burning workout');
            break;
        case 'GAIN':
            terms.push('tăng cơ', 'strength training', 'full body workout', 'hypertrophy');
            break;
        case 'MAINTAIN':
            terms.push('duy trì thể lực', 'fitness routine', 'mobility', 'balance');
            break;
    }

    // Giới tính
    if (p.gender === 'MALE') terms.push('bài tập cho nam');
    if (p.gender === 'FEMALE') terms.push('bài tập cho nữ');

    // Nhóm tuổi
    const age = ageFromBirthYear(p.birthYear);
    if (typeof age === 'number') {
        if (age < 18) terms.push('teen workout');
        else if (age < 30) terms.push('workout người trẻ');
        else if (age < 50) terms.push('workout người trưởng thành');
        else terms.push('workout người trung niên low impact');
    }

    // Mức vận động → cường độ
    switch (p.activityLevel) {
        case 'SEDENTARY':
            terms.push('beginner', 'low impact', 'bài tập nhẹ nhàng');
            break;
        case 'LIGHTLY_ACTIVE':
            terms.push('beginner to intermediate');
            break;
        case 'MODERATELY_ACTIVE':
            terms.push('intermediate', 'tập luyện vừa phải');
            break;
        case 'VERY_ACTIVE':
        case 'EXTRA_ACTIVE':
            terms.push('advanced', 'high intensity');
            break;
    }

    // Bệnh nền → an toàn/chỉ định
    (info.conditions || []).forEach((c) => {
        const n = (c?.name || '').toLowerCase();
        if (!n) return;
        if (n.includes('tiểu đường') || n.includes('diabetes')) {
            terms.push('workout for diabetes', 'low impact cardio', 'glucose control');
        } else if (n.includes('huyết áp') || n.includes('hypertension')) {
            terms.push('low impact', 'avoid high intensity interval', 'breathing technique');
        } else if (n.includes('cholesterol') || n.includes('mỡ máu')) {
            terms.push('cardio vừa phải', 'heart health workout');
        } else {
            terms.push(`${c.name} workout an toàn`);
        }
    });

    // Từ khoá nền + ngôn ngữ
    terms.push('bài tập tại nhà', 'home workout', 'no equipment', 'tiếng Việt');

    return Array.from(new Set(terms)).slice(0, 8).join(' | ');
}

/* ================== YouTube helpers ================== */
function buildQS(params: Record<string, any>) {
    return Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
}

const FALLBACK_ERROR = 'Không tải được dữ liệu từ YouTube. Vui lòng thử lại.';

// ===== Từ khóa nhận diện video về món ăn/nấu ăn/dinh dưỡng =====
const FOOD_KEYWORDS = [
    // tiếng Việt (ưu tiên)
    'cách nấu', 'nấu ăn', 'công thức', 'món', 'món ăn', 'bữa ăn', 'thực đơn',
    'ăn gì', 'ăn như thế nào', 'ăn như nào', 'ăn đúng cách', 'dinh dưỡng',
    'đồ ăn', 'ẩm thực', 'healthy', 'giảm cân ăn', 'tăng cân ăn', 'meal prep',
    'thực phẩm', 'nấu', 'luộc', 'hấp', 'chiên', 'xào', 'om', 'kho', 'soup', 'súp',
    // English (để bắt video kênh việt nhưng đặt title eng)
    'recipe', 'recipes', 'how to cook', 'cooking', 'meal prep', 'what i eat',
    'nutrition', 'nutritional', 'healthy recipes', 'diet', 'keto', 'low carb', 'high protein',
];

function includesAny(haystack: string, keywords: string[]) {
    const s = haystack.toLowerCase();
    return keywords.some(k => s.includes(k.toLowerCase()));
}

/** Nhận diện video có liên quan món ăn/nấu ăn/dinh dưỡng */
function isFoodVideo(item: Item) {
    const text = [item.title, item.desc, item.meta, item.channel].filter(Boolean).join(' ').toLowerCase();
    return includesAny(text, FOOD_KEYWORDS);
}

async function fetchYoutubeVideos(apiKey: string, q: string, maxResults = 12, pageToken?: string) {
    const base = 'https://www.googleapis.com/youtube/v3/search';
    const query = buildQS({
        part: 'snippet',
        type: 'video',
        q,
        maxResults,
        safeSearch: 'moderate',
        relevanceLanguage: 'vi',
        regionCode: REGION,
        order: 'relevance', // ưu tiên khớp chủ đề
        pageToken,
        key: apiKey,
    });
    const url = `${base}?${query}`;

    let res: Response;
    try {
        res = await fetch(url);
    } catch {
        throw new Error(FALLBACK_ERROR);
    }

    const rawText = await res.text();
    if (!res.ok) throw new Error(FALLBACK_ERROR);

    let data: any = {};
    try {
        data = JSON.parse(rawText);
    } catch {
        throw new Error(FALLBACK_ERROR);
    }

    const rawItems = Array.isArray(data.items) ? data.items : [];

    const items: Item[] = rawItems
        .map((it: any): Item | null => {
            const vid: string | undefined = it?.id?.videoId;
            const sn = it?.snippet || {};
            const title = typeof sn.title === 'string' ? sn.title : '';
            const desc = (sn.description || '').replace(/\s+/g, ' ').trim();

            const thumb =
                sn?.thumbnails?.high?.url ||
                sn?.thumbnails?.medium?.url ||
                sn?.thumbnails?.default?.url ||
                (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : FALLBACK_THUMB);

            const publishedAt = sn.publishedAt || '';
            const dateStr = publishedAt ? new Date(publishedAt).toLocaleDateString() : '';
            const url = vid ? `https://www.youtube.com/watch?v=${vid}` : undefined;

            if (!title || !thumb || !url) return null;

            return {
                id: `yt_${vid}`,
                title,
                desc: desc || 'Video hữu ích.',
                kind: 'video', // NOTE: khi dùng cho "Tập luyện", ta sẽ gán lại kind='meal' ở bước xử lý
                image: thumb,
                url,
                channel: sn.channelTitle || '',
                publishedAt,
                meta: [sn.channelTitle, dateStr].filter(Boolean).join(' • '),
            };
        })
        .filter((x: Item | null | undefined): x is Item => Boolean(x));

    return { items, nextPageToken: data.nextPageToken as string | undefined };
}

/* ================== Screen ================== */
export default function NutritionGuide() {
    const [active, setActive] = useState<Kind>('all');
    const [q, setQ] = useState('');
    const { width: screenW, height: screenH } = useWindowDimensions();
    const navigation = useNavigation<NativeStackNavigationProp<GuideStackParamList>>();

    // Raw info từ API
    const [myInfo, setMyInfo] = useState<InfoResponse | null>(null);

    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            try {
                const apiRes = await getMyInfo(ac.signal);
                const info: any = (apiRes as any)?.data ?? apiRes;
                setMyInfo(info as InfoResponse);
                console.log('[NutritionGuide][my-info]', info);
            } catch (e) {
                console.log('[NutritionGuide][my-info][error]', e);
            }
        })();
        return () => ac.abort();
    }, []);

    /* ====== VIDEO dinh dưỡng (tab "Video") ====== */
    const videoQuery = useMemo(() => buildQueryFromInfo(myInfo, q), [myInfo, q]);
    const [ytItems, setYtItems] = useState<Item[]>([]);
    const [nextToken, setNextToken] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const { items, nextPageToken } = await fetchYoutubeVideos(YOUTUBE_API_KEY, videoQuery, 12);
            const blocked = (myInfo?.allergies || []).map((a: UserAllergyResponse) => a.name.toLowerCase());
            // chặn dị ứng + BẮT BUỘC phải là video món ăn/nấu ăn/dinh dưỡng
            const filtered = items
                .filter((v) => !blocked.some((b) => (v.title + ' ' + v.desc).toLowerCase().includes(b)))
                .filter(isFoodVideo);

            setYtItems(filtered);
            setNextToken(nextPageToken);
        } catch (e) {
            if (__DEV__) console.warn('[YouTube][reload] error', e);
        } finally {
            setLoading(false);
        }
    }, [videoQuery, myInfo?.allergies]);

    const loadMore = useCallback(async () => {
        if (!nextToken || loading) return;
        setLoading(true);
        try {
            const { items: more, nextPageToken } = await fetchYoutubeVideos(
                YOUTUBE_API_KEY,
                videoQuery,
                12,
                nextToken
            );
            const moreFiltered = more.filter(isFoodVideo);
            setYtItems((prev) => [...prev, ...moreFiltered]);
            setNextToken(nextPageToken);
        } catch (e) {
            if (__DEV__) console.warn('[YouTube][loadMore] error', e);
        } finally {
            setLoading(false);
        }
    }, [nextToken, videoQuery, loading]);

    /* ====== VIDEO TẬP LUYỆN (tab "Tập luyện") ====== */
    const workoutQuery = useMemo(() => buildWorkoutQueryFromInfo(myInfo, q), [myInfo, q]);
    const [workoutItems, setWorkoutItems] = useState<Item[]>([]);
    const [nextWorkoutToken, setNextWorkoutToken] = useState<string | undefined>();
    const [loadingWorkout, setLoadingWorkout] = useState(false);

    const reloadWorkout = useCallback(async () => {
        setLoadingWorkout(true);
        try {
            const { items, nextPageToken } = await fetchYoutubeVideos(YOUTUBE_API_KEY, workoutQuery, 12);
            // gán kind='meal' để hiển thị dưới tab "Tập luyện"
            const mapped = items.map((it) => ({ ...it, kind: 'meal' as Kind }));

            // chặn dị ứng (ít khi áp dụng cho video tập luyện, nhưng vẫn lọc theo tiêu đề/mô tả)
            const blocked = (myInfo?.allergies || []).map((a: UserAllergyResponse) => a.name.toLowerCase());
            const filtered = mapped.filter(
                (v) => !blocked.some((b) => (v.title + ' ' + v.desc).toLowerCase().includes(b))
            );

            setWorkoutItems(filtered);
            setNextWorkoutToken(nextPageToken);
        } catch (e) {
            if (__DEV__) console.warn('[YouTube][reloadWorkout] error', e);
        } finally {
            setLoadingWorkout(false);
        }
    }, [workoutQuery, myInfo?.allergies]);

    const loadMoreWorkout = useCallback(async () => {
        if (!nextWorkoutToken || loadingWorkout) return;
        setLoadingWorkout(true);
        try {
            const { items: more, nextPageToken } = await fetchYoutubeVideos(
                YOUTUBE_API_KEY,
                workoutQuery,
                12,
                nextWorkoutToken
            );
            const mapped = more.map((it) => ({ ...it, kind: 'meal' as Kind }));
            setWorkoutItems((prev) => [...prev, ...mapped]);
            setNextWorkoutToken(nextPageToken);
        } catch (e) {
            if (__DEV__) console.warn('[YouTube][loadMoreWorkout] error', e);
        } finally {
            setLoadingWorkout(false);
        }
    }, [nextWorkoutToken, workoutQuery, loadingWorkout]);

    // Tự tải mỗi khi query đổi
    useEffect(() => {
        reload();
    }, [reload]);
    useEffect(() => {
        reloadWorkout();
    }, [reloadWorkout]);

    // Hợp nhất hiển thị
    const ALL_DATA: Item[] = useMemo(() => {
        if (active === 'video') return ytItems;
        if (active === 'meal') return workoutItems;
        // Tất cả: trộn bài báo tĩnh + cả hai nhóm video
        return [...DATA_STATIC, ...workoutItems, ...ytItems];
    }, [active, ytItems, workoutItems]);

    // Lọc theo search + filter chip
    const filtered = useMemo(() => {
        const qLower = q.trim().toLowerCase();
        return ALL_DATA.filter((it) => {
            const okKind = active === 'all' ? true : it.kind === active;
            const haystack = [it.title, it.desc, it.meta, it.channel].filter(Boolean).join(' ').toLowerCase();
            const okQ = qLower.length === 0 ? true : haystack.includes(qLower);
            return okKind && okQ;
        });
    }, [ALL_DATA, active, q]);

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
                    <ViewComponent center radius={12} backgroundColor={C.bg} border style={{ width: 42, height: 42 }}>
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
                    {FILTERS.map((f) => {
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
                        keyExtractor={(it) => it.id}
                        numColumns={2}
                        renderItem={({ item }) => <Card item={item} />}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                        onEndReachedThreshold={0.5}
                        onEndReached={
                            active === 'video'
                                ? loadMore
                                : active === 'meal'
                                    ? loadMoreWorkout
                                    : undefined
                        }
                        ListFooterComponent={
                            (loading || loadingWorkout) && filtered.length > 0 ? (
                                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                                    <ActivityIndicator />
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            <ViewComponent center style={{ flex: 1, paddingVertical: 18 }}>
                                {loading || loadingWorkout ? (
                                    <>
                                        <ActivityIndicator />
                                        <TextComponent text="Đang tải nội dung..." variant="body" tone="muted" />
                                    </>
                                ) : (
                                    <>
                                        <TextComponent text="Không tìm thấy kết quả" variant="h3" />
                                        <TextComponent
                                            text="Thử thay đổi bộ lọc hoặc từ khóa khác nhé."
                                            variant="body"
                                            tone="muted"
                                        />
                                    </>
                                )}
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
            onPanResponderGrant: () => {
                pos.extractOffset();
            },
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

/* ================== Styles ================== */
const s = StyleSheet.create({
    avatar: { width: 52, height: 52, borderRadius: 999 },

    searchInput: { flex: 1, color: C.text, paddingVertical: 8, fontFamily: 'System' },

    chipActiveShadow: {
        shadowColor: C.primary,
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    cardWrap: { width: '48%', marginBottom: 12 },

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

    cardBody: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: C.border,
    },

    ctaBtn: {
        alignSelf: 'stretch',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

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

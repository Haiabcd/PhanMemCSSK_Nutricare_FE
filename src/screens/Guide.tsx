import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Image,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Linking,
  View,
  ActivityIndicator,
  Modal,
  Animated
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import isEqual from 'fast-deep-equal/react';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import AppHeader from '../components/AppHeader';
import { colors as C } from '../constants/colors';
import { FALLBACK_IMAGES } from '../constants/fallbackImages';
import { variedFallbackBy, DEFAULT_FALLBACK } from '../constants/imageFallback';
import { getMyInfo } from '../services/user.service';
import { findNewsfeedRecommendations } from '../services/recommendation.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RecommendationItemDto } from '../types/recommendation.type';
import type {
  InfoResponse,
  ProfileDto,
  UserAllergyResponse,
  UserConditionResponse,
} from '../types/types';
import type { GuideStackParamList } from '../navigation/GuideNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Config from 'react-native-config';

/* ================== Cấu hình YouTube ================== */
const YOUTUBE_API_KEY = Config.YOUTUBE_API_KEY!;
const REGION = Config.REGION || 'VN';
const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop';
const FAB_SIZE = 56;
const FAB_MARGIN_RIGHT = 16;
const FAB_BOTTOM = 100;
const PETAL1_OFFSET = { x: 0, y: -80 };
const PETAL2_OFFSET = { x: -80, y: -20 };

/* ================== Types & Data ================== */
type Kind = 'all' | 'meal' | 'article' | 'video';

type Item = {
  id: string;
  title: string;
  desc: string;
  kind: Kind;
  image: string;
  meta?: string;
  url?: string;
  channel?: string;
  publishedAt?: string;
};

const CATS: Array<{ key: Kind; label: string; icon: string }> = [
  { key: 'all', label: 'Tất cả', icon: 'grid-outline' },
  { key: 'meal', label: 'Tập luyện', icon: 'barbell-outline' },
  { key: 'article', label: 'Bài báo', icon: 'newspaper-outline' },
  { key: 'video', label: 'Video', icon: 'play-circle-outline' },
];
/* ================== Helpers pick topic fallback ================== */
function getHostFromUrl(raw?: string | null): string {
  if (!raw) return '';
  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw);
    const url = hasScheme ? raw : `https://${raw}`;
    const m = url.match(/^[a-z]+:\/\/([^/]+)/i);
    let host = m?.[1] ?? '';
    host = host.replace(/^www\./, '');
    host = host.split(':')[0];
    return host;
  } catch {
    return '';
  }
}

/* ================== Card ================== */
function Card({ item }: { item: Item }) {
  const kindLabel =
    item.kind === 'meal'
      ? 'Tập luyện'
      : item.kind === 'article'
        ? 'Bài báo'
        : 'Video';

  const [img, setImg] = useState(item.image || FALLBACK_THUMB);
  useEffect(() => {
    setImg(item.image || FALLBACK_THUMB);
  }, [item.image]);

  const handleImgError = () => {
    const host = getHostFromUrl(item.url);
    const bySource = host
      ? FALLBACK_IMAGES.bySource[host as keyof typeof FALLBACK_IMAGES.bySource]
      : undefined;

    const next =
      variedFallbackBy(`${item.title || ''} ${item.publishedAt || ''}`, host) ||
      (host === 'news.google.com' ? undefined : bySource) ||
      DEFAULT_FALLBACK;

    setImg(next);
  };

  const handlePress = () => {
    if (item.url) {
      Linking.openURL(item.url).catch(() => { });
    }
  };

  return (
    <ViewComponent style={s.cardWrap}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
      >
        <ViewComponent variant="card" radius={16} flex={1}>
          {/* Media */}
          <ViewComponent style={s.thumbWrap}>
            <Image
              source={{ uri: img || FALLBACK_THUMB }}
              style={s.thumb}
              resizeMode="cover"
              onError={handleImgError}
            />
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
              <TextComponent
                text={kindLabel}
                variant="caption"
                weight="bold"
                tone="inverse"
              />
            </ViewComponent>

            {/* play overlay — CHỈ cho video */}
            {item.kind === 'video' && item.url && (
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
                style={{
                  lineHeight: 18,
                  height: 54,
                  textAlignVertical: 'top',
                  marginTop: 2,
                }}
              />
              <ViewComponent row gap={8} wrap style={{ marginTop: 8 }}>
                {!!item.meta && (
                  <TextComponent
                    text={item.meta}
                    variant="caption"
                    tone="muted"
                    numberOfLines={1}
                  />
                )}
              </ViewComponent>
            </View>

            {item.kind !== 'video' && !item.url && (
              <View style={{ marginTop: 10 }}>
                <ViewComponent
                  center
                  radius={12}
                  border
                  style={{
                    paddingVertical: 10,
                    borderColor: C.primaryBorder,
                    backgroundColor: C.primarySurface,
                  }}
                >
                  <TextComponent
                    text={'XEM THÊM'}
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

/* ================== Helpers build query từ InfoResponse ================== */
function buildQueryFromInfo(info?: InfoResponse | null, userText?: string) {
  const terms: string[] = [];
  const p: ProfileDto | undefined = info?.profileCreationResponse;
  if (userText?.trim()) terms.push(userText.trim());

  switch (p?.goal) {
    case 'LOSE':
      terms.push('giảm cân', 'low calorie', 'healthy recipes', 'ăn kiêng');
      break;
    case 'GAIN':
      terms.push(
        'tăng cân lành mạnh',
        'tăng cơ',
        'high protein',
        'calorie surplus',
      );
      break;
    case 'MAINTAIN':
      terms.push('duy trì cân nặng', 'balanced diet');
      break;
  }

  (info?.conditions || []).forEach((c: UserConditionResponse) => {
    const name = (c?.name || '').toLowerCase();
    if (!name) return;
    if (
      name.includes('tiểu đường') ||
      name.includes('đái tháo đường') ||
      name.includes('diabetes')
    ) {
      terms.push('thực đơn cho người tiểu đường', 'low glycemic');
    } else if (name.includes('huyết áp') || name.includes('hypertension')) {
      terms.push('ít muối', 'tốt cho tim mạch');
    } else if (name.includes('mỡ máu') || name.includes('cholesterol')) {
      terms.push('ít chất béo bão hoà', 'heart healthy');
    } else {
      terms.push(`${c.name} dinh dưỡng`);
    }
  });

  // Từ khoá nền
  terms.push(
    'dinh dưỡng',
    'món ăn',
    'cách nấu',
    'công thức',
    'recipe',
    'cooking',
    'healthy recipes',
    'meal prep',
    'ăn gì',
    'thực đơn',
    'tiếng Việt',
  );

  return Array.from(new Set(terms)).slice(0, 10).join(' | ');
}

// ===== Workout query (SAFE) — chỉ quan tâm goal + conditions (+ allergies dùng để lọc)
function buildWorkoutQueryFromInfo(
  info?: InfoResponse | null,
  userText?: string,
) {
  const terms: string[] = [];
  const p = info?.profileCreationResponse;

  if (userText?.trim()) terms.push(userText.trim());

  switch (p?.goal) {
    case 'LOSE':
      terms.push('giảm mỡ', 'giảm cân', 'cardio', 'HIIT', 'đốt mỡ');
      break;
    case 'GAIN':
      terms.push('tăng cơ', 'tăng cân', 'full body workout', 'hypertrophy');
      break;
    case 'MAINTAIN':
      terms.push('duy trì thể lực', 'fitness routine', 'mobility', 'balance');
      break;
  }

  (info?.conditions || []).forEach(c => {
    const n = (c?.name || '').toLowerCase();
    if (!n) return;
    if (n.includes('tiểu đường') || n.includes('diabetes')) {
      terms.push(
        'workout cho người tiểu đường',
        'low impact cardio',
        'glucose control',
      );
    } else if (n.includes('huyết áp') || n.includes('hypertension')) {
      terms.push('low impact', 'tránh HIIT quá gắt', 'breathing technique');
    } else if (n.includes('cholesterol') || n.includes('mỡ máu')) {
      terms.push('cardio vừa phải', 'heart health workout');
    } else {
      terms.push(`${c.name} workout an toàn`);
    }
  });

  terms.push('bài tập tại nhà', 'home workout', 'không dụng cụ', 'tiếng Việt');

  return Array.from(new Set(terms)).slice(0, 8).join(' | ');
}

/* ================== YouTube helpers ================== */
function buildQS(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
}

const FALLBACK_ERROR = 'Không tải được dữ liệu từ YouTube. Vui lòng thử lại.';

// ===== Nhận diện video món ăn/nấu ăn/dinh dưỡng
const FOOD_KEYWORDS = [
  'cách nấu',
  'nấu ăn',
  'công thức',
  'món',
  'món ăn',
  'bữa ăn',
  'thực đơn',
  'ăn gì',
  'ăn đúng cách',
  'dinh dưỡng',
  'đồ ăn',
  'ẩm thực',
  'healthy',
  'giảm cân ăn',
  'tăng cân ăn',
  'meal prep',
  'thực phẩm',
  'nấu',
  'luộc',
  'hấp',
  'chiên',
  'xào',
  'om',
  'kho',
  'soup',
  'súp',
  'recipe',
  'recipes',
  'how to cook',
  'cooking',
  'what i eat',
  'nutrition',
  'nutritional',
  'healthy recipes',
  'diet',
  'keto',
  'low carb',
  'high protein',
];

function includesAny(haystack: string | undefined, keywords: string[]) {
  const s = (haystack || '').toLowerCase();
  return keywords.some(k => s.includes(k.toLowerCase()));
}

function isFoodVideo(item: Item) {
  const text = [item.title, item.desc, item.meta, item.channel]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return includesAny(text, FOOD_KEYWORDS);
}

// ===== Nhận diện tiếng Việt (dùng cho tab Tập luyện)
const VIET_KEYWORDS = [
  'bài tập',
  'tập luyện',
  'giảm cân',
  'giảm mỡ',
  'đốt mỡ',
  'khởi động',
  'không dụng cụ',
  'tại nhà',
  'phút',
  'toàn thân',
  'bụng',
  'eo',
  'lưng',
  'ngực',
  'tay',
  'chân',
  'mông',
  'vai',
  'cường độ',
  'thấp',
  'vừa',
  'cao',
];
const VIET_DIACRITIC_RE =
  /[ăâđêôơưĂÂĐÊÔƠƯàáạảãằắặẳẵầấậẩẫèéẹẻẽìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/;

function isVietnameseItem(item: Item) {
  const s = [item.title, item.desc, item.channel].filter(Boolean).join(' ');
  const lower = s.toLowerCase();
  return (
    VIET_DIACRITIC_RE.test(s) || VIET_KEYWORDS.some(k => lower.includes(k))
  );
}

/* ====== Lọc theo mục tiêu tập luyện ====== */
const LOSS_KEYWORDS = [
  'giảm mỡ',
  'giảm cân',
  'đốt mỡ',
  'eo thon',
  'bụng phẳng',
  'fat loss',
  'lose fat',
  'lose weight',
  'burn fat',
  'hiit đốt mỡ',
];

const GAIN_KEYWORDS = [
  'tăng cơ',
  'sức mạnh',
  'hypertrophy',
  'build muscle',
  'muscle building',
  'bulk',
  'lean mass',
  'full body strength',
];

function textOf(item: Item) {
  return [item.title, item.desc, item.meta, item.channel]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function filterWorkoutByGoal(item: Item, goal?: ProfileDto['goal']) {
  const s = textOf(item);
  if (goal === 'GAIN') {
    if (includesAny(s, LOSS_KEYWORDS)) return false;
  }
  return true;
}

function scoreGain(item: Item) {
  const s = textOf(item);
  let score = 0;
  if (includesAny(s, GAIN_KEYWORDS)) score += 2;
  if (includesAny(s, LOSS_KEYWORDS)) score -= 2;
  return score;
}

async function fetchYoutubeVideos(
  apiKey: string,
  q: string,
  maxResults = 12,
  pageToken?: string,
) {
  const base = 'https://www.googleapis.com/youtube/v3/search';
  const query = buildQS({
    part: 'snippet',
    type: 'video',
    q,
    maxResults,
    safeSearch: 'moderate',
    relevanceLanguage: 'vi',
    regionCode: REGION,
    order: 'relevance',
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
      const dateStr = publishedAt
        ? new Date(publishedAt).toLocaleDateString()
        : '';
      const url = vid ? `https://www.youtube.com/watch?v=${vid}` : undefined;

      if (!title || !thumb || !url) return null;

      return {
        id: `yt_${vid}`,
        title,
        desc: desc || 'Video hữu ích.',
        kind: 'video',
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

/* ================== Interleave helper ================== */
function interleave<T>(...lists: T[][]): T[] {
  const max = Math.max(0, ...lists.map(l => l.length));
  const out: T[] = [];
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (list[i] !== undefined) out.push(list[i]);
    }
  }
  return out;
}

/* ================== Mini profile & helpers để hạn chế fetch thừa ================== */
type MiniProfile = {
  goal?: ProfileDto['goal'];
  conditions: string[];
  allergies: string[];
};

function pickMini(info?: InfoResponse | null): MiniProfile {
  const goal = info?.profileCreationResponse?.goal;
  const conditions = (info?.conditions ?? []).map(
    c => (c.id ?? c.name ?? '') + '',
  );
  const allergies = (info?.allergies ?? []).map(
    a => (a.id ?? a.name ?? '') + '',
  );
  conditions.sort();
  allergies.sort();
  return { goal, conditions, allergies };
}

/* ================== Screen ================== */
export default function NutritionGuide() {
  const [active, setActive] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const { height: screenH } = useWindowDimensions();
  const [chipsLayoutW, setChipsLayoutW] = useState(0);
  const [chipsContentW, setChipsContentW] = useState(0);
  const canScroll = chipsContentW > chipsLayoutW + 1;
  const [myInfo, setMyInfo] = useState<InfoResponse | null>(null);
  const [chatMenuVisible, setChatMenuVisible] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<GuideStackParamList>>();

  // Debounce input q để giảm reload khi gõ
  const [qDebounced, setQDebounced] = useState(q);
  useEffect(() => {
    const id = setTimeout(() => setQDebounced(q), 450);
    return () => clearTimeout(id);
  }, [q]);

  // Lưu mini profile để so sánh
  const prevMiniRef = useRef<MiniProfile | null>(null);

  // Gọi getMyInfo khi vào màn, chỉ set khi mục tiêu/bệnh nền/dị ứng đổi
  useFocusEffect(
    useCallback(() => {
      const ac = new AbortController();
      (async () => {
        try {
          const apiRes = await getMyInfo(ac.signal);
          const info: InfoResponse = (apiRes as any)?.data ?? apiRes;
          const nextMini = pickMini(info);
          const prevMini = prevMiniRef.current;

          if (!prevMini || !isEqual(prevMini, nextMini)) {
            prevMiniRef.current = nextMini;
            setMyInfo(info); // -> sẽ kích hoạt tính lại query + reload YouTube
          }
          // nếu không đổi: bỏ qua, không set -> không reload YouTube
        } catch (e) {
          if (__DEV__)
            console.log('[NutritionGuide][my-info][focus][error]', e);
        }
      })();
      return () => ac.abort();
    }, []),
  );

  /* ====== BÀI BÁO ====== */
  const PAGE_SIZE = 9999;
  const [articleItems, setArticleItems] = useState<Item[]>([]);
  const [articleLimit, setArticleLimit] = useState(PAGE_SIZE);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingMoreArticles, setLoadingMoreArticles] = useState(false);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);

  const mapArticles = useCallback((arr: RecommendationItemDto[]): Item[] => {
    const articlesOnly = (arr || []).filter(
      a => (a.type || 'article') === 'article',
    );
    return articlesOnly.map(a => {
      const dateStr = a.published
        ? new Date(a.published).toLocaleDateString('vi-VN')
        : '';
      const stableKey =
        a.url?.trim() ||
        `${(a.source || '').trim()}|${(a.title || '').trim()}` ||
        Math.random().toString(36).slice(2);

      // host theo url/source
      let host = getHostFromUrl(a.url);
      if (!host && a.source) host = a.source.replace(/^www\./, '');

      const bySource = host
        ? FALLBACK_IMAGES.bySource[
        host as keyof typeof FALLBACK_IMAGES.bySource
        ]
        : undefined;

      const seedTitle = `${a.title || ''} ${dateStr}`;

      const image =
        (a.imageUrl || '').trim() ||
        variedFallbackBy(seedTitle, host) ||
        (host === 'news.google.com' ? undefined : bySource) ||
        DEFAULT_FALLBACK;

      return {
        id: `ar_${stableKey}`,
        title: (a.title || '').trim() || 'Bài viết',
        desc: a.source || '',
        kind: 'article' as Kind,
        image,
        url: a.url || undefined,
        meta: [a.source, dateStr].filter(Boolean).join(' • '),
        publishedAt: a.published || undefined,
      };
    });
  }, []);

  const reloadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const data = await findNewsfeedRecommendations(0);
      const mapped = mapArticles(data);

      const seen = new Set<string>();
      const unique = mapped.filter(i => {
        const k = i.url || i.id;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      setArticleItems(unique);
      setHasMoreArticles(false);
    } catch (e) {
      console.log('[Articles][reload] error', e);
      setArticleItems([]);
      setHasMoreArticles(false);
    } finally {
      setLoadingArticles(false);
    }
  }, [mapArticles]);

  const loadMoreArticles = useCallback(async () => {
    if (loadingArticles || loadingMoreArticles || !hasMoreArticles) return;
    setLoadingMoreArticles(true);
    try {
      const nextLimit = articleLimit + PAGE_SIZE;
      const data = await findNewsfeedRecommendations(nextLimit);
      const mapped = mapArticles(data);

      const seen = new Set(articleItems.map(i => i.url || i.id));
      const delta = mapped.filter(i => !seen.has(i.url || i.id));

      if (delta.length > 0) {
        setArticleItems(prev => [...prev, ...delta]);
        setArticleLimit(nextLimit);
        setHasMoreArticles(true);
      } else {
        setHasMoreArticles(false);
      }
    } catch (e) {
      setHasMoreArticles(false);
    } finally {
      setLoadingMoreArticles(false);
    }
  }, [
    articleLimit,
    articleItems,
    loadingArticles,
    loadingMoreArticles,
    hasMoreArticles,
    mapArticles,
  ]);

  useEffect(() => {
    reloadArticles();
  }, [reloadArticles]);

  /* ====== VIDEO dinh dưỡng (tab "Video") ====== */
  const videoQuery = useMemo(
    () => buildQueryFromInfo(myInfo, qDebounced),
    [myInfo, qDebounced],
  );
  const [ytItems, setYtItems] = useState<Item[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { items, nextPageToken } = await fetchYoutubeVideos(
        YOUTUBE_API_KEY,
        videoQuery,
        12,
      );
      const blocked = (myInfo?.allergies || []).map((a: UserAllergyResponse) =>
        a.name.toLowerCase(),
      );
      const filtered = items
        .filter(
          v =>
            !blocked.some(b =>
              (v.title + ' ' + v.desc).toLowerCase().includes(b),
            ),
        )
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
        nextToken,
      );
      const moreFiltered = more.filter(isFoodVideo);
      setYtItems(prev => [...prev, ...moreFiltered]);
      setNextToken(nextPageToken);
    } catch (e) {
      if (__DEV__) console.warn('[YouTube][loadMore] error', e);
    } finally {
      setLoading(false);
    }
  }, [nextToken, videoQuery, loading]);

  /* ====== VIDEO TẬP LUYỆN (tab "Tập luyện") ====== */
  const workoutQuery = useMemo(
    () => buildWorkoutQueryFromInfo(myInfo, qDebounced),
    [myInfo, qDebounced],
  );
  const [workoutItems, setWorkoutItems] = useState<Item[]>([]);
  const [nextWorkoutToken, setNextWorkoutToken] = useState<
    string | undefined
  >();
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  const reloadWorkout = useCallback(async () => {
    setLoadingWorkout(true);
    try {
      const { items, nextPageToken } = await fetchYoutubeVideos(
        YOUTUBE_API_KEY,
        workoutQuery,
        12,
      );
      const mapped = items.map(it => ({ ...it, kind: 'meal' as Kind }));

      const blocked = (myInfo?.allergies || []).map((a: UserAllergyResponse) =>
        a.name.toLowerCase(),
      );

      const pGoal = myInfo?.profileCreationResponse?.goal;

      const filtered = mapped
        .filter(
          v =>
            !blocked.some(b =>
              (v.title + ' ' + v.desc).toLowerCase().includes(b),
            ),
        )
        .filter(isVietnameseItem)
        .filter(it => filterWorkoutByGoal(it, pGoal));

      const sorted =
        pGoal === 'GAIN'
          ? [...filtered].sort((a, b) => scoreGain(b) - scoreGain(a))
          : filtered;

      setWorkoutItems(sorted);
      setNextWorkoutToken(nextPageToken);
    } catch (e) {
      if (__DEV__) console.warn('[YouTube][reloadWorkout] error', e);
    } finally {
      setLoadingWorkout(false);
    }
  }, [workoutQuery, myInfo?.allergies, myInfo?.profileCreationResponse?.goal]);

  const loadMoreWorkout = useCallback(async () => {
    if (!nextWorkoutToken || loadingWorkout) return;
    setLoadingWorkout(true);
    try {
      const { items: more, nextPageToken } = await fetchYoutubeVideos(
        YOUTUBE_API_KEY,
        workoutQuery,
        12,
        nextWorkoutToken,
      );
      const mapped = more.map(it => ({ ...it, kind: 'meal' as Kind }));

      const pGoal = myInfo?.profileCreationResponse?.goal;

      const moreFiltered = mapped
        .filter(isVietnameseItem)
        .filter(it => filterWorkoutByGoal(it, pGoal));

      const merged =
        pGoal === 'GAIN'
          ? [...moreFiltered].sort((a, b) => scoreGain(b) - scoreGain(a))
          : moreFiltered;

      setWorkoutItems(prev => [...prev, ...merged]);
      setNextWorkoutToken(nextPageToken);
    } catch (e) {
      if (__DEV__) console.warn('[YouTube][loadMoreWorkout] error', e);
    } finally {
      setLoadingWorkout(false);
    }
  }, [
    nextWorkoutToken,
    workoutQuery,
    loadingWorkout,
    myInfo?.profileCreationResponse?.goal,
  ]);

  // Chỉ reload khi query thật sự đổi (tránh reload trùng)
  const lastVideoQueryRef = useRef<string>('');
  const lastWorkoutQueryRef = useRef<string>('');

  useEffect(() => {
    if (!videoQuery || lastVideoQueryRef.current === videoQuery) return;
    lastVideoQueryRef.current = videoQuery;
    reload();
  }, [videoQuery, reload]);

  useEffect(() => {
    if (!workoutQuery || lastWorkoutQueryRef.current === workoutQuery) return;
    lastWorkoutQueryRef.current = workoutQuery;
    reloadWorkout();
  }, [workoutQuery, reloadWorkout]);

  // ===== Hợp nhất hiển thị – trộn xen kẽ 3 phần
  const ALL_DATA: Item[] = useMemo(() => {
    if (active === 'video') return ytItems;
    if (active === 'meal') return workoutItems;
    if (active === 'article') return articleItems;
    return interleave(workoutItems, articleItems, ytItems);
  }, [active, ytItems, workoutItems, articleItems]);

  // Lọc theo search + filter chip
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return ALL_DATA.filter(it => {
      const okKind = active === 'all' ? true : it.kind === active;
      const haystack = [it.title, it.desc, it.meta, it.channel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const okQ = qLower.length === 0 ? true : haystack.includes(qLower);
      return okKind && okQ;
    });
  }, [ALL_DATA, active, q]);

  // ====== LOADING FLAGS
  const anyLoading =
    loading || loadingWorkout || loadingArticles || loadingMoreArticles;

  // Trạng thái đã hết cho từng nguồn
  const isVideoDone = ytItems.length > 0 && !nextToken;
  const isWorkoutDone = workoutItems.length > 0 && !nextWorkoutToken;
  const isArticleDone = articleItems.length > 0 && !hasMoreArticles;

  // Tổng hợp theo tab
  const noMore =
    active === 'video'
      ? isVideoDone
      : active === 'meal'
        ? isWorkoutDone
        : active === 'article'
          ? isArticleDone
          : (isVideoDone || ytItems.length === 0) &&
          (isWorkoutDone || workoutItems.length === 0) &&
          (isArticleDone || articleItems.length === 0);

  const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));

  return (
    <Container>
      {/* Header */}
      <AppHeader
        // KHÔNG truyền loading ở tab Bài báo để tránh trùng spinner
        loading={active === 'article' ? false : loading}
        onBellPress={() => navigation.navigate('Notification')}
      />

      {/* Khối nội dung */}
      <ViewComponent
        style={{ flex: 1, minHeight: CONTENT_MIN_HEIGHT, overflow: 'hidden' }}
      >
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
          ) : null}
        </ViewComponent>

        {/* Filters */}
        <FlatList
          horizontal
          data={CATS}
          keyExtractor={item => `cat-${item.key}`}
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, height: 44, maxHeight: 44 }}
          onLayout={e => setChipsLayoutW(e.nativeEvent.layout.width)}
          onContentSizeChange={(w /* contentWidth */) => setChipsContentW(w)}
          contentContainerStyle={[
            s.chipsRow,
            {
              paddingHorizontal: 16,
              flexGrow: 1,
              justifyContent: canScroll ? 'flex-start' : 'center',
            },
          ]}
          ItemSeparatorComponent={() => <ViewComponent style={{ width: 10 }} />}
          renderItem={({ item }) => {
            const isActive = active === item.key;
            return (
              <Pressable onPress={() => setActive(item.key)}>
                <ViewComponent
                  row
                  alignItems="center"
                  gap={8}
                  radius={999}
                  border
                  px={14}
                  py={8}
                  backgroundColor={isActive ? C.primary : C.white}
                  borderColor={isActive ? C.primary : C.border}
                  style={[
                    s.chip,
                    isActive ? s.chipActiveShadow : s.chipInactiveShadow,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={isActive ? C.onPrimary : C.slate700}
                  />
                  <TextComponent
                    text={item.label}
                    variant="caption"
                    weight="bold"
                    tone={isActive ? 'inverse' : 'default'}
                    numberOfLines={1}
                    style={{ paddingTop: 2 }}
                  />
                </ViewComponent>
              </Pressable>
            );
          }}
        />

        {/* List */}
        <ViewComponent style={{ flex: 1, minHeight: 0 }}>
          <FlatList
            data={filtered}
            keyExtractor={it => it.id}
            numColumns={2}
            renderItem={({ item }) => <Card item={item} />}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (active === 'video' && nextToken) {
                loadMore();
              } else if (active === 'meal' && nextWorkoutToken) {
                loadMoreWorkout();
              } else if (active === 'article' && hasMoreArticles) {
                loadMoreArticles();
              } else if (active === 'all') {
                if (nextWorkoutToken) loadMoreWorkout();
                if (nextToken) loadMore();
                if (hasMoreArticles) loadMoreArticles();
              }
            }}
            refreshing={
              active === 'article'
                ? loadingArticles
                : active === 'meal'
                  ? loadingWorkout
                  : loading
            }
            onRefresh={
              active === 'article'
                ? reloadArticles
                : active === 'meal'
                  ? reloadWorkout
                  : reload
            }
            ListFooterComponent={
              filtered.length > 0 ? (
                active === 'article' ? (
                  noMore ? (
                    <View
                      style={{
                        paddingVertical: 20,
                        alignItems: 'center',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <TextComponent
                        text="Đã hiển thị xong"
                        variant="caption"
                        tone="muted"
                      />
                    </View>
                  ) : null
                ) : anyLoading ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator />
                  </View>
                ) : noMore ? (
                  <View
                    style={{
                      paddingVertical: 20,
                      alignItems: 'center',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <TextComponent
                      text="Đã hiển thị xong"
                      variant="caption"
                      tone="muted"
                    />
                  </View>
                ) : null
              ) : null
            }
            ListEmptyComponent={
              <ViewComponent center style={{ flex: 1, paddingVertical: 18 }}>
                {active === 'article' ? (
                  // Tab Bài báo: không spinner to — chỉ text
                  loadingArticles ? (
                    <TextComponent
                      text="Đang tải bài báo..."
                      variant="body"
                      tone="muted"
                    />
                  ) : (
                    <>
                      <TextComponent text="Chưa có bài báo" variant="h3" />
                      <TextComponent
                        text="Thử từ khóa khác nhé."
                        variant="body"
                        tone="muted"
                      />
                    </>
                  )
                ) : loading || loadingWorkout ? (
                  <>
                    <ActivityIndicator />
                    <TextComponent
                      text="Đang tải nội dung..."
                      variant="body"
                      tone="muted"
                    />
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
      <FloatingChat onPress={() => setChatMenuVisible(true)} />

      {/* Menu chọn chức năng khi bấm chat */}
      <ChatQuickActions
        visible={chatMenuVisible}
        onClose={() => setChatMenuVisible(false)}
        onChatAI={() => {
          setChatMenuVisible(false);
          navigation.navigate('ChatAI');
        }}
        onOpenGlossary={() => {
          setChatMenuVisible(false);
          navigation.navigate('NutritionGlossary' as any);
        }}
      />


    </Container>
  );
}

/* ================== Floating Chat Button ================== */
function FloatingChat({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chatFab,
        {
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          right: FAB_MARGIN_RIGHT,
          bottom: FAB_BOTTOM + insets.bottom,
        },
      ]}
      hitSlop={10}
    >
      <MaterialCommunityIcons
        name="message-text-outline"
        size={26}
        color={C.white}
      />
    </Pressable>
  );
}


/* ================== ChatQuickActions ================== */
type ChatQuickActionsProps = {
  visible: boolean;
  onClose: () => void;
  onChatAI: () => void;
  onOpenGlossary: () => void;
};

function ChatQuickActions({
  visible,
  onClose,
  onChatAI,
  onOpenGlossary,
}: ChatQuickActionsProps) {
  const petal1Anim = useRef(new Animated.Value(0)).current;
  const petal2Anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isSmallHeight = height < 700;
  const isSmallWidth = width < 380;

  const targetOffset1 = isSmallHeight
    ? { x: 0, y: -64 }
    : PETAL1_OFFSET;

  const targetOffset2 = isSmallWidth
    ? { x: -64, y: -10 }
    : PETAL2_OFFSET;

  useEffect(() => {
    if (!visible) return;
    petal1Anim.setValue(0);
    petal2Anim.setValue(0);

    Animated.stagger(70, [
      Animated.spring(petal1Anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 60,
      }),
      Animated.spring(petal2Anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 60,
      }),
    ]).start();
  }, [visible, petal1Anim, petal2Anim]);

  if (!visible) return null;

  const petal1Style = {
    opacity: petal1Anim,
    transform: [
      {
        translateX: petal1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, targetOffset1.x],
        }),
      },
      {
        translateY: petal1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, targetOffset1.y],
        }),
      },
      {
        scale: petal1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        }),
      },
    ],
  };

  const petal2Style = {
    opacity: petal2Anim,
    transform: [
      {
        translateX: petal2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, targetOffset2.x],
        }),
      },
      {
        translateY: petal2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, targetOffset2.y],
        }),
      },
      {
        scale: petal2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        }),
      },
    ],
  };

  const labelDynamicStyle = { maxWidth: Math.min(180, width * 0.55) };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            s.flowerRoot,
            {
              right: FAB_MARGIN_RIGHT + FAB_SIZE / 2,
              bottom: FAB_BOTTOM + FAB_SIZE / 2 + insets.bottom,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Cánh 1: Chat với AI */}
          <Animated.View style={[s.flowerPetal, petal1Style]}>
            <View style={[s.flowerLabel, labelDynamicStyle]}>
              <TextComponent
                text="Chat với AI"
                variant="caption"
                tone="inverse"
                weight="bold"
                numberOfLines={1}
              />
            </View>

            <Pressable
              onPress={onChatAI}
              style={({ pressed }) => [
                s.flowerButton,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <MaterialCommunityIcons
                name="robot"
                size={24}
                color={C.primary}
              />
            </Pressable>
          </Animated.View>

          {/* Cánh 2: Từ điển dinh dưỡng */}
          <Animated.View style={[s.flowerPetal, petal2Style]}>
            <View style={[s.flowerLabel, labelDynamicStyle]}>
              <TextComponent
                text="Từ điển dinh dưỡng"
                variant="caption"
                tone="inverse"
                weight="bold"
                numberOfLines={2}
              />
            </View>

            <Pressable
              onPress={onOpenGlossary}
              style={({ pressed }) => [
                s.flowerButton,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <MaterialCommunityIcons
                name="book-open-variant"
                size={24}
                color={C.primary}
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}




/* ================== Styles ================== */
const s = StyleSheet.create({
  searchInput: {
    flex: 1,
    color: C.text,
    paddingVertical: 8,
    fontFamily: 'System',
  },

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

  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
  },

  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  chatFab: {
    position: 'absolute',
    zIndex: 50,
    elevation: 12,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: C.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  chipsRow: {
    alignItems: 'center',
    gap: 20,
  },

  chip: {
    minWidth: 96,
    justifyContent: 'center',
  },

  chipInactiveShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  flowerRoot: {
    position: 'absolute',
    width: 0,
    height: 0,
  },

  flowerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.primaryBorder,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  flowerPetal: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  flowerLabel: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.9)',
    maxWidth: 180,
  },
});



// src/screens/Suggestion.tsx
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Image,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SuggestionStackParamList } from '../navigation/SuggestionNavigator';

import { getUpcomingFoods } from '../services/suggestion.service';
import type { PageableResponse } from '../types/types';
import type { FoodResponse } from '../types/food.type';

/* ================== Avatar fallback ================== */
function Avatar({
  name,
  photoUri,
}: {
  name: string;
  photoUri?: string | null;
}) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;
  return (
    <ViewComponent
      center
      radius={999}
      border
      backgroundColor={C.bg}
      style={s.avatar}
    >
      <TextComponent
        text={initials}
        variant="subtitle"
        weight="bold"
        tone="primary"
      />
    </ViewComponent>
  );
}

/* ================== Types & Data ================== */
type Slot = 'Bữa sáng' | 'Bữa trưa' | 'Bữa chiều' | 'Bữa phụ';
type Category = 'Tất cả' | Slot;

type Recipe = {
  id: string;
  title: string;
  desc: string;
  cal: number;
  protein: number;
  image: string;
  slot: Slot; // nhãn UI đã map từ DB
};

const CATS: Category[] = ['Tất cả', 'Bữa sáng', 'Bữa trưa', 'Bữa chiều', 'Bữa phụ'];

/* ================== Slot mapping ================== */
const mapMealSlot = (slot?: string): Slot => {
  if (!slot) return 'Bữa trưa';
  const s = String(slot).toLowerCase();
  if (s.includes('breakfast') || s.includes('sáng') || s.includes('sang')) return 'Bữa sáng';
  if (s.includes('lunch') || s.includes('trưa') || s.includes('trua')) return 'Bữa trưa';
  if (s.includes('dinner') || s.includes('tối') || s.includes('toi') || s.includes('chiều') || s.includes('chieu')) return 'Bữa chiều';
  if (s.includes('snack') || s.includes('phụ') || s.includes('phu')) return 'Bữa phụ';
  return 'Bữa trưa';
};

const getRawMealSlot = (f: any): string | undefined => {
  if (typeof f?.mealSlot === 'string' && f.mealSlot) return f.mealSlot;
  if (Array.isArray(f?.mealSlots) && f.mealSlots.length) return f.mealSlots[0];
  if (typeof f?.slot === 'string' && f.slot) return f.slot;
  if (Array.isArray(f?.meals) && f.meals.length) return f.meals[0];

  const pickFromArrayLike = (arr?: any[]) => {
    if (!Array.isArray(arr)) return undefined;
    const txt = arr
      .map(x => (typeof x === 'string' ? x : x?.name))
      .filter(Boolean)
      .map((t: any) => String(t).toLowerCase());
    if (txt.some(t => t.includes('breakfast'))) return 'breakfast';
    if (txt.some(t => t.includes('lunch'))) return 'lunch';
    if (txt.some(t => t.includes('dinner'))) return 'dinner';
    if (txt.some(t => t.includes('snack'))) return 'snack';
    if (txt.some(t => t.includes('sáng') || t.includes('sang'))) return 'sáng';
    if (txt.some(t => t.includes('trưa') || t.includes('trua'))) return 'trưa';
    if (txt.some(t => t.includes('chiều') || t.includes('chieu') || t.includes('tối') || t.includes('toi'))) return 'tối';
    if (txt.some(t => t.includes('phụ') || t.includes('phu'))) return 'phụ';
    return undefined;
  };

  return pickFromArrayLike(f?.tags) ?? pickFromArrayLike(f?.categories) ?? undefined;
};

const toRecipe = (f: FoodResponse): Recipe => {
  const rawSlot = getRawMealSlot(f as any);
  return {
    id: f.id,
    title: f.name,
    desc: f.description ?? '',
    // @ts-ignore tuỳ NutritionResponse
    cal: f.nutrition?.calories ?? f.nutrition?.energyKcal ?? 0,
    // @ts-ignore
    protein: f.nutrition?.protein ?? 0,
    image:
      f.imageUrl ||
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
    slot: mapMealSlot(rawSlot),
  };
};

/* ===== Slot badge helpers (UI) ===== */
const getSlotIcon = (slot: Slot) => {
  switch (slot) {
    case 'Bữa sáng': return 'sunny-outline';
    case 'Bữa trưa': return 'fast-food-outline';
    case 'Bữa chiều': return 'moon-outline';
    case 'Bữa phụ': return 'pizza-outline';
    default: return 'restaurant-outline';
  }
};

const getSlotBadgeColors = (slot: Slot) => {
  switch (slot) {
    case 'Bữa sáng': return { bg: 'rgba(255,173,51,0.85)', text: '#1F1F1F' };
    case 'Bữa trưa': return { bg: 'rgba(76,175,80,0.85)', text: '#FFFFFF' };
    case 'Bữa chiều': return { bg: 'rgba(96,125,139,0.85)', text: '#FFFFFF' };
    case 'Bữa phụ': return { bg: 'rgba(33,150,243,0.85)', text: '#FFFFFF' };
    default: return { bg: 'rgba(0,0,0,0.55)', text: '#FFFFFF' };
  }
};

/* ================== Screen ================== */
export default function Suggestion() {
  const navigation =
    useNavigation<NativeStackNavigationProp<SuggestionStackParamList>>();

  const { height: screenH } = useWindowDimensions();
  const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cat, setCat] = useState<Category>('Tất cả');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pageMeta, setPageMeta] = useState<PageableResponse<FoodResponse> | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // chặn gọi lặp onEndReached
  const canLoadMoreRef = useRef(true);

  // debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'replace' | 'append', signal?: AbortSignal) => {
      // TODO: nếu BE hỗ trợ filter theo query/cat, truyền kèm ở đây (ví dụ: getUpcomingFoods(page,size,query,cat))
      const data = await getUpcomingFoods(targetPage, PAGE_SIZE, signal);
      setPageMeta(data);

      const mapped = (data.content || []).map(toRecipe);
      setRecipes(prev => (mode === 'replace' ? mapped : [...prev, ...mapped]));
      setPage(targetPage);
    },
    [PAGE_SIZE],
  );

  // lần đầu
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setInitialLoading(true);
        await fetchPage(0, 'replace', controller.signal);
      } catch (e) {
        console.error('[UpcomingFoods] initial load error:', e);
      } finally {
        setInitialLoading(false);
      }
    })();
    return () => controller.abort();
  }, [fetchPage]);

  // khi thay đổi filter (cat) hoặc từ khoá -> reset & load trang 0
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        // reset pagestate
        canLoadMoreRef.current = true;
        setPage(0);
        setLoadingMore(false);
        setRefreshing(false);

        setInitialLoading(true);
        await fetchPage(0, 'replace', controller.signal);
      } catch (e) {
        console.error('[UpcomingFoods] refetch (filter/query) error:', e);
      } finally {
        setInitialLoading(false);
      }
    })();
    return () => controller.abort();
  }, [debouncedQuery, cat, fetchPage]);

  const onRefresh = useCallback(async () => {
    const controller = new AbortController();
    try {
      setRefreshing(true);
      canLoadMoreRef.current = true;
      await fetchPage(0, 'replace', controller.signal);
    } catch (e) {
      console.error('[UpcomingFoods] refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const hasNextPage = !!pageMeta && (pageMeta.last === false);

  const onEndReached = useCallback(async () => {
    // guard: cần có trang kế tiếp và không đang busy
    if (!hasNextPage) return;
    if (!canLoadMoreRef.current || loadingMore || refreshing || initialLoading) return;

    try {
      setLoadingMore(true);
      canLoadMoreRef.current = false;
      await fetchPage(page + 1, 'append');
    } catch (e) {
      console.error('[UpcomingFoods] load-more error:', e);
    } finally {
      setLoadingMore(false);
      // nới 1 nhịp để tránh spam
      setTimeout(() => {
        canLoadMoreRef.current = true;
      }, 250);
    }
  }, [fetchPage, hasNextPage, loadingMore, page, refreshing, initialLoading]);

  const onMomentumScrollBegin = useCallback(() => {
    // cho phép gọi onEndReached sau khi user thực sự kéo
    canLoadMoreRef.current = true;
  }, []);

  // Filter theo query & category (UI-side). Nếu BE hỗ trợ filter server-side, có thể bỏ local filter này.
  const filtered = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = cat === 'Tất cả' || r.slot === cat;
      const matchQ =
        debouncedQuery.length === 0 ||
        r.title.toLowerCase().includes(debouncedQuery) ||
        r.desc.toLowerCase().includes(debouncedQuery);
      return matchCat && matchQ;
    });
  }, [debouncedQuery, cat, recipes]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCat('Tất cả');
  }, []);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const renderRecipe = useCallback(
    ({ item }: { item: Recipe }) => {
      const checked = selected.has(item.id);
      const { bg, text } = getSlotBadgeColors(item.slot);

      return (
        <ViewComponent style={s.cardWrap}>
          <ViewComponent variant="card" radius={16} flex={1}>
            {/* Ảnh + tick + badge slot */}
            <ViewComponent style={s.thumbWrap}>
              <Image source={{ uri: item.image }} style={s.thumb} resizeMode="cover" />

              {/* Badge slot trái trên: đọc từ DB (đã map) */}
              <ViewComponent
                row
                alignItems="center"
                gap={6}
                style={[s.slotBadge, { backgroundColor: bg }]}
              >
                <Ionicons name={getSlotIcon(item.slot)} size={14} color={text} />
                <TextComponent
                  text={item.slot}
                  variant="caption"
                  weight="bold"
                  numberOfLines={1}
                  style={{ color: text }}
                />
              </ViewComponent>

              {/* Tick góc phải */}
              <Pressable onPress={() => toggleSelect(item.id)} style={s.tickWrap} hitSlop={8}>
                <ViewComponent
                  center
                  radius={999}
                  border
                  style={[
                    s.tickCircle,
                    {
                      borderColor: checked ? C.primary : C.primary,
                      backgroundColor: checked ? C.primary : C.white,
                    },
                  ]}
                >
                  <Ionicons
                    name={checked ? 'checkmark' : 'add'}
                    size={16}
                    color={checked ? C.onPrimary : C.primary}
                  />
                </ViewComponent>
              </Pressable>
            </ViewComponent>

            {/* Thân card */}
            <ViewComponent style={s.cardBody}>
              <ViewComponent style={s.bodyTop}>
                <TextComponent
                  text={item.title}
                  variant="h3"
                  tone="default"
                  numberOfLines={2}
                  style={{ letterSpacing: 0.15, height: 44, lineHeight: 22 }}
                />

                <TextComponent
                  text={item?.desc || 'Không có mô tả'}
                  variant="body"
                  numberOfLines={3}
                  style={{ lineHeight: 18, height: 54, textAlignVertical: 'top', marginBottom: 8 }}
                />

                {/* Dòng meta lấp khoảng trống */}
                <ViewComponent row alignItems="center" gap={6} style={{ marginTop: 2, marginBottom: 6 }}>
                  <Ionicons name="time-outline" size={14} color={C.slate500} />
                  <TextComponent
                    text={`Phù hợp: ${item.slot}`}
                    variant="caption"
                    tone="muted"
                    numberOfLines={1}
                  />
                </ViewComponent>

                {/* Stats kcal + protein */}
                <ViewComponent row gap={8} wrap mb={8}>
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
                </ViewComponent>
              </ViewComponent>

              <Pressable
                onPress={() => navigation.navigate('MealLogDetail')}
                style={({ pressed }) => [
                  s.ctaBtn,
                  {
                    backgroundColor: C.primarySurface,
                    borderColor: C.primaryBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <TextComponent
                  text="XEM CÔNG THỨC"
                  variant="caption"
                  weight="bold"
                  tone="default"
                  style={{ color: C.primaryDark, letterSpacing: 0.3 }}
                  numberOfLines={1}
                />
              </Pressable>
            </ViewComponent>
          </ViewComponent>
        </ViewComponent>
      );
    },
    [navigation, selected, toggleSelect],
  );

  return (
    <Container>
      {/* Header */}
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

      {/* Search + Filters + List */}
      <ViewComponent style={{ flex: 1, minHeight: CONTENT_MIN_HEIGHT }}>
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
            placeholder="Tìm kiếm món ăn..."
            placeholderTextColor={C.slate500}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            style={s.searchInput}
          />
          {query ? (
            <Pressable onPress={clearFilters} hitSlop={8}>
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
          {CATS.map(c => {
            const active = cat === c;
            return (
              <Pressable key={`cat-${c}`} onPress={() => setCat(c)} style={{ marginRight: 8 }}>
                <ViewComponent
                  center
                  radius={999}
                  border
                  px={20}
                  py={8}
                  backgroundColor={active ? C.primary : C.white}
                  borderColor={active ? C.primary : C.border}
                  style={active ? s.chipActiveShadow : undefined}
                >
                  <TextComponent
                    text={c}
                    variant="caption"
                    weight="bold"
                    tone={active ? 'inverse' : 'default'}
                    numberOfLines={1}
                    style={{ padding: 3 }}
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
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
            renderItem={renderRecipe}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || initialLoading}
                onRefresh={onRefresh}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            onMomentumScrollBegin={onMomentumScrollBegin}
            ListFooterComponent={
              loadingMore ? (
                <ViewComponent center style={{ padding: 12 }}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <TextComponent text="Đang tải thêm..." variant="caption" tone="muted" />
                </ViewComponent>
              ) : pageMeta?.last ? (
                <ViewComponent center style={{ padding: 12 }}>
                  <TextComponent text="Đã hiển thị tất cả " variant="caption" tone="muted" />
                </ViewComponent>
              ) : null
            }
            ListEmptyComponent={() =>
              initialLoading ? null : (
                <ViewComponent center style={{ flex: 1, padding: 24 }}>
                  <TextComponent text="Không tìm thấy kết quả" variant="h3" />
                  <TextComponent
                    text="Thử từ khóa khác hoặc chọn bộ lọc khác."
                    variant="body"
                    tone="muted"
                    style={{ marginTop: 8, textAlign: 'center' }}
                  />
                </ViewComponent>
              )
            }
          />
        </ViewComponent>
      </ViewComponent>
    </Container>
  );
}

/* ================== Styles ================== */
const s = StyleSheet.create({
  avatar: { width: 52, height: 52 },
  searchInput: {
    flex: 1,
    color: C.text,
    paddingVertical: 10,
    fontFamily: 'System',
  },
  chipActiveShadow: {
    shadowColor: C.primary,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Card grid
  cardWrap: { width: '48%', marginBottom: 12 },

  // Media
  thumbWrap: {
    width: '100%',
    aspectRatio: 1.2,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // Slot badge ở góc trái trên ảnh
  slotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },

  // Tick
  tickWrap: { position: 'absolute', top: 8, right: 8 },
  tickCircle: { width: 28, height: 28 },

  // Card body & text block
  cardBody: { padding: 12, minHeight: 150, justifyContent: 'space-between' },
  bodyTop: { flexShrink: 1 },

  ctaBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
});

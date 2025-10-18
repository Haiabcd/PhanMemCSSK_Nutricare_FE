import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import Ionicons from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SuggestionStackParamList } from '../navigation/SuggestionNavigator';
import type { FoodResponse } from '../types/food.type';
import type { MealSlot } from '../types/types';
import { suggestAllowedFoods } from '../services/planDay.service';
import AppHeader from '../components/AppHeader';

/* ============ helpers ============ */
const isAbortError = (e: any) =>
  e?.name === 'AbortError' ||
  e?.name === 'CanceledError' ||
  e?.message?.toString?.().includes('canceled') ||
  e?.message?.toString?.().includes('aborted') ||
  (typeof e?.code === 'string' && e.code === 'ERR_CANCELED');

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
  slot: Slot;
};

const CATS: Array<{ key: Category; icon: string }> = [
  { key: 'Tất cả', icon: 'grid-outline' },
  { key: 'Bữa sáng', icon: 'sunny-outline' },
  { key: 'Bữa trưa', icon: 'fast-food-outline' },
  { key: 'Bữa chiều', icon: 'moon-outline' },
  { key: 'Bữa phụ', icon: 'pizza-outline' },
];

/** mapping STABLE (không tạo object mới mỗi render) */
const CAT_TO_SLOT: Record<Category, MealSlot | undefined> = {
  'Tất cả': undefined,
  'Bữa sáng': 'BREAKFAST',
  'Bữa trưa': 'LUNCH',
  'Bữa chiều': 'DINNER',
  'Bữa phụ': 'SNACK',
};

/* ================== Slot mapping ================== */
const mapMealSlot = (slot?: string): Slot => {
  if (!slot) return 'Bữa trưa';
  const s = String(slot).toLowerCase();
  if (s.includes('breakfast') || s.includes('sáng') || s.includes('sang'))
    return 'Bữa sáng';
  if (s.includes('lunch') || s.includes('trưa') || s.includes('trua'))
    return 'Bữa trưa';
  if (
    s.includes('dinner') ||
    s.includes('tối') ||
    s.includes('toi') ||
    s.includes('chiều') ||
    s.includes('chieu')
  )
    return 'Bữa chiều';
  if (s.includes('snack') || s.includes('phụ') || s.includes('phu'))
    return 'Bữa phụ';
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
    if (
      txt.some(
        t =>
          t.includes('chiều') ||
          t.includes('chieu') ||
          t.includes('tối') ||
          t.includes('toi'),
      )
    )
      return 'tối';
    if (txt.some(t => t.includes('phụ') || t.includes('phu'))) return 'phụ';
    return undefined;
  };

  return (
    pickFromArrayLike(f?.tags) ?? pickFromArrayLike(f?.categories) ?? undefined
  );
};

const toRecipe = (f: FoodResponse): Recipe => {
  const rawSlot = getRawMealSlot(f as any);

  const kcal =
    (f as any)?.nutrition?.kcal ??
    (f as any)?.nutrition?.calories ??
    (f as any)?.nutrition?.energyKcal ??
    0;

  const protein =
    (f as any)?.nutrition?.proteinG ?? (f as any)?.nutrition?.protein ?? 0;

  return {
    id: f.id,
    title: f.name,
    desc: f.description ?? '',
    cal: Math.round(Number(kcal) || 0),
    protein: Number(protein) || 0,
    image:
      f.imageUrl ||
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
    slot: mapMealSlot(rawSlot),
  };
};

/* ===== Slot badge helpers (UI) ===== */
const getSlotIcon = (slot: Slot) => {
  switch (slot) {
    case 'Bữa sáng':
      return 'sunny-outline';
    case 'Bữa trưa':
      return 'fast-food-outline';
    case 'Bữa chiều':
      return 'moon-outline';
    case 'Bữa phụ':
      return 'pizza-outline';
    default:
      return 'restaurant-outline';
  }
};

const getSlotBadgeColors = (slot: Slot) => {
  switch (slot) {
    case 'Bữa sáng':
      return { bg: 'rgba(255,173,51,0.85)', text: '#1F1F1F' };
    case 'Bữa trưa':
      return { bg: 'rgba(76,175,80,0.85)', text: '#FFFFFF' };
    case 'Bữa chiều':
      return { bg: 'rgba(96,125,139,0.85)', text: '#FFFFFF' };
    case 'Bữa phụ':
      return { bg: 'rgba(33,150,243,0.85)', text: '#FFFFFF' };
    default:
      return { bg: 'rgba(0,0,0,0.55)', text: '#FFFFFF' };
  }
};

/* ================== Screen ================== */
export default function Suggestion() {
  const navigation =
    useNavigation<NativeStackNavigationProp<SuggestionStackParamList>>();

  const { height: screenH } = useWindowDimensions();
  const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));

  // ====== Search & Category ======
  const [query, setQuery] = useState(''); // (giữ lại cho future: ô search)
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cat, setCat] = useState<Category>('Tất cả');

  // ====== Caches theo danh mục (5 useState) ======
  const [dataAll, setDataAll] = useState<Recipe[]>([]);
  const [dataBreakfast, setDataBreakfast] = useState<Recipe[]>([]);
  const [dataLunch, setDataLunch] = useState<Recipe[]>([]);
  const [dataDinner, setDataDinner] = useState<Recipe[]>([]);
  const [dataSnack, setDataSnack] = useState<Recipe[]>([]);

  // danh sách đang hiển thị (theo danh mục)
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // ====== Loading ======
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // debounce query
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      200,
    );
    return () => clearTimeout(t);
  }, [query]);

  // helper: trả về cache theo category
  const getCacheByCat = useCallback(
    (c: Category): Recipe[] => {
      switch (c) {
        case 'Bữa sáng':
          return dataBreakfast;
        case 'Bữa trưa':
          return dataLunch;
        case 'Bữa chiều':
          return dataDinner;
        case 'Bữa phụ':
          return dataSnack;
        default:
          return dataAll;
      }
    },
    [dataAll, dataBreakfast, dataLunch, dataDinner, dataSnack],
  );

  // helper: ghi cache theo category (stable)
  const setCacheByCat = useCallback((c: Category, list: Recipe[]) => {
    switch (c) {
      case 'Bữa sáng':
        setDataBreakfast(list);
        break;
      case 'Bữa trưa':
        setDataLunch(list);
        break;
      case 'Bữa chiều':
        setDataDinner(list);
        break;
      case 'Bữa phụ':
        setDataSnack(list);
        break;
      default:
        setDataAll(list);
        break;
    }
  }, []);

  /** Fetch cho 1 category (stable, không phụ thuộc object thay đổi mỗi render) */
  const fetchForCategory = useCallback(
    async (c: Category, signal?: AbortSignal) => {
      const slot = CAT_TO_SLOT[c]; // undefined cho 'Tất cả'
      try {
        const res = await suggestAllowedFoods({ slot, limit: 20 }, signal);
        const list = (res?.data ?? []).map(toRecipe);
        setCacheByCat(c, list);
        return list;
      } catch (e) {
        if (isAbortError(e)) return []; // bỏ qua request bị huỷ
        console.error('[Suggestion] fetch by category error:', e);
        throw e;
      }
    },
    [setCacheByCat],
  );

  /** Chỉ dùng 1 effect theo `cat` để nạp dữ liệu */
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setInitialLoading(true);
        const cached = getCacheByCat(cat);
        if (cached.length > 0) {
          setRecipes(cached);
          return;
        }
        const list = await fetchForCategory(cat, ac.signal);
        if (mountedRef.current) setRecipes(list);
      } catch (e) {
        if (!isAbortError(e)) {
          console.error('[Suggestion] effect error:', e);
          if (mountedRef.current) setRecipes([]);
        }
      } finally {
        if (mountedRef.current) setInitialLoading(false);
      }
    })();
    return () => ac.abort();
  }, [cat, getCacheByCat, fetchForCategory]);

  // Kéo để refresh: chỉ refresh danh mục hiện tại
  const onRefresh = useCallback(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setRefreshing(true);
        const list = await fetchForCategory(cat, ac.signal);
        if (mountedRef.current) {
          setRecipes(list);
        }
      } catch (e) {
        if (!isAbortError(e)) console.error('[Suggestion] refresh error:', e);
      } finally {
        if (mountedRef.current) setRefreshing(false);
      }
    })();
  }, [cat, fetchForCategory]);

  // ====== Local Filter theo query ======
  const filtered = useMemo(() => {
    const base = recipes;
    if (!debouncedQuery) return base;
    const q = debouncedQuery;
    return base.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        (r.desc || '').toLowerCase().includes(q),
    );
  }, [recipes, debouncedQuery]);

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
              <Image
                source={{ uri: item.image }}
                style={s.thumb}
                resizeMode="cover"
              />

              {/* Badge slot trái trên */}
              <ViewComponent
                row
                alignItems="center"
                gap={6}
                style={[s.slotBadge, { backgroundColor: bg }]}
              >
                <Ionicons
                  name={getSlotIcon(item.slot)}
                  size={14}
                  color={text}
                />
                <TextComponent
                  text={item.slot}
                  variant="caption"
                  weight="bold"
                  numberOfLines={1}
                  style={{ color: text }}
                />
              </ViewComponent>

              {/* Tick góc phải */}
              <Pressable
                onPress={() => toggleSelect(item.id)}
                style={s.tickWrap}
                hitSlop={8}
              >
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

              {/* === Kcal badge dính ảnh (góc dưới-trái) === */}
              <ViewComponent row alignItems="center" gap={6} style={s.calBadge}>
                <McIcon name="fire" size={14} color={C.white} />
                <TextComponent
                  text={`${item.cal} kcal`}
                  variant="caption"
                  weight="bold"
                  style={s.calText}
                  numberOfLines={1}
                />
              </ViewComponent>
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
                  style={{
                    lineHeight: 18,
                    height: 54,
                    textAlignVertical: 'top',
                    marginBottom: 8,
                  }}
                />
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
      {/* Header dùng chung */}
      <AppHeader
        loading={initialLoading}
        // onPressBell={() => navigation.navigate('')}
      />

      {/* Filters + List */}
      <ViewComponent style={{ flex: 1, minHeight: CONTENT_MIN_HEIGHT }}>
        {/* Filters (chip + icon) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12, height: 46, maxHeight: 46 }}
          contentContainerStyle={s.chipsRow}
        >
          {CATS.map(({ key, icon }) => {
            const active = cat === key;
            return (
              <Pressable
                key={`cat-${key}`}
                onPress={() => setCat(key)}
                style={{ marginRight: 10 }}
              >
                <ViewComponent
                  row
                  alignItems="center"
                  gap={8}
                  radius={999}
                  border
                  px={14}
                  py={8}
                  backgroundColor={active ? C.primary : C.white}
                  borderColor={active ? C.primary : C.border}
                  style={[
                    s.chip,
                    active ? s.chipActiveShadow : s.chipInactiveShadow,
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={14}
                    color={active ? C.onPrimary : C.slate700}
                  />
                  <TextComponent
                    text={key}
                    variant="caption"
                    weight="bold"
                    tone={active ? 'inverse' : 'default'}
                    numberOfLines={1}
                    style={{ paddingTop: 2 }}
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
            ListFooterComponent={
              <ViewComponent center style={{ padding: 12 }}>
                <TextComponent text=" " variant="caption" tone="muted" />
              </ViewComponent>
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
  chipsRow: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  chip: {
    minWidth: 96,
    justifyContent: 'center',
  },
  chipActiveShadow: {
    shadowColor: C.primary,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipInactiveShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  cardWrap: { width: '48%', marginBottom: 12 },

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

  tickWrap: { position: 'absolute', top: 8, right: 8 },
  tickCircle: { width: 28, height: 28 },

  calBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  calText: {
    color: '#FFFFFF',
  },

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

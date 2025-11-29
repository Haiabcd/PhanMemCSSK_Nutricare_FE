import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import Ionicons from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors as C } from '../constants/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SuggestionStackParamList } from '../navigation/SuggestionNavigator';
import { getSwapSuggestions } from '../services/planDay.service';
import { saveSuggestionLog } from '../services/log.service';
import AppHeader from '../components/AppHeader';
import type { SwapSuggestion } from '../types/mealPlan.type';

/* ============ helpers ============ */
const isAbortError = (e: any) =>
  e?.name === 'AbortError' ||
  e?.name === 'CanceledError' ||
  e?.message?.toString?.().includes('canceled') ||
  e?.message?.toString?.().includes('aborted') ||
  (typeof e?.code === 'string' && e.code === 'ERR_CANCELED');

/* ================== Toast helpers (simple) ================== */
type NoticeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const toastColors: Record<
  NoticeTone,
  { bg: string; border: string; text: string }
> = {
  default: { bg: '#e5e7eb', border: '#9ca3af', text: '#111827' },
  success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  warning: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  danger: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
  info: { bg: '#e0f2fe', border: '#38bdf8', text: '#0ea5e9' },
};

const ToastBar = ({
  message,
  tone = 'default',
  onClose,
}: {
  message: string;
  tone?: NoticeTone;
  onClose: () => void;
}) => {
  const c = toastColors[tone];
  return (
    <ViewComponent style={s.toastWrap}>
      <ViewComponent
        variant="card"
        style={{
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: 1,
          padding: 12,
          borderRadius: 14,
        }}
      >
        <ViewComponent row between alignItems="center">
          <TextComponent
            text={message}
            style={{ color: c.text, flex: 1, paddingRight: 8 }}
            weight="semibold"
          />
          <Pressable onPress={onClose} hitSlop={10}>
            <TextComponent text="✕" style={{ color: c.text }} weight="bold" />
          </Pressable>
        </ViewComponent>
      </ViewComponent>
    </ViewComponent>
  );
};

/* ================== Types & Data ================== */
type Slot = 'Bữa sáng' | 'Bữa trưa' | 'Bữa chiều' | 'Bữa phụ';
type Category = 'Tất cả' | Slot;

type Recipe = {
  id: string;
  foodId: string;
  title: string;
  desc: string;
  image: string;
  slot: Slot;
  slots: Slot[];
  portion?: number;
  originalItemId: string | null;
  originalFoodId: string | null;
  originalFoodName: string;
  originalPortion?: number;
  isSnackFallback?: boolean;
};

const DEFAULT_FOOD_IMAGE =
  'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800';

const CATS: Array<{ key: Category; icon: string }> = [
  { key: 'Tất cả', icon: 'grid-outline' },
  { key: 'Bữa sáng', icon: 'sunny-outline' },
  { key: 'Bữa trưa', icon: 'fast-food-outline' },
  { key: 'Bữa chiều', icon: 'moon-outline' },
  { key: 'Bữa phụ', icon: 'pizza-outline' },
];

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
  const { height: screenH, width: screenW } = useWindowDimensions();
  const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));
  const numColumns = screenW < 380 ? 1 : 2;

  // ====== Search & Category ======
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cat, setCat] = useState<Category>('Tất cả');

  // danh sách hiển thị
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // ====== Loading ======
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      200,
    );
    return () => clearTimeout(t);
  }, [query]);

  // ====== Selected (visual) ======
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ====== Toast state ======
  const [toast, setToast] = useState<{ msg: string; tone: NoticeTone } | null>(
    null,
  );
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback(
    (msg: string, tone: NoticeTone = 'success', duration = 2000) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ msg, tone });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    },
    [],
  );

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const fetchSuggestions = useCallback(async (signal?: AbortSignal) => {
    try {
      if (mountedRef.current) {
        setLoadingSuggestions(true);
      }
      const res = await getSwapSuggestions(signal);
      const data: SwapSuggestion[] = res?.data ?? [];


      const mapped: Recipe[] = data.flatMap(sug => {
        const slot = mapMealSlot(sug.slot);

        if (!sug.candidates || sug.candidates.length === 0) return [];

        const isSnackFallback =
          !sug.itemId || !sug.originalFoodId; // backend snack: itemId = null, originalFoodId = null

        return sug.candidates.map(c => ({
          id: isSnackFallback ? `snack-${c.foodId}` : `${sug.itemId}-${c.foodId}`,
          foodId: c.foodId,
          title: c.foodName,
          desc:
            c.reason ||
            (isSnackFallback
              ? 'Món ăn vặt gợi ý thêm, bạn có thể ăn linh hoạt ngoài kế hoạch chính.'
              : ''),
          image: c.imageUrl || DEFAULT_FOOD_IMAGE,
          slot: isSnackFallback ? 'Bữa phụ' : slot, // snack → hiển thị là Bữa phụ
          slots: [isSnackFallback ? 'Bữa phụ' : slot],

          portion: Number(c.portion) || 1,

          originalItemId: (sug.itemId as string | null) ?? null,
          originalFoodId: (sug.originalFoodId as string | null) ?? null,
          originalFoodName:
            sug.originalFoodName ||
            (isSnackFallback ? 'Món ăn vặt gợi ý' : 'Món trong kế hoạch'),
          originalPortion:
            typeof sug.originalPortion === 'number'
              ? Number(sug.originalPortion)
              : undefined,

          isSnackFallback,
        }));
      });


      if (mountedRef.current) {
        setRecipes(mapped);
        setSelected(new Set());
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.error('[Suggestion] fetchSuggestions error:', e);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingSuggestions(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const ac = new AbortController();
      fetchSuggestions(ac.signal);

      return () => {
        ac.abort();
      };
    }, [fetchSuggestions]),
  );

  const onRefresh = useCallback(() => {
    (async () => {
      try {
        setRefreshing(true);
        await fetchSuggestions();
      } finally {
        if (mountedRef.current) setRefreshing(false);
      }
    })();
  }, [fetchSuggestions]);

  // ====== Local Filter theo query + category
  const filtered = useMemo(() => {
    let base = recipes;

    if (cat !== 'Tất cả') {
      base = base.filter(r => r.slot === cat);
    }

    if (!debouncedQuery) return base;
    const q = debouncedQuery;
    return base.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        (r.desc || '').toLowerCase().includes(q),
    );
  }, [recipes, debouncedQuery, cat]);

  const isShowingOnlySnackFallbacks = useMemo(
    () => filtered.length > 0 && filtered.every(r => r.isSnackFallback),
    [filtered],
  );

  const handleSaveSuggestion = useCallback(
    async (item: Recipe) => {
      // Snack fallback: không swap, chỉ mở chi tiết
      if (item.isSnackFallback) {
        navigation.navigate('MealLogDetail', {
          id: item.foodId,
          suggestionDesc: item?.desc || undefined,
          suggestionSwapText: 'Món ăn vặt gợi ý thêm.',
        });
        return;
      }

      // Không có originalItemId thì không gọi log
      if (!item.originalItemId) {
        return;
      }

      try {
        await saveSuggestionLog({
          itemId: item.originalItemId,
          newFoodId: item.foodId,
          portion: item.portion ?? 1,
        });

        if (!mountedRef.current) return;

        // 1. Ẩn mọi card thuộc originalItemId này
        setRecipes(prev =>
          prev.filter(r => r.originalItemId !== item.originalItemId),
        );

        // 2. Xoá tick của các card cùng originalItemId
        setSelected(prev => {
          const next = new Set(prev);
          Array.from(next).forEach(id => {
            if (id.startsWith(item.originalItemId + '-')) {
              next.delete(id);
            }
          });
          return next;
        });

        // 3. Reset category
        setCat('Tất cả');

        // 4. Reload suggestion từ server
        fetchSuggestions();

        // 5. Toast
        notify('Đã cập nhật món trong kế hoạch của bạn.', 'success');
      } catch (e) {
        if (!isAbortError(e)) {
          console.error('[Suggestion] saveSuggestionLog error:', e);
          notify('Không thể cập nhật món, vui lòng thử lại.', 'danger');
        }
      }
    },
    [fetchSuggestions, notify, navigation],
  );



  const toggleSelect = useCallback(
    (item: Recipe) => {
      // Snack: trigger luôn hành động, không cần toggle tick
      if (item.isSnackFallback) {
        handleSaveSuggestion(item);
        return;
      }

      setSelected(prev => {
        const next = new Set(prev);
        const wasSelected = next.has(item.id);

        if (wasSelected) {
          next.delete(item.id);
        } else {
          next.add(item.id);
          handleSaveSuggestion(item);
        }

        return next;
      });
    },
    [handleSaveSuggestion],
  );



  const renderRecipe = useCallback(
    ({ item }: { item: Recipe }) => {
      const checked = selected.has(item.id);

      const originalPortionText =
        typeof item.originalPortion === 'number'
          ? `${item.originalPortion} khẩu phần`
          : '1 khẩu phần';
      const isSnackFallback = item.isSnackFallback;


      return (
        <ViewComponent
          style={[s.cardWrap, numColumns === 1 && { width: '100%' }]}
        >
          <ViewComponent variant="card" radius={16} flex={1}>
            {/* Ảnh + tick + badge slot */}
            <ViewComponent style={s.thumbWrap}>
              <Image
                source={{ uri: item.image }}
                style={s.thumb}
                resizeMode="cover"
              />
              {/* Badge slot */}
              <ViewComponent
                row
                alignItems="center"
                gap={6}
                style={s.slotBadgesRow}
              >
                {item.slots.map(slt => {
                  const { bg, text } = getSlotBadgeColors(slt);
                  return (
                    <ViewComponent
                      key={`slot-${item.id}-${slt}`}
                      row
                      alignItems="center"
                      gap={6}
                      style={[
                        s.slotBadge,
                        {
                          backgroundColor: bg,
                          borderColor: 'rgba(255,255,255,0.45)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={getSlotIcon(slt)}
                        size={14}
                        color={text}
                      />
                      <TextComponent
                        text={slt}
                        variant="caption"
                        weight="bold"
                        numberOfLines={1}
                        style={{ color: text }}
                      />
                    </ViewComponent>
                  );
                })}
              </ViewComponent>

              {/* Tick góc phải – KHÔNG hiện cho snack fallback */}
              {!isSnackFallback && (
                <Pressable
                  onPress={() => toggleSelect(item)}
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
              )}


              {/* Portion badge */}
              {typeof item.portion === 'number' && (
                <ViewComponent
                  row
                  alignItems="center"
                  gap={6}
                  style={s.calBadge}
                >
                  <McIcon name="scale-bathroom" size={14} color={C.white} />
                  <TextComponent
                    text={`${item.portion} khẩu phần`}
                    variant="caption"
                    weight="bold"
                    style={s.calText}
                    numberOfLines={1}
                  />
                </ViewComponent>
              )}
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

                {/* Reason */}
                <TextComponent
                  text={item?.desc || 'Không có mô tả'}
                  variant="body"
                  numberOfLines={4}
                  style={{
                    lineHeight: 18,
                    height: 72,
                    textAlignVertical: 'top',
                  }}
                />

                {/* Box thể hiện món gốc / hoặc snack info */}
                <ViewComponent
                  row
                  alignItems="flex-start"
                  gap={6}
                  style={s.swapBox}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={14}
                    color={C.primaryDark}
                    style={s.swapIcon}
                  />

                  <ViewComponent style={{ flex: 1 }}>
                    {isSnackFallback ? (
                      <>
                        <TextComponent
                          text="Ăn vặt thêm"
                          variant="caption"
                          tone="muted"
                          style={{ marginBottom: 2 }}
                          numberOfLines={1}
                        />
                        <TextComponent
                          text="Món ăn vặt gợi ý thêm, không thay thế món nào trong kế hoạch."
                          variant="caption"
                          weight="bold"
                          style={s.swapText}
                          numberOfLines={2}
                        />
                      </>
                    ) : (
                      <>
                        <TextComponent
                          text="Thay cho"
                          variant="caption"
                          tone="muted"
                          style={{ marginBottom: 2 }}
                          numberOfLines={1}
                        />
                        <TextComponent
                          text={`${item.originalFoodName} (${item.slot}, ${originalPortionText})`}
                          variant="caption"
                          weight="bold"
                          style={s.swapText}
                          numberOfLines={2}
                        />
                      </>
                    )}
                  </ViewComponent>
                </ViewComponent>

              </ViewComponent>

              <Pressable
                onPress={() =>
                  navigation.navigate('MealLogDetail', {
                    id: item.foodId,
                    suggestionDesc: item?.desc || undefined,
                    suggestionSwapText: isSnackFallback
                      ? 'Món ăn vặt gợi ý thêm.'
                      : `Thay cho: ${item.originalFoodName} (${item.slot}, ${originalPortionText})`,
                  })
                }
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
                  text="XEM CHI TIẾT"
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
    [navigation, selected, toggleSelect, numColumns],
  );

  const showInitialPlaceholder = loadingSuggestions && recipes.length === 0;
  return (
    <Container>
      <AppHeader
        loading={false}
        onBellPress={() => navigation.navigate('Notification')}
      />

      <ViewComponent style={{ flex: 1, minHeight: CONTENT_MIN_HEIGHT }}>
        {showInitialPlaceholder ? (
          <ViewComponent
            center
            style={{
              flex: 1,
              paddingHorizontal: 24,
            }}
          >
            <ActivityIndicator
              size="large"
              color={C.primary}
              style={{ marginBottom: 16 }}
            />
            <TextComponent
              text="NutriCare đang chuẩn bị các gợi ý món ăn phù hợp cho bạn."
              variant="h3"
              tone="default"
              style={{ textAlign: 'center', marginBottom: 8 }}
            />
            <TextComponent
              text="Việc tính toán dinh dưỡng có thể hơi lâu một chút, bạn vui lòng chờ trong giây lát nhé."
              variant="body"
              tone="muted"
              style={{ textAlign: 'center' }}
            />
          </ViewComponent>
        ) : (
          <>
            {/* Filter chips */}
            <FlatList
              horizontal
              data={CATS}
              keyExtractor={item => `cat-${item.key}`}
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12, height: 46, maxHeight: 46 }}
              contentContainerStyle={[
                s.chipsRow,
                {
                  paddingHorizontal: 16,
                  flexGrow: 1,
                  justifyContent: 'center',
                },
              ]}
              ItemSeparatorComponent={() => (
                <ViewComponent style={{ width: 10 }} />
              )}
              renderItem={({ item }) => {
                const active = cat === item.key;
                return (
                  <Pressable onPress={() => setCat(item.key)}>
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
                        name={item.icon}
                        size={14}
                        color={active ? C.onPrimary : C.slate700}
                      />
                      <TextComponent
                        text={item.key}
                        variant="caption"
                        weight="bold"
                        tone={active ? 'inverse' : 'default'}
                        numberOfLines={1}
                        style={{ paddingTop: 2 }}
                      />
                    </ViewComponent>
                  </Pressable>
                );
              }}
            />

            {/* Thông báo khi chỉ có danh sách món ăn vặt */}
            {isShowingOnlySnackFallbacks && (
              <ViewComponent style={{ marginTop: 10 }}>
                <ViewComponent
                  radius={14}
                  border
                  px={12}
                  py={10}
                  backgroundColor={C.blueLight}
                  borderColor={C.primaryBorder}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  <ViewComponent
                    center
                    radius={999}
                    style={{
                      width: 28,
                      height: 28,
                      marginRight: 10,
                      backgroundColor: C.primary,
                    }}
                  >
                    <Ionicons name="information" size={16} color={C.onPrimary} />
                  </ViewComponent>

                  <ViewComponent style={{ flex: 1 }}>
                    <TextComponent
                      text="Gợi ý ăn vặt linh hoạt"
                      variant="caption"
                      weight="bold"
                      style={{ marginBottom: 4, letterSpacing: 0.2 }}
                    />
                    <TextComponent
                      text="Hôm nay bạn đã bám khá sát kế hoạch rồi. NutriCare gợi ý thêm một vài món ăn vặt nhẹ – đây là những lựa chọn linh hoạt, không làm lệch kế hoạch chính. Bạn có thể ăn thêm khi hơi đói hoặc cần nạp năng lượng giữa các bữa."
                      variant="caption"
                      tone="default"
                      style={{ lineHeight: 16 }}
                    />
                  </ViewComponent>
                </ViewComponent>
              </ViewComponent>
            )}


            {/* List */}
            <ViewComponent style={{ flex: 1, minHeight: 0 }}>
              <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                numColumns={numColumns}
                columnWrapperStyle={
                  numColumns > 1
                    ? { justifyContent: 'space-between' }
                    : undefined
                }
                contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
                renderItem={renderRecipe}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={C.primary}
                    colors={[C.primary]}
                  />
                }
                ListFooterComponent={
                  !loadingSuggestions && !refreshing && filtered.length > 0 ? (
                    <ViewComponent center style={{ paddingVertical: 16 }}>
                      <ViewComponent
                        style={{
                          height: 1,
                          backgroundColor: C.border,
                          width: '40%',
                          marginBottom: 8,
                        }}
                      />
                      <TextComponent
                        text="Bạn đã xem hết gợi ý"
                        variant="caption"
                        tone="muted"
                      />
                    </ViewComponent>
                  ) : null
                }
                ListEmptyComponent={() =>
                  loadingSuggestions ? null : (
                    <ViewComponent center style={{ flex: 1, padding: 24 }}>
                      <TextComponent
                        text="Không còn gợi ý món ăn"
                        variant="h3"
                      />
                      <TextComponent
                        text="Bạn đã xem hoặc cập nhật toàn bộ gợi ý thay thế cho các món trong kế hoạch hôm nay."
                        variant="body"
                        tone="muted"
                        style={{ marginTop: 8, textAlign: 'center' }}
                      />
                    </ViewComponent>
                  )
                }
              />
            </ViewComponent>
          </>
        )}
      </ViewComponent>

      {/* Toast */}
      {toast && (
        <ToastBar
          message={toast.msg}
          tone={toast.tone}
          onClose={() => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            setToast(null);
          }}
        />
      )}
    </Container>
  );
}

/* ================== Styles ================== */
const s = StyleSheet.create({
  chipsRow: {
    alignItems: 'center',
    gap: 20,
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

  cardWrap: {
    width: '48%',
    marginBottom: 12,
  },

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
  slotBadgesRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: '85%',
  },
  slotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
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

  swapBox: {
    marginBottom: 13,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.blueLight,
  },
  swapIcon: {
    marginTop: 1,
  },
  swapText: {
    flex: 1,
    fontWeight: '700',
    lineHeight: 16,
    color: C.black,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },

  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 999,
  },
});

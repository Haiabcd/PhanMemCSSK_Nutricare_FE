import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Image, StyleSheet, ScrollView, Pressable, View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { PlanStackParamList } from '../navigation/PlanNavigator';

// API & types
import { getFoodById } from '../services/food.service';
import type { FoodResponse } from '../types/food.type';

type MacroKey = 'carb' | 'protein' | 'fat' | 'fiber';
type Macro = { key: MacroKey; label: string; value: number; unit?: string };

type MealDetailDemo = {
  image: string;
  title: string;
  servingNote: string;
  calories: number;
  macros: Macro[];
};

// Fallback khi API thiếu dữ liệu
const DEMO: MealDetailDemo = {
  image:
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1600&auto=format&fit=crop',
  title: 'Cơm gà áp chảo rau củ',
  servingNote: '1 khẩu phần ~ 350 g (ước lượng)',
  calories: 520,
  macros: [
    { key: 'carb', label: 'Carb', value: 58, unit: 'g' },
    { key: 'protein', label: 'Đạm', value: 35, unit: 'g' },
    { key: 'fat', label: 'Béo', value: 14, unit: 'g' },
    { key: 'fiber', label: 'Xơ', value: 7, unit: 'g' },
  ],
};

function MacroCard({ m }: { m: Macro }) {
  const tone: Record<MacroKey, string> = {
    carb: C.accent,
    protein: C.success,
    fat: C.amber500,
    fiber: C.primary,
  };
  return (
    <ViewComponent p={12} radius={14} style={s.macroCard}>
      <TextComponent text={m.label} variant="caption" tone="muted" />
      <TextComponent
        text={`${m.value}${m.unit ?? 'g'}`}
        weight="semibold"
        color={tone[m.key]}
      />
    </ViewComponent>
  );
}

type Props = { onBack?: () => void };
type MealLogDetailRoute = RouteProp<PlanStackParamList, 'MealLogDetail'>;

const MEAL_SLOT_VN: Record<string, string> = {
  BREAKFAST: 'Sáng',
  LUNCH: 'Trưa',
  DINNER: 'Chiều',
  SNACK: 'Phụ',
};

// ===== Helpers =====
// Tạo chips "điểm nổi bật" từ nutrition hiện có
function getHighlights(n?: FoodResponse['nutrition']): string[] {
  if (!n) return [];
  const protein = Number(n.proteinG ?? 0);
  const fat = Number(n.fatG ?? 0);
  const fiber = Number(n.fiberG ?? 0);
  const sugar = Number(n.sugarMg ?? 0) / 1000; // mg -> g
  const sodium = Number(n.sodiumMg ?? 0);

  const tags: string[] = [];
  if (protein >= 20) tags.push('Đạm cao');
  if (fiber >= 5) tags.push('Giàu xơ');
  if (fat <= 10) tags.push('Ít béo');
  if (sugar <= 5) tags.push('Ít đường');
  if (sodium >= 600) tags.push('Natri cao');
  return tags;
}

// Tính khẩu phần nhanh theo multiplier
function scalePortion(
  n?: FoodResponse['nutrition'],
  baseKcal?: number,
  mul = 1,
) {
  if (!n) return null;
  const toNum = (x?: any) => Number(x ?? 0);
  const kcal = Math.round(Number(n.kcal ?? baseKcal ?? 0) * mul);
  return {
    kcal,
    carbG: Math.round(toNum(n.carbG) * mul),
    proteinG: Math.round(toNum(n.proteinG) * mul),
    fatG: Math.round(toNum(n.fatG) * mul),
  };
}

// Tính kcal của từng macro (4/4/9) và % trên tổng kcal
function useMacroPercents(n?: FoodResponse['nutrition']) {
  return useMemo(() => {
    if (!n) return { carbPct: 0, proteinPct: 0, fatPct: 0, totalKcalCalc: 0 };
    const carb = Number(n.carbG ?? 0);
    const protein = Number(n.proteinG ?? 0);
    const fat = Number(n.fatG ?? 0);

    const kcCarb = carb * 4;
    const kcPro = protein * 4;
    const kcFat = fat * 9;
    const totalKcalCalc = kcCarb + kcPro + kcFat;
    const base = Number(n.kcal ?? totalKcalCalc) || totalKcalCalc || 1;

    return {
      carbPct: Math.min(100, Math.round((kcCarb / base) * 100)),
      proteinPct: Math.min(100, Math.round((kcPro / base) * 100)),
      fatPct: Math.min(100, Math.round((kcFat / base) * 100)),
      totalKcalCalc,
    };
  }, [n]);
}

export default function MealLogDetail({ onBack }: Props) {
  const navigation = useNavigation();
  const { params } = useRoute<MealLogDetailRoute>();
  const { id } = params; // foodId

  const [food, setFood] = useState<FoodResponse | null>(null);

  const fetchFood = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await getFoodById(id, signal);
        setFood(res);
      } catch (e) {
        console.log('getFoodById error:', e);
      }
    },
    [id],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchFood(ac.signal);
    return () => ac.abort();
  }, [fetchFood]);

  const goBack = () => (onBack ? onBack() : (navigation as any).goBack?.());

  // ===== Map dữ liệu hiển thị (giữ đúng phạm vi dữ liệu hiện có) =====
  const displayTitle = food?.name ?? DEMO.title;
  const displayImage = food?.imageUrl ?? DEMO.image;

  const displayDescription =
    food?.description == null || `${food?.description}`.trim() === ''
      ? 'Món ăn đang chờ cập nhật mô tả. Hãy thử ngay để cảm nhận hương vị!'
      : (food!.description as string);

  const displayServingNote = useMemo(() => {
    if (food) {
      const unit = food.servingName || 'khẩu phần';
      const gram = Number(food.servingGram || 0);
      return gram > 0 ? `1 ${unit} ~ ${gram} g` : `1 ${unit}`;
    }
    return DEMO.servingNote;
  }, [food]);

  const displayKcal = useMemo(
    () =>
      food?.nutrition?.kcal != null
        ? Math.round(Number(food.nutrition.kcal))
        : DEMO.calories,
    [food?.nutrition?.kcal],
  );

  const displayMacros: Macro[] = useMemo(() => {
    if (food?.nutrition) {
      return [
        {
          key: 'carb',
          label: 'Carb',
          value: Math.round(Number(food.nutrition.carbG ?? 0)),
          unit: 'g',
        },
        {
          key: 'protein',
          label: 'Đạm',
          value: Math.round(Number(food.nutrition.proteinG ?? 0)),
          unit: 'g',
        },
        {
          key: 'fat',
          label: 'Béo',
          value: Math.round(Number(food.nutrition.fatG ?? 0)),
          unit: 'g',
        },
        {
          key: 'fiber',
          label: 'Xơ',
          value: Math.round(Number(food.nutrition.fiberG ?? 0)),
          unit: 'g',
        },
      ];
    }
    return DEMO.macros;
  }, [food?.nutrition]);

  const mealChips = useMemo(() => {
    const slots = food?.mealSlots || [];
    return slots.map(s => MEAL_SLOT_VN[s] ?? s);
  }, [food?.mealSlots]);

  const { carbPct, proteinPct, fatPct } = useMacroPercents(food?.nutrition);

  // Chips điểm nổi bật
  const highlightChips = useMemo(
    () => getHighlights(food?.nutrition),
    [food?.nutrition],
  );

  // Vi chất (sodium/sugar/fiber) nếu có
  const micro = useMemo(() => {
    const n = food?.nutrition;
    if (!n) return null;
    const sodium = Number(n.sodiumMg ?? NaN);
    const sugar = Number(n.sugarMg ?? NaN);
    const fiber = Number(n.fiberG ?? NaN);
    const items: { label: string; value: string }[] = [];
    if (!Number.isNaN(sodium) && sodium > 0)
      items.push({ label: 'Natri', value: `${Math.round(sodium)} mg` });
    if (!Number.isNaN(sugar) && sugar > 0)
      items.push({ label: 'Đường', value: `${Math.round(sugar)} mg` });
    if (!Number.isNaN(fiber) && fiber > 0)
      items.push({ label: 'Chất xơ', value: `${Math.round(fiber)} g` });
    return items.length ? items : null;
  }, [food?.nutrition]);

  // Khẩu phần nhanh
  const portionHalf = useMemo(
    () => scalePortion(food?.nutrition, displayKcal, 0.5),
    [food?.nutrition, displayKcal],
  );
  const portionOne = useMemo(
    () => scalePortion(food?.nutrition, displayKcal, 1.0),
    [food?.nutrition, displayKcal],
  );
  const portionOneHalf = useMemo(
    () => scalePortion(food?.nutrition, displayKcal, 1.5),
    [food?.nutrition, displayKcal],
  );

  return (
    <Container>
      {/* Header */}
      <ViewComponent row alignItems="center" mt={12} mb={12}>
        <Pressable onPress={goBack} style={s.backBtn} hitSlop={10}>
          <Entypo name="chevron-left" size={22} color={C.primary} />
        </Pressable>

        <TextComponent
          text={displayTitle}
          variant="h3"
          weight="semibold"
          style={{ flex: 1, marginHorizontal: 10 }}
          numberOfLines={1}
        />

        {mealChips.length > 0 ? (
          <ViewComponent row gap={6} flex={0}>
            {mealChips.map((label, idx) => (
              <ViewComponent
                key={`${label}-${idx}`}
                px={10}
                radius={999}
                backgroundColor={C.primary}
                style={{
                  height: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                flex={0}
              >
                <TextComponent
                  text={label}
                  weight="semibold"
                  size={12}
                  color={C.onPrimary}
                />
              </ViewComponent>
            ))}
          </ViewComponent>
        ) : null}
      </ViewComponent>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* Ảnh + kcal badge */}
        <ViewComponent
          radius={22}
          border
          borderColor={C.border}
          style={s.imageWrap}
        >
          <Image source={{ uri: displayImage }} style={s.image} />
          <View style={s.imageShade} />
          <View style={s.kcalBadge}>
            <TextComponent text="🔥" color={C.onPrimary} />
            <TextComponent
              text={`${displayKcal} kcal`}
              color={C.onPrimary}
              weight="semibold"
              style={{ marginLeft: 6 }}
            />
          </View>
        </ViewComponent>

        {/* Mô tả */}
        <ViewComponent p={18} radius={18} mb={16} style={s.card}>
          <ViewComponent row alignItems="center" mb={6} gap={10} flex={0}>
            <View style={s.descBar} />
            <TextComponent text="Mô tả món ăn" variant="h3" weight="semibold" />
          </ViewComponent>
          <TextComponent
            text={displayDescription}
            variant="body"
            style={s.descText}
          />
        </ViewComponent>

        {/* Điểm nổi bật & phù hợp */}
        {(highlightChips.length > 0 || mealChips.length > 0) && (
          <ViewComponent p={14} radius={16} mb={14} style={s.card}>
            <TextComponent
              text="Điểm nổi bật & phù hợp"
              variant="h3"
              weight="semibold"
            />
            <View style={{ height: 8 }} />

            {highlightChips.length > 0 && (
              <ViewComponent row wrap gap={8} mb={8}>
                {highlightChips.map((t, i) => (
                  <ViewComponent
                    key={`hi-${i}`}
                    px={10}
                    py={6}
                    radius={999}
                    backgroundColor={C.primarySurface}
                    border
                    borderColor={C.primaryBorder}
                  >
                    <TextComponent
                      text={t}
                      size={12}
                      weight="semibold"
                      tone="primary"
                    />
                  </ViewComponent>
                ))}
              </ViewComponent>
            )}

            {mealChips.length > 0 && (
              <ViewComponent row wrap gap={8}>
                {mealChips.map((label, idx) => (
                  <ViewComponent
                    key={`slot-${idx}`}
                    px={10}
                    py={6}
                    radius={999}
                    backgroundColor={C.bg}
                    border
                    borderColor={C.border}
                  >
                    <TextComponent text={`Bữa ${label}`} size={12} />
                  </ViewComponent>
                ))}
              </ViewComponent>
            )}
          </ViewComponent>
        )}

        {/* Khẩu phần & dinh dưỡng (số liệu + 4 thẻ macro) */}
        <ViewComponent p={16} radius={18} mb={16} style={s.card}>
          <ViewComponent row alignItems="center" style={{ gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextComponent
                text={displayServingNote}
                variant="caption"
                size={15}
                numberOfLines={1}
                ellipsizeMode="tail"
              />
            </View>

            <ViewComponent
              p={8}
              radius={999}
              border
              borderColor={C.primaryBorder}
              backgroundColor={C.primarySurface}
              flex={0}
            >
              <TextComponent
                text={`${displayKcal} kcal`}
                weight="semibold"
                tone="primary"
                size={13}
              />
            </ViewComponent>
          </ViewComponent>

          <ViewComponent row wrap gap={12} mt={12}>
            {displayMacros.map(m => (
              <View
                key={m.key}
                style={{
                  width: '48%',
                }}
              >
                <MacroCard m={m} />
              </View>
            ))}
          </ViewComponent>
        </ViewComponent>

        {/* Phân bố năng lượng theo macro (thanh phần trăm) */}
        <ViewComponent p={16} radius={18} mb={16} style={s.card}>
          <TextComponent
            text="Phân bố năng lượng theo macro"
            variant="h3"
            weight="semibold"
          />
          <View style={{ height: 10 }} />

          {/* Carb */}
          <ViewComponent row between alignItems="center" mb={6}>
            <TextComponent text="Carb" variant="caption" tone="muted" />
            <TextComponent text={`${carbPct}%`} variant="caption" />
          </ViewComponent>
          <View style={s.barTrack}>
            <View
              style={[
                s.barFill,
                { width: `${carbPct}%`, backgroundColor: C.accent },
              ]}
            />
          </View>

          {/* Protein */}
          <View style={{ height: 10 }} />
          <ViewComponent row between alignItems="center" mb={6}>
            <TextComponent text="Đạm" variant="caption" tone="muted" />
            <TextComponent text={`${proteinPct}%`} variant="caption" />
          </ViewComponent>
          <View style={s.barTrack}>
            <View
              style={[
                s.barFill,
                { width: `${proteinPct}%`, backgroundColor: C.success },
              ]}
            />
          </View>

          {/* Fat */}
          <View style={{ height: 10 }} />
          <ViewComponent row between alignItems="center" mb={6}>
            <TextComponent text="Béo" variant="caption" tone="muted" />
            <TextComponent text={`${fatPct}%`} variant="caption" />
          </ViewComponent>
          <View style={s.barTrack}>
            <View
              style={[
                s.barFill,
                { width: `${fatPct}%`, backgroundColor: C.amber500 },
              ]}
            />
          </View>
        </ViewComponent>

        {/* Vi chất đáng chú ý */}
        {micro && (
          <ViewComponent p={16} radius={18} mb={16} style={s.card}>
            <TextComponent
              text="Vi chất đáng chú ý"
              variant="h3"
              weight="semibold"
            />
            <ViewComponent row gap={10} mt={10}>
              {micro.map((m, idx) => (
                <ViewComponent
                  key={idx}
                  px={14}
                  py={10}
                  radius={12}
                  border
                  borderColor={C.border}
                  backgroundColor={C.white}
                  flex={1}
                >
                  <TextComponent
                    text={m.label}
                    variant="caption"
                    tone="muted"
                  />
                  <TextComponent text={m.value} weight="semibold" />
                </ViewComponent>
              ))}
            </ViewComponent>
          </ViewComponent>
        )}

        {/* Khẩu phần nhanh */}
        {(portionHalf || portionOne || portionOneHalf) && (
          <ViewComponent p={16} radius={18} mb={16} style={s.card}>
            <TextComponent
              text="Khẩu phần nhanh"
              variant="h3"
              weight="semibold"
            />
            <TextComponent
              text="Xem nhanh năng lượng & macro nếu chọn khẩu phần 0.5× / 1.0× / 1.5×"
              variant="caption"
              tone="muted"
            />
            <View style={{ height: 10 }} />

            <ViewComponent row gap={10}>
              {portionHalf && (
                <View style={s.portionBox}>
                  <TextComponent text="0.5×" weight="bold" />
                  <TextComponent
                    text={`${portionHalf.kcal} kcal`}
                    variant="caption"
                    tone="muted"
                  />
                  <View style={{ height: 6 }} />
                  <TextComponent text={`C ${portionHalf.carbG}g`} size={12} />
                  <TextComponent
                    text={`P ${portionHalf.proteinG}g`}
                    size={12}
                  />
                  <TextComponent text={`F ${portionHalf.fatG}g`} size={12} />
                </View>
              )}
              {portionOne && (
                <View style={s.portionBox}>
                  <TextComponent text="1.0×" weight="bold" />
                  <TextComponent
                    text={`${portionOne.kcal} kcal`}
                    variant="caption"
                    tone="muted"
                  />
                  <View style={{ height: 6 }} />
                  <TextComponent text={`C ${portionOne.carbG}g`} size={12} />
                  <TextComponent text={`P ${portionOne.proteinG}g`} size={12} />
                  <TextComponent text={`F ${portionOne.fatG}g`} size={12} />
                </View>
              )}
              {portionOneHalf && (
                <View style={s.portionBox}>
                  <TextComponent text="1.5×" weight="bold" />
                  <TextComponent
                    text={`${portionOneHalf.kcal} kcal`}
                    variant="caption"
                    tone="muted"
                  />
                  <View style={{ height: 6 }} />
                  <TextComponent
                    text={`C ${portionOneHalf.carbG}g`}
                    size={12}
                  />
                  <TextComponent
                    text={`P ${portionOneHalf.proteinG}g`}
                    size={12}
                  />
                  <TextComponent text={`F ${portionOneHalf.fatG}g`} size={12} />
                </View>
              )}
            </ViewComponent>
          </ViewComponent>
        )}
      </ScrollView>
    </Container>
  );
}

const s = StyleSheet.create({
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  imageWrap: {
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  image: { width: '100%', height: 240 },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  kcalBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  card: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderColor: C.border,
  },

  /* Macro thẻ nhỏ */
  macroCard: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    borderRadius: 14,
  },

  /* Description */
  descBar: {
    width: 5,
    height: 22,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  descText: { fontSize: 14, lineHeight: 22, color: C.text },

  /* Percent bars */
  barTrack: {
    height: 10,
    backgroundColor: C.bg,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },

  /* Portion quick view */
  portionBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
  },
});

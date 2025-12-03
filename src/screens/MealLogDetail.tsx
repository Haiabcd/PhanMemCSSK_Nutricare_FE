import React, { useState, useCallback, useEffect } from 'react';
import { Image, StyleSheet, ScrollView, Pressable, View, ActivityIndicator } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import { getFoodById } from '../services/food.service';
import type { FoodResponse } from '../types/food.type';

type MacroKey = 'carb' | 'protein' | 'fat' | 'fiber';
type Macro = { key: MacroKey; label: string; value: number; unit?: string };

type Props = { onBack?: () => void };
type MealLogDetailRoute = RouteProp<PlanStackParamList, 'MealLogDetail'>;

const MEAL_SLOT_VN: Record<string, string> = {
  BREAKFAST: 'Sáng',
  LUNCH: 'Trưa',
  DINNER: 'Chiều',
  SNACK: 'Phụ',
};

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
  return React.useMemo(() => {
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

export default function MealLogDetail({ onBack }: Props) {
  const navigation = useNavigation();
  const { params } = useRoute<MealLogDetailRoute>();
  const { id, suggestionDesc, suggestionSwapText } = params;

  const [food, setFood] = useState<FoodResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFood = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const res = await getFoodById(id, signal);
        setFood(res);
      } catch (e) {
        console.log('getFoodById error:', e);
      } finally {
        setLoading(false);
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

  // ===== TẤT CẢ HOOK PHỤ THUỘC PHẢI Ở TRÊN, TRƯỚC MỌI RETURN =====

  const displayTitle = food?.name || 'Món ăn';
  const displayImage = food?.imageUrl || '';

  const displayDescription =
    food?.description == null || `${food?.description}`.trim() === ''
      ? 'Món ăn đang chờ cập nhật mô tả. Hãy thử ngay để cảm nhận hương vị!'
      : (food!.description as string);

  const unit = food?.servingName || 'khẩu phần';
  const gram = Number(food?.servingGram ?? 0);
  const displayServingNote = gram > 0 ? `1 ${unit} ~ ${gram} g` : `1 ${unit}`;

  const displayKcal =
    food?.nutrition?.kcal != null
      ? Math.round(Number(food.nutrition.kcal))
      : 0;

  const displayMacros: Macro[] = (() => {
    const n = food?.nutrition;
    if (!n) {
      return [
        { key: 'carb', label: 'Carb', value: 0, unit: 'g' },
        { key: 'protein', label: 'Đạm', value: 0, unit: 'g' },
        { key: 'fat', label: 'Béo', value: 0, unit: 'g' },
        { key: 'fiber', label: 'Xơ', value: 0, unit: 'g' },
      ];
    }
    return [
      {
        key: 'carb',
        label: 'Carb',
        value: Math.round(Number(n.carbG ?? 0)),
        unit: 'g',
      },
      {
        key: 'protein',
        label: 'Đạm',
        value: Math.round(Number(n.proteinG ?? 0)),
        unit: 'g',
      },
      {
        key: 'fat',
        label: 'Béo',
        value: Math.round(Number(n.fatG ?? 0)),
        unit: 'g',
      },
      {
        key: 'fiber',
        label: 'Xơ',
        value: Math.round(Number(n.fiberG ?? 0)),
        unit: 'g',
      },
    ];
  })();

  const mealChips: string[] =
    food?.mealSlots?.map(s => MEAL_SLOT_VN[s] ?? s) ?? [];

  const { carbPct, proteinPct, fatPct } = useMacroPercents(food?.nutrition);

  const micro =
    (() => {
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
    })() || null;

  const portionHalf = scalePortion(food?.nutrition, displayKcal, 0.5);
  const portionOne = scalePortion(food?.nutrition, displayKcal, 1.0);
  const portionOneHalf = scalePortion(food?.nutrition, displayKcal, 1.5);

  // ===== TỪ ĐÂY MỚI ĐƯỢC RETURN JSX THEO ĐIỀU KIỆN =====

  // Loading
  if (loading && !food) {
    return (
      <Container>
        <ViewComponent row alignItems="center" mt={12} mb={12}>
          <Pressable onPress={goBack} style={s.backBtn} hitSlop={10}>
            <Entypo name="chevron-left" size={22} color={C.primary} />
          </Pressable>
          <TextComponent
            text="Đang tải món ăn..."
            variant="h3"
            weight="semibold"
            style={{ flex: 1, marginHorizontal: 10 }}
            numberOfLines={1}
          />
        </ViewComponent>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
          <TextComponent
            text="Vui lòng chờ trong giây lát"
            variant="caption"
            tone="muted"
            style={{ marginTop: 8 }}
          />
        </View>
      </Container>
    );
  }

  // Không loading nhưng không có dữ liệu (lỗi / 404)
  if (!food) {
    return (
      <Container>
        <ViewComponent row alignItems="center" mt={12} mb={12}>
          <Pressable onPress={goBack} style={s.backBtn} hitSlop={10}>
            <Entypo name="chevron-left" size={22} color={C.primary} />
          </Pressable>
          <TextComponent
            text="Không tìm thấy món ăn"
            variant="h3"
            weight="semibold"
            style={{ flex: 1, marginHorizontal: 10 }}
            numberOfLines={1}
          />
        </ViewComponent>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <TextComponent
            text="Có lỗi xảy ra khi tải dữ liệu. Thử lại sau nhé."
            variant="body"
            tone="muted"
            style={{ textAlign: 'center', paddingHorizontal: 24 }}
          />
        </View>
      </Container>
    );
  }

  // ĐÃ CÓ DỮ LIỆU → UI CHÍNH
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
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={s.image} />
          ) : (
            <View
              style={[
                s.image,
                { alignItems: 'center', justifyContent: 'center' },
              ]}
            >
              <TextComponent
                text="Chưa có hình ảnh"
                variant="caption"
                tone="muted"
              />
            </View>
          )}
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

        {/* Gợi ý thay thế (chỉ hiện nếu có params từ Suggestion) */}
        {(suggestionDesc || suggestionSwapText) && (
          <ViewComponent p={16} radius={18} mb={16} style={s.card}>
            <TextComponent
              text="Gợi ý từ NutriCare"
              variant="h3"
              weight="semibold"
              style={{ marginBottom: 8 }}
            />

            {suggestionDesc && (
              <TextComponent
                text={suggestionDesc}
                variant="body"
                numberOfLines={0}
                style={{
                  lineHeight: 20,
                  textAlignVertical: 'top',
                  marginBottom: 10,
                }}
              />
            )}

            {suggestionSwapText && (
              <ViewComponent
                row
                alignItems="flex-start"
                gap={6}
                style={{
                  marginTop: 2,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: C.blueLight,
                }}
              >
                <Entypo
                  name="swap"
                  size={14}
                  color={C.primaryDark}
                  style={{ marginTop: 1 }}
                />
                <TextComponent
                  text={suggestionSwapText}
                  variant="caption"
                  tone="default"
                  numberOfLines={0}
                  style={{ flex: 1, fontWeight: '500', lineHeight: 16 }}
                />
              </ViewComponent>
            )}
          </ViewComponent>
        )}

        {/* Khẩu phần & dinh dưỡng */}
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

        {/* Phân bố năng lượng theo macro */}
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

            <ViewComponent row wrap gap={10}>
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
                  <TextComponent text={`P ${portionHalf.proteinG}g`} size={12} />
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
                  <TextComponent text={`C ${portionOneHalf.carbG}g`} size={12} />
                  <TextComponent text={`P ${portionOneHalf.proteinG}g`} size={12} />
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

  macroCard: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    borderRadius: 14,
  },

  descBar: {
    width: 5,
    height: 22,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  descText: { fontSize: 14, lineHeight: 22, color: C.text },

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

  portionBox: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
    width: '30%',
  },
});

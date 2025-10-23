import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Linking,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { PlanStackParamList } from '../navigation/PlanNavigator';

// API & types
import { getFoodById } from '../services/food.service'; // chỉnh path nếu khác
import type { FoodResponse } from '../types/food.type'; // chỉnh path nếu khác

type MealType = 'Sáng' | 'Trưa' | 'Chiều' | 'Phụ';
type Ingredient = { name: string; qty: string };
type Step = { idx: number; text: string };
type MacroKey = 'carb' | 'protein' | 'fat' | 'fiber';
type Macro = { key: MacroKey; label: string; value: number; unit?: string };

type MealDetail = {
  mealType: MealType;
  image: string;
  title: string;
  descriptionTitle: string;
  description: string;
  servingTitle: string;
  servingNote: string;
  calories: number;
  macros: Macro[];
  ingredients: Ingredient[];
  steps: Step[];
  videoTitle: string;
  videoUrl: string;
};

// Demo chỉ để giữ các phần chưa có từ API (ingredients/steps/video…)
const DEMO: MealDetail = {
  mealType: 'Trưa',
  image:
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1600&auto=format&fit=crop',
  title: 'Cơm gà áp chảo rau củ',
  descriptionTitle: 'Mô tả món ăn',
  description:
    'Ức gà áp chảo cùng rau củ (bông cải xanh, cà rốt) với ít dầu ô liu.',
  servingTitle: 'Khẩu phần & Thành phần dinh dưỡng',
  servingNote: '1 khẩu phần ~ 350 g (ước lượng)',
  calories: 520,
  macros: [
    { key: 'carb', label: 'Carb', value: 58, unit: 'g' },
    { key: 'protein', label: 'Đạm', value: 35, unit: 'g' },
    { key: 'fat', label: 'Béo', value: 14, unit: 'g' },
    { key: 'fiber', label: 'Xơ', value: 7, unit: 'g' },
  ],
  ingredients: [
    { name: 'Ức gà', qty: '150 g' },
    { name: 'Cơm trắng', qty: '180 g' },
    { name: 'Bông cải xanh', qty: '80 g' },
    { name: 'Cà rốt', qty: '50 g' },
    { name: 'Dầu ô liu', qty: '1 thìa cà phê' },
    { name: 'Muối/tiêu', qty: 'vừa ăn' },
  ],
  steps: [
    { idx: 1, text: 'Ướp ức gà với muối/tiêu 10–15 phút.' },
    { idx: 2, text: 'Áp chảo gà lửa vừa tới chín vàng hai mặt.' },
    { idx: 3, text: 'Luộc/hấp bông cải & cà rốt chín tới.' },
    { idx: 4, text: 'Xới cơm, bày gà và rau, rưới chút dầu ô liu.' },
  ],
  videoTitle: 'Video hướng dẫn nấu ăn',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

function MacroCard({ m }: { m: Macro }) {
  const tone: Record<MacroKey, string> = {
    carb: C.accent,
    protein: C.success,
    fat: C.amber500,
    fiber: C.primary,
  };
  return (
    <ViewComponent variant="card" p={12} radius={14} style={s.macroCard}>
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

export default function MealLogDetail({ onBack }: Props) {
  const navigation = useNavigation();
  const { params } = useRoute<MealLogDetailRoute>();
  const { id } = params; // id = foodId

  const [food, setFood] = useState<FoodResponse | null>(null);

  const fetchFood = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await getFoodById(id, signal);
        setFood(res);
        console.log('getFoodById success:', res);
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

  const openVideo = () => Linking.openURL(DEMO.videoUrl).catch(() => {});
  const goBack = () => (onBack ? onBack() : (navigation as any).goBack?.());

  // ========= Map dữ liệu hiển thị từ API (có thì dùng, không thì fallback DEMO) =========
  const displayTitle = food?.name ?? DEMO.title;
  const displayImage = food?.imageUrl ?? DEMO.image;

  // description: nếu null -> hiển thị 1 câu mô tả mặc định
  const displayDescription =
    food?.description == null || `${food?.description}`.trim() === ''
      ? 'Món ăn đang chờ cập nhật mô tả. Hãy thử ngay để cảm nhận hương vị!'
      : (food!.description as string);

  // Serving note
  const displayServingNote = useMemo(() => {
    if (food) {
      const unit = food.servingName || 'khẩu phần';
      const gram = Number(food.servingGram || 0);
      return gram > 0 ? `1 ${unit} ~ ${gram} g` : `1 ${unit}`;
    }
    return DEMO.servingNote;
  }, [food]);

  // Kcal & macros
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

  // Chips bữa ăn (nếu API có)
  const mealChips = useMemo(() => {
    const slots = food?.mealSlots || [];
    return slots.map(s => MEAL_SLOT_VN[s] ?? s);
  }, [food?.mealSlots]);

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
        {/* Ảnh (không còn overlay tick/plus) */}
        <ViewComponent
          radius={22}
          border
          borderColor={C.border}
          style={s.imageWrap}
        >
          <Image source={{ uri: displayImage }} style={s.image} />
          <View style={s.imageShade} />
        </ViewComponent>

        {/* Mô tả (từ API hoặc fallback mặc định) */}
        <ViewComponent variant="card" p={18} radius={18} mb={16} style={s.card}>
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

        {/* Khẩu phần & dinh dưỡng */}
        <ViewComponent variant="card" p={16} radius={18} mb={16} style={s.card}>
          <ViewComponent row between alignItems="center">
            <TextComponent
              text={displayServingNote}
              variant="caption"
              tone="default"
              size={15}
            />
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
                  borderColor: C.slate600,
                  borderWidth: 1,
                  borderRadius: 14,
                }}
              >
                <MacroCard m={m} />
              </View>
            ))}
          </ViewComponent>
        </ViewComponent>

        {/* Nguyên liệu (tạm giữ nguyên từ DEMO) */}
        <ViewComponent variant="card" p={18} radius={18} mb={16} style={s.card}>
          <TextComponent
            text="Nguyên liệu & định lượng"
            variant="h3"
            weight="semibold"
          />
          <ViewComponent mt={10} gap={10}>
            {DEMO.ingredients.map((ing, idx) => (
              <ViewComponent
                key={idx}
                row
                between
                px={14}
                py={10}
                radius={14}
                border
                borderColor={C.border}
                backgroundColor={C.bg}
              >
                <TextComponent text={ing.name} />
                <TextComponent
                  text={ing.qty}
                  weight="semibold"
                  tone="primary"
                />
              </ViewComponent>
            ))}
          </ViewComponent>
        </ViewComponent>

        {/* Các bước (tạm giữ nguyên từ DEMO) */}
        <ViewComponent variant="card" p={18} radius={18} mb={16} style={s.card}>
          <TextComponent
            text="Các bước chế biến"
            variant="h3"
            weight="semibold"
          />
          <ViewComponent mt={10} gap={10}>
            {DEMO.steps.map(step => (
              <ViewComponent
                key={step.idx}
                row
                alignItems="flex-start"
                gap={12}
              >
                <View style={s.stepBadge}>
                  <TextComponent
                    text={`${step.idx}`}
                    weight="bold"
                    color={C.onPrimary}
                  />
                </View>
                <TextComponent text={step.text} style={{ flex: 1 }} />
              </ViewComponent>
            ))}
          </ViewComponent>
        </ViewComponent>

        {/* Video (tạm giữ nguyên từ DEMO) */}
        <ViewComponent variant="card" p={18} radius={18} mb={20} style={s.card}>
          <TextComponent
            text={DEMO.videoTitle}
            variant="h3"
            weight="semibold"
          />
          <Pressable onPress={openVideo} style={s.videoThumb}>
            <Image source={{ uri: displayImage }} style={s.videoImg} />
            <View style={s.playOverlay}>
              <Entypo name="controller-play" size={40} color={C.onPrimary} />
            </View>
          </Pressable>
        </ViewComponent>
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
    marginBottom: 16,
  },
  image: { width: '100%', height: 240 },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  /* Macro */
  macroCard: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  /* Description */
  descBar: {
    width: 5,
    height: 22,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  descText: { fontSize: 14, lineHeight: 22, color: C.text },

  /* Video */
  videoThumb: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  videoImg: { width: '100%', height: 208 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  /* Steps */
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    top: 2,
  },
  card: {
    borderRadius: 14,
    borderWidth: 3,
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderColor: C.border,
  },
});

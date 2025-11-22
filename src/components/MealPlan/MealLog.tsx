import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import TextComponent from '../TextComponent';
import ViewComponent from '../ViewComponent';
import { colors as C } from '../../constants/colors';
import { MealPlanItemResponse } from '../../types/mealPlan.type';
import { smartSwapMealItem } from '../../services/planDay.service';

/* ========= types ========= */
export type Range = 'day' | 'week';

export type MealItem = {
  id: string;
  foodId: string;
  title: string;
  kcal: number;
  img: string;
  weightLine?: string;
};

export type Section = {
  id: string;
  name: string;
  icon?: 'coffee' | 'silverware-fork-knife' | 'weather-night' | 'leaf';
  items: MealItem[];
};

export interface MealLogProps {
  range?: Range;
  items?: MealPlanItemResponse[];
  activeDate?: Date;
  onPickDate?: (d: Date) => void;
  onChangeMeal?: (item: MealPlanItemResponse) => void;
  onViewDetail?: (foodId: string) => void;
  onLogEat?: (mealPlanItemId: string) => Promise<void> | void;
  onAfterSwap?: () => void;
  onboardingAt?: Date | null;
}

/* ========= helpers ========= */
const ACCENT = C.teal;
const ACCENT_SURFACE = C.tealSurface;
const ACCENT_BORDER = C.tealBorder;

const fmt2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const startOfWeekMon = (d: Date) => {
  const t = new Date(d);
  const dow = (t.getDay() + 6) % 7;
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() - dow);
  return t;
};
const getWeekDays = (anchor: Date) => {
  const mon = startOfWeekMon(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
};
const vnDowShort = (d: Date) =>
  ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
const kcalTotalOf = (sections: Section[]) =>
  sections.reduce(
    (s, sec) => s + sec.items.reduce((x, it) => x + it.kcal, 0),
    0,
  );

/* ========= meal order & labels ========= */
const MEAL_ORDER: Array<'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER'> = [
  'BREAKFAST',
  'LUNCH',
  'SNACK',
  'DINNER',
];
const MEAL_VN: Record<(typeof MEAL_ORDER)[number], string> = {
  BREAKFAST: 'Bữa sáng (6h - 8h)',
  LUNCH: 'Bữa trưa (12h - 13h)',
  SNACK: 'Đồ ăn vặt ',
  DINNER: 'Bữa chiều (17h - 19h)',
};

/* ========= id -> original map ========= */
const useIdMap = (items?: MealPlanItemResponse[]) =>
  useMemo(() => {
    const m = new Map<string, MealPlanItemResponse>();
    (items ?? []).forEach(it => m.set(it.id, it));
    return m;
  }, [items]);

/* ========= map items -> sections ========= */
function mapItemsToSectionsStable(
  items: MealPlanItemResponse[] | undefined,
  idMap: Map<string, MealPlanItemResponse>,
): Section[] {
  if (!items || items.length === 0) return [];

  const grouped = new Map<(typeof MEAL_ORDER)[number], MealItem[]>();

  for (const it of items) {
    const slotRaw = (it.mealSlot || '').toUpperCase();
    const slot = (
      MEAL_ORDER.includes(slotRaw as any) ? slotRaw : 'SNACK'
    ) as (typeof MEAL_ORDER)[number];

    const kcal = Math.round(
      it.nutrition?.kcal ?? it.food?.nutrition?.kcal ?? 0,
    );
    const title = it.food?.name ?? 'Món';
    const img = it.food?.imageUrl || '';
    const foodId = it.food?.id || '';

    const portion = (it as any).portion ?? 1;
    const serving = it.food?.servingName || 'phần ăn';
    const weightLine = `x${portion} · ${serving}`;

    const mealItem: MealItem = {
      id: it.id,
      foodId,
      title,
      kcal,
      img,
      weightLine,
    };

    if (!grouped.has(slot)) grouped.set(slot, []);
    grouped.get(slot)!.push(mealItem);
  }

  const sections: Section[] = [];
  for (const slot of MEAL_ORDER) {
    const itemsInSlot = grouped.get(slot);
    if (!itemsInSlot || itemsInSlot.length === 0) continue;

    const icon: Section['icon'] =
      slot === 'BREAKFAST'
        ? 'coffee'
        : slot === 'LUNCH'
        ? 'silverware-fork-knife'
        : slot === 'DINNER'
        ? 'weather-night'
        : 'leaf';

    sections.push({
      id: slot,
      name: MEAL_VN[slot],
      icon,
      items: itemsInSlot,
    });
  }

  return sections;
}

/* ========= subcomponents ========= */
function SectionHeader({ name, kcal }: { name: string; kcal: number }) {
  const lower = name.toLowerCase();
  const icon = lower.includes('sáng') ? (
    <MaterialCommunityIcons name="coffee" size={18} color={C.red} />
  ) : lower.includes('trưa') ? (
    <MaterialCommunityIcons
      name="silverware-fork-knife"
      size={18}
      color={C.red}
    />
  ) : lower.includes('chiều') ? (
    <MaterialCommunityIcons name="weather-night" size={18} color={C.red} />
  ) : (
    <Entypo name="leaf" size={16} color={C.red} />
  );

  return (
    <ViewComponent
      row
      alignItems="center"
      justifyContent="space-between"
      mb={8}
    >
      <ViewComponent row gap={8} alignItems="center" flex={0}>
        {icon}
        <TextComponent text={name} size={18} color={C.red} weight="bold" />
      </ViewComponent>
      <TextComponent
        text={`${kcal} cal`}
        color={ACCENT}
        size={15}
        weight="bold"
      />
    </ViewComponent>
  );
}

function MealItemCard({
  it,
  checked,
  onToggle,
  onChange,
  onDetail,
  changing,
  disabledToggle,
}: {
  it: MealItem;
  checked?: boolean;
  onToggle?: () => void;
  onChange?: () => void;
  onDetail?: () => void;
  changing?: boolean;
  disabledToggle?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const showDisabled = !!changing;

  const tickDisabled = disabledToggle || checked;

  return (
    <ViewComponent style={st.mealCard}>
      <ViewComponent style={st.mealThumbWrap}>
        {imgError ? (
          <ViewComponent center style={st.thumbFallback}>
            <MaterialCommunityIcons
              name="image-off"
              size={22}
              color={C.slate500}
            />
          </ViewComponent>
        ) : (
          <Image
            source={{ uri: it.img }}
            style={st.mealThumb}
            onError={() => setImgError(true)}
            resizeMode="cover"
          />
        )}

        {/* Tick chỉ cho phép bật */}
        <Pressable
          onPress={tickDisabled ? undefined : onToggle}
          disabled={tickDisabled}
          style={[st.tickWrap, tickDisabled && { opacity: 0.5 }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityState={{ disabled: tickDisabled }}
        >
          <ViewComponent
            style={[st.tickCircle, checked ? st.tickOn : st.tickOff]}
            center
          >
            <MaterialCommunityIcons
              name={checked ? 'check' : 'plus'}
              size={16}
              color={checked ? C.white : ACCENT}
            />
          </ViewComponent>
        </Pressable>

        <ViewComponent row alignItems="center" gap={6} style={st.kcalBadge}>
          <MaterialCommunityIcons name="fire" size={12} color={ACCENT} />
          <TextComponent
            text={`${it.kcal} cal`}
            color={ACCENT}
            size={12}
            weight="bold"
          />
        </ViewComponent>
      </ViewComponent>

      <ViewComponent p={12}>
        <TextComponent text={it.title} size={16} color={C.text} weight="bold" />
        {it.weightLine ? (
          <ViewComponent
            row
            gap={6}
            alignItems="center"
            mt={6}
            mb={12}
            flex={0}
          >
            <TextComponent text={it.weightLine} size={12} color={C.slate600} />
          </ViewComponent>
        ) : null}

        {/* ====== Actions ====== */}
        <ViewComponent row gap={10} flex={0}>
          <Pressable
            style={[st.btn, st.btnPrimary]}
            onPress={showDisabled ? undefined : onChange}
            disabled={showDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: showDisabled }}
          >
            <ViewComponent row gap={6} center flex={0}>
              <MaterialCommunityIcons
                name={changing ? 'progress-clock' : 'swap-horizontal-bold'}
                size={16}
                color={showDisabled ? C.slate500 : C.white}
              />
              <TextComponent
                text={changing ? 'Đang đổi…' : 'Đổi món'}
                color={showDisabled ? C.slate500 : C.white}
                size={12}
                weight="bold"
              />
            </ViewComponent>
          </Pressable>

          <Pressable
            style={[st.btn, st.btnGhost]}
            onPress={onDetail}
            accessibilityRole="button"
          >
            <ViewComponent row gap={6} center flex={0}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={16}
                color={ACCENT}
              />
              <TextComponent
                text="Xem chi tiết "
                color={ACCENT}
                size={12}
                weight="bold"
              />
            </ViewComponent>
          </Pressable>
        </ViewComponent>
      </ViewComponent>
    </ViewComponent>
  );
}

function WeekStrip({
  activeDate,
  onPickDate,
  disabled,
  minDate,
}: {
  activeDate: Date;
  onPickDate?: (d: Date) => void;
  disabled?: boolean;
  minDate?: Date | null;
}) {
  const days = useMemo(() => getWeekDays(activeDate), [activeDate]);
  const baseISO = activeDate.toDateString();

  const isBeforeMin = useCallback(
    (d: Date) => {
      if (!minDate) return false;
      const dd = new Date(d);
      const m = new Date(minDate);
      dd.setHours(0, 0, 0, 0);
      m.setHours(0, 0, 0, 0);
      return dd.getTime() < m.getTime();
    },
    [minDate],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12 }}
    >
      <ViewComponent
        row
        gap={32}
        flex={0}
        style={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
      >
        {days.map(d => {
          const active = d.toDateString() === baseISO;
          const locked = disabled || isBeforeMin(d);

          return (
            <Pressable
              key={d.toISOString()}
              disabled={locked}
              onPress={() => !locked && onPickDate && onPickDate(d)}
              style={[
                st.dayBox,
                active && st.dayBoxActive,
                locked && { opacity: 0.4 }, // cho nhạt đi
              ]}
            >
              <TextComponent
                text={vnDowShort(d)}
                size={12}
                align="center"
                color={active ? ACCENT : C.slate600}
              />
              <TextComponent
                text={fmt2(d.getDate())}
                size={15}
                align="center"
                weight="bold"
                color={active ? ACCENT : C.text}
              />
            </Pressable>
          );
        })}
      </ViewComponent>
    </ScrollView>
  );
}

/* ========= main ========= */
export default function MealLog({
  range = 'day',
  items,
  activeDate = new Date(),
  onPickDate,
  onViewDetail,
  onLogEat,
  onAfterSwap,
  onboardingAt,
}: MealLogProps) {
  const inFlightLogsRef = useRef<Set<string>>(new Set());
  const isFutureDay = useMemo(() => {
    const start = new Date(activeDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return start.getTime() > today.getTime();
  }, [activeDate]);
  const isBeforeOnboarding = useMemo(() => {
    if (!onboardingAt) return false;
    const d = new Date(activeDate);
    d.setHours(0, 0, 0, 0);
    const onboard = new Date(onboardingAt);
    onboard.setHours(0, 0, 0, 0);
    return d.getTime() < onboard.getTime();
  }, [activeDate, onboardingAt]);

  const isLockedDay = isFutureDay || isBeforeOnboarding;

  // 1) Lọc
  const visibleItems = useMemo(
    () => (items ?? []).filter(it => it?.used !== true && it?.swapped !== true),
    [items],
  );

  // 2) Sections
  const idMap = useIdMap(visibleItems);
  const sections = useMemo<Section[]>(
    () => mapItemsToSectionsStable(visibleItems, idMap),
    [visibleItems, idMap],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [swappingIds, setSwappingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [visibleItems]);

  useEffect(() => {
    if (!onboardingAt) return;
    const d = new Date(activeDate);
    const o = new Date(onboardingAt);
    d.setHours(0, 0, 0, 0);
    o.setHours(0, 0, 0, 0);
    if (d.getTime() < o.getTime() && onPickDate) {
      onPickDate(o);
    }
  }, [activeDate, onboardingAt, onPickDate]);

  const toggle = useCallback(
    async (id: string) => {
      if (isLockedDay) {
        console.log(
          'Không thể ghi ăn cho ngày này (tương lai hoặc trước ngày bạn bắt đầu dùng).',
        );
        return;
      }
      if (inFlightLogsRef.current.has(id)) {
        return;
      }
      if (selected.has(id)) {
        return;
      }
      inFlightLogsRef.current.add(id);
      setSelected(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      try {
        if (onLogEat) {
          await onLogEat(id);
        }
      } catch (e) {
        setSelected(prev => {
          const rollback = new Set(prev);
          rollback.delete(id);
          return rollback;
        });
        console.log('Toggle log thất bại:', e);
      } finally {
        inFlightLogsRef.current.delete(id);
      }
    },
    [selected, onLogEat, isLockedDay],
  );

  const handleChange = useCallback(
    async (orig?: MealPlanItemResponse) => {
      if (!orig) return;
      if (orig.used === true) return;
      const id = orig.id;

      setSwappingIds(prev => new Set(prev).add(id));
      try {
        await smartSwapMealItem(id);
        onAfterSwap?.();
      } catch (e) {
        console.log('Smart swap thất bại:', e);
      } finally {
        setSwappingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [onAfterSwap],
  );

  return (
    <ViewComponent>
      {range === 'week' && (
        <>
          <WeekStrip
            activeDate={activeDate}
            onPickDate={onPickDate}
            minDate={onboardingAt}
          />
          <ViewComponent style={{ height: 8 }} />
        </>
      )}

      {!sections || sections.length === 0 ? (
        <ViewComponent mt={14} p={14} variant="card" center>
          <TextComponent
            text="Chúc mừng bạn đã hoàn thành kế hoạch."
            color={C.slate600}
          />
        </ViewComponent>
      ) : (
        sections.map(sec => (
          <ViewComponent key={sec.id} mt={14}>
            <SectionHeader name={sec.name} kcal={kcalTotalOf([sec])} />
            {sec.items.map(it => {
              const original = idMap.get(it.id);
              const changing = swappingIds.has(it.id);

              return (
                <MealItemCard
                  key={it.id}
                  it={it}
                  checked={selected.has(it.id)}
                  onToggle={() => toggle(it.id)}
                  onChange={() => original && handleChange(original)}
                  onDetail={() => it.foodId && onViewDetail?.(it.foodId)}
                  changing={changing}
                  disabledToggle={isLockedDay} // ✨ khoá tick khi ngày tương lai HOẶC trước onboarding
                />
              );
            })}
          </ViewComponent>
        ))
      )}
    </ViewComponent>
  );
}

/* ========= styles ========= */
const st = StyleSheet.create({
  dayBox: {
    width: 54,
    height: 64,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    justifyContent: 'center',
  },
  dayBoxActive: {
    borderColor: ACCENT_BORDER,
    backgroundColor: ACCENT_SURFACE,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  mealCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.slate200,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
    overflow: 'hidden',
  },

  mealThumbWrap: {
    width: '100%',
    height: 260,
    position: 'relative',
    backgroundColor: C.slate100,
  },
  mealThumb: { width: '100%', height: '100%' },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.slate100,
  },

  tickWrap: { position: 'absolute', top: 10, right: 10 },
  tickCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: C.white,
  },
  tickOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  tickOff: { borderColor: ACCENT },

  kcalBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: ACCENT_SURFACE,
    borderColor: ACCENT_BORDER,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  btn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: C.green },
  btnGhost: {
    backgroundColor: ACCENT_SURFACE,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  },
});

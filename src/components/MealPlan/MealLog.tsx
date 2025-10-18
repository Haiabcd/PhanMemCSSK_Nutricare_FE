import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
  range?: Range; // 'day' | 'week'
  items?: MealPlanItemResponse[];
  activeDate?: Date;
  onPickDate?: (d: Date) => void;
  onChangeMeal?: (item: MealPlanItemResponse) => void;
  onViewDetail?: (foodId: string) => void;
  onLogEat?: (mealPlanItemId: string) => Promise<void> | void;
  onAfterSwap?: () => void;
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
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  SNACK: 'Đồ ăn vặt ',
  DINNER: 'Bữa chiều',
};

/* ========= stable comparator utils ========= */
function toNum(x: any, def = Number.MAX_SAFE_INTEGER): number {
  if (x == null) return def;
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}
function toTime(x: any, def = 9_223_372_036_854_775_807n): bigint {
  try {
    if (!x) return def;
    if (typeof x === 'number') return BigInt(Math.floor(x));
    if (typeof x === 'string') {
      const t = Date.parse(x);
      return Number.isFinite(t) ? BigInt(t) : def;
    }
    if (x instanceof Date) return BigInt(x.getTime());
    return def;
  } catch {
    return def;
  }
}

function mealItemComparator(
  a: MealItem,
  b: MealItem,
  aOrig?: MealPlanItemResponse,
  bOrig?: MealPlanItemResponse,
) {
  const ao = aOrig as any;
  const bo = bOrig as any;

  const aOrder = toNum(ao?.displayOrder ?? ao?.orderIndex ?? ao?.position);
  const bOrder = toNum(bo?.displayOrder ?? bo?.orderIndex ?? bo?.position);
  if (aOrder !== bOrder) return aOrder - bOrder;

  const aTime = toTime(ao?.createdAt ?? ao?.updatedAt);
  const bTime = toTime(bo?.createdAt ?? bo?.updatedAt);
  if (aTime !== bTime) return aTime < bTime ? -1 : 1;

  const aName = (a.title || '').toLowerCase();
  const bName = (b.title || '').toLowerCase();
  if (aName !== bName) return aName < bName ? -1 : 1;

  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

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

    itemsInSlot.sort((a, b) =>
      mealItemComparator(a, b, idMap.get(a.id), idMap.get(b.id)),
    );

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
    <MaterialCommunityIcons name="coffee" size={18} color={C.slate600} />
  ) : lower.includes('trưa') ? (
    <MaterialCommunityIcons
      name="silverware-fork-knife"
      size={18}
      color={C.slate600}
    />
  ) : lower.includes('tối') ? (
    <MaterialCommunityIcons name="weather-night" size={18} color={C.slate600} />
  ) : (
    <Entypo name="leaf" size={16} color={C.slate600} />
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
        <TextComponent text={name} size={16} color={C.text} weight="bold" />
      </ViewComponent>
      <TextComponent
        text={`${kcal} cal`}
        color={ACCENT}
        size={13}
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
  disabledToggle, // ✨ NEW
}: {
  it: MealItem;
  checked?: boolean;
  onToggle?: () => void;
  onChange?: () => void;
  onDetail?: () => void;
  changing?: boolean;
  disabledToggle?: boolean; // ✨ NEW
}) {
  const [imgError, setImgError] = useState(false);
  const showDisabled = !!changing;

  const tickDisabled = disabledToggle || checked; // ✨ không cho tick nếu future day hoặc đã tick

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
          style={[st.tickWrap, tickDisabled && { opacity: 0.5 }]} // ✨ mờ đi khi khoá
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
}: {
  activeDate: Date;
  onPickDate?: (d: Date) => void;
  disabled?: boolean;
}) {
  const days = useMemo(() => getWeekDays(activeDate), [activeDate]);
  const baseISO = activeDate.toDateString();

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
          return (
            <Pressable
              key={d.toISOString()}
              disabled={disabled}
              onPress={() => onPickDate && onPickDate(d)}
              style={[
                st.dayBox,
                active && st.dayBoxActive,
                disabled && { opacity: 0.6 },
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
}: MealLogProps) {
  // ✨ Chặn tick với ngày tương lai
  const isFutureDay = useMemo(() => {
    const start = new Date(activeDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return start.getTime() > today.getTime(); // lớn hơn hôm nay -> tương lai
  }, [activeDate]);

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

  // Tick: chỉ bật; thêm chặn khi là ngày tương lai
  const toggle = useCallback(
    async (id: string) => {
      if (isFutureDay) {
        // Có thể thay bằng Toast ở ngoài nếu muốn
        console.log('Không thể ghi ăn cho ngày tương lai.');
        return;
      }
      if (selected.has(id)) return;

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
      }
    },
    [selected, onLogEat, isFutureDay],
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
          <WeekStrip activeDate={activeDate} onPickDate={onPickDate} />
          <ViewComponent style={{ height: 8 }} />
        </>
      )}

      {!sections || sections.length === 0 ? (
        <ViewComponent mt={14} p={14} variant="card" center>
          <TextComponent
            text="Ngày này vẫn chưa được lập kế hoạch."
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
                  disabledToggle={isFutureDay} // ✨ khoá tick khi ngày tương lai
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

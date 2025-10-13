import React, { useMemo, useState, useCallback } from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import TextComponent from '../TextComponent';
import ViewComponent from '../ViewComponent';
import { colors as C } from '../../constants/colors';
import { MealPlanItemResponse } from '../../types/mealPlan.type';

/* ========= types ========= */
export type Range = 'day' | 'week';

export type MealItem = {
  id: string;
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
  onViewDetail?: (item: MealPlanItemResponse) => void;
  onLogEat?: (mealPlanItemId: string) => Promise<void> | void;
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

/* ========= map items thật -> sections theo mealSlot ========= */
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
  DINNER: 'Bữa tối',
};

function mapItemsToSections(
  items: MealPlanItemResponse[] | undefined,
): Section[] {
  if (!items || items.length === 0) return [];

  // group theo mealSlot
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
    const portion = (it as any).portion ?? 1;
    const serving = it.food?.servingName || 'phần ăn';
    const weightLine = `x${portion} · ${serving}`;

    const mealItem: MealItem = { id: it.id, title, kcal, img, weightLine };

    if (!grouped.has(slot)) grouped.set(slot, []);
    grouped.get(slot)!.push(mealItem);
  }

  // tạo sections theo thứ tự chuẩn
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
  // ⬇️ 2 action mới
  onChange,
  onDetail,
}: {
  it: MealItem;
  checked?: boolean;
  onToggle?: () => void;
  onChange?: () => void;
  onDetail?: () => void;
}) {
  const [imgError, setImgError] = useState(false);

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

        <Pressable
          onPress={onToggle}
          style={st.tickWrap}
          hitSlop={6}
          accessibilityRole="button"
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

        {/* ====== Actions: Đổi món / Xem chi tiết ====== */}
        <ViewComponent row gap={10} flex={0}>
          <Pressable
            style={[st.btn, st.btnPrimary]}
            onPress={onChange}
            accessibilityRole="button"
          >
            <ViewComponent row gap={6} center flex={0}>
              <MaterialCommunityIcons
                name="swap-horizontal-bold"
                size={16}
                color={C.white}
              />
              <TextComponent
                text="Đổi món"
                color={C.white}
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
  onChangeMeal,
  onViewDetail,
  onLogEat,
}: MealLogProps) {
  const sections = useMemo<Section[]>(() => mapItemsToSections(items), [items]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // toggle + gọi onLogEat khi chuyển từ chưa chọn -> đã chọn
  const toggle = useCallback(
    async (id: string) => {
      let nextChecked = false;
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          nextChecked = false;
        } else {
          next.add(id);
          nextChecked = true;
        }
        return next;
      });

      // Nếu vừa tick ON thì gọi API log ăn
      if (nextChecked && onLogEat) {
        try {
          await onLogEat(id);
        } catch (e) {
          // nếu lỗi -> rollback tick
          setSelected(prev => {
            const rollback = new Set(prev);
            rollback.delete(id);
            return rollback;
          });
          console.log('Log ăn thất bại:', e);
        }
      }
    },
    [onLogEat],
  );

  return (
    <ViewComponent>
      {range === 'week' && (
        <>
          <WeekStrip activeDate={activeDate} onPickDate={onPickDate} />
          <ViewComponent style={{ height: 8 }} />
        </>
      )}

      {/* range === 'day' */}
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
              // lấy item gốc để truyền ra callback
              const original = items?.find(x => x.id === it.id);
              return (
                <MealItemCard
                  key={it.id}
                  it={it}
                  checked={selected.has(it.id)}
                  onToggle={() => toggle(it.id)}
                  onChange={() => original && onChangeMeal?.(original)}
                  onDetail={() => original && onViewDetail?.(original)}
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
    height: 400,
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
  // Tick dùng teal để dịu mắt
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

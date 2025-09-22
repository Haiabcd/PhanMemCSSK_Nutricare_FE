import React, { useMemo, useState, useCallback } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import RowComponent from '../RowComponent';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';

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

export type PlanDay = { dateISO: string; sections: Section[] };

export interface MealLogProps {
  range: Range;
  date: Date;
  onChangeDate: (d: Date) => void;
  getPlanForDate?: (d: Date) => PlanDay;
  onDetail: () => void;
}

/* ========= helpers ========= */
const ACCENT = (C as any).teal || '#14b8a6';
const ACCENT_SURFACE = (C as any).tealSurface || '#ccfbf1';
const ACCENT_BORDER = (C as any).tealBorder || '#5eead4';

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
const withParams = (u: string, params: string) =>
  u + (u.includes('?') ? '&' : '?') + params;

/* ========= demo data ========= */
const demoPlanFor = (date: Date): PlanDay => {
  const seed = date.getDate();
  const img = (u: string) => withParams(u, 'auto=format&fit=crop&w=1200&q=80');
  const mul = (v: number) => Math.round(v * (1 + ((seed % 5) - 2) / 20));
  return {
    dateISO: `${date.getFullYear()}-${fmt2(date.getMonth() + 1)}-${fmt2(
      date.getDate(),
    )}`,
    sections: [
      {
        id: 's1',
        name: 'Bữa sáng',
        icon: 'coffee',
        items: [
          {
            id: 'm1',
            title: 'Smoothie xanh dứa',
            kcal: mul(281),
            img: img(
              'https://images.unsplash.com/photo-1556742400-b5b7c5121f90',
            ),
            weightLine: '415.5g (x1 · Phần ăn)',
          },
        ],
      },
      {
        id: 's2',
        name: 'Bữa trưa',
        icon: 'silverware-fork-knife',
        items: [
          {
            id: 'm2',
            title: 'Đậu trắng & salad rau',
            kcal: mul(291),
            img: img(
              'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
            ),
            weightLine: '319.7g (x0.75 · Phần ăn)',
          },
        ],
      },
      {
        id: 's3',
        name: 'Đồ ăn vặt',
        icon: 'leaf',
        items: [
          {
            id: 'm3',
            title: 'Quả táo',
            kcal: mul(95),
            img: img(
              'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce',
            ),
            weightLine: '182g (x1 · Trung bình)',
          },
        ],
      },
      {
        id: 's4',
        name: 'Bữa tối',
        icon: 'weather-night',
        items: [
          {
            id: 'm4',
            title: 'Cá hồi & măng tây nướng',
            kcal: mul(369),
            img: img(
              'https://images.unsplash.com/photo-1544025162-d76694265947',
            ),
            weightLine: '246.9g (x1 · Phần ăn)',
          },
          {
            id: 'm5',
            title: 'Quinoa cơ bản',
            kcal: mul(58),
            img: img(
              'https://images.unsplash.com/photo-1547592180-85f173990554',
            ),
            weightLine: '54.7g (x0.5)',
          },
        ],
      },
    ],
  };
};

/* ========= subcomponents ========= */
function SectionHeader({ name, kcal }: { name: string; kcal: number }) {
  const lower = name.toLowerCase();
  return (
    <RowComponent alignItems="center" mb={8}>
      <RowComponent gap={8} alignItems="center" flex={0}>
        {lower.includes('sáng') ? (
          <MaterialCommunityIcons name="coffee" size={18} color={C.slate600} />
        ) : lower.includes('trưa') ? (
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={18}
            color={C.slate600}
          />
        ) : lower.includes('tối') ? (
          <MaterialCommunityIcons
            name="weather-night"
            size={18}
            color={C.slate600}
          />
        ) : (
          <Entypo name="leaf" size={16} color={C.slate600} />
        )}
        <TextComponent text={name} size={16} color={C.text} weight="bold" />
      </RowComponent>
      {/* kcal chuyển sang teal để giảm “full green” */}
      <TextComponent
        text={`${kcal} cal`}
        color={ACCENT}
        size={13}
        weight="bold"
      />
    </RowComponent>
  );
}

function MealItemCard({
  it,
  checked,
  onToggle,
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
    <View style={st.mealCard}>
      {/* Ảnh dài phía trên */}
      <View style={st.mealThumbWrap}>
        {imgError ? (
          <View style={st.thumbFallback}>
            <MaterialCommunityIcons
              name="image-off"
              size={22}
              color={C.slate500}
            />
          </View>
        ) : (
          <Image
            source={{ uri: it.img }}
            style={st.mealThumb}
            onError={() => setImgError(true)}
            resizeMode="cover"
          />
        )}

        {/* Tick chọn: dùng teal làm màu chính để bớt “full green” */}
        <Pressable onPress={onToggle} style={st.tickWrap}>
          <View style={[st.tickCircle, checked ? st.tickOn : st.tickOff]}>
            <MaterialCommunityIcons
              name={checked ? 'check' : 'plus'}
              size={16}
              color={checked ? C.white : ACCENT}
            />
          </View>
        </Pressable>

        {/* Kcal badge: nền tealSurface + border teal */}
        <View style={st.kcalBadge}>
          <MaterialCommunityIcons name="fire" size={12} color={ACCENT} />
          <TextComponent
            text={`${it.kcal} cal`}
            color={ACCENT}
            size={12}
            weight="bold"
          />
        </View>
      </View>

      {/* Thông tin phía dưới ảnh */}
      <View style={st.cardBody}>
        <TextComponent text={it.title} size={16} color={C.text} weight="bold" />
        {it.weightLine ? (
          <RowComponent gap={6} alignItems="center" mt={6} mb={12} flex={0}>
            <TextComponent text={it.weightLine} size={12} color={C.slate600} />
          </RowComponent>
        ) : null}

        {/* Actions: primary = green, secondary = teal */}
        <RowComponent gap={10} flex={0}>
          <Pressable style={[st.btn, st.btnPrimary]} onPress={onChange}>
            <RowComponent
              gap={6}
              justifyContent="center"
              alignItems="center"
              flex={0}
            >
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
            </RowComponent>
          </Pressable>
          <Pressable style={[st.btn, st.btnGhost]} onPress={onDetail}>
            <RowComponent
              gap={6}
              justifyContent="center"
              alignItems="center"
              flex={0}
            >
              <MaterialCommunityIcons
                name="eye-outline"
                size={16}
                color={ACCENT}
              />
              <TextComponent
                text="Xem chi tiết"
                color={ACCENT}
                size={12}
                weight="bold"
              />
            </RowComponent>
          </Pressable>
        </RowComponent>
      </View>
    </View>
  );
}

function WeekStrip({
  baseDate,
  onPick,
}: {
  baseDate: Date;
  onPick: (d: Date) => void;
}) {
  const days = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const baseISO = baseDate.toDateString();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12 }}
    >
      <RowComponent gap={10} flex={0}>
        {days.map(d => {
          const active = d.toDateString() === baseISO;
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => onPick(d)}
              style={[st.dayBox, active && st.dayBoxActive]}
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
      </RowComponent>
    </ScrollView>
  );
}

/* ========= main ========= */
export default function MealLog({
  range,
  date,
  onChangeDate,
  getPlanForDate = demoPlanFor,
  onDetail
}: MealLogProps) {
  const plan = useMemo(() => getPlanForDate(date), [date, getPlanForDate]);
  const sections = plan.sections;

  // tick chọn món
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <View>
      {range === 'week' && (
        <>
          <TextComponent
            text="Tuần này"
            size={14}
            color={C.slate600}
            style={{ marginLeft: 12, marginBottom: 8 }}
          />
          <WeekStrip baseDate={date} onPick={d => onChangeDate(d)} />
          <View style={{ height: 8 }} />
        </>
      )}

      {sections.map(sec => (
        <View key={sec.id} style={{ marginTop: 14 }}>
          <SectionHeader name={sec.name} kcal={kcalTotalOf([sec])} />
          {sec.items.map(it => (
            <MealItemCard
              key={it.id}
              it={it}
              checked={selected.has(it.id)}
              onToggle={() => toggle(it.id)}
              onChange={() => { }}
              onDetail={onDetail}
            />
          ))}
        </View>
      ))}
    </View>
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
    height: 170,
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
  // ✅ Tick dùng teal để giảm cảm giác "full green"
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

  cardBody: { padding: 12 },

  btn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Primary vẫn green để thể hiện hành động chính
  btnPrimary: { backgroundColor: C.green },
  // Secondary chuyển sang hệ teal
  btnGhost: {
    backgroundColor: ACCENT_SURFACE,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  },
});

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import TextComponent from '../TextComponent';
import ViewComponent from '../ViewComponent';
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
              'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
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

/* ========= POOL gợi ý ========= */
const IMG = (u: string) => withParams(u, 'auto=format&fit=crop&w=1200&q=80');

const ALT_POOL: Record<'sáng' | 'trưa' | 'vặt' | 'tối', MealItem[]> = {
  sáng: [
    {
      id: 'b1',
      title: 'Yến mạch chuối',
      kcal: 320,
      img: IMG('https://images.unsplash.com/photo-1517677208171-0bc6725a3e60'),
    },
    {
      id: 'b2',
      title: 'Bánh mì trứng ốp',
      kcal: 350,
      img: IMG('https://images.unsplash.com/photo-1551183053-bf91a1d81141'),
    },
    {
      id: 'b3',
      title: 'Sữa chua granola',
      kcal: 290,
      img: IMG('https://images.unsplash.com/photo-1512058564366-18510be2db19'),
    },
  ],
  trưa: [
    {
      id: 'l1',
      title: 'Cơm gà áp chảo',
      kcal: 520,
      img: IMG('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe'),
    },
    {
      id: 'l2',
      title: 'Bún thịt nạc rau',
      kcal: 480,
      img: IMG('https://images.unsplash.com/photo-1526318472351-c75fcf070305'),
    },
    {
      id: 'l3',
      title: 'Pasta sốt cà chua',
      kcal: 510,
      img: IMG('https://images.unsplash.com/photo-1521389508051-d7ffb5dc8bbf'),
    },
  ],
  vặt: [
    {
      id: 's1',
      title: 'Sữa chua uống',
      kcal: 120,
      img: IMG('https://images.unsplash.com/photo-1563630423918-6f955d9bf0da'),
    },
    {
      id: 's2',
      title: 'Hạnh nhân rang',
      kcal: 160,
      img: IMG('https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2'),
    },
    {
      id: 's3',
      title: 'Chuối chín',
      kcal: 100,
      img: IMG('https://images.unsplash.com/photo-1571772805064-207c8435df79'),
    },
  ],
  tối: [
    {
      id: 'd1',
      title: 'Ức gà nướng rau',
      kcal: 430,
      img: IMG('https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),
    },
    {
      id: 'd2',
      title: 'Mì soba bò áp chảo',
      kcal: 520,
      img: IMG('https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
    },
    {
      id: 'd3',
      title: 'Đậu hũ sốt nấm',
      kcal: 410,
      img: IMG('https://images.unsplash.com/photo-1526318472351-c75fcf070305'),
    },
  ],
};

function normalizeSectionName(
  name: string,
): 'sáng' | 'trưa' | 'vặt' | 'tối' | undefined {
  const lower = name.toLowerCase();
  if (lower.includes('sáng')) return 'sáng';
  if (lower.includes('trưa')) return 'trưa';
  if (lower.includes('tối')) return 'tối';
  if (
    lower.includes('vặt') ||
    lower.includes('snack') ||
    lower.includes('ăn vặt')
  )
    return 'vặt';
  return undefined;
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
      {/* Ảnh dài phía trên */}
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

        {/* Tick chọn */}
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

        {/* Kcal badge */}
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

      {/* Thông tin phía dưới ảnh */}
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

        {/* Actions */}
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
      </ViewComponent>
    </ScrollView>
  );
}

/* ========= main ========= */
export default function MealLog({
  range,
  date,
  onChangeDate,
  getPlanForDate = demoPlanFor,
  onDetail,
}: MealLogProps) {
  const plan = useMemo(() => getPlanForDate(date), [date, getPlanForDate]);

  // Local state để có thể thay món tại chỗ
  const [sectionsState, setSectionsState] = useState<Section[]>(plan.sections);

  // Nếu đổi ngày => reset lại món theo plan mới
  useEffect(() => {
    setSectionsState(plan.sections);
  }, [plan]);

  // tick chọn món
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Chọn pool theo tên section
  const poolFor = (sectionName: string): MealItem[] | undefined => {
    const key = normalizeSectionName(sectionName);
    return key ? ALT_POOL[key] : undefined;
  };

  // Đổi món tại vị trí (sectionIdx, itemIdx)
  const swapItem = (sectionIdx: number, itemIdx: number) => {
    setSectionsState(prev => {
      const next = prev.map(s => ({ ...s, items: [...s.items] }));
      const sec = next[sectionIdx];
      if (!sec) return prev;

      const pool = poolFor(sec.name);
      if (!pool || pool.length === 0) return prev;

      const cur = sec.items[itemIdx];
      let pick = pool[0];
      if (pool.length > 1) {
        const idx = pool.findIndex(p => p.id === cur?.id);
        pick = pool[(idx >= 0 ? idx + 1 : 0) % pool.length];
      }

      sec.items[itemIdx] = { ...pick, weightLine: cur?.weightLine };
      return next;
    });
  };

  return (
    <ViewComponent>
      {range === 'week' && (
        <>
          <TextComponent
            text="Tuần này"
            size={14}
            color={C.slate600}
            style={{ marginLeft: 12, marginBottom: 8 }}
          />
          <WeekStrip baseDate={date} onPick={d => onChangeDate(d)} />
          <ViewComponent style={{ height: 8 }} />
        </>
      )}

      {sectionsState.map((sec, si) => (
        <ViewComponent key={sec.id} mt={14}>
          <SectionHeader name={sec.name} kcal={kcalTotalOf([sec])} />
          {sec.items.map((it, ii) => (
            <MealItemCard
              key={`${it.id}-${ii}`}
              it={it}
              checked={selected.has(it.id)}
              onToggle={() => toggle(it.id)}
              onChange={() => swapItem(si, ii)}
              onDetail={onDetail}
            />
          ))}
        </ViewComponent>
      ))}
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
  // ✅ Tick dùng teal để dịu mắt
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

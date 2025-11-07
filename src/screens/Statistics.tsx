import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Pressable,
  Dimensions,
  View,
  StyleSheet,
  ScaledSize,
  ActivityIndicator,
} from 'react-native';
import { BarChart, LineChart, StackedBarChart } from 'react-native-chart-kit';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { getWeeklyStats, getMonthlyStats } from '../services/statistic.service';
import type {
  StatisticWeekResponse,
  StatisticMonthResponse,
  MonthlyWeeklyNutritionDto,
  MealSlotSummary,
} from '../types/statistic.type';

/** ===== Types ===== */
type Range = 'week' | 'month';
type MealProgressItem = {
  label: string;
  logged: number;
  missed: number;
  total: number;
  pct: number;
};

/** ===== Constants ===== */
const PAD = 16;
// Giảm padding card trên màn nhỏ để tiết kiệm không gian
const CARD_PAD = Dimensions.get('window').width < 370 ? 14 : 20;

/** Measure width for charts */
function ChartSizer({
  children,
}: {
  children: (w: number) => React.ReactElement;
}) {
  const [w, setW] = useState<number>(0);
  return (
    <View
      style={{ width: '100%' }}
      onLayout={e => {
        const width = Math.floor(e.nativeEvent.layout.width);
        if (width !== w) setW(width);
      }}
    >
      {w > 0 ? children(w) : null}
    </View>
  );
}

/** Legend hiển thị bên ngoài chart (để tránh chồng chữ trên màn nhỏ) */
function LegendRow({
  items,
  small,
}: {
  items: { color: string; label: string }[];
  small?: boolean;
}) {
  return (
    <ViewComponent row wrap gap={10} mt={6} style={{ rowGap: 6 }}>
      {items.map(it => (
        <ViewComponent
          key={it.label}
          row
          alignItems="center"
          gap={6}
          style={{ marginRight: 8 }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: it.color,
            }}
          />
          <TextComponent text={it.label} size={small ? 11 : 12} />
        </ViewComponent>
      ))}
    </ViewComponent>
  );
}

/** ===== Helpers chuyển đổi dữ liệu API → chart ===== */
const dayVN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const labelDay = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return dayVN[d.getDay()];
};

const safeNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const nz = (v: number) => (v === 0 ? 0 : v);

/** Cắt các mảng về cùng độ dài tối thiểu, đảm bảo là số hữu hạn */
const alignSeries = (labels: string[], ...series: number[][]) => {
  const finiteSeries = series.map(arr =>
    arr.map(v => (Number.isFinite(v) ? v : 0)),
  );
  const minLen = Math.min(labels.length, ...finiteSeries.map(a => a.length));
  return {
    labels: labels.slice(0, minLen),
    series: finiteSeries.map(a => a.slice(0, minLen)),
  };
};

/** Với tháng: chuyển weeklyNutrition → series cho LineChart */
const toWeeklySeries = (weeks: MonthlyWeeklyNutritionDto[] | undefined) => {
  const labels = (weeks || []).map(w => `Tuần ${w.weekIndex}`);
  const protein = (weeks || []).map(w => safeNum(w.proteinG));
  const carb = (weeks || []).map(w => safeNum(w.carbG));
  const fat = (weeks || []).map(w => safeNum(w.fatG));
  const fiber = (weeks || []).map(w => safeNum(w.fiberG));

  const { labels: L, series } = alignSeries(labels, protein, carb, fat, fiber);
  const [p, c, f, fi] = series;
  return { labels: L, protein: p, carb: c, fat: f, fiber: fi };
};

export default function Statistics() {
  const navigation = useNavigation();
  const [range, setRange] = useState<Range>('week');

  // màn nhỏ?
  const isSmall = Dimensions.get('window').width < 370;

  // fetch states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekData, setWeekData] = useState<StatisticWeekResponse | null>(null);
  const [monthData, setMonthData] = useState<StatisticMonthResponse | null>(
    null,
  );

  // responsive
  const [, setScreenW] = useState<number>(Dimensions.get('window').width);
  useEffect(() => {
    const handler = ({ window }: { window: ScaledSize }) =>
      setScreenW(window.width);
    const subscription = Dimensions.addEventListener('change', handler as any);
    return () => {
      subscription?.remove?.();
    };
  }, []);

  /** Gọi API theo chế độ */
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        if (range === 'week') {
          const res = await getWeeklyStats(ac.signal);
          setWeekData(res.data || null);
        } else {
          const res = await getMonthlyStats(ac.signal);
          setMonthData(res.data || null);
        }
      } catch (e: any) {
        setError(e?.message || 'Có lỗi xảy ra khi tải thống kê.');
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [range]);

  /** CONFIG CHUNG CHO CHARTS */
  const baseConfig = useMemo(() => {
    return {
      backgroundGradientFrom: C.white,
      backgroundGradientTo: C.white,
      decimalPlaces: 0 as 0 | 1 | 2 | 3,
      color: () => C.primary,
      labelColor: () => C.text,
      barPercentage: 0.6,
      // giảm font label ở màn nhỏ
      propsForLabels: { fontSize: isSmall ? 10 : 12 },
      propsForBackgroundLines: { stroke: C.border },
      style: { borderRadius: 12 },
    };
  }, [isSmall]);
  const infoConfig = useMemo(
    () => ({ ...baseConfig, color: () => C.info }),
    [baseConfig],
  );

  /** Build DS (từ API) cho UI */
  const ds = useMemo(() => {
    if (range === 'week') {
      const d = weekData;

      // Labels theo ngày + dữ liệu từng chất (đơn vị gram)
      const labels0 = (d?.dailyNutrition || []).map(x => labelDay(x.date));
      const protein0 = (d?.dailyNutrition || []).map(x => safeNum(x.proteinG));
      const carb0 = (d?.dailyNutrition || []).map(x => safeNum(x.carbG));
      const fat0 = (d?.dailyNutrition || []).map(x => safeNum(x.fatG));
      const fiber0 = (d?.dailyNutrition || []).map(x => safeNum(x.fiberG));

      const { labels, series } = alignSeries(
        labels0,
        protein0,
        carb0,
        fat0,
        fiber0,
      );
      const [protein, carb, fat, fiber] = series;

      // Nước theo ngày
      const waterLabels = (d?.dailyWaterTotals || []).map(x =>
        labelDay(x.date),
      );
      const waterData = (d?.dailyWaterTotals || []).map(x =>
        safeNum(x.totalMl),
      );
      const waterAligned = alignSeries(waterLabels, waterData);
      const wLabels = waterAligned.labels;
      const wData = waterAligned.series[0];

      // Meal slot summary → tiến độ logged/missed
      const slot = d?.mealSlotSummary as MealSlotSummary | undefined;
      const mealSlots = [
        { key: 'BREAKFAST', label: 'Sáng' },
        { key: 'LUNCH', label: 'Trưa' },
        { key: 'DINNER', label: 'Tối' },
        { key: 'SNACK', label: 'Snack' },
      ] as const;

      const mealProgress: MealProgressItem[] = mealSlots.map(s => {
        const it = slot?.[s.key as keyof typeof slot];
        const logged = it?.loggedDays ?? 0;
        const total = it?.totalDays ?? 0;
        const missed = Math.max(it?.missedDays ?? 0, total - logged);
        const pct = total > 0 ? Math.round((logged / total) * 100) : 0;
        return { label: s.label, logged, missed, total, pct };
      });

      return {
        scopeTitle: 'Theo tuần',
        weight: d ? `${d.weightKg} kg` : '-',
        bmi: d ? `${Math.round((d.bmi + Number.EPSILON) * 10) / 10}` : '-',
        bmiClassification: d?.bmiClassification ?? '-',
        topFoods: d?.topFoods || [],
        warnings: d?.warnings || [],

        // Macros (LineChart)
        macrosLabels: labels,
        macrosSeries: { protein, carb, fat, fiber },

        // Water (BarChart)
        waterLabels: wLabels,
        waterData: wData,

        // Meal progress (StackedBarChart)
        mealProgress,

        titles: {
          macros: 'Dinh dưỡng theo ngày (g)',
          water: 'Nước theo ngày (ml)',
          meal: 'Bữa ăn theo kỳ',
        },
      };
    }

    // Month:
    const m = monthData;
    const { labels, protein, carb, fat, fiber } = toWeeklySeries(
      m?.weeklyNutrition,
    );

    // Meal slot summary → logged/missed (trong tháng)
    const slot = m?.mealSlotSummary as MealSlotSummary | undefined;
    const mealSlots = [
      { key: 'BREAKFAST', label: 'Sáng' },
      { key: 'LUNCH', label: 'Trưa' },
      { key: 'DINNER', label: 'Tối' },
      { key: 'SNACK', label: 'Snack' },
    ] as const;

    const mealProgress: MealProgressItem[] = mealSlots.map(s => {
      const it = slot?.[s.key as keyof typeof slot];
      const logged = it?.loggedDays ?? 0;
      const total = it?.totalDays ?? 0;
      const missed = Math.max(it?.missedDays ?? 0, total - logged);
      const pct = total > 0 ? Math.round((logged / total) * 100) : 0;
      return { label: s.label, logged, missed, total, pct };
    });

    // Nước theo tuần (tháng)
    const waterLabels0 = (m?.weeklyWaterTotals || []).map(
      w => `Tuần ${w.weekIndex}`,
    );
    const waterData0 = (m?.weeklyWaterTotals || []).map(w =>
      safeNum(w.totalMl),
    );
    const waterAligned = alignSeries(waterLabels0, waterData0);
    const wLabels = waterAligned.labels;
    const wData = waterAligned.series[0];

    return {
      scopeTitle: 'Theo tháng',
      weight: m ? `${m.weightKg} kg` : '-',
      bmi: m ? `${Math.round((m.bmi + Number.EPSILON) * 10) / 10}` : '-',
      bmiClassification: m?.bmiClassification ?? '-',
      topFoods: m?.topFoods || [],
      warnings: m?.warnings || [],

      // Macros (LineChart) theo tuần trong tháng
      macrosLabels: labels,
      macrosSeries: { protein, carb, fat, fiber },

      // Water (BarChart)
      waterLabels: wLabels,
      waterData: wData,

      // Meal progress (StackedBarChart)
      mealProgress,

      titles: {
        macros: 'Dinh dưỡng theo tuần (g)',
        water: 'Nước theo tuần (ml)',
        meal: 'Bữa ăn trong tháng',
      },
    };
  }, [range, weekData, monthData]);

  const top5Foods = ds.topFoods?.slice(0, 5) || [];

  /** ======= Guards cho biểu đồ ======= */
  const hasEnoughMacroPoints = ds.macrosLabels.length >= 2;
  const hasWaterData =
    ds.waterLabels.length > 0 && ds.waterLabels.length === ds.waterData.length;

  return (
    <Container>
      <ViewComponent style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if ((navigation as any)?.canGoBack?.())
                (navigation as any).goBack();
            }}
            style={({ pressed }) => [
              styles.headerBackBtn,
              pressed && { opacity: 0.85 },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Entypo name="chevron-left" size={26} color={C.primary} />
          </Pressable>

          <TextComponent text="Thống kê" variant="h3" weight="bold" />
        </View>

        <View style={styles.line} />

        {/* Range tabs */}
        <ViewComponent center mb={8}>
          <ViewComponent
            row
            gap={8}
            p={6}
            radius={999}
            border
            borderColor={C.primaryBorder}
            backgroundColor={C.primarySurface}
            flex={0}
            style={styles.rangeTabs}
          >
            {(['week', 'month'] as Range[]).map(opt => {
              const active = range === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setRange(opt)}
                  android_ripple={{
                    color: 'rgba(0,0,0,0.06)',
                    borderless: false,
                    radius: 999,
                  }}
                  style={({ pressed }) => [
                    styles.filterItemBase,
                    active
                      ? styles.filterItemActive
                      : styles.filterItemInactive,
                    pressed && { opacity: 0.95 },
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <TextComponent
                    text={opt === 'week' ? 'Theo tuần' : 'Theo tháng'}
                    weight="bold"
                    size={12}
                    color={active ? C.onPrimary : C.text}
                  />
                </Pressable>
              );
            })}
          </ViewComponent>
        </ViewComponent>

        {/* Loading / Error */}
        {loading && (
          <ViewComponent center mt={20}>
            <ActivityIndicator color={C.primary} />
            <TextComponent text="Đang tải dữ liệu..." tone="muted" />
          </ViewComponent>
        )}
        {!!error && !loading && (
          <ViewComponent center mt={20}>
            <TextComponent text={error} tone="danger" />
          </ViewComponent>
        )}

        {/* CONTENT */}
        {!loading && !error && (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 36 }}
          >
            {/* Health overview */}
            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
              <TextComponent
                text={`Chỉ số sức khỏe • ${ds.scopeTitle}`}
                variant="h3"
                weight="bold"
                tone="primary"
              />
              <ViewComponent row between mt={12} gap={8}>
                {[
                  { label: 'Cân nặng', value: ds.weight || '-' },
                  { label: 'BMI', value: ds.bmi || '-' },
                  {
                    label: 'Phân loại BMI',
                    value: String(ds.bmiClassification || '-'),
                  },
                ].map(item => (
                  <ViewComponent
                    key={item.label}
                    flex={1}
                    p={14}
                    radius={14}
                    border
                    borderColor={C.border}
                    backgroundColor={C.bg}
                    alignItems="center"
                  >
                    <TextComponent text={item.label} tone="muted" />
                    <TextComponent text={item.value} weight="bold" />
                  </ViewComponent>
                ))}
              </ViewComponent>
            </ViewComponent>

            {/* Top 5 foods */}
            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
              <TextComponent
                text="Top 5 món ăn"
                variant="h3"
                weight="bold"
                tone="primary"
              />
              <ViewComponent mt={10} gap={8}>
                {top5Foods.map(it => (
                  <ViewComponent
                    key={it.name}
                    row
                    between
                    alignItems="center"
                    p={12}
                    radius={12}
                    border
                    borderColor={C.border}
                    backgroundColor={C.bg}
                  >
                    <TextComponent text={`• ${it.name}`} />
                    <TextComponent text={`x${it.count}`} weight="bold" />
                  </ViewComponent>
                ))}
                {top5Foods.length === 0 && (
                  <TextComponent text="Chưa có dữ liệu." tone="muted" />
                )}
              </ViewComponent>
            </ViewComponent>

            {/* Macros (LineChart - rõ ràng theo từng chất) */}
            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
              <TextComponent
                text={ds.titles.macros}
                variant="h3"
                weight="bold"
                tone="primary"
              />

              {/* Legend ngoài để tránh chồng chữ */}
              <LegendRow
                small={isSmall}
                items={[
                  { color: C.success, label: 'Protein (g)' },
                  { color: C.info, label: 'Carb (g)' },
                  { color: C.warning, label: 'Fat (g)' },
                  { color: '#9CA3AF', label: 'Fiber (g)' },
                ]}
              />

              {hasEnoughMacroPoints ? (
                <ChartSizer>
                  {w => (
                    <LineChart
                      width={w}
                      height={260}
                      data={{
                        labels: ds.macrosLabels,
                        datasets: [
                          {
                            data: ds.macrosSeries.protein,
                            strokeWidth: 2,
                            color: (opacity = 1) => C.success,
                            withDots: true,
                          },
                          {
                            data: ds.macrosSeries.carb,
                            strokeWidth: 2,
                            color: (opacity = 1) => C.info,
                            withDots: true,
                          },
                          {
                            data: ds.macrosSeries.fat,
                            strokeWidth: 2,
                            color: (opacity = 1) => C.warning,
                            withDots: true,
                          },
                          {
                            data: ds.macrosSeries.fiber,
                            strokeWidth: 2,
                            color: (opacity = 1) => '#9CA3AF',
                            withDots: true,
                          },
                        ],
                        // legend bỏ ra ngoài
                      }}
                      chartConfig={{
                        ...baseConfig,
                        propsForDots: { r: '3' },
                      }}
                      fromZero
                      bezier
                      yAxisSuffix="g"
                      segments={isSmall ? 4 : 6}
                      verticalLabelRotation={isSmall ? 15 : 0}
                      style={{ marginTop: 10 }}
                    />
                  )}
                </ChartSizer>
              ) : (
                <ViewComponent mt={10}>
                  <TextComponent
                    text="Chưa đủ dữ liệu để vẽ biểu đồ (cần ≥ 2 điểm)."
                    tone="muted"
                    align="center"
                  />
                </ViewComponent>
              )}
            </ViewComponent>

            {/* Meal slots progress (ĐÃ ĂN / BỎ BỮA) */}
            {/* Meal slots progress (ĐÃ ĂN / BỎ BỮA) */}
            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
              <TextComponent
                text={ds.titles.meal}
                variant="h3"
                weight="bold"
                tone="primary"
              />

              <ChartSizer>
                {w => (
                  <StackedBarChart
                    width={w}
                    height={240}
                    data={{
                      labels: (ds.mealProgress || []).map(m => m.label),
                      legend: ['Đã ăn', 'Bỏ bữa'], // bắt buộc có để đúng type
                      data: (ds.mealProgress || []).map(m => [
                        nz(m.logged),
                        nz(m.missed),
                      ]),
                      barColors: [C.success, C.warning],
                    }}
                    chartConfig={{
                      ...baseConfig,
                      decimalPlaces: 0,
                      formatYLabel: v => String(parseInt(v, 10)),
                      // giảm cỡ chữ trục để bớt chồng khi màn nhỏ
                      propsForLabels: { fontSize: 10 },
                    }}
                    barPercentage={0.55} // cột hẹp lại để đỡ chạm nhau
                    hideLegend // ẩn legend bên trong chart
                    withHorizontalLabels
                    fromZero
                    style={{ marginTop: 10 }}
                  />
                )}
              </ChartSizer>

              {/* Nhãn x/y & % */}
              <ViewComponent mt={10} gap={6}>
                {(ds.mealProgress || []).map(m => (
                  <ViewComponent key={m.label} row between>
                    <TextComponent text={`• ${m.label}`} />
                    <TextComponent
                      text={`${m.logged}/${m.total} ngày (${m.pct}%)`}
                      weight="bold"
                    />
                  </ViewComponent>
                ))}
              </ViewComponent>
            </ViewComponent>

            {/* Water chart */}
            <ViewComponent variant="card" p={CARD_PAD} mb={12} radius={20}>
              <TextComponent
                text={ds.titles.water}
                variant="h3"
                weight="bold"
                tone="primary"
              />
              {hasWaterData ? (
                <ChartSizer>
                  {w => (
                    <BarChart
                      width={w}
                      height={220}
                      data={{
                        labels: ds.waterLabels,
                        datasets: [{ data: ds.waterData }],
                      }}
                      chartConfig={infoConfig}
                      fromZero
                      // ẩn value trên đỉnh cột ở màn nhỏ cho đỡ rối
                      showValuesOnTopOfBars={!isSmall}
                      withHorizontalLabels
                      yAxisLabel=""
                      yAxisSuffix="ml"
                      segments={isSmall ? 4 : 6}
                      verticalLabelRotation={isSmall ? 15 : 0}
                      style={{ marginTop: 10 }}
                    />
                  )}
                </ChartSizer>
              ) : (
                <ViewComponent mt={10}>
                  <TextComponent
                    text="Chưa có dữ liệu nước để hiển thị."
                    tone="muted"
                    align="center"
                  />
                </ViewComponent>
              )}
            </ViewComponent>

            {/* Warnings — NỔI BẬT HƠN */}
            <View
              style={[
                styles.warningCard,
                {
                  borderColor: C.red,
                  backgroundColor: '#FEE2E2' /* red-100 */,
                },
              ]}
            >
              <TextComponent
                text="⚠️ Cảnh báo"
                variant="h3"
                weight="bold"
                color={C.red}
              />
              <ViewComponent mt={10} gap={8}>
                {(ds.warnings || []).length > 0 ? (
                  ds.warnings.map((t: string, idx: number) => (
                    <TextComponent key={`warn-${idx}`} text={`• ${t}`} />
                  ))
                ) : (
                  <TextComponent text="Không có cảnh báo." tone="muted" />
                )}
              </ViewComponent>
            </View>
          </ScrollView>
        )}
      </ViewComponent>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBackBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  line: {
    height: 2,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  filterItemBase: {
    minWidth: 104,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filterItemInactive: { backgroundColor: 'transparent' },
  filterItemActive: {
    backgroundColor: C.primary,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 1,
  },
  rangeTabs: { marginTop: 6 },
  warningCard: {
    borderWidth: 1,
    padding: CARD_PAD,
    borderRadius: 20,
    marginBottom: 28,
  },
});

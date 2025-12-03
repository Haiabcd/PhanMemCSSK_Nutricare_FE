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
import {
  getWeeklyStats,
  getMonthlyStats,
  getRangeStats,
} from '../services/statistic.service';
import type {
  StatisticWeekResponse,
  StatisticMonthResponse,
  MonthlyWeeklyNutritionDto,
  MealSlotSummary,
} from '../types/statistic.type';
import DateButton from '../components/Date/DateButton';
import DatePickerSheet from '../components/Date/DatePickerSheet';

/** ===== Types ===== */
type Range = 'week' | 'month' | 'range';
type MealProgressItem = {
  label: string;
  logged: number;
  missed: number;
  total: number;
  pct: number;
};

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

/** Legend */
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

/** ===== Helpers ===== */
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
/** Month: convert weeklyNutrition → series */
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
/** format YYYY-MM-DD */
const toISODate = (d: Date) => {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const toVNShort = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });

export default function Statistics() {
  const navigation = useNavigation();

  // ===== responsive: theo dõi width runtime (Android xoay ngang, nhiều size) =====
  const [screenW, setScreenW] = useState<number>(
    Dimensions.get('window').width,
  );

  useEffect(() => {
    const handler = ({ window }: { window: ScaledSize }) =>
      setScreenW(window.width);
    const subscription = Dimensions.addEventListener('change', handler as any);
    return () => {
      subscription?.remove?.();
    };
  }, []);

  const isSmall = screenW < 370; // Android máy nhỏ (ví dụ 320–360)
  const cardPad = screenW < 380 ? 14 : 20; // padding card theo size

  const [range, setRange] = useState<Range>('week');

  // fetch states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekData, setWeekData] = useState<StatisticWeekResponse | null>(null);
  const [monthData, setMonthData] = useState<StatisticMonthResponse | null>(
    null,
  );
  const [rangeData, setRangeData] = useState<StatisticWeekResponse | null>(
    null,
  );
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(
    () => new Date(Date.now() - 6 * 24 * 3600 * 1000),
    [],
  );
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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
        } else if (range === 'month') {
          const res = await getMonthlyStats(ac.signal);
          setMonthData(res.data || null);
        } else {
          // range
          const s = toISODate(startDate);
          const e = toISODate(endDate);
          const res = await getRangeStats(s, e, ac.signal);
          setRangeData(res.data || null);
        }
      } catch (e: any) {
        setError(e?.message || 'Có lỗi xảy ra khi tải thống kê.');
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [range, startDate, endDate]);

  /** CONFIG CHUNG CHO CHARTS (phụ thuộc vào isSmall) */
  const baseConfig = useMemo(() => {
    return {
      backgroundGradientFrom: C.white,
      backgroundGradientTo: C.white,
      decimalPlaces: 0 as 0 | 1 | 2 | 3,
      color: () => C.primary,
      labelColor: () => C.text,
      barPercentage: 0.6,
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
    const makeWeekLike = (
      d: StatisticWeekResponse | null,
      scopeTitle: string,
    ) => {
      // Macros theo ngày
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
      const waterLabels0 = (d?.dailyWaterTotals || []).map(x =>
        labelDay(x.date),
      );
      const waterData0 = (d?.dailyWaterTotals || []).map(x =>
        safeNum(x.totalMl),
      );
      const waterAligned = alignSeries(waterLabels0, waterData0);
      const wLabels = waterAligned.labels;
      const wData = waterAligned.series[0];

      // Meal slot summary
      const slot = d?.mealSlotSummary as MealSlotSummary | undefined;
      const mealSlots = [
        { key: 'BREAKFAST', label: 'Sáng' },
        { key: 'LUNCH', label: 'Trưa' },
        { key: 'DINNER', label: 'Chiều' },
        { key: 'SNACK', label: 'Phụ' },
      ] as const;

      const mealProgress: MealProgressItem[] = mealSlots.map(s => {
        const it = slot?.[s.key as keyof typeof slot];
        const logged = it?.loggedDays ?? 0;
        const total = it?.totalDays ?? 0;
        const missed = Math.max(it?.missedDays ?? 0, total - logged);
        const pct = total > 0 ? Math.round((logged / total) * 100) : 0;
        return { label: s.label, logged, missed, total, pct };
      });

      // Xu hướng cân nặng theo ngày
      const wtrendLabels0 = (d?.weeklyWeightTrend || []).map(x =>
        toVNShort(x.date),
      );
      const wtrendData0 = (d?.weeklyWeightTrend || []).map(x =>
        safeNum(x.weightKg),
      );
      const wtrendAligned = alignSeries(wtrendLabels0, wtrendData0);
      const wtLabels = wtrendAligned.labels;
      const wtData = wtrendAligned.series[0];

      return {
        scopeTitle,
        weight: d ? `${d.weightKg} kg` : '-',
        bmi: d ? `${Math.round((d.bmi + Number.EPSILON) * 10) / 10}` : '-',
        bmiClassification: d?.bmiClassification ?? '-',
        topFoods: d?.topFoods || [],
        warnings: d?.warnings || [],
        macrosLabels: labels,
        macrosSeries: { protein, carb, fat, fiber },
        waterLabels: wLabels,
        waterData: wData,
        mealProgress,
        weightLabels: wtLabels,
        weightData: wtData,
        titles: {
          macros: 'Dinh dưỡng theo ngày (g)',
          water: 'Nước theo ngày (ml)',
          meal: 'Bữa ăn theo kỳ',
          weight: 'Xu hướng cân nặng (kg)',
        },
      };
    };

    if (range === 'week') {
      return makeWeekLike(weekData, 'Theo tuần');
    }
    if (range === 'month') {
      const m = monthData;
      const { labels, protein, carb, fat, fiber } = toWeeklySeries(
        m?.weeklyNutrition,
      );
      const slot = m?.mealSlotSummary as MealSlotSummary | undefined;
      const mealSlots = [
        { key: 'BREAKFAST', label: 'Sáng' },
        { key: 'LUNCH', label: 'Trưa' },
        { key: 'DINNER', label: 'Chiều' },
        { key: 'SNACK', label: 'Phụ' },
      ] as const;
      const mealProgress: MealProgressItem[] = mealSlots.map(s => {
        const it = slot?.[s.key as keyof typeof slot];
        const logged = it?.loggedDays ?? 0;
        const total = it?.totalDays ?? 0;
        const missed = Math.max(it?.missedDays ?? 0, total - logged);
        const pct = total > 0 ? Math.round((logged / total) * 100) : 0;
        return { label: s.label, logged, missed, total, pct };
      });
      const waterLabels0 = (m?.weeklyWaterTotals || []).map(
        w => `Tuần ${w.weekIndex}`,
      );
      const waterData0 = (m?.weeklyWaterTotals || []).map(w =>
        safeNum(w.totalMl),
      );
      const waterAligned = alignSeries(waterLabels0, waterData0);
      const wLabels = waterAligned.labels;
      const wData = waterAligned.series[0];
      const wtrendLabels0 = (m?.weeklyWeightTrend || []).map(x =>
        toVNShort(x.date),
      );
      const wtrendData0 = (m?.weeklyWeightTrend || []).map(x =>
        safeNum(x.weightKg),
      );
      const wtrendAligned = alignSeries(wtrendLabels0, wtrendData0);
      const wtLabels = wtrendAligned.labels;
      const wtData = wtrendAligned.series[0];

      return {
        scopeTitle: 'Theo tháng',
        weight: m ? `${m.weightKg} kg` : '-',
        bmi: m ? `${Math.round((m.bmi + Number.EPSILON) * 10) / 10}` : '-',
        bmiClassification: m?.bmiClassification ?? '-',
        topFoods: m?.topFoods || [],
        warnings: m?.warnings || [],
        macrosLabels: labels,
        macrosSeries: { protein, carb, fat, fiber },
        waterLabels: wLabels,
        waterData: wData,
        mealProgress,
        weightLabels: wtLabels,
        weightData: wtData,
        titles: {
          macros: 'Dinh dưỡng theo tuần (g)',
          water: 'Nước theo tuần (ml)',
          meal: 'Bữa ăn trong tháng',
          weight: 'Xu hướng cân nặng (kg)',
        },
      };
    }
    return makeWeekLike(rangeData, 'Theo khoảng');
  }, [range, weekData, monthData, rangeData]);

  const top5Foods = ds.topFoods?.slice(0, 5) || [];
  const hasEnoughMacroPoints = ds.macrosLabels.length >= 2;
  const hasWaterData =
    ds.waterLabels.length > 0 && ds.waterLabels.length === ds.waterData.length;
  const hasWeightData =
    (ds.weightLabels?.length || 0) > 0 &&
    ds.weightLabels.length === (ds.weightData?.length || 0) &&
    ds.weightLabels.length >= 2;
  const shouldShowWeightTrendCard = hasWeightData;

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
            {(['week', 'month', 'range'] as Range[]).map(opt => {
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
                    text={
                      opt === 'week'
                        ? 'Theo tuần'
                        : opt === 'month'
                          ? 'Theo tháng'
                          : 'Theo khoảng'
                    }
                    weight="bold"
                    size={12}
                    color={active ? C.onPrimary : C.text}
                  />
                </Pressable>
              );
            })}
          </ViewComponent>
        </ViewComponent>

        {/* Date range selector (only for range) */}
        {range === 'range' && (
          <ViewComponent center mb={10}>
            <ViewComponent
              row
              gap={14}
              p={10}
              radius={14}
              border
              borderColor={C.border}
              backgroundColor={C.bg}
              alignItems="center"
            >
              <DateButton
                date={startDate}
                label="Chọn ngày bắt đầu"
                onPress={() => setShowStartPicker(true)}
                formatter={d =>
                  d.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                }
              />
              <TextComponent text="—" />
              <DateButton
                date={endDate}
                label="Chọn ngày kết thúc"
                onPress={() => setShowEndPicker(true)}
                formatter={d =>
                  d.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                }
              />
            </ViewComponent>
          </ViewComponent>
        )}

        {/* Pickers */}
        <DatePickerSheet
          visible={showStartPicker}
          value={startDate}
          onClose={() => setShowStartPicker(false)}
          onChange={d => {
            const nd = d;
            if (nd > endDate) setEndDate(nd);
            setStartDate(nd);
          }}
          maxDate={endDate}
        />
        <DatePickerSheet
          visible={showEndPicker}
          value={endDate}
          onClose={() => setShowEndPicker(false)}
          onChange={d => {
            const nd = d;
            if (nd < startDate) setStartDate(nd);
            setEndDate(nd);
          }}
          minDate={startDate}
        />

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
            <ViewComponent variant="card" p={cardPad} mb={12} radius={20}>
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

            {/* Weight trend */}
            {shouldShowWeightTrendCard && (
              <ViewComponent variant="card" p={cardPad} mb={12} radius={20}>
                <TextComponent
                  text={ds.titles.weight}
                  variant="h3"
                  weight="bold"
                  tone="primary"
                />

                <ChartSizer>
                  {w => (
                    <LineChart
                      width={w}
                      height={isSmall ? 200 : 240}
                      data={{
                        labels: ds.weightLabels,
                        datasets: [
                          {
                            data: ds.weightData,
                            strokeWidth: 2,
                            color: () => C.primary,
                            withDots: true,
                          },
                        ],
                      }}
                      chartConfig={{
                        ...baseConfig,
                        propsForDots: { r: '3' },
                      }}
                      fromZero={false}
                      yAxisSuffix="kg"
                      segments={isSmall ? 4 : 6}
                      verticalLabelRotation={isSmall ? 15 : 0}
                      style={{ marginTop: 10 }}
                      bezier
                    />
                  )}
                </ChartSizer>
              </ViewComponent>
            )}

            {/* Top 5 foods */}
            <ViewComponent variant="card" p={cardPad} mb={12} radius={20}>
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

            {/* Macros */}
            <ViewComponent variant="card" p={cardPad} mb={12} radius={20}>
              <TextComponent
                text={ds.titles.macros}
                variant="h3"
                weight="bold"
                tone="primary"
              />

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
                      height={isSmall ? 230 : 260}
                      data={{
                        labels: ds.macrosLabels,
                        datasets: [
                          {
                            data: ds.macrosSeries.protein,
                            strokeWidth: 2,
                            color: () => C.success,
                            withDots: true,
                          },
                          {
                            data: ds.macrosSeries.carb,
                            strokeWidth: 2,
                            color: () => C.info,
                            withDots: true,
                          },
                          {
                            data: ds.macrosSeries.fat,
                            strokeWidth: 2,
                            color: () => C.warning,
                            withDots: true,
                          },
                          {
                            data: ds.macrosSeries.fiber,
                            strokeWidth: 2,
                            color: () => '#9CA3AF',
                            withDots: true,
                          },
                        ],
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

            {/* Meal progress */}
            <ViewComponent variant="card" p={cardPad} mb={12} radius={20}>
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
                    height={isSmall ? 210 : 240}
                    data={{
                      labels: (ds.mealProgress || []).map(m => m.label),
                      legend: ['Đã ăn', 'Bỏ bữa'],
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
                      propsForLabels: { fontSize: 10 },
                    }}
                    barPercentage={0.55}
                    hideLegend
                    withHorizontalLabels
                    fromZero
                    style={{ marginTop: 10 }}
                  />
                )}
              </ChartSizer>

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
            <ViewComponent variant="card" p={cardPad} mb={12} radius={20}>
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
                      height={isSmall ? 200 : 220}
                      data={{
                        labels: ds.waterLabels,
                        datasets: [{ data: ds.waterData }],
                      }}
                      chartConfig={infoConfig}
                      fromZero
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

            {/* Warnings */}
            <View
              style={[
                styles.warningCard,
                {
                  padding: cardPad,
                  borderColor: C.red,
                  backgroundColor: '#FEE2E2',
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
    borderRadius: 20,
    marginBottom: 28,
  },
});

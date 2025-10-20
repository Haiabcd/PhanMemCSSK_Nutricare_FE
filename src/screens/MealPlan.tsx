import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import Container from '../components/Container';
import CaloriesNutritionCard from '../components/MealPlan/CaloriesNutritionCard';
import HydrationSummaryCard from '../components/MealPlan/HydrationCard';
import MealLog from '../components/MealPlan/MealLog';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import type { NutritionResponse } from '../types/types';
import type { MealPlanResponse } from '../types/mealPlan.type';
import { getMealPlanByDate } from '../services/planDay.service';
import { getDailyNutrition, savePlanLogById } from '../services/log.service';
import { fmtVNFull, toISODateOnly } from '../helpers/mealPlan.helper';
import DateButton from '../components/Date/DateButton';
import DatePickerSheet from '../components/Date/DatePickerSheet';
import AppHeader from '../components/AppHeader';
import LoadingOverlay from '../components/LoadingOverlay';

const MealPlan = () => {
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState<Date>(new Date());
  const navigation =
    useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const [data, setData] = useState<MealPlanResponse | null>(null);
  const [dailyNutri, setDailyNutri] = useState<NutritionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Dedupe in-flight theo ngày để chặn gọi trùng
  const inFlightKey = useRef<string | null>(null);

  const fetchData = useCallback(
    async (d: Date, signal?: AbortSignal, opts?: { isRefresh?: boolean }) => {
      const key = toISODateOnly(d);

      // Chặn gọi trùng (trừ khi là refresh)
      if (!opts?.isRefresh && inFlightKey.current === key) return;
      inFlightKey.current = key;

      opts?.isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const [planRes, nutriRes] = await Promise.all([
          getMealPlanByDate(key, signal),
          getDailyNutrition(key, signal),
        ]);

        if (signal?.aborted) return;
        setData(planRes.data ?? null);
        setDailyNutri(nutriRes ?? null);
      } catch {
        if (!signal?.aborted) {
          setData(null);
          setDailyNutri(null);
        }
      } finally {
        if (signal?.aborted) return;
        if (inFlightKey.current === key) inFlightKey.current = null;
        opts?.isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [],
  );

  // Chỉ dùng MỘT nơi để fetch: useFocusEffect (bỏ useEffect để tránh double-call)
  useFocusEffect(
    useCallback(() => {
      const ac = new AbortController();
      fetchData(date, ac.signal);
      return () => ac.abort();
    }, [date, fetchData]),
  );

  const onRefresh = useCallback(() => {
    if (loading || refreshing) return;
    const ac = new AbortController();
    fetchData(date, ac.signal, { isRefresh: true });
  }, [date, fetchData, loading, refreshing]);

  const onLogEat = useCallback(
    async (mealPlanItemId: string) => {
      if (loading) return;
      await savePlanLogById(mealPlanItemId);
      const ac = new AbortController();
      await fetchData(date, ac.signal);
    },
    [date, fetchData, loading],
  );

  const onAfterSwap = useCallback(async () => {
    if (loading) return;
    const ac = new AbortController();
    await fetchData(date, ac.signal);
  }, [date, fetchData, loading]);

  const goTodayAnd = useCallback(
    (mode: 'day' | 'week') => {
      if (loading) return;
      setRange(mode);
      setDate(new Date());
    },
    [loading],
  );

  const kcalTarget = useMemo(
    () => Number(data?.targetNutrition?.kcal ?? 0),
    [data?.targetNutrition?.kcal],
  );

  const eatenKcal = useMemo(
    () => Number(dailyNutri?.kcal ?? 0),
    [dailyNutri?.kcal],
  );

  const macrosFromTarget = useMemo(
    () => ({
      carbs: {
        cur: Math.round(Number(dailyNutri?.carbG ?? 0)),
        total: Math.round(Number(data?.targetNutrition?.carbG ?? 0)),
      },
      protein: {
        cur: Math.round(Number(dailyNutri?.proteinG ?? 0)),
        total: Math.round(Number(data?.targetNutrition?.proteinG ?? 0)),
      },
      fat: {
        cur: Math.round(Number(dailyNutri?.fatG ?? 0)),
        total: Math.round(Number(data?.targetNutrition?.fatG ?? 0)),
      },
      fiber: {
        cur: Math.round(Number(dailyNutri?.fiberG ?? 0)),
        total: Math.round(Number(data?.targetNutrition?.fiberG ?? 0)),
      },
    }),
    [
      dailyNutri?.carbG,
      dailyNutri?.proteinG,
      dailyNutri?.fatG,
      dailyNutri?.fiberG,
      data?.targetNutrition?.carbG,
      data?.targetNutrition?.proteinG,
      data?.targetNutrition?.fatG,
      data?.targetNutrition?.fiberG,
    ],
  );

  return (
    <Container>
      {/* Header */}
      <AppHeader
        loading={loading}
        onBellPress={() => navigation.navigate('Notification')}
      />

      <ViewComponent style={s.line} />

      {/* Date + segmented control */}
      <ViewComponent center mb={12}>
        <DateButton
          date={date}
          label="Chọn ngày"
          formatter={fmtVNFull}
          onPress={() => !loading && setShowPicker(true)}
        />

        <ViewComponent
          row
          gap={6}
          mt={8}
          p={4}
          radius={999}
          border
          borderColor={C.primaryBorder}
          backgroundColor={C.primarySurface}
          flex={0}
          style={loading ? { opacity: 0.6 } : undefined}
        >
          <Pressable
            onPress={() => goTodayAnd('day')}
            style={[s.segmentBtn, range === 'day' && s.segmentBtnActive]}
            accessibilityRole="button"
            accessibilityState={{
              selected: range === 'day',
              disabled: loading,
            }}
            hitSlop={6}
            disabled={loading}
          >
            <TextComponent
              text="Theo ngày"
              size={12}
              weight="bold"
              color={range === 'day' ? C.onPrimary : C.text}
              numberOfLines={1}
              allowFontScaling={false}
            />
          </Pressable>

          <Pressable
            onPress={() => goTodayAnd('week')}
            style={[s.segmentBtn, range === 'week' && s.segmentBtnActive]}
            accessibilityRole="button"
            accessibilityState={{
              selected: range === 'week',
              disabled: loading,
            }}
            hitSlop={6}
            disabled={loading}
          >
            <TextComponent
              text="Theo tuần"
              size={12}
              weight="bold"
              color={range === 'week' ? C.onPrimary : C.text}
              numberOfLines={1}
              allowFontScaling={false}
            />
          </Pressable>
        </ViewComponent>
      </ViewComponent>

      <DatePickerSheet
        visible={showPicker}
        value={date}
        onClose={() => setShowPicker(false)}
        onChange={d => setDate(d)}
      />

      {/* Nội dung + Pull to refresh */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Calories & Dinh dưỡng */}
        <ViewComponent mb={12}>
          <CaloriesNutritionCard
            target={kcalTarget}
            eaten={eatenKcal}
            burned={0}
            macros={macrosFromTarget}
            onPressStatistics={() => navigation.navigate('Statistics')}
          />
        </ViewComponent>

        {/* Nhật ký ăn uống */}
        <ViewComponent variant="card" p={12} mb={12} mt={12}>
          <TextComponent text="Nhật ký ăn uống" variant="h3" tone="primary" />
          <ViewComponent mt={12}>
            <MealLog
              range={range}
              items={data?.items || []}
              activeDate={date}
              onPickDate={d => !loading && setDate(d)}
              onViewDetail={foodId =>
                navigation.navigate('MealLogDetail', { id: foodId })
              }
              onLogEat={onLogEat}
              onAfterSwap={onAfterSwap}
            />
          </ViewComponent>
        </ViewComponent>

        {/* Uống nước */}
        <ViewComponent mt={12} mb={12}>
          <HydrationSummaryCard
            target={data?.waterTargetMl || 2000}
            initial={0}
            palette={C}
          />
        </ViewComponent>
      </ScrollView>
      <LoadingOverlay visible={loading && !refreshing} />
    </Container>
  );
};

export default MealPlan;

const s = StyleSheet.create({
  line: { height: 2, backgroundColor: C.border, marginVertical: 12 },
  segmentBtn: {
    minWidth: 100,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  segmentBtnActive: { backgroundColor: C.primary },
});

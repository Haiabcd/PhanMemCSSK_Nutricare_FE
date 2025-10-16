import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
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

  const fetchData = useCallback(
    async (d: Date, signal?: AbortSignal, opts?: { isRefresh?: boolean }) => {
      opts?.isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const dateIso = toISODateOnly(d);
        const [planRes, nutriRes] = await Promise.all([
          getMealPlanByDate(dateIso, signal),
          getDailyNutrition(dateIso, signal),
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
        opts?.isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const ac = new AbortController();
    const task = InteractionManager.runAfterInteractions(() => {
      fetchData(date, ac.signal);
    });
    return () => {
      ac.abort();
      // @ts-ignore
      task?.cancel?.();
    };
  }, [date, fetchData]);

  useFocusEffect(
    useCallback(() => {
      const ac = new AbortController();
      fetchData(date, ac.signal);
      return () => ac.abort();
    }, [date, fetchData]),
  );

  const onRefresh = useCallback(() => {
    const ac = new AbortController();
    fetchData(date, ac.signal, { isRefresh: true });
  }, [date, fetchData]);

  const onLogEat = useCallback(
    async (mealPlanItemId: string) => {
      await savePlanLogById(mealPlanItemId);
      const ac = new AbortController();
      await fetchData(date, ac.signal);
    },
    [date, fetchData],
  );

  const onAfterSwap = useCallback(async () => {
    const ac = new AbortController();
    await fetchData(date, ac.signal);
  }, [date, fetchData]);

  const goTodayAnd = useCallback((mode: 'day' | 'week') => {
    setRange(mode);
    setDate(new Date());
  }, []);

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
      {/* Header dùng chung */}
      <AppHeader
        loading={loading}
        onPressBell={() => navigation.navigate('Notification')}
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
            onPress={() => !loading && goTodayAnd('day')}
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
            onPress={() => !loading && goTodayAnd('week')}
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
        {loading && !refreshing ? (
          <ViewComponent center style={{ paddingVertical: 24 }}>
            <ActivityIndicator size="small" color={C.primary} />
            <ViewComponent style={{ height: 8 }} />
            <TextComponent text="Đang tải dữ liệu..." tone="muted" size={12} />
          </ViewComponent>
        ) : null}

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
              onPickDate={d => setDate(d)}
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

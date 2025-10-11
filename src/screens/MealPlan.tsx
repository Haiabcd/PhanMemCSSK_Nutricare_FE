import React, { useState, useCallback, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import CaloriesNutritionCard from '../components/MealPlan/CaloriesNutritionCard';
import HydrationSummaryCard from '../components/MealPlan/HydrationCard';
import MealLog from '../components/MealPlan/MealLog';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import type { ApiResponse } from '../types/types';
import type { MealPlanResponse } from '../types/mealPlan.type';
import { getMealPlanByDate } from '../services/planDay.service';
import { fmtVNFull, toISODateOnly } from '../helpers/mealPlan.helper';
import DateButton from '../components/Date/DateButton';
import DatePickerSheet from '../components/Date/DatePickerSheet';

/* ================== Avatar fallback ================== */
function Avatar({
  name,
  photoUri,
}: {
  name: string;
  photoUri?: string | null;
}) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;

  return (
    <ViewComponent center style={s.avatarFallback} flex={0}>
      <TextComponent
        text={initials}
        variant="subtitle"
        weight="bold"
        tone="primary"
      />
    </ViewComponent>
  );
}

const MealPlan = () => {
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState<Date>(new Date());
  const navigation =
    useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const [data, setData] = useState<MealPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const fetchData = useCallback(
    async (d: Date, signal?: AbortSignal, opts?: { isRefresh?: boolean }) => {
      if (opts?.isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const res: ApiResponse<MealPlanResponse> = await getMealPlanByDate(
          toISODateOnly(d),
          signal,
        );
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        if (opts?.isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchData(date, ac.signal);
    return () => ac.abort();
  }, [date, fetchData]);

  // Kéo để làm mới (refetch ngày hiện tại)
  const onRefresh = () => {
    const ac = new AbortController();
    fetchData(date, ac.signal, { isRefresh: true });
  };

  const goTodayAnd = (mode: 'day' | 'week') => {
    setRange(mode);
    setDate(new Date());
  };

  const kcalTarget = data?.targetNutrition?.kcal ?? 0;
  const macrosFromTarget = {
    carbs: { cur: 0, total: Math.round(data?.targetNutrition?.carbG ?? 0) },
    protein: {
      cur: 0,
      total: Math.round(data?.targetNutrition?.proteinG ?? 0),
    },
    fat: { cur: 0, total: Math.round(data?.targetNutrition?.fatG ?? 0) },
    fiber: { cur: 0, total: Math.round(data?.targetNutrition?.fiberG ?? 0) },
  };

  return (
    <Container>
      {/* Header */}
      <ViewComponent row between alignItems="center">
        <ViewComponent row alignItems="center" gap={10} flex={0}>
          <Avatar name="Anh Hải" />
          <ViewComponent flex={0}>
            <TextComponent text="Xin chào," variant="caption" tone="muted" />
            <TextComponent text="Anh Hải Nè" variant="subtitle" weight="bold" />
          </ViewComponent>
        </ViewComponent>

        <Pressable
          style={s.iconContainer}
          onPress={() => navigation.navigate('Notification')}
          accessibilityRole="button"
          accessibilityLabel="Mở thông báo"
          hitSlop={8}
          disabled={loading}
        >
          <Entypo name="bell" size={20} color={C.primary} />
        </Pressable>
      </ViewComponent>

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
        {/* Loading overlay nhỏ gọn (chỉ khi loading lần đầu hoặc đổi ngày) */}
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
            eaten={1000}
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
              onChangeMeal={item => {
                // TODO: mở bottom sheet đổi món cho item
              }}
              onViewDetail={() => navigation.navigate('MealLogDetail')}
            />
          </ViewComponent>
        </ViewComponent>

        {/* Uống nước */}
        <ViewComponent mt={12} mb={12}>
          <HydrationSummaryCard
            target={data?.waterTargetMl || 2000}
            step={0.25}
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
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 999 },

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

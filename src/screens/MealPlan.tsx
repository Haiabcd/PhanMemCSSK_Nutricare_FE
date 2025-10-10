import React, { useState, useCallback, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import CaloriesNutritionCard from '../components/MealPlan/CaloriesNutritionCard';
import HydrationSummaryCard from '../components/MealPlan/HydrationCard';
import MealLog from '../components/MealPlan/MealLog';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import type { ApiResponse } from '../types/types';
import type { MealPlanResponse } from '../types/mealPlan.type';
import { getMealPlanByDate } from '../services/planDay.service';
import { fmtVNFull, toISODateOnly } from '../helpers/mealPlan.helper';
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
  const [error, setError] = useState<string | null>(null);

  // Modal DatePicker chung cho cả iOS & Android
  const [showPicker, setShowPicker] = useState(false);
  const openPicker = () => setShowPicker(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    try {
      const res: ApiResponse<MealPlanResponse> = await getMealPlanByDate(
        toISODateOnly(date),
        signal,
      );
      setData(res.data);
      console.log(res.data);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải thực đơn tuần.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, [fetchData]);

  // ngay trên return()
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
        >
          <Entypo name="bell" size={20} color={C.primary} />
        </Pressable>
      </ViewComponent>

      <ViewComponent style={s.line} />

      {/* Date + segmented control */}
      <ViewComponent center mb={12}>
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel="Chọn ngày"
        >
          <ViewComponent row center gap={8} flex={0}>
            <Entypo name="calendar" size={18} color={C.primary} />
            <TextComponent
              text={fmtVNFull(date)}
              variant="subtitle"
              weight="bold"
            />
          </ViewComponent>
        </Pressable>

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
        >
          <Pressable
            onPress={() => setRange('day')}
            style={[s.segmentBtn, range === 'day' && s.segmentBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: range === 'day' }}
            hitSlop={6}
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
            onPress={() => setRange('week')}
            style={[s.segmentBtn, range === 'week' && s.segmentBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: range === 'week' }}
            hitSlop={6}
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

      {/* DatePicker modal (iOS + Android) */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={s.pickerSheet} onPress={() => setShowPicker(false)}>
          {/* chặn đóng khi bấm vùng hộp */}
          <Pressable style={s.pickerBox}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
              onChange={(event, d) => {
                if (Platform.OS === 'android') {
                  setShowPicker(false);
                  if (event.type === 'set' && d) setDate(d);
                } else {
                  if (d) setDate(d);
                }
              }}
            />
            {Platform.OS === 'ios' && (
              <Pressable onPress={() => setShowPicker(false)} style={s.doneBtn}>
                <TextComponent text="Xong" weight="bold" color={C.onPrimary} />
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Calories & Dinh dưỡng */}
        <ViewComponent mb={12}>
          <CaloriesNutritionCard
            target={kcalTarget}
            eaten={1000}
            burned={0}
            macros={macrosFromTarget}
            modeLabel="Cân Bằng"
            onPressStatistics={() => navigation.navigate('Statistics')}
          />
        </ViewComponent>

        {/* Nhật ký ăn uống */}
        <ViewComponent variant="card" p={12} mb={12} mt={12}>
          <TextComponent text="Nhật ký ăn uống" variant="h3" tone="primary" />
          <ViewComponent mt={12}>
            <MealLog
              range={range}
              date={date}
              onChangeDate={setDate}
              onDetail={() => navigation.navigate('MealLogDetail')}
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

  pickerSheet: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  doneBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
});

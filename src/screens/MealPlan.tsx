import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  View,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import CaloriesNutritionCard from '../components/MealPlan/CaloriesNutritionCard';
import HydrationSummaryCard from '../components/MealPlan/HydrationCard';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import MealLog from '../components/MealPlan/MealLog';
import { colors as C } from '../constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const fmtVNFull = (d: Date) => {
  const dow = [
    'Chủ nhật',
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
  ][d.getDay()];
  const dd = `${d.getDate()}`.padStart(2, '0');
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${dow}, ${dd} Tháng ${mm}`;
};

const MealPlan = () => {
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState<Date>(new Date());

  // Modal DatePicker chung cho cả iOS & Android
  const [showPicker, setShowPicker] = useState(false);
  const openPicker = () => setShowPicker(true);

  return (
    <Container>
      {/* Header */}
      <ViewComponent row between alignItems="center" mt={20}>
        <ViewComponent row alignItems="center" gap={10} flex={0}>
          <Avatar name="Anh Hải" />
          <ViewComponent flex={0}>
            <TextComponent text="Xin chào," variant="caption" tone="muted" />
            <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
          </ViewComponent>
        </ViewComponent>

        <Pressable style={s.iconContainer}>
          <Entypo name="bell" size={20} color={C.primary} />
        </Pressable>
      </ViewComponent>

      <View style={s.line} />

      {/* Date + segmented control */}
      <ViewComponent center mb={12}>
        <Pressable onPress={openPicker}>
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
                  // Android: đóng ngay sau khi chọn/dismiss
                  setShowPicker(false);
                  if (event.type === 'set' && d) setDate(d);
                } else {
                  // iOS: cập nhật liên tục, đóng bằng nút "Xong"
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
            target={2105}
            eaten={1000}
            burned={0}
            macros={{
              carbs: { cur: 80, total: 263 },
              protein: { cur: 30, total: 121 },
              fat: { cur: 15, total: 63 },
              fiber: { cur: 8, total: 27 },
            }}
            modeLabel="Cân Bằng"
          />
        </ViewComponent>

        {/* Nhật ký ăn uống */}
        <ViewComponent variant="card" p={12} mb={12}>
          <TextComponent text="Nhật ký ăn uống" variant="h3" tone="primary" />
          <ViewComponent mt={12}>
            <MealLog range={range} date={date} onChangeDate={setDate} />
          </ViewComponent>
        </ViewComponent>

        {/* Uống nước */}
        <ViewComponent variant="card" p={12} mb={12}>
          <TextComponent text="Uống nước" variant="h3" tone="primary" />
          <ViewComponent mt={12}>
            <HydrationSummaryCard
              target={2.5}
              step={0.25}
              initial={0.5}
              palette={C}
            />
          </ViewComponent>
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

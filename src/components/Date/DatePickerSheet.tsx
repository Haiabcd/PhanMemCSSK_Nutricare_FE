import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';
import useOnboardingAt from '../../hooks/useOnboardingAt';

export interface DatePickerSheetProps {
  visible: boolean;
  value: Date;
  mode?: 'date' | 'time';
  onClose: () => void;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePickerSheet({
  visible,
  value,
  mode = 'date',
  onClose,
  onChange,
  minDate,
  maxDate,
}: DatePickerSheetProps) {
  const { onboardingAt, loading: loadingOnbAt } = useOnboardingAt();
  const effectiveMinDate: Date | undefined =
    minDate ?? onboardingAt ?? undefined;
  const effectiveMaxDate: Date | undefined = maxDate;

  // helper kẹp theo min/max
  const clampDate = (d: Date) => {
    let out = d;
    if (effectiveMinDate && out < effectiveMinDate) out = effectiveMinDate;
    if (effectiveMaxDate && out > effectiveMaxDate) out = effectiveMaxDate;
    return out;
  };
  const safeValue = clampDate(value);

  const handleChange = (event: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && d) onChange(clampDate(d));
      onClose();
    } else {
      if (d) onChange(clampDate(d));
    }
  };

  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <View style={{ width: 0, height: 0 }}>
        <DateTimePicker
          value={safeValue}
          mode={mode}
          display={mode === 'time' ? 'clock' : 'calendar'}
          onChange={handleChange}
          minimumDate={effectiveMinDate}
          maximumDate={effectiveMaxDate}
        />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <Pressable style={s.sheetBackdrop} onPress={onClose}>
        <Pressable style={s.sheetBox} onPress={() => {}}>
          <DateTimePicker
            value={safeValue}
            mode={mode}
            display="inline"
            onChange={handleChange}
            minimumDate={effectiveMinDate}
            maximumDate={effectiveMaxDate}
          />
          <Pressable
            onPress={onClose}
            style={s.doneBtn}
            accessibilityRole="button"
          >
            <TextComponent text="Xong" weight="bold" color={C.onPrimary} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetBox: {
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

import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';

export interface DatePickerSheetProps {
  visible: boolean;
  value: Date;
  mode?: 'date' | 'time';
  onClose: () => void;
  onChange: (date: Date) => void;
  /** mới */
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
  // helper kẹp theo min/max
  const clampDate = (d: Date) => {
    let out = d;
    if (minDate && out < minDate) out = minDate;
    if (maxDate && out > maxDate) out = maxDate;
    return out;
  };

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
          value={value}
          mode={mode}
          display={mode === 'time' ? 'clock' : 'calendar'}
          onChange={handleChange}
          /** mới: truyền min/max xuống picker */
          minimumDate={minDate}
          maximumDate={maxDate}
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
        <Pressable style={s.sheetBox} onPress={() => { }}>
          <DateTimePicker
            value={value}
            mode={mode}
            display="inline"
            onChange={handleChange}
            /** mới: truyền min/max xuống picker */
            minimumDate={minDate}
            maximumDate={maxDate}
          />
          <Pressable onPress={onClose} style={s.doneBtn} accessibilityRole="button">
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

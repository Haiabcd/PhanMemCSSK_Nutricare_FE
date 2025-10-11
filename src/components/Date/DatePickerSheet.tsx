import React from 'react';
import { Modal, Platform, Pressable, StyleSheet } from 'react-native';
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
}

export default function DatePickerSheet({
  visible,
  value,
  mode = 'date',
  onClose,
  onChange,
}: DatePickerSheetProps) {
  // handler chung
  const handleChange = (event: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && d) onChange(d);
      onClose();
    } else if (d) {
      onChange(d); // iOS inline: cập nhật liên tục
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.sheetBackdrop} onPress={onClose}>
        {/* chặn đóng khi bấm trong hộp */}
        <Pressable style={s.sheetBox}>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={value}
              mode={mode}
              display="inline" // ✅ iOS hợp lệ: 'inline' | 'spinner' | 'compact' | 'default'
              onChange={handleChange}
            />
          ) : (
            <DateTimePicker
              value={value}
              mode={mode}
              display="calendar" // ✅ Android hợp lệ: 'calendar' | 'clock' | 'spinner' | 'default'
              onChange={handleChange}
            />
          )}

          {Platform.OS === 'ios' && (
            <Pressable
              onPress={onClose}
              style={s.doneBtn}
              accessibilityRole="button"
            >
              <TextComponent text="Xong" weight="bold" color={C.onPrimary} />
            </Pressable>
          )}
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

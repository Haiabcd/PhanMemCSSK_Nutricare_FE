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
      // Android trả type = 'set' hoặc 'dismissed'
      if (event.type === 'set' && d) onChange(d);
      onClose();
    } else {
      if (d) onChange(d); // iOS inline: cập nhật liên tục
    }
  };

  // === ANDROID FIX ===
  // Không bọc trong Modal. Khi visible=true, chỉ cần mount DateTimePicker là nó tự mở native dialog.
  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <View
        /* giữ component trong tree, không ảnh hưởng layout */ style={{
          width: 0,
          height: 0,
        }}
      >
        <DateTimePicker
          value={value}
          mode={mode}
          display={mode === 'time' ? 'clock' : 'calendar'}
          onChange={handleChange}
        />
      </View>
    );
  }

  // === iOS giữ nguyên kiểu sheet ===
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      {/* Backdrop bấm ra ngoài để đóng */}
      <Pressable style={s.sheetBackdrop} onPress={onClose}>
        {/* Chặn đóng khi bấm trong hộp */}
        <Pressable style={s.sheetBox} onPress={() => {}}>
          <DateTimePicker
            value={value}
            mode={mode}
            display="inline" // iOS: 'inline' | 'spinner' | 'compact' | 'default'
            onChange={handleChange}
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

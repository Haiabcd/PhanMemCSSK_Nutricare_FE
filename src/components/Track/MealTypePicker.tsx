import React from 'react';
import { Pressable, StyleSheet, Platform, View } from 'react-native';
import Text from '../TextComponent';
import V from '../ViewComponent';
import { colors } from '../../constants/colors';
import type { MealSlot } from '../../types/types';

const MEAL_OPTS: { k: MealSlot; label: string }[] = [
  { k: 'BREAKFAST', label: 'Sáng' },
  { k: 'LUNCH', label: 'Trưa' },
  { k: 'DINNER', label: 'Chiều' },
  { k: 'SNACK', label: 'Phụ' },
];

export default function MealTypePicker({
  value,
  onChange,
  placeholder = 'Chọn bữa',
}: {
  value: MealSlot;
  onChange: (v: MealSlot) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const current = MEAL_OPTS.find(o => o.k === value)?.label ?? placeholder;

  return (
    <View style={{ position: 'relative' }}>
      <Pressable onPress={() => setOpen(v => !v)} style={styles.input}>
        <Text text={current} color={colors.text} style={{ fontSize: 16 }} />
        <Text text="▾" tone="muted" style={styles.caret} />
      </Pressable>

      {open && (
        <V style={styles.dropdown}>
          {MEAL_OPTS.map(opt => {
            const active = opt.k === value;
            return (
              <Pressable
                key={opt.k}
                onPress={() => {
                  onChange(opt.k);
                  setOpen(false);
                }}
                style={styles.item}
              >
                <Text
                  text={opt.label}
                  weight={active ? 'bold' : 'semibold'}
                  color={active ? colors.primary : colors.text}
                />
              </Pressable>
            );
          })}
        </V>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  caret: { position: 'absolute', right: 12, top: 10, fontSize: 20 },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 52,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 4,
    zIndex: 9999,
    ...Platform.select({
      android: { elevation: 20 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  item: { height: 44, paddingHorizontal: 12, justifyContent: 'center' },
});

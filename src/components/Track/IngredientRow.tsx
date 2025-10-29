import React from 'react';
import { View, Image, Pressable, TextInput, StyleSheet } from 'react-native';
import V from '../ViewComponent';
import Text from '../TextComponent';
import { colors } from '../../constants/colors';

export default function IngredientRow({
  name,
  imageUrl,
  unit = 'G',
  qty,
  onChangeQty,
  onRemove,
}: {
  name: string;
  imageUrl?: string;
  unit?: string;
  qty: string;
  onChangeQty: (t: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <Image source={{ uri: imageUrl! }} style={styles.thumb} />
      <Text text={name} weight="semibold" style={{ flex: 1 }} />
      <TextInput
        style={[styles.input, { width: 80, marginRight: 4 }]}
        keyboardType="numeric"
        value={qty}
        onChangeText={onChangeQty}
      />
      <V style={styles.unitWrap}>
        <Text text={unit} weight="semibold" />
      </V>
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [styles.delBtn, pressed && { opacity: 0.85 }]}
        hitSlop={10}
      >
        <Text text="Xóa" color={colors.onPrimary} weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: colors.text,
    fontSize: 16,
  },
  unitWrap: {
    height: 44,
    minWidth: 40,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  delBtn: {
    marginLeft: 20,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

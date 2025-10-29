import React from 'react';
import { View, StyleSheet } from 'react-native';
import V from '../ViewComponent';
import Text from '../TextComponent';
import { colors } from '../../constants/colors';

export type Nutrition = {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  sugarMg: number;
};

export default function NutritionTable({
  title,
  data,
  style,
}: {
  title?: string;
  data: Nutrition;
  style?: any;
}) {
  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <Text text={`${label}:`} weight="semibold" />
      <Text text={value} weight="semibold" />
    </View>
  );

  const fmt = (n: number, d = 1) =>
    Number.isFinite(n) ? (Math.round(n * 10 ** d) / 10 ** d).toString() : '0';

  return (
    <V variant="card" style={[styles.wrap, style]}>
      {title ? (
        <Text text={title} weight="bold" style={{ marginBottom: 4 }} />
      ) : null}
      <Row label="Calo" value={`${fmt(data.kcal, 0)} kcal`} />
      <Row label="Protein" value={`${fmt(data.proteinG)} g`} />
      <Row label="Carbs" value={`${fmt(data.carbG)} g`} />
      <Row label="Fat" value={`${fmt(data.fatG)} g`} />
      <Row label="Chất xơ" value={`${fmt(data.fiberG)} g`} />
      <Row label="Natri" value={`${fmt(data.sodiumMg, 0)} mg`} />
      <Row label="Đường" value={`${fmt(data.sugarMg, 0)} mg`} />
    </V>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.bg,
    marginTop: 6,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
});

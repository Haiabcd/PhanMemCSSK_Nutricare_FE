import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';

export type TargetType = 'lose' | 'maintain' | 'gain';

const StepTargetScreen: React.FC = () => {
  const { form, updateForm } = useWizard();

  const options = React.useMemo(
    () => [
      {
        key: 'lose' as TargetType,
        title: 'Giảm cân',
        desc: 'Giảm mỡ thừa, đạt cân nặng lý tưởng',
        icon: '⬇️',
      },
      {
        key: 'gain' as TargetType,
        title: 'Tăng cân',
        desc: 'Tăng cân lành mạnh, cải thiện thể trạng',
        icon: '⬆️',
      },
      {
        key: 'maintain' as TargetType,
        title: 'Duy trì cân nặng',
        desc: 'Giữ cân nặng hiện tại, sống khỏe mạnh',
        icon: '⚖️',
      },
    ],
    [],
  );

  const onSelect = (key: TargetType) => {
    if (__DEV__) console.log('[Target] prev=', form.target, 'next=', key);
    updateForm({ target: key });
  };

  return (
    <WizardFrame
      title="Mục Tiêu Của Bạn?"
      subtitle="Chọn mục tiêu chính để chúng tôi đề xuất kế hoạch phù hợp"
    >
      <View style={styles.group}>
        {options.map(opt => {
          const selected = form.target === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.icon}>{opt.icon}</Text>
                <View style={styles.textContainer}>
                  <Text
                    style={[styles.title, selected && styles.titleSelected]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={[styles.desc, selected && styles.descSelected]}>
                    {opt.desc}
                  </Text>
                </View>
                {selected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </WizardFrame>
  );
};

const styles = StyleSheet.create({
  group: { width: '100%', gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.emerald50,
    shadowColor: colors.green,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: Platform.OS === 'ios' ? 0.9 : 1,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28 },
  textContainer: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600', color: colors.slate800 },
  titleSelected: { color: colors.emerald800, fontWeight: '700' },
  desc: { fontSize: 13.5, lineHeight: 18, color: colors.slate500 },
  descSelected: { color: colors.emerald700 },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
});

export default StepTargetScreen;

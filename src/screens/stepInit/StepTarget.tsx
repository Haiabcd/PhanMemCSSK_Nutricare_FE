import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import TextComponent from '../../components/TextComponent';
import ViewComponent from '../../components/ViewComponent';

export type TargetType = 'lose' | 'maintain' | 'gain';

const StepTargetScreen: React.FC = () => {
  const { form, updateForm } = useWizard();

  const options = React.useMemo(
    () => [
      {
        key: 'lose' as TargetType,
        title: 'Giảm cân',
        desc: 'Giảm mỡ thừa, đạt cân nặng lý tưởng',
        icon: '🔻',
      },
      {
        key: 'gain' as TargetType,
        title: 'Tăng cân',
        desc: 'Tăng cân lành mạnh, cải thiện thể trạng',
        icon: '🔺',
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
      <ViewComponent style={styles.group} gap={12}>
        {options.map(opt => {
          const selected = form.target === opt.key;

          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.pressableBase,
                pressed && styles.cardPressed,
              ]}
            >
              <ViewComponent
                variant="card"
                px={16}
                py={16}
                radius={16}
                style={[
                  styles.cardBase,
                  selected && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primarySurface,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.1,
                    elevation: 4,
                  },
                ]}
              >
                <ViewComponent row gap={12} alignItems="center">
                  <TextComponent text={opt.icon} size={28} />

                  <ViewComponent flex={1} gap={4}>
                    <TextComponent
                      text={opt.title}
                      variant="subtitle"
                      size={16}
                      color={selected ? colors.emerald800 : colors.slate800}
                      weight={selected ? 'bold' : 'semibold'}
                    />
                    <TextComponent
                      text={opt.desc}
                      variant="body"
                      size={13.5}
                      color={selected ? colors.emerald700 : colors.slate500}
                    />
                  </ViewComponent>

                  {selected && (
                    <ViewComponent
                      center
                      style={styles.selectedIndicator}
                      backgroundColor={colors.primary}
                    >
                      <TextComponent
                        text="✓"
                        color={colors.onPrimary}
                        size={14}
                        weight="bold"
                      />
                    </ViewComponent>
                  )}
                </ViewComponent>
              </ViewComponent>
            </Pressable>
          );
        })}
      </ViewComponent>
    </WizardFrame>
  );
};

const styles = StyleSheet.create({
  group: { width: '100%' },
  pressableBase: { borderRadius: 16 },
  cardBase: {
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    backgroundColor: colors.white,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: Platform.OS === 'ios' ? 0.9 : 1,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

export default StepTargetScreen;

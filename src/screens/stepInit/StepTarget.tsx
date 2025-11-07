import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import TextComponent from '../../components/TextComponent';
import ViewComponent from '../../components/ViewComponent';

export type TargetType = 'lose' | 'maintain' | 'gain';

const StepTargetScreen: React.FC = () => {
  const { form, updateForm } = useWizard();

  // ======== BMI + PHÂN LOẠI + GỢI Ý MỤC TIÊU ========
  const heightM = form.heightCm / 100;
  const bmi = form.weightKg / (heightM * heightM);

  const bmiCategory =
    bmi < 18.5
      ? 'Thiếu cân'
      : bmi < 25
      ? 'Bình thường'
      : bmi < 30
      ? 'Thừa cân'
      : 'Béo phì';

  // Đề xuất mục tiêu dựa theo BMI
  const recommended: TargetType =
    bmi < 18.5 ? 'gain' : bmi < 25 ? 'maintain' : 'lose';

  const recommendationText =
    recommended === 'gain'
      ? 'Bạn đang thiếu cân, ưu tiên nên TĂNG CÂN.'
      : recommended === 'maintain'
      ? 'BMI của bạn bình thường, phù hợp nhất là DUY TRÌ CÂN NẶNG.'
      : 'Bạn đang thừa cân, nên tập trung GIẢM CÂN.';

  // ✅ Tự động tick chọn mục tiêu được đề xuất ngay khi vào màn
  // (Nếu bạn muốn chỉ đặt một lần đầu, có thể thêm điều kiện !form.target)
  useEffect(() => {
    if (form.target !== recommended) {
      updateForm({ target: recommended });
    }
  }, [recommended]);

  // ================================================

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
    updateForm({ target: key });
  };

  return (
    <WizardFrame
      title="Mục Tiêu Của Bạn?"
      subtitle="Chọn mục tiêu chính để chúng tôi đề xuất kế hoạch phù hợp"
    >
      {/* ==== GỢI Ý TỪ BMI ==== */}
      {/* ==== GỢI Ý TỪ BMI ==== */}
      <ViewComponent
        p={16}
        radius={16}
        style={{
          backgroundColor: '#FFF7ED', // amber50
          borderWidth: 1.5,
          borderColor: '#FDBA74', // amber300
          marginBottom: 24,
          shadowColor: '#F97316', // amber500
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
        gap={10}
      >
        <TextComponent
          text={`📊 BMI của bạn: ${bmi.toFixed(1)} (${bmiCategory})`}
          size={15}
          weight="semibold"
          color="#EA580C" // amber600
        />

        <ViewComponent row gap={8} alignItems="flex-start">
          <TextComponent
            text={recommendationText}
            size={14}
            color="#C2410C"
            style={{ flex: 1 }}
          />
        </ViewComponent>
      </ViewComponent>

      {/* ==== CÁC LỰA CHỌN MỤC TIÊU ==== */}
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
                  },
                ]}
              >
                <ViewComponent row gap={12} alignItems="center">
                  <TextComponent text={opt.icon} size={28} />

                  <ViewComponent flex={1} gap={4}>
                    <TextComponent
                      text={opt.title}
                      size={16}
                      color={selected ? colors.emerald800 : colors.slate800}
                      weight={selected ? 'bold' : 'semibold'}
                    />
                    <TextComponent
                      text={opt.desc}
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

import React from 'react';
import { Pressable, Platform } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import View from '../../components/ViewComponent';
import Text from '../../components/TextComponent';

const StepGenderScreen = () => {
  const { form, updateForm } = useWizard();

  const options = [
    {
      key: 'male' as const,
      label: 'Nam',
      icon: '👨',
      description: 'Giới tính nam',
    },
    {
      key: 'female' as const,
      label: 'Nữ',
      icon: '👩',
      description: 'Giới tính nữ',
    },
    {
      key: 'other' as const,
      label: 'Khác',
      icon: '😊',
      description: 'Giới tính khác',
    },
  ];

  return (
    <WizardFrame
      title="Giới Tính Của Bạn?"
      subtitle="Hãy chọn giới tính phù hợp để chúng tôi cá nhân hóa trải nghiệm của bạn tốt hơn"
    >
      <View style={{ width: '100%' }} gap={12}>
        {options.map(opt => {
          const selected = form.gender === opt.key;

          return (
            <Pressable
              key={opt.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                updateForm({ gender: opt.key });
              }}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.99 : 1 }],
                opacity: Platform.OS === 'ios' && pressed ? 0.95 : 1,
              })}
            >
              <View
                variant="card"
                radius={16}
                px={16}
                py={16}
                row
                alignItems="center"
                gap={12}
                border
                borderColor={selected ? colors.primaryBorder : colors.border}
                backgroundColor={
                  selected ? colors.primarySurface : colors.white
                }
                style={[
                  // Viền đậm hơn khi chọn; unselected vẫn hơi dày để nổi khối
                  { borderWidth: selected ? 2 : 1.5 },
                  selected
                    ? Platform.select({
                        ios: {
                          shadowColor: colors.primary,
                          shadowOpacity: 0.12,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 4 },
                        },
                        android: { elevation: 5 },
                      })
                    : // Unselected: bóng rất nhẹ để không quá phẳng
                      Platform.select({
                        ios: {
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 2 },
                        },
                        android: { elevation: 2 },
                      }),
                ]}
              >
                {/* Icon */}
                <Text text={opt.icon} size={28} />

                {/* Texts */}
                <View flex={1} gap={2}>
                  <Text
                    text={opt.label}
                    variant="subtitle"
                    tone={selected ? 'primary' : 'default'}
                    weight="semibold"
                  />
                  <Text
                    text={opt.description}
                    variant="caption"
                    tone={selected ? 'primary' : 'muted'}
                  />
                </View>

                {/* Radio Indicator */}
                <View
                  alignItems="center"
                  justifyContent="center"
                  radius={11}
                  border
                  borderColor={selected ? colors.primary : colors.slate300}
                  backgroundColor={
                    selected ? colors.primarySurface : colors.white
                  }
                  style={[
                    { width: 22, height: 22 },
                    selected
                      ? Platform.select({
                          ios: {
                            shadowColor: colors.primary,
                            shadowOpacity: 0.18,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 2 },
                          },
                          android: { elevation: 4 },
                        })
                      : Platform.select({
                          ios: {
                            shadowColor: '#000',
                            shadowOpacity: 0.06,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 1 },
                          },
                          android: { elevation: 1 },
                        }),
                  ]}
                >
                  {selected ? (
                    <View
                      radius={5}
                      backgroundColor={colors.primary}
                      style={[
                        { width: 10, height: 10 },
                        Platform.select({
                          ios: {
                            shadowColor: colors.primaryDark,
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            shadowOffset: { width: 0, height: 1 },
                          },
                          android: { elevation: 2 },
                        }),
                      ]}
                    />
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </WizardFrame>
  );
};

export default StepGenderScreen;

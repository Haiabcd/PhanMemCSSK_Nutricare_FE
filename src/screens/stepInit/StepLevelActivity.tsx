import React from 'react';
import { Pressable, ScrollView, useWindowDimensions } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';

type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

const StepLevelActivityScreen = () => {
  const { form, updateForm } = useWizard();
  const { height, width } = useWindowDimensions();

  // Màn nhỏ thì giảm padding/size nhẹ để bớt tràn
  const isVerySmall = width < 360;
  const cardPad = isVerySmall ? 12 : 16;
  const iconSize = isVerySmall ? 20 : 24;
  const titleSize = isVerySmall ? 15 : 16;
  const descSize = isVerySmall ? 12.5 : 13.5;
  const descLineHeight = isVerySmall ? 17 : 18;

  // Vùng options cuộn độc lập: giới hạn tối đa ~55–60% chiều cao màn
  const optionsMaxHeight = Math.max(
    260,
    Math.floor(height * (isVerySmall ? 0.55 : 0.6)),
  );

  const options = React.useMemo(
    () => [
      {
        key: 'SEDENTARY' as ActivityLevel,
        title: 'Ít vận động',
        desc: 'Ít hoặc không tập luyện; công việc chủ yếu ngồi.',
        icon: '🛋️',
      },
      {
        key: 'LIGHTLY_ACTIVE' as ActivityLevel,
        title: 'Vận động nhẹ',
        desc: 'Tập luyện nhẹ 1–3 ngày/tuần hoặc di chuyển nhẹ nhàng.',
        icon: '🚶',
      },
      {
        key: 'MODERATELY_ACTIVE' as ActivityLevel,
        title: 'Vận động vừa phải',
        desc: 'Tập luyện vừa 3–5 ngày/tuần.',
        icon: '🏃',
      },
      {
        key: 'VERY_ACTIVE' as ActivityLevel,
        title: 'Vận động nhiều',
        desc: 'Tập luyện cường độ cao 6–7 ngày/tuần.',
        icon: '🏋️‍♂️',
      },
      {
        key: 'EXTRA_ACTIVE' as ActivityLevel,
        title: 'Vận động rất nhiều',
        desc: 'Công việc thể lực nặng hoặc tập 2 lần/ngày.',
        icon: '🔥',
      },
    ],
    [],
  );

  const onSelect = (key: ActivityLevel) => {
    updateForm({ activityLevel: key as any });
  };

  return (
    <WizardFrame
      title="Mức Độ Hoạt Động Của Bạn?"
      subtitle="Chia sẻ lối sống năng động của bạn để nhận kế hoạch dinh dưỡng được cá nhân hóa"
    >
      {/* Chỉ khối options cuộn khi dài; layout dọc giữ nguyên */}
      <ScrollView
        style={{ width: '100%', maxHeight: optionsMaxHeight }}
        contentContainerStyle={{ paddingBottom: 4, gap: 12 }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {options.map(opt => {
          const selected = form.activityLevel === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
            >
              <ViewComponent
                variant="none"
                backgroundColor={selected ? colors.emerald50 : colors.white}
                border
                borderColor={selected ? colors.green : colors.slate100}
                radius={16}
                p={cardPad}
                style={{
                  borderWidth: 1.5,
                  shadowColor: selected ? colors.green : '#000',
                  shadowOpacity: selected ? 0.1 : 0.05,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: selected ? 4 : 3,
                }}
              >
                <ViewComponent
                  row
                  alignItems="flex-start"
                  gap={12}
                  style={{ minWidth: 0 }}
                >
                  <TextComponent
                    text={opt.icon}
                    size={iconSize}
                    style={{ marginTop: isVerySmall ? 1 : 2 }}
                  />

                  <ViewComponent flex={1} gap={4} style={{ minWidth: 0 }}>
                    <TextComponent
                      text={opt.title}
                      size={titleSize}
                      weight={selected ? 'bold' : 'semibold'}
                      color={selected ? colors.emerald800 : colors.slate800}
                      style={{ letterSpacing: 0.15 }}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    />
                    <TextComponent
                      text={opt.desc}
                      size={descSize}
                      weight="regular"
                      color={selected ? colors.emerald800 : colors.slate500}
                      style={{ lineHeight: descLineHeight }}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    />
                  </ViewComponent>

                  {selected && (
                    <ViewComponent
                      backgroundColor={colors.green}
                      radius={12}
                      center
                      style={{
                        width: 24,
                        height: 24,
                        marginLeft: 6,
                        flexShrink: 0,
                      }}
                    >
                      <TextComponent
                        text="✓"
                        size={14}
                        weight="bold"
                        color={colors.white}
                      />
                    </ViewComponent>
                  )}
                </ViewComponent>
              </ViewComponent>
            </Pressable>
          );
        })}
      </ScrollView>
    </WizardFrame>
  );
};

export default StepLevelActivityScreen;
